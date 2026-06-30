"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CertificationFormDialog } from "./certifications-form-dialog";
import { deleteCertification, reorder } from "@/server/actions";
import type { CertificationInput } from "@/lib/schemas";

export interface CertificationRow {
  id: number;
  name: string;
  issuer: string;
  year: number | null;
  credentialUrl: string | null;
  sortOrder: number;
}

export interface CertificationsListProps {
  rows: CertificationRow[];
}

export function CertificationsList({ rows }: CertificationsListProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<CertificationRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<CertificationRow | null>(null);
  const [pending, startTransition] = useTransition();

  function move(id: number, dir: "up" | "down") {
    startTransition(async () => {
      const res = await reorder({ entity: "certification", id, direction: dir });
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    return deleteCertification(deleting.id).then((res) => {
      if (res.ok) {
        toast.success("Certification deleted.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Certifications</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New certification
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Issuer</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Credential</TableHead>
            <TableHead className="w-40 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty colSpan={6}>No certifications yet.</TableEmpty>
          ) : (
            rows.map((row, i) => (
              <TableRow key={row.id}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.issuer}</TableCell>
                <TableCell>{row.year ?? "—"}</TableCell>
                <TableCell>
                  {row.credentialUrl ? (
                    <a
                      href={row.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      Verify <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" disabled={i === 0 || pending} onClick={() => move(row.id, "up")} aria-label="Move up">
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" disabled={i === rows.length - 1 || pending} onClick={() => move(row.id, "down")} aria-label="Move down">
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(row)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleting(row)} aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <CertificationFormDialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        initial={editing ? toInput(editing) : undefined}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete certification?"
        description={deleting ? deleting.name : ""}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
      />
    </>
  );
}

function toInput(row: CertificationRow): CertificationInput {
  return {
    id: row.id,
    name: row.name,
    issuer: row.issuer,
    year: row.year ?? undefined,
    credentialUrl: row.credentialUrl ?? "",
    sortOrder: row.sortOrder,
  };
}