import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, ID, Query } from '@/services/appwrite-server';
import {
  getCurrentAttendanceSessionWithConfig,
  getCurrentWeekNumberWithConfig,
  AttendanceConfig,
} from '@/services/attendance.service';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const ATTENDANCE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ATTENDANCE_COLLECTION || 'attendance';
const SETTINGS_COLLECTION_ID = 'clubSettings';
const ATTENDANCE_CONFIG_DOC_ID = 'attendance_config';
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';
const DEFAULT_CONFIG: AttendanceConfig = {
  dayOfWeek: 2,
  session1Start: { hour: 15, minute: 20 },
  session1Duration: 5,
  session2Start: { hour: 16, minute: 35 },
  session2Duration: 5,
  weekStartDate: '2026-01-06',
};
async function ensureCodeAttributes(): Promise<void> {
  const baseUrl = `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DATABASE_ID}/collections/${SETTINGS_COLLECTION_ID}/attributes`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': APPWRITE_PROJECT_ID,
    'X-Appwrite-Key': APPWRITE_API_KEY,
  };
  for (const key of ['attendanceCode1', 'attendanceCode2']) {
    try {
      await fetch(`${baseUrl}/string`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ key, size: 16, required: false }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {  }
  }
  try {
    await fetch(`${baseUrl}/integer`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ key: 'attendanceCodesWeek', required: false }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {  }
  console.log('[ensureCodeAttributes] 等待 Appwrite 处理新属性（约 5 秒）...');
  await new Promise(r => setTimeout(r, 5000));
  console.log('[ensureCodeAttributes] 属性处理完成，准备重试写入');
}
function generateAttendanceCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
async function getAttendanceConfigFromDB(): Promise<{ config: AttendanceConfig; debugMode: boolean; attendanceCode1: string | null; attendanceCode2: string | null; attendanceCodesWeek: number | null; codeEnabled: boolean }> {
  try {
    const doc = await serverDatabases.getDocument(
      APPWRITE_DATABASE_ID,
      SETTINGS_COLLECTION_ID,
      ATTENDANCE_CONFIG_DOC_ID
    );
    const config: AttendanceConfig = {
      dayOfWeek: doc.attendanceDayOfWeek ?? DEFAULT_CONFIG.dayOfWeek,
      session1Start: doc.attendanceSession1Start 
        ? JSON.parse(doc.attendanceSession1Start) 
        : DEFAULT_CONFIG.session1Start,
      session1Duration: doc.attendanceSession1Duration ?? DEFAULT_CONFIG.session1Duration,
      session2Start: doc.attendanceSession2Start 
        ? JSON.parse(doc.attendanceSession2Start) 
        : DEFAULT_CONFIG.session2Start,
      session2Duration: doc.attendanceSession2Duration ?? DEFAULT_CONFIG.session2Duration,
      weekStartDate: doc.attendanceWeekStartDate ?? DEFAULT_CONFIG.weekStartDate,
    };
    return {
      config,
      debugMode: doc.attendanceDebugMode ?? false,
      attendanceCode1: doc.attendanceCode1 ?? null,
      attendanceCode2: doc.attendanceCode2 ?? null,
      attendanceCodesWeek: typeof doc.attendanceCodesWeek === 'number' ? doc.attendanceCodesWeek : null,
      codeEnabled: doc.attendanceCodeEnabled ?? false,
    };
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 404) {
      console.log('[AttendanceAPI] 配置文档不存在，使用默认配置');
    } else {
      console.error('[AttendanceAPI] 获取配置失败:', error);
    }
    return { config: DEFAULT_CONFIG, debugMode: false, attendanceCode1: null, attendanceCode2: null, attendanceCodesWeek: null, codeEnabled: false };
  }
}
async function saveAttendanceConfigToDB(
  config: Partial<AttendanceConfig>, 
  debugMode?: boolean,
  attendanceCode1?: string | null,
  attendanceCode2?: string | null,
  attendanceCodesWeek?: number | null,
  codeEnabled?: boolean,
): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (config.dayOfWeek !== undefined) updateData.attendanceDayOfWeek = config.dayOfWeek;
  if (config.session1Start !== undefined) updateData.attendanceSession1Start = JSON.stringify(config.session1Start);
  if (config.session1Duration !== undefined) updateData.attendanceSession1Duration = config.session1Duration;
  if (config.session2Start !== undefined) updateData.attendanceSession2Start = JSON.stringify(config.session2Start);
  if (config.session2Duration !== undefined) updateData.attendanceSession2Duration = config.session2Duration;
  if (config.weekStartDate !== undefined) updateData.attendanceWeekStartDate = config.weekStartDate;
  if (debugMode !== undefined) updateData.attendanceDebugMode = debugMode;
  if (attendanceCode1 !== undefined) updateData.attendanceCode1 = attendanceCode1;
  if (attendanceCode2 !== undefined) updateData.attendanceCode2 = attendanceCode2;
  if (attendanceCodesWeek !== undefined) updateData.attendanceCodesWeek = attendanceCodesWeek;
  if (codeEnabled !== undefined) updateData.attendanceCodeEnabled = codeEnabled;
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const createData = {
    attendanceDayOfWeek: fullConfig.dayOfWeek,
    attendanceSession1Start: JSON.stringify(fullConfig.session1Start),
    attendanceSession1Duration: fullConfig.session1Duration,
    attendanceSession2Start: JSON.stringify(fullConfig.session2Start),
    attendanceSession2Duration: fullConfig.session2Duration,
    attendanceWeekStartDate: fullConfig.weekStartDate,
    attendanceDebugMode: debugMode ?? false,
    attendanceCode1: attendanceCode1 ?? null,
    attendanceCode2: attendanceCode2 ?? null,
    attendanceCodesWeek: attendanceCodesWeek ?? null,
    attendanceCodeEnabled: codeEnabled ?? false,
  };
  const doUpdate = () => serverDatabases.updateDocument(
    APPWRITE_DATABASE_ID,
    SETTINGS_COLLECTION_ID,
    ATTENDANCE_CONFIG_DOC_ID,
    updateData
  );
  const doCreate = () => serverDatabases.createDocument(
    APPWRITE_DATABASE_ID,
    SETTINGS_COLLECTION_ID,
    ATTENDANCE_CONFIG_DOC_ID,
    createData
  );
  let needCreate = false;
  try {
    await doUpdate();
    return;
  } catch (e: unknown) {
    const err = e as { code?: number; message?: string };
    if (err.code === 400) {
      console.warn('[saveAttendanceConfigToDB] 400, 自动修复 schema...', err.message);
      await ensureCodeAttributes();
      try {
        await doUpdate();
        return;
      } catch (retryErr: unknown) {
        const re = retryErr as { code?: number };
        if (re.code === 404) {
          needCreate = true;
        } else {
          throw retryErr;
        }
      }
    } else if (err.code === 404) {
      needCreate = true;
    } else {
      throw e;
    }
  }
  if (needCreate) {
    try {
      await doCreate();
    } catch (ce: unknown) {
      const cErr = ce as { code?: number };
      if (cErr.code === 400) {
        await ensureCodeAttributes();
        await doCreate();
      } else if (cErr.code === 409) {
        await doUpdate();
      } else {
        throw ce;
      }
    }
  }
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const { config, attendanceCode1, attendanceCode2, attendanceCodesWeek, codeEnabled } = await getAttendanceConfigFromDB();
    const debugMode = false; 
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentHour = now.getHours();
    const weekNumber = getCurrentWeekNumberWithConfig(config);
    let code1 = attendanceCode1;
    let code2 = attendanceCode2;
    if (dayOfWeek === config.dayOfWeek && currentHour >= config.session1Start.hour && attendanceCodesWeek !== weekNumber) {
      code1 = generateAttendanceCode();
      code2 = generateAttendanceCode();
      try {
        await saveAttendanceConfigToDB({}, undefined, code1, code2, weekNumber, true);
      } catch (saveErr) {
        console.error('[AttendanceAPI] 自动生成验证码保存失败（将在手动生成时重试）:', saveErr);
      }
    }
    if (action === 'debug-status') {
      return NextResponse.json({
        debugMode,
        config,
        attendanceCode1: code1,
        attendanceCode2: code2,
        attendanceCodesWeek: weekNumber,
        codeEnabled,
      });
    }
    const isAttendanceOpen = dayOfWeek === config.dayOfWeek;
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return NextResponse.json({
      isAttendanceOpen,
      session: null,
      message: isAttendanceOpen
        ? `今天是点名日（每${dayNames[config.dayOfWeek]}），请输入对应时段的验证码进行签到`
        : `今天不是点名日。点名日为每${dayNames[config.dayOfWeek]}`,
      weekNumber,
      debugMode,
      config,
      codeEnabled,
      hasCode: !!(code1 || code2),
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    return NextResponse.json(
      { error: err.message || '获取点名状态失败' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config: currentConfig, attendanceCode1: currentCode1, attendanceCode2: currentCode2, codeEnabled: currentCodeEnabled } = await getAttendanceConfigFromDB();
    if (body.action === 'toggle-debug') {
      return NextResponse.json(
        { success: false, error: '调试模式已禁用' },
        { status: 403 }
      );
    }
    if (body.action === 'update-config') {
      await saveAttendanceConfigToDB(body.config, undefined, undefined, undefined, undefined, undefined);
      const { config: updatedConfig } = await getAttendanceConfigFromDB();
      return NextResponse.json({
        success: true,
        config: updatedConfig,
        message: '点名配置已更新',
      });
    }
    if (body.action === 'generate-code') {
      const newCode1 = generateAttendanceCode();
      const newCode2 = generateAttendanceCode();
      const weekNum = getCurrentWeekNumberWithConfig(currentConfig);
      await saveAttendanceConfigToDB({}, undefined, newCode1, newCode2, weekNum, true);
      return NextResponse.json({
        success: true,
        attendanceCode1: newCode1,
        attendanceCode2: newCode2,
        codeEnabled: true,
        message: `验证码已生成 — 时段1: ${newCode1}，时段2: ${newCode2}`,
      });
    }
    if (body.action === 'clear-code') {
      await saveAttendanceConfigToDB({}, undefined, null, null, null, false);
      return NextResponse.json({
        success: true,
        codeEnabled: false,
        attendanceCode1: null,
        attendanceCode2: null,
        message: '验证码已清除',
      });
    }
    const { studentId, studentName, studentEmail, verificationCode } = body;
    if (!studentId || !studentName || !studentEmail) {
      return NextResponse.json(
        { error: '学生ID、姓名和邮箱必填' },
        { status: 400 }
      );
    }
    const nowDate = new Date();
    const nowDay = nowDate.getDay();
    if (nowDay !== currentConfig.dayOfWeek) {
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return NextResponse.json(
        { error: `今天不是点名日。点名日为每${dayNames[currentConfig.dayOfWeek]}` },
        { status: 400 }
      );
    }
    let sessionTime: string;
    let sessionNumber: 1 | 2;
    if (currentCodeEnabled && (currentCode1 || currentCode2)) {
      if (!verificationCode) {
        return NextResponse.json(
          { error: '请输入点名验证码', requireCode: true },
          { status: 400 }
        );
      }
      if (verificationCode === currentCode1) {
        sessionTime = `${currentConfig.session1Start.hour}:${String(currentConfig.session1Start.minute).padStart(2, '0')}`;
        sessionNumber = 1;
      } else if (verificationCode === currentCode2) {
        sessionTime = `${currentConfig.session2Start.hour}:${String(currentConfig.session2Start.minute).padStart(2, '0')}`;
        sessionNumber = 2;
      } else {
        return NextResponse.json(
          { error: '验证码错误，请检查后重试', requireCode: true },
          { status: 400 }
        );
      }
    } else {
      const weekNumber_temp = getCurrentWeekNumberWithConfig(currentConfig);
      const sessionTime1 = `${currentConfig.session1Start.hour}:${String(currentConfig.session1Start.minute).padStart(2, '0')}`;
      const sessionTime2 = `${currentConfig.session2Start.hour}:${String(currentConfig.session2Start.minute).padStart(2, '0')}`;
      let session1Done = false;
      try {
        const s1Records = await serverDatabases.listDocuments(
          APPWRITE_DATABASE_ID,
          ATTENDANCE_COLLECTION_ID,
          [
            Query.equal('studentId', studentId),
            Query.equal('sessionTime', sessionTime1),
            Query.equal('weekNumber', weekNumber_temp),
            Query.limit(1),
          ]
        );
        session1Done = s1Records.documents.length > 0 && s1Records.documents[0].status !== 'pending';
      } catch {  }
      if (!session1Done) {
        sessionTime = sessionTime1;
        sessionNumber = 1;
      } else {
        sessionTime = sessionTime2;
        sessionNumber = 2;
      }
    }
    const weekNumber = getCurrentWeekNumberWithConfig(currentConfig);
    const nowIso = nowDate.toISOString();
    let existingRecord = null;
    try {
      const existingRecords = await serverDatabases.listDocuments(
        APPWRITE_DATABASE_ID,
        ATTENDANCE_COLLECTION_ID,
        [
          Query.equal('studentId', studentId),
          Query.equal('sessionTime', sessionTime),
          Query.equal('weekNumber', weekNumber),
          Query.limit(1),
        ]
      );
      if (existingRecords.documents.length > 0) {
        existingRecord = existingRecords.documents[0];
      }
    } catch (queryError) {
      console.error('检查现有记录失败:', queryError);
    }
    if (existingRecord && existingRecord.status !== 'pending') {
      const statusLabel = existingRecord.status === 'present' ? '出席' : existingRecord.status === 'late' ? '迟到' : '缺席';
      const bothDone = sessionNumber === 2;
      return NextResponse.json(
        { error: bothDone
            ? `您本周两个时段均已完成点名（时段2: ${sessionTime} ${statusLabel}）`
            : `您已在 ${sessionTime} 完成时段${sessionNumber}点名（状态：${statusLabel}）` },
        { status: 400 }
      );
    }
    const checkInStatus: 'present' | 'late' = 'present';
    const lateNote = '';
    console.log('[DEBUG POST] 点名处理:', {
      studentId,
      studentName,
      sessionTime,
      weekNumber,
      checkInTime: nowIso,
      existingRecordId: existingRecord?.$id || null,
      status: checkInStatus,
    });
    let record;
    if (existingRecord) {
      record = await serverDatabases.updateDocument(
        APPWRITE_DATABASE_ID,
        ATTENDANCE_COLLECTION_ID,
        existingRecord.$id,
        {
          checkInTime: nowIso,
          status: checkInStatus,
          notes: lateNote || '',
        }
      );
      console.log('[DEBUG POST] 更新 pending 记录为:', checkInStatus);
    } else {
      const uniqueKey = `${studentId}_${sessionNumber}_${weekNumber}`;
      try {
        record = await serverDatabases.createDocument(
          APPWRITE_DATABASE_ID,
          ATTENDANCE_COLLECTION_ID,
          uniqueKey,  
          {
            studentId,
            studentName,
            studentEmail,
            checkInTime: nowIso,
            sessionTime: sessionTime,
            weekNumber,
            status: checkInStatus,
            notes: lateNote || '',
            createdAt: nowIso,
            uniqueKey,  
          }
        );
        console.log('[DEBUG POST] 创建新记录:', record.$id);
      } catch (createError: unknown) {
        const err = createError as Error & { message?: string };
        if (err.message && err.message.includes('already exists')) {
          return NextResponse.json(
            { error: '您已完成点名，请勿重复提交' },
            { status: 400 }
          );
        }
        throw createError;
      }
    }
    console.log('[DEBUG POST] 记录处理成功:', {
      id: record.$id,
      weekNumber: record.weekNumber,
      status: record.status,
    });
    const statusMessage = '点名成功！';
    return NextResponse.json({
      success: true,
      message: statusMessage,
      record: {
        id: record.$id,
        studentName: record.studentName,
        sessionTime: record.sessionTime,
        checkInTime: record.checkInTime,
        status: record.status,
        weekNumber: record.weekNumber,
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    return NextResponse.json(
      { error: err.message || '点名失败，请稍后重试' },
      { status: 400 }
    );
  }
}