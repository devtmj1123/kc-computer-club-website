import { NextRequest, NextResponse } from 'next/server';
import { getImageUrl, uploadImage } from '@/services/storage.service';
import { requireAdminSession } from '@/lib/admin-session';

export async function POST(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: '文件未提供' }, { status: 400 });
    }

    const path = await uploadImage(file, 'public-assets', 'uploads');
    return NextResponse.json({
      success: true,
      fileId: path,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      url: getImageUrl(path),
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: err.message || '文件上传失败' },
      { status: 500 }
    );
  }
}
