'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StudentLayout } from '@/components/layout/StudentLayout';

type Lang = 'zh' | 'en';

interface Section {
  id: string;
  icon: string;
  title: { zh: string; en: string };
  content: { zh: string[]; en: string[] };
}

const sections: Section[] = [
  {
    id: 'overview',
    icon: 'home',
    title: { zh: '项目概览', en: 'Project Overview' },
    content: {
      zh: [
        '这是一个基于 **Next.js 16** 的学校电脑学会官网，使用 **App Router** 路由系统，后端采用 **Supabase**（Postgres + Auth + Storage + RLS）提供数据库、认证和文件存储服务。',
        '',
        '**技术栈一览：**',
        '- **前端框架：** Next.js 16 + React 19 + TypeScript 5',
        '- **样式系统：** Tailwind CSS 4 + 中性极简设计系统（单一强调色 + 明暗主题）',
        '- **后端服务：** Supabase (Postgres、Auth、Storage、RLS)',
        '- **部署平台：** Vercel',
        '- **其他工具：** Zod (验证)、React Hook Form (表单)、Resend (邮件)',
      ],
      en: [
        'This is a school Computer Club website built with **Next.js 16** using the **App Router** routing system. The backend uses **Supabase** (Postgres + Auth + Storage + RLS) for database, authentication, and file storage.',
        '',
        '**Tech Stack:**',
        '- **Frontend:** Next.js 16 + React 19 + TypeScript 5',
        '- **Styling:** Tailwind CSS 4 + neutral minimal design system (single accent color, light/dark themes)',
        '- **Backend:** Supabase (Postgres, Auth, Storage, RLS)',
        '- **Deployment:** Vercel',
        '- **Tools:** Zod (Validation), React Hook Form, Resend (Email)',
      ],
    },
  },
  {
    id: 'structure',
    icon: 'folder',
    title: { zh: '文件结构', en: 'File Structure' },
    content: {
      zh: [
        '项目的核心目录结构如下：',
        '',
        '**src/app/** — 页面和 API 路由 (Next.js App Router)',
        '- 每个文件夹 = 一个路由，page.tsx = 页面组件',
        '- api/ 文件夹存放后端 API 接口',
        '- layout.tsx 是根布局，包裹所有页面',
        '',
        '**src/components/** — 可复用的 UI 组件',
        '- ui/ — 基础组件 (Button, Input, Modal, Toast 等)',
        '- layout/ — 布局组件 (Header, Footer, Sidebar 等)',
        '- cards/ — 卡片组件 (ActivityCard, NoticeCard 等)',
        '- sections/ — 首页区块 (Hero, Notices, Projects 等)',
        '- attendance/ — 考勤相关组件',
        '- comments/ — 评论组件',
        '- notices/ — 公告组件 (图片轮播、评论区)',
        '- projects/ — 项目组件 (检查清单)',
        '',
        '**src/contexts/** — React Context 状态管理',
        '- AuthContext.tsx — 用户认证状态',
        '- ThemeContext.tsx — 主题切换 (亮/暗)',
        '- ClubContext.tsx — 社团信息',
        '- ReCaptchaContext.tsx — 人机验证',
        '',
        '**src/services/** — Supabase 数据服务层',
        '- 每个文件对应一组表或业务领域的数据访问',
        '- notice / activity / project / comment / attendance / student service',
        '',
        '**src/lib/supabase/** — Supabase 客户端与鉴权工具',
        '- client.ts — 浏览器端客户端',
        '- server.ts / admin.ts — 服务端与 service-role 客户端',
        '- auth.ts — 会话读取与鉴权辅助',
        '',
        '**src/types/** — TypeScript 类型定义',
        '- index.ts — 所有接口定义',
        '',
        '**src/lib/** — 共享工具与基础设施',
        '- utils.ts — className/日期等通用函数',
        '- admin-session.ts / student-session.ts — HMAC 会话 cookie（过渡方案）',
      ],
      en: [
        'The core directory structure:',
        '',
        '**src/app/** — Pages and API Routes (Next.js App Router)',
        '- Each folder = a route, page.tsx = page component',
        '- api/ folder contains backend API endpoints',
        '- layout.tsx is the root layout wrapping all pages',
        '',
        '**src/components/** — Reusable UI Components',
        '- ui/ — Base components (Button, Input, Modal, Toast, etc.)',
        '- layout/ — Layout components (Header, Footer, Sidebar, etc.)',
        '- cards/ — Card components (ActivityCard, NoticeCard, etc.)',
        '- sections/ — Homepage sections (Hero, Notices, Projects, etc.)',
        '- attendance/ — Attendance-related components',
        '- comments/ — Comment components',
        '- notices/ — Notice components (ImageCarousel)',
        '- projects/ — Project components (Checklist)',
        '',
        '**src/contexts/** — React Context State Management',
        '- AuthContext.tsx — User authentication state',
        '- ThemeContext.tsx — Theme switching (light/dark)',
        '- ClubContext.tsx — Club information',
        '- ReCaptchaContext.tsx — Human verification',
        '',
        '**src/services/** — Supabase Data Service Layer',
        '- Each file handles data access for a group of tables or business domain',
        '- notice / activity / project / comment / attendance / student service',
        '',
        '**src/lib/supabase/** — Supabase clients and auth helpers',
        '- client.ts — Browser client',
        '- server.ts / admin.ts — Server and service-role clients',
        '- auth.ts — Session helpers',
        '',
        '**src/types/** — TypeScript Type Definitions',
        '- index.ts — All interface definitions',
        '',
        '**src/lib/** — Shared utilities and infrastructure',
        '- utils.ts — className/date helpers',
        '- admin-session.ts / student-session.ts — HMAC session cookies (transitional)',
      ],
    },
  },
  {
    id: 'pages',
    icon: 'web',
    title: { zh: '页面路由', en: 'Page Routes' },
    content: {
      zh: [
        '网站分为 **学生端** 和 **管理端** 两大部分：',
        '',
        '**学生端页面：**',
        '- / — 首页 (Hero 动画、考勤组件、公告、活动)',
        '- /about — 关于我们',
        '- /activities — 活动列表 → /activities/[id] 活动详情 → /activities/[id]/signup 报名',
        '- /attendance — 我的考勤记录',
        '- /notices — 公告列表 → /notices/[id] 公告详情',
        '- /projects — 项目列表 → /projects/[id] 项目详情 → /projects/submit 提交项目',
        '- /profile — 个人资料',
        '- /auth/login — 学生登录',
        '- /auth/forgot-password — 忘记密码',
        '- /auth/reset-password — 重置密码',
        '- /auth/change-password — 修改密码',
        '',
        '**管理端页面：**',
        '- /admin — 管理仪表盘 (统计数据、快捷操作)',
        '- /admin/login — 管理员登录',
        '- /admin/notices — 公告管理 (创建/编辑/删除)',
        '- /admin/activities — 活动管理 (创建/编辑/查看报名)',
        '- /admin/attendance — 考勤管理 (创建会话、查看记录)',
        '- /admin/students — 学生管理 (创建/编辑)',
        '- /admin/manage — 管理员管理',
        '- /admin/projects — 项目管理',
        '- /admin/comments — 评论管理',
        '- /admin/signups — 报名管理',
        '- /admin/settings — 系统设置',
      ],
      en: [
        'The website has **Student** and **Admin** sections:',
        '',
        '**Student Pages:**',
        '- / — Homepage (Hero, Attendance, Notices, Activities)',
        '- /about — About Us',
        '- /activities — Activity List → /activities/[id] Detail → /activities/[id]/signup Registration',
        '- /attendance — My Attendance Records',
        '- /notices — Notice List → /notices/[id] Notice Detail',
        '- /projects — Project List → /projects/[id] Detail → /projects/submit Submit Project',
        '- /profile — Profile',
        '- /auth/login — Student Login',
        '- /auth/forgot-password — Forgot Password',
        '- /auth/reset-password — Reset Password',
        '- /auth/change-password — Change Password',
        '',
        '**Admin Pages:**',
        '- /admin — Admin Dashboard (Stats, Quick Actions)',
        '- /admin/login — Admin Login',
        '- /admin/notices — Notice Management (Create/Edit/Delete)',
        '- /admin/activities — Activity Management (Create/Edit/View Signups)',
        '- /admin/attendance — Attendance Management (Create Sessions, View Records)',
        '- /admin/students — Student Management (Create/Edit)',
        '- /admin/manage — Admin Management',
        '- /admin/projects — Project Management',
        '- /admin/comments — Comment Management',
        '- /admin/signups — Signup Management',
        '- /admin/settings — System Settings',
      ],
    },
  },
  {
    id: 'api',
    icon: 'api',
    title: { zh: 'API 路由', en: 'API Routes' },
    content: {
      zh: [
        '所有 API 放在 src/app/api/ 下，每个 route.ts 文件导出 GET/POST/PUT/DELETE 函数：',
        '',
        '**活动 API：**',
        '- /api/activities — GET (列表) / POST (创建)',
        '- /api/activities/[id] — GET / PUT / DELETE',
        '- /api/activities/signup — POST (活动报名)',
        '',
        '**考勤 API：**',
        '- /api/attendance — GET (记录列表)',
        '- /api/attendance/config — GET/PUT (考勤配置)',
        '- /api/attendance/record — POST (打卡)',
        '- /api/attendance/records — GET (所有记录)',
        '- /api/attendance/my-records — GET (我的记录)',
        '- /api/attendance/student-stats — GET (学生统计)',
        '- /api/attendance/initialize-session — POST (创建考勤会话)',
        '- /api/attendance/mark-absent — POST (标记缺勤)',
        '- /api/attendance/auto-mark-absent — POST (自动标记缺勤)',
        '',
        '**认证 API：**',
        '- /api/auth/student-login — POST (学生登录)',
        '- /api/auth/admin-login — POST (管理员登录)',
        '- /api/auth/forgot-password — POST (忘记密码)',
        '- /api/auth/reset-password — POST (重置密码)',
        '- /api/auth/verify-reset-token — POST (验证重置令牌)',
        '- /api/auth/student-change-password — POST (学生改密)',
        '- /api/auth/admin-change-password — POST (管理员改密)',
        '',
        '**公告 API：**',
        '- /api/notices — GET / POST',
        '- /api/notices/[id] — GET / PUT / DELETE',
        '- /api/notices/import-instagram — POST (导入 Instagram)',
        '',
        '**评论 API：**',
        '- /api/comments — GET / POST',
        '- /api/comments/[id] — DELETE',
        '- /api/comments/[id]/reply — POST (回复)',
        '- /api/comments/[id]/update — PUT (更新)',
        '',
        '**项目 API：**',
        '- /api/projects — GET / POST',
        '- /api/projects/[id] — GET / PUT / DELETE',
        '- /api/projects/[id]/checklist — PUT (更新检查清单)',
      ],
      en: [
        'All APIs are in src/app/api/, each route.ts exports GET/POST/PUT/DELETE functions:',
        '',
        '**Activity API:**',
        '- /api/activities — GET (list) / POST (create)',
        '- /api/activities/[id] — GET / PUT / DELETE',
        '- /api/activities/signup — POST (activity registration)',
        '',
        '**Attendance API:**',
        '- /api/attendance — GET (record list)',
        '- /api/attendance/config — GET/PUT (attendance config)',
        '- /api/attendance/record — POST (check-in)',
        '- /api/attendance/records — GET (all records)',
        '- /api/attendance/my-records — GET (my records)',
        '- /api/attendance/student-stats — GET (student stats)',
        '- /api/attendance/initialize-session — POST (create session)',
        '- /api/attendance/mark-absent — POST (mark absent)',
        '- /api/attendance/auto-mark-absent — POST (auto mark absent)',
        '',
        '**Auth API:**',
        '- /api/auth/student-login — POST (student login)',
        '- /api/auth/admin-login — POST (admin login)',
        '- /api/auth/forgot-password — POST (forgot password)',
        '- /api/auth/reset-password — POST (reset password)',
        '- /api/auth/verify-reset-token — POST (verify reset token)',
        '- /api/auth/student-change-password — POST (student change password)',
        '- /api/auth/admin-change-password — POST (admin change password)',
        '',
        '**Notice API:**',
        '- /api/notices — GET / POST',
        '- /api/notices/[id] — GET / PUT / DELETE',
        '- /api/notices/import-instagram — POST (import Instagram)',
        '',
        '**Comment API:**',
        '- /api/comments — GET / POST',
        '- /api/comments/[id] — DELETE',
        '- /api/comments/[id]/reply — POST (reply)',
        '- /api/comments/[id]/update — PUT (update)',
        '',
        '**Project API:**',
        '- /api/projects — GET / POST',
        '- /api/projects/[id] — GET / PUT / DELETE',
        '- /api/projects/[id]/checklist — PUT (update checklist)',
      ],
    },
  },
  {
    id: 'components',
    icon: 'widgets',
    title: { zh: '组件详解', en: 'Component Details' },
    content: {
      zh: [
        '**基础 UI 组件 (src/components/ui/):**',
        '- Button.tsx — 按钮组件，支持 primary/secondary/ghost/danger/outline 变体',
        '- Input.tsx — 输入框组件，支持标签、错误提示、图标',
        '- Select.tsx — 下拉选择组件',
        '- Modal.tsx — 模态对话框',
        '- Toast.tsx — 消息提示 (成功/错误/警告/信息)',
        '- Badge.tsx — 标签/徽章',
        '- Loading.tsx — 加载动画',
        '- EmptyState.tsx — 空状态占位',
        '- ThemeToggle.tsx — 明暗主题切换按钮',
        '- ClubLogo.tsx — 社团 Logo',
        '',
        '**布局组件 (src/components/layout/):**',
        '- Header.tsx — 顶部导航栏',
        '- Footer.tsx — 页脚',
        '- PageContainer.tsx — 页面容器',
        '- StudentLayout.tsx — 学生端布局',
        '- StudentSidebar.tsx — 学生端侧边栏',
        '- AdminLayout.tsx — 管理端布局',
        '',
        '**其他组件：**',
        '- attendance/AttendanceWidget.tsx — 考勤打卡组件',
        '- attendance/AttendanceRecords.tsx — 考勤记录列表',
        '- comments/CommentForm.tsx — 评论表单',
        '- comments/CommentList.tsx — 评论列表',
        '- notices/ImageCarousel.tsx — 图片轮播',
        '- projects/ProjectChecklist.tsx — 项目检查清单',
      ],
      en: [
        '**Base UI Components (src/components/ui/):**',
        '- Button.tsx — Button with primary/secondary/ghost/danger/outline variants',
        '- Input.tsx — Input with label, error, icon support',
        '- Select.tsx — Select dropdown component',
        '- Modal.tsx — Modal dialog',
        '- Toast.tsx — Toast notifications (success/error/warning/info)',
        '- Badge.tsx — Badge/tag component',
        '- Loading.tsx — Loading spinner',
        '- EmptyState.tsx — Empty state placeholder',
        '- ThemeToggle.tsx — Light/dark theme toggle',
        '- ClubLogo.tsx — Club logo component',
        '',
        '**Layout Components (src/components/layout/):**',
        '- Header.tsx — Top navigation bar',
        '- Footer.tsx — Page footer',
        '- PageContainer.tsx — Page container',
        '- StudentLayout.tsx — Student section layout',
        '- StudentSidebar.tsx — Student sidebar navigation',
        '- AdminLayout.tsx — Admin section layout',
        '',
        '**Other Components:**',
        '- attendance/AttendanceWidget.tsx — Attendance check-in widget',
        '- attendance/AttendanceRecords.tsx — Attendance record list',
        '- comments/CommentForm.tsx — Comment form',
        '- comments/CommentList.tsx — Comment list',
        '- notices/ImageCarousel.tsx — Image carousel',
        '- projects/ProjectChecklist.tsx — Project checklist',
      ],
    },
  },
  {
    id: 'design',
    icon: 'palette',
    title: { zh: '设计系统', en: 'Design System' },
    content: {
      zh: [
        '网站采用 **中性极简** 设计风格：单一社团绿色强调色、明暗双主题、无渐变与装饰性光效。',
        '',
        '**核心原则：**',
        '- 中性灰阶承担背景、表面与边框',
        '- 社团绿色只用于主操作、链接、选中态和关键数据',
        '- 层级通过 1px 边框与轻阴影表达，而不是新拟态阴影',
        '- 所有颜色通过 CSS 变量读取，自动适配明暗主题',
        '',
        '**主题变量：**',
        '- --background / --surface / --surface-hover — 页面与卡片表面',
        '- --foreground / --text-secondary / --text-tertiary — 文本层级',
        '- --border — 统一边框颜色',
        '- --primary / --primary-hover / --primary-light — 社团绿色强调色',
        '',
        '**常用类：**',
        '- .card — 卡片',
        '- .btn / .btn-primary / .btn-ghost / .btn-danger — 按钮变体',
        '- .input / .nm-input — 输入框',
        '- .badge / .nm-chip — 标签与胶囊',
        '- .nm-panel / .nm-section — 内容面板',
        '- .nm-tabs / .nm-tab — 标签页',
        '- .nm-table — 表格',
      ],
      en: [
        'The website uses a **neutral minimal** design system: one club-green accent, light and dark themes, no gradients or decorative glows.',
        '',
        '**Core principles:**',
        '- Neutral greys carry background, surfaces and borders',
        '- Club green is reserved for primary actions, links, selected states and key data',
        '- Hierarchy comes from 1px borders and light shadows, not neumorphic shadows',
        '- Every colour reads from CSS variables so both themes stay consistent',
        '',
        '**Theme tokens:**',
        '- --background / --surface / --surface-hover — page and card surfaces',
        '- --foreground / --text-secondary / --text-tertiary — text hierarchy',
        '- --border — unified border colour',
        '- --primary / --primary-hover / --primary-light — club-green accent',
        '',
        '**Common classes:**',
        '- .card — Card',
        '- .btn / .btn-primary / .btn-ghost / .btn-danger — Button variants',
        '- .input / .nm-input — Input field',
        '- .badge / .nm-chip — Badges and pills',
        '- .nm-panel / .nm-section — Content panels',
        '- .nm-tabs / .nm-tab — Tab navigation',
        '- .nm-table — Table',
      ],
    },
  },
  {
    id: 'getting-started',
    icon: 'play_arrow',
    title: { zh: '快速开始', en: 'Getting Started' },
    content: {
      zh: [
        '**1. 安装依赖**',
        'npm install',
        '',
        '**2. 配置环境变量**',
        '复制 .env.example 为 .env.local，填入你的 Supabase 配置：',
        '- NEXT_PUBLIC_SUPABASE_URL — Supabase 项目 URL',
        '- NEXT_PUBLIC_SUPABASE_ANON_KEY — 公开 key（publishable）',
        '- SUPABASE_SERVICE_ROLE_KEY — 服务端 key（secret，禁止暴露到浏览器）',
        '- ADMIN_SESSION_SECRET / STUDENT_SESSION_SECRET / RESET_TOKEN_SECRET — 会话与重置令牌密钥',
        '',
        '**3. 启动开发服务器**',
        'npm run dev',
        '访问 http://localhost:3000',
        '',
        '**4. 初始化数据库**',
        '在 Supabase SQL Editor 中按顺序执行 supabase/migrations/ 下的迁移文件，然后运行 npm run db:check 验证连接。',
        '',
        '**5. 创建管理员**',
        '配置 BOOTSTRAP_ADMIN_USERNAME / BOOTSTRAP_ADMIN_PASSWORD 后运行 npm run bootstrap:supabase，再访问 /admin/login 登录。',
        '',
        '**常用命令：**',
        '- npm run dev — 启动开发服务器',
        '- npm run build — 构建生产版本',
        '- npm run type-check — TypeScript 类型检查',
        '- npm run db:check — 检查 Supabase 连接与表结构',
        '- npm run db:smoke — 运行 Supabase 冒烟测试',
        '- npm run lint — 运行 ESLint 检查',
        '- npm run format — 格式化代码',
      ],
      en: [
        '**1. Install Dependencies**',
        'npm install',
        '',
        '**2. Configure Environment Variables**',
        'Copy .env.example to .env.local and fill in your Supabase configuration:',
        '- NEXT_PUBLIC_SUPABASE_URL — Supabase project URL',
        '- NEXT_PUBLIC_SUPABASE_ANON_KEY — Public publishable key',
        '- SUPABASE_SERVICE_ROLE_KEY — Server secret key (never expose to the browser)',
        '- ADMIN_SESSION_SECRET / STUDENT_SESSION_SECRET / RESET_TOKEN_SECRET — session and reset secrets',
        '',
        '**3. Start Development Server**',
        'npm run dev',
        'Visit http://localhost:3000',
        '',
        '**4. Initialize Database**',
        'Run supabase/migrations/*.sql in order in the Supabase SQL Editor, then run npm run db:check.',
        '',
        '**5. Create Admin Account**',
        'Set BOOTSTRAP_ADMIN_USERNAME / BOOTSTRAP_ADMIN_PASSWORD, run npm run bootstrap:supabase, then log in at /admin/login.',
        '',
        '**Common Commands:**',
        '- npm run dev — Start development server',
        '- npm run build — Build for production',
        '- npm run type-check — TypeScript type check',
        '- npm run db:check — Check Supabase connection and schema',
        '- npm run db:smoke — Run Supabase smoke tests',
        '- npm run lint — Run ESLint check',
        '- npm run format — Format code',
      ],
    },
  },
  {
    id: 'tips',
    icon: 'lightbulb',
    title: { zh: '开发技巧', en: 'Development Tips' },
    content: {
      zh: [
        '**添加新页面：**',
        '1. 在 src/app/ 下创建文件夹',
        '2. 添加 page.tsx 文件',
        '3. 如需布局，添加 layout.tsx',
        '',
        '**添加新 API：**',
        '1. 在 src/app/api/ 下创建文件夹',
        '2. 添加 route.ts 文件',
        '3. 导出 GET, POST, PUT, DELETE 函数',
        '',
        '**添加新组件：**',
        '1. 在 src/components/ 对应文件夹下创建 .tsx 文件',
        "2. 使用 'use client' 标记客户端组件",
        '3. 在 index.ts 中导出',
        '',
        '**使用设计系统：**',
        '- 卡片：添加 .card 类',
        '- 面板：添加 .nm-panel 或 .nm-section 类',
        '- 按钮：使用 .btn + 变体类 (.btn-primary, .btn-ghost 等)',
        '- 输入框：使用 .input 类',
        '- 颜色：优先使用 CSS 变量，不要硬编码十六进制颜色',
        '',
        '**调试技巧：**',
        '- 使用浏览器 DevTools 检查 CSS 变量值',
        '- 在 Supabase Dashboard 的 Table Editor / Logs 中查看数据与请求',
        '- 使用 console.log 在 API Route 中调试',
      ],
      en: [
        '**Adding a New Page:**',
        '1. Create a folder in src/app/',
        '2. Add a page.tsx file',
        '3. Add layout.tsx if needed',
        '',
        '**Adding a New API:**',
        '1. Create a folder in src/app/api/',
        '2. Add a route.ts file',
        '3. Export GET, POST, PUT, DELETE functions',
        '',
        '**Adding a New Component:**',
        '1. Create a .tsx file in the appropriate src/components/ folder',
        "2. Use 'use client' for client components",
        '3. Export in index.ts',
        '',
        '**Using the Design System:**',
        '- Raised elements: Add .card class',
        '- Buttons: Use .btn + variant classes (.btn-primary, .btn-ghost, etc.)',
        '- Inputs: Use .input class',
        '',
        '**Debugging Tips:**',
        '- Use browser DevTools to inspect CSS variables',
        '- Check Supabase Dashboard Table Editor / Logs for data and requests',
        '- Use console.log in API Routes for debugging',
      ],
    },
  },
];

export default function TutorialPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [lang, setLang] = useState<Lang>('zh');
  const currentSection = sections.find((s) => s.id === activeSection) || sections[0];
  const currentIndex = sections.indexOf(currentSection);

  const renderContent = (lines: string[]) => {
    return lines.map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h3
            key={i}
            className="mt-8 font-display text-[1.15rem] font-bold leading-[1.4] tracking-[-0.02em] text-[var(--foreground)]"
          >
            {line.replace(/\*\*/g, '')}
          </h3>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <div key={i} className="ml-1 flex gap-2.5 py-1">
            <span className="mt-[9px] block size-1 shrink-0 bg-[var(--primary)]" />
            <span
              className="text-[13px] leading-[1.9] text-[var(--text-secondary)]"
              dangerouslySetInnerHTML={{
                __html: line
                  .slice(2)
                  .replace(
                    /\*\*(.*?)\*\*/g,
                    '<strong class="font-semibold text-[var(--foreground)]">$1</strong>'
                  ),
              }}
            />
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      return (
        <p
          key={i}
          className="text-[13px] leading-[1.9] text-[var(--text-secondary)] [&:not(:first-child)]:mt-2"
          dangerouslySetInnerHTML={{
            __html: line.replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="font-semibold text-[var(--foreground)]">$1</strong>'
            ),
          }}
        />
      );
    });
  };

  return (
    <StudentLayout>
      <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <nav className="mb-8 flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          <Link href="/" className="transition-colors hover:text-[var(--foreground)]">
            首页
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">开发者教程</span>
        </nav>

        <header className="flex flex-col justify-between gap-6 border-b border-[var(--rule-strong)] pb-8 sm:flex-row sm:items-end">
          <div>
            <div className="eyebrow">DEVELOPER HANDBOOK · 开发者教程</div>
            <h1 className="mt-5 font-display text-[clamp(2.1rem,5vw,3.3rem)] font-bold leading-[1.1] tracking-[-0.04em] text-[var(--foreground)]">
              {lang === 'zh' ? '开发者教程' : 'Developer Tutorial'}
            </h1>
            <p className="mt-4 max-w-2xl text-[13px] leading-[1.9] text-[var(--text-secondary)]">
              {lang === 'zh'
                ? '欢迎加入 KC 电脑学会网站开发。这份教程帮助你快速了解项目结构、数据层与开发流程。'
                : 'Welcome to KC Computer Club website development. This handbook covers the project structure, data layer and development workflow.'}
            </p>
          </div>

          <div className="flex w-fit border border-[var(--rule-strong)]">
            {(
              [
                { value: 'zh' as const, label: '中文' },
                { value: 'en' as const, label: 'English' },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setLang(option.value)}
                className={`px-4 py-2 font-mono text-[12px] uppercase tracking-[0.1em] transition-colors ${
                  lang === option.value
                    ? 'bg-[var(--primary)] text-[var(--primary-contrast)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          <nav className="lg:sticky lg:top-[98px] lg:h-fit">
            <div className="border border-[var(--rule-strong)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                <span>{lang === 'zh' ? '目录' : 'Contents'}</span>
                <span className="text-[var(--primary)]">
                  {String(sections.length).padStart(2, '0')}
                </span>
              </div>
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`grid w-full grid-cols-[22px_minmax(0,1fr)] items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition-colors last:border-b-0 ${
                    activeSection === section.id
                      ? 'bg-[var(--primary-light)]'
                      : 'hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <span
                    className={`font-mono text-[12px] ${
                      activeSection === section.id
                        ? 'text-[var(--primary)]'
                        : 'text-[var(--text-tertiary)]'
                    }`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`text-[12px] font-medium leading-[1.5] ${
                      activeSection === section.id
                        ? 'text-[var(--primary)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {section.title[lang]}
                  </span>
                </button>
              ))}
            </div>
          </nav>

          <article className="min-w-0">
            <div className="border border-[var(--rule-strong)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5 sm:px-7">
                <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  SECTION {String(currentIndex + 1).padStart(2, '0')} /{' '}
                  {String(sections.length).padStart(2, '0')}
                </span>
                <span className="material-symbols-outlined text-[16px] text-[var(--primary)]">
                  {currentSection.icon}
                </span>
              </div>

              <div className="px-5 py-7 sm:px-7">
                <h2 className="font-display text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.03em] text-[var(--foreground)]">
                  {currentSection.title[lang]}
                </h2>
                <div className="mt-5">{renderContent(currentSection.content[lang])}</div>
              </div>

              <div className="flex flex-col gap-3 border-t border-[var(--rule-strong)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                {currentIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveSection(sections[currentIndex - 1].id)}
                    className="inline-flex items-center gap-2 border border-[var(--border)] px-3 py-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                    {sections[currentIndex - 1].title[lang]}
                  </button>
                ) : (
                  <span className="hidden sm:block" />
                )}

                {currentIndex < sections.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveSection(sections[currentIndex + 1].id)}
                    className="inline-flex items-center gap-2 bg-[var(--primary)] px-4 py-2.5 text-[12px] font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
                  >
                    {sections[currentIndex + 1].title[lang]}
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 border border-[var(--rule-strong)] px-4 py-2.5 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    返回首页
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </Link>
                )}
              </div>
            </div>
          </article>
        </div>
      </main>
    </StudentLayout>
  );
}
