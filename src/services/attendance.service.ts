import { databases } from '@/services/appwrite';
import { ID, Query } from 'appwrite';

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const ATTENDANCE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ATTENDANCE_COLLECTION || 'attendance';

export interface AttendanceRecord {
  $id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  checkInTime: string | null;
  sessionTime: '15:20' | '16:35' | string;
  weekNumber: number;
  status: 'present' | 'absent' | 'late' | 'pending';
  notes?: string;
}

export interface AttendanceSession {
  sessionTime: '15:20' | '16:35';
  sessionNumber: 1 | 2;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  minutesRemaining: number;
}

export interface AttendanceConfig {
  dayOfWeek: number;
  session1Start: { hour: number; minute: number };
  session1Duration: number;
  session2Start: { hour: number; minute: number };
  session2Duration: number;
  weekStartDate: string;
}

let attendanceConfig: AttendanceConfig = {
  dayOfWeek: 2,
  session1Start: { hour: 15, minute: 20 },
  session1Duration: 5,
  session2Start: { hour: 16, minute: 35 },
  session2Duration: 5,
  weekStartDate: '2026-01-06',
};

let debugMode = false;

export function setAttendanceConfig(config: Partial<AttendanceConfig>): void {
  attendanceConfig = { ...attendanceConfig, ...config };
}

export function getAttendanceConfig(): AttendanceConfig {
  return { ...attendanceConfig };
}

export function setDebugMode(enabled: boolean): void {
  debugMode = enabled;
}

export function isDebugMode(): boolean {
  return debugMode;
}

export function getCurrentAttendanceSession(): AttendanceSession | null {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (debugMode) {
    const startTime = new Date(now);
    startTime.setSeconds(0, 0);
    const endTime = new Date(now);
    endTime.setMinutes(endTime.getMinutes() + 5);

    return {
      sessionTime: '15:20',
      sessionNumber: 1,
      startTime,
      endTime,
      isActive: true,
      minutesRemaining: 5,
    };
  }

  if (dayOfWeek !== attendanceConfig.dayOfWeek) {
    return null;
  }

  const { session1Start, session1Duration, session2Start, session2Duration } = attendanceConfig;

  const session1EndMinute = session1Start.minute + session1Duration;
  if (hours === session1Start.hour && minutes >= session1Start.minute && minutes < session1EndMinute) {
    const startTime = new Date(now);
    startTime.setHours(session1Start.hour, session1Start.minute, 0, 0);
    const endTime = new Date(now);
    endTime.setHours(session1Start.hour, session1EndMinute, 0, 0);
    const minutesRemaining = session1EndMinute - minutes;

    return {
      sessionTime: '15:20',
      sessionNumber: 1,
      startTime,
      endTime,
      isActive: true,
      minutesRemaining,
    };
  }

  const session2EndMinute = session2Start.minute + session2Duration;
  if (hours === session2Start.hour && minutes >= session2Start.minute && minutes < session2EndMinute) {
    const startTime = new Date(now);
    startTime.setHours(session2Start.hour, session2Start.minute, 0, 0);
    const endTime = new Date(now);
    endTime.setHours(session2Start.hour, session2EndMinute, 0, 0);
    const minutesRemaining = session2EndMinute - minutes;

    return {
      sessionTime: '16:35',
      sessionNumber: 2,
      startTime,
      endTime,
      isActive: true,
      minutesRemaining,
    };
  }

  return null;
}

export function getCurrentAttendanceSessionWithConfig(config: AttendanceConfig, isDebug: boolean): AttendanceSession | null {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (isDebug) {
    const startTime = new Date(now);
    startTime.setSeconds(0, 0);
    const endTime = new Date(now);
    endTime.setMinutes(endTime.getMinutes() + 5);

    const sessionTimeStr = `${config.session1Start.hour}:${String(config.session1Start.minute).padStart(2, '0')}`;
    return {
      sessionTime: sessionTimeStr as '15:20' | '16:35',
      sessionNumber: 1,
      startTime,
      endTime,
      isActive: true,
      minutesRemaining: 5,
    };
  }

  if (dayOfWeek !== config.dayOfWeek) {
    return null;
  }

  const { session1Start, session1Duration, session2Start, session2Duration } = config;

  const currentTotalMinutes = hours * 60 + minutes;
  const session1StartMinutes = session1Start.hour * 60 + session1Start.minute;
  const session1EndMinutes = session1StartMinutes + session1Duration;

  if (currentTotalMinutes >= session1StartMinutes && currentTotalMinutes < session1EndMinutes) {
    const startTime = new Date(now);
    startTime.setHours(session1Start.hour, session1Start.minute, 0, 0);

    const endTime = new Date(now);
    const endHour = Math.floor(session1EndMinutes / 60);
    const endMinute = session1EndMinutes % 60;
    endTime.setHours(endHour, endMinute, 0, 0);

    const minutesRemaining = session1EndMinutes - currentTotalMinutes;
    const sessionTimeStr = `${session1Start.hour}:${String(session1Start.minute).padStart(2, '0')}`;

    return {
      sessionTime: sessionTimeStr as '15:20' | '16:35',
      sessionNumber: 1,
      startTime,
      endTime,
      isActive: true,
      minutesRemaining,
    };
  }

  const session2StartMinutes = session2Start.hour * 60 + session2Start.minute;
  const session2EndMinutes = session2StartMinutes + session2Duration;

  if (currentTotalMinutes >= session2StartMinutes && currentTotalMinutes < session2EndMinutes) {
    const startTime = new Date(now);
    startTime.setHours(session2Start.hour, session2Start.minute, 0, 0);

    const endTime = new Date(now);
    const endHour = Math.floor(session2EndMinutes / 60);
    const endMinute = session2EndMinutes % 60;
    endTime.setHours(endHour, endMinute, 0, 0);

    const minutesRemaining = session2EndMinutes - currentTotalMinutes;
    const sessionTimeStr = `${session2Start.hour}:${String(session2Start.minute).padStart(2, '0')}`;

    return {
      sessionTime: sessionTimeStr as '15:20' | '16:35',
      sessionNumber: 2,
      startTime,
      endTime,
      isActive: true,
      minutesRemaining,
    };
  }

  return null;
}

export function getCurrentWeekNumber(): number {
  const now = new Date();

  const weekStartDate = new Date(attendanceConfig.weekStartDate);

  if (now < weekStartDate) {
    return 1;
  }

  const timeDiff = now.getTime() - weekStartDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(daysDiff / 7) + 1;

  return Math.max(1, weekNumber);
}

export function getCurrentWeekNumberWithConfig(config: AttendanceConfig): number {
  const now = new Date();

  const weekStartDate = new Date(config.weekStartDate);

  if (now < weekStartDate) {
    return 1;
  }

  const timeDiff = now.getTime() - weekStartDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(daysDiff / 7) + 1;

  return Math.max(1, weekNumber);
}

export async function checkInAttendance(
  studentId: string,
  studentName: string,
  studentEmail: string
): Promise<AttendanceRecord> {
  try {
    const session = getCurrentAttendanceSession();
    if (!session) {
      throw new Error('当前不在点名时间内。点名时间为每周二 15:20-15:25 或 16:35-16:40');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingRecords = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      [
        Query.equal('studentId', studentId),
        Query.equal('sessionTime', session.sessionTime),
        Query.greaterThanEqual('checkInTime', today.toISOString()),
        Query.lessThan('checkInTime', tomorrow.toISOString()),
      ] as unknown as string[]
    );

    if (existingRecords.documents.length > 0) {
      throw new Error(`您已在 ${session.sessionTime} 完成点名`);
    }

    const weekNumber = getCurrentWeekNumber();
    const now = new Date().toISOString();

    const record = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      ID.unique(),
      {
        studentId,
        studentName,
        studentEmail,
        checkInTime: now,
        sessionTime: session.sessionTime,
        weekNumber,
        status: 'present',
        notes: debugMode ? '[DEBUG] 调试模式点名' : '',
      }
    );

    return record as unknown as AttendanceRecord;
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    throw new Error(err.message || '点名失败，请稍后重试');
  }
}

export async function getStudentAttendanceRecords(
  studentId: string,
  weekNumber?: number
): Promise<AttendanceRecord[]> {
  try {
    const queries: unknown[] = [Query.equal('studentId', studentId)];
    if (weekNumber !== undefined) {
      queries.push(Query.equal('weekNumber', weekNumber));
    }

    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      queries as unknown as string[]
    );

    return response.documents as unknown as AttendanceRecord[];
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取点名记录失败:', err);
    throw new Error(err.message || '获取点名记录失败');
  }
}

export async function getAttendanceRecordsBySession(
  sessionTime: '15:20' | '16:35',
  weekNumber?: number
): Promise<AttendanceRecord[]> {
  try {
    const queries: unknown[] = [Query.equal('sessionTime', sessionTime)];
    if (weekNumber !== undefined) {
      queries.push(Query.equal('weekNumber', weekNumber));
    }

    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      queries as unknown as string[]
    );

    const records = response.documents as unknown as AttendanceRecord[];
    return records.sort((a, b) => {
      const timeA = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
      const timeB = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
      return timeB - timeA;
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('获取点名记录失败:', err);
    throw new Error(err.message || '获取点名记录失败');
  }
}

export async function getWeeklyAttendanceSummary(weekNumber: number): Promise<{
  weekNumber: number;
  session1: { total: number; students: AttendanceRecord[] };
  session2: { total: number; students: AttendanceRecord[] };
}> {
  try {
    const session1Records = await getAttendanceRecordsBySession('15:20', weekNumber);
    const session2Records = await getAttendanceRecordsBySession('16:35', weekNumber);

    return {
      weekNumber,
      session1: {
        total: session1Records.length,
        students: session1Records,
      },
      session2: {
        total: session2Records.length,
        students: session2Records,
      },
    };
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    throw new Error(err.message || '获取周统计失败');
  }
}

export async function getAllStudentsAttendanceStatus(weekNumber: number): Promise<{
  weekNumber: number;
  presentCount: number;
  totalExpected: number;
  attendanceRecords: AttendanceRecord[];
}> {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      [Query.equal('weekNumber', weekNumber)]
    );

    const records = response.documents as unknown as AttendanceRecord[];

    return {
      weekNumber,
      presentCount: records.length,
      totalExpected: 0,
      attendanceRecords: records,
    };
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    throw new Error(err.message || '获取统计失败');
  }
}

export function checkIfShouldMarkAbsent(): { shouldMarkAbsent: boolean; sessionTime?: '15:20' | '16:35' } {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (hours === 15 && minutes >= 25 && minutes < 30) {
    return { shouldMarkAbsent: true, sessionTime: '15:20' };
  }

  if (hours === 16 && minutes >= 40 && minutes < 45) {
    return { shouldMarkAbsent: true, sessionTime: '16:35' };
  }

  return { shouldMarkAbsent: false };
}

export function checkIfShouldMarkAbsentWithConfig(config: AttendanceConfig): {
  shouldMarkAbsent: boolean;
  sessionTime?: string;
  minutesSinceEnd?: number;
} {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const session1EndMinutes = config.session1Start.hour * 60 + config.session1Start.minute + config.session1Duration;
  const session2EndMinutes = config.session2Start.hour * 60 + config.session2Start.minute + config.session2Duration;

  if (currentMinutes >= session1EndMinutes && currentMinutes < session1EndMinutes + 5) {
    const sessionTime = `${String(config.session1Start.hour).padStart(2, '0')}:${String(config.session1Start.minute).padStart(2, '0')}`;
    return {
      shouldMarkAbsent: true,
      sessionTime,
      minutesSinceEnd: currentMinutes - session1EndMinutes,
    };
  }

  if (currentMinutes >= session2EndMinutes && currentMinutes < session2EndMinutes + 5) {
    const sessionTime = `${String(config.session2Start.hour).padStart(2, '0')}:${String(config.session2Start.minute).padStart(2, '0')}`;
    return {
      shouldMarkAbsent: true,
      sessionTime,
      minutesSinceEnd: currentMinutes - session2EndMinutes,
    };
  }

  return { shouldMarkAbsent: false };
}

export function determineCheckInStatus(
  sessionConfig: { hour: number; minute: number; duration: number },
  checkInTime: Date,
  lateBufferMinutes: number = 0
): 'present' | 'late' | 'absent' {
  const checkInHour = checkInTime.getHours();
  const checkInMinute = checkInTime.getMinutes();
  const checkInTotalMinutes = checkInHour * 60 + checkInMinute;

  const sessionStartMinutes = sessionConfig.hour * 60 + sessionConfig.minute;
  const sessionEndMinutes = sessionStartMinutes + sessionConfig.duration;
  const lateDeadlineMinutes = sessionEndMinutes + lateBufferMinutes;

  if (checkInTotalMinutes >= sessionStartMinutes && checkInTotalMinutes < sessionEndMinutes) {
    return 'present';
  }

  if (checkInTotalMinutes >= sessionEndMinutes && checkInTotalMinutes < lateDeadlineMinutes + 5) {
    return 'late';
  }

  return 'absent';
}

export function getSessionTimeStatus(
  sessionConfig: { hour: number; minute: number; duration: number },
  lateBufferMinutes: number = 5
): { isOpen: boolean; isLateWindow: boolean; minutesRemaining: number } {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  const sessionStartMinutes = sessionConfig.hour * 60 + sessionConfig.minute;
  const sessionEndMinutes = sessionStartMinutes + sessionConfig.duration;
  const lateDeadlineMinutes = sessionEndMinutes + lateBufferMinutes;

  if (currentTotalMinutes >= sessionStartMinutes && currentTotalMinutes < sessionEndMinutes) {
    return {
      isOpen: true,
      isLateWindow: false,
      minutesRemaining: sessionEndMinutes - currentTotalMinutes,
    };
  }

  if (currentTotalMinutes >= sessionEndMinutes && currentTotalMinutes < lateDeadlineMinutes) {
    return {
      isOpen: true,
      isLateWindow: true,
      minutesRemaining: lateDeadlineMinutes - currentTotalMinutes,
    };
  }

  return {
    isOpen: false,
    isLateWindow: false,
    minutesRemaining: 0,
  };
}
