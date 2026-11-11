# Supabase Migration Plan — Appwrite → Supabase

> 目标：把后端从 Appwrite 迁到 Supabase（Postgres + Auth + Storage + Realtime + RLS），同时**保留现有真实功能**、去掉 JSON-in-string/客户端伪会话/运行时建表。
> 原则：先定 schema/RLS/Auth，再迁数据，最后按页面切换；不做“边迁边改模型”。
> 状态：规划稿，未执行。
>
> **2026-11-10 更新：已确认放弃 Appwrite 旧数据，Supabase 从空库开始。**
> 下文 §7（数据迁移）、bcrypt 导入、`migration_id_map`、`legacy_appwrite_id`
> 保留为历史设计参考，不再执行。实际初始化步骤见 `docs/SUPABASE_SETUP.md`。

---

## 1. 为什么迁

| 维度 | Appwrite 现状 | Supabase 目标 |
|---|---|---|
| 数据模型 | 文档数据库；关系查询/join 弱 | Postgres；外键、约束、索引、视图、事务 |
| 权限 | 每个 API route 手写；31/49 漏鉴权 | RLS 在数据库层统一；API 只做入口 |
| 认证 | 自建 bcrypt + localStorage/HMAC cookie | Supabase Auth + HttpOnly cookie + 刷新 |
| 实时 | 无；轮询/内存 Map | Realtime 订阅 |
| 文件 | Appwrite Storage | Supabase Storage + 图片变换 |
| Schema 版本 | 控制台 + `/api/init` 运行时建表 | SQL migration + seed |
| 类型 | 手写 interface 漂移 | `supabase gen types` |
| 运维 | 自建 session/secret | 托管 Auth/DB/Storage |

**不是**“换个 SDK 继续 JSON 字符串”。迁移的核心是**关系化重建**。

---

## 2. 目标架构

```
Browser
  │  (只做 UI / Auth 表单 / Realtime)
  ▼
Next.js 16 App Router
  ├─ Server Components  → 读取数据（server client + RLS）
  ├─ Server Actions     → 写入数据（zod + requireUser/requireAdmin）
  ├─ proxy.ts           → 刷新 Supabase session + 路由保护
  └─ Route Handlers     → 只保留上传/webhook/cron/health/auth callback
        │
        ▼
Supabase
  ├─ Auth (email/password, sessions)
  ├─ Postgres (RLS, functions, triggers, views)
  ├─ Storage (public/private buckets)
  └─ Realtime (notifications, attendance admin)
```

### 2.1 目录建议

```
src/
  app/
    (public)/...
    (student)/...
    admin/...
    auth/callback/route.ts
    api/
      upload/route.ts
      webhooks/resend/route.ts
      cron/attendance/route.ts
      health/route.ts
  actions/
    auth.ts
    notices.ts
    activities.ts
    signups.ts
    projects.ts
    attendance.ts
    comments.ts
    notifications.ts
    admin.ts
  features/
    notices/{queries.ts,schema.ts,types.ts}
    activities/...
    projects/...
    attendance/...
    comments/...
    notifications/...
  lib/
    supabase/{client.ts,server.ts,admin.ts}
    auth/{require-user.ts,require-admin.ts}
    validation/{common.ts}
    rate-limit.ts
    turnstile.ts
  proxy.ts
supabase/
  migrations/
    0001_extensions.sql
    0002_profiles.sql
    ...
  seed/
```

### 2.2 客户端/服务端边界

- **浏览器只拿 anon key**；service role key 只在服务端。
- 浏览器只用于：
  - `supabase.auth.*`（登录/登出/改密/重置）
  - Realtime 订阅
  - Storage 上传（如需要，走 signed upload）
- **所有业务读写走 Server Components / Server Actions**，不在客户端直接 `from('table').select()`。
- 这样即使 RLS 配错，客户端也没有任意查询入口；RLS 仍是第二道防线。

---

## 3. 认证设计

### 3.1 学生

**登录标识**

- 支持学号或邮箱。
- 学号 → `${studentNo}@kuencheng.edu.my`（沿用现有规则）。
- 邮箱 → 原样小写。
- 登录页一个输入框“学号 / 邮箱”，前端判断是否含 `@`。

**流程**

1. `signInWithPassword({ email, password })`（browser client）。
2. `proxy.ts` 写入/刷新 cookie。
3. 服务端 `getUser()` 读取用户；`profiles` 里取角色/资料。
4. 学生只能访问学生路由；管理员可访问管理端（按角色）。

**密码**

- 迁移时优先保留 bcrypt hash（见 §7）。
- `require_password_change` 保留；首次登录强制改密。
- 密码规则沿用现有：≥8、大小写、数字、特殊字符（可按学校要求调整）。
- 忘记密码：Supabase `resetPasswordForEmail` + Resend SMTP；一次性 token。
- 学生邮箱是学校邮箱；如果不可收信，管理员可生成临时密码/重置链接。

### 3.2 管理员

**登录标识**

- 保留“用户名”登录体验。
- 管理员 Auth 邮箱用确定性合成地址：`${username}@admin.kcc.internal`。
- 不把管理员邮箱暴露到前端；登录页只显示用户名。

**角色**

- `app_metadata.role = 'admin'`（JWT 可信，用户不能改）。
- `profiles.role = 'admin'`（用于查询/展示）。
- `profiles.permissions text[]`（保留现有权限字符串能力）。
- 提权/降权只能由服务端用 service role 更新 `app_metadata` + `profiles`。
- RLS 助手函数：

```sql
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;
```

> 用 JWT claim 避免每次 RLS 都查 `profiles`（递归/性能问题）。
> 对敏感操作再用 `getUser()` 查最新用户，防止 JWT 未及时刷新。

**管理员会话管理**

- 若要保留“登录设备/登出其他设备”：用 Supabase Admin API 列出/撤销 `auth.sessions`。
- 若不保留：删除假面板，不做假 UI。
- 建议保留为真实功能（成本不高），但放到“安全”页，默认折叠。

### 3.3 Session / Cookie

> **关键边界（已核对 Next.js 16 / Supabase 官方文档）**：`proxy.ts` 只做“乐观检查 + token 刷新”，**不是授权边界**。Next.js 官方明确不建议把 Proxy 当成完整的 session/authorization 方案；Supabase 官方也要求在每个 Server Action / Route Handler 里重新 `getClaims()` 或 `requireUser/requireAdmin`。

- `@supabase/ssr`：
  - `createBrowserClient`（浏览器，只用于 Auth/Realtime）
  - `createServerClient`（Server Component/Action/Route，必须每个请求新建）
- `proxy.ts`（Next 16 的 `middleware.ts` 新名字，Node.js runtime）负责：
  - matcher 排除 `_next/static`、`_next/image`、favicon、图片。
  - 调用 `supabase.auth.getClaims()` 刷新/验证 token，并写入 cookie。
  - 只做“未登录 → 登录页”的乐观重定向；不做重查询、不做最终授权。
- Server Component / Server Action / Route Handler：
  - 统一 `requireUser()` / `requireAdmin()`，内部用 `getClaims()`；需要最新用户记录时用 `getUser()`。
  - 绝不信任 `getSession()` 在服务端返回的 cookie 内容。
- 删除：
  - `src/lib/admin-session.ts`
  - `AuthContext` 的 localStorage session
  - `auth.service` 的 `checkSession/getCurrentAdmin/getAdminSessions/logoutOtherSession`
  - `localStorage.studentSession/adminSession`
- 登录后跳转：
  - 学生 → `/` 或 `?redirect=`
  - 管理员 → `/admin`
  - 未登录访问 `/admin/*` → `/admin/login?redirect=...`
  - 已登录访问登录页 → 对应首页。

### 3.4 防滥用

- 登录/忘记密码/重置密码：IP + 账号双维度限流（Upstash Redis / Vercel KV）。
- 注册/报名/评论：Cloudflare Turnstile（或现有 reCAPTCHA v3）服务端校验。
- 管理员登录失败：指数退避/短时锁定。
- 所有 Server Action 校验 Origin（Next Server Actions 自带部分保护，仍显式检查）。
- 敏感操作写 `audit_logs`。

---

## 4. 数据库 Schema

> 所有表默认 `id uuid primary key default gen_random_uuid()`、`created_at timestamptz default now()`、`updated_at timestamptz default now()`，除非另注。
> 所有 public 表启用 RLS。
> 保留 `legacy_appwrite_id text unique` 便于迁移对账。

### 4.1 profiles

```sql
create type public.user_role as enum ('student', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  student_no text unique,
  chinese_name text,
  english_name text,
  class_name_cn text,
  class_name_en text,
  class_code text,
  group_level text,
  level text,
  phone text,
  instagram text,
  group_name text,
  position text,
  notes text,
  role public.user_role not null default 'student',
  permissions text[] not null default '{}',
  is_active boolean not null default true,
  require_password_change boolean not null default true,
  avatar_url text,
  last_login_at timestamptz,
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);
create index profiles_student_no_idx on public.profiles(student_no);
create index profiles_email_lower_idx on public.profiles(lower(email));
```

**Trigger**：`auth.users` 新增时自动建 profile（读取 `raw_user_meta_data`）。

### 4.2 notices / notice_images / notice_tags

```sql
create type public.publish_status as enum ('draft', 'published');
create type public.visibility as enum ('public', 'internal');

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,                 -- 清洗后的 HTML
  category text not null default '其他',
  author_id uuid references public.profiles(id) on delete set null,
  author_name text not null,
  last_editor_id uuid references public.profiles(id) on delete set null,
  last_editor_name text,
  status public.publish_status not null default 'draft',
  visibility public.visibility not null default 'public',
  pinned boolean not null default false,
  published_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,''))
  ) stored,
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notices_public_idx on public.notices(status, visibility, published_at desc);
create index notices_pinned_idx on public.notices(pinned desc, published_at desc);
create index notices_search_idx on public.notices using gin(search_vector);

create table public.notice_images (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0
);

create table public.notice_tags (
  notice_id uuid not null references public.notices(id) on delete cascade,
  tag text not null,
  primary key (notice_id, tag)
);
```

### 4.3 activities / activity_form_fields

```sql
create type public.activity_status as enum ('draft','published','ongoing','completed','cancelled');
create type public.signup_mode as enum ('auth_required','public');

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null default '其他',
  start_at timestamptz not null,
  end_at timestamptz not null,
  location text not null,
  max_participants int not null default 0,       -- 0 = 不限
  signup_deadline timestamptz not null,
  organizer_id uuid references public.profiles(id) on delete set null,
  organizer_name text not null,
  status public.activity_status not null default 'draft',
  visibility public.visibility not null default 'public',
  signup_mode public.signup_mode not null default 'public',
  cover_url text,
  allowed_grades text[] not null default '{}',
  signup_count int not null default 0,           -- 触发器维护
  published_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(location,''))
  ) stored,
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activity_time_check check (end_at > start_at),
  constraint activity_deadline_check check (signup_deadline <= start_at)
);

create index activities_public_idx on public.activities(status, visibility, start_at);
create index activities_start_idx on public.activities(start_at);
create index activities_search_idx on public.activities using gin(search_vector);

create table public.activity_form_fields (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text not null check (field_type in ('text','email','phone','select','textarea','date')),
  required boolean not null default false,
  options jsonb not null default '[]',
  placeholder text,
  sort_order int not null default 0,
  unique (activity_id, field_key)
);
```

### 4.4 signups

```sql
create type public.signup_status as enum ('pending','confirmed','cancelled','attended');

create table public.signups (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  student_no text,
  grade text,
  additional_info text,
  form_data jsonb not null default '{}',
  status public.signup_status not null default 'pending',
  notes text,
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index signups_activity_email_uniq on public.signups(activity_id, lower(email));
create unique index signups_activity_user_uniq on public.signups(activity_id, user_id) where user_id is not null;
create index signups_activity_status_idx on public.signups(activity_id, status);
```

**计数**

- `activities.signup_count` 由触发器在 insert/update/delete 时维护：
  - 只统计 `status <> 'cancelled'`。
  - 避免应用层 `incrementRegisteredCount` 漂移。
- 或者建 view `activity_signup_counts`；推荐触发器 + 索引，列表查询快。

### 4.5 projects / project_members / project_checklist_items

```sql
create type public.project_status as enum ('pending','approved','rejected','revision');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  title text not null,
  description text not null,
  category text not null,
  objectives text,
  timeline text,
  resources text,
  project_link text,
  leader_id uuid references public.profiles(id) on delete set null,
  leader_email text not null,
  status public.project_status not null default 'pending',
  admin_feedback text,
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_status_idx on public.projects(status);
create index projects_leader_idx on public.projects(leader_id);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  role text not null default 'member' check (role in ('leader','member','tech_lead','design_lead')),
  joined_at timestamptz not null default now(),
  sort_order int not null default 0
);

create unique index project_members_email_uniq on public.project_members(project_id, lower(email));

create table public.project_checklist_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  completed boolean not null default false,
  completed_at timestamptz,
  assignee text,
  sort_order int not null default 0
);
```

**迁移映射**

- `projects.members` JSON → `project_members` 行。
- `projects.resources` 的 `CHECKLIST::...` → `project_checklist_items`；剩余文本 → `resources`。
- `projects.timeline` 的 `FEEDBACK::...` → `admin_feedback`；剩余文本 → `timeline`。

### 4.6 attendance_config / attendance_sessions / attendance_records

```sql
create table public.attendance_config (
  id smallint primary key default 1 check (id = 1),
  day_of_week smallint not null default 2 check (day_of_week between 0 and 6),
  session1_start time not null default '15:20',
  session1_duration int not null default 5,
  session2_start time not null default '16:35',
  session2_duration int not null default 5,
  week_start_date date not null,
  code_enabled boolean not null default false,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create type public.attendance_session_status as enum ('scheduled','open','closed');
create type public.attendance_status as enum ('present','absent','late','pending');

create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  week_number int not null,
  session_number smallint not null check (session_number in (1,2)),
  session_date date not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  checkin_code text,
  code_enabled boolean not null default false,
  status public.attendance_session_status not null default 'scheduled',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (week_number, session_number),
  constraint session_time_check check (ends_at > starts_at)
);

create index attendance_sessions_open_idx on public.attendance_sessions(status, starts_at, ends_at);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  student_name text not null,
  student_email text not null,
  check_in_at timestamptz,
  status public.attendance_status not null default 'pending',
  notes text,
  legacy_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id)
);

create index attendance_records_student_idx on public.attendance_records(student_id, session_id);
create index attendance_records_session_idx on public.attendance_records(session_id, status);
```

**为什么拆 sessions**

- 一个场次一个 code，避免 `clubSettings` 里只有两个 code、跨周复用。
- 时间窗由 `starts_at/ends_at` 唯一决定；不再散落在 service/route。
- 关闭场次/补缺席可由 cron 或管理员动作完成。
- 学生签到 RPC 只需 `session_id + auth.uid()`。

### 4.7 comments

```sql
create type public.comment_status as enum ('pending','approved','rejected');
create type public.comment_target as enum ('notice','activity');

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  content_type public.comment_target not null,
  content_id uuid not null,
  user_id uuid references public.profiles(id) on delete set null,
  nickname text not null,
  email text,
  content text not null,
  status public.comment_status not null default 'pending',
  is_deleted boolean not null default false,
  reply text,
  reply_author_id uuid references public.profiles(id) on delete set null,
  reply_author_name text,
  reply_at timestamptz,
  legacy_appwrite_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_target_idx on public.comments(content_type, content_id, status, created_at desc);
create index comments_pending_idx on public.comments(status, created_at desc);
```

**完整性**

- 多态 `content_type/content_id` 无法直接 FK；用 trigger 校验目标存在。
- 或者拆 `notice_id` / `activity_id` 两列 + check；实现更安全但查询稍繁。建议 trigger 校验 + 应用层约束。

### 4.8 notifications

```sql
create type public.notification_type as enum ('approval','notice','activity','announcement');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type public.notification_type not null,
  read boolean not null default false,
  related_type text,
  related_id uuid,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id, read, created_at desc);
```

### 4.9 club_settings

```sql
create table public.club_settings (
  id smallint primary key default 1 check (id = 1),
  club_name text not null,
  description text,
  mission text,
  vision text,
  email text,
  phone text,
  location text,
  meeting_time text,
  website text,
  facebook text,
  twitter text,
  instagram text,
  discord text,
  github text,
  youtube text,
  logo_url text,
  favicon_url text,
  hero_image_url text,
  hero_image_alt text,
  recruitment_status text,
  notice_card_logo_url text,
  activity_card_logo_url text,
  project_card_logo_url text,
  card_logo_link text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
```

### 4.10 audit_logs

```sql
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs(entity, entity_id, created_at desc);
```

### 4.11 索引/约束清单

- 所有外键列建索引。
- 公开列表：`(status, visibility, published_at desc)` / `(status, visibility, start_at)`。
- 搜索：`tsvector` + GIN。
- 报名唯一：`(activity_id, lower(email))`、`(activity_id, user_id)`。
- 考勤唯一：`(session_id, student_id)`。
- 通知：`(user_id, read, created_at desc)`。
- 评论：`(content_type, content_id, status, created_at desc)`。
- 项目：`status`、`leader_id`。
- 所有 `updated_at` 用 trigger 自动更新。

---

## 5. RLS 策略矩阵

> 所有表 `alter table ... enable row level security;`
> `service_role` 绕过 RLS，只用于服务端管理操作/迁移。
> `anon` 只读公开数据；`authenticated` 按角色。

| 表 | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | 本人；管理员全部 | trigger only | 本人（安全列：姓名/英文名/电话/IG/头像）；管理员全部 | 管理员 |
| notices | `published + public` 所有人；`published + internal` 登录用户；管理员全部 | 管理员 | 管理员 | 管理员 |
| notice_images/tags | 跟随 notice | 管理员 | 管理员 | 管理员 |
| activities | `published + public` 所有人；`published + internal` 登录；管理员全部 | 管理员 | 管理员 | 管理员 |
| activity_form_fields | 跟随 activity | 管理员 | 管理员 | 管理员 |
| signups | 本人；管理员全部 | 本人（登录）或 Server Action（匿名 + Turnstile）；禁止直接 anon insert | 本人取消；管理员全部 | 管理员 |
| projects | `approved` 所有人；成员/组长本人；管理员全部 | 登录学生（leader_id = auth.uid()） | 组长（pending/revision 时）；管理员全部 | 管理员/组长（pending） |
| project_members | 跟随 project | 组长/管理员 | 组长/管理员 | 组长/管理员 |
| project_checklist_items | 跟随 project | 组长/管理员 | 组长/管理员 | 组长/管理员 |
| attendance_config | 管理员 | 管理员 | 管理员 | 管理员 |
| attendance_sessions | 管理员；公开 view 只暴露时间/是否开放，不暴露 code | 管理员/服务端 | 管理员/服务端 | 管理员 |
| attendance_records | 本人；管理员全部 | 只通过 `student_check_in()` RPC | 管理员；RPC 只更新本人 | 管理员 |
| comments | `approved + not deleted` 所有人；管理员全部 | 登录用户或 Server Action（匿名 + Turnstile） | 本人 5 分钟内（仅 content）；管理员全部 | 管理员（软删） |
| notifications | 本人 | 服务端/service role | 本人（read） | 本人/管理员 |
| club_settings | 所有人 | 管理员 | 管理员 | — |
| audit_logs | 管理员 | 服务端 trigger/action | — | — |

### 5.1 RLS 示例

> 以下写法遵循 Supabase 官方 RLS 性能建议：
> - 用 `(select auth.uid())` 包住固定函数，让优化器生成 `initPlan`，避免逐行调用。
> - 给策略列建索引（如 `student_id`、`user_id`、`leader_id`）。
> - 策略显式 `to authenticated` / `to anon`，缩小适用范围。
> - 应用查询仍显式带上 `.eq('user_id', userId)`，不要只依赖 RLS 过滤。

```sql
-- profiles
create policy "profiles_select_own" on public.profiles
for select to authenticated
using ((select auth.uid()) = id or (select public.is_admin()));

create policy "profiles_update_own" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
-- 敏感列（role/permissions/is_active）通过列级 grant 或 RPC 限制，
-- 不要只靠 RLS：RLS 不能按列限制 UPDATE。

create index profiles_role_idx on public.profiles(role);

-- notices
create policy "notices_public_read" on public.notices
for select to anon, authenticated
using (
  (status = 'published' and visibility = 'public')
  or (status = 'published' and visibility = 'internal' and (select auth.uid()) is not null)
  or (select public.is_admin())
);

create policy "notices_admin_insert" on public.notices
for insert to authenticated
with check ((select public.is_admin()));

create policy "notices_admin_update" on public.notices
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "notices_admin_delete" on public.notices
for delete to authenticated
using ((select public.is_admin()));

-- attendance records
create policy "attendance_select_own" on public.attendance_records
for select to authenticated
using (student_id = (select auth.uid()) or (select public.is_admin()));

create index attendance_records_student_idx on public.attendance_records(student_id);
create index attendance_records_session_idx on public.attendance_records(session_id, status);
```

**`is_admin()` 建议**

```sql
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
```

- 用 `auth.jwt()` 而不是每次查 `profiles`，避免递归和额外查询。
- `security definer` + 固定 `search_path`，防止 search_path 注入。
- JWT 未刷新时可能短暂过期；敏感操作再用 `getUser()` 查最新用户。

### 5.2 函数（security definer）

**`student_check_in(p_code text)`**

- 入参只有 code；学生身份从 `auth.uid()` 取。
- 查找当前时间窗内 `status='open'` 且 `checkin_code = p_code` 的 session。
- 校验学生角色、是否已签到。
- 插入/更新 `attendance_records`，状态 `present` 或 `late`（按时间窗/迟到缓冲）。
- 返回 `{ success, session_number, status, checked_in_at }`。
- `revoke all on function ... from public; grant execute to authenticated;`

**`get_attendance_status()`**

- 返回当前是否开放、场次、剩余时间、是否已签到；**不返回 code**。
- 学生端 widget 用它显示状态。

**`is_admin()`**

- 读 JWT `app_metadata.role`；稳定函数。

**`handle_new_user()`**

- `auth.users` insert 后创建 `profiles`。
- 从 `raw_user_meta_data` 读姓名/学号；默认 role student。

**`sync_activity_signup_count()`**

- signups insert/update/delete 后更新 `activities.signup_count`。

**`set_updated_at()`**

- 所有表通用。

### 5.3 公开 view

```sql
create view public.public_attendance_sessions
with (security_invoker = true) as
select id, week_number, session_number, session_date, starts_at, ends_at, status
from public.attendance_sessions
where status in ('scheduled','open');
```

- 不含 `checkin_code`。
- 学生端只看“是否开放/时间”，不拿 code。

---

## 6. Storage

### 6.1 Buckets

| Bucket | Public | 用途 | 策略 |
|---|---|---|---|
| `public-assets` | 是 | 公告封面、活动封面、社团 logo/hero、项目图片 | public read；admin write/update/delete |
| `avatars` | 是（或 signed） | 学生/管理员头像 | public read；本人写自己的路径 |
| `private` | 否 | 导出文件/敏感附件（如未来） | signed URL；admin/本人 |

### 6.2 路径

```
public-assets/
  notices/{noticeId}/{uuid}.webp
  activities/{activityId}/{uuid}.webp
  projects/{projectId}/{uuid}.webp
  settings/hero.webp
  settings/logo.webp
avatars/{userId}/{uuid}.webp
```

### 6.3 上传

- 走 Server Action/Route Handler：
  - `requireAdmin()` 或本人。
  - 校验 MIME（jpeg/png/webp）、大小（≤5MB）、数量（≤6）。
  - 文件名用 `crypto.randomUUID()`，不保留原始文件名。
- **图片优化二选一，避免双重压缩**：
  - 方案 A（推荐，成本低）：上传原图到 Storage，用 `next/image` 的默认优化器输出响应式 WebP；`next.config.ts` 配置 `images.remotePatterns` 指向 Supabase Storage。
  - 方案 B（Pro 计划）：用 Supabase Storage Image Transformations + Next.js custom loader，按 `width`/`quality` 生成；注意官方文档标注 Image Resizing 需要 **Pro Plan 及以上**。
  - 不要同时让 Supabase 变换和 Next 优化器处理同一张图。
- 删除旧图时同时删 Storage 对象（避免孤儿）。
- `next.config.ts` 配置 Supabase 域名 `remotePatterns`；只允许自己的 project host + bucket 路径，避免开放通配。

---

## 7. 数据迁移

### 7.1 导出 Appwrite

> **重要纠正（已核对官方文档）**：Appwrite 的 Migrations 服务是“迁移到 Appwrite”的工具，支持从 Firebase/Supabase/Nhost/自建/Cloud 导入；它**不提供 Appwrite → Supabase 的一键迁出**。因此不要把它当作迁出方案。

推荐路径：

1. **Appwrite Server SDK/API 分页读取**（主路径）：
   - `Users` API：学生 + 管理员账号（`users` / `admins` collection）。
   - `Databases` API：`notices`、`activities`、`signups`、`projects`、`attendance`、`comments`、`clubSettings`。
   - `Storage` API：公告封面、活动封面、社团 logo/hero 等文件。
   - 用 `Query.limit(100)` + `Query.offset` 或 cursor 分页；记录每条 `$id`、`$createdAt`、`$updatedAt`。
2. **文档导出端点（可选，需按当前版本确认）**：若 Console/API reference 提供 Migrations 的 CSV/JSON 导出，可用于文档级导出；账号和文件仍需 Users/Storage API。不要把它当作唯一路径。
3. **自建 Appwrite 的数据库 dump**（仅最后手段）：直接导 MariaDB 需要理解 Appwrite 内部 schema，跨版本风险高，不推荐作为主路径。
4. 导出为 NDJSON/JSON + 文件清单 + 校验和；先备份，再转换。

### 7.2 ID 映射

- 方案 A：`legacy_appwrite_id text unique` 保留原 ID；新表用 UUID。
- 方案 B：用 UUID v5（namespace + Appwrite ID）生成确定性 UUID；跨表 FK 稳定。
- 推荐 **A + B 结合**：
  - 新 UUID 由确定性函数生成，便于重跑。
  - 同时保留 `legacy_appwrite_id` 对账。
- 建立 `migration_id_map(appwrite_collection, appwrite_id, new_uuid)` 临时表。

### 7.3 字段映射

| Appwrite | Supabase | 转换 |
|---|---|---|
| users.$id | profiles.id / auth.users.id | UUID v5 |
| users.email | auth.users.email + profiles.email | lower/trim |
| users.passwordHash | auth.users.encrypted_password | bcrypt 原样（见 §7.4） |
| users.studentId | profiles.student_no | string |
| users.chineseName/englishName | profiles.chinese_name/english_name | 原样 |
| users.classNameCn/En/classCode | profiles.class_name_cn/en/class_code | 原样 |
| users.groupLevel/level/group/position/notes | profiles.* | 原样 |
| users.phone/instagram | profiles.phone/instagram | 原样 |
| users.role | profiles.role | student/admin |
| users.requirePasswordChange | profiles.require_password_change | bool |
| admins.username | auth.users.email = `${username}@admin.kcc.internal` | 合成 |
| admins.passwordHash | auth.users.encrypted_password | bcrypt |
| admins.permissions (JSON string) | profiles.permissions text[] | JSON parse |
| notices.coverImage (JSON string) | notice_images | parse array |
| notices.tags (JSON string) | notice_tags | parse array |
| notices.content | notices.content | 服务端清洗后保留 HTML |
| activities.signupFormFields (JSON string) | activity_form_fields | parse |
| activities.allowedGrades (JSON string) | activities.allowed_grades text[] | parse |
| activities.startTime/endTime | start_at/end_at timestamptz | ISO/UTC 校正 |
| activities.currentParticipants | activities.signup_count | 重算，不直接信旧值 |
| signups.formData (JSON string) | signups.form_data jsonb + 顶层字段 | parse；fullName/studentId/grade 拆列 |
| projects.members (JSON string) | project_members | parse |
| projects.resources `CHECKLIST::` | project_checklist_items | 拆前缀 |
| projects.timeline `FEEDBACK::` | projects.admin_feedback | 拆后缀 |
| attendance `$id` `${studentId}_${sessionNumber}_${weekNumber}` | attendance_sessions + attendance_records | 解析 + 重建 session |
| attendance.studentId | attendance_records.student_id | 映射到 profile UUID |
| comments.reply/replyAuthor/replyAt | comments.reply/reply_author_* | 原样 |
| clubSettings.attendanceSession1Start (JSON) | attendance_config.session1_start time | parse |
| clubSettings.attendanceCode1/2 | attendance_sessions.checkin_code | 只保留当前周/场次；历史 code 可丢弃 |
| Storage file URL | Storage 对象 | 下载→上传→替换 URL |

### 7.4 密码迁移（bcrypt）

**已核对事实（Supabase 官方文档）**

- 现有学生/管理员密码是 `bcryptjs` 生成的 bcrypt hash，存在 `users.passwordHash` / `admins.passwordHash`。
- Supabase Auth 支持 **bcrypt 和 Argon2** 密码 hash；官方迁移指南明确可用 `supabase.auth.admin.createUser({ email, password_hash, email_confirm: true })` 导入已有 hash。
- `password_hash` 会写入 `auth.users.encrypted_password`；用户用原密码即可登录。
- 不再推荐把“直接写 `auth.users`”作为主路径；Admin API 是官方支持的方式。

**推荐流程（staging 先验证）**

1. 在 staging 用 `auth.admin.createUser` 建一个测试用户，传入现有 bcrypt hash：
   ```ts
   const { data, error } = await supabase.auth.admin.createUser({
     email,
     password_hash: legacyBcryptHash, // $2a$ / $2b$
     email_confirm: true,
     app_metadata: { role: 'student' },
     user_metadata: { student_no, chinese_name, ... },
   })
   ```
2. 用原密码 `signInWithPassword` 测试。
3. 通过后批量导入学生/管理员：
   - 学生：真实学校邮箱；`app_metadata.role = 'student'`。
   - 管理员：`${username}@admin.kcc.internal` 合成邮箱；`app_metadata.role = 'admin'`。
   - `email_confirm: true`，避免迁移后卡在验证邮件。
4. 导入后逐批抽测（至少 20 个随机账号），再全量。
5. 失败 fallback：
   - 生成临时密码（随机 12 位）。
   - `auth.admin.createUser({ email, password, email_confirm: true })`。
   - `profiles.require_password_change = true`。
   - 通过管理员导出/邮件/纸质分发临时密码；首次登录强制改密。

**注意**

- bcrypt cost 10 的 hash 可以继续用；Supabase 登录时会用相同 hash 校验，并在 cost 过低时自动 rehash。
- 不要 `bcrypt.hash` 二次哈希。
- 不要迁移 `password` 明文字段（如果有）。
- 迁移后删除 `passwordHash` 列/字段。
- 管理员合成邮箱也要建 `auth.identities`（Admin API 会自动处理）。
- 如果当前 Supabase/GoTrue 版本不认 `password_hash`，直接走 fallback，不阻塞上线。
- 迁移脚本必须幂等：按 email/legacy id upsert，避免重复建号。

### 7.5 迁移顺序（依赖）

1. `profiles` / `auth.users`（学生 + 管理员）
2. `club_settings` / `attendance_config`
3. `notices` + images/tags
4. `activities` + form fields
5. `signups`（依赖 activities/profiles）
6. `projects` + members + checklist
7. `attendance_sessions` + `attendance_records`
8. `comments`（依赖 profiles/notices/activities）
9. `notifications`（可空启动）
10. Storage 文件
11. 重算计数/统计
12. 对账

### 7.6 校验

- 行数对比：每张表 `count(*)` vs Appwrite `total`。
- 抽样：每类 10 条逐字段 diff。
- 外键孤儿：`signups.activity_id`、`project_members.project_id`、`attendance_records.session_id`。
- 唯一性：重复邮箱、重复报名、重复考勤。
- 计数：`activities.signup_count` vs 实际 signups。
- 密码：随机 20 个账号登录测试。
- 文件：URL 200/图片可打开；数量对比。
- 关键业务：报名→审核→签到→项目提交→评论→通知。

### 7.7 切换

1. 建 Supabase staging；跑全量迁移 + 校验。
2. 部署 preview 指向 staging；UAT。
3. 选定维护窗口（低峰，建议 30-60 分钟）。
4. 冻结 Appwrite 写入（维护页/只读）。
5. 导出最终增量（delta）。
6. 导入 Supabase；跑校验脚本。
7. 切换 Vercel 环境变量到 Supabase。
8. 冒烟测试：登录、签到、报名、项目、公告、管理端。
9. Appwrite 保持只读 1-2 周，作为回滚快照。
10. 回滚：环境变量切回 + 恢复 delta（如果需要）。

---

## 8. API / 逻辑精简

### 8.1 目标

- 49 个 route → **约 10-12 个 route handlers + 域 Server Actions**。
- 公开读 → Server Components（不建 API）。
- 写 → Server Actions（zod + auth + revalidate）。
- 只保留：
  - `auth/callback`（Supabase OAuth/邮件回调）
  - `api/upload`（如不在 Server Action 处理）
  - `api/webhooks/resend`（邮件事件）
  - `api/cron/attendance`（关闭场次/补缺席）
  - `api/health`
  - 可能的 `api/realtime/token`（如需）

### 8.2 旧 → 新映射

| 旧 route | 新实现 |
|---|---|
| `/api/auth/student-login` | Supabase `signInWithPassword`（client） |
| `/api/auth/admin-login` | 同一登录页 + 角色校验 |
| `/api/auth/*-change-password` | `supabase.auth.updateUser` |
| `/api/auth/forgot-password` / `reset-password` | `resetPasswordForEmail` + callback |
| `/api/notices` GET | Server Component `getNotices()` |
| `/api/notices` POST/PUT/DELETE | `actions/notices.ts` |
| `/api/activities` GET | Server Component `getActivities()` |
| `/api/activities` POST/PUT/DELETE | `actions/activities.ts` |
| `/api/activities/signup` | `actions/signups.ts`（create/update/cancel） |
| `/api/signups`（缺失） | `actions/signups.ts` + admin queries |
| `/api/projects` GET | Server Component `getProjects()` |
| `/api/projects` POST/PUT/DELETE | `actions/projects.ts` |
| `/api/projects/[id]/checklist` | `actions/projects.ts` |
| `/api/attendance` GET | `getAttendanceStatus()` view/RPC |
| `/api/attendance` POST（学生签到） | `student_check_in()` RPC |
| `/api/attendance/config` | `actions/attendance.ts`（admin） |
| `/api/attendance/record(s)` | admin queries/actions |
| `/api/attendance/mark-absent` / `initialize-session` / `auto-mark-absent` | `actions/attendance.ts` + cron |
| `/api/comments` | Server Component + `actions/comments.ts` |
| `/api/comments/[id]/reply|update` | `actions/comments.ts`（admin/owner） |
| `/api/notifications` | Server Component + Realtime + `actions/notifications.ts` |
| `/api/club-settings` | Server Component + `actions/settings.ts` |
| `/api/admin/students*` | admin queries + `actions/students.ts` |
| `/api/admin/manage|admins` | `actions/admins.ts` |
| `/api/users/validate` | 删除；服务端内部查询 |
| `/api/init/*`、`/api/admin/seed`、diagnostic | `scripts/` + `supabase/seed` |
| `/api/upload*` | `actions/upload.ts` 或单个 route |

### 8.3 统一响应/错误

- Server Action 返回 `{ ok: true, data } | { ok: false, error: { code, message, fieldErrors? } }`。
- zod 错误 → `fieldErrors`。
- 未登录 → `UNAUTHORIZED`；无权限 → `FORBIDDEN`；不存在 → `NOT_FOUND`。
- 客户端 `useActionState` 显示字段错误/Toast。
- 不再混用 `{error}` / `{success:false}` / 直接数组。

### 8.4 校验

- 每个 action 一个 zod schema：
  - 字符串 trim/长度/枚举。
  - 邮箱/电话格式。
  - 日期先后（end > start，deadline <= start）。
  - 数组最大长度（成员/表单字段/图片）。
  - HTML 内容清洗（`sanitize-html` 或 DOMPurify 服务端）。
- 客户端复用同一 schema（`react-hook-form` + `@hookform/resolvers`）。

### 8.5 缓存

- 公开读取：
  - `unstable_cache` / `revalidateTag`：
    - `notices:list`
    - `activities:list`
    - `club-settings`
  - 或 Next 16 的 `use cache`（按项目配置采用）。
- 写后：
  - `revalidatePath('/notices')`
  - `revalidateTag('notices:list')`
- 用户相关数据不缓存（或按 user id 短 TTL）。
- Realtime 用于通知/考勤管理；列表仍以 revalidate 为主。

### 8.6 移除依赖

迁移后删除：

- `appwrite`、`node-appwrite`
- `axios`（用 fetch）
- `crypto-js`（不再自定义加密）
- `js-cookie`（Supabase SSR 管理 cookie）
- `uuid`（`crypto.randomUUID`）
- `zustand`（未使用）
- 自建 `src/lib/cache.ts`
- `src/lib/admin-session.ts`
- `src/services/appwrite*.ts`
- `src/services/auth.service.ts` 的本地 session 部分

保留：

- `zod`、`react-hook-form`、`@hookform/resolvers`
- `date-fns`
- `clsx`、`tailwind-merge`
- `xlsx`（服务端动态 import）
- `resend`（邮件）
- `@vercel/analytics`、`speed-insights`
- `react-google-recaptcha-v3`（或换 Turnstile）

---

## 9. 性能优化（后端侧）

1. **消除 N+1**：
   - 活动列表用 `signup_count` 列/视图。
   - 学生列表用聚合查询/视图，不在内存 join 5,000 条。
2. **分页**：
   - keyset：`where (created_at, id) < ($cursor_created, $cursor_id) order by created_at desc, id desc limit 20`。
   - 管理端每页 20/50/100。
3. **索引**：
   - 见 §4.11；用 `explain analyze` 验证。
4. **全文搜索**：
   - `tsvector` + GIN；中文用 `simple` 配置 + `pg_trgm`（可选）。
5. **聚合视图**：
   - `student_attendance_stats`（total/present/late/absent）。
   - `project_stats`（pending/approved/rejected/revision）。
   - `admin_dashboard_stats`（待审项目/待审评论/本周考勤/报名数）。
6. **缓存**：
   - 公开列表 CDN/Next cache；写后 tag revalidate。
7. **Realtime**：
   - 通知：`postgres_changes` on `notifications` where `user_id = auth.uid()`。
   - 考勤管理：订阅当前 session 的 records。
   - 学生端不订阅全表；只订阅自己的通知。
8. **图片**：
   - 默认用 `next/image` 的优化器 + `images.remotePatterns`（不依赖付费功能）。
   - 若启用 Supabase Storage Image Transformations（官方标注需 Pro Plan），用 custom loader 按宽度取图；不要与 Next 优化器重复处理。
   - 上传时不预生成多档，避免存储翻倍；确需固定尺寸（如头像）再单独生成。
9. **Cron**：
   - Vercel Cron 调 `/api/cron/attendance`：
     - 关闭过期 session。
     - 为未签到学生生成 absent（可配置）。
     - 清理过期通知（可选）。

---

## 10. 安全加固

- RLS 全表启用；`service_role` 只在服务端。
- `proxy.ts` 路由保护 + 每个 action `requireUser/requireAdmin`。
- 限流：登录/重置/报名/评论/validate。
- Turnstile/reCAPTCHA 服务端校验。
- 安全头：
  - CSP（允许 Supabase/Google Fonts/图片域名）
  - `X-Frame-Options` / `frame-ancestors`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - HSTS（生产）
- HTML 清洗：公告内容服务端 `sanitize-html`，白名单标签/属性。
- 上传：MIME/大小/尺寸/数量；随机文件名；病毒扫描可选。
- PII：
  - 不在 localStorage。
  - 不在公开 API 返回 email/phone。
  - 管理端按需显示/脱敏。
- 审计：管理员写操作写 `audit_logs`。
- 错误：生产不返回堆栈；用 Sentry/Logflare（可选）。
- 备份：Supabase 自动备份 + 每周导出；迁移前手动快照。

---

## 11. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| bcrypt 导入失败 | 全员无法登录 | staging 先验证；fallback 临时密码 + 强制改密 |
| RLS 配错 | 数据泄露/写入失败 | 权限矩阵 + 自动化测试（anon/auth/admin 三种身份） |
| 一次性重写过大 | 长时间不能上线 | 先止血；按页面迁移；Auth/数据单独切换 |
| Appwrite 导出不完整 | 数据丢失 | Appwrite 无“迁出到 Supabase”工具；用 Server SDK/API 分页导出（可选导出端点交叉校验）；count/抽样对账；只读快照 |
| 报名/考勤并发 | 超卖/重复 | 唯一索引 + 触发器/RPC + 事务 |
| 匿名报名/评论被刷 | 垃圾数据 | Turnstile + 限流 + 审核 |
| 学生邮箱不可收信 | 重置密码失败 | 管理员重置/临时密码；学校邮箱确认 |
| Supabase 免费休眠 | 冷启动慢 | Pro 或定时 ping；确认预算 |
| Realtime 配额/复杂度 | 成本/稳定性 | 只订阅必要表；轮询降级 |
| 管理端迁移遗漏 | 日常工作中断 | 按使用频率排序；功能 parity 清单；UAT |

---

## 12. 待确认

1. Supabase Cloud 还是自建？区域 Singapore？Pro？
2. 密码迁移：bcrypt 直导 vs 临时密码？
3. 公开活动是否允许匿名报名？
4. 评论是否保留匿名？是否先审后发？
5. 项目公开范围：只 approved？
6. 管理员角色模型：`app_metadata` + `profiles` 双写？
7. 管理员会话管理是否保留？
8. 邮件：Supabase SMTP + Resend？学校邮箱是否可收信？
9. 部署：Vercel + Supabase？是否需要自定义域名？
10. 迁移窗口/可接受停机时间？

---

## 13. 参考（已核对，2026-11-10）

> 以下为本次研究实际查证的官方来源；实施前应按当时版本再确认一次。

| 主题 | 结论 | 来源 |
|---|---|---|
| Next.js 16 Proxy | `proxy.ts` 取代 `middleware.ts`，用于明确网络边界；官方不建议把 Proxy 当作完整 session/授权方案 | https://nextjs.org/blog/next-16 · https://nextjs.org/docs/app/api-reference/file-conventions/proxy |
| Supabase SSR | 用 `@supabase/ssr` + cookie；Proxy 负责刷新 token；Server Component/Action/Route 内仍需 `getClaims()`/`getUser()` | https://supabase.com/docs/guides/auth/server-side/nextjs |
| Supabase JWT | `getClaims()` 在服务端验证 JWT；`getSession()` 不应作为服务端信任来源 | https://supabase.com/docs/guides/auth/server-side/nextjs |
| bcrypt/Argon2 导入 | `auth.admin.createUser({ email, password_hash, email_confirm: true })` 支持 bcrypt/Argon2 | https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0 · https://supabase.com/docs/reference/javascript/auth-admin-createuser |
| RLS 性能 | 用 `(select auth.uid())` 生成 initPlan；策略列建索引；显式 `to authenticated/anon` | https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv |
| Free Plan 休眠 | 免费项目低活跃 7 天会被暂停；付费项目不会 | https://supabase.com/docs/guides/platform/free-project-pausing |
| Storage 图片变换 | Image Transformations / Resizing 需要 Pro Plan 及以上 | https://supabase.com/docs/guides/storage/serving/image-transformations |
| Appwrite 迁移 | Appwrite Migrations 只支持“迁入 Appwrite”（Firebase/Supabase/Nhost/自建/Cloud），**不支持 Appwrite → Supabase 一键迁出** | https://appwrite.io/docs/advanced/migrations |
| Appwrite 导出 | 主路径是 Server SDK/API 分页读取（账号/文档/文件）；CSV/JSON 导出端点是否存在与权限需按当前版本在 API reference 确认，不作为唯一路径 | https://appwrite.io/docs/advanced/migrations |
| Next.js Cache Components | Next 16 可用 `cacheComponents: true` + `use cache`；启用后旧的 `dynamic/revalidate/fetchCache` 段配置会报错，需逐段迁移 | https://nextjs.org/docs/app/guides/migrating-to-cache-components |

**仍需在实施前实测的点**

- 当前 Supabase 项目/GoTrue 版本是否接受 `password_hash`（先在 staging 用 1 个账号验证）。
- 学校邮箱是否可收 Supabase 重置密码邮件（SMTP/Resend 配置）。
- Supabase 区域选择对马来西亚访问的延迟（Singapore vs 其他）。
- 是否购买 Pro：影响项目休眠、Storage 变换、备份保留。
- Appwrite 当前版本可用的导出端点与分页上限。
