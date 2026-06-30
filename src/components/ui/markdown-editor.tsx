"use client";

import * as React from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Code,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "./textarea";
import { renderMarkdownClient } from "@/lib/markdown-client";

type ToolbarAction = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  wrap: (sel: string) => { before: string; after: string; placeholder?: string };
};

const ACTIONS: ToolbarAction[] = [
  {
    label: "Bold",
    icon: Bold,
    wrap: (s) => ({ before: "**", after: "**", placeholder: s || "bold text" }),
  },
  {
    label: "Italic",
    icon: Italic,
    wrap: (s) => ({ before: "*", after: "*", placeholder: s || "italic text" }),
  },
  {
    label: "Heading 2",
    icon: Heading2,
    wrap: (s) => ({ before: "\n## ", after: "\n", placeholder: s || "Heading" }),
  },
  {
    label: "Heading 3",
    icon: Heading3,
    wrap: (s) => ({ before: "\n### ", after: "\n", placeholder: s || "Heading" }),
  },
  {
    label: "Link",
    icon: LinkIcon,
    wrap: (s) => ({ before: "[", after: "](https://)", placeholder: s || "text" }),
  },
  {
    label: "Code",
    icon: Code,
    wrap: (s) => ({ before: "`", after: "`", placeholder: s || "code" }),
  },
  {
    label: "Quote",
    icon: Quote,
    wrap: (s) => ({ before: "\n> ", after: "\n", placeholder: s || "quote" }),
  },
  {
    label: "Bulleted list",
    icon: List,
    wrap: (s) => ({
      before: "\n- ",
      after: "\n",
      placeholder: s || "item",
    }),
  },
  {
    label: "Numbered list",
    icon: ListOrdered,
    wrap: (s) => ({
      before: "\n1. ",
      after: "\n",
      placeholder: s || "item",
    }),
  },
  {
    label: "Table",
    icon: TableIcon,
    wrap: () => ({
      before: "\n| Col 1 | Col 2 |\n| --- | --- |\n| A | B |\n",
      after: "",
    }),
  },
];

export interface MarkdownEditorProps {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  rows?: number;
  placeholder?: string;
  ariaLabel?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  className,
  rows = 18,
  placeholder = "Write in Markdown…",
  ariaLabel,
}: MarkdownEditorProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [html, setHtml] = React.useState("");

  React.useEffect(() => {
    setHtml(renderMarkdownClient(value));
  }, [value]);

  function apply(action: ToolbarAction) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const { before, after, placeholder: ph } = action.wrap(selected);
    const next = value.slice(0, start) + before + (selected || ph || "") + after + value.slice(end);
    onChange(next);
    // Restore focus / selection after React re-renders.
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + before.length + (selected ? selected.length : (ph?.length ?? 0));
      el.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-card p-1">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => apply(action)}
            title={action.label}
            aria-label={action.label}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <action.icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          aria-label={ariaLabel ?? "Markdown editor"}
          className="font-mono text-sm"
        />
        <div
          className="prose prose-sm max-w-none rounded-md border border-border bg-card p-4 max-h-[60vh] overflow-y-auto"
          aria-label="Markdown preview"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html || "<p class='text-muted-foreground'>Preview appears here.</p>" }}
        />
      </div>
    </div>
  );
}
