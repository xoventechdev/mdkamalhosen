import { formatDateTime } from "@/lib/utils";

/**
 * Shared "Published [date] · Updated [date]" label for blog surfaces.
 *
 * Renders the publish time always; adds an "Updated …" suffix only when
 * the post has been edited *after* it was published (so an initial
 * publish — where `updatedAt === publishedAt` — reads as a single,
 * clean date).
 *
 * Used by:
 *   - the blog index cards (`/blog`)
 *   - blog tag-listing cards (`/blog/tag/[tag]`)
 *   - the article header on `/blog/[slug]`
 *   - the homepage latest-posts cards
 *
 * The four call-sites share this component so the wording stays
 * consistent and the "is this post edited?" logic lives in one
 * place. Pass either a single `<Date>` chip (compact variant, used
 * on cards where space is tight) or a stacked `<time>` pair for the
 * article header.
 */

export interface PostDatesProps {
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  /**
   * "inline" — single line, used on cards.
   * "stacked" — two lines with one label each, used on the article header.
   */
  variant?: "inline" | "stacked";
  /** Locale-aware locale for `formatDateTime`. Default "en-US". */
  locale?: string;
  className?: string;
}

export function PostDates({
  publishedAt,
  updatedAt,
  variant = "inline",
  className,
}: PostDatesProps) {
  const pub = publishedAt ? new Date(publishedAt) : null;
  const upd = updatedAt ? new Date(updatedAt) : null;

  // Show "Updated" only when the post has actually been edited after
  // publish — at least one second of slack avoids flapping on
  // autosaves that land in the same millisecond as publish.
  const edited =
    pub && upd && upd.getTime() - pub.getTime() > 1000 ? upd : null;

  if (!pub) {
    return null;
  }
  const publishedIso = pub.toISOString();
  const publishedLabel = formatDateTime(pub);

  if (variant === "stacked") {
    return (
      <div className={className}>
        <time dateTime={publishedIso} className="block">
          <span className="text-muted-foreground">Published </span>
          <span className="font-medium text-foreground">{publishedLabel}</span>
        </time>
        {edited && (
          <time dateTime={edited.toISOString()} className="block">
            <span className="text-muted-foreground">Updated </span>
            <span className="font-medium text-foreground">
              {formatDateTime(edited)}
            </span>
          </time>
        )}
      </div>
    );
  }

  return (
    <span className={className}>
      <time dateTime={publishedIso} className="font-mono">
        {publishedLabel}
      </time>
      {edited && (
        <>
          <span className="mx-1.5 opacity-50" aria-hidden="true">
            ·
          </span>
          <time
            dateTime={edited.toISOString()}
            className="font-mono"
            title="Last edited by an admin after publish"
          >
            Updated {formatDateTime(edited)}
          </time>
        </>
      )}
    </span>
  );
}
