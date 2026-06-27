import { Client, Databases } from 'node-appwrite';
import { NextResponse } from 'next/server';
interface AppwriteError {
  code?: number;
  type?: string;
  message?: string;
}
export async function GET() {
  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    if (!endpoint || !projectId || !databaseId || !apiKey) {
      return NextResponse.json(
        {
          error: 'Missing environment variables',
          message: 'Please configure Appwrite environment variables',
        },
        { status: 500 }
      );
    }
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    const databases = new Databases(client);
    const collectionId = 'attendance';
    let collectionCreated = false;
    try {
      await databases.createCollection(
        databaseId,
        collectionId,
        '点名系统',
        []
      );
      collectionCreated = true;
      console.log('✓ attendance 集合创建成功');
    } catch (error: unknown) {
      const err = error as AppwriteError;
      if (err.code === 409) {
        console.log('✓ attendance 集合已存在');
        collectionCreated = true;
      } else {
        console.error('创建集合失败:', err.message);
        throw error;
      }
    }
    if (!collectionCreated) {
      throw new Error('Failed to create or verify attendance collection');
    }
    const attributes = [
      { name: 'studentId', type: 'string', size: 255 },
      { name: 'studentName', type: 'string', size: 255 },
      { name: 'studentEmail', type: 'email', size: 255 },
      { name: 'checkInTime', type: 'datetime' },
      { name: 'sessionTime', type: 'string', size: 50 }, 
      { name: 'weekNumber', type: 'integer' },
      { name: 'status', type: 'string', size: 50 }, 
      { name: 'notes', type: 'string', size: 500 },
    ];
    const results: Array<{ name: string; status: 'created' | 'exists' | 'error'; error?: string }> = [];
    for (const attr of attributes) {
      try {
        if (attr.type === 'integer') {
          await (databases as unknown as {
            createIntegerAttribute: (dbId: string, collId: string, key: string, required: boolean) => Promise<unknown>;
          }).createIntegerAttribute(
            databaseId,
            collectionId,
            attr.name,
            false
          );
        } else if (attr.type === 'email') {
          await (databases as unknown as {
            createEmailAttribute: (dbId: string, collId: string, key: string, required: boolean) => Promise<unknown>;
          }).createEmailAttribute(
            databaseId,
            collectionId,
            attr.name,
            false
          );
        } else if (attr.type === 'datetime') {
          await (databases as unknown as {
            createDatetimeAttribute: (dbId: string, collId: string, key: string, required: boolean) => Promise<unknown>;
          }).createDatetimeAttribute(
            databaseId,
            collectionId,
            attr.name,
            false
          );
        } else {
          await (databases as unknown as {
            createStringAttribute: (dbId: string, collId: string, key: string, size: number, required: boolean) => Promise<unknown>;
          }).createStringAttribute(
            databaseId,
            collectionId,
            attr.name,
            attr.size || 255,
            false
          );
        }
        results.push({ name: attr.name, status: 'created' });
        console.log(`✓ ${attr.name}`);
      } catch (error: unknown) {
        const err = error as AppwriteError;
        if (err.code === 409) {
          results.push({ name: attr.name, status: 'exists' });
          console.log(`✓ ${attr.name} (已存在)`);
        } else {
          results.push({ name: attr.name, status: 'error', error: err.message || 'Unknown error' });
          console.error(`✗ ${attr.name}: ${err.message}`);
        }
      }
    }
    console.log('✓ Attendance 集合初始化完成');
    return NextResponse.json({
      success: true,
      message: 'Attendance collection initialization completed',
      collection: collectionId,
      attributes: results,
    });
  } catch (error: unknown) {
    const err = error as AppwriteError;
    console.error('Attendance 初始化错误:', err);
    return NextResponse.json(
      {
        error: 'Attendance initialization failed',
        message: err.message || 'Unknown error',
        code: err.code,
      },
      { status: 500 }
    );
  }
}