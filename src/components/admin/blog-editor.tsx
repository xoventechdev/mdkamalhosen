"use client";

import * as React from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Trash2, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/ui/image-uploader";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { createBlogTag, deleteBlogPost, updateBlogPost } from "@/server/actions";
import { blogPostSchema, type BlogPostInput } from "@/lib/schemas";
import { readingMinutes, slugify, formatDate } from "@/lib/utils";

export interface BlogEditorProps {
  initial: BlogPostInput & { id: number };
  availableTags: Array<{ id: number; name: string; slug: string }>;
}

export function BlogEditor({ initial, availableTags }: BlogEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<Array<{ id: number; name: string; slug: string }>>(
    availableTags,
  );
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<BlogPostInput>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: { ...initial, tagIds: selectedTagIds },
  });

  // Pre-select existing tags from the loaded post.
  useEffect(() => {
    const ids = availableTags
      .filter((t) => initial.tagIds?.includes(t.id))
      .map((t) => t.id);
    setSelectedTagIds(ids);
    setValue("tagIds", ids, { shouldDirty: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id]);

  const title = watch("title");
  const slug = watch("slug");
  const status = watch("status");
  const bodyMd = watch("bodyMd");
  const excerpt = watch("excerpt");
  const coverUrl = watch("coverUrl");
  const metaDescription = watch("metaDescription");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));

  // Auto-derive slug from title until manually edited.
  useEffect(() => {
    if (!slugTouched && title) {
      setValue("slug", slugify(title), { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // Autosave: every 5s if dirty.
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = true;
  }, [title, slug, bodyMd, excerpt, coverUrl, metaDescription, status, selectedTagIds]);

  const performSave = React.useCallback(() => {
    if (!dirtyRef.current) return;
    const values = getValues();
    setSavingState("saving");
    startTransition(async () => {
      const res = await updateBlogPost({ id: initial.id, ...values, tagIds: selectedTagIds });
      if (res.ok) {
        dirtyRef.current = false;
        setSavingState("saved");
        setSavedAt(new Date().toLocaleTimeString());
      } else {
        setSavingState("idle");
        toast.error(res.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id, selectedTagIds]);

  useEffect(() => {
    const t = setInterval(performSave, 5000);
    return () => clearInterval(t);
  }, [performSave]);

  async function manualSave() {
    handleSubmit((values) => {
      setSavingState("saving");
      startTransition(async () => {
        const res = await updateBlogPost({ id: initial.id, ...values, tagIds: selectedTagIds });
        if (res.ok) {
          toast.success("Saved.");
          dirtyRef.current = false;
          setSavingState("saved");
          setSavedAt(new Date().toLocaleTimeString());
          router.refresh();
        } else {
          setSavingState("idle");
          toast.error(res.error);
        }
      });
    })();
  }

  async function togglePublish() {
    const next = status === "published" ? "draft" : "published";
    setValue("status", next, { shouldDirty: true });
    setSavingState("saving");
    const values = getValues();
    const res = await updateBlogPost({ id: initial.id, ...values, status: next, tagIds: selectedTagIds });
    if (res.ok) {
      toast.success(next === "published" ? "Published." : "Unpublished.");
      setSavingState("saved");
      setSavedAt(new Date().toLocaleTimeString());
      router.refresh();
    } else {
      setSavingState("idle");
      toast.error(res.error);
    }
  }

  function confirmDelete() {
    return deleteBlogPost(initial.id).then((res) => {
      if (res.ok) {
        toast.success("Post deleted.");
        router.push("/admin/blog");
      } else {
        toast.error(res.error);
      }
    });
  }

  async function addTag() {
    const name = tagInput.trim();
    if (!name) return;
    const res = await createBlogTag({ name, slug: slugify(name) });
    if (res.ok) {
      const fresh = { id: res.data.id, name, slug: res.data.slug };
      setTags((prev) => (prev.find((t) => t.slug === fresh.slug) ? prev : [...prev, fresh]));
      setSelectedTagIds((prev) => (prev.includes(fresh.id) ? prev : [...prev, fresh.id]));
      setValue("tagIds", [...selectedTagIds, fresh.id], { shouldDirty: true });
      setTagInput("");
    } else {
      toast.error(res.error);
    }
  }

  function toggleTag(id: number) {
    const next = selectedTagIds.includes(id)
      ? selectedTagIds.filter((x) => x !== id)
      : [...selectedTagIds, id];
    setSelectedTagIds(next);
    setValue("tagIds", next, { shouldDirty: true });
  }

  const minutes = readingMinutes(bodyMd || "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">
            {savingState === "saving" && "Saving…"}
            {savingState === "saved" && savedAt && `Saved at ${savedAt}`}
            {savingState === "idle" && (savedAt ? `Last saved at ${savedAt}` : "Unsaved")}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {title || "Untitled post"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setDeleting(true)}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <Button type="button" onClick={manualSave} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" /> Save
          </Button>
          <Button type="button" variant={status === "published" ? "secondary" : "primary"} onClick={togglePublish}>
            {status === "published" ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,320px]">
        <div className="space-y-4">
          <Field label="Title" required htmlFor="title" error={errors.title?.message}>
            <Input id="title" {...register("title")} invalid={!!errors.title} />
          </Field>
          <Field
            label="Slug"
            required
            htmlFor="slug"
            error={errors.slug?.message}
            hint="Auto from title; edit to override."
          >
            <Input
              id="slug"
              {...register("slug")}
              invalid={!!errors.slug}
              onChange={(e) => {
                setSlugTouched(true);
                register("slug").onChange(e);
              }}
            />
          </Field>
          <Field label="Body (Markdown)" htmlFor="bodyMd" error={errors.bodyMd?.message} hint={`~${minutes} min read`}>
            <MarkdownEditor
              value={bodyMd ?? ""}
              onChange={(v) => setValue("bodyMd", v, { shouldDirty: true })}
            />
          </Field>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Field label="State" htmlFor="status" error={errors.status?.message}>
                <Select id="status" {...register("status")} invalid={!!errors.status}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cover image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader
                bucket="blog"
                slug={slug || "post"}
                value={coverUrl ?? null}
                onChange={(url) => setValue("coverUrl", url ?? "", { shouldDirty: true })}
                label="Upload cover"
                hint="16:9 recommended. ≤2MB."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Excerpt</CardTitle>
            </CardHeader>
            <CardContent>
              <Field label="Excerpt" htmlFor="excerpt" error={errors.excerpt?.message} hint="Shown in blog index and OG cards.">
                <Textarea id="excerpt" rows={3} {...register("excerpt")} invalid={!!errors.excerpt} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meta description</CardTitle>
            </CardHeader>
            <CardContent>
              <Field label="Meta description" htmlFor="metaDescription" error={errors.metaDescription?.message} hint="Optional. Falls back to excerpt.">
                <Textarea id="metaDescription" rows={2} {...register("metaDescription")} invalid={!!errors.metaDescription} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {tags.map((t) => {
                  const active = selectedTagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className="inline-flex"
                    >
                      <Badge variant={active ? "accent" : "outline"}>
                        {t.name}
                        {active && <X className="ml-1 h-3 w-3" />}
                      </Badge>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="New tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="secondary" size="md" onClick={addTag}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Reading time auto-computed ({minutes} min). Last update:{" "}
            {formatDate(initial.publishedAt as string | null | undefined) || "—"}
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete blog post?"
        description={`"${title}" will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
