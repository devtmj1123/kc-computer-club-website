/**
 * Shared club settings shape.
 *
 * The database stores snake_case columns; the public API and all client
 * components use the camelCase shape below. Defaults mirror the copy that was
 * previously hardcoded across the site, so the site still looks complete before
 * an admin saves anything or before the newest migration is applied.
 */

export interface ClubActivityItem {
  title: string;
  description: string;
}

export interface ClubFaqItem {
  question: string;
  answer: string;
}

export interface ClubSettings {
  clubName: string;
  clubNameEn: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutEmail: string;
  aboutLocation: string;
  aboutMeetingTime: string;
  website: string;
  logoUrl: string;
  heroImage: string;
  heroImageAlt: string;
  recruitmentStatus: string;
  foundedYear: number;
  groupCount: number;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroHighlights: string[];
  aboutHeading: string;
  aboutActivities: ClubActivityItem[];
  faqs: ClubFaqItem[];
  joinTitle: string;
  joinDescription: string;
  activeMembers: number;
  yearlyActivities: number;
  awardProjects: number;
  partners: number;
  githubUrl: string;
  discordUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
}

export const DEFAULT_CLUB_ACTIVITIES: ClubActivityItem[] = [
  {
    title: '例常课程',
    description: '按分组级别进行电脑与资讯工艺课程，从基础操作到进阶主题。',
  },
  {
    title: '项目实践',
    description: '以团队形式完成真实项目，把课堂上学到的知识变成可以运行的作品。',
  },
  {
    title: '校园技术支持',
    description: '为学校活动提供控制室、LED 屏幕与现场技术协助，积累实战经验。',
  },
  {
    title: '比赛与工作坊',
    description: '参与校内外比赛、工作坊与技术分享，和同伴一起持续进步。',
  },
];

export const DEFAULT_CLUB_FAQS: ClubFaqItem[] = [
  {
    question: '如何成为团员？',
    answer:
      '坤成初一新生：可以在新生营招生展来我们的摊位了解详情，之后在校务系统选取电脑学会即可。\n坤成其他年级学生：可以在年尾转换社团时来摊位了解详情，面试获得录取后填写转换社团表格，交给联课处。',
  },
  {
    question: '有分高级组和初级组吗？',
    answer:
      '有。高级组为 2 学点，初级组为 1 学点；初级组团员只需认真上课与交功课。\n高级组除了上课，也需要参与服务，例如在学校演奏会、周会与多元学习日的控制室协助控制 LED 屏幕。',
  },
  {
    question: '活动信息在哪里发布？',
    answer:
      '请查看本网站的公告与活动页面，或关注我们的 Instagram，了解社团日常与最新动态。',
  },
  {
    question: '完全没有电脑经验的学生可以加入吗？',
    answer:
      '当然可以。科技影响着每一个领域，无论你来自理科、文科还是商科，只要对电脑有兴趣，都欢迎加入我们。',
  },
];

export const DEFAULT_CLUB_SETTINGS: ClubSettings = {
  clubName: '坤成中学电脑学会',
  clubNameEn: 'KUEN CHENG COMPUTER CLUB',
  aboutTitle: '坤成中学电脑学会',
  aboutDescription:
    '电脑学会成立于 1983 年，至今已有四十余年历史。我们致力于让团员跟进科技时代的步伐，提高对电脑的认识，并提升资讯工艺方面的能力。',
  aboutEmail: 'computerclub@kuencheng.edu.my',
  aboutLocation: '电脑室 A304，科学楼三楼',
  aboutMeetingTime: '每周五 16:00 - 18:00',
  website: '',
  logoUrl: '',
  heroImage: '',
  heroImageAlt: '',
  recruitmentStatus: '社团运行中',
  foundedYear: 1983,
  groupCount: 5,
  heroEyebrow: 'EST. 1983 — 四十余年 · 坤成中学',
  heroTitle: '让好奇心，成为作品。',
  heroSubtitle:
    '电脑学会成立于 1983 年，至今已有四十余年历史。我们陪伴每一位团员从第一行代码走到第一个上线项目，在持续学习、动手实践与展示成果中，把好奇心变成真正的作品。',
  heroHighlights: ['电脑室 · 例常活动', '项目制学习', '开放给全校'],
  aboutHeading: '一起学习，一起创造。',
  aboutActivities: DEFAULT_CLUB_ACTIVITIES,
  faqs: DEFAULT_CLUB_FAQS,
  joinTitle: '对电脑有兴趣，就足够了。',
  joinDescription: '查看近期活动，或登录成员账号了解更多社团信息。',
  activeMembers: 0,
  yearlyActivities: 0,
  awardProjects: 0,
  partners: 0,
  githubUrl: '',
  discordUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function optionalText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(value: unknown, fallback: number): number {
  const parsed =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];
  const items = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
  return items.length > 0 ? items : [...fallback];
}

function activityList(value: unknown): ClubActivityItem[] {
  if (!Array.isArray(value)) return DEFAULT_CLUB_ACTIVITIES.map((item) => ({ ...item }));
  const items = value
    .filter(isRecord)
    .map((item) => ({
      title: typeof item.title === 'string' ? item.title.trim() : '',
      description: typeof item.description === 'string' ? item.description.trim() : '',
    }))
    .filter((item) => item.title || item.description);
  return items.length > 0 ? items : DEFAULT_CLUB_ACTIVITIES.map((item) => ({ ...item }));
}

function faqList(value: unknown): ClubFaqItem[] {
  if (!Array.isArray(value)) return DEFAULT_CLUB_FAQS.map((item) => ({ ...item }));
  const items = value
    .filter(isRecord)
    .map((item) => ({
      question: typeof item.question === 'string' ? item.question.trim() : '',
      answer: typeof item.answer === 'string' ? item.answer.trim() : '',
    }))
    .filter((item) => item.question || item.answer);
  return items.length > 0 ? items : DEFAULT_CLUB_FAQS.map((item) => ({ ...item }));
}

/**
 * Fill missing fields with site defaults. Safe to call with an API response,
 * localStorage content, or an empty value.
 */
export function normalizeClubSettings(input: unknown): ClubSettings {
  const source = isRecord(input) ? input : {};
  const defaults = DEFAULT_CLUB_SETTINGS;

  const aboutTitle = text(source.aboutTitle, text(source.clubName, defaults.aboutTitle));

  return {
    clubName: text(source.clubName, aboutTitle),
    clubNameEn: text(source.clubNameEn, defaults.clubNameEn),
    aboutTitle,
    aboutDescription: text(source.aboutDescription, defaults.aboutDescription),
    aboutEmail: text(source.aboutEmail, defaults.aboutEmail),
    aboutLocation: text(source.aboutLocation, defaults.aboutLocation),
    aboutMeetingTime: text(source.aboutMeetingTime, defaults.aboutMeetingTime),
    website: optionalText(source.website),
    logoUrl: optionalText(source.logoUrl),
    heroImage: optionalText(source.heroImage),
    heroImageAlt: optionalText(source.heroImageAlt),
    recruitmentStatus: text(source.recruitmentStatus, defaults.recruitmentStatus),
    foundedYear: Math.round(numberValue(source.foundedYear, defaults.foundedYear)),
    groupCount: Math.round(numberValue(source.groupCount, defaults.groupCount)),
    heroEyebrow: text(source.heroEyebrow, defaults.heroEyebrow),
    heroTitle: text(source.heroTitle, defaults.heroTitle),
    heroSubtitle: text(source.heroSubtitle, defaults.heroSubtitle),
    heroHighlights: stringList(source.heroHighlights, defaults.heroHighlights),
    aboutHeading: text(source.aboutHeading, defaults.aboutHeading),
    aboutActivities: activityList(source.aboutActivities),
    faqs: faqList(source.faqs),
    joinTitle: text(source.joinTitle, defaults.joinTitle),
    joinDescription: text(source.joinDescription, defaults.joinDescription),
    activeMembers: numberValue(source.activeMembers, defaults.activeMembers),
    yearlyActivities: numberValue(source.yearlyActivities, defaults.yearlyActivities),
    awardProjects: numberValue(source.awardProjects, defaults.awardProjects),
    partners: numberValue(source.partners, defaults.partners),
    githubUrl: optionalText(source.githubUrl),
    discordUrl: optionalText(source.discordUrl),
    instagramUrl: optionalText(source.instagramUrl),
    youtubeUrl: optionalText(source.youtubeUrl),
  };
}
