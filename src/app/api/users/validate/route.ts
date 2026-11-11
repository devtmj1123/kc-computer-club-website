import { NextRequest, NextResponse } from 'next/server';
import { normalizeEmail } from '@/lib/student-identity';
import { getStudentSession } from '@/lib/student-session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
} from '@/lib/rate-limit';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findExistingEmails(emails: string[]): Promise<Set<string>> {
  if (emails.length === 0) return new Set();

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('email')
    .in('email', emails)
    .eq('role', 'student')
    .eq('is_active', true);

  if (error) {
    throw new Error(error.message);
  }

  return new Set(
    (data ?? []).map((profile) => String(profile.email).toLowerCase())
  );
}

export async function POST(request: NextRequest) {
  const session = getStudentSession(request);
  if (!session) {
    return NextResponse.json(
      { error: '请先登录学生账号' },
      { status: 401 }
    );
  }

  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`users-validate:${ip}:${session.sub}`, 60, 60 * 1000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfter);
    }

    const body = await request.json();

    if (Array.isArray(body.emails)) {
      const emails = Array.from(
        new Set(
          body.emails
            .map((value: unknown) => normalizeEmail(value))
            .filter((value: string) => EMAIL_PATTERN.test(value))
        )
      ) as string[];

      if (emails.length === 0) {
        return NextResponse.json(
          { error: '请提供有效的邮箱地址' },
          { status: 400 }
        );
      }

      const existing = await findExistingEmails(emails);
      const missingEmails = emails.filter((email) => !existing.has(email));

      return NextResponse.json({
        allValid: missingEmails.length === 0,
        missingEmails,
      });
    }

    const email = normalizeEmail(body.email);
    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { exists: false, error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // Deliberately do not return the matched user's name, email or id.
    // Callers only need to know whether the account exists.
    const existing = await findExistingEmails([email]);
    return NextResponse.json({
      exists: existing.has(email),
    });
  } catch (error) {
    console.error('验证用户失败:', error);
    return NextResponse.json(
      { error: '验证用户时发生错误' },
      { status: 500 }
    );
  }
}
