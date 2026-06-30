import { cn } from "@/lib/utils";

/**
 * Visual placeholder for content that is loading. Use inside <Suspense> boundaries
 * or any place a row of cards / paragraphs / lines will be rendered shortly.
 *
 * Pattern: pages await DB queries, then render data. For a visible skeleton during
 * cold-first-frame, wrap a leaf async server component in <Suspense fallback=...>.
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Aspect ratio, e.g. "16/10" for project covers, "1" for square thumbnails. */
  aspect?: string;
}

export function Skeleton({ className, aspect, style, ...rest }: SkeletonProps) {
  return (
    <div
      className={cn("shimmer rounded-md bg-muted", className)}
      style={{ aspectRatio: aspect, ...style }}
      aria-hidden="true"
      {...rest}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  /** Last line shorter — mimics real paragraphs. */
  ragged?: boolean;
}

export function SkeletonText({ lines = 3, className, ragged = true }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-3.5",
            ragged && i === lines - 1 ? "w-2/3" : "w-full",
          )}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
  /** Cover image area aspect. Defaults to 16/10. */
  coverAspect?: string;
  /** Show a body text skeleton. */
  body?: boolean;
}

export function SkeletonCard({ className, coverAspect = "16/10", body = true }: SkeletonCardProps) {
  return (
    <div
      className={cn("glass-card overflow-hidden p-0", className)}
      aria-hidden="true"
    >
      <Skeleton className="w-full rounded-none" aspect={coverAspect} />
      <div className="space-y-3 p-6">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        {body && <SkeletonText lines={2} />}
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

interface SkeletonGridProps {
  count?: number;
  className?: string;
}

export function SkeletonGrid({ count = 6, className }: SkeletonGridProps) {
  return (
    <div
      className={cn("grid gap-5 md:grid-cols-2 lg:grid-cols-3", className)}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}