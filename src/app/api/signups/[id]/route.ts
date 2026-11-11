import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

const ALLOWED_STATUSES = new Set([
  'pending',
  'confirmed',
  'cancelled',
  'attended',
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const status = typeof body.status === 'string' ? body.status : '';

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { success: false, error: '无效的报名状态' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from('signups')
      .update({ status })
      .eq('id', id)
      .select('id, status')
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      return NextResponse.json(
        { success: false, error: '报名记录不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      signup: data,
    });
  } catch (error) {
    console.error('Failed to update signup:', error);
    return NextResponse.json(
      { success: false, error: '更新报名状态失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const admin = getSupabaseAdminClient();
    // The signups trigger recalculates activities.signup_count automatically.
    const { error } = await admin.from('signups').delete().eq('id', id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete signup:', error);
    return NextResponse.json(
      { success: false, error: '删除报名失败' },
      { status: 500 }
    );
  }
}
