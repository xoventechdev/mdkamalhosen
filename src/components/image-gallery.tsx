"use client";

import { useState } from "react";
import { X, Expand, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
    document.body.style.overflow = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      closeModal();
    }
  };

  if (images.length === 0) return null;

  return (
    <>
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
              onClick={() => openModal(url)}
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

      {/* Modal for image viewing */}
      {isModalOpen && selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeModal}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          tabIndex={-1}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors z-10"
              aria-label="Close image"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selectedImage}
              alt="Full view"
              className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
            />
            <p className="mt-3 text-center text-sm text-white/60">
              Click anywhere or press ESC to close
            </p>
          </div>
        </div>
      )}
    </>
  );
}
