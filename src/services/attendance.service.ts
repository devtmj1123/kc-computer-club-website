import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export interface AttendanceConfig {
  dayOfWeek: number;
  session1Start: { hour: number; minute: number };
  session1Duration: number;
  session2Start: { hour: number; minute: number };
  session2Duration: number;
  weekStartDate: string;
  /**
   * Kept for API compatibility with the old settings screen. The current
   * schema stores the only debug-adjacent flag as `code_enabled`, so this
   * value is never persisted and always reads back as false.
   */
  debugMode?: boolean;
}

export interface AttendanceWindow {
  sessionNumber: 1 | 2;
  startTime: string;
  endTime: string;
  isActive: boolean;
  minutesRemaining: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'pending';
export type AttendanceSessionStatus = 'scheduled' | 'open' | 'closed';

export interface AttendanceRecord {
  $id: string;
  studentId: string;
  profileId: string;
  studentName: string;
  studentEmail: string;
  checkInTime: string | null;
  sessionTime: string;
  sessionNumber: 1 | 2;
  weekNumber: number;
  status: AttendanceStatus;
  notes?: string;
  isPending?: boolean;
  uniqueKey?: string;
}

export interface AttendanceSessionRow {
  id: string;
  week_number: number;
  session_number: 1 | 2;
  session_date: string;
  starts_at: string;
  ends_at: string;
  checkin_code: string | null;
  code_enabled: boolean;
  status: AttendanceSessionStatus;
}

export interface AttendanceConfigRow {
  id: number;
  day_of_week: number;
  session1_start: string;
  session1_duration: number;
  session2_start: string;
  session2_duration: number;
  week_start_date: string;
  code_enabled: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface StudentProfileRow {
  id: string;
  email: string | null;
  student_no: string | null;
  chinese_name: string | null;
  english_name: string | null;
}

export class AttendanceError extends Error {
  status: number;
  requireCode: boolean;

  constructor(message: string, status = 400, requireCode = false) {
    super(message);
    this.name = 'AttendanceError';
    this.status = status;
    this.requireCode = requireCode;
  }
}

export const DEFAULT_ATTENDANCE_CONFIG: AttendanceConfig = {
  dayOfWeek: 2,
  session1Start: { hour: 15, minute: 20 },
  session1Duration: 5,
  session2Start: { hour: 16, minute: 35 },
  session2Duration: 5,
  weekStartDate: '2026-01-06',
  debugMode: false,
};

const SESSION_SELECT =
  'id, week_number, session_number, session_date, starts_at, ends_at, checkin_code, code_enabled, status';

const STATUS_ORDER: Record<AttendanceStatus, number> = {
  present: 0,
  late: 1,
  pending: 2,
  absent: 3,
};

export function parseTimeParts(value: string): { hour: number; minute: number } {
  const [hourPart, minutePart] = String(value || '00:00').split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  return {
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

export function formatTimeParts(parts: { hour: number; minute: number }): string {
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) {
    return parseDateOnly(DEFAULT_ATTENDANCE_CONFIG.weekStartDate);
  }
  return new Date(year, month - 1, day);
}

function formatDateOnly(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function configFromRow(row: AttendanceConfigRow | null): AttendanceConfig {
  if (!row) return { ...DEFAULT_ATTENDANCE_CONFIG };

  return {
    dayOfWeek: row.day_of_week,
    session1Start: parseTimeParts(row.session1_start),
    session1Duration: row.session1_duration,
    session2Start: parseTimeParts(row.session2_start),
    session2Duration: row.session2_duration,
    weekStartDate: row.week_start_date,
    debugMode: false,
  };
}

export function getSessionStart(
  config: AttendanceConfig,
  sessionNumber: 1 | 2
): { hour: number; minute: number } {
  return sessionNumber === 1 ? config.session1Start : config.session2Start;
}

export function getSessionDuration(
  config: AttendanceConfig,
  sessionNumber: 1 | 2
): number {
  return sessionNumber === 1 ? config.session1Duration : config.session2Duration;
}

export function getSessionTimeString(
  config: AttendanceConfig,
  sessionNumber: 1 | 2
): string {
  return formatTimeParts(getSessionStart(config, sessionNumber));
}

export function resolveSessionNumber(
  config: AttendanceConfig,
  sessionTime: string
): 1 | 2 {
  const parts = parseTimeParts(sessionTime);
  const s1 = config.session1Start;
  const s2 = config.session2Start;
  if (parts.hour === s1.hour && parts.minute === s1.minute) return 1;
  if (parts.hour === s2.hour && parts.minute === s2.minute) return 2;
  if (parts.hour === 15 && parts.minute === 20) return 1;
  if (parts.hour === 16 && parts.minute === 35) return 2;
  return parts.hour < 16 ? 1 : 2;
}

export async function getAttendanceConfigState(): Promise<{
  config: AttendanceConfig;
  codeEnabled: boolean;
  row: AttendanceConfigRow | null;
}> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('attendance_config')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('读取点名配置失败:', error.message);
    throw new Error('读取点名配置失败');
  }

  const row = data as AttendanceConfigRow | null;
  return {
    config: configFromRow(row),
    codeEnabled: row?.code_enabled === true,
    row,
  };
}

export async function getAttendanceConfig(): Promise<AttendanceConfig> {
  const state = await getAttendanceConfigState();
  return state.config;
}

export async function saveAttendanceConfig(
  input: Partial<AttendanceConfig>,
  updatedBy?: string | null
): Promise<AttendanceConfig> {
  const current = await getAttendanceConfigState();
  const merged: AttendanceConfig = {
    ...current.config,
    ...input,
    session1Start: input.session1Start ?? current.config.session1Start,
    session2Start: input.session2Start ?? current.config.session2Start,
  };

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('attendance_config')
    .upsert(
      {
        id: 1,
        day_of_week: merged.dayOfWeek,
        session1_start: formatTimeParts(merged.session1Start),
        session1_duration: merged.session1Duration,
        session2_start: formatTimeParts(merged.session2Start),
        session2_duration: merged.session2Duration,
        week_start_date: merged.weekStartDate,
        updated_by: updatedBy || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (error) {
    console.error('保存点名配置失败:', error.message);
    throw new Error('保存点名配置失败');
  }

  return configFromRow(data as AttendanceConfigRow);
}

export async function setAttendanceCodeEnabled(
  enabled: boolean,
  updatedBy?: string | null
): Promise<void> {
  const { config } = await getAttendanceConfigState();
  const admin = getSupabaseAdminClient();
  const { error } = await admin.from('attendance_config').upsert(
    {
      id: 1,
      day_of_week: config.dayOfWeek,
      session1_start: formatTimeParts(config.session1Start),
      session1_duration: config.session1Duration,
      session2_start: formatTimeParts(config.session2Start),
      session2_duration: config.session2Duration,
      week_start_date: config.weekStartDate,
      code_enabled: enabled,
      updated_by: updatedBy || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('更新验证码开关失败:', error.message);
    throw new Error('更新验证码开关失败');
  }
}

export function getCurrentWeekNumber(config: AttendanceConfig): number {
  const now = new Date();
  const weekStartDate = parseDateOnly(config.weekStartDate);

  if (now < weekStartDate) {
    return 1;
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysDiff = Math.floor(
    (today.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, Math.floor(daysDiff / 7) + 1);
}

function getSessionDate(
  config: AttendanceConfig,
  weekNumber: number,
  sessionNumber: 1 | 2
): Date {
  const base = parseDateOnly(config.weekStartDate);
  const offsetToAttendanceDay = (config.dayOfWeek - base.getDay() + 7) % 7;
  const sessionDate = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + (weekNumber - 1) * 7 + offsetToAttendanceDay
  );
  const start = getSessionStart(config, sessionNumber);
  sessionDate.setHours(start.hour, start.minute, 0, 0);
  return sessionDate;
}

export function buildSessionWindow(
  config: AttendanceConfig,
  weekNumber: number,
  sessionNumber: 1 | 2,
  durationOverride?: number
): { start: Date; end: Date; sessionDate: Date } {
  const start = getSessionDate(config, weekNumber, sessionNumber);
  const duration = durationOverride ?? getSessionDuration(config, sessionNumber);
  const end = new Date(start.getTime() + duration * 60 * 1000);
  return { start, end, sessionDate: start };
}

export function getCurrentAttendanceWindow(
  config: AttendanceConfig
): AttendanceWindow | null {
  const now = new Date();
  if (now.getDay() !== config.dayOfWeek) {
    return null;
  }

  for (const sessionNumber of [1, 2] as const) {
    const start = getSessionStart(config, sessionNumber);
    const duration = getSessionDuration(config, sessionNumber);
    const startMinutes = start.hour * 60 + start.minute;
    const endMinutes = startMinutes + duration;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return {
        sessionNumber,
        startTime: formatTimeParts(start),
        endTime: formatTimeParts({
          hour: Math.floor(endMinutes / 60),
          minute: endMinutes % 60,
        }),
        isActive: true,
        minutesRemaining: endMinutes - currentMinutes,
      };
    }
  }

  return null;
}

export async function getSessionsForWeek(
  weekNumber: number
): Promise<AttendanceSessionRow[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('attendance_sessions')
    .select(SESSION_SELECT)
    .eq('week_number', weekNumber)
    .order('session_number', { ascending: true });

  if (error) {
    console.error('读取点名时段失败:', error.message);
    throw new Error('读取点名时段失败');
  }

  return (data ?? []) as unknown as AttendanceSessionRow[];
}

export async function getSessionByWeekAndNumber(
  weekNumber: number,
  sessionNumber: 1 | 2
): Promise<AttendanceSessionRow | null> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('attendance_sessions')
    .select(SESSION_SELECT)
    .eq('week_number', weekNumber)
    .eq('session_number', sessionNumber)
    .maybeSingle();

  if (error) {
    console.error('读取点名时段失败:', error.message);
    throw new Error('读取点名时段失败');
  }

  return (data as unknown as AttendanceSessionRow) || null;
}

export async function ensureAttendanceSession(input: {
  config: AttendanceConfig;
  weekNumber: number;
  sessionNumber: 1 | 2;
  durationOverride?: number;
  checkinCode?: string | null;
  codeEnabled?: boolean;
  createdBy?: string | null;
}): Promise<AttendanceSessionRow> {
  const { start, end, sessionDate } = buildSessionWindow(
    input.config,
    input.weekNumber,
    input.sessionNumber,
    input.durationOverride
  );

  const payload: Record<string, unknown> = {
    week_number: input.weekNumber,
    session_number: input.sessionNumber,
    session_date: formatDateOnly(sessionDate),
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
  };

  if (input.checkinCode !== undefined) payload.checkin_code = input.checkinCode;
  if (input.codeEnabled !== undefined) payload.code_enabled = input.codeEnabled;
  if (input.createdBy !== undefined) payload.created_by = input.createdBy;

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('attendance_sessions')
    .upsert(payload, { onConflict: 'week_number,session_number' })
    .select(SESSION_SELECT)
    .single();

  if (error) {
    console.error('创建点名时段失败:', error.message);
    throw new Error('创建点名时段失败');
  }

  return data as unknown as AttendanceSessionRow;
}

export async function setSessionStatus(
  sessionId: string,
  status: AttendanceSessionStatus
): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from('attendance_sessions')
    .update({ status })
    .eq('id', sessionId);

  if (error) {
    console.error('更新点名时段状态失败:', error.message);
  }
}

export async function clearAttendanceCodes(
  weekNumber: number,
  updatedBy?: string | null
): Promise<number> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('attendance_sessions')
    .update({ checkin_code: null, code_enabled: false })
    .eq('week_number', weekNumber)
    .select('id');

  if (error) {
    console.error('清除验证码失败:', error.message);
    throw new Error('清除验证码失败');
  }

  await setAttendanceCodeEnabled(false, updatedBy);
  return (data ?? []).length;
}

export async function getActiveStudents(): Promise<StudentProfileRow[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, student_no, chinese_name, english_name')
    .eq('role', 'student')
    .eq('is_active', true)
    .order('student_no', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('读取学生列表失败:', error.message);
    throw new Error('读取学生列表失败');
  }

  return ((data ?? []) as unknown as StudentProfileRow[]).filter(
    (profile) => Boolean(profile.email)
  );
}

export function studentDisplayName(profile: StudentProfileRow): string {
  return (
    String(profile.chinese_name || '').trim() ||
    String(profile.english_name || '').trim() ||
    String(profile.email || '').trim()
  );
}

export async function resolveStudentProfile(
  identifier: string
): Promise<StudentProfileRow> {
  const admin = getSupabaseAdminClient();
  const value = String(identifier || '').trim();
  if (!value) throw new AttendanceError('缺少学生标识', 400);

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );

  let query = admin
    .from('profiles')
    .select('id, email, student_no, chinese_name, english_name')
    .eq('role', 'student');

  query = isUuid
    ? query.eq('id', value)
    : query.or(`student_no.eq.${value},email.eq.${value.toLowerCase()}`);

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) {
    console.error('查询学生资料失败:', error.message);
    throw new AttendanceError('查询学生资料失败', 500);
  }
  if (!data) {
    throw new AttendanceError('学生账号不存在', 404);
  }

  return data as unknown as StudentProfileRow;
}

interface JoinedRecordRow {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  check_in_at: string | null;
  status: AttendanceStatus;
  notes: string | null;
  attendance_sessions:
    | { week_number: number; session_number: 1 | 2 }
    | { week_number: number; session_number: 1 | 2 }[]
    | null;
}

const RECORD_SELECT =
  'id, session_id, student_id, student_name, student_email, check_in_at, status, notes, attendance_sessions(week_number, session_number)';

function sessionInfo(
  row: JoinedRecordRow
): { weekNumber: number; sessionNumber: 1 | 2 } {
  const raw = Array.isArray(row.attendance_sessions)
    ? row.attendance_sessions[0]
    : row.attendance_sessions;
  return {
    weekNumber: Number(raw?.week_number || 0),
    sessionNumber: (Number(raw?.session_number) === 2 ? 2 : 1) as 1 | 2,
  };
}

function mapRecord(
  row: JoinedRecordRow,
  config: AttendanceConfig,
  studentNoById?: Map<string, string>
): AttendanceRecord {
  const info = sessionInfo(row);
  return {
    $id: row.id,
    studentId:
      studentNoById?.get(row.student_id) || String(row.student_id),
    profileId: row.student_id,
    studentName: row.student_name,
    studentEmail: row.student_email,
    checkInTime: row.check_in_at,
    sessionTime: getSessionTimeString(config, info.sessionNumber),
    sessionNumber: info.sessionNumber,
    weekNumber: info.weekNumber,
    status: row.status,
    notes: row.notes || undefined,
  };
}

function pendingRecord(
  profile: StudentProfileRow,
  sessionNumber: 1 | 2,
  weekNumber: number,
  config: AttendanceConfig
): AttendanceRecord {
  const uniqueKey = `pending_${profile.id}_${sessionNumber}_${weekNumber}`;
  return {
    $id: uniqueKey,
    studentId: profile.student_no || profile.id,
    profileId: profile.id,
    studentName: studentDisplayName(profile),
    studentEmail: profile.email || '',
    checkInTime: null,
    sessionTime: getSessionTimeString(config, sessionNumber),
    sessionNumber,
    weekNumber,
    status: 'pending',
    notes: '',
    isPending: true,
    uniqueKey,
  };
}

function sortRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  return [...records].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.studentName.localeCompare(b.studentName, 'zh-CN');
  });
}

export async function getSessionRecords(
  weekNumber: number,
  sessionNumber: 1 | 2,
  config: AttendanceConfig,
  includeAll = true
): Promise<{
  records: AttendanceRecord[];
  totalStudents: number;
  session: AttendanceSessionRow | null;
}> {
  const admin = getSupabaseAdminClient();
  const session = await getSessionByWeekAndNumber(weekNumber, sessionNumber);
  const students = includeAll ? await getActiveStudents() : [];
  const studentNoById = new Map(
    students.map((profile) => [profile.id, profile.student_no || profile.id])
  );

  let rows: JoinedRecordRow[] = [];
  if (session) {
    const { data, error } = await admin
      .from('attendance_records')
      .select(RECORD_SELECT)
      .eq('session_id', session.id)
      .order('check_in_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('读取点名记录失败:', error.message);
      throw new Error('读取点名记录失败');
    }
    rows = (data ?? []) as unknown as JoinedRecordRow[];
  }

  const records = rows.map((row) => mapRecord(row, config, studentNoById));

  if (includeAll) {
    const recordedIds = new Set(rows.map((row) => row.student_id));
    for (const profile of students) {
      if (!recordedIds.has(profile.id)) {
        records.push(pendingRecord(profile, sessionNumber, weekNumber, config));
      }
    }
  }

  return {
    records: sortRecords(records),
    totalStudents: students.length,
    session,
  };
}

export async function getAttendanceSummary(
  weekNumber: number,
  config: AttendanceConfig,
  includeAll = true
): Promise<{
  weekNumber: number;
  totalStudents: number;
  session1: {
    total: number;
    present: number;
    late: number;
    absent: number;
    pending: number;
    students: AttendanceRecord[];
  };
  session2: {
    total: number;
    present: number;
    late: number;
    absent: number;
    pending: number;
    students: AttendanceRecord[];
  };
}> {
  const [session1, session2] = await Promise.all([
    getSessionRecords(weekNumber, 1, config, includeAll),
    getSessionRecords(weekNumber, 2, config, includeAll),
  ]);

  const summarize = (records: AttendanceRecord[]) => ({
    total: records.length,
    present: records.filter((record) => record.status === 'present').length,
    late: records.filter((record) => record.status === 'late').length,
    absent: records.filter((record) => record.status === 'absent').length,
    pending: records.filter((record) => record.status === 'pending').length,
    students: records,
  });

  return {
    weekNumber,
    totalStudents: Math.max(session1.totalStudents, session2.totalStudents),
    session1: summarize(session1.records),
    session2: summarize(session2.records),
  };
}

export async function initializeAttendanceSession(input: {
  config: AttendanceConfig;
  weekNumber: number;
  sessionNumber: 1 | 2;
  durationOverride?: number;
  createdBy?: string | null;
}): Promise<{
  session: AttendanceSessionRow;
  totalStudents: number;
  existingCount: number;
  newRecordsCount: number;
}> {
  const session = await ensureAttendanceSession(input);
  const students = await getActiveStudents();
  const admin = getSupabaseAdminClient();

  const { data: existing, error: existingError } = await admin
    .from('attendance_records')
    .select('student_id')
    .eq('session_id', session.id);

  if (existingError) {
    console.error('读取已有点名记录失败:', existingError.message);
    throw new Error('读取已有点名记录失败');
  }

  const existingIds = new Set(
    (existing ?? []).map((record) => String(record.student_id))
  );
  const missing = students.filter((profile) => !existingIds.has(profile.id));

  if (missing.length > 0) {
    const rows = missing.map((profile) => ({
      session_id: session.id,
      student_id: profile.id,
      student_name: studentDisplayName(profile),
      student_email: profile.email || '',
      check_in_at: null,
      status: 'pending' as const,
      notes: '等待点名',
    }));

    for (let index = 0; index < rows.length; index += 500) {
      const chunk = rows.slice(index, index + 500);
      const { error } = await admin
        .from('attendance_records')
        .upsert(chunk, {
          onConflict: 'session_id,student_id',
          ignoreDuplicates: true,
        });
      if (error) {
        console.error('创建待点名记录失败:', error.message);
        throw new Error('创建待点名记录失败');
      }
    }
  }

  return {
    session,
    totalStudents: students.length,
    existingCount: existingIds.size,
    newRecordsCount: missing.length,
  };
}

export async function markSessionAbsent(input: {
  config: AttendanceConfig;
  weekNumber: number;
  sessionNumber: 1 | 2;
  markAs?: 'absent' | 'late';
  createdBy?: string | null;
}): Promise<{
  session: AttendanceSessionRow;
  totalStudents: number;
  existingRecordsCount: number;
  pendingUpdatedCount: number;
  createdRecordsCount: number;
  markedAs: 'absent' | 'late';
}> {
  const session = await ensureAttendanceSession(input);
  const status = input.markAs === 'late' ? 'late' : 'absent';
  const label = status === 'late' ? '迟到' : '缺席';
  const students = await getActiveStudents();
  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: existing, error: existingError } = await admin
    .from('attendance_records')
    .select('student_id, status')
    .eq('session_id', session.id);

  if (existingError) {
    console.error('读取点名记录失败:', existingError.message);
    throw new Error('读取点名记录失败');
  }

  const { data: updated, error: updateError } = await admin
    .from('attendance_records')
    .update({
      status,
      check_in_at: now,
      notes: `系统自动标记（点名时间结束 - ${label}）`,
      updated_at: now,
    })
    .eq('session_id', session.id)
    .eq('status', 'pending')
    .select('id');

  if (updateError) {
    console.error('更新待点名记录失败:', updateError.message);
    throw new Error('更新待点名记录失败');
  }

  const sessionStudentIds = new Set(
    (existing ?? []).map((record) => String(record.student_id))
  );
  const missing = students.filter(
    (profile) => !sessionStudentIds.has(profile.id)
  );

  let createdRecordsCount = 0;
  if (missing.length > 0) {
    const rows = missing.map((profile) => ({
      session_id: session.id,
      student_id: profile.id,
      student_name: studentDisplayName(profile),
      student_email: profile.email || '',
      check_in_at: now,
      status,
      notes: `系统自动标记（超时未点名 - ${label}）`,
    }));

    for (let index = 0; index < rows.length; index += 500) {
      const chunk = rows.slice(index, index + 500);
      const { data, error } = await admin
        .from('attendance_records')
        .upsert(chunk, {
          onConflict: 'session_id,student_id',
          ignoreDuplicates: true,
        })
        .select('id');
      if (error) {
        console.error('创建缺席记录失败:', error.message);
        throw new Error('创建缺席记录失败');
      }
      createdRecordsCount += (data ?? []).length;
    }
  }

  return {
    session,
    totalStudents: students.length,
    existingRecordsCount: sessionStudentIds.size,
    pendingUpdatedCount: (updated ?? []).length,
    createdRecordsCount,
    markedAs: status,
  };
}

export async function checkInStudent(input: {
  profile: StudentProfileRow;
  verificationCode?: string;
  config: AttendanceConfig;
  codeEnabled: boolean;
  createdBy?: string | null;
}): Promise<{ record: AttendanceRecord; alreadyCheckedIn: boolean }> {
  const { config } = input;
  const now = new Date();
  const weekNumber = getCurrentWeekNumber(config);
  const sessions = await getSessionsForWeek(weekNumber);
  const code = String(input.verificationCode || '').trim();

  const sessionsWithCodes = sessions.filter(
    (session) =>
      session.code_enabled &&
      typeof session.checkin_code === 'string' &&
      session.checkin_code.length > 0
  );

  let session: AttendanceSessionRow | undefined;

  if (code) {
    session = sessionsWithCodes.find(
      (candidate) => candidate.checkin_code === code
    );
    if (
      !session ||
      now.getTime() < new Date(session.starts_at).getTime() ||
      now.getTime() > new Date(session.ends_at).getTime()
    ) {
      throw new AttendanceError('验证码错误或签到未开放', 400, true);
    }
  } else {
    if (input.codeEnabled || sessionsWithCodes.length > 0) {
      throw new AttendanceError('请输入点名验证码', 400, true);
    }

    // No-code mode: the open time window decides the session. Create the
    // session lazily so check-in still works if an admin never generated codes.
    const openWindow = getCurrentAttendanceWindow(config);
    if (!openWindow) {
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      throw new AttendanceError(
        `当前不在点名时间内。点名日为每${dayNames[config.dayOfWeek]} ${getSessionTimeString(
          config,
          1
        )}-${formatTimeParts({
          hour:
            config.session1Start.hour +
            Math.floor(
              (config.session1Start.minute + config.session1Duration) / 60
            ),
          minute:
            (config.session1Start.minute + config.session1Duration) % 60,
        })} 或 ${getSessionTimeString(config, 2)}-${formatTimeParts({
          hour:
            config.session2Start.hour +
            Math.floor(
              (config.session2Start.minute + config.session2Duration) / 60
            ),
          minute:
            (config.session2Start.minute + config.session2Duration) % 60,
        })}`,
        400
      );
    }

    session = sessions.find(
      (candidate) => candidate.session_number === openWindow.sessionNumber
    );
    if (!session) {
      session = await ensureAttendanceSession({
        config,
        weekNumber,
        sessionNumber: openWindow.sessionNumber,
        createdBy: input.createdBy,
      });
    }
  }

  const admin = getSupabaseAdminClient();
  const { data: existing, error: existingError } = await admin
    .from('attendance_records')
    .select('id, status, check_in_at')
    .eq('session_id', session.id)
    .eq('student_id', input.profile.id)
    .maybeSingle();

  if (existingError) {
    console.error('查询点名记录失败:', existingError.message);
    throw new AttendanceError('点名失败，请稍后重试', 500);
  }

  const sessionTime = getSessionTimeString(
    config,
    session.session_number as 1 | 2
  );

  if (existing && existing.status !== 'pending') {
    const label =
      existing.status === 'present'
        ? '出席'
        : existing.status === 'late'
          ? '迟到'
          : '缺席';
    throw new AttendanceError(
      `您已在 ${sessionTime} 完成时段${session.session_number}点名（状态：${label}）`,
      400
    );
  }

  const late =
    now.getTime() > new Date(session.starts_at).getTime() + 10 * 60 * 1000;
  const status: AttendanceStatus = late ? 'late' : 'present';
  const checkInAt = now.toISOString();

  const { data: saved, error: saveError } = await admin
    .from('attendance_records')
    .upsert(
      {
        session_id: session.id,
        student_id: input.profile.id,
        student_name: studentDisplayName(input.profile),
        student_email: input.profile.email || '',
        check_in_at: checkInAt,
        status,
        notes: '',
        updated_at: checkInAt,
      },
      { onConflict: 'session_id,student_id' }
    )
    .select(RECORD_SELECT)
    .single();

  if (saveError) {
    console.error('保存点名记录失败:', saveError.message);
    if (saveError.code === '23505') {
      throw new AttendanceError('您已完成点名，请勿重复提交', 400);
    }
    throw new AttendanceError('点名失败，请稍后重试', 500);
  }

  await setSessionStatus(session.id, 'open');

  return {
    record: mapRecord(saved as unknown as JoinedRecordRow, config),
    alreadyCheckedIn: false,
  };
}

export async function getStudentAttendanceRecords(
  profileId: string
): Promise<AttendanceRecord[]> {
  const admin = getSupabaseAdminClient();
  const config = await getAttendanceConfig();
  const { data, error } = await admin
    .from('attendance_records')
    .select(RECORD_SELECT)
    .eq('student_id', profileId)
    .neq('status', 'pending')
    .order('check_in_at', { ascending: false });

  if (error) {
    console.error('读取学生点名记录失败:', error.message);
    throw new Error('读取点名记录失败');
  }

  return ((data ?? []) as unknown as JoinedRecordRow[]).map((row) =>
    mapRecord(row, config)
  );
}

export async function getStudentAttendanceRecordsByEmail(
  email: string
): Promise<AttendanceRecord[]> {
  const admin = getSupabaseAdminClient();
  const config = await getAttendanceConfig();
  const { data, error } = await admin
    .from('attendance_records')
    .select(RECORD_SELECT)
    .eq('student_email', email.trim().toLowerCase())
    .order('check_in_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('读取学生点名记录失败:', error.message);
    throw new Error('读取点名记录失败');
  }

  return ((data ?? []) as unknown as JoinedRecordRow[]).map((row) =>
    mapRecord(row, config)
  );
}

export async function createOrUpdateManualRecord(input: {
  config: AttendanceConfig;
  sessionNumber: 1 | 2;
  weekNumber: number;
  profile: StudentProfileRow;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}): Promise<AttendanceRecord> {
  const session = await ensureAttendanceSession({
    config: input.config,
    weekNumber: input.weekNumber,
    sessionNumber: input.sessionNumber,
  });

  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('attendance_records')
    .upsert(
      {
        session_id: session.id,
        student_id: input.profile.id,
        student_name: studentDisplayName(input.profile),
        student_email: input.profile.email || '',
        check_in_at: now,
        status: input.status,
        notes: input.notes || '',
        updated_at: now,
      },
      { onConflict: 'session_id,student_id' }
    )
    .select(RECORD_SELECT)
    .single();

  if (error) {
    console.error('保存点名记录失败:', error.message);
    throw new Error('保存点名记录失败');
  }

  return mapRecord(data as unknown as JoinedRecordRow, input.config);
}

export async function updateRecordStatus(input: {
  recordId: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}): Promise<AttendanceRecord> {
  const admin = getSupabaseAdminClient();
  const config = await getAttendanceConfig();
  const { data, error } = await admin
    .from('attendance_records')
    .update({
      status: input.status,
      check_in_at: new Date().toISOString(),
      ...(input.notes ? { notes: input.notes } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.recordId)
    .select(RECORD_SELECT)
    .maybeSingle();

  if (error) {
    console.error('更新点名状态失败:', error.message);
    throw new Error('更新点名状态失败');
  }
  if (!data) {
    throw new AttendanceError('点名记录不存在', 404);
  }

  return mapRecord(data as unknown as JoinedRecordRow, config);
}

export async function getSessionStats(sessionId: string): Promise<{
  total: number;
  pending: number;
  present: number;
  late: number;
  absent: number;
}> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('attendance_records')
    .select('status')
    .eq('session_id', sessionId);

  if (error) {
    console.error('统计点名记录失败:', error.message);
    throw new Error('统计点名记录失败');
  }

  const stats = { total: 0, pending: 0, present: 0, late: 0, absent: 0 };
  for (const row of data ?? []) {
    const status = String(row.status) as AttendanceStatus;
    stats.total += 1;
    if (
      status === 'pending' ||
      status === 'present' ||
      status === 'late' ||
      status === 'absent'
    ) {
      stats[status] += 1;
    }
  }
  return stats;
}

export function generateAttendanceCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
