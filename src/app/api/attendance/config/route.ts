import { NextRequest, NextResponse } from 'next/server';
import {
  AttendanceConfig,
  getAttendanceConfigState,
  saveAttendanceConfig,
} from '@/services/attendance.service';
import { getAdminSession, requireAdminSession } from '@/lib/admin-session';

export async function GET() {
  try {
    const state = await getAttendanceConfigState();
    return NextResponse.json({
      success: true,
      config: state.config,
      source: state.row ? 'database' : 'default',
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('[AttendanceConfig] 获取配置失败:', err.message);
    return NextResponse.json(
      {
        error: '获取点名配置失败',
        message: err.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  const session = getAdminSession(request);

  try {
    const body = await request.json();
    const config: Partial<AttendanceConfig> = body.config || body;
    const saved = await saveAttendanceConfig(config, session?.sub);

    return NextResponse.json({
      success: true,
      config: saved,
      message: '点名配置已保存',
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('[AttendanceConfig] 保存配置失败:', err.message);
    return NextResponse.json(
      { error: '保存点名配置失败', message: err.message },
      { status: 500 }
    );
  }
}
