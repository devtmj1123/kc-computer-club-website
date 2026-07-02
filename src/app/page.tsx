'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { HeroSection } from '@/components/sections/HeroSection';
import { NoticesSection, EventsSection } from '@/components/sections/NoticesSection';
import AttendanceWidget from '@/components/attendance/AttendanceWidget';
import { decodeHtmlEntities } from '@/lib/utils';
interface Notice {
  id: string;
  title: string;
  summary: string;
  category: string;
  icon: string;
  iconColor: string;
  publishedAt: string | Date;
}
interface Activity {
  id: string;
  title: string;
  category: string;
  date: string | Date;
  time: string;
  location: string;
}
interface Project {
  id: string;
  title: string;
  description: string;
  contributors: number;
  repoUrl?: string;
}
export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [featuredProject, setFeaturedProject] = useState<{ title: string; contributors: number } | null>(null);
  const [clubStatus, setClubStatus] = useState<string>('正在招收新成员');
  const [clubSettings, setClubSettings] = useState<{ heroImage?: string; heroImageAlt?: string } | null>(null);
  useEffect(() => {
    const fetchClubSettings = async () => {
      try {
        const response = await fetch('/api/club-settings');
        if (response.ok) {
          const data = await response.json();
          setClubSettings({
            heroImage: data.heroImage,
            heroImageAlt: data.heroImageAlt,
          });
          if (data.recruitmentStatus) {
            setClubStatus(data.recruitmentStatus);
          }
        }
      } catch (error) {
        console.error('Failed to fetch club settings:', error);
      }
    };
    fetchClubSettings();
  }, []);
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await fetch('/api/notices?onlyPublished=true');
        if (response.ok) {
          const data = await response.json();
          const noticesData = data.notices || data;
          if (Array.isArray(noticesData) && noticesData.length > 0) {
            const formattedNotices = noticesData
              .slice(0, 3)
              .map((notice: Record<string, unknown>) => ({
                id: (notice.$id || notice.id) as string,
                title: decodeHtmlEntities(notice.title as string),
                summary: decodeHtmlEntities(((notice.content as string)?.substring(0, 100) || '') as string),
                category: (notice.category || '其他') as string,
                icon: mapCategoryToIcon((notice.category || '其他') as string),
                iconColor: mapCategoryToColor((notice.category || '其他') as string),
                publishedAt: (notice.publishedAt || notice.createdAt || notice.$createdAt) as string,
              }));
            setNotices(formattedNotices);
          }
        }
      } catch (error) {
        console.error('Failed to fetch notices:', error);
      }
    };
    fetchNotices();
  }, []);
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activities?onlyPublished=true');
        if (response.ok) {
          const data = await response.json();
          const activitiesData = data.activities || data;
          if (Array.isArray(activitiesData) && activitiesData.length > 0) {
            const formattedActivities = activitiesData
              .slice(0, 2)
              .map((activity: Record<string, unknown>) => ({
                id: (activity.$id || activity.id) as string,
                title: activity.title as string,
                category: (activity.category || '活动') as string,
                date: (activity.startTime || new Date()) as string | Date,
                time: activity.startTime ? new Date(activity.startTime as string).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '待定',
                location: (activity.location || '待定') as string,
              }));
            setActivities(formattedActivities);
          }
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      }
    };
    fetchActivities();
  }, []);
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          const projectsArray = data.projects || data;
          if (Array.isArray(projectsArray) && projectsArray.length > 0) {
            const formattedProjects = projectsArray
              .slice(0, 3)
              .map((project: any) => ({
                id: project.$id || project.id || project.projectId,
                title: project.title,
                description: project.description,
                contributors: (project.members?.length || 0) + 1,
                repoUrl: project.projectLink,
              }));
            setProjects(formattedProjects);
            const approvedProjects = projectsArray.filter((p: any) => p.status === 'approved');
            const featuredProj = approvedProjects.length > 0 ? approvedProjects[0] : projectsArray[0];
            if (featuredProj) {
              setFeaturedProject({
                title: featuredProj.title || '待定',
                contributors: (featuredProj.members?.length || 0) + 1,
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };
    fetchProjects();
  }, []);
  return (
    <StudentLayout>
      <main className="flex-1 w-full max-w-300 mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        <HeroSection
          clubName="电脑学会"
          statusText={clubStatus}
          heroImage={clubSettings?.heroImage || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop"}
          heroImageAlt={clubSettings?.heroImageAlt || "Tech Club Hero"}
        />
        {user && !('role' in user) && (
          <AttendanceWidget
            studentId={user.id}
            studentName={user.name}
            studentEmail={user.email}
          />
        )}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NoticesSection notices={notices} />
          <EventsSection activities={activities} />
        </section>
      </main>
    </StudentLayout>
  );
}
function mapCategoryToIcon(category: string): string {
  const iconMap: Record<string, string> = {
    '系统': 'warning',
    '新闻': 'emoji_events',
    '更新': 'science',
    '活动': 'calendar_month',
    '紧急': 'priority_high',
    '公告': 'campaign',
    default: 'info',
  };
  return iconMap[category] || iconMap.default;
}
function mapCategoryToColor(category: string): string {
  const colorMap: Record<string, string> = {
    '系统': 'orange',
    '新闻': 'green',
    '更新': 'blue',
    '活动': 'purple',
    '紧急': 'red',
    '公告': 'green',
    default: 'blue',
  };
  return colorMap[category] || colorMap.default;}