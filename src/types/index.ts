export interface User {
  userId: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  adminId: string;
  userId: string;
  username: string;
  passwordHash: string;
  permissions?: string;
  lastLogin?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Notice {
  noticeId: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  status: 'draft' | 'published';
  coverImage?: string;
  tags?: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  activityId: string;
  title: string;
  description: string;
  category:
    | '编程'
    | 'AI'
    | '网页'
    | '比赛'
    | '工作坊'
    | '讲座'
    | '其他';
  organizer: string;
  organizerId: string;
  location: string;
  startTime: string;
  endTime: string;
  signupDeadline: string;
  maxParticipants?: number;
  currentParticipants: number;
  signupFormFields: SignupFormField[];
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  coverImage?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignupFormField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'date';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface Signup {
  signupId: string;
  activityId: string;
  formData: Record<string, any>;
  email: string;
  phone?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  commentId: string;
  contentType: 'notice' | 'activity';
  contentId: string;
  nickname: string;
  email?: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClubInfo {
  infoId: string;
  clubName: string;
  mission: string;
  vision: string;
  description: string;
  categories: string[];
  contactEmail: string;
  contactPhone?: string;
  logo?: string;
  bannerImage?: string;
  updatedAt: string;
}

export interface AIChat {
  chatId: string;
  sessionId: string;
  userMessage: string;
  aiResponse: string;
  contextUsed?: string[];
  userType: 'student' | 'admin';
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  assignee?: string;
}

export interface ProjectChecklist {
  checklistId: string;
  projectId: string;
  title: string;
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: 'leader' | 'member' | 'tech_lead' | 'design_lead';
  joinedAt: string;
}

export interface Project {
  projectId: string;
  teamName: string;
  title: string;
  description: string;
  category: 'web' | 'mobile' | 'ai' | 'game' | 'iot' | 'security' | 'data' | 'other';
  objectives?: string;
  timeline?: string;
  resources?: string;
  projectLink?: string;
  members: ProjectMember[];
  leaderId: string;
  leaderEmail: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision';
  adminFeedback?: string;
  checklist?: ProjectChecklist;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  teamName: string;
  title: string;
  description: string;
  category: string;
  objectives?: string;
  timeline?: string;
  resources?: string;
  projectLink?: string;
  members: Omit<ProjectMember, 'joinedAt'>[];
  leaderId: string;
  leaderEmail: string;
}

export interface UpdateProjectInput {
  teamName?: string;
  title?: string;
  description?: string;
  category?: string;
  objectives?: string;
  timeline?: string;
  resources?: string;
  projectLink?: string;
  members?: Omit<ProjectMember, 'joinedAt'>[];
  status?: 'pending' | 'approved' | 'rejected' | 'revision';
  adminFeedback?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FormState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  admin: Admin | null;
  token?: string;
  isLoading: boolean;
  error?: string;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
