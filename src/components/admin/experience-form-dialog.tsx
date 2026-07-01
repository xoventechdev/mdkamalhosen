"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { ChipInput } from "./chip-input";
import { BulletList } from "./bullet-list";
import {
  createExperience,
  updateExperience,
} from "@/server/actions";
import { experienceSchema, type ExperienceInput } from "@/lib/schemas";

export interface ExperienceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<ExperienceInput> & { id?: string };
}

export function ExperienceFormDialog({
  open,
  onOpenChange,
  initial,
}: ExperienceFormDialogProps) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExperienceInput>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      company: initial?.company ?? "",
      role: initial?.role ?? "",
      country: initial?.country ?? "",
      city: initial?.city ?? "",
      startDate: initial?.startDate ? toDateInput(initial.startDate) : "",
      endDate: initial?.endDate ? toDateInput(initial.endDate) : "",
      current: initial?.current ?? false,
      bullets: initial?.bullets ?? [],
      stack: initial?.stack ?? [],
      marqueeProject: initial?.marqueeProject ?? "",
      sortOrder: initial?.sortOrder ?? 0,
    },
  });

  // Re-init when opened with new initial.
  useEffect(() => {
    if (open) {
      reset({
        company: initial?.company ?? "",
        role: initial?.role ?? "",
        country: initial?.country ?? "",
        city: initial?.city ?? "",
        startDate: initial?.startDate ? toDateInput(initial.startDate) : "",
        endDate: initial?.endDate ? toDateInput(initial.endDate) : "",
        current: initial?.current ?? false,
        bullets: initial?.bullets ?? [],
        stack: initial?.stack ?? [],
        marqueeProject: initial?.marqueeProject ?? "",
        sortOrder: initial?.sortOrder ?? 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id]);

  const current = watch("current");
  const bullets = watch("bullets");
  const stack = watch("stack");

  function onSubmit(values: ExperienceInput) {
    startTransition(async () => {
      const payload = {
        ...values,
        endDate: values.current ? null : values.endDate,
        startDate: values.startDate,
      };
      const res = values.id
        ? await updateExperience({ id: values.id, ...payload })
        : await createExperience(payload);
      if (res.ok) {
        toast.success(values.id ? "Experience updated." : "Experience created.");
        onOpenChange(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit experience" : "New experience"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Company" required htmlFor="company" error={errors.company?.message}>
                <Input id="company" {...register("company")} invalid={!!errors.company} />
              </Field>
              <Field label="Role" required htmlFor="role" error={errors.role?.message}>
                <Input id="role" {...register("role")} invalid={!!errors.role} />
              </Field>
              <Field label="Country" required htmlFor="country" error={errors.country?.message}>
                <Input id="country" {...register("country")} invalid={!!errors.country} />
              </Field>
              <Field label="City" htmlFor="city" error={errors.city?.message}>
                <Input id="city" {...register("city")} invalid={!!errors.city} />
              </Field>
              <Field label="Start date" required htmlFor="startDate" error={errors.startDate?.message}>
                <Input id="startDate" type="date" {...register("startDate")} invalid={!!errors.startDate} />
              </Field>
              <Field
                label="End date"
                htmlFor="endDate"
                error={errors.endDate?.message}
                hint={current ? "Currently here — leave blank" : undefined}
              >
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                  invalid={!!errors.endDate}
                  disabled={current}
                />
              </Field>
              <Field label="Currently here" htmlFor="current" className="md:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("current")} className="h-4 w-4 rounded border-input" />
                  This is my current role
                </label>
              </Field>
              <Field label="Marquee project" htmlFor="marqueeProject" error={errors.marqueeProject?.message} hint="Optional callout (e.g. KAFD)">
                <Input id="marqueeProject" {...register("marqueeProject")} invalid={!!errors.marqueeProject} />
              </Field>
              <Field label="Sort order" htmlFor="sortOrder" error={errors.sortOrder?.message}>
                <Input id="sortOrder" type="number" {...register("sortOrder")} invalid={!!errors.sortOrder} />
              </Field>
            </div>
            <Field label="Tech stack" hint="Add platforms and protocols (e.g. Honeywell Alerton, BACnet)">
              <ChipInput
                value={stack ?? []}
                onChange={(next) => setValue("stack", next, { shouldDirty: true })}
                placeholder="Type a platform and press Enter"
              />
            </Field>
            <BulletList
              value={bullets ?? []}
              onChange={(next) => setValue("bullets", next, { shouldDirty: true })}
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? "Saving…" : initial?.id ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toDateInput(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
