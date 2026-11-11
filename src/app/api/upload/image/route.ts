import { NextRequest, NextResponse } from 'next/server';
import {
  deleteImage,
  getImageUrl,
  uploadImage,
} from '@/services/storage.service';
import { requireAdminSession } from '@/lib/admin-session';

export async function POST(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: '未提供文件' }, { status: 400 });
    }

    const path = await uploadImage(file, 'public-assets', 'uploads');
    return NextResponse.json({
      success: true,
      fileId: path,
      url: getImageUrl(path),
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('上传错误:', err);
    return NextResponse.json(
      { error: err.message || '上传失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { fileId } = body;
    if (!fileId) {
      return NextResponse.json({ error: '未提供文件 ID' }, { status: 400 });
    }
    await deleteImage(fileId);
    return NextResponse.json({ success: true, message: '文件删除成功' });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('删除错误:', err);
    return NextResponse.json(
      { error: err.message || '删除失败' },
      { status: 500 }
    );
  }
}
