import Image from 'next/image';

interface ClubMarkProps {
  size?: number;
  priority?: boolean;
  className?: string;
}

export function ClubMark({ size = 36, priority = false, className = '' }: ClubMarkProps) {
  return (
    <Image
      src="/logo.svg"
      alt="坤成中学电脑学会"
      width={size}
      height={size}
      priority={priority}
      unoptimized
      className={className}
    />
  );
}
