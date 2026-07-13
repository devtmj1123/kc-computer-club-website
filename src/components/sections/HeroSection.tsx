'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  clubName?: string;
  headline?: string;
  subheadline?: string;
  statusText?: string;
  heroImage?: string;
  heroImageAlt?: string;
  className?: string;
}

export function HeroSection({
  clubName: _clubName = '坤中电脑学会',
  headline: _headline = '创造未来。加入坤成中学电脑学会。',
  subheadline = '电脑学会成立于1983年，至今已有44年历史。我们致力于让团员们能够跟进这个科技时代的步伐，并提高团员们对电脑的认识以及提升团员们资讯工艺方面的能力。',
  statusText = '正在时刻运行中',
  heroImage,
  heroImageAlt = 'Hero Image',
  className,
}: HeroSectionProps) {
  return (
    <section className={cn('grid grid-cols-1 gap-6', className)}>
      <div
        className="relative flex flex-col lg:flex-row items-center justify-between overflow-hidden min-h-[520px]"
        style={{
          background: 'var(--nm-bg)',
          boxShadow: 'var(--nm-raised-lg)',
          borderRadius: 34,
          padding: '3.5rem',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 15% 110%, rgba(19,236,128,0.07) 0%, transparent 55%), radial-gradient(ellipse at 85% -20%, rgba(19,236,128,0.04) 0%, transparent 55%)',
            borderRadius: 'inherit',
          }}
        />

        <div className="relative z-10 flex flex-col gap-6 max-w-xl flex-1">
          <div
            style={{
              background: 'var(--nm-bg)',
              boxShadow: 'var(--nm-inset)',
              borderRadius: 999,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.4rem 1rem',
              width: 'fit-content',
            }}
          >
            <span
              className="animate-pulse"
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--primary)',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)' }}>
              {statusText}
            </span>
          </div>

          <h1
            className="text-4xl md:text-6xl font-black tracking-tight"
            style={{ color: 'var(--foreground)', lineHeight: 1.1 }}
          >
            创造<span style={{ color: 'var(--primary)' }}>未来</span>。<br />
            加入坤成中学电脑学会。
          </h1>

          <div className="grid grid-cols-2 gap-4">
            <div
              style={{
                background: 'var(--nm-bg)',
                boxShadow: 'var(--nm-inset)',
                borderRadius: 18,
                padding: '1.1rem 1.3rem',
              }}
            >
              <p style={{ color: 'var(--primary)', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                1983
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', fontWeight: 600, margin: 0, marginTop: 2 }}>
                年成立
              </p>
            </div>
            <div
              style={{
                background: 'var(--nm-bg)',
                boxShadow: 'var(--nm-inset)',
                borderRadius: 18,
                padding: '1.1rem 1.3rem',
              }}
            >
              <p style={{ color: 'var(--primary)', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                111
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', fontWeight: 600, margin: 0, marginTop: 2 }}>
                团员
              </p>
            </div>
          </div>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1.05rem',
              maxWidth: 420,
              lineHeight: 1.7,
            }}
          >
            {subheadline}
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/activities">
              <button
                style={{
                  background: 'var(--primary)',
                  color: '#111814',
                  fontWeight: 700,
                    borderRadius: 18,
                    padding: '0.95rem 1.9rem',
                  border: 'none',
                  cursor: 'pointer',
                    boxShadow: '0 10px 30px var(--primary-glow), var(--nm-raised-sm)',
                  transition: 'all 0.25s ease',
                  fontSize: '1rem',
                }}
              >
                立即加入
              </button>
            </Link>
            <Link href="/activities">
              <button
                style={{
                  background: 'var(--nm-bg)',
                  color: 'var(--foreground)',
                  fontWeight: 600,
                    borderRadius: 18,
                    padding: '0.95rem 1.9rem',
                  border: 'none',
                  cursor: 'pointer',
                    boxShadow: 'var(--nm-raised)',
                  transition: 'all 0.25s ease',
                  fontSize: '1rem',
                }}
              >
                查看活动
              </button>
            </Link>
          </div>

        </div>

        {heroImage && (
          <div className="relative z-10 flex-1 flex items-center justify-center mt-8 lg:mt-0 lg:ml-8">
            <div
              style={{
                background: 'var(--nm-bg)',
                boxShadow: 'var(--nm-raised-lg)',
                borderRadius: 28,
                overflow: 'hidden',
                width: '100%',
                maxWidth: 420,
                aspectRatio: '16/10',
              }}
            >
              <img
                src={heroImage}
                alt={heroImageAlt}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
