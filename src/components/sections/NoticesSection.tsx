'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface Notice {
  id: string;
  title: string;
  summary: string;
  category: string;
  icon: string;
  iconColor: string;
  publishedAt: string | Date;
}

interface NoticesSectionProps {
  notices: Notice[];
  className?: string;
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  System: { bg: 'rgba(249,115,22,0.12)', text: '#fb923c', border: 'rgba(249,115,22,0.2)' },
  News: { bg: 'rgba(19,236,128,0.12)', text: 'var(--primary)', border: 'rgba(19,236,128,0.2)' },
  Update: { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa', border: 'rgba(96,165,250,0.2)' },
  Event: { bg: 'rgba(192,132,252,0.12)', text: '#c084fc', border: 'rgba(192,132,252,0.2)' },
  Urgent: { bg: 'rgba(248,113,113,0.12)', text: '#f87171', border: 'rgba(248,113,113,0.2)' },
  系统: { bg: 'rgba(249,115,22,0.12)', text: '#fb923c', border: 'rgba(249,115,22,0.2)' },
  新闻: { bg: 'rgba(19,236,128,0.12)', text: 'var(--primary)', border: 'rgba(19,236,128,0.2)' },
  更新: { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa', border: 'rgba(96,165,250,0.2)' },
  活动: { bg: 'rgba(192,132,252,0.12)', text: '#c084fc', border: 'rgba(192,132,252,0.2)' },
  紧急: { bg: 'rgba(248,113,113,0.12)', text: '#f87171', border: 'rgba(248,113,113,0.2)' },
};

const iconColors: Record<string, { bg: string; text: string }> = {
  orange: { bg: 'rgba(249,115,22,0.1)', text: '#fb923c' },
  green: { bg: 'rgba(19,236,128,0.1)', text: 'var(--primary)' },
  blue: { bg: 'rgba(96,165,250,0.1)', text: '#60a5fa' },
  purple: { bg: 'rgba(192,132,252,0.1)', text: '#c084fc' },
  red: { bg: 'rgba(248,113,113,0.1)', text: '#f87171' },
};

export function NoticesSection({ notices, className }: NoticesSectionProps) {
  return (
    <div className={cn('md:col-span-2 flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between px-1">
        <h2
          className="flex items-center gap-2"
          style={{ color: 'var(--foreground)', fontWeight: 700, fontSize: '1.4rem' }}
        >
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>
            campaign
          </span>
          最新公告
        </h2>
        <Link
          href="/notices"
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--primary)')}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--text-secondary)')}
        >
          查看全部
        </Link>
      </div>

      <div
        style={{
          background: 'var(--nm-bg)',
          boxShadow: 'var(--nm-raised)',
          borderRadius: 22,
          padding: '0.75rem',
          border: 'none',
        }}
      >
        {notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="material-symbols-outlined text-4xl mb-2" style={{ color: 'var(--text-tertiary)' }}>
              campaign
            </span>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>暂无公告</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notices.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NoticeCard({ notice }: { notice: Notice }) {
  const [displayTime, setDisplayTime] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const date =
      typeof notice.publishedAt === 'string' ? new Date(notice.publishedAt) : notice.publishedAt;
    setDisplayTime(formatRelativeTime(date));
  }, [notice.publishedAt]);

  const _colors = categoryColors[notice.category] || categoryColors.Update;
  const iconStyle = iconColors[notice.iconColor] || iconColors.green;

  return (
    <Link href={`/notices/${notice.id}`}>
      <div
        className="flex items-center gap-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          borderRadius: 16,
          padding: '1rem',
          cursor: 'pointer',
          transition: 'box-shadow 0.25s ease, transform 0.2s ease',
          boxShadow: isHovered ? 'var(--nm-raised-sm)' : 'none',
          transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
        }}
      >
        <div
          style={{
            background: 'var(--nm-bg)',
            boxShadow: 'var(--nm-raised-sm)',
            borderRadius: 12,
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconStyle.text,
            flexShrink: 0,
          }}
        >
          <span className="material-symbols-outlined">{notice.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className="truncate"
              style={{
                fontWeight: 600,
                color: isHovered ? 'var(--primary)' : 'var(--foreground)',
                transition: 'color 0.2s ease',
              }}
            >
              {notice.title}
            </h4>
            <span
              style={{
                background: 'var(--nm-bg)',
                boxShadow: 'var(--nm-inset-sm)',
                borderRadius: 999,
                padding: '0.15rem 0.5rem',
                fontSize: '0.65rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {notice.category}
            </span>
          </div>
          <p className="truncate" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {notice.summary}
          </p>
        </div>

        {isHydrated && (
          <span
            className="hidden sm:block"
            style={{ color: 'var(--text-tertiary)', fontFamily: 'monospace', fontSize: '0.75rem' }}
          >
            {displayTime}
          </span>
        )}

        <span
          className="material-symbols-outlined"
          style={{
            color: isHovered ? 'var(--primary)' : 'var(--text-tertiary)',
            transition: 'color 0.2s ease',
            flexShrink: 0,
          }}
        >
          chevron_right
        </span>
      </div>
    </Link>
  );
}

interface Activity {
  id: string;
  title: string;
  category: string;
  categoryColor?: string;
  date: string | Date;
  time: string;
  location: string;
}

interface EventsSectionProps {
  activities: Activity[];
  className?: string;
}

const categoryTextColors: Record<string, string> = {
  Workshop: 'var(--primary)',
  Social: '#c084fc',
  Competition: '#f87171',
  Meeting: '#60a5fa',
  工作坊: 'var(--primary)',
  社交: '#c084fc',
  比赛: '#f87171',
  会议: '#60a5fa',
};

export function EventsSection({ activities, className }: EventsSectionProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between px-1">
        <h2
          className="flex items-center gap-2"
          style={{ color: 'var(--foreground)', fontWeight: 700, fontSize: '1.4rem' }}
        >
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>
            calendar_month
          </span>
          即将到来
        </h2>
      </div>

      {activities.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-8 text-center"
          style={{
            background: 'var(--nm-bg)',
            boxShadow: 'var(--nm-raised)',
            borderRadius: 22,
          }}
        >
          <span className="material-symbols-outlined text-4xl mb-2" style={{ color: 'var(--text-tertiary)' }}>
            event_busy
          </span>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>暂无活动</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 h-full">
          {activities.map((activity) => (
            <EventCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ activity }: { activity: Activity }) {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  const date = typeof activity.date === 'string' ? new Date(activity.date) : activity.date;
  const categoryColor = categoryTextColors[activity.category] ?? 'var(--primary)';

  return (
    <Link href={`/activities/${activity.id}`}>
      <div
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
        style={{
          background: 'var(--nm-bg)',
          boxShadow: isCardHovered ? 'var(--nm-raised-lg)' : 'var(--nm-raised)',
          borderRadius: 22,
          padding: '1.25rem',
          border: 'none',
          transition: 'box-shadow 0.25s ease, transform 0.2s ease',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          transform: isCardHovered ? 'translateY(-2px)' : 'translateY(0)',
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col">
            <span
              style={{
                color: categoryColor,
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4,
              }}
            >
              {activity.category}
            </span>
            <h3
              style={{
                color: isCardHovered ? 'var(--primary)' : 'var(--foreground)',
                fontWeight: 700,
                fontSize: '1.1rem',
                transition: 'color 0.2s ease',
              }}
            >
              {activity.title}
            </h3>
          </div>

          <div
            style={{
              background: 'var(--nm-bg)',
              boxShadow: 'var(--nm-inset-sm)',
              borderRadius: 10,
              padding: '0.4rem 0.75rem',
              textAlign: 'center',
              flexShrink: 0,
              marginLeft: 12,
            }}
          >
            <span
              style={{
                display: 'block',
                color: 'var(--text-tertiary)',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
              }}
            >
              {date.toLocaleDateString('zh-CN', { month: 'short' })}
            </span>
            <span
              style={{
                display: 'block',
                color: 'var(--foreground)',
                fontSize: '1.3rem',
                fontWeight: 800,
              }}
            >
              {date.getDate()}
            </span>
          </div>
        </div>

        <div
          className="flex items-center gap-4 mb-6"
          style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
        >
          <div className="flex items-center gap-1">
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--primary)', fontSize: '1rem' }}
            >
              schedule
            </span>
            {activity.time}
          </div>
          <div className="flex items-center gap-1">
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--primary)', fontSize: '1rem' }}
            >
              location_on
            </span>
            {activity.location}
          </div>
        </div>

        <button
          onMouseEnter={() => setIsBtnHovered(true)}
          onMouseLeave={() => setIsBtnHovered(false)}
          style={{
            background: isBtnHovered ? 'var(--primary)' : 'var(--nm-bg)',
            boxShadow: isBtnHovered ? '0 4px 16px var(--primary-glow)' : 'var(--nm-raised-sm)',
            borderRadius: 12,
            border: 'none',
            padding: '0.65rem',
            width: '100%',
            fontWeight: 700,
            color: isBtnHovered ? '#111814' : 'var(--foreground)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginTop: 'auto',
          }}
        >
          立即报名
        </button>
      </div>
    </Link>
  );
}
