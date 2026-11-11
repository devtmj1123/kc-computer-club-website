# Supabase 从零初始化指南

> 适用场景：**不迁移 Appwrite 旧数据**，Supabase 作为全新后端。
> 目标：创建一个 Singapore / Pro 项目，执行 migration，创建第一个管理员，然后启动网站。

---

## 1. 创建 Supabase 项目

1. 登录 <https://supabase.com/dashboard>。
2. 选择或创建一个 Organization。
3. 点击 **New project**，填写：
   - **Name**: `kc-computer-club`
   - **Database Password**: 生成并保存一个强密码（只用于数据库直连，网站不会用到）
   - **Region**: `Southeast Asia (Singapore)`
   - **Plan**: **Pro**（免费项目连续 7 天无请求会被暂停，Pro 不会）
4. 等待项目初始化完成（通常 1–3 分钟）。

> 如果暂时不想开 Pro，也可以先用 Free 开发，但上线前必须升级，否则项目会因不活跃被暂停。

---

## 2. 复制 API 凭据

进入 **Project Settings → API**，复制以下三个值：

| 值 | 用途 | 是否可暴露到浏览器 |
|---|---|---|
| **Project URL** | Supabase 项目地址 | 可以 |
| **anon / publishable key** | 浏览器与普通服务端请求 | 可以 |
| **service_role secret** | 管理员操作、数据导入 | **绝对不可以** |

写入项目根目录 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

新版 Supabase 的 key 前缀是 `sb_publishable_...`（公开）和 `sb_secret_...`（服务端），旧版 `anon` / `service_role` key 也可以继续使用。

同时保留/填写：

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="KC Computer Club"
```

`SUPABASE_SERVICE_ROLE_KEY` 不要加 `NEXT_PUBLIC_` 前缀，也不要提交到 Git。

---

## 3. 配置 Auth

进入 **Authentication → URL Configuration**：

- **Site URL**: `http://localhost:3000`
- **Redirect URLs** 增加：
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/reset-password`
  - 上线后再加上生产域名对应地址

进入 **Authentication → Providers → Email**：

- 保持 Email provider 启用。
- **关闭** “Allow new users to sign up”（账号只由管理员创建）。
- 开发阶段可以关闭 “Confirm email”；创建账号时服务端会设置 `email_confirm: true`。

进入 **Authentication → Sessions**（可选）：

- JWT expiry 使用默认 3600 秒即可。
- 不启用 anonymous sign-in。

---

## 4. 执行数据库 migration

SQL 文件必须按顺序执行：

1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_functions.sql`
3. `supabase/migrations/0003_rls.sql`
4. `supabase/migrations/0004_storage.sql`

### 方式 A：Supabase SQL Editor（最简单）

打开 **SQL Editor**，依次新建查询、粘贴每个文件、点击 **Run**。四个文件都成功后继续下一步。

### 方式 B：Supabase CLI（推荐长期使用）

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

`project-ref` 是项目 URL 中 `https://<project-ref>.supabase.co` 的那一段。

> 本地预检（不需要 Supabase 项目）：
>
> ```bash
> npm run db:verify
> ```
>
> 该命令用 PGlite 执行四个 migration，并检查 RLS、签到 RPC、Storage 策略等。

---

## 5. 创建第一个管理员

在 `.env.local` 中临时加入（只用于初始化，创建成功后请删除密码）：

```env
BOOTSTRAP_ADMIN_USERNAME="admin"
BOOTSTRAP_ADMIN_PASSWORD="至少12位的强密码"
BOOTSTRAP_ADMIN_NAME="系统管理员"
```

运行：

```bash
npm run bootstrap:supabase
```

脚本会：

- 把用户名映射为确定性邮箱 `<username>@admin.kcc.internal`
- 在 Supabase Auth 创建（或更新）管理员账号
- 写入 `app_metadata.role = "admin"`
- 同步 `profiles` 的 `role`、`permissions`、`is_active`
- 确保 `club_settings` 默认行存在

创建成功后，用用户名 + 密码登录：`http://localhost:3000/admin/login`。

> 之后新增管理员：在 Supabase Dashboard → Authentication → Users 创建用户，
> 把 `app_metadata` 设为 `{"role":"admin","username":"..."}`，并在 `profiles` 表写入
> `role = 'admin'`。也可以继续复用 `scripts/bootstrap-supabase.ts`。

---

## 6. 启动与验证

先做连接/表/Storage 检查（不需要启动 Next.js）：

```bash
npm run db:check
```

检查通过后启动：

```bash
npm run dev
```

检查清单：

- `/`、`/about`、`/notices`、`/activities` 可以打开
- `/admin/login` 能用刚创建的管理员登录
- 管理端创建公告/活动/项目后，公开页面能看到
- 学生签到、报名、评论按 RLS 规则工作
- Supabase Storage 的 `public-assets` / `avatars` 可以上传

---

## 7. 常见问题

### 项目被暂停

Free 计划 7 天无请求会暂停。升级 Pro，或在 Dashboard 恢复项目。

### `new row violates row-level security policy`

通常说明：

- 当前请求没有登录（anon），但操作要求 `authenticated`；或
- 学生尝试写管理员字段；或
- 匿名报名/评论没有走服务端接口（应使用 service role 的服务端 route）。

检查 Supabase **Logs → API** 和 **Logs → Postgres**。

### 上传失败

确认四个 migration 都执行了，并且 `storage.buckets` 中有：

- `public-assets`（公开图片）
- `avatars`（头像）
- `private`（管理员附件）

### 登录提示“账号或密码错误”

确认：

- 用户存在于 **Authentication → Users**
- `profiles.is_active = true`
- 管理员账号的 `app_metadata.role = "admin"`
- 管理员用户名映射后的邮箱正确（默认 `@admin.kcc.internal`）

---

## 8. 上线前必须补齐

```env
RECAPTCHA_SECRET_KEY="..."
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="..."
```

如果继续使用自定义邮件（非 Supabase 内置邮件），再配置 `RESEND_API_KEY` / `RESEND_FROM_EMAIL`。

生产环境还需要：

- 自定义域名与 HTTPS
- Supabase Auth 的 Site URL / Redirect URLs 改为生产域名
- 备份策略（Pro 自带每日备份，可按需升级）
- 维护窗口与回滚计划
