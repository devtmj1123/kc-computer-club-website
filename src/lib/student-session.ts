import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const STUDENT_SESSION_COOKIE = 'kc_student_session';
const STUDENT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface StudentSessionPayload {
  sub: string;
  email: string;
  studentId: string;
  name: string;
  role: 'student';
  iat: number;
  exp: number;
}

export interface StudentSessionIdentity {
  id: string;
  email: string;
  studentId?: string;
  name?: string;
}

function getSessionSecret(): string {
  return (
    process.env.STUDENT_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    ''
  );
}

export function isStudentSessionConfigured(): boolean {
  return getSessionSecret().length > 0;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function getCookieValue(
  request: Request | NextRequest,
  name: string
): string | null {
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

export function createStudentSessionToken(
  student: StudentSessionIdentity
): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('学生会话密钥未配置');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: StudentSessionPayload = {
    sub: student.id,
    email: student.email.toLowerCase(),
    studentId: student.studentId || '',
    name: student.name || '',
    role: 'student',
    iat: now,
    exp: now + STUDENT_SESSION_TTL_SECONDS,
  };

  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadPart)
    .digest('base64url');

  return `${payloadPart}.${signature}`;
}

export function verifyStudentSessionToken(
  token: string
): StudentSessionPayload | null {
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
    !crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signaturePart)
    )
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(payloadPart)
    ) as StudentSessionPayload;

    if (
      !payload ||
      payload.role !== 'student' ||
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
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

export function getStudentSession(
  request: Request | NextRequest
): StudentSessionPayload | null {
  const token = getCookieValue(request, STUDENT_SESSION_COOKIE);
  if (!token) return null;
  return verifyStudentSessionToken(token);
}

export function requireStudentSession(
  request: Request | NextRequest
): NextResponse | null {
  const session = getStudentSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: '请先登录学生账号' },
      { status: 401 }
    );
  }

  return null;
}

export function setStudentSessionCookie(
  response: NextResponse,
  student: StudentSessionIdentity
): NextResponse {
  const token = createStudentSessionToken(student);
  response.cookies.set(STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: STUDENT_SESSION_TTL_SECONDS,
  });

  return response;
}

export function clearStudentSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(STUDENT_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}
