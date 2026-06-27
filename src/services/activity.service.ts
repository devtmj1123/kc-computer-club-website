import { Client, Databases, Query } from 'appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

export interface Activity {
  $id: string;
  title: string;
  description: string;
  category: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants?: number;
  currentParticipants: number;
  signupDeadline: string;
  signupFormFields: string;
  organizer: string;
  organizerId: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  visibility: 'public' | 'internal';
  coverImage?: string;
  allowedGrades?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityInput {
  title: string;
  description: string;
  category: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants?: number;
  currentParticipants?: number;
  signupDeadline: string;
  signupFormFields?: string;
  organizer: string;
  organizerId: string;
  status: 'draft' | 'published';
  visibility?: 'public' | 'internal';
  coverImage?: string | null;
  allowedGrades?: string | null;
}

export interface UpdateActivityInput {
  title?: string;
  description?: string;
  category?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  signupDeadline?: string;
  signupFormFields?: string;
  organizer?: string;
  organizerId?: string;
  status?: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  visibility?: 'public' | 'internal';
  coverImage?: string | null;
  allowedGrades?: (string | null);
}

export const activityService = {
  async getAllActivities(onlyPublished: boolean = false, visibility: 'public' | 'all' = 'all'): Promise<Activity[]> {
    try {
      const queries: ReturnType<typeof Query.equal>[] = [];

      if (onlyPublished) {
        queries.push(Query.equal('status', 'published'));
      }

      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'activities',
        queries
      );
      let activities = (response.documents as unknown as Activity[]) || [];

      if (visibility === 'public') {
        activities = activities.filter(activity =>
          activity.visibility !== 'internal'
        );
      }

      return activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      throw error;
    }
  },

  async getActivityById(id: string): Promise<Activity> {
    try {
      const response = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'activities',
        id
      );
      return response as unknown as Activity;
    } catch (error) {
      console.error(`Failed to fetch activity ${id}:`, error);
      throw error;
    }
  },

  async createActivity(input: CreateActivityInput): Promise<Activity> {
    try {
      const now = new Date().toISOString();
      const response = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'activities',
        'unique()',
        {
          title: input.title,
          description: input.description,
          category: input.category,
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location,
          maxParticipants: input.maxParticipants || 0,
          currentParticipants: input.currentParticipants || 0,
          signupDeadline: input.signupDeadline,
          signupFormFields: input.signupFormFields || JSON.stringify([]),
          organizer: input.organizer,
          organizerId: input.organizerId,
          status: input.status,
          visibility: input.visibility || 'public',
          coverImage: input.coverImage || undefined,
          allowedGrades: input.allowedGrades || undefined,
          createdAt: now,
          updatedAt: now,
        }
      );
      return response as unknown as Activity;
    } catch (error) {
      console.error('Failed to create activity:', error);
      throw error;
    }
  },

  async updateActivity(id: string, input: UpdateActivityInput): Promise<Activity> {
    try {
      const response = await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'activities',
        id,
        {
          ...input,
        }
      );
      return response as unknown as Activity;
    } catch (error) {
      console.error(`Failed to update activity ${id}:`, error);
      throw error;
    }
  },

  async deleteActivity(id: string): Promise<void> {
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'activities',
        id
      );
    } catch (error) {
      console.error(`Failed to delete activity ${id}:`, error);
      throw error;
    }
  },

  async searchActivities(query: string): Promise<Activity[]> {
    try {
      const allActivities = await this.getAllActivities();
      return allActivities.filter(
        (activity) =>
          activity.title.toLowerCase().includes(query.toLowerCase()) ||
          activity.location.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Failed to search activities:', error);
      throw error;
    }
  },

  async getActivitiesByCategory(category: string): Promise<Activity[]> {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'activities',
        [Query.equal('category', category), Query.equal('status', 'published')]
      );
      const activities = (response.documents as unknown as Activity[]) || [];
      return activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error(`Failed to fetch activities for category ${category}:`, error);
      throw error;
    }
  },

  async getActivitiesByStatus(status: string): Promise<Activity[]> {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'activities',
        [Query.equal('status', status)]
      );
      const activities = (response.documents as unknown as Activity[]) || [];
      return activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error(`Failed to fetch activities with status ${status}:`, error);
      throw error;
    }
  },

  async getUpcomingActivities(): Promise<Activity[]> {
    try {
      const now = new Date().toISOString();
      const allActivities = await this.getAllActivities(true);
      return allActivities.filter((activity) => activity.startTime >= now);
    } catch (error) {
      console.error('Failed to fetch upcoming activities:', error);
      throw error;
    }
  },

  async incrementRegisteredCount(id: string): Promise<Activity> {
    try {
      const activity = await this.getActivityById(id);
      return this.updateActivity(id, {
        currentParticipants: activity.currentParticipants + 1,
      });
    } catch (error) {
      console.error(`Failed to increment participant count for activity ${id}:`, error);
      throw error;
    }
  },

  async decrementRegisteredCount(id: string): Promise<Activity> {
    try {
      const activity = await this.getActivityById(id);
      return this.updateActivity(id, {
        currentParticipants: Math.max(0, activity.currentParticipants - 1),
      });
    } catch (error) {
      console.error(`Failed to decrement participant count for activity ${id}:`, error);
      throw error;
    }
  },
};
