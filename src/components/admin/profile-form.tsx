"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageUploader } from "@/components/ui/image-uploader";
import { upsertProfile } from "@/server/actions";
import { profileSchema, type ProfileInput } from "@/lib/schemas";

export interface ProfileFormProps {
  initial: ProfileInput;
}

export function ProfileForm({ initial }: ProfileFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: initial,
  });

  const avatarUrl = watch("avatarUrl");

  function onSubmit(values: ProfileInput) {
    startTransition(async () => {
      const res = await upsertProfile(values);
      if (res.ok) {
        toast.success("Profile saved.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>How you appear across the site.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Name" required error={errors.name?.message} htmlFor="name">
            <Input id="name" {...register("name")} invalid={!!errors.name} />
          </Field>
          <Field label="Role" required error={errors.role?.message} htmlFor="role">
            <Input id="role" {...register("role")} invalid={!!errors.role} />
          </Field>
          <Field
            label="Tagline"
            required
            error={errors.tagline?.message}
            htmlFor="tagline"
            hint="One-line positioning shown on the home hero."
            className="md:col-span-2"
          >
            <Input id="tagline" {...register("tagline")} invalid={!!errors.tagline} />
          </Field>
          <Field label="Location" required error={errors.location?.message} htmlFor="location">
            <Input id="location" {...register("location")} invalid={!!errors.location} />
          </Field>
          <Field label="Availability" htmlFor="availability" error={errors.availability?.message}>
            <select
              id="availability"
              {...register("availability")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="open">Open</option>
              <option value="limited">Limited</option>
              <option value="closed">Closed</option>
            </select>
          </Field>
          <Field label="Open to relocation" htmlFor="relocate" className="md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("relocate")} className="h-4 w-4 rounded border-input" />
              Show "Relocate: yes" badge
            </label>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription>Public contact details.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Email" required error={errors.email?.message} htmlFor="email">
            <Input id="email" type="email" {...register("email")} invalid={!!errors.email} />
          </Field>
          <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
            <Input id="phone" {...register("phone")} invalid={!!errors.phone} />
          </Field>
          <Field label="LinkedIn URL" htmlFor="linkedinUrl" error={errors.linkedinUrl?.message}>
            <Input id="linkedinUrl" {...register("linkedinUrl")} invalid={!!errors.linkedinUrl} />
          </Field>
          <Field label="GitHub URL" htmlFor="githubUrl" error={errors.githubUrl?.message}>
            <Input id="githubUrl" {...register("githubUrl")} invalid={!!errors.githubUrl} />
          </Field>
          <Field label="WhatsApp" htmlFor="whatsapp" error={errors.whatsapp?.message}>
            <Input id="whatsapp" {...register("whatsapp")} invalid={!!errors.whatsapp} />
          </Field>
          <Field label="CV PDF URL" htmlFor="cvPdfUrl" error={errors.cvPdfUrl?.message} hint="Path to a PDF in /public or Supabase Storage.">
            <Input id="cvPdfUrl" {...register("cvPdfUrl")} invalid={!!errors.cvPdfUrl} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>Square image, ≤2MB.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader
            bucket="avatars"
            slug="profile"
            value={avatarUrl ?? null}
            onChange={(url) => setValue("avatarUrl", url ?? "", { shouldDirty: true })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Narrative</CardTitle>
          <CardDescription>Long-form copy shown on About, CV, and home.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Summary" required error={errors.summary?.message} htmlFor="summary">
            <Textarea id="summary" rows={5} {...register("summary")} invalid={!!errors.summary} />
          </Field>
          <Field label="Mission" required error={errors.mission?.message} htmlFor="mission">
            <Textarea id="mission" rows={3} {...register("mission")} invalid={!!errors.mission} />
          </Field>
          <Field label="Philosophy" required error={errors.philosophy?.message} htmlFor="philosophy">
            <Textarea id="philosophy" rows={4} {...register("philosophy")} invalid={!!errors.philosophy} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
