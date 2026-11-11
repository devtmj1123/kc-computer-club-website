export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]"
        />
        正在加载…
      </div>
    </main>
  );
}
