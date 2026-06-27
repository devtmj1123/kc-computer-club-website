import { NextResponse } from 'next/server';
import { serverDatabases, Query } from '@/services/appwrite-server';
import { Resend } from 'resend';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    if (!email) {
      return NextResponse.json(
        { error: '请提供邮箱地址' },
        { status: 400 }
      );
    }
    const emailRegex = /^\d{5,6}@kuencheng\.edu\.my$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '邮箱格式错误' },
        { status: 400 }
      );
    }
    const userRecords = await serverDatabases.listDocuments(
      APPWRITE_DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('email', email.toLowerCase().trim())]
    );
    if (userRecords.documents.length === 0) {
      return NextResponse.json({
        success: true,
        message: '如果该邮箱已注册，重置请求已提交。请检查邮件（包括垃圾邮件文件夹）',
      });
    }
    const user = userRecords.documents[0];
    const userId = user.$id;
    const resetToken = Buffer.from(
      JSON.stringify({
        userId,
        email: email.toLowerCase(),
        timestamp: Date.now(),
      })
    ).toString('base64');
    const resetLink = `${APP_URL}/auth/reset-password?token=${resetToken}`;
    if (resend) {
      try {
        const result = await resend.emails.send({
          from: 'noreply@computerclub.school.my',
          to: email.toLowerCase(),
          subject: '电脑学会 - 密码重置请求',
          html: `
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
                  .logo {
                    text-align: center;
                    margin-bottom: 24px;
                  }
                  .logo-icon {
                    font-size: 48px;
                    margin-bottom: 8px;
                  }
                  .logo-text {
                    font-size: 24px;
                    font-weight: bold;
                    color: #13ec80;
                  }
                  .content {
                    margin-bottom: 24px;
                  }
                  .greeting {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 16px;
                    color: #111814;
                  }
                  .message {
                    margin-bottom: 16px;
                    color: #666;
                  }
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
                  .reset-button:hover {
                    background-color: #0fd673;
                  }
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
                    <div class="greeting">嗨，${user.name}！</div>
                    <div class="message">
                      我们收到了您的密码重置请求。请点击下方按钮来重置您的密码。此链接将在 <strong>24 小时</strong>后过期。
                    </div>
                    <a href="${resetLink}" class="reset-button">重置密码</a>
                    <div class="message" style="font-size: 14px; margin-top: 20px;">
                      如果上面的按钮不可点击，请复制下面的链接到浏览器地址栏：
                    </div>
                    <div class="verification-code">${resetLink}</div>
                    <div class="warning">
                      <strong>⚠️ 安全提示：</strong> 如果您没有请求重置密码，请忽略此邮件。您的账户是安全的。
                    </div>
                  </div>
                  <div class="footer">
                    <p>
                      这是一封自动生成的邮件，请勿直接回复。<br>
                      如有问题，请通过官网联系我们：<a href="${APP_URL}/about" style="color: #13ec80; text-decoration: none;">联系我们</a>
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
        if (result.error) {
          console.error('邮件发送失败:', result.error);
          return NextResponse.json({
            success: true,
            message: '密码重置请求已提交。请检查邮件（包括垃圾邮件文件夹）',
          });
        }
        console.log(`密码重置邮件已发送: ${email} (用户ID: ${userId})`);
      } catch (emailError) {
        console.error('邮件发送异常:', emailError);
        return NextResponse.json({
          success: true,
          message: '密码重置请求已提交。请检查邮件',
        });
      }
    } else {
      console.warn('RESEND_API_KEY 未配置，跳过邮件发送');
      console.log(`[模拟] 密码重置邮件已发送到: ${email} (用户ID: ${userId})`);
      console.log(`[模拟] 重置链接: ${resetLink}`);
    }
    return NextResponse.json({
      success: true,
      message: '密码重置请求已提交。请检查邮件（包括垃圾邮件文件夹）',
    });
  } catch (error) {
    console.error('忘记密码 API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}