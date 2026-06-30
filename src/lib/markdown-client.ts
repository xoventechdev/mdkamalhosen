// Client-safe Markdown renderer. Mirrors src/lib/markdown.ts but uses
// processSync and includes rehype-sanitize. Only the blog editor preview
// uses this; the public site continues to use renderMarkdown on the server.

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import type { Schema } from "hast-util-sanitize";

const sanitizeSchema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className"]],
    pre: [...(defaultSchema.attributes?.pre ?? []), ["className"]],
    span: [...(defaultSchema.attributes?.span ?? []), ["className"]],
    a: [...(defaultSchema.attributes?.a ?? []), ["className", "href", "title", "target", "rel"]],
  },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeHighlight, {
    subset: ["javascript", "typescript", "python", "bash", "json", "text"],
  })
  .use(rehypeSanitize, sanitizeSchema)
  .use(rehypeStringify);

export function renderMarkdownClient(md: string): string {
  if (!md) return "";
  return String(processor.processSync(md));
}
