import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || '';

const SMTP_HOST = process.env.SMTP_HOST?.trim() || '';
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || '', 10) || 587;
const SMTP_SECURE =
  process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1' ||
  SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER?.trim() || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM_EMAIL =
  process.env.SMTP_FROM_EMAIL?.trim() || SMTP_USER;
const SMTP_FROM_NAME =
  process.env.SMTP_FROM_NAME?.trim() || 'KC Computer Club';

const SMTP_CONFIGURED = Boolean(SMTP_HOST && SMTP_FROM_EMAIL);
const RESEND_CONFIGURED = Boolean(RESEND_API_KEY && RESEND_FROM_EMAIL);

export type ResetEmailProvider = 'smtp' | 'resend';

export const EMAIL_CONFIG_HINT =
  'SMTP_HOST / SMTP_FROM_EMAIL（或 RESEND_API_KEY / RESEND_FROM_EMAIL）';

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * Resolve the public site URL used in reset emails.
 *
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL (explicit, recommended)
 * 2. Vercel's production / deployment hostname
 * 3. The incoming request's forwarded host
 * 4. localhost for local development
 */
export function getAppUrl(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return stripTrailingSlashes(configured);

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) {
    return `https://${stripTrailingSlashes(vercelHost.trim())}`;
  }

  if (request) {
    const forwardedHost = request.headers
      .get('x-forwarded-host')
      ?.split(',')[0]
      ?.trim();
    const host = forwardedHost || request.headers.get('host')?.trim();
    if (host) {
      const forwardedProto = request.headers
        .get('x-forwarded-proto')
        ?.split(',')[0]
        ?.trim();
      const protocol =
        forwardedProto || (host.startsWith('localhost') ? 'http' : 'https');
      return `${protocol}://${host}`;
    }
  }

  return 'http://localhost:3000';
}

export type ResetAudience = 'student' | 'admin';

/**
 * SMTP takes priority because it works with any mail host and needs no
 * third-party account. Resend stays available for deployments that already
 * use it, but it is entirely optional.
 */
export function getResetEmailProvider(): ResetEmailProvider | null {
  if (SMTP_CONFIGURED) return 'smtp';
  if (RESEND_CONFIGURED) return 'resend';
  return null;
}

export function isResetEmailConfigured(): boolean {
  return getResetEmailProvider() !== null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface SendPasswordResetEmailOptions {
  to: string;
  displayName?: string | null;
  resetLink: string;
  audience?: ResetAudience;
  appUrl?: string;
}

/**
 * Sends the shared password-reset email for both students and administrators.
 * Returns ok:false when the mail provider is missing or rejects the message so
 * callers can keep their public response generic and avoid account discovery.
 */
export async function sendPasswordResetEmail({
  to,
  displayName,
  resetLink,
  audience = 'student',
  appUrl,
}: SendPasswordResetEmailOptions): Promise<{ ok: boolean }> {
  const provider = getResetEmailProvider();
  if (!provider) {
    return { ok: false };
  }

  const isAdmin = audience === 'admin';
  const loginPath = isAdmin ? '/admin/login' : '/auth/login';
  const baseUrl = stripTrailingSlashes(appUrl?.trim() || getAppUrl());
  const safeName = escapeHtml(
    displayName?.trim() || (isAdmin ? '管理员' : '同学')
  );
  const safeLink = escapeHtml(resetLink);
  const subject = isAdmin
    ? '电脑学会 - 管理员密码重置请求'
    : '电脑学会 - 密码重置请求';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .logo { text-align: center; margin-bottom: 24px; }
          .logo-icon { font-size: 48px; margin-bottom: 8px; }
          .logo-text { font-size: 24px; font-weight: bold; color: #13ec80; }
          .content { margin-bottom: 24px; }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #111814;
          }
          .message { margin-bottom: 16px; color: #666; }
          .reset-button {
            display: inline-block;
            background-color: #13ec80;
            color: #102219;
            padding: 12px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 16px;
            margin-bottom: 24px;
          }
          .reset-button:hover { background-color: #0fd673; }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 16px;
            border-radius: 4px;
            margin-top: 20px;
            font-size: 14px;
            color: #856404;
          }
          .footer {
            border-top: 1px solid #e5e5e5;
            padding-top: 16px;
            margin-top: 24px;
            font-size: 13px;
            color: #999;
            text-align: center;
          }
          .verification-code {
            background-color: #f0f0f0;
            padding: 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
            color: #666;
            margin-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <div class="logo-icon">🖥️</div>
            <div class="logo-text">电脑学会</div>
          </div>
          <div class="content">
            <div class="greeting">嗨，${safeName}！</div>
            <div class="message">
              我们收到了您的${isAdmin ? '管理员账户' : ''}密码重置请求。请点击下方按钮来重置您的密码。此链接将在 <strong>24 小时</strong>后过期。
            </div>
            <a href="${safeLink}" class="reset-button">重置密码</a>
            <div class="message" style="font-size: 14px; margin-top: 20px;">
              如果上面的按钮不可点击，请复制下面的链接到浏览器地址栏：
            </div>
            <div class="verification-code">${safeLink}</div>
            <div class="warning">
              <strong>⚠️ 安全提示：</strong> 如果您没有请求重置密码，请忽略此邮件。您的账户是安全的。
            </div>
          </div>
          <div class="footer">
            <p>
              这是一封自动生成的邮件，请勿直接回复。<br>
              登录入口：<a href="${baseUrl}${loginPath}" style="color: #13ec80; text-decoration: none;">${baseUrl}${loginPath}</a><br>
              如有问题，请通过官网联系我们：<a href="${baseUrl}/about" style="color: #13ec80; text-decoration: none;">联系我们</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const plainName =
    displayName?.trim() || (isAdmin ? '管理员' : '同学');
  const text = [
    `嗨，${plainName}！`,
    '',
    `我们收到了您的${isAdmin ? '管理员账户' : ''}密码重置请求。请打开下面的链接重置密码。此链接将在 24 小时后过期。`,
    '',
    resetLink,
    '',
    '如果您没有请求重置密码，请忽略此邮件，您的账户是安全的。',
    '',
    `登录入口：${baseUrl}${loginPath}`,
    `联系我们：${baseUrl}/about`,
    '',
    '这是一封自动生成的邮件，请勿直接回复。',
  ].join('\n');

  try {
    if (provider === 'smtp') {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: SMTP_USER
          ? { user: SMTP_USER, pass: SMTP_PASS }
          : undefined,
      });
      await transporter.sendMail({
        from: { name: SMTP_FROM_NAME, address: SMTP_FROM_EMAIL },
        to,
        subject,
        text,
        html,
      });
      return { ok: true };
    }

    const resend = new Resend(RESEND_API_KEY);
    const result = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });
    if (result.error) {
      console.error('邮件发送失败 (resend):', result.error);
      return { ok: false };
    }
    return { ok: true };
  } catch (error) {
    console.error(`邮件发送异常 (${provider}):`, error);
    return { ok: false };
  }
}
