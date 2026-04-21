/* eslint-disable prettier/prettier */
import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases } from '@/services/appwrite-server';
import { ID } from 'node-appwrite';

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const ATTENDANCE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ATTENDANCE_COLLECTION || 'attendance';

/**
 * POST /api/attendance/record
 * Admin 为 pending 学生创建点名记录
 * 
 * Body: {
 *   studentId: string,
 *   studentName: string,
 *   studentEmail: string,
 *   sessionTime: string,        // '15:20' | '16:35'
 *   sessionNumber: number,      // 1 或 2
 *   weekNumber: number,
 *   status: 'present' | 'absent' | 'late',
 *   notes?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, studentName, studentEmail, sessionTime, sessionNumber, weekNumber, status, notes } = body;

    if (!studentId || !studentName || !studentEmail || !weekNumber || !status) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    if (!['present', 'absent', 'late'].includes(status)) {
      return NextResponse.json(
        { error: '状态必须是 present（出席）, absent（缺席）或 late（迟到）' },
        { status: 400 }
      );
    }

    // 创建新的点名记录
    const now = new Date().toISOString();
    // 使用 uniqueKey 作为文档ID：studentId_sessionNumber_weekNumber
    const sessNum = sessionNumber || 1;
    const uniqueKey = `${studentId}_${sessNum}_${weekNumber}`;
    
    const newRecord = await serverDatabases.createDocument(
      APPWRITE_DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      uniqueKey,  // 使用 uniqueKey 作为文档ID
      {
        studentId,
        studentName,
        studentEmail,
        sessionTime: sessionTime || '',
        weekNumber,
        status,
        notes: notes || (status === 'late' ? 'Admin 标记为迟到' : ''),
        checkInTime: now,
        createdAt: now,
        uniqueKey,  // 保存 uniqueKey 字段以便查询
      }
    );

    console.log(`[CREATE-RECORD] 为学生 ${studentName} 创建点名记录，状态: ${status}`);

    return NextResponse.json({
      success: true,
      message: `点名记录已创建，状态为${
        status === 'present' ? '出席' : status === 'late' ? '迟到' : '缺席'
      }`,
      record: {
        id: newRecord.$id,
        studentName: newRecord.studentName,
        status: newRecord.status,
        notes: newRecord.notes,
        sessionTime: newRecord.sessionTime,
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('[CREATE-RECORD] 错误:', err);
    return NextResponse.json(
      { error: err.message || '创建记录失败' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/attendance/record
 * Admin 修改学生的点名状态
 * 
 * Body: {
 *   recordId: string,           // 点名记录ID (格式: studentId_sessionTime_weekNumber)
 *   status: 'present' | 'absent' | 'late',  // 新状态
 *   notes?: string,             // 备注
 *   studentName?: string,       // 学生姓名（创建新记录时需要）
 *   studentEmail?: string       // 学生邮箱（创建新记录时需要）
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId, status, notes, studentName, studentEmail } = body;

    if (!recordId || !status) {
      return NextResponse.json(
        { error: '缺少必要参数：recordId, status' },
        { status: 400 }
      );
    }

    if (!['present', 'absent', 'late'].includes(status)) {
      return NextResponse.json(
        { error: '状态必须是 present（出席）, absent（缺席）或 late（迟到）' },
        { status: 400 }
      );
    }

    // 尝试更新现有记录
    try {
      const updateData: Record<string, unknown> = {
        status,
        checkInTime: new Date().toISOString(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      const updatedRecord = await serverDatabases.updateDocument(
        APPWRITE_DATABASE_ID,
        ATTENDANCE_COLLECTION_ID,
        recordId,
        updateData
      );

      console.log(`[UPDATE-STATUS] 记录 ${recordId} 状态已更改为 ${status}`);

      return NextResponse.json({
        success: true,
        message: `点名状态已更新为${
          status === 'present' ? '出席' : status === 'late' ? '迟到' : '缺席'
        }`,
        record: {
          id: updatedRecord.$id,
          studentName: updatedRecord.studentName,
          status: updatedRecord.status,
          notes: updatedRecord.notes,
          sessionTime: updatedRecord.sessionTime,
        },
      });
    } catch (updateError: unknown) {
      const err = updateError as { code?: number };
      
      // 如果记录不存在（404），则创建新记录
      if (err.code === 404) {
        // 解析 recordId 获取 studentId, sessionNumber, weekNumber
        // 格式: studentId_sessionNumber_weekNumber (如: 12345_1_3)
        const parts = recordId.split('_');
        if (parts.length < 3) {
          return NextResponse.json(
            { error: '无效的记录ID格式' },
            { status: 400 }
          );
        }

        const studentId = parts[0];
        const sessionNumber = parseInt(parts[1]);  // 1 或 2
        const weekNumber = parseInt(parts[2]);

        if (!studentName || !studentEmail) {
          return NextResponse.json(
            { error: '创建新记录需要提供 studentName 和 studentEmail' },
            { status: 400 }
          );
        }

        const now = new Date().toISOString();

        // 获取考勤配置以确定正确的 sessionTime
        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
        const CLUB_SETTINGS_COLLECTION_ID = 'clubSettings';
        const ATTENDANCE_CONFIG_DOC_ID = 'attendance_config';

        let sessionTimeStr = sessionNumber === 1 ? '15:20' : '16:35';  // 默认值

        try {
          const settingsDoc = await serverDatabases.getDocument(
            databaseId,
            CLUB_SETTINGS_COLLECTION_ID,
            ATTENDANCE_CONFIG_DOC_ID
          );

          if (sessionNumber === 1 && settingsDoc.attendanceSession1Start) {
            const s1 = JSON.parse(String(settingsDoc.attendanceSession1Start));
            sessionTimeStr = `${s1.hour}:${String(s1.minute).padStart(2, '0')}`;
          } else if (sessionNumber === 2 && settingsDoc.attendanceSession2Start) {
            const s2 = JSON.parse(String(settingsDoc.attendanceSession2Start));
            sessionTimeStr = `${s2.hour}:${String(s2.minute).padStart(2, '0')}`;
          }
        } catch (configErr) {
          console.warn(`[CREATE-FROM-PENDING] 无法获取时段配置，使用默认值: ${sessionTimeStr}`, configErr);
        }

        const newRecord = await serverDatabases.createDocument(
          databaseId,
          'attendance',
          recordId,  // 使用 uniqueKey 作为文档ID
          {
            studentId,
            studentName,
            studentEmail,
            sessionTime: sessionTimeStr,  // 使用正确的时间字符串，而不是 session${sessionNumber}
            weekNumber,
            status,
            notes: notes || '',
            checkInTime: now,
            createdAt: now,
            uniqueKey: recordId,  // 保存 uniqueKey 字段
          }
        );

        console.log(`[CREATE-FROM-PENDING] 为学生 ${studentName} 创建点名记录，状态: ${status}, 时段: session${sessionNumber}, 时间: ${sessionTimeStr}`);

        return NextResponse.json({
          success: true,
          message: `点名记录已创建，状态为${
            status === 'present' ? '出席' : status === 'late' ? '迟到' : '缺席'
          }`,
          record: {
            id: newRecord.$id,
            studentName: newRecord.studentName,
            status: newRecord.status,
            notes: newRecord.notes,
            sessionTime: newRecord.sessionTime,
          },
        });
      }
      
      throw updateError;
    }
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('[UPDATE-STATUS] 错误:', err);
    return NextResponse.json(
      { error: err.message || '更新状态失败' },
      { status: 500 }
    );
  }
}
