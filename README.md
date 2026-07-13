# Kuen Cheng High School Computer Club Website

This is the official website for the Kuen Cheng High School Computer Club, built with Next.js 16, TypeScript, Tailwind CSS 4, and Appwrite.

**Project status:** core student-facing and admin-facing features are implemented, and the project is actively being refined. AI assistant features, automated testing, and some operational workflows are still being improved.

**Author:** Tan Ming Jing  
**Username:** devtmj1123

---

## Overview

The repository currently includes:

- Student pages for home, about, notices, activities, attendance, projects, profile, tutorial, and authentication
- Project submission and editing flows
- Activity browsing, details, and signup flows
- Online attendance with verification code check-in
- Comments and community interaction
- A full admin area for managing notices, activities, projects, students, admins, signups, comments, attendance, and settings
- Appwrite-backed API routes for content, authentication, attendance, uploads, notifications, and admin workflows

---

## Key Pages

### Student-facing pages

- `/` Home
- `/about` About
- `/activities` Activities list
- `/notices` Notices list
- `/projects` Projects list
- `/projects/submit` Submit a project
- `/attendance` Attendance check-in
- `/profile` Profile
- `/tutorial` Tutorial
- `/auth/login` Login
- `/auth/forgot-password` Forgot password
- `/auth/reset-password` Reset password
- `/auth/change-password` Change password

### Admin pages

- `/admin` Admin entry
- `/admin/dashboard` Dashboard
- `/admin/activities` Activity management
- `/admin/notices` Notice management
- `/admin/projects` Project management
- `/admin/students` Student management
- `/admin/admins` Admin management
- `/admin/attendance` Attendance management
- `/admin/signups` Signup management
- `/admin/comments` Comment moderation
- `/admin/settings` System settings
- `/admin/manage` General management

---

## Tech Stack

- **Framework:** Next.js 16
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **State management:** Zustand
- **Forms:** react-hook-form + zod
- **Backend services:** Appwrite
- **Utilities:** Axios, date-fns, react-google-recaptcha-v3, xlsx, and more

---

## Project Structure

```text
src/
├── app/          # App Router pages and API routes
├── components/   # UI and feature components
├── contexts/     # React context providers
├── lib/          # Shared helpers and cache utilities
├── services/     # Appwrite and domain services
├── types/        # TypeScript types
└── utils/        # Utility functions
public/           # Static assets
scripts/          # Setup and maintenance scripts
docs/             # Supporting documentation
```

---

## Getting Started

### Requirements

- Node.js 18+
- npm
- An Appwrite instance

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Appwrite configuration.

### 3. Start the development server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

```bash
# Development
npm run dev
npm run build
npm run start

# Code quality
npm run lint
npm run format
npm run format:check
npm run type-check

# Appwrite and data setup
npm run setup:appwrite
npm run setup:attendance
npm run setup:projects
npm run seed:appwrite
npm run fix:attributes
npm run fix:grades
npm run fix:comments
```

There is currently no dedicated `npm test` script in this repository.

---

## Documentation

- [Database schema fix guide](./docs/FIX_DATABASE_SCHEMA.md)
- [GitHub Student Benefits tutorial](./docs/GITHUB_STUDENT_BENEFITS_TUTORIAL.md)
- [Attendance fixes](./ATTENDANCE_FIXES.md)
- [State update fixes](./STATE_UPDATE_FIXES.md)
- [Fix summary](./FIXES_SUMMARY.md)

---

## Notes

- The README reflects the current repository state and does not use the old phase-based roadmap.
- The project already has its main user and admin workflows in place, but continues to evolve.
- If you add new pages, scripts, or setup steps, update this file to keep it current.

---

## License

This project is licensed under the [MIT License](./LICENSE).
# 🎓 学校电脑社官网

这是学校电脑社官网项目，基于 Next.js 16、TypeScript 和 Appwrite 构建。当前仓库已经实现了学生端内容浏览、活动报名、项目展示与提交、在线考勤、评论互动，以及管理员后台的公告、活动、项目、学生、管理员、报名、评论和系统设置管理。

**当前状态**: 核心功能已完成，项目处于持续迭代和完善中。AI 助手、自动化测试和部分部署/运维能力仍在继续补强。

---

## ✨ 已实现功能

### 学生端
- 首页、关于页、公告页、活动页、项目页和个人中心
- 活动详情与报名流程
- 项目提交、编辑和详情查看
- 在线考勤页面和验证码签到流程
- 评论互动与消息相关页面
- 登录、忘记密码、修改密码、重置密码等认证流程
- 新手教程和 GitHub 学生福利教程入口

### 管理端
- 管理员登录和后台仪表盘
- 公告、活动、项目、学生、管理员的增删改查
- 活动报名管理和签到管理
- 点名管理、点名场次管理和考勤设置
- 评论审核与内容管理
- 系统设置与社团配置管理

### 后端与接口
- 基于 Appwrite 的数据存储、认证和文件能力
- 公告、活动、项目、用户、考勤、评论、通知、上传等 API 路由
- 初始化和数据库修复相关脚本与页面

---

## 🚀 快速开始

### 前置要求
- Node.js 18+ 和 npm
- 可用的 Appwrite 实例

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`，然后填写 Appwrite 配置。

```bash
# 参考现有环境模板
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

---

## 📚 常用入口

### 学生端页面
- `/` 首页
- `/about` 关于页面
- `/activities` 活动列表
- `/notices` 公告列表
- `/projects` 项目列表
- `/projects/submit` 项目提交
- `/attendance` 在线考勤
- `/profile` 个人中心
- `/tutorial` 教程页面
- `/auth/login` 登录
- `/auth/forgot-password` 忘记密码
- `/auth/reset-password` 重置密码
- `/auth/change-password` 修改密码

### 管理端页面
- `/admin` 管理后台入口
- `/admin/dashboard` 仪表盘
- `/admin/activities` 活动管理
- `/admin/notices` 公告管理
- `/admin/projects` 项目管理
- `/admin/students` 学生管理
- `/admin/admins` 管理员管理
- `/admin/attendance` 考勤管理
- `/admin/signups` 报名管理
- `/admin/comments` 评论管理
- `/admin/settings` 系统设置
- `/admin/manage` 综合管理

---

## 🛠️ 技术栈

- **框架**: Next.js 16
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand
- **表单**: react-hook-form + zod
- **后端服务**: Appwrite
- **其他**: Axios、date-fns、react-google-recaptcha-v3、xlsx 等

---

## 🧭 项目结构

```text
src/
├── app/          # App Router 页面与 API 路由
├── components/   # 业务组件与 UI 组件
├── contexts/     # React Context
├── lib/          # 缓存与公共库
├── services/     # Appwrite 和业务服务层
├── types/        # 类型定义
└── utils/        # 工具函数
public/           # 静态资源
scripts/          # 初始化和修复脚本
docs/             # 补充说明文档
```

---

## 📦 可用脚本

```bash
# 开发
npm run dev
npm run build
npm run start

# 代码质量
npm run lint
npm run format
npm run format:check
npm run type-check

# Appwrite / 数据初始化
npm run setup:appwrite
npm run setup:attendance
npm run setup:projects
npm run seed:appwrite
npm run fix:attributes
npm run fix:grades
npm run fix:comments
```

当前仓库没有单独配置 `npm test` 脚本。

---

## 🔧 环境配置

项目依赖 Appwrite 作为后端服务。常见配置包括：

1. 创建 Appwrite 项目
2. 配置数据库、集合和权限
3. 配置文件存储桶
4. 填写 `.env.local` 中的 Appwrite endpoint、project ID 和 API key

相关说明可以参考：
- [数据库修复说明](./docs/FIX_DATABASE_SCHEMA.md)
- [GitHub 学生福利教程](./docs/GITHUB_STUDENT_BENEFITS_TUTORIAL.md)
- [点名修复总结](./ATTENDANCE_FIXES.md)
- [状态更新修复总结](./STATE_UPDATE_FIXES.md)
- [修复汇总](./FIXES_SUMMARY.md)

---

## 📝 维护说明

- README 中的功能范围以当前代码库中的页面和 API 为准，不再使用旧的 Phase 1 / Phase 2 路线图数字描述。
- 项目已具备核心业务闭环，但仍在持续优化 UI、考勤交互和管理流程。
- 如果新增模块或脚本，建议同步更新本文件的页面入口和脚本列表。

---

## 📄 许可证

本项目采用 [MIT License](./LICENSE)。