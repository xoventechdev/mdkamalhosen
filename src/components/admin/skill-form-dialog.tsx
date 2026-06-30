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
import { createSkill, updateSkill } from "@/server/actions";
import { skillSchema, type SkillInput } from "@/lib/schemas";

export interface SkillFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  initial?: Partial<SkillInput> & { id?: number };
}

export function SkillFormDialog({
  open,
  onOpenChange,
  groupId,
  initial,
}: SkillFormDialogProps) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SkillInput>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      groupId,
      name: "",
      platform: "",
      years: undefined,
      level: 3,
      sortOrder: 0,
      ...initial,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        groupId,
        name: initial?.name ?? "",
        platform: initial?.platform ?? "",
        years: initial?.years,
        level: initial?.level ?? 3,
        sortOrder: initial?.sortOrder ?? 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id]);

  function onSubmit(values: SkillInput) {
    startTransition(async () => {
      const res = values.id
        ? await updateSkill({ id: values.id, ...values })
        : await createSkill(values);
      if (res.ok) {
        toast.success(values.id ? "Skill updated." : "Skill created.");
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
          <DialogTitle>{initial?.id ? "Edit skill" : "New skill"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4">
            <Field label="Name" required htmlFor="name" error={errors.name?.message}>
              <Input id="name" {...register("name")} invalid={!!errors.name} />
            </Field>
            <Field label="Platform" htmlFor="platform" error={errors.platform?.message} hint="e.g. Honeywell Alerton">
              <Input id="platform" {...register("platform")} invalid={!!errors.platform} />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Years" htmlFor="years" error={errors.years?.message}>
                <Input id="years" type="number" min={0} max={80} {...register("years")} invalid={!!errors.years} />
              </Field>
              <Field label="Level (1–5)" htmlFor="level" error={errors.level?.message}>
                <Input id="level" type="number" min={1} max={5} {...register("level")} invalid={!!errors.level} />
              </Field>
              <Field label="Sort order" htmlFor="sortOrder" error={errors.sortOrder?.message}>
                <Input id="sortOrder" type="number" {...register("sortOrder")} invalid={!!errors.sortOrder} />
              </Field>
            </div>
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