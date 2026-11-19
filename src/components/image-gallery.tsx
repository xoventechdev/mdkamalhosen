"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import Image from "next/image";
import { X, Expand, Eye, ChevronLeft, ChevronRight } from "lucide-react";

// Lazy load icons for better performance
const LazyX = lazy(() => import("lucide-react").then((m) => ({ default: m.X })));
const LazyChevronLeft = lazy(() => import("lucide-react").then((m) => ({ default: m.ChevronLeft })));
const LazyChevronRight = lazy(() => import("lucide-react").then((m) => ({ default: m.ChevronRight })));
const LazyEye = lazy(() => import("lucide-react").then((m) => ({ default: m.Eye })));
const LazyExpand = lazy(() => import("lucide-react").then((m) => ({ default: m.Expand })));

interface ImageGalleryProps {
  images: string[];
  title: string;
}

// Placeholder component for lazy loading
const IconPlaceholder = () => <div className="w-6 h-6 bg-gray-500 rounded-full animate-pulse" />;

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (index: number) => {
    setSelectedIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedIndex(null);
    document.body.style.overflow = "auto";
  };

  const navigateImage = (direction: "next" | "prev") => {
    if (selectedIndex === null) return;

    if (direction === "next") {
      setSelectedIndex((prev) => prev !== null ? (prev + 1) % images.length : 0);
    } else {
      setSelectedIndex((prev) => prev !== null ? (prev - 1 + images.length) % images.length : 0);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isModalOpen) return;

    if (e.key === "Escape") {
      closeModal();
    } else if (e.key === "ArrowRight") {
      navigateImage("next");
    } else if (e.key === "ArrowLeft") {
      navigateImage("prev");
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, selectedIndex]);

  if (images.length === 0) return null;

  return (
    <>
      {/* Gallery Grid */}
      <div className="glass-card p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Gallery
          </p>
          <span className="text-xs text-muted-foreground">{images.length} images</span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((url, i) => (
            <div
              key={i}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-border transition-all hover:border-accent hover:shadow-glow"
              onClick={() => openModal(i)}
            >
              <Image
                src={url}
                alt={`${title} screenshot ${i + 1}`}
                width={800}
                height={600}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                priority={i < 2} // Only priority load first 2 images
                quality={75} // Reduced from 80 to save more
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                loading="lazy"
                decoder="async"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="text-xs font-medium text-white/90">
                  View Image
                </span>
                <div className="flex items-center gap-1">
                  <Suspense fallback={<IconPlaceholder />}>
                    <LazyEye className="h-4 w-4 text-white/80" />
                    <LazyExpand className="h-4 w-4 text-white/80" />
                  </Suspense>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal - Always centered in viewport */}
      {isModalOpen && selectedIndex !== null && (
        <>
          {/* Backdrop - covers entire viewport */}
          <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-lg"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Modal Content - absolutely centered */}
          <div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
          >
            <div
              className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex flex-col items-center justify-center pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button - top right */}
              <button
                onClick={closeModal}
                className="absolute top-0 right-0 -mt-12 -mr-4 z-20 rounded-full bg-black/50 p-2 text-white/90 hover:bg-black/70 hover:text-white transition-all duration-200"
                aria-label="Close image viewer"
              >
                <Suspense fallback={<IconPlaceholder />}>
                  <LazyX className="h-6 w-6" />
                </Suspense>
              </button>

              {/* Previous button - left side */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage("prev");
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-14 z-20 rounded-full bg-black/50 p-2 text-white/90 hover:bg-black/70 hover:text-white transition-all duration-200 disabled:opacity-50"
                aria-label="Previous image"
                disabled={images.length <= 1}
              >
                <Suspense fallback={<IconPlaceholder />}>
                  <LazyChevronLeft className="h-6 w-6" />
                </Suspense>
              </button>

              {/* Next button - right side */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage("next");
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-14 z-20 rounded-full bg-black/50 p-2 text-white/90 hover:bg-black/70 hover:text-white transition-all duration-200 disabled:opacity-50"
                aria-label="Next image"
                disabled={images.length <= 1}
              >
                <Suspense fallback={<IconPlaceholder />}>
                  <LazyChevronRight className="h-6 w-6" />
                </Suspense>
              </button>

              {/* Image Container - centered */}
              <div className="flex flex-col items-center justify-center w-full h-full">
                <Image
                  src={images[selectedIndex]}
                  alt={`Full view - ${title} screenshot ${selectedIndex + 1}`}
                  width={1200}
                  height={800}
                  className="max-w-[80vw] max-h-[70vh] object-contain rounded-lg"
                  priority={true}
                  quality={85}
                  sizes="80vw"
                  style={{ maxWidth: '80vw', maxHeight: '70vh' }}
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                />

                {/* Image counter */}
                <div className="mt-4">
                  <span className="text-sm text-white/80">
                    {selectedIndex + 1} / {images.length}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -mb-10 text-center">
                <p className="text-xs text-white/50">
                  Press ESC to close | Arrow keys to navigate
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
