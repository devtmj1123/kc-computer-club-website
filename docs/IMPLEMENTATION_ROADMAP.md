# Implementation Roadmap — 重塑执行计划

> 目标：在**尽量保留现有功能**的前提下，修复断点/安全问题，迁移到 Supabase，换成极简 UI，并让站点更顺畅。
> 前提：先完成关键决策确认，再开始改代码。
> 估算基于 1 名全栈开发；并行/熟悉度会显著影响工期。

---

## 1. 执行原则

1. **先止血，再迁移**：P0 不修，迁移期间真实用户会继续受影响。
2. **功能 parity 优先**：每个现有功能都有“保留 / 合并 / 转为脚本 / 移除”记录。
3. **小步切换**：Auth/数据/UI 分三条线，按页面迁移，不做一次性大重写。
4. **数据库先行**：schema/RLS/约束定好再搬代码，避免“边迁边改模型”。
5. **UI 与页面迁移同步**：先建 tokens/组件/shell，再逐页替换，不最后套皮。
6. **可回滚**：Appwrite 只读保留 1-2 周；Supabase 有备份；环境变量可切回。
7. **每阶段可验收**：类型/lint/构建/关键流程/RLS 测试。

---

## 2. 工作流（Workstreams）

| 线 | 内容 | 主要产出 |
|---|---|---|
| A. 止血/安全 | P0 修复、鉴权、PII、死链 | 可用的旧站 + 安全基线 |
| B. Supabase 基础 | 项目、schema、RLS、Auth、Storage | staging 可登录/读写 |
| C. 数据迁移 | 导出、转换、导入、对账 | 全量数据 + 校验报告 |
| D. 学生端 UI/页面 | tokens、组件、shell、页面 | 新学生端 |
| E. 管理端 UI/页面 | admin shell、表格、表单、审核 | 新管理端 |
| F. 性能/加固 | 缓存、图片、Realtime、限流、监控 | 上线就绪 |

依赖关系：

```
A ──► B ──► C ──► D ──► E ──► F
      │           ▲
      └── D 可并行（用 staging/假数据）
```

UI 基础（D 的 tokens/组件）可以在 B 进行时并行，用 mock 数据开发。

---

## 3. 阶段总览

| 阶段 | 目标 | 工期（1 人） | 依赖 |
|---|---|---:|---|
| Phase 0 | 决策确认 + 基线 | 1-2 天 | — |
| Phase 1 | 止血/安全（旧站） | 3-4 天 | Phase 0 |
| Phase 2 | Supabase 基础 | 4-6 天 | Phase 0 |
| Phase 3 | Auth 迁移 | 3-4 天 | Phase 2 |
| Phase 4 | 数据迁移 | 4-6 天 | Phase 2/3 |
| Phase 5 | UI 基础 + 学生端 | 7-9 天 | Phase 3/4 |
| Phase 6 | 管理端 | 7-9 天 | Phase 5 |
| Phase 7 | 性能/加固/上线 | 4-5 天 | Phase 6 |
| **合计** | | **33-45 天** | |

> 2 人并行（1 后端 + 1 前端）可压到 4-5 周；但 Auth/数据迁移仍需串行验证。

---

## 4. Phase 0 — 决策与基线（1-2 天）

### 任务

- [ ] 确认 Supabase Cloud / 自建、区域（建议 Singapore）、Pro/免费。
- [ ] 确认密码迁移策略（bcrypt 直导 / 临时密码）。
- [ ] 确认匿名报名/评论策略。
- [ ] 确认 UI 风格/强调色/主题自定义保留程度。
- [ ] 确认项目公开范围。
- [ ] 确认 `/join`、`/privacy`、`/terms` 是否补。
- [ ] 确认管理员会话管理是否保留。
- [ ] 确认上线方式/维护窗口。
- [ ] 创建 Supabase 项目（staging + prod）。
- [ ] 建 Vercel preview 环境变量。
- [ ] 记录基线：Lighthouse、bundle、请求数、DB 行数。

### 产出

- 决策记录（ADR）。
- Supabase 项目/密钥。
- 基线报告。

### 验收

- 所有待确认项有明确答案。
- staging 可访问。
- 基线指标落盘。

---

## 5. Phase 1 — 止血/安全（3-4 天）

> 在旧 Appwrite 上先修，避免迁移期间继续坏。

### P0 任务

- [ ] **修复学生签到 401**
  - 拆 `POST /api/attendance/check-in`（学生）与 `/api/admin/attendance/*`。
  - 或临时把学生签到分支移到 `requireAdminSession` 之前（最小修复），并加基本校验。
- [ ] **补 `/api/signups`**
  - `GET`（管理员）列表；`PATCH` 状态；或直接接新的 Server Action。
  - 合并 `/admin/signups` 与活动报名页。
- [ ] **关闭公开写接口**
  - `/api/init/*` 生产 404。
  - `/api/attendance/config|record|mark-absent|initialize-session|auto-mark-absent` 加管理员鉴权。
  - `/api/activities` POST/PUT/DELETE、`/api/projects` POST、checklist PUT 加鉴权。
  - `/api/comments/[id]/reply|update` 加管理员/作者校验。
- [ ] **PII 收口**
  - `/api/activities/signup` GET 加管理员鉴权。
  - `/api/attendance/records|my-records|student-stats` 改为本人/管理员。
  - `/api/comments` 默认只返回 approved；不返回 email。
  - `/api/notifications` 按 userId 校验本人。
  - `/api/users/validate` 加限流/仅服务端内部使用。
- [ ] **评论审核**
  - `POST /api/comments` 默认 `pending`。
  - 管理端审核后才公开。
- [ ] **通知**
  - 若短期不迁 Supabase，先把内存 Map 改为 Appwrite 持久化；否则在 UI 标注“测试功能”并停止假 fan-out。
- [ ] **修复 profile 401**
  - 新增 `/api/students/me` 或让 `/api/admin/students/[id]` 允许本人。
- [ ] **管理员 logout**
  - `adminLogout` 调用 `/api/auth/admin-logout` 清 cookie。
- [ ] **密码重置 secret**
  - 强制 `RESET_TOKEN_SECRET`；缺失则启动失败/禁用重置。
- [ ] **死链/假保存**
  - `/privacy`、`/terms`、`/join` 补或移除。
  - `/chat` 链接移除。
  - `/club-settings` 假保存标记/合并。
- [ ] **工程基线**
  - `.env.example`
  - README（Node 20.9+、Supabase 计划）
  - 删除/修复空 scripts
  - 增加 `error.tsx` / `loading.tsx` / `not-found.tsx`

### 验收

- 学生可签到；管理员可看报名；profile 可打开。
- 未登录不能写任何管理数据；公开接口不返回 PII。
- `type-check` / `lint` / build 通过。
- 关键流程回归：登录、签到、报名、公告、项目、评论、管理端审核。

---

## 6. Phase 2 — Supabase 基础（4-6 天）

### 任务

- [ ] 创建 Supabase 项目（staging/prod）。
- [ ] 配置 Auth：
  - Email provider。
  - 关闭公开注册（学生由管理员导入/创建）。
  - SMTP（Resend）或默认邮件。
  - Site URL / redirect URLs。
- [ ] 建 migration：
  - extensions（`pgcrypto`, `pg_trgm` 可选）
  - enums
  - profiles
  - notices/images/tags
  - activities/form_fields
  - signups
  - projects/members/checklist
  - attendance_config/sessions/records
  - comments
  - notifications
  - club_settings
  - audit_logs
- [ ] 建索引/约束/触发器：
  - `updated_at`
  - `handle_new_user`
  - `sync_activity_signup_count`
  - `validate_comment_target`
- [ ] 建 RPC：
  - `student_check_in`
  - `get_attendance_status`
  - `is_admin`
- [ ] 建 RLS policies（矩阵见迁移计划）。
- [ ] 建 Storage buckets/policies。
- [ ] 建 `src/lib/supabase/{client,server,admin}.ts`。
- [ ] 建 `src/proxy.ts`（Next 16）：只刷新 token + 乐观跳转，不做最终授权。
- [ ] 建 `src/lib/auth/{require-user,require-admin}.ts`：每个 Server Action/Route 内重新校验。
- [ ] 生成类型：`supabase gen types typescript`。
- [ ] 写 RLS 测试脚本：
  - anon 读公开/不能读私有
  - student 只能读自己
  - admin 全部
  - 写策略正/反用例

### 验收

- staging 可用邮箱/密码登录。
- anon 只能读公开内容。
- 学生只能读自己；管理员可读写。
- `student_check_in` 可成功/重复/错误 code/时间窗外 四种用例。
- migration 可从零重建。

---

## 7. Phase 3 — Auth 迁移（3-4 天）

### 任务

- [ ] 学生登录改为 Supabase Auth。
  - 学号/邮箱 → email。
  - 登录页统一。
- [ ] 管理员登录改为 Supabase Auth。
  - 用户名 → `${username}@admin.kcc.internal`。
  - 登录后校验 `app_metadata.role === 'admin'`。
- [ ] 删除 localStorage session：
  - `AuthContext` 改为服务端用户 + `useUser()`（可选）。
  - 删除 `studentSession` / `adminSession`。
- [ ] 删除 `admin-session.ts` 与 HMAC cookie。
- [ ] 删除 `auth.service` 的本地 session 函数。
- [ ] 忘记密码/重置密码改为 Supabase。
- [ ] 改密码改为 `updateUser`。
- [ ] `proxy.ts` 乐观路由保护（仅体验，不是授权边界）：
  - `/admin/*` 未登录 → `/admin/login`；非管理员仍由 layout/action 的 `requireAdmin()` 拒绝
  - `/profile`、`/attendance`、`/projects/submit` 未登录 → `/auth/login`
- [ ] 登录后跳转/redirect 参数。
- [ ] 管理员角色同步（app_metadata + profiles）。
- [ ] 登录限流 + Turnstile（可选但建议）。
- [ ] 密码迁移（见 Phase 4）。

### 验收

- 学生/管理员登录/登出/改密/重置全链路可用。
- 刷新/新标签页保持登录。
- 未登录不能访问受保护页面。
- 管理员 cookie 登出后失效。
- 旧 localStorage session 不再被使用。

---

## 8. Phase 4 — 数据迁移（4-6 天）

### 任务

- [ ] Appwrite 导出（**无官方迁出工具**，用 Server SDK/API 分页）：
  - accounts（学生/管理员）：Users API
  - notices / activities / signups / projects / attendance / comments / clubSettings：Databases API
  - Storage 文件：Storage API
  - （可选）若当前版本提供 CSV/JSON 文档导出端点，可用来交叉校验；不作为唯一路径
- [ ] 写转换脚本 `scripts/migrate-appwrite.ts`：
  - ID 映射
  - JSON 拆分
  - 日期/时区
  - 枚举映射
  - 密码 hash
- [ ] 按依赖顺序导入 staging。
- [ ] 密码迁移验证（`auth.admin.createUser({ password_hash })` 导入 bcrypt；失败走临时密码 fallback）。
- [ ] 对账：
  - 行数
  - 抽样字段
  - 外键孤儿
  - 唯一冲突
  - 计数重算
  - 文件可访问
- [ ] 关键业务 UAT：
  - 学生登录
  - 签到
  - 活动报名
  - 项目提交/审核
  - 公告/评论
  - 管理端学生/考勤/报名
- [ ] 写迁移报告（成功/失败/跳过/需人工处理）。
- [ ] 准备最终 delta 脚本。

### 验收

- 数据量/抽样一致。
- 20 个随机学生可登录。
- 报名/考勤/项目/评论关系正确。
- 无 PII 进入公开接口。
- 迁移可重跑（幂等）。

---

## 9. Phase 5 — UI 基础 + 学生端（7-9 天）

### 5.1 UI 基础（2-3 天）

- [ ] `globals.css` 新 tokens（light/dark）。
- [ ] 字体：Noto Sans SC + Geist（`next/font`）。
- [ ] 图标：`lucide-react`，移除 Material Symbols。
- [ ] 组件：
  - Button / Input / Textarea / Select / Checkbox / Radio / Switch
  - Card / Badge / Dialog / Sheet / Toast / Tooltip
  - Table / Pagination / Tabs / EmptyState / Skeleton
  - PageHeader / ConfirmDialog / Avatar
- [ ] 两套 shell：
  - Public/Student Shell（Header + mobile bottom nav + Footer）
  - Admin Shell（Sidebar + topbar）——可 Phase 6 完成
- [ ] 主题：
  - light/dark/system
  - accent presets + 自定义
  - 首屏 inline script（无 `visibility:hidden`）
  - 呼吸动效默认关闭，尊重 reduced motion
- [ ] 表单：zod + react-hook-form 统一。
- [ ] 反馈：Toast/ConfirmDialog 替换 alert/confirm。

### 5.2 学生端页面（5-6 天）

按顺序：

1. `/about`、`/tutorial`（静态试点）
2. `/auth/login`、`/auth/forgot-password`、`/auth/reset-password`
3. `/notices`、`/notices/[id]`
4. `/activities`、`/activities/[id]`、报名
5. `/projects`、`/projects/[id]`、`/projects/submit`、`/projects/[id]/edit`
6. `/attendance`、`/profile`
7. `/` 首页

每页要求：

- [ ] 功能 parity。
- [ ] Server Component 首屏；交互用 client 小岛。
- [ ] 新 tokens/组件，无硬编码颜色。
- [ ] 加载/空/错/无权限。
- [ ] 移动端 375px。
- [ ] 键盘/对比度/focus。
- [ ] 无 alert/confirm。
- [ ] `next/image`。
- [ ] 截图对比。

### 验收

- 学生全链路可用：登录 → 首页 → 公告 → 活动报名 → 项目提交 → 签到 → 资料。
- Lighthouse 移动端 Performance ≥ 85、Accessibility ≥ 90（目标）。
- 0 硬编码颜色（CI grep）。
- 0 alert/confirm。

---

## 10. Phase 6 — 管理端（7-9 天）

按使用频率排序：

1. `/admin` 仪表盘（真实指标/待办）
2. `/admin/notices` + 编辑器
3. `/admin/activities` + 编辑器 + `/admin/signups`
4. `/admin/projects`（审核/反馈）
5. `/admin/students`（分页/导入/编辑/重置密码）
6. `/admin/attendance`（session/验证码/记录/补缺席）
7. `/admin/comments`（审核/回复）
8. `/admin/admins`（合并 `/admin/manage`）
9. `/admin/settings`（社团/外观/考勤/安全；删除假 API/Webhook）
10. `/admin/login` 统一视觉

### 任务

- [ ] Admin shell（侧栏/顶栏/面包屑/用户菜单）。
- [ ] 服务端分页/筛选/排序。
- [ ] 表格组件 + 移动卡片模式。
- [ ] 批量操作 + 确认。
- [ ] 导出 CSV（学生/报名/考勤）。
- [ ] 图片上传 + 预览 + 删除。
- [ ] 富文本/公告 HTML 清洗 + 预览。
- [ ] 活动自定义报名表单编辑器。
- [ ] 项目审核 Dialog + 反馈模板。
- [ ] 学生导入（xlsx 服务端动态 import）。
- [ ] 考勤 session 管理/验证码/记录。
- [ ] 评论审核。
- [ ] 管理员 CRUD + 权限。
- [ ] 设置真实落库。
- [ ] 删除/redirect 重复页面。
- [ ] 假 API Key/Webhook/会话面板：移除或接真实 Supabase session。

### 验收

- 管理员日常流程：发公告 → 建活动 → 看报名 → 审项目 → 看学生 → 考勤 → 审评论 → 设置。
- 所有写操作服务端鉴权。
- 所有列表分页。
- 移动端可用。
- 无假数据/假按钮。

---

## 11. Phase 7 — 性能/加固/上线（4-5 天）

### 性能

- [ ] 公开列表缓存 + revalidateTag。
- [ ] 图片 `next/image` + Storage 变换。
- [ ] 字体子集/预加载。
- [ ] 移除未使用依赖（appwrite/axios/crypto-js/js-cookie/uuid/zustand）。
- [ ] 动态 import `xlsx`。
- [ ] Realtime 替代轮询（通知/考勤管理）。
- [ ] 页面可见性暂停刷新。
- [ ] bundle 分析；首包预算。
- [ ] DB `explain analyze` 检查慢查询。
- [ ] 索引补齐。

### 安全

- [ ] RLS 全表测试（anon/student/admin）。
- [ ] 权限矩阵测试（每个 action）。
- [ ] 速率限制（登录/重置/报名/评论/validate）。
- [ ] Turnstile/reCAPTCHA 服务端校验。
- [ ] CSP/security headers。
- [ ] HTML 清洗。
- [ ] 上传限制。
- [ ] PII 扫描（公开 API/日志/localStorage）。
- [ ] 审计日志。
- [ ] 错误监控（Sentry/Logflare）。
- [ ] 备份/恢复演练。

### 上线

- [ ] 最终 delta 迁移。
- [ ] 维护窗口/公告。
- [ ] 切换环境变量。
- [ ] 冒烟测试。
- [ ] 监控 24h。
- [ ] Appwrite 只读保留。
- [ ] 回滚演练。
- [ ] 更新 README/运维手册。
- [ ] 删除旧代码/依赖/文档。

### 验收

- Lighthouse：Performance ≥ 85、Accessibility ≥ 90、Best Practices ≥ 90。
- 无 P0/P1 安全项。
- RLS 测试全绿。
- 关键流程 E2E 通过。
- 回滚方案可执行。

---

## 12. 功能 Parity 清单

> 每个功能迁移前打勾；没有对应实现就不能删旧页面。

### 学生端

- [ ] 登录（学号/邮箱）
- [ ] 忘记密码/重置密码
- [ ] 修改密码
- [ ] 首页 Hero/招募状态
- [ ] 公告列表/搜索/分类/置顶
- [ ] 公告详情/图片/标签
- [ ] 评论：匿名昵称/发表/5 分钟编辑删除/管理员回复
- [ ] 活动列表/搜索/分类/状态
- [ ] 活动详情/报名/名额/截止/年级限制/公开或内部
- [ ] 自定义报名表单字段
- [ ] 项目列表/搜索/筛选
- [ ] 项目详情/成员/链接/checklist/反馈
- [ ] 项目提交/编辑
- [ ] 签到（验证码/时段/状态）
- [ ] 签到记录/周统计
- [ ] 个人资料
- [ ] 主题：明暗/强调色/动效
- [ ] 通知：未读/已读/删除
- [ ] 教程/关于
- [ ] 隐私/条款（若保留）
- [ ] 招募页（若保留）

### 管理端

- [ ] 仪表盘真实指标/待办
- [ ] 公告 CRUD/草稿/发布/可见性/置顶/图片/标签
- [ ] Instagram 导入
- [ ] 活动 CRUD/状态/可见性/年级/封面/自定义表单
- [ ] 报名列表/搜索/筛选/批量状态/导出
- [ ] 项目审核/反馈/恢复待审
- [ ] 学生列表/搜索/分页/统计
- [ ] 学生导入/新建/编辑/重置密码
- [ ] 考勤配置/场次/验证码/记录/补缺席/导出
- [ ] 评论审核/回复/删除
- [ ] 管理员 CRUD/权限
- [ ] 社团设置/外观/考勤/安全
- [ ] 管理员会话管理（若保留）
- [ ] 通知（真实持久化）

### 明确移除/转脚本

- [ ] `/api/init/*` → `scripts/`
- [ ] `/api/admin/seed` → seed
- [ ] `/api/admin/diagnostic*` → 本地脚本
- [ ] 假 API Key/Webhook
- [ ] 假管理员会话
- [ ] `/chat` 死链
- [ ] 重复 `/admin/manage`、`/admin/dashboard`、`/club-settings`
- [ ] `CHECKLIST::` / `FEEDBACK::`
- [ ] localStorage session
- [ ] XOR cache

---

## 13. 优先级 Backlog（P0-P4）

### P0（立即，Phase 1）

1. 学生签到 401。
2. `/api/signups` 缺失。
3. 公开 PII/写接口。
4. localStorage 伪会话 / 管理员 logout。
5. `/api/init/*` 公开建表。
6. profile 401。
7. 密码重置 secret。
8. 评论自动通过。
9. 通知不持久化（至少标注/停用假 fan-out）。

### P1（迁移基础，Phase 2-4）

1. Supabase schema/RLS/Auth。
2. 数据迁移/密码。
3. API 合并/Server Actions。
4. JSON 拆分。
5. 分页/N+1。
6. 通知持久化/Realtime。
7. 考勤 session 化。
8. 表单校验（zod）。
9. 文件上传限制。

### P2（UI/UX，Phase 5-6）

1. Design tokens/字体/图标。
2. 组件库。
3. 两套 shell。
4. 学生端逐页。
5. 管理端逐页。
6. 主题/动效。
7. 可访问性。
8. 移动端。

### P3（性能，Phase 7）

1. SSR/缓存。
2. 图片/字体。
3. bundle/依赖。
4. Realtime/轮询。
5. DB 索引/查询。
6. Lighthouse。

### P4（工程，贯穿）

1. README/.env.example/scripts。
2. 测试/CI。
3. 监控/日志。
4. 文档/运维手册。
5. 删除旧代码/依赖。

---

## 14. 测试策略

### 单元

- zod schema。
- 日期/周数/时段计算。
- 权限 helper。
- 数据转换函数（JSON 拆分/日期）。

### 集成

- Supabase RLS：
  - anon/student/admin 三种身份。
  - 每张表 select/insert/update/delete 正反用例。
- Server Actions：
  - 未登录/无权限/参数错误/成功。
- 签到 RPC：
  - 时间窗内/外、错误 code、重复、并发。

### E2E（Playwright）

1. 学生登录 → 首页 → 公告 → 活动报名 → 项目提交 → 签到 → 资料。
2. 管理员登录 → 发公告 → 建活动 → 看报名 → 审项目 → 学生 → 考勤 → 评论 → 设置。
3. 未登录访问受保护页 → 登录 → redirect 回原页。
4. 登出 → cookie 失效。

### 手动

- 移动端 375/390/414。
- 键盘走查。
- 屏幕阅读器抽查（VoiceOver/NVDA）。
- 亮/暗/主题色。
- 慢网（Fast 3G）。

---

## 15. 性能预算

| 指标 | 目标 |
|---|---|
| Lighthouse Performance（移动） | ≥ 85 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |
| SEO | ≥ 90 |
| LCP | < 2.5s（4G） |
| CLS | < 0.1 |
| INP | < 200ms |
| 首包 JS（公开页） | < 200KB gzip（目标） |
| 首页请求数 | ≤ 3 个数据请求 |
| API P95 | < 500ms |
| DB 慢查询 | 0（>200ms） |

---

## 16. 风险与应对

| 风险 | 应对 |
|---|---|
| 密码导入失败 | staging 验证；临时密码 fallback |
| RLS 配错 | 权限矩阵 + 自动测试 + 代码 review |
| 迁移数据丢失 | 双路径导出 + 对账 + 只读快照 |
| 管理端迁移遗漏 | parity 清单 + UAT + 按频率排序 |
| UI 重写拖期 | 先组件/shell，再逐页；静态页试点 |
| 匿名功能被刷 | Turnstile + 限流 + 审核 |
| 上线回滚 | 环境变量切换 + Appwrite 只读 + 备份 |
| 预算/休眠 | 确认 Pro；定时 ping |

---

## 17. Definition of Done（整体）

- [ ] 所有 P0 修复。
- [ ] Supabase schema/RLS/Auth/Storage 上线。
- [ ] 数据迁移对账通过。
- [ ] 学生端/管理端功能 parity。
- [ ] 0 硬编码颜色（CI）。
- [ ] 0 alert/confirm。
- [ ] 公开页 SSR/流式；无“空白等 JS”。
- [ ] 移动端/键盘/对比度达标。
- [ ] Lighthouse 达标。
- [ ] RLS/权限测试全绿。
- [ ] 关键流程 E2E 通过。
- [ ] 备份/回滚演练。
- [ ] 文档/运维手册更新。
- [ ] 旧依赖/死代码清理。

---

## 18. 建议的第一周

如果现在开始，建议第一周只做这些：

1. 确认决策（Phase 0）。
2. 修 P0：签到、signups、公开写接口、PII、profile、logout。
3. 建 Supabase staging + schema 初版。
4. 建 UI tokens + Button/Input/Card/Table/Toast/Dialog。
5. 用 `/about` + `/auth/login` 做新视觉试点。

这样一周后能看到：
- 旧站关键功能恢复；
- Supabase 可登录；
- 新设计系统雏形；
- 风险/工期更准确。
