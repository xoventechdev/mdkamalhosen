"use client";

import * as React from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export type UploadBucket = "avatars" | "projects" | "blog" | "cvs";

export interface ImageUploaderProps {
  bucket: UploadBucket;
  slug: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  className?: string;
  label?: string;
  hint?: string;
}

export function ImageUploader({
  bucket,
  slug,
  value,
  onChange,
  className,
  label = "Upload image",
  hint,
}: ImageUploaderProps) {
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be 2MB or smaller.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", bucket);
      fd.append("slug", slug);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as { url: string };
      onChange(data.url);
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <span className="block text-sm font-medium text-foreground">{label}</span>
      )}
      {value ? (
        <div className="relative overflow-hidden rounded-md border border-border bg-muted/30">
          {/* Using native img intentionally: this URL is freshly uploaded by
              the owner, and we want to avoid the next/image domain allowlist
              during dev. The image is already optimized by Supabase. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="block max-h-64 w-full object-contain"
          />
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2"
          >
            <X className="h-3.5 w-3.5" /> Remove
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {busy ? "Uploading…" : label}
          </Button>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  );
}

export interface GalleryUploaderProps {
  bucket: UploadBucket;
  slug: string;
  value: string[];
  onChange: (urls: string[]) => void;
  className?: string;
}

export function GalleryUploader({
  bucket,
  slug,
  value,
  onChange,
  className,
}: GalleryUploaderProps) {
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
          toast.error(`Skipped ${file.name}: must be image and ≤2MB.`);
          continue;
        }
        const fd = new FormData();
        fd.append("file", file);
        fd.append("bucket", bucket);
        fd.append("slug", slug);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!res.ok) continue;
        const data = (await res.json()) as { url: string };
        uploaded.push(data.url);
      }
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        toast.success(`Uploaded ${uploaded.length} image(s).`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <div
            key={url}
            className="group relative h-24 w-32 overflow-hidden rounded-md border border-border bg-muted/30"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Gallery image ${i + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((u) => u !== url))}
              className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-xs text-muted-foreground transition-colors hover:bg-muted/40 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Uploading…" : "Add"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
