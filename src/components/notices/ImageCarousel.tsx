'use client';

import { useState } from 'react';

interface ImageCarouselProps {
  images: string[];
  title?: string;
  showThumbnails?: boolean;
}

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
    <div className="space-y-3">
      <div className="relative bg-gray-200 dark:bg-[#1a2632] rounded-xl overflow-hidden flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[currentIndex]}
          alt={`${title || '图片'} ${currentIndex + 1}`}
          className="w-full max-h-[520px] object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext x="200" y="150" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="%23999"%3E图片加载失败%3C/text%3E%3C/svg%3E';
          }}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
              title="上一张"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
              title="下一张"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>

            <div className="absolute bottom-3 right-3 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {showThumbnails && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                currentIndex === index
                  ? 'border-[#137fec]'
                  : 'border-[#283946] hover:border-gray-500'
              }`}
              title={`第 ${index + 1} 张图片`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`缩略图 ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
