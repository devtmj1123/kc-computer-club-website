import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'noreply@computerclub.school.my';
const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

export type ResetAudience = 'student' | 'admin';

export function getAppUrl(): string {
  return APP_URL;
}

export function isResetEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
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
}: SendPasswordResetEmailOptions): Promise<{ ok: boolean }> {
  if (!RESEND_API_KEY) {
    return { ok: false };
  }

  const resend = new Resend(RESEND_API_KEY);
  const isAdmin = audience === 'admin';
  const loginPath = isAdmin ? '/admin/login' : '/auth/login';
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
              登录入口：<a href="${APP_URL}${loginPath}" style="color: #13ec80; text-decoration: none;">${APP_URL}${loginPath}</a><br>
              如有问题，请通过官网联系我们：<a href="${APP_URL}/about" style="color: #13ec80; text-decoration: none;">联系我们</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const result = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to,
      subject,
      html,
    });
    if (result.error) {
      console.error('邮件发送失败:', result.error);
      return { ok: false };
    }
    return { ok: true };
  } catch (error) {
    console.error('邮件发送异常:', error);
    return { ok: false };
  }
}
