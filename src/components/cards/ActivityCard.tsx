'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ActivityCardProps {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  activityDate: string | Date;
  location: string;
  status: 'active' | 'ended' | 'cancelled' | 'draft';
  signupCount?: number;
  maxSignups?: number;
  showSignupButton?: boolean;
  className?: string;
}

export function ActivityCard({
  id,
  title,
  description,
  coverImage,
  activityDate,
  location,
  status,
  signupCount = 0,
  maxSignups,
  showSignupButton = true,
  className,
}: ActivityCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const date = typeof activityDate === 'string' ? new Date(activityDate) : activityDate;
  const isFull = maxSignups !== undefined && signupCount >= maxSignups;
  const canSignup = status === 'active' && !isFull;

  const formattedDate = date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article
      className={cn('overflow-hidden group', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'var(--nm-bg)',
        boxShadow: isHovered ? 'var(--nm-raised-lg)' : 'var(--nm-raised)',
        borderRadius: 28,
        border: 'none',
        transition: 'box-shadow 0.28s ease, transform 0.22s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 192,
          overflow: 'hidden',
          background: 'var(--nm-bg)',
          boxShadow: 'var(--nm-inset)',
        }}
      >
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span
              className="material-symbols-outlined text-4xl"
              style={{ color: 'var(--primary)', opacity: 0.5 }}
            >
              event
            </span>
          </div>
        )}

        <div className="absolute top-4 right-4">
          <StatusBadge
            status={status === 'active' ? 'active' : status === 'ended' ? 'ended' : 'pending'}
            size="sm"
          />
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            background: 'var(--nm-bg)',
            boxShadow: 'var(--nm-raised)',
            borderRadius: 18,
            padding: '0.4rem 0.75rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
            }}
          >
            {formattedDate}
          </div>
          <div style={{ color: 'var(--foreground)', fontSize: '0.85rem', fontWeight: 700 }}>
            {formattedTime}
          </div>
        </div>
      </div>

      <div className="p-5">
        <Link href={`/activities/${id}`}>
          <h3
            className="font-bold text-lg line-clamp-1 mb-2"
            style={{
              color: isHovered ? 'var(--primary)' : 'var(--foreground)',
              transition: 'color 0.2s ease',
            }}
          >
            {title}
          </h3>
        </Link>

        <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>

        <div className="space-y-2 text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-base"
              style={{ color: 'var(--primary)' }}
            >
              location_on
            </span>
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-base"
              style={{ color: 'var(--primary)' }}
            >
              group
            </span>
            <span>
              {signupCount} 人已报名
              {maxSignups && ` / ${maxSignups} 人`}
            </span>
          </div>
        </div>

        {showSignupButton && (
          <Link href={`/activities/${id}/signup`}>
            <Button
              variant={canSignup ? 'primary' : 'secondary'}
              className="w-full"
              disabled={!canSignup}
            >
              {status === 'ended'
                ? '活动已结束'
                : status === 'cancelled'
                  ? '活动已取消'
                  : isFull
                    ? '报名已满'
                    : '立即报名'}
            </Button>
          </Link>
        )}
      </div>
    </article>
  );
}

interface ActivityCardCompactProps {
  id: string;
  title: string;
  activityDate: string | Date;
  location: string;
  status: 'active' | 'ended' | 'cancelled' | 'draft';
  signupCount?: number;
  maxSignups?: number;
  className?: string;
}

export function ActivityCardCompact({
  id,
  title,
  activityDate,
  location,
  status,
  signupCount = 0,
  maxSignups,
  className,
}: ActivityCardCompactProps) {
  const [isHovered, setIsHovered] = useState(false);

  const date = typeof activityDate === 'string' ? new Date(activityDate) : activityDate;

  return (
    <Link href={`/activities/${id}`}>
      <div
        className={cn(className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: 'var(--nm-bg)',
          boxShadow: isHovered ? 'var(--nm-raised)' : 'var(--nm-raised-sm)',
          borderRadius: 16,
          border: 'none',
          padding: '1rem',
          display: 'flex',
          gap: 16,
          transition: 'box-shadow 0.25s ease, transform 0.2s ease',
          cursor: 'pointer',
          transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
        }}
      >
        <div
          style={{
            background: 'var(--nm-bg)',
            boxShadow: 'var(--nm-inset-sm)',
            borderRadius: 12,
            width: 56,
            height: 56,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: 'var(--primary)',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
            }}
          >
            {date.toLocaleDateString('zh-CN', { month: 'short' })}
          </span>
          <span style={{ color: 'var(--primary)', fontSize: '1.3rem', fontWeight: 800 }}>
            {date.getDate()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className="truncate font-medium"
              style={{
                color: isHovered ? 'var(--primary)' : 'var(--foreground)',
                transition: 'color 0.2s ease',
              }}
            >
              {title}
            </h4>
            <StatusBadge
              status={status === 'active' ? 'active' : status === 'ended' ? 'ended' : 'pending'}
              size="sm"
            />
          </div>
          <div
            className="flex items-center gap-3 text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">location_on</span>
              {location}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">group</span>
              {signupCount}
              {maxSignups && `/${maxSignups}`}
            </span>
          </div>
        </div>

        <span
          className="material-symbols-outlined self-center"
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
