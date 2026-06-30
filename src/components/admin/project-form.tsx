"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageUploader, GalleryUploader } from "@/components/ui/image-uploader";
import { ChipInput } from "./chip-input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { createProject, deleteProject, updateProject } from "@/server/actions";
import { projectSchema, type ProjectInput } from "@/lib/schemas";
import { slugify } from "@/lib/utils";

export interface ProjectFormProps {
  initial: ProjectInput & { id: number };
  featuredCount: number;
}

export function ProjectForm({ initial, featuredCount }: ProjectFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: initial,
  });

  // Auto-derive slug from title until user types one explicitly.
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const title = watch("title");
  const slug = watch("slug");
  const coverUrl = watch("coverUrl");
  const galleryImages = watch("galleryImages") ?? [];
  const techStack = watch("techStack") ?? [];
  const featured = watch("featured");

  useEffect(() => {
    if (!slugTouched && title) {
      setValue("slug", slugify(title), { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  function onSubmit(values: ProjectInput) {
    startTransition(async () => {
      const res = await updateProject({ id: initial.id, ...values });
      if (res.ok) {
        toast.success("Project saved.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function saveAndPublish() {
    startTransition(async () => {
      const res = await updateProject({ id: initial.id, ...watch(), status: "published" });
      if (res.ok) {
        toast.success("Project published.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function confirmDelete() {
    return deleteProject(initial.id).then((res) => {
      if (res.ok) {
        toast.success("Project deleted.");
        router.push("/admin/projects");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{initial.title || "Project"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit every part of the public case study.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setDeleting(true)}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" /> Save
          </Button>
          <Button type="button" onClick={saveAndPublish} disabled={pending}>
            Save &amp; publish
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <Field label="Category" required htmlFor="category" error={errors.category?.message}>
            <Select id="category" {...register("category")} invalid={!!errors.category}>
              <option value="bms">BMS</option>
              <option value="software">Software</option>
              <option value="iot">IoT</option>
              <option value="android">Android</option>
            </Select>
          </Field>
          <Field label="Year" required htmlFor="year" error={errors.year?.message}>
            <Input id="year" type="number" min={1990} max={2100} {...register("year")} invalid={!!errors.year} />
          </Field>
          <Field label="Client type" htmlFor="clientType" error={errors.clientType?.message} hint="e.g. Commercial Buildings, Personal project">
            <Input id="clientType" {...register("clientType")} invalid={!!errors.clientType} />
          </Field>
          <Field label="Sort order" htmlFor="sortOrder" error={errors.sortOrder?.message}>
            <Input id="sortOrder" type="number" {...register("sortOrder")} invalid={!!errors.sortOrder} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
          <CardDescription>Cover image, excerpt, and visibility.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUploader
            bucket="projects"
            slug={slug || "project"}
            value={coverUrl ?? null}
            onChange={(url) => setValue("coverUrl", url ?? "", { shouldDirty: true })}
            label="Cover image"
            hint="16:10 ratio recommended. ≤2MB."
          />
          <Field
            label="Excerpt"
            required
            htmlFor="excerpt"
            error={errors.excerpt?.message}
            hint="One line shown on project cards."
          >
            <Textarea id="excerpt" rows={2} {...register("excerpt")} invalid={!!errors.excerpt} />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Status" htmlFor="status" error={errors.status?.message}>
              <Select id="status" {...register("status")} invalid={!!errors.status}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </Field>
            <Field label="Featured" htmlFor="featured" hint={featured ? `Currently ${featuredCount} featured on home (max 3 recommended).` : "Show on the home page (3 max)."}>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  id="featured"
                  {...register("featured")}
                  className="h-4 w-4 rounded border-input"
                />
                <Star className="h-3.5 w-3.5 text-amber-500" /> Featured on home
              </label>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tech &amp; links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Tech stack" hint="Add platforms, protocols, languages">
            <ChipInput
              value={techStack}
              onChange={(next) => setValue("techStack", next, { shouldDirty: true })}
              placeholder="e.g. Niagara 4"
            />
          </Field>
          <Field label="Role" htmlFor="role" error={errors.role?.message} hint="Your role on this project">
            <Input id="role" {...register("role")} invalid={!!errors.role} />
          </Field>
          <Field label="Links (JSON, optional)" htmlFor="links" error={errors.links?.message} hint={`{"live":"…","github":"…","pdf":"…"}`}>
            <Input
              id="links"
              defaultValue={
                initial.links ? JSON.stringify(initial.links) : ""
              }
              onChange={(e) => {
                try {
                  const v = e.target.value.trim();
                  setValue("links", v ? JSON.parse(v) : null, { shouldDirty: true });
                } catch {
                  // ignore — invalid JSON; user will see schema error on submit
                }
              }}
              placeholder='{"live":"https://…"}'
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Narrative</CardTitle>
          <CardDescription>Plain text; line breaks preserved.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Problem" htmlFor="problem" error={errors.problem?.message}>
            <Textarea id="problem" rows={3} {...register("problem")} invalid={!!errors.problem} />
          </Field>
          <Field label="Challenges" htmlFor="challenges" error={errors.challenges?.message}>
            <Textarea id="challenges" rows={3} {...register("challenges")} invalid={!!errors.challenges} />
          </Field>
          <Field label="Solution" htmlFor="solution" error={errors.solution?.message}>
            <Textarea id="solution" rows={3} {...register("solution")} invalid={!!errors.solution} />
          </Field>
          <Field label="Outcome" htmlFor="outcome" error={errors.outcome?.message}>
            <Textarea id="outcome" rows={3} {...register("outcome")} invalid={!!errors.outcome} />
          </Field>
          <Field label="Lessons learned" htmlFor="lessons" error={errors.lessons?.message}>
            <Textarea id="lessons" rows={3} {...register("lessons")} invalid={!!errors.lessons} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gallery</CardTitle>
          <CardDescription>Up to ~6 anonymized screenshots or diagrams.</CardDescription>
        </CardHeader>
        <CardContent>
          <GalleryUploader
            bucket="projects"
            slug={slug || "project"}
            value={galleryImages}
            onChange={(next) => setValue("galleryImages", next, { shouldDirty: true })}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete project?"
        description={`"${initial.title || "This project"}" will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
      />
    </form>
  );
}