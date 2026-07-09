import { NextRequest, NextResponse } from 'next/server';

const INSTAGRAM_POST_PATTERN = /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?(\?.*)?$/;

/**
 * Extract images + caption from an Instagram post URL.
 *
 * Strategy (in priority order):
 *   1. Facebook oEmbed API (requires FACEBOOK_OEMBED_TOKEN env var — free, official)
 *   2. HTML scraping for og: meta tags (fallback — works when IG serves SSR)
 *
 * Instagram now serves a pure client-side SPA with no server-rendered content,
 * so method 2 rarely works. For full multi-image carousel support, set up
 * the Facebook oEmbed token (see README / error message for instructions).
 */

/* ─── helpers ─── */

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#34;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\\n/g, '\n');
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]);
  }
  return null;
}

function extractShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/);
  return m?.[2] ?? null;
}

/* ─── strategies ─── */

/** Strategy 1: Facebook oEmbed API (official, reliable) */
async function tryOEmbed(postUrl: string): Promise<{
  images: string[];
  caption: string;
  title: string;
} | null> {
  const token = process.env.FACEBOOK_OEMBED_TOKEN;
  if (!token) return null;

  try {
    const apiUrl = `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(postUrl)}&omitscript=true&access_token=${token}`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;

    const data = await res.json() as {
      thumbnail_url?: string;
      author_name?: string;
      title?: string;
      html?: string;
    };

    const images: string[] = [];
    if (data.thumbnail_url) {
      images.push(data.thumbnail_url);
    }

    // Try to extract image from the oEmbed HTML (it often contains an <img> tag)
    if (data.html) {
      const imgMatches = data.html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
      for (const m of imgMatches) {
        if (m[1] && !m[1].includes('instagram.com') && !m[1].includes('static.') && !images.includes(m[1])) {
          images.push(m[1]);
        }
      }
    }

    if (images.length === 0) return null;

    return {
      images,
      caption: data.title || '',
      title: data.author_name || '',
    };
  } catch {
    return null;
  }
}

/** Strategy 2: HTML scraping (og: meta tags — works when IG serves SSR) */
async function tryHtmlScrape(postUrl: string): Promise<{
  images: string[];
  caption: string;
  title: string;
} | null> {
  try {
    const res = await fetch(postUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const images: string[] = [];

    // Try JSON-LD embedded data
    try {
      const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
      for (const match of jsonLdMatches) {
        try {
          const data = JSON.parse(match[1]);
          const extractImages = (obj: unknown): void => {
            if (!obj || typeof obj !== 'object') return;
            const record = obj as Record<string, unknown>;
            if (typeof record.contentUrl === 'string' && record.contentUrl.includes('cdninstagram.com')) {
              images.push(record.contentUrl);
            }
            if (typeof record.url === 'string' && record.url.includes('cdninstagram.com') && /\.(jpg|jpeg|png|webp)/i.test(record.url)) {
              images.push(record.url);
            }
            if (Array.isArray(record)) {
              for (const item of record) extractImages(item);
            } else {
              for (const val of Object.values(record)) extractImages(val);
            }
          };
          extractImages(data);
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }

    // Try script blocks for cdninstagram URLs
    if (images.length === 0) {
      try {
        const scriptBlocks = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        for (const match of scriptBlocks) {
          const block = match[1];
          const urlPattern = /https?:\/\/(?:scontent|scontent[\w.-]*)\.cdninstagram\.com\/[^"'\\]+\.(?:jpg|jpeg|png|webp)[^"'\\]*/gi;
          const found = block.match(urlPattern);
          if (found) {
            const unique = [...new Set(found)];
            for (const url of unique) {
              if (/\/e\d+\//i.test(url) || /\/s\d+x\d+\//i.test(url) || /\/v\/t\d+\./i.test(url)) {
                const cleanUrl = url.replace(/\\u0026/g, '&').replace(/\\/g, '');
                if (!images.includes(cleanUrl)) images.push(cleanUrl);
              }
            }
          }
        }
      } catch { /* ignore */ }
    }

    // Fallback to og:image
    const ogImage = extractMeta(html, 'og:image');
    if (images.length === 0 && ogImage) {
      images.push(ogImage);
    }

    // Extract caption/title
    let caption = '';
    let title = '';
    const rawDescription = extractMeta(html, 'og:description');
    const rawTitle = extractMeta(html, 'og:title');
    if (rawDescription) {
      const colonIdx = rawDescription.indexOf(': "');
      caption = colonIdx !== -1
        ? rawDescription.slice(colonIdx + 3).replace(/"\s*$/, '').trim()
        : rawDescription.trim();
    }
    if (rawTitle) {
      title = rawTitle.replace(/^Photo (shared )?by /, '').replace(/ on Instagram.*$/, '').trim();
    }

    if (images.length === 0 && !caption) return null;
    return { images: [...new Set(images)], caption, title };
  } catch {
    return null;
  }
}

/* ─── main handler ─── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: '请提供 Instagram 帖子链接' }, { status: 400 });
    }

    const trimmedUrl = url.trim();
    if (!INSTAGRAM_POST_PATTERN.test(trimmedUrl)) {
      return NextResponse.json(
        { success: false, error: '请输入有效的 Instagram 帖子链接（格式：https://www.instagram.com/p/...）' },
        { status: 400 },
      );
    }

    const shortcode = extractShortcode(trimmedUrl);

    // Strategy 1: oEmbed API (if token configured)
    const oembed = await tryOEmbed(trimmedUrl);
    if (oembed && oembed.images.length > 0) {
      return NextResponse.json({
        success: true,
        image: oembed.images[0] ?? null,
        images: oembed.images,
        caption: oembed.caption,
        title: oembed.title,
        sourceUrl: trimmedUrl,
      });
    }

    // Strategy 2: HTML scraping
    const scraped = await tryHtmlScrape(trimmedUrl);
    if (scraped && scraped.images.length > 0) {
      return NextResponse.json({
        success: true,
        image: scraped.images[0] ?? null,
        images: scraped.images,
        caption: scraped.caption,
        title: scraped.title,
        sourceUrl: trimmedUrl,
      });
    }

    // Neither strategy worked — return a helpful error
    const hasToken = !!process.env.FACEBOOK_OEMBED_TOKEN;

    return NextResponse.json(
      {
        success: false,
        error: hasToken
          ? '无法获取该 Instagram 帖子的内容。该帖子可能是私人账号、已被删除，或 Instagram 服务暂时不可用。请手动复制图片和文字。'
          : 'Instagram 现已屏蔽网页抓取。要启用自动导入，请配置 Facebook oEmbed API（在 .env 中设置 FACEBOOK_OEMBED_TOKEN）。目前请手动从 Instagram 复制图片和说明文字粘贴到下方。',
        hint: hasToken ? undefined : 'setup_required',
        shortcode: shortcode ?? undefined,
      },
      { status: 422 },
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[import-instagram] error:', error);
    return NextResponse.json({ success: false, error: error.message || '导入失败' }, { status: 500 });
  }
}
