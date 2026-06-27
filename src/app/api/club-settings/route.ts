import { Client, Databases } from 'appwrite';
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
const databases = new Databases(client);
export interface ClubSettings {
  id: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutEmail: string;
  aboutLocation: string;
  aboutMeetingTime: string;
  website?: string;
  logoUrl?: string;
  heroImage?: string;
  heroImageAlt?: string;
  activeMembers: number;
  yearlyActivities: number;
  awardProjects: number;
  partners: number;
  githubUrl: string;
  discordUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
}
export async function GET() {
  try {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      'clubSettings'
    );
    if (response.documents && response.documents.length > 0) {
      return Response.json(response.documents[0]);
    }
    return Response.json({
      error: 'No settings found',
      message: 'Please create club settings first',
    });
  } catch (error: unknown) {
    const err = error as { code?: number; type?: string; message?: string };
    console.error('Failed to fetch club settings:', error);
    if (err.code === 404 || err.type === 'collection_not_found') {
      return Response.json(
        {
          error: 'Collection not found',
          message: 'Please initialize the database first by visiting /api/init',
          initUrl: '/api/init',
        },
        { status: 404 }
      );
    }
    return Response.json(
      { error: 'Failed to fetch club settings', message: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    const settings: Partial<ClubSettings> = await request.json();
    const existing = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      'clubSettings'
    );
    const sanitizedSettings = Object.fromEntries(
      Object.entries(settings).filter(([_, value]) => value !== undefined && value !== null)
    );
    let result;
    if (existing.documents && existing.documents.length > 0) {
      result = await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'clubSettings',
        existing.documents[0].$id,
        sanitizedSettings
      );
    } else {
      result = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'clubSettings',
        'unique()',
        sanitizedSettings
      );
    }
    return Response.json(result);
  } catch (error: unknown) {
    const err = error as { code?: number; type?: string; message?: string };
    console.error('Failed to save club settings:', error);
    if (err.code === 404 || err.type === 'collection_not_found') {
      return Response.json(
        {
          error: 'Collection not found',
          message: 'Please initialize the database first by visiting /api/init',
          initUrl: '/api/init',
        },
        { status: 404 }
      );
    }
    if (err.message?.includes('Unknown attribute')) {
      return Response.json(
        {
          error: 'Invalid document structure: ' + err.message,
          message: 'One or more fields do not exist in the database schema. Please run the collection initialization script.',
        },
        { status: 400 }
      );
    }
    return Response.json(
      { error: 'Failed to save club settings', message: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}