'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NeumorphicSelect } from '@/components/ui/NeumorphicSelect';
import { useAuth } from '@/contexts/AuthContext';
const DEFAULT_CLUB_INFO = {
  name: '康中电脑学会',
  description:
    '我们是一群热爱科技的学生，致力于探索编程、人工智能、网络安全等领域。无论你是编程新手还是技术大神，都欢迎加入我们！',
  email: 'computerclub@school.edu.my',
  location: '电脑室 A304，科学楼三楼',
  meetingTime: '每周五 下午 4:00 - 6:00',
  socialLinks: {
    github: 'https://github.com/computerclub',
    discord: 'https://discord.gg/computerclub',
    instagram: 'https://instagram.com/computerclub',
    youtube: 'https://youtube.com/@computerclub',
  },
};
const faqs = [
  {
    icon: 'help',
    question: '如何成为社员？',
    answer:
      '只需在"加入社团"页面填写申请表，并参加我们下一次的周五活动即可完成注册。我们全学期都开放招新！',
  },
  {
    icon: 'code',
    question: '需要有编程经验吗？',
    answer:
      '完全不需要！我们欢迎各种技能水平的学生，从零基础到高级开发者。我们会定期举办针对初学者的工作坊。',
  },
  {
    icon: 'event',
    question: '活动信息在哪里发布？',
    answer:
      '请查看本网站的"活动"页面获取本学期的活动安排，或加入我们的 Discord 服务器获取实时公告和提醒。',
  },
  {
    icon: 'groups',
    question: '非计算机专业的学生可以加入吗？',
    answer:
      '当然可以！科技影响着每一个领域。无论你学的是生物、艺术还是商科，只要对计算机有兴趣，都欢迎加入我们！',
  },
];
const subjectOptions = [
  { value: '', label: '选择主题' },
  { value: 'membership', label: '社员咨询' },
  { value: 'events', label: '活动与比赛' },
  { value: 'workshop', label: '工作坊提案' },
  { value: 'collaboration', label: '合作洽谈' },
  { value: 'other', label: '其他问题' },
];
export default function AboutPage() {
  const { user, isStudent, isLoading } = useAuth();
  const router = useRouter();
  const [clubInfo, setClubInfo] = useState(DEFAULT_CLUB_INFO);
  const [stats, setStats] = useState({ activeMembers: 50, yearlyActivities: 20, awardProjects: 10, partners: 5 });
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/club-settings');
        if (response.ok) {
          const settings = await response.json();
          setClubInfo({
            name: settings.aboutTitle || DEFAULT_CLUB_INFO.name,
            description: settings.aboutDescription || DEFAULT_CLUB_INFO.description,
            email: settings.aboutEmail || DEFAULT_CLUB_INFO.email,
            location: settings.aboutLocation || DEFAULT_CLUB_INFO.location,
            meetingTime: settings.aboutMeetingTime || DEFAULT_CLUB_INFO.meetingTime,
            socialLinks: {
              github: settings.githubUrl || DEFAULT_CLUB_INFO.socialLinks.github,
              discord: settings.discordUrl || DEFAULT_CLUB_INFO.socialLinks.discord,
              instagram: settings.instagramUrl || DEFAULT_CLUB_INFO.socialLinks.instagram,
              youtube: settings.youtubeUrl || DEFAULT_CLUB_INFO.socialLinks.youtube,
            },
          });
          setStats({
            activeMembers: settings.activeMembers || 50,
            yearlyActivities: settings.yearlyActivities || 20,
            awardProjects: settings.awardProjects || 10,
            partners: settings.partners || 5,
          });
        } else {
          const stored = localStorage.getItem('clubSettings');
          if (stored) {
            const settings = JSON.parse(stored);
            setClubInfo({
              name: settings.aboutTitle || DEFAULT_CLUB_INFO.name,
              description: settings.aboutDescription || DEFAULT_CLUB_INFO.description,
              email: settings.aboutEmail || DEFAULT_CLUB_INFO.email,
              location: settings.aboutLocation || DEFAULT_CLUB_INFO.location,
              meetingTime: settings.aboutMeetingTime || DEFAULT_CLUB_INFO.meetingTime,
              socialLinks: {
                github: settings.githubUrl || DEFAULT_CLUB_INFO.socialLinks.github,
                discord: settings.discordUrl || DEFAULT_CLUB_INFO.socialLinks.discord,
                instagram: settings.instagramUrl || DEFAULT_CLUB_INFO.socialLinks.instagram,
                youtube: settings.youtubeUrl || DEFAULT_CLUB_INFO.socialLinks.youtube,
              },
            });
            setStats({
              activeMembers: settings.activeMembers || 50,
              yearlyActivities: settings.yearlyActivities || 20,
              awardProjects: settings.awardProjects || 10,
              partners: settings.partners || 5,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load club settings:', error);
      }
    };
    loadSettings();
  }, []);
  if (isLoading) {
    return (
      <StudentLayout>
        <main className="grow flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#137fec]"></div>
            <p className="mt-4 text-[var(--text-secondary)]">正在加载...</p>
          </div>
        </main>
      </StudentLayout>
    );
  }
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setShowSuccess(true);
    setFormData({
      name: '',
      studentId: '',
      email: '',
      subject: '',
      message: '',
    });
    setTimeout(() => setShowSuccess(false), 3000);
  };
  return (
    <StudentLayout>
      <main className="grow py-8 px-4 md:px-10 lg:px-20">
        <div className="max-w-300 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 pt-8">
            <div className="lg:col-span-5 flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
                  联系我们
                </h1>
                <p className="text-[var(--text-secondary)] text-base md:text-lg leading-relaxed">
                  有关于黑客马拉松、工作坊或社员资格的问题？欢迎随时联系我们或来我们的社团教室拜访。
                </p>
              </div>
              <div className="flex flex-col border-t border-b border-[var(--border)]">
                <div className="py-6 flex items-start gap-4 border-b border-[var(--border)]">
                  <div className="bg-[var(--surface-hover)] p-3 rounded-full shrink-0">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm font-medium mb-1">邮箱</p>
                    <a
                      href={`mailto:${clubInfo.email}`}
                      className="text-lg font-semibold hover:text-primary transition-colors"
                    >
                      {clubInfo.email}
                    </a>
                  </div>
                </div>
                <div className="py-6 flex items-start gap-4 border-b border-[var(--border)]">
                  <div className="bg-[var(--surface-hover)] p-3 rounded-full shrink-0">
                    <span className="material-symbols-outlined">location_on</span>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm font-medium mb-1">地点</p>
                    <p className="text-lg font-semibold">{clubInfo.location}</p>
                  </div>
                </div>
                <div className="py-6 flex items-start gap-4">
                  <div className="bg-[var(--surface-hover)] p-3 rounded-full shrink-0">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm font-medium mb-1">活动时间</p>
                    <p className="text-lg font-semibold">{clubInfo.meetingTime}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium mb-4">关注我们</p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={clubInfo.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 bg-[var(--surface-hover)] hover:bg-primary/20 px-4 py-3 rounded-lg transition-all duration-300"
                  >
                    <span className="material-symbols-outlined group-hover:text-primary">code</span>
                    <span className="text-sm font-bold group-hover:text-primary">GitHub</span>
                  </a>
                  <a
                    href={clubInfo.socialLinks.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 bg-[var(--surface-hover)] hover:bg-primary/20 px-4 py-3 rounded-lg transition-all duration-300"
                  >
                    <span className="material-symbols-outlined group-hover:text-primary">
                      forum
                    </span>
                    <span className="text-sm font-bold group-hover:text-primary">Discord</span>
                  </a>
                  <a
                    href={clubInfo.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 bg-[var(--surface-hover)] hover:bg-primary/20 px-4 py-3 rounded-lg transition-all duration-300"
                  >
                    <span className="material-symbols-outlined group-hover:text-primary">
                      photo_camera
                    </span>
                    <span className="text-sm font-bold group-hover:text-primary">Instagram</span>
                  </a>
                  <a
                    href={clubInfo.socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 bg-[var(--surface-hover)] hover:bg-primary/20 px-4 py-3 rounded-lg transition-all duration-300"
                  >
                    <span className="material-symbols-outlined group-hover:text-primary">
                      play_circle
                    </span>
                    <span className="text-sm font-bold group-hover:text-primary">YouTube</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="bg-[var(--surface)] rounded-2xl p-6 md:p-8 border border-[var(--border)]">
                <h3 className="text-2xl font-bold mb-6 text-[var(--foreground)]">发送消息</h3>
                {showSuccess && (
                  <div className="mb-6 p-4 bg-primary/20 border border-primary/30 rounded-xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                    <p className="text-sm text-primary">消息已成功发送！我们会尽快回复您。</p>
                  </div>
                )}
                {!user && (
                  <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-400">info</span>
                    <p className="text-sm text-blue-400">您正在以访客身份发送消息，无需登录。</p>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                      label="姓名"
                      placeholder="请输入您的姓名"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      leftIcon="badge"
                      required
                    />
                    <Input
                      label="学号（选填）"
                      placeholder="请输入您的学号"
                      value={formData.studentId}
                      onChange={(e) => handleInputChange('studentId', e.target.value)}
                      leftIcon="numbers"
                    />
                  </div>
                  <Input
                    label="邮箱"
                    type="email"
                    placeholder="请输入您的邮箱地址"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    leftIcon="mail"
                    required
                  />
                  <NeumorphicSelect
                    label="主题"
                    options={subjectOptions}
                    value={formData.subject}
                    onChange={(value) => handleInputChange('subject', value)}
                  />
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[var(--foreground)]">您的消息</label>
                    <textarea
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] p-4 text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                      placeholder="请输入您想说的话..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      required
                    />
                  </div>
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full"
                      rightIcon="send"
                      isLoading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      发送消息
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="py-16 border-t border-[var(--border)] mt-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">常见问题</h2>
                <p className="text-[var(--text-secondary)]">关于社团的一些常见问题解答</p>
              </div>
              <a
                href="#"
                className="hidden md:flex items-center gap-2 text-primary font-bold hover:underline"
              >
                查看所有问题
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/20 rounded-lg p-2 text-primary shrink-0">
                      <span className="material-symbols-outlined">{faq.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-2">{faq.question}</h4>
                      <p className="text-[var(--text-secondary)] leading-relaxed text-sm">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center md:hidden">
              <a href="#" className="inline-flex items-center gap-2 text-primary font-bold">
                查看所有问题
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </a>
            </div>
          </div>
          <div className="py-16 border-t border-[var(--border)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium mb-4">
                  <span className="material-symbols-outlined text-base">terminal</span>
                  关于我们
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-6 text-[var(--foreground)]">{clubInfo.name}</h2>
                <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-8">{clubInfo.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <span className="material-symbols-outlined text-primary">code</span>
                    <span className="font-medium text-[var(--foreground)]">编程工作坊</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <span className="material-symbols-outlined text-primary">emoji_events</span>
                    <span className="font-medium text-[var(--foreground)]">黑客马拉松</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <span className="material-symbols-outlined text-primary">security</span>
                    <span className="font-medium text-[var(--foreground)]">网络安全</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <span className="material-symbols-outlined text-primary">smart_toy</span>
                    <span className="font-medium text-[var(--foreground)]">人工智能</span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary/20 via-[var(--surface)] to-[var(--input-bg)] rounded-3xl p-8 border border-[var(--border)]">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-[var(--input-bg)] rounded-2xl">
                    <div className="text-4xl font-black text-primary mb-2">{stats.activeMembers}+</div>
                    <div className="text-[var(--text-secondary)] text-sm">活跃社员</div>
                  </div>
                  <div className="text-center p-6 bg-[var(--input-bg)] rounded-2xl">
                    <div className="text-4xl font-black text-primary mb-2">{stats.yearlyActivities}+</div>
                    <div className="text-[var(--text-secondary)] text-sm">年度活动</div>
                  </div>
                  <div className="text-center p-6 bg-[var(--input-bg)] rounded-2xl">
                    <div className="text-4xl font-black text-primary mb-2">{stats.awardProjects}+</div>
                    <div className="text-[var(--text-secondary)] text-sm">获奖项目</div>
                  </div>
                  <div className="text-center p-6 bg-[var(--input-bg)] rounded-2xl">
                    <div className="text-4xl font-black text-primary mb-2">{stats.partners}+</div>
                    <div className="text-[var(--text-secondary)] text-sm">合作伙伴</div>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <Button
                    variant="primary"
                    size="lg"
                    rightIcon="arrow_forward"
                    onClick={() => (window.location.href = '/join')}
                  >
                    立即加入我们
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {showSuccess && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
          <div className="flex items-center gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-xl bg-green-500/20 border-green-500/30">
            <span className="material-symbols-outlined text-green-500">check_circle</span>
            <p className="text-sm text-[var(--foreground)]">消息已成功发送！</p>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}