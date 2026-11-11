import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium tracking-widest text-[var(--text-secondary)] uppercase">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
          找不到这个页面
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          链接可能已经失效，或者内容已被移除。
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
