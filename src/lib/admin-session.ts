import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'kc_admin_session';
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface AdminSessionPayload {
  sub: string;
  username: string;
  role: 'admin';
  iat: number;
  exp: number;
}

interface AdminIdentity {
  id: string;
  username: string;
}

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || '';
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function getCookieValue(request: Request | NextRequest, name: string): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rawValueParts] = part.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rawValueParts.join('='));
    }
  }

  return null;
}

export function createAdminSessionToken(admin: AdminIdentity): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('管理员会话密钥未配置');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    sub: admin.id,
    username: admin.username,
    role: 'admin',
    iat: now,
    exp: now + ADMIN_SESSION_TTL_SECONDS,
  };

  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadPart)
    .digest('base64url');

  return `${payloadPart}.${signature}`;
}

export function verifyAdminSessionToken(token: string): AdminSessionPayload | null {
  const secret = getSessionSecret();
  if (!secret || !token) return null;

  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return null;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadPart)
    .digest('base64url');

  if (
    expectedSignature.length !== signaturePart.length ||
    !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signaturePart))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadPart)) as AdminSessionPayload;
    if (
      !payload ||
      payload.role !== 'admin' ||
      typeof payload.sub !== 'string' ||
      typeof payload.username !== 'string' ||
      typeof payload.exp !== 'number' ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getAdminSession(request: Request | NextRequest): AdminSessionPayload | null {
  const token = getCookieValue(request, ADMIN_SESSION_COOKIE);
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export function requireAdminSession(request: Request | NextRequest): NextResponse | null {
  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
  }

  return null;
}

export function setAdminSessionCookie(response: NextResponse, admin: AdminIdentity): NextResponse {
  const token = createAdminSessionToken(admin);
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });

  return response;
}

export function clearAdminSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}