import crypto from 'crypto';

const RESET_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export type ResetTokenType = 'student' | 'admin';

export interface ResetTokenData {
  userId: string;
  /**
   * Student accounts bind this to the school email. Admin accounts bind it to
   * the recovery_email stored on the profile, never the internal auth email.
   */
  email: string;
  timestamp: number;
  type: ResetTokenType;
}

export type ResetTokenResult =
  | { ok: true; data: ResetTokenData }
  | { ok: false; error: string };

function getSecret(): string | null {
  const secret =
    process.env.RESET_TOKEN_SECRET || process.env.ADMIN_SESSION_SECRET || '';
  return secret || null;
}

export function isResetTokenConfigured(): boolean {
  return getSecret() !== null;
}

export function createResetToken(data: ResetTokenData): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const payload = JSON.stringify(data);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return Buffer.from(JSON.stringify({ data: payload, signature })).toString(
    'base64'
  );
}

export function verifyResetToken(token: string): ResetTokenResult {
  const secret = getSecret();
  if (!secret) {
    return { ok: false, error: '密码重置功能未配置' };
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded) as {
      data?: unknown;
      signature?: unknown;
    };

    if (typeof parsed.data !== 'string' || typeof parsed.signature !== 'string') {
      return { ok: false, error: '无效的重置链接' };
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(parsed.data)
      .digest('hex');

    const provided = Buffer.from(parsed.signature, 'utf8');
    const expected = Buffer.from(expectedSignature, 'utf8');
    if (
      provided.length !== expected.length ||
      !crypto.timingSafeEqual(provided, expected)
    ) {
      return { ok: false, error: '无效的重置链接' };
    }

    const data = JSON.parse(parsed.data) as Partial<ResetTokenData>;
    if (!data.userId || !data.email || !data.timestamp) {
      return { ok: false, error: '无效的重置链接' };
    }

    if (Date.now() - data.timestamp > RESET_TOKEN_EXPIRY_MS) {
      return { ok: false, error: '重置链接已过期。请重新申请。' };
    }

    return {
      ok: true,
      data: {
        userId: data.userId,
        email: data.email,
        timestamp: data.timestamp,
        type: data.type === 'admin' ? 'admin' : 'student',
      },
    };
  } catch {
    return { ok: false, error: '无效的重置链接' };
  }
}
