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
import { Select } from "@/components/ui/select";
import { createEducation, updateEducation } from "@/server/actions";
import { educationSchema, type EducationInput } from "@/lib/schemas";

export interface EducationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<EducationInput> & { id?: number };
}

export function EducationFormDialog({
  open,
  onOpenChange,
  initial,
}: EducationFormDialogProps) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EducationInput>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      degree: "",
      institution: "",
      startYear: new Date().getFullYear(),
      endYear: undefined,
      status: "completed",
      sortOrder: 0,
      ...initial,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        degree: initial?.degree ?? "",
        institution: initial?.institution ?? "",
        startYear: initial?.startYear ?? new Date().getFullYear(),
        endYear: initial?.endYear,
        status: (initial?.status as EducationInput["status"]) ?? "completed",
        sortOrder: initial?.sortOrder ?? 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id]);

  function onSubmit(values: EducationInput) {
    startTransition(async () => {
      const res = values.id
        ? await updateEducation({ id: values.id, ...values })
        : await createEducation(values);
      if (res.ok) {
        toast.success(values.id ? "Education updated." : "Education created.");
        onOpenChange(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit education" : "New education"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4">
            <Field label="Degree" required htmlFor="degree" error={errors.degree?.message}>
              <Input id="degree" {...register("degree")} invalid={!!errors.degree} />
            </Field>
            <Field label="Institution" required htmlFor="institution" error={errors.institution?.message}>
              <Input id="institution" {...register("institution")} invalid={!!errors.institution} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start year" required htmlFor="startYear" error={errors.startYear?.message}>
                <Input id="startYear" type="number" {...register("startYear")} invalid={!!errors.startYear} />
              </Field>
              <Field label="End year" htmlFor="endYear" error={errors.endYear?.message}>
                <Input id="endYear" type="number" {...register("endYear")} invalid={!!errors.endYear} />
              </Field>
            </div>
            <Field label="Status" htmlFor="status" error={errors.status?.message}>
              <Select id="status" {...register("status")} invalid={!!errors.status}>
                <option value="completed">Completed</option>
                <option value="ongoing">Ongoing</option>
              </Select>
            </Field>
            <Field label="Sort order" htmlFor="sortOrder" error={errors.sortOrder?.message}>
              <Input id="sortOrder" type="number" {...register("sortOrder")} invalid={!!errors.sortOrder} />
            </Field>
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