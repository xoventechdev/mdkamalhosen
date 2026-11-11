"use client";

import { useState, useEffect } from "react";
import { X, Expand, Eye, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

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
              <img
                src={url}
                alt={`${title} screenshot ${i + 1}`}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="text-xs font-medium text-white/90">
                  View Image
                </span>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4 text-white/80" />
                  <Expand className="h-4 w-4 text-white/80" />
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
                <X className="h-6 w-6" />
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
                <ChevronLeft className="h-6 w-6" />
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
                <ChevronRight className="h-6 w-6" />
              </button>

              {/* Image Container - centered */}
              <div className="flex flex-col items-center justify-center w-full h-full">
                <img
                  src={images[selectedIndex]}
                  alt={`Full view - ${title} screenshot ${selectedIndex + 1}`}
                  className="max-w-[80vw] max-h-[70vh] object-contain rounded-lg"
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
