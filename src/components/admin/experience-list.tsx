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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { ExperienceFormDialog } from "./experience-form-dialog";
import { deleteExperience, reorder } from "@/server/actions";
import { formatDate } from "@/lib/utils";
import type { ExperienceInput } from "@/lib/schemas";

export interface ExperienceRow {
  id: number;
  company: string;
  role: string;
  country: string;
  city: string | null;
  startDate: Date;
  endDate: Date | null;
  current: boolean;
  bullets: string[];
  stack: string[];
  marqueeProject: string | null;
  sortOrder: number;
}

export interface ExperienceListProps {
  rows: ExperienceRow[];
}

export function ExperienceList({ rows }: ExperienceListProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<ExperienceRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ExperienceRow | null>(null);
  const [pending, startTransition] = useTransition();

  function move(id: number, dir: "up" | "down") {
    startTransition(async () => {
      const res = await reorder({ entity: "experience", id, direction: dir });
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    return deleteExperience(deleting.id).then((res) => {
      if (res.ok) {
        toast.success("Experience deleted.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Experience</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New experience
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Role · Company</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Stack</TableHead>
            <TableHead className="w-40 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty colSpan={5}>No experience yet.</TableEmpty>
          ) : (
            rows.map((row, i) => (
              <TableRow key={row.id}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  <div className="font-medium">{row.role}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.company} · {row.city ? `${row.city}, ` : ""}{row.country}
                  </div>
                  {row.marqueeProject && (
                    <Badge variant="accent" className="mt-1">
                      {row.marqueeProject}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDate(row.startDate)} —{" "}
                    {row.current ? "Present" : formatDate(row.endDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {row.stack.slice(0, 3).map((s) => (
                      <Badge key={s} variant="outline">{s}</Badge>
                    ))}
                    {row.stack.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{row.stack.length - 3}</span>
                    )}
                  </div>
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

      <ExperienceFormDialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        initial={
          editing
            ? toInput(editing)
            : { bullets: [], stack: [], current: false, country: "", startDate: "" }
        }
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete experience?"
        description={deleting ? `${deleting.role} at ${deleting.company} will be removed permanently.` : ""}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
      />
    </>
  );
}

function toInput(row: ExperienceRow): ExperienceInput {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    country: row.country,
    city: row.city ?? "",
    startDate: row.startDate.toISOString().slice(0, 10),
    endDate: row.endDate ? row.endDate.toISOString().slice(0, 10) : "",
    current: row.current,
    bullets: row.bullets,
    stack: row.stack,
    marqueeProject: row.marqueeProject ?? "",
    sortOrder: row.sortOrder,
  };
}
