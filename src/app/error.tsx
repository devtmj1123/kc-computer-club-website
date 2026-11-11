'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium tracking-widest text-[var(--text-secondary)] uppercase">
          Error
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
          页面加载失败
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          {error.message || '发生了意外错误，请稍后重试。'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-contrast)] transition-colors hover:bg-[var(--primary-hover)]"
        >
          重试
        </button>
      </div>
    </main>
  );
}
