"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EducationFormDialog } from "./education-form-dialog";
import { deleteEducation, reorder } from "@/server/actions";
import type { EducationInput } from "@/lib/schemas";

export interface EducationRow {
  id: string;
  degree: string;
  institution: string;
  startYear: number;
  endYear: number | null;
  status: string;
  sortOrder: number;
}

export interface EducationListProps {
  rows: EducationRow[];
}

export function EducationList({ rows }: EducationListProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<EducationRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<EducationRow | null>(null);
  const [pending, startTransition] = useTransition();

  function move(id: string, dir: "up" | "down") {
    startTransition(async () => {
      const res = await reorder({ entity: "education", id, direction: dir });
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    return deleteEducation(deleting.id).then((res) => {
      if (res.ok) {
        toast.success("Education deleted.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Education</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New education
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Degree</TableHead>
            <TableHead>Institution</TableHead>
            <TableHead>Years</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-40 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty colSpan={6}>No education yet.</TableEmpty>
          ) : (
            rows.map((row, i) => (
              <TableRow key={row.id}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-medium">{row.degree}</TableCell>
                <TableCell>{row.institution}</TableCell>
                <TableCell>
                  {row.startYear} — {row.endYear ?? "Present"}
                </TableCell>
                <TableCell>
                  <Badge variant={row.status === "ongoing" ? "accent" : "outline"}>
                    {row.status}
                  </Badge>
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

      <EducationFormDialog
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
        title="Delete education?"
        description={deleting ? `${deleting.degree} at ${deleting.institution}` : ""}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
      />
    </>
  );
}

function toInput(row: EducationRow): EducationInput {
  return {
    id: row.id,
    degree: row.degree,
    institution: row.institution,
    startYear: row.startYear,
    endYear: row.endYear ?? undefined,
    status: row.status as EducationInput["status"],
    sortOrder: row.sortOrder,
  };
}