import { NextResponse } from 'next/server';
import { serverDatabases } from '@/services/appwrite-server';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const COLLECTION_ID = 'clubSettings';
export async function POST() {
  const results: { key: string; status: string }[] = [];
  const newStringAttrs = [
    { key: 'attendanceCode1', size: 16 },
    { key: 'attendanceCode2', size: 16 },
  ];
  for (const attr of newStringAttrs) {
    try {
      await (serverDatabases as unknown as {
        createStringAttribute: (
          dbId: string,
          collId: string,
          key: string,
          size: number,
          required: boolean
        ) => Promise<unknown>;
      }).createStringAttribute(APPWRITE_DATABASE_ID, COLLECTION_ID, attr.key, attr.size, false);
      results.push({ key: attr.key, status: 'created' });
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message?.includes('already exist')) {
        results.push({ key: attr.key, status: 'already exists' });
      } else {
        results.push({ key: attr.key, status: `error: ${err.message}` });
      }
    }
  }
  try {
    await (serverDatabases as unknown as {
      createIntegerAttribute: (
        dbId: string,
        collId: string,
        key: string,
        required: boolean
      ) => Promise<unknown>;
    }).createIntegerAttribute(APPWRITE_DATABASE_ID, COLLECTION_ID, 'attendanceCodesWeek', false);
    results.push({ key: 'attendanceCodesWeek', status: 'created' });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message?.includes('already exist')) {
      results.push({ key: 'attendanceCodesWeek', status: 'already exists' });
    } else {
      results.push({ key: 'attendanceCodesWeek', status: `error: ${err.message}` });
    }
  }
  const hasErrors = results.some(r => r.status.startsWith('error'));
  return NextResponse.json(
    {
      success: !hasErrors,
      message: hasErrors
        ? '部分属性添加失败，请检查日志'
        : '所有验证码属性已添加/确认存在',
      results,
    },
    { status: hasErrors ? 500 : 200 }
  );
}