'use client';
import { useState } from 'react';

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
        '这是一个基于 **Next.js 16** 的学校电脑学会官网，使用 **App Router** 路由系统，后端采用 **Appwrite** (BaaS) 提供数据库、认证和文件存储服务。',
        '',
        '**技术栈一览：**',
        '- **前端框架：** Next.js 16 + React 19 + TypeScript 5',
        '- **样式系统：** Tailwind CSS 4 + Neumorphism 设计系统',
        '- **后端服务：** Appwrite (数据库、认证、存储)',
        '- **部署平台：** Vercel',
        '- **其他工具：** Zod (验证)、React Hook Form (表单)、Zustand (状态管理)、Resend (邮件)',
      ],
      en: [
        'This is a school Computer Club website built with **Next.js 16** using the **App Router** routing system. The backend uses **Appwrite** (BaaS) for database, authentication, and file storage.',
        '',
        '**Tech Stack:**',
        '- **Frontend:** Next.js 16 + React 19 + TypeScript 5',
        '- **Styling:** Tailwind CSS 4 + Neumorphism Design System',
        '- **Backend:** Appwrite (Database, Auth, Storage)',
        '- **Deployment:** Vercel',
        '- **Tools:** Zod (Validation), React Hook Form, Zustand (State), Resend (Email)',
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
        '- notifications/ — 通知铃铛组件',
        '',
        '**src/contexts/** — React Context 状态管理',
        '- AuthContext.tsx — 用户认证状态',
        '- ThemeContext.tsx — 主题切换 (亮/暗)',
        '- ClubContext.tsx — 社团信息',
        '- NotificationContext.tsx — 通知系统',
        '- ReCaptchaContext.tsx — 人机验证',
        '',
        '**src/services/** — Appwrite 数据服务层',
        '- 每个文件对应一个数据库集合的 CRUD 操作',
        '- appwrite.ts — 客户端 SDK 初始化',
        '- appwrite-server.ts — 服务端 SDK 初始化',
        '',
        '**src/types/** — TypeScript 类型定义',
        '- index.ts — 所有接口定义',
        '',
        '**src/utils/** — 工具函数',
        '- api.ts — API 请求封装',
        '- constants.ts — 常量定义',
        '- format.ts — 日期/文本格式化',
        '- validate.ts — 表单验证',
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
        '- notices/ — Notice components (ImageCarousel, CommentSection)',
        '- projects/ — Project components (Checklist)',
        '- notifications/ — Notification bell component',
        '',
        '**src/contexts/** — React Context State Management',
        '- AuthContext.tsx — User authentication state',
        '- ThemeContext.tsx — Theme switching (light/dark)',
        '- ClubContext.tsx — Club information',
        '- NotificationContext.tsx — Notification system',
        '- ReCaptchaContext.tsx — Human verification',
        '',
        '**src/services/** — Appwrite Data Service Layer',
        '- Each file handles CRUD for one database collection',
        '- appwrite.ts — Client-side SDK initialization',
        '- appwrite-server.ts — Server-side SDK initialization',
        '',
        '**src/types/** — TypeScript Type Definitions',
        '- index.ts — All interface definitions',
        '',
        '**src/utils/** — Utility Functions',
        '- api.ts — API request wrapper',
        '- constants.ts — Constant definitions',
        '- format.ts — Date/text formatting',
        '- validate.ts — Form validation',
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
        '- /club-settings — 社团设置展示',
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
        '- /club-settings — Club Settings Display',
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
        '- /api/auth/get-student — GET (获取学生信息)',
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
        '- /api/auth/get-student — GET (get student info)',
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
        '- NeumorphicSelect.tsx — 新拟态下拉选择组件',
        '- Modal.tsx — 模态对话框',
        '- Toast.tsx — 消息提示 (成功/错误/警告/信息)',
        '- Badge.tsx — 标签/徽章',
        '- Loading.tsx — 加载动画',
        '- EmptyState.tsx — 空状态占位',
        '- ThemeToggle.tsx — 主题切换按钮',
        '- BreathingToggle.tsx — 呼吸灯开关',
        '- ClubLogo.tsx — 社团 Logo',
        '',
        '**布局组件 (src/components/layout/):**',
        '- Header.tsx — 顶部导航栏',
        '- Footer.tsx — 页脚',
        '- PageContainer.tsx — 页面容器',
        '- StudentLayout.tsx — 学生端布局',
        '- StudentSidebar.tsx — 学生端侧边栏',
        '- AdminLayout.tsx — 管理端布局',
        '- AdminModernLayout.tsx — 管理端布局 (新版)',
        '- AdminModernSidebar.tsx — 管理端侧边栏',
        '',
        '**其他组件：**',
        '- attendance/AttendanceWidget.tsx — 考勤打卡组件',
        '- attendance/AttendanceRecords.tsx — 考勤记录列表',
        '- comments/CommentForm.tsx — 评论表单',
        '- comments/CommentList.tsx — 评论列表',
        '- notices/ImageCarousel.tsx — 图片轮播',
        '- notifications/NotificationBell.tsx — 通知铃铛',
        '- projects/ProjectChecklist.tsx — 项目检查清单',
      ],
      en: [
        '**Base UI Components (src/components/ui/):**',
        '- Button.tsx — Button with primary/secondary/ghost/danger/outline variants',
        '- Input.tsx — Input with label, error, icon support',
        '- Select.tsx — Select dropdown component',
        '- NeumorphicSelect.tsx — Neumorphic styled select dropdown',
        '- Modal.tsx — Modal dialog',
        '- Toast.tsx — Toast notifications (success/error/warning/info)',
        '- Badge.tsx — Badge/tag component',
        '- Loading.tsx — Loading spinner',
        '- EmptyState.tsx — Empty state placeholder',
        '- ThemeToggle.tsx — Theme toggle button',
        '- BreathingToggle.tsx — Breathing light toggle',
        '- ClubLogo.tsx — Club logo component',
        '',
        '**Layout Components (src/components/layout/):**',
        '- Header.tsx — Top navigation bar',
        '- Footer.tsx — Page footer',
        '- PageContainer.tsx — Page container',
        '- StudentLayout.tsx — Student section layout',
        '- StudentSidebar.tsx — Student sidebar navigation',
        '- AdminLayout.tsx — Admin section layout',
        '- AdminModernLayout.tsx — Admin layout (modern)',
        '- AdminModernSidebar.tsx — Admin sidebar navigation',
        '',
        '**Other Components:**',
        '- attendance/AttendanceWidget.tsx — Attendance check-in widget',
        '- attendance/AttendanceRecords.tsx — Attendance record list',
        '- comments/CommentForm.tsx — Comment form',
        '- comments/CommentList.tsx — Comment list',
        '- notices/ImageCarousel.tsx — Image carousel',
        '- notifications/NotificationBell.tsx — Notification bell',
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
        '网站采用 **Neumorphism (新拟态)** 设计风格：',
        '',
        '**核心概念：**',
        '- 背景色 --nm-bg 作为所有元素的基底',
        '- 凸起效果 --nm-raised = 亮色阴影 + 暗色阴影',
        '- 凹陷效果 --nm-inset = 内阴影组合',
        '- 按压效果 --nm-pressed = 更深的内阴影',
        '',
        '**学生端配色：**',
        '- 主色：翠绿色 #10b981',
        '- 背景：浅灰绿 #e8ece9 (亮) / #1a1f1c (暗)',
        '',
        '**管理端配色：**',
        '- 主色：蓝色 #3b82f6',
        '- 背景：深海军蓝 #0f1419',
        '',
        '**工具类：**',
        '- .nm-raised / .nm-raised-sm / .nm-raised-lg — 凸起表面',
        '- .nm-inset / .nm-inset-sm — 凹陷表面',
        '- .nm-pressed — 按压状态',
        '- .card — 卡片 (带悬停动画)',
        '- .btn / .btn-primary / .btn-ghost / .btn-danger — 按钮变体',
        '- .nm-input — 输入框',
        '- .nm-divider — 分割线',
        '- .nm-avatar — 头像',
        '- .nm-progress — 进度条',
        '- .nm-toggle — 开关',
        '- .nm-tabs / .nm-tab — 标签页',
        '- .nm-table — 表格',
        '- .nm-tooltip — 提示气泡',
      ],
      en: [
        'The website uses **Neumorphism** design style:',
        '',
        '**Core Concepts:**',
        '- Background --nm-bg as base for all elements',
        '- Raised effect --nm-raised = light shadow + dark shadow',
        '- Inset effect --nm-inset = inner shadow combination',
        '- Pressed effect --nm-pressed = deeper inner shadow',
        '',
        '**Student Color Scheme:**',
        '- Primary: Emerald green #10b981',
        '- Background: Soft gray-green #e8ece9 (light) / #1a1f1c (dark)',
        '',
        '**Admin Color Scheme:**',
        '- Primary: Blue #3b82f6',
        '- Background: Deep navy #0f1419',
        '',
        '**Utility Classes:**',
        '- .nm-raised / .nm-raised-sm / .nm-raised-lg — Raised surfaces',
        '- .nm-inset / .nm-inset-sm — Inset surfaces',
        '- .nm-pressed — Pressed state',
        '- .card — Card (with hover animation)',
        '- .btn / .btn-primary / .btn-ghost / .btn-danger — Button variants',
        '- .nm-input — Input field',
        '- .nm-divider — Divider',
        '- .nm-avatar — Avatar',
        '- .nm-progress — Progress bar',
        '- .nm-toggle — Toggle switch',
        '- .nm-tabs / .nm-tab — Tab navigation',
        '- .nm-table — Table',
        '- .nm-tooltip — Tooltip',
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
        '复制 .env.example 为 .env，填入你的 Appwrite 配置：',
        '- NEXT_PUBLIC_APPWRITE_ENDPOINT — Appwrite API 地址',
        '- NEXT_PUBLIC_APPWRITE_PROJECT_ID — 项目 ID',
        '- NEXT_PUBLIC_APPWRITE_DATABASE_ID — 数据库 ID',
        '- APPWRITE_API_KEY — 服务端 API Key',
        '',
        '**3. 启动开发服务器**',
        'npm run dev',
        '访问 http://localhost:3000',
        '',
        '**4. 初始化数据库**',
        '访问 /init 页面，点击初始化按钮创建必要的数据库集合和索引。',
        '',
        '**5. 创建管理员**',
        '访问 /admin/login，使用默认管理员账号登录。',
        '',
        '**常用命令：**',
        '- npm run dev — 启动开发服务器',
        '- npm run build — 构建生产版本',
        '- npm run lint — 运行 ESLint 检查',
        '- npm run format — 格式化代码',
      ],
      en: [
        '**1. Install Dependencies**',
        'npm install',
        '',
        '**2. Configure Environment Variables**',
        'Copy .env.example to .env and fill in your Appwrite configuration:',
        '- NEXT_PUBLIC_APPWRITE_ENDPOINT — Appwrite API endpoint',
        '- NEXT_PUBLIC_APPWRITE_PROJECT_ID — Project ID',
        '- NEXT_PUBLIC_APPWRITE_DATABASE_ID — Database ID',
        '- APPWRITE_API_KEY — Server API Key',
        '',
        '**3. Start Development Server**',
        'npm run dev',
        'Visit http://localhost:3000',
        '',
        '**4. Initialize Database**',
        'Visit /init page and click the initialize button to create necessary collections and indexes.',
        '',
        '**5. Create Admin Account**',
        'Visit /admin/login and use the default admin account to log in.',
        '',
        '**Common Commands:**',
        '- npm run dev — Start development server',
        '- npm run build — Build for production',
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
        '**使用新拟态样式：**',
        '- 凸起元素：添加 .nm-raised 或 .card 类',
        '- 凹陷元素：添加 .nm-inset 类',
        '- 按钮：使用 .btn + 变体类 (.btn-primary, .btn-ghost 等)',
        '- 输入框：使用 .nm-input 类',
        '',
        '**调试技巧：**',
        '- 使用浏览器 DevTools 检查 CSS 变量值',
        '- 查看 /api/admin/diagnostic 获取系统状态',
        '- 检查 Appwrite 控制台查看数据库状态',
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
        '**Using Neumorphism Styles:**',
        '- Raised elements: Add .nm-raised or .card class',
        '- Inset elements: Add .nm-inset class',
        '- Buttons: Use .btn + variant classes (.btn-primary, .btn-ghost, etc.)',
        '- Inputs: Use .nm-input class',
        '',
        '**Debugging Tips:**',
        '- Use browser DevTools to inspect CSS variables',
        '- Check /api/admin/diagnostic for system status',
        '- Check Appwrite console for database status',
        '- Use console.log in API Routes for debugging',
      ],
    },
  },
];

export default function TutorialPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [lang, setLang] = useState<Lang>('zh');
  const currentSection = sections.find((s) => s.id === activeSection) || sections[0];

  const renderContent = (lines: string[]) => {
    return lines.map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h3
            key={i}
            className="text-lg font-bold mt-6 mb-3"
            style={{ color: 'var(--foreground)' }}
          >
            {line.replace(/\*\*/g, '')}
          </h3>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <div key={i} className="flex gap-2 mb-1.5 ml-4">
            <span style={{ color: 'var(--primary)', marginTop: 4 }}>•</span>
            <span
              style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{
                __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--foreground)">$1</strong>'),
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
          className="mb-2 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
          dangerouslySetInnerHTML={{
            __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--foreground)">$1</strong>'),
          }}
        />
      );
    });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--nm-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div
          className="p-8 mb-8"
          style={{
            background: 'var(--nm-bg)',
            boxShadow: 'var(--nm-raised-lg)',
            borderRadius: 30,
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                {lang === 'zh' ? '开发者教程' : 'Developer Tutorial'}
              </h1>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                {lang === 'zh'
                  ? '欢迎加入 KC 电脑学会网站开发！这份教程将帮助你快速了解项目结构和开发流程。'
                  : 'Welcome to KC Computer Club website development! This tutorial will help you quickly understand the project structure and development workflow.'}
              </p>
            </div>
            <div
              className="flex gap-1 p-1"
              style={{
                background: 'var(--nm-bg)',
                boxShadow: 'var(--nm-inset-sm)',
                borderRadius: 12,
              }}
            >
              <button
                onClick={() => setLang('zh')}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: lang === 'zh' ? 'var(--nm-bg)' : 'transparent',
                  boxShadow: lang === 'zh' ? 'var(--nm-raised-sm)' : 'none',
                  color: lang === 'zh' ? 'var(--primary)' : 'var(--text-secondary)',
                }}
              >
                中文
              </button>
              <button
                onClick={() => setLang('en')}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: lang === 'en' ? 'var(--nm-bg)' : 'transparent',
                  boxShadow: lang === 'en' ? 'var(--nm-raised-sm)' : 'none',
                  color: lang === 'en' ? 'var(--primary)' : 'var(--text-secondary)',
                }}
              >
                English
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <nav className="lg:w-64 shrink-0">
            <div
              className="p-4 sticky top-4"
              style={{
                background: 'var(--nm-bg)',
                boxShadow: 'var(--nm-raised)',
                borderRadius: 22,
              }}
            >
              <h2
                className="text-sm font-semibold uppercase tracking-wider mb-3 px-2"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {lang === 'zh' ? '目录' : 'Contents'}
              </h2>
              <div className="flex flex-col gap-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200"
                    style={{
                      background: activeSection === section.id ? 'var(--nm-bg)' : 'transparent',
                      boxShadow: activeSection === section.id ? 'var(--nm-raised-sm)' : 'none',
                      color: activeSection === section.id ? 'var(--primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <span className="material-symbols-outlined text-xl">{section.icon}</span>
                    {section.title[lang]}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          <main className="flex-1 min-w-0">
            <div
              className="p-8"
              style={{
                background: 'var(--nm-bg)',
                boxShadow: 'var(--nm-raised)',
                borderRadius: 26,
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="w-12 h-12 flex items-center justify-center"
                  style={{
                    background: 'var(--nm-bg)',
                    boxShadow: 'var(--nm-raised-sm)',
                    borderRadius: 14,
                  }}
                >
                  <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--primary)' }}>
                    {currentSection.icon}
                  </span>
                </span>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {currentSection.title[lang]}
                </h2>
              </div>

              <div className="prose max-w-none">{renderContent(currentSection.content[lang])}</div>

              <div className="flex justify-between items-center mt-8 pt-6">
                <div
                  className="w-full h-0.5 mb-6"
                  style={{
                    background: 'var(--nm-bg)',
                    boxShadow: 'inset -1px -1px 2px var(--nm-shadow-light), inset 1px 1px 2px var(--nm-shadow-dark)',
                  }}
                />
              </div>
              <div className="flex justify-between items-center">
                {sections.indexOf(currentSection) > 0 ? (
                  <button
                    onClick={() => setActiveSection(sections[sections.indexOf(currentSection) - 1].id)}
                    className="flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200"
                    style={{
                      background: 'var(--nm-bg)',
                      boxShadow: 'var(--nm-raised-sm)',
                      color: 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = 'var(--nm-raised)';
                      e.currentTarget.style.color = 'var(--foreground)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'var(--nm-raised-sm)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                    {sections[sections.indexOf(currentSection) - 1].title[lang]}
                  </button>
                ) : (
                  <div />
                )}
                {sections.indexOf(currentSection) < sections.length - 1 ? (
                  <button
                    onClick={() => setActiveSection(sections[sections.indexOf(currentSection) + 1].id)}
                    className="flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-200"
                    style={{
                      background: 'var(--primary)',
                      boxShadow: '0 8px 24px var(--primary-glow), var(--nm-raised-sm)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--primary-hover)';
                      e.currentTarget.style.boxShadow = '0 12px 32px var(--primary-glow), var(--nm-raised)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--primary)';
                      e.currentTarget.style.boxShadow = '0 8px 24px var(--primary-glow), var(--nm-raised-sm)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {sections[sections.indexOf(currentSection) + 1].title[lang]}
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
