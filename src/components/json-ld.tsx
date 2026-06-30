import type { JsonLdObject } from "@/lib/jsonld";

/**
 * Inject a JSON-LD structured-data block into the document.
 *
 * `data` may be a single object or an array of objects — either shape is
 * accepted because the JSON encoder always emits an array (Google accepts
 * a top-level list inside one <script>). The component handles
 * stringification + the correct script tag. Safe to render anywhere — Next.js
 * hoists it inside <body>.
 *
 * Why a component instead of `<Script>`? JSON-LD is static markup (no execution,
 * no hydration, no DOM mutation), so a plain server-rendered script tag is both
 * safer and smaller.
 */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <script
      type="application/ld+json"
      // The data is built locally by the jsonld.ts helpers; nothing user-supplied
      // is interpolated into the JSON before stringification, so it cannot break
      // out of the script tag.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}