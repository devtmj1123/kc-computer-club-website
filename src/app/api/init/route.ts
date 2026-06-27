import { Client, Databases } from 'node-appwrite';
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
    if (!endpoint || !projectId || !databaseId) {
      return Response.json(
        {
          error: 'Configuration Error',
          message: 'Missing required environment variables',
        },
        { status: 500 }
      );
    }
    if (!apiKey) {
      return Response.json(
        {
          error: 'Configuration Error',
          message: 'Missing APPWRITE_API_KEY environment variable',
        },
        { status: 500 }
      );
    }
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    const databases = new Databases(client);
    const collectionId = 'clubSettings';
    console.log('开始初始化数据库...');
    let collectionCreated = false;
    try {
      await databases.createCollection(
        databaseId,
        collectionId,
        '社团设置',
        []
      );
      collectionCreated = true;
      console.log('✓ clubSettings 集合创建成功');
    } catch (error: unknown) {
      const err = error as AppwriteError;
      if (err.code === 409) {
        console.log('✓ clubSettings 集合已存在');
        collectionCreated = true;
      } else {
        console.error('创建集合失败:', err.message);
        throw error;
      }
    }
    if (!collectionCreated) {
      throw new Error('Failed to create or verify collection');
    }
    const attributes = [
      { name: 'aboutTitle', type: 'string', size: 255 },
      { name: 'aboutDescription', type: 'string', size: 2000 },
      { name: 'aboutEmail', type: 'string', size: 255 },
      { name: 'aboutLocation', type: 'string', size: 255 },
      { name: 'aboutMeetingTime', type: 'string', size: 255 },
      { name: 'activeMembers', type: 'integer' },
      { name: 'yearlyActivities', type: 'integer' },
      { name: 'awardProjects', type: 'integer' },
      { name: 'partners', type: 'integer' },
      { name: 'githubUrl', type: 'string', size: 255 },
      { name: 'discordUrl', type: 'string', size: 255 },
      { name: 'instagramUrl', type: 'string', size: 255 },
      { name: 'youtubeUrl', type: 'string', size: 255 },
      { name: 'attendanceDayOfWeek', type: 'integer' },
      { name: 'attendanceSession1Start', type: 'string', size: 255 },
      { name: 'attendanceSession1Duration', type: 'integer' },
      { name: 'attendanceSession2Start', type: 'string', size: 255 },
      { name: 'attendanceSession2Duration', type: 'integer' },
      { name: 'attendanceWeekStartDate', type: 'string', size: 255 },
      { name: 'attendanceDebugMode', type: 'boolean' },
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
        } else if (attr.type === 'boolean') {
          await (databases as unknown as {
            createBooleanAttribute: (dbId: string, collId: string, key: string, required: boolean, defaultValue?: boolean) => Promise<unknown>;
          }).createBooleanAttribute(
            databaseId,
            collectionId,
            attr.name,
            false,
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
    console.log('✓ 数据库初始化完成');
    return Response.json({
      success: true,
      message: 'Database initialization completed',
      collection: collectionId,
      attributes: results,
    });
  } catch (error: unknown) {
    const err = error as AppwriteError;
    console.error('Database initialization error:', err);
    return Response.json(
      {
        error: 'Database initialization failed',
        message: err.message || 'Unknown error',
        code: err.code,
      },
      { status: 500 }
    );
  }
}