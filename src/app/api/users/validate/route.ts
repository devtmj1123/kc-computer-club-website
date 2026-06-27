import { NextRequest, NextResponse } from 'next/server';
import { databases } from '@/services/appwrite';
import { Query } from 'appwrite';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION || '';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.email) {
      const email = body.email.toLowerCase().trim();
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal('email', email), Query.limit(1)]
      );
      if (response.documents.length > 0) {
        const user = response.documents[0];
        return NextResponse.json({
          exists: true,
          user: {
            id: user.$id,
            name: user.name,
            email: user.email,
          }
        });
      } else {
        return NextResponse.json({
          exists: false,
          message: `用户 ${email} 未在系统中注册`
        });
      }
    } else if (body.emails && Array.isArray(body.emails)) {
      const emails = body.emails.map((e: string) => e.toLowerCase().trim());
      const results: Record<string, { exists: boolean; user?: { id: string; name: string; email: string }; message?: string }> = {};
      for (const email of emails) {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          USERS_COLLECTION_ID,
          [Query.equal('email', email), Query.limit(1)]
        );
        if (response.documents.length > 0) {
          const user = response.documents[0];
          results[email] = {
            exists: true,
            user: {
              id: user.$id,
              name: user.name,
              email: user.email,
            }
          };
        } else {
          results[email] = {
            exists: false,
            message: `用户 ${email} 未在系统中注册`
          };
        }
      }
      const allExist = Object.values(results).every(r => r.exists);
      const missingEmails = Object.entries(results)
        .filter(([, r]) => !r.exists)
        .map(([email]) => email);
      return NextResponse.json({
        allValid: allExist,
        results,
        missingEmails,
      });
    } else {
      return NextResponse.json(
        { error: '请提供 email 或 emails 参数' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('验证用户失败:', error);
    return NextResponse.json(
      { error: '验证用户时发生错误' },
      { status: 500 }
    );
  }
}