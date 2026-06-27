import { NextRequest, NextResponse } from 'next/server';
const INSTAGRAM_POST_PATTERN = /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?(\?.*)?$/;
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
        { status: 400 }
      );
    }
    let html: string;
    try {
      const res = await fetch(trimmedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        if (res.status === 404) {
          return NextResponse.json({ success: false, error: '找不到该 Instagram 帖子，请检查链接是否正确' }, { status: 404 });
        }
        if (res.status === 401 || res.status === 403) {
          return NextResponse.json({ success: false, error: '该 Instagram 帖子需要登录才能查看（仅限私人账号）' }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: `无法获取帖子内容（HTTP ${res.status}）` }, { status: 502 });
      }
      html = await res.text();
    } catch (fetchErr: unknown) {
      const err = fetchErr as { name?: string };
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return NextResponse.json({ success: false, error: '获取 Instagram 内容超时，请重试' }, { status: 504 });
      }
      return NextResponse.json({ success: false, error: '无法连接到 Instagram，请检查网络' }, { status: 502 });
    }
    const image = extractMeta(html, 'og:image');
    const rawDescription = extractMeta(html, 'og:description');
    const rawTitle = extractMeta(html, 'og:title');
    let caption = '';
    if (rawDescription) {
      const colonIdx = rawDescription.indexOf(': "');
      if (colonIdx !== -1) {
        caption = rawDescription.slice(colonIdx + 3).replace(/"\s*$/, '').trim();
      } else {
        caption = rawDescription.trim();
      }
    }
    let title = '';
    if (rawTitle) {
      title = rawTitle.replace(/^Photo (shared )?by /, '').replace(/ on Instagram.*$/, '').trim();
    }
    if (!image && !caption) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Instagram 未返回帖子内容。该帖子可能是私人账号，或 Instagram 需要登录才能访问。请手动复制图片和说明文字。',
        },
        { status: 422 }
      );
    }
    return NextResponse.json({
      success: true,
      image: image ?? null,
      caption,
      title,
      sourceUrl: trimmedUrl,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[import-instagram] error:', error);
    return NextResponse.json({ success: false, error: error.message || '导入失败' }, { status: 500 });
  }
}