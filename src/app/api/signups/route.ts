import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

const MAX_RESULTS = 500;

interface SignupFormData {
  fullName?: string;
  studentId?: string;
  grade?: string;
  additionalInfo?: string;
  userId?: string | null;
}

interface SignupRow {
  id: string;
  activity_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  student_no: string | null;
  grade: string | null;
  notes: string | null;
  status: string;
  form_data: SignupFormData | null;
  created_at: string;
  updated_at: string;
  activities?: { title: string } | null;
}

function parseFormData(raw: unknown): SignupFormData {
  return raw && typeof raw === 'object' ? (raw as SignupFormData) : {};
}

export async function GET(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');

    const admin = getSupabaseAdminClient();
    let query = admin
      .from('signups')
      .select(
        'id, activity_id, full_name, email, phone, student_no, grade, notes, status, form_data, created_at, updated_at, activities(title)'
      )
      .order('created_at', { ascending: false })
      .limit(MAX_RESULTS);

    if (activityId) {
      query = query.eq('activity_id', activityId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const signups = ((data ?? []) as unknown as SignupRow[]).map((row) => {
      const formData = parseFormData(row.form_data);
      return {
        $id: row.id,
        id: row.id,
        activityId: row.activity_id,
        activityTitle: row.activities?.title || '',
        studentName: row.full_name || formData.fullName || '',
        studentEmail: row.email,
        email: row.email,
        studentId: row.student_no || formData.studentId || '',
        grade: row.grade || formData.grade || '',
        phone: row.phone || '',
        notes: row.notes || '',
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      signups,
      total: signups.length,
    });
  } catch (error) {
    console.error('Failed to fetch signups:', error);
    return NextResponse.json(
      { success: false, error: '获取报名列表失败' },
      { status: 500 }
    );
  }
}
