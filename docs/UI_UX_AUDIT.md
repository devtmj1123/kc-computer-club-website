# UI/UX Audit — 现状问题与极简重塑方向

> 项目：KC Computer Club Website
> 日期：2026-11-10
> 范围：学生端 + 管理端 + 公共页面
> 前提：**保留现有真实功能**；只清理假功能、死链和重复入口。
> 本文件只做审计与设计方向，不涉及代码改动。

---

## 1. 审计方法

- 逐页阅读 46 个 `page.tsx`、核心 layout、共享组件、`globals.css`。
- 统计颜色、圆角、阴影、弹窗、轮询、客户端组件比例。
- 对照功能流程检查：
  - 登录 → 首页 → 公告/活动/项目 → 签到 → 个人资料
  - 管理员登录 → 仪表盘 → 内容管理 → 学生/考勤/审核/设置
- 以“首次使用者能否在 3 步内完成目标任务”为标准评估信息架构。
- 以 WCAG 2.2 AA 为可访问性目标做静态检查。

---

## 2. 现状总结

### 2.1 一句话判断

> 现在的 UI 不是“极简”，而是“新拟态 + 多套设计语言 + 大量硬编码”的叠加；交互逻辑则是“每个页面自己发明一套”。

### 2.2 主要矛盾

| 矛盾 | 表现 |
|---|---|
| 视觉语言不统一 | 学生端绿色、后台蓝色、主题自定义第三种绿；3 套布局；多种圆角/阴影 |
| 层级靠阴影而不是排版 | 卡片、输入、按钮都用新拟态凸起/凹陷；信息密度一高就糊 |
| 页面各自为政 | 每个页面自己写加载、错误、空状态、弹窗、表单校验 |
| 交互反馈原始 | 48 个 `alert`、6 个 `confirm`；没有统一 Toast/Dialog |
| 首屏依赖客户端 | 45/46 页面 `'use client'`；主题未挂载前 `visibility:hidden` |
| 数据展示不完整 | 首页请求了项目但不渲染；后台统计有假趋势/假动态 |
| 功能入口重复/断裂 | 两套管理员管理、两套报名管理、`/club-settings` 假保存 |

---

## 3. 视觉问题清单

### 3.1 色彩

**问题**

- `src/app/globals.css` 的 `--primary` 是 `#10b981`。
- `src/contexts/ThemeContext.tsx` 默认主色是 `#13ec80`。
- 后台 `--admin-primary` 是 `#3b82f6`。
- 约 1,535 处硬编码 hex，主题自定义只覆盖 `--primary`，无法覆盖这些硬编码。
- 深色主题的 `--text-tertiary`（如 `#3f6250`）在深底上对比度不足。
- 后台大量 `text-white`、`text-gray-400`、`bg-[#1f2d39]` 等写死颜色，亮色主题下不协调。
- 状态色（成功/警告/错误/信息）没有统一语义 token，页面各自用 `text-green-400`、`text-red-400`、`#f59e0b` 等。

**影响**

- 换主题不彻底，用户会觉得“只变了一点”。
- 亮/暗切换后局部仍然深色，产生“拼贴感”。
- 对比度不达标，阅读疲劳。

**方向**

- 只保留一套语义 token：
  - `--background` / `--surface` / `--surface-muted` / `--surface-raised`
  - `--foreground` / `--muted-foreground` / `--subtle-foreground`
  - `--border` / `--border-strong`
  - `--accent` / `--accent-hover` / `--accent-foreground`
  - `--success` / `--warning` / `--danger` / `--info`
  - `--ring`
- 学生端/管理端共用同一套 token；管理端只通过布局和密度区分，不再换主色。
- 所有页面禁止直接写 hex；需要新颜色时先加 token。
- 主题自定义只改 `--accent` 系列，且只提供通过对比度校验的预设 + 自定义色（自动计算前景色）。

### 3.2 新拟态（Neumorphism）

**问题**

- `--nm-raised`、`--nm-inset` 等多层双向阴影贯穿卡片、输入、按钮、导航。
- 深色下阴影几乎不可见，亮色下又显得脏。
- 大量 `rounded-2xl/3xl` + 大阴影，视觉重量大、信息密度低。
- 呼吸动效（`breathing-enabled`）持续动画，增加重绘，且不尊重 `prefers-reduced-motion`。
- 阴影作为唯一边界，导致焦点/禁用/错误状态难以区分。

**方向**

- 彻底移除新拟态。
- 用 **1px 边框 + 极轻阴影** 建立层级：
  - `shadow-sm`：仅浮层/下拉
  - `shadow-md`：Dialog/Sheet
  - 卡片默认无阴影，仅边框
- 圆角收敛为 3 档：`6px`（小控件）、`10px`（卡片/输入）、`999px`（胶囊/头像）。
- 用字号、字重、留白建立层级，而不是阴影。
- 动效默认关闭；保留“动态效果”开关，尊重 `prefers-reduced-motion`。

### 3.3 字体与排版

**问题**

- `Space_Grotesk` 只覆盖拉丁字符；中文回退到系统字体，字形/行高不统一。
- Material Symbols 通过 Google Fonts `<link>` 加载，图标是字体，首屏可能闪烁/阻塞。
- 字号跨度大（`text-3xl` 到 `text-6xl` 都有），行高/字重不统一。
- 中英混排没有统一规则；数字/日期格式不一致。
- 多处源码中文字符串出现 `????`（编码损坏），文案质量受影响。

**方向**

- 字体：
  - 中文：`Noto Sans SC`（`next/font` 本地化/子集）。
  - 拉丁/数字：`Geist` 或 `Inter`（`next/font`）。
  - 等宽：`Geist Mono`（代码/验证码/ID）。
- 排版比例：
  - Display 32/40
  - H1 28/36
  - H2 22/30
  - H3 18/26
  - Body 15/24
  - Small 13/20
  - Caption 12/18
- 中文字重只用 400/500/600/700；避免 900 大字重堆叠。
- 图标改用 `lucide-react`（或统一 SVG），删除 Material Symbols 字体请求。
- 统一日期：`YYYY年M月D日`；时间：24 小时制；数字用 tabular-nums。

### 3.4 布局与间距

**问题**

- 3 套 shell：
  - `StudentLayout` + `StudentSidebar` + `Header` + `Footer`
  - `AdminLayout`
  - `AdminModernLayout` + `AdminModernSidebar`
- 页面容器宽度不一致：`max-w-300`、`max-w-4xl`、`max-w-6xl`、`px-4 md:px-10 lg:px-20` 混用。
- 间距没有统一 scale；`p-6/p-8/p-10`、`gap-4/gap-6/gap-8` 随意组合。
- 后台页面有的用 `nm-panel`，有的用 `rounded-xl border`，有的直接内联 style。
- 移动端导航/侧栏行为不统一。

**方向**

- 只保留 2 套 shell：
  - **Public/Student Shell**：顶部导航 + 移动端底部导航 + 内容容器。
  - **Admin Shell**：可折叠左侧栏 + 顶部面包屑/用户菜单 + 内容容器。
- 内容容器统一 `max-w-[1200px]`，左右 `24px`（移动端 `16px`）。
- 间距用 4/8 scale：`4, 8, 12, 16, 24, 32, 48, 64`。
- 页面结构统一：`PageHeader`（标题/描述/操作）+ `PageBody`（卡片/表格/表单）。
- 移动端：
  - 公共端底部导航（首页/公告/活动/项目/我的）。
  - 管理端侧栏变 Drawer；表格变卡片列表。
- 删除 `AdminModernLayout` / `AdminModernSidebar`，合并成一套。

### 3.5 组件

**问题**

- `Button`、`Input`、`Select`、`NeumorphicSelect`、`Badge`、`Modal`、`Toast`、`EmptyState`、`Loading` 都有，但：
  - 页面经常绕过组件写原生 `<button>` / `<input>`。
  - `NeumorphicSelect` 与 `Select` 重复。
  - 按钮的 variant/size/loading/disabled 不统一。
  - Input 的 error/helper/leftIcon 行为不一致。
  - Modal 没有统一焦点管理/ESC/滚动锁。
  - Toast 使用不广，很多地方仍 `alert`。
- 图标按钮普遍缺少 `aria-label`。
- 表格没有统一组件；每个页面自己写 `<table>` + 内联样式。
- 分页、筛选栏、批量操作栏、确认对话框没有共享组件。

**方向**

建立最小但完整的设计系统（`src/components/ui`）：

| 组件 | 变体/能力 |
|---|---|
| `Button` | primary / secondary / ghost / danger；sm/md/lg；loading；icon-only（强制 aria-label） |
| `Input` / `Textarea` | label、hint、error、prefix/suffix、字符计数 |
| `Select` | 原生可访问实现；支持分组/搜索（大列表） |
| `Checkbox` / `Radio` / `Switch` | 统一尺寸/焦点/禁用 |
| `Card` | 无阴影/边框/可点击；`CardHeader/Content/Footer` |
| `Badge` | neutral/success/warning/danger/info；不带颜色依赖 |
| `Dialog` | 焦点陷阱、ESC、返回焦点、移动端 Sheet |
| `Toast` | success/error/info；`aria-live`；自动消失可暂停 |
| `Table` | 排序、分页、空状态、移动卡片模式、列宽 |
| `Tabs` | 键盘可操作 |
| `EmptyState` | 图标/标题/描述/动作 |
| `Skeleton` | 文本/卡片/表格骨架 |
| `Pagination` | 页码/上一页/下一页/每页数量 |
| `PageHeader` | 标题/描述/面包屑/主操作 |
| `ConfirmDialog` | 破坏性操作统一确认 |
| `Avatar` | 首字母/图片/大小 |
| `Tooltip` | 可选，延迟显示 |

**规则**

- 页面不允许直接写原生按钮/输入（除非有明确理由）。
- 所有交互组件必须有 focus-visible、disabled、loading、error 状态。
- 图标统一 `lucide-react`，尺寸 16/20/24。

### 3.6 反馈与状态

**问题**

- 48 个 `alert()`、6 个 `confirm()`。
- 成功提示有的是 banner、有的是 alert、有的是 console。
- 删除/批量操作没有统一确认。
- 加载状态多为 spinner + “加载中...”，没有骨架屏。
- 空状态不统一；有的显示“暂无数据”，有的空白。
- 错误状态没有统一组件；API 错误直接 `alert` 或 `console.error`。
- 没有全局错误边界/404。

**方向**

- 所有提示走 `Toast`；破坏性操作走 `ConfirmDialog`。
- 列表首屏用 `Skeleton`；按钮提交用 `loading`；页面级用 `loading.tsx`。
- 统一 `EmptyState`（无数据/无权限/搜索无结果/出错）。
- 增加 `error.tsx`、`not-found.tsx`、`global-error.tsx`。
- 表单错误就近显示，不弹窗；网络错误用 Toast + 重试。
- 所有异步操作有“进行中/成功/失败”三态。

### 3.7 可访问性

**问题**

- 图标字体 + 无 `aria-label` 的图标按钮。
- 低对比度文本（尤其 `--text-tertiary`、`text-gray-500`）。
- 自定义按钮/链接 focus 不可见。
- Dialog 无焦点陷阱/ESC。
- 表格无 `caption`/`scope`；状态只靠颜色。
- 动画无 `prefers-reduced-motion`。
- 表单 label 与 input 没有稳定关联；错误没有 `aria-describedby`。
- 语言标记 `lang="zh-CN"`，但大量英文标签。

**方向**

- 以 WCAG 2.2 AA 为目标：
  - 正文对比度 ≥ 4.5:1；大字 ≥ 3:1。
  - 所有交互元素有可见 focus ring（2px + offset）。
  - 图标按钮必须有 `aria-label`；装饰图标 `aria-hidden`。
  - Dialog/Sheet 焦点陷阱、ESC、返回焦点。
  - 表格 `caption` + `scope`；状态用图标/文字 + 颜色。
  - 表单 label `htmlFor`；错误 `aria-describedby` + `aria-invalid`。
  - `prefers-reduced-motion` 关闭非必要动画。
- 键盘走查：Tab 顺序、跳过导航、移动端菜单。

### 3.8 响应式

**问题**

- 管理端表格在手机上横向滚动，列多、字号小。
- 部分页面 `max-w-300`（1200px）在小屏没有足够 padding。
- 移动端侧栏/底部导航行为不一致。
- Hero 图片/文字在小屏比例不稳。
- 弹窗在移动端可能超出视口。

**方向**

- Mobile-first：
  - 公共端：底部导航 + 单列卡片。
  - 管理端：侧栏 Drawer；表格转卡片；筛选栏可折叠。
- 断点：`sm 640 / md 768 / lg 1024 / xl 1280`。
- 触控目标 ≥ 44×44。
- 弹窗移动端用 bottom sheet；桌面用居中 Dialog。
- 图片 `next/image` + `sizes` + `aspect-ratio`。

### 3.9 信息架构

**问题**

- 首页只展示公告/活动，项目数据请求了但不渲染。
- 关于页有 `/join`、`href="#"` 死链。
- `/privacy`、`/terms` 链接存在但页面不存在。
- 导航有 `/chat` 死链。
- 后台两套管理员管理、两套报名管理、两套设置。
- `club-settings` 是假保存。
- 后台“近期活动”不是真实事件流。
- 登录后没有明确“下一步”引导（签到/报名/项目）。

**方向**

- 公共导航：首页 / 公告 / 活动 / 项目 / 关于 /（登录/我的）。
- 首页信息顺序：
  1. Hero + 招募状态
  2. 今日/本周签到（学生）
  3. 置顶公告
  4. 近期活动
  5. 精选项目（补上未渲染的 projects）
  6. 社团数据/加入 CTA
- 后台导航：
  - 概览
  - 内容：公告 / 活动 / 项目 / 评论
  - 成员：学生 / 报名 / 考勤
  - 系统：管理员 / 设置
- 合并重复页面；旧 URL 做 redirect。
- 死链：补页面或移除；不保留 `href="#"`。
- 每个空状态给出下一步动作（如“去创建第一个活动”）。

---

## 4. 页面级审计

### 4.1 公共/学生端

| 页面 | 主要问题 | 重塑要点 |
|---|---|---|
| `/` 首页 | 4 个请求；项目不渲染；Hero 外链图；无 SSR；无明确 CTA | Server Component；Hero + 签到 + 公告 + 活动 + 项目；骨架屏；`next/image` |
| `/notices` | 客户端搜索/过滤；无分页；卡片视觉重 | 服务端分页 + 搜索；极简列表；置顶区分；空状态 |
| `/notices/[id]` | 客户端 sanitize；图片/标签解析；评论区重 | 服务端清洗 HTML；图片 `next/image`；评论待审核 |
| `/activities` | 客户端过滤；状态/截止时间前端推导；封面未优化 | 服务端筛选；状态 badge；截止时间统一；卡片 |
| `/activities/[id]` | 报名列表接口断裂；内部活动可见性靠前端 | 服务端权限；报名按钮状态（未登录/已报名/已满/截止）；报名列表仅管理员 |
| `/activities/[id]/signup` | 手写表单；错误处理不统一；重复报名 | 统一表单组件 + zod；登录/匿名策略；成功页 |
| `/projects` | 公开所有状态；客户端过滤；卡片信息密度 | 公开 approved；服务端筛选；项目卡片 |
| `/projects/[id]` | 成员/反馈/checklist 展示混在字符串里 | 结构化展示；时间线；成员头像；反馈 |
| `/projects/submit` | 邮箱枚举接口；客户端重复检查；成员编辑复杂 | 登录后提交；服务端校验；成员搜索（仅姓名/邮箱匹配） |
| `/projects/[id]/edit` | 与 submit 重复；权限前端判断 | 复用表单；服务端权限；仅组长/管理员 |
| `/attendance` | 多接口；签到 401；记录按 email | 一个签到卡 + 周记录；服务端本人数据；验证码状态 |
| `/profile` | 资料 401；三 tab 状态重；主题/密码混在一起 | 资料 / 安全 / 外观三块；服务端资料；统一表单 |
| `/auth/login` | 学生/管理员入口分离；错误提示不统一 | 统一登录卡；角色切换；错误内联；忘记密码 |
| `/auth/forgot-password` | 邮箱格式限制；无速率限制 | 统一说明；防枚举；邮件发送状态 |
| `/auth/reset-password` | token 24h/可复用；密码规则提示 | Supabase 流程；一次性 token；密码强度 |
| `/auth/change-password` | 与 profile 重复 | 合并到 profile 安全 tab 或保留独立页 |
| `/about` | 死链；localStorage；社交链接空 | 服务端社团设置；修死链；真实社交链接 |
| `/tutorial` | 内容/样式孤立 | 统一文章排版；目录/返回 |
| `/club-settings` | 假保存；与 admin settings 重复 | 合并到 `/admin/settings` |
| `/init` | 公开建表页面 | 删除/仅开发脚本 |

### 4.2 管理端

| 页面 | 主要问题 | 重塑要点 |
|---|---|---|
| `/admin` | 假趋势/假动态；欢迎语硬编码 | 真实指标；待办（待审项目/待审评论/本周考勤）；快捷操作 |
| `/admin/notices` | 列表重；无分页；发布状态/可见性 | 服务端分页；状态筛选；批量发布 |
| `/admin/notices/create` | 表单重；图片上传/预览 | 统一表单；富文本/预览；图片上传 |
| `/admin/notices/[id]/edit` | 与 create 重复 | 复用编辑器 |
| `/admin/activities` | 列表卡片重；状态/报名入口 | 表格/卡片切换；报名数；状态 |
| `/admin/activities/create` | 字段多；时间拼接；自定义表单缺失 | 分步/分区；日期时间组件；表单字段编辑器 |
| `/admin/activities/[id]/edit` | 与 create 重复 | 复用 |
| `/admin/activities/[id]/signups` | 与 `/admin/signups` 重复；接口断裂 | 合并到报名管理，保留活动筛选 |
| `/admin/signups` | 调不存在 API；批量操作 | 服务端分页；状态更新；导出 CSV |
| `/admin/projects` | 审核接口鉴权；统计前端算；详情弹窗重 | 服务端统计；审核 Dialog；反馈模板 |
| `/admin/students` | 500+5000+500；xlsx 静态；PII localStorage；移动端表格 | 服务端分页；聚合列；动态导入 xlsx；移除 PII localStorage |
| `/admin/students/create` | 手写表单；密码默认值 | 统一表单；生成初始密码；复制/邮件 |
| `/admin/students/[id]/edit` | 与 create 重复 | 复用 |
| `/admin/attendance` | 多套逻辑；公开写接口；大表 | session 选择；服务端分页；批量标记；导出 |
| `/admin/attendance/session` | 配置/生成码/状态混在一起 | 场次卡片；生成/清除码；倒计时；关闭场次 |
| `/admin/attendance/[id]` | 记录详情/编辑 | 统一记录表 + 编辑 Dialog |
| `/admin/comments` | 自动通过；审核流被绕过 | 待审/通过/拒绝；批量；回复 |
| `/admin/admins` | 与 `/admin/manage` 重复；权限 JSON 字符串 | 保留一套；角色/权限矩阵 |
| `/admin/manage` | 同上 | redirect 到 `/admin/admins` |
| `/admin/settings` | 假 API/Webhook/会话；考勤配置混入 | 社团信息/外观/考勤/安全（真实）分区；删除假面板 |
| `/admin/dashboard` | re-export | redirect 到 `/admin` |
| `/admin/login` | 独立登录页；与 auth 不一致 | 统一登录视觉；管理员标识 |

---

## 5. 新设计方向：Neutral Minimal

### 5.1 设计原则

1. **内容优先**：先排版，后装饰；不用阴影制造层级。
2. **一个强调色**：全站一个 accent；管理端不换色。
3. **少而稳的组件**：组件少、状态全、行为一致。
4. **清晰的状态**：加载/空/错/无权限都有明确界面。
5. **可访问**：键盘、对比度、焦点、动效偏好。
6. **中文优先**：字体、行高、标点、日期格式统一。
7. **移动优先**：公共端底部导航；管理端表格转卡片。
8. **保留功能**：主题自定义、呼吸动效、评论、通知等都不砍，改为更好的实现。

### 5.2 Design Tokens

```css
:root {
  /* surfaces */
  --background: #fafafa;
  --surface: #ffffff;
  --surface-muted: #f4f4f5;
  --surface-raised: #ffffff;

  /* text */
  --foreground: #18181b;
  --muted-foreground: #52525b;
  --subtle-foreground: #71717a;

  /* lines */
  --border: #e4e4e7;
  --border-strong: #d4d4d8;

  /* accent (club green, accessible on light) */
  --accent: #047857;
  --accent-hover: #065f46;
  --accent-foreground: #ffffff;
  --accent-soft: #ecfdf5;

  /* status */
  --success: #047857;
  --warning: #b45309;
  --danger: #b91c1c;
  --info: #1d4ed8;

  /* focus */
  --ring: #047857;

  /* radius */
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 14px;
  --radius-full: 999px;

  /* shadow (only for overlays) */
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
  --shadow-md: 0 8px 24px rgb(0 0 0 / 0.08);
}

.dark {
  --background: #09090b;
  --surface: #111113;
  --surface-muted: #18181b;
  --surface-raised: #1c1c1f;

  --foreground: #fafafa;
  --muted-foreground: #a1a1aa;
  --subtle-foreground: #71717a;

  --border: #27272a;
  --border-strong: #3f3f46;

  --accent: #34d399;
  --accent-hover: #6ee7b7;
  --accent-foreground: #052e16;
  --accent-soft: #022c22;

  --success: #34d399;
  --warning: #fbbf24;
  --danger: #f87171;
  --info: #60a5fa;
  --ring: #34d399;

  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.4);
  --shadow-md: 0 8px 24px rgb(0 0 0 / 0.5);
}
```

**规则**

- 页面只用语义 token；不写 `#hex`、`text-gray-*`、`bg-[#...]`。
- 强调色默认“深绿”（亮色）/“薄荷绿”（暗色），保留社团识别。
- 主题自定义只改 accent 系列；自动计算 foreground/soft/hover。
- 所有 token 在 `globals.css` 定义；Tailwind 4 `@theme` 映射。

### 5.3 字体

- 中文：`Noto Sans SC`（400/500/600/700）。
- 拉丁：`Geist`（400/500/600）。
- 等宽：`Geist Mono`（验证码/ID/代码）。
- 字号/行高：
  - `text-display`: 32/40, 700
  - `text-h1`: 28/36, 700
  - `text-h2`: 22/30, 600
  - `text-h3`: 18/26, 600
  - `text-body`: 15/24, 400
  - `text-sm`: 13/20, 400
  - `text-caption`: 12/18, 400
- 段落最大宽度 70ch；中文行高 1.7。

### 5.4 布局

**Public/Student Shell**

```
┌──────────────────────────────────────────┐
│ Header: logo | nav | search | bell | user │
├──────────────────────────────────────────┤
│                                          │
│  max-w-[1200px] px-4 md:px-6             │
│                                          │
├──────────────────────────────────────────┤
│ Footer (desktop)                         │
└──────────────────────────────────────────┘
Mobile: Header + bottom nav (首页/公告/活动/项目/我的)
```

**Admin Shell**

```
┌───────────┬──────────────────────────────┐
│ Sidebar   │ Topbar: breadcrumb | actions  │
│ (240px)   ├──────────────────────────────┤
│           │                              │
│ 概览      │  PageHeader                  │
│ 内容      │  PageBody                    │
│ 成员      │                              │
│ 系统      │                              │
└───────────┴──────────────────────────────┘
Mobile: Drawer sidebar + sticky topbar
```

**页面模板**

- 列表页：`PageHeader` + `FilterBar` + `DataTable`/`CardGrid` + `Pagination`。
- 详情页：`Breadcrumb` + 标题/状态 + 主内容 2/3 + 侧栏 1/3。
- 表单页：`PageHeader` + 分区卡片 + sticky 底部操作栏。
- 仪表盘：指标卡 + 待办 + 最近活动 + 快捷操作。
- 认证页：居中卡片，最多 400px；品牌 + 表单 + 辅助链接。

### 5.5 组件视觉规范

| 组件 | 规范 |
|---|---|
| Button | 高 36/40/44；圆角 8；primary 实心 accent；secondary 边框；ghost 无底；danger 红；focus ring 2px |
| Input | 高 40；边框 1px；focus ring 2px；error 红边 + 文案；label 在上 |
| Card | 白/深表面；1px 边框；圆角 10；无阴影；hover 仅可点击卡片加边框变化 |
| Badge | 小圆角 6；soft 背景 + 深文字；状态同时有文字 |
| Table | 表头 muted；行高 48；hover 表面；边框分隔；移动端转卡片 |
| Dialog | 桌面居中 480/640；移动 bottom sheet；遮罩 40%；焦点陷阱 |
| Toast | 右下/底部居中；3s；可关闭；`aria-live` |
| Skeleton | 与内容同尺寸；避免布局跳动 |
| EmptyState | 图标 40；标题 16；描述 14；一个主操作 |
| Pagination | 上一页/页码/下一页；每页 20/50/100 |

### 5.6 动效

- 时长：150ms（hover）、200ms（展开）、250ms（Dialog）。
- 缓动：`cubic-bezier(0.2, 0, 0, 1)`。
- 只动 `transform` / `opacity`；不动 `box-shadow` / `height`（除非必要）。
- 呼吸动效保留为可选，默认关闭；`prefers-reduced-motion` 强制关闭。
- 页面切换不做花哨过渡；用 Suspense 骨架。

### 5.7 主题

- 模式：`light` / `dark` / `system`（新增 system）。
- 强调色：
  - 预设：绿、蓝、紫、橙、玫红、青（全部通过对比度校验）。
  - 自定义：用户选色后自动生成 hover/soft/foreground。
- 保存：`localStorage` 只存偏好（无 PII）；首屏 inline script 应用 class，避免 `visibility:hidden`。
- 管理端不跟随用户强调色？建议跟随，保持一致性；如果担心品牌，管理端用中性灰 + 同一 accent。

### 5.8 文案

- 统一“坤成中学电脑学会”（与 metadata 一致）。
- 中文优先；英文只保留品牌名/必要术语。
- 错误文案：说明“发生了什么 + 怎么办”，不暴露堆栈。
- 按钮：动词开头（保存、发布、删除、提交报名）。
- 空状态：说明 + 下一步。
- 日期/时间/数字统一格式。

---

## 6. 重塑策略

### 6.1 不要一次性重写

采用 **Strangler Pattern**：

1. 先建新 tokens + 基础组件 + 两套 shell（不影响旧页面）。
2. 选一个低风险页面（如 `/about`）试点。
3. 按“公共端 → 学生端 → 管理端”逐页替换。
4. 旧页面保留路由，新页面就绪后切换；旧组件最后删除。
5. 每个页面迁移前先补功能 parity 清单。

### 6.2 页面迁移顺序

1. `/about`、`/tutorial`（静态，低风险）
2. `/auth/*`（统一登录体验）
3. `/notices`、`/notices/[id]`
4. `/activities`、`/activities/[id]`、报名
5. `/projects`、`/projects/[id]`、submit/edit
6. `/attendance`、`/profile`
7. `/` 首页
8. `/admin` 仪表盘
9. `/admin/notices`
10. `/admin/activities` + `/admin/signups`
11. `/admin/projects`
12. `/admin/students`
13. `/admin/attendance`
14. `/admin/comments`
15. `/admin/admins` + `/admin/settings`

### 6.3 每页 Definition of Done

- [ ] 功能 parity（对照旧页面逐项打勾）。
- [ ] 使用新 tokens/组件，无硬编码颜色。
- [ ] 加载/空/错/无权限状态齐全。
- [ ] 键盘可操作，focus 可见，对比度达标。
- [ ] 移动端可用（375px）。
- [ ] 无 `alert`/`confirm`。
- [ ] 无客户端直连数据库（除 Auth/Realtime）。
- [ ] 首屏可由服务端渲染（公开页）。
- [ ] Lighthouse 移动端 Performance ≥ 85、Accessibility ≥ 90（目标）。
- [ ] 截图对比 + 交互走查。

---

## 7. 验收标准（UI）

### 视觉

- 全站只有一个强调色体系；学生端/管理端一致。
- 0 处硬编码 hex（CI 可 grep 检查）。
- 只有 2 套 shell；无重复布局。
- 圆角/间距/字号全部来自 token。
- 亮/暗主题所有页面一致，无“深色块”残留。

### 交互

- 0 个 `alert()` / `confirm()`。
- 所有表单有 label、错误、loading、成功反馈。
- 所有列表有加载骨架、空状态、错误重试、分页。
- 所有破坏性操作有确认 Dialog。
- 所有异步操作有 Toast/内联反馈。

### 可访问性

- 键盘可完成登录、报名、签到、提交项目、管理员审核。
- 焦点可见；Dialog 焦点陷阱；ESC 关闭。
- 图标按钮有 `aria-label`。
- 对比度 AA；状态不只靠颜色。
- `prefers-reduced-motion` 生效。

### 性能感知

- 首屏无“空白等 JS”（公开页 SSR/流式）。
- 图片有尺寸/懒加载；字体无 FOIT。
- 页面切换有骨架，不闪白。
- 轮询仅在可见时进行；有 Realtime 替代。

---

## 8. 与功能保留的关系

本次 UI 重塑**不删除真实功能**：

- 主题自定义 → 保留，收敛为可访问预设 + 自定义 accent。
- 呼吸动效 → 保留为“动态效果”开关，默认关闭。
- 评论匿名 → 保留，增加验证码 + 审核。
- 公开报名 → 保留为活动级选项；内部活动必须登录。
- 通知 → 保留，改为持久化 + Realtime。
- 项目 checklist/反馈 → 保留，改为结构化 UI。
- 管理端统计 → 保留，改为真实数据。
- 管理员会话管理 → 若要保留，接 Supabase session；否则移除假面板。
- API Key/Webhook → 当前不是真实功能，移除假 UI。

> 具体 schema/迁移见 `docs/SUPABASE_MIGRATION_PLAN.md`；
> 执行顺序/工作量见 `docs/IMPLEMENTATION_ROADMAP.md`。
