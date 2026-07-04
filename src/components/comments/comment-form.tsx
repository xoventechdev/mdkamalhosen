"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CommentFormState {
  authorName: string;
  authorEmail: string;
  body: string;
  hp: string;
}

const initial: CommentFormState = { authorName: "", authorEmail: "", body: "", hp: "" };

function validate(values: CommentFormState): Partial<Record<keyof CommentFormState, string>> {
  const errors: Partial<Record<keyof CommentFormState, string>> = {};
  if (!values.authorName.trim() || values.authorName.trim().length < 2) {
    errors.authorName = "Please share your name (2+ characters).";
  }
  if (!values.authorEmail.trim()) {
    errors.authorEmail = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.authorEmail.trim())) {
    errors.authorEmail = "That doesn't look like a valid email.";
  }
  const trimmedBody = values.body.trim();
  if (!trimmedBody) {
    errors.body = "Comment is required.";
  } else if (trimmedBody.length < 2) {
    errors.body = "Comment needs a bit more detail.";
  } else if (trimmedBody.length > 2000) {
    errors.body = "Comment is too long (2000 max).";
  }
  return errors;
}

export interface CommentFormProps {
  postId: string;
  /** Top-level comments pass `null`; reply forms pass the parent's id. */
  parentId?: string | null;
  /** Compact layout for inline replies. */
  variant?: "full" | "compact";
  /** Cancel handler used by inline reply forms. */
  onCancel?: () => void;
  /** Called after a successful submission (parent uses this to close inline reply). */
  onSubmitted?: () => void;
}

/**
 * Public comment form. Mirrors `contact-form.tsx` — plain `useState`,
 * native `<form>` + `fetch`, Sonner toasts. Submits to `/api/comments`,
 * which is the only place that writes a Comment doc for visitors.
 */
export function CommentForm({
  postId,
  parentId = null,
  variant = "full",
  onCancel,
  onSubmitted,
}: CommentFormProps) {
  const router = useRouter();
  const [values, setValues] = React.useState<CommentFormState>(initial);
  const [errors, setErrors] = React.useState<Partial<Record<keyof CommentFormState, string>>>({});
  const [submitting, setSubmitting] = React.useState(false);

  function update<K extends keyof CommentFormState>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = validate(values);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          parentId: parentId ?? null,
          authorName: values.authorName.trim(),
          authorEmail: values.authorEmail.trim().toLowerCase(),
          body: values.body.trim(),
          _hp: values.hp,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        status?: string;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Could not submit comment.");
        return;
      }
      const isReply = !!parentId;
      if (json.status === "approved") {
        toast.success(isReply ? "Reply posted." : "Comment posted.");
      } else {
        toast.success(
          isReply
            ? "Reply submitted — awaiting approval."
            : "Thanks! Your comment is awaiting approval.",
        );
      }
      setValues(initial);
      router.refresh();
      onSubmitted?.();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const compact = variant === "compact";

  return (
    <form
      onSubmit={onSubmit}
      className={compact ? "space-y-3" : "glass-card space-y-4 p-6 sm:p-8"}
      noValidate
    >
      <div className={compact ? "space-y-3" : "space-y-4"}>
        {!compact && (
          <h3 className="text-lg font-semibold">
            {parentId ? "Reply to this comment" : "Leave a comment"}
          </h3>
        )}

        <div className={compact ? "grid gap-3 sm:grid-cols-2" : ""}>
          <Field label="Name" htmlFor={`name-${postId}-${parentId ?? "root"}`} required error={errors.authorName}>
            <Input
              id={`name-${postId}-${parentId ?? "root"}`}
              name="authorName"
              autoComplete="name"
              value={values.authorName}
              onChange={(e) => update("authorName", e.target.value)}
              aria-invalid={Boolean(errors.authorName)}
              placeholder="Your name"
              maxLength={80}
            />
          </Field>
          <Field label="Email" htmlFor={`email-${postId}-${parentId ?? "root"}`} required error={errors.authorEmail}>
            <Input
              id={`email-${postId}-${parentId ?? "root"}`}
              name="authorEmail"
              type="email"
              autoComplete="email"
              value={values.authorEmail}
              onChange={(e) => update("authorEmail", e.target.value)}
              aria-invalid={Boolean(errors.authorEmail)}
              placeholder="you@example.com"
              maxLength={254}
            />
          </Field>
        </div>

        <Field
          label={compact ? "Reply" : "Comment"}
          htmlFor={`body-${postId}-${parentId ?? "root"}`}
          required
          error={errors.body}
          hint={compact ? undefined : "Markdown is supported."}
        >
          <Textarea
            id={`body-${postId}-${parentId ?? "root"}`}
            name="body"
            rows={compact ? 3 : 5}
            value={values.body}
            onChange={(e) => update("body", e.target.value)}
            aria-invalid={Boolean(errors.body)}
            placeholder={compact ? "Write your reply…" : "Share your thoughts…"}
            maxLength={2000}
          />
        </Field>

        {/* Honeypot — visually hidden but still in the DOM. */}
        <input
          type="text"
          name="_hp"
          tabIndex={-1}
          autoComplete="off"
          value={values.hp}
          onChange={(e) => update("hp", e.target.value)}
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={submitting} size={compact ? "sm" : "md"}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {parentId ? "Post reply" : "Post comment"}
              </>
            )}
          </Button>
          {compact && onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}