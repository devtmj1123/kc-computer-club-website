'use client';

import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface StudentLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function StudentLayout({ children, className }: StudentLayoutProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-transparent', className)}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
