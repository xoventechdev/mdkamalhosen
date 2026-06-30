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
import { createCertification, updateCertification } from "@/server/actions";
import { certificationSchema, type CertificationInput } from "@/lib/schemas";

export interface CertificationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<CertificationInput> & { id?: number };
}

export function CertificationFormDialog({
  open,
  onOpenChange,
  initial,
}: CertificationFormDialogProps) {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CertificationInput>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      name: "",
      issuer: "",
      year: undefined,
      credentialUrl: "",
      sortOrder: 0,
      ...initial,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? "",
        issuer: initial?.issuer ?? "",
        year: initial?.year,
        credentialUrl: initial?.credentialUrl ?? "",
        sortOrder: initial?.sortOrder ?? 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id]);

  function onSubmit(values: CertificationInput) {
    startTransition(async () => {
      const res = values.id
        ? await updateCertification({ id: values.id, ...values })
        : await createCertification(values);
      if (res.ok) {
        toast.success(values.id ? "Certification updated." : "Certification created.");
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
          <DialogTitle>{initial?.id ? "Edit certification" : "New certification"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4">
            <Field label="Name" required htmlFor="name" error={errors.name?.message}>
              <Input id="name" {...register("name")} invalid={!!errors.name} />
            </Field>
            <Field label="Issuer" required htmlFor="issuer" error={errors.issuer?.message}>
              <Input id="issuer" {...register("issuer")} invalid={!!errors.issuer} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Year" htmlFor="year" error={errors.year?.message}>
                <Input id="year" type="number" {...register("year")} invalid={!!errors.year} />
              </Field>
              <Field label="Sort order" htmlFor="sortOrder" error={errors.sortOrder?.message}>
                <Input id="sortOrder" type="number" {...register("sortOrder")} invalid={!!errors.sortOrder} />
              </Field>
            </div>
            <Field label="Credential URL" htmlFor="credentialUrl" error={errors.credentialUrl?.message} hint="Verification link (optional)">
              <Input id="credentialUrl" {...register("credentialUrl")} invalid={!!errors.credentialUrl} />
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