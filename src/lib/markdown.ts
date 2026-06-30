import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
type SanitizeSchema = typeof defaultSchema;
import rehypeStringify from "rehype-stringify";

// Augment the sanitize schema to allow class names produced by rehype-highlight
// and rehype-autolink-headings so they survive sanitisation.
const sanitizeSchema: SanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className"]],
    pre: [...(defaultSchema.attributes?.pre ?? []), ["className"]],
    h2: [...(defaultSchema.attributes?.h2 ?? []), ["id", "className"]],
    h3: [...(defaultSchema.attributes?.h3 ?? []), ["id", "className"]],
    h4: [...(defaultSchema.attributes?.h4 ?? []), ["id", "className"]],
    a: [...(defaultSchema.attributes?.a ?? []), ["className"]],
    span: [...(defaultSchema.attributes?.span ?? []), ["className"]],
  },
};

export async function renderMarkdown(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: { className: ["heading-anchor"] },
    })
    .use(rehypeHighlight, { subset: ["javascript", "typescript", "python", "bash", "json", "text"] })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(md);
  return String(file);
}

export function extractToc(md: string): Array<{ id: string; text: string; level: number }> {
  const lines = md.split("\n");
  const toc: Array<{ id: string; text: string; level: number }> = [];
  let inCode = false;
  for (const line of lines) {
    if (line.startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const m = /^(#{2,3})\s+(.+?)$/.exec(line);
    if (!m || !m[1] || !m[2]) continue;
    const level = m[1].length;
    const text = m[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    toc.push({ id, text, level });
  }
  return toc;
}