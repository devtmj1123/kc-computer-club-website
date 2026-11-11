'use client';

import { useState } from 'react';

interface ImageCarouselProps {
  images: string[];
  title?: string;
  showThumbnails?: boolean;
}

const FALLBACK_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e8e4d8" width="400" height="300"/%3E%3Ctext x="200" y="150" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="%237a7a70"%3E图片加载失败%3C/text%3E%3C/svg%3E';

export const ImageCarousel = ({ images, title, showThumbnails = true }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <figure className="space-y-3">
      <div className="relative overflow-hidden border border-[var(--border)] bg-[var(--surface-hover)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[currentIndex]}
          alt={`${title || '图片'} ${currentIndex + 1}`}
          className="h-auto w-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevious}
              className="absolute left-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center border border-white/20 bg-black/55 text-white transition-colors hover:bg-black/75"
              title="上一张"
            >
              <span className="material-symbols-outlined text-[17px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center border border-white/20 bg-black/55 text-white transition-colors hover:bg-black/75"
              title="下一张"
            >
              <span className="material-symbols-outlined text-[17px]">chevron_right</span>
            </button>

            <div className="absolute bottom-3 right-3 bg-black/60 px-2.5 py-1 font-mono text-[12px] tracking-[0.08em] text-white">
              {String(currentIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
            </div>
          </>
        )}
      </div>

      {showThumbnails && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleThumbnailClick(index)}
              className={`size-16 shrink-0 overflow-hidden border transition-colors ${
                currentIndex === index
                  ? 'border-[var(--primary)]'
                  : 'border-[var(--border)] hover:border-[var(--rule-strong)]'
              }`}
              title={`第 ${index + 1} 张图片`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`缩略图 ${index + 1}`}
                className="size-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </figure>
  );
};
