"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  createSkillGroup,
  deleteSkillGroup,
  deleteSkill,
  reorder,
} from "@/server/actions";
import { SkillFormDialog } from "./skill-form-dialog";
import { cn } from "@/lib/utils";

export interface SkillItem {
  id: string;
  name: string;
  platform: string | null;
  years: number | null;
  level: number;
  sortOrder: number;
}

export interface SkillGroupRow {
  id: string;
  name: string;
  sortOrder: number;
  skills: SkillItem[];
}

export interface SkillsListProps {
  groups: SkillGroupRow[];
}

export function SkillsList({ groups }: SkillsListProps) {
  const router = useRouter();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ skill: SkillItem; groupId: string } | null>(null);
  const [deletingSkill, setDeletingSkill] = useState<SkillItem | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<SkillGroupRow | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupPending, startGroupTransition] = useTransition();
  const [pending, startTransition] = useTransition();

  function moveGroup(id: string, dir: "up" | "down") {
    startTransition(async () => {
      const res = await reorder({ entity: "skillGroup", id, direction: dir });
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  function moveSkill(id: string, dir: "up" | "down") {
    startTransition(async () => {
      const res = await reorder({ entity: "skill", id, direction: dir });
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  function confirmDeleteSkill() {
    if (!deletingSkill) return;
    return deleteSkill(deletingSkill.id).then((res) => {
      if (res.ok) {
        toast.success("Skill deleted.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function confirmDeleteGroup() {
    if (!deletingGroup) return;
    return deleteSkillGroup(deletingGroup.id).then((res) => {
      if (res.ok) {
        toast.success("Group deleted.");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function createGroup() {
    if (!groupName.trim()) return;
    startGroupTransition(async () => {
      const res = await createSkillGroup({ name: groupName.trim(), sortOrder: 0 });
      if (res.ok) {
        toast.success("Group created.");
        setGroupName("");
        setGroupDialogOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Skills</h1>
        <Button onClick={() => setGroupDialogOpen(true)}>
          <FolderPlus className="h-4 w-4" /> New group
        </Button>
      </div>

      <div className="space-y-4">
        {groups.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No skill groups yet. Create one to start adding skills.
          </p>
        )}
        {groups.map((group, gi) => (
          <Card key={group.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {group.name}
                <Badge variant="outline">{group.skills.length}</Badge>
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={gi === 0 || pending}
                  onClick={() => moveGroup(group.id, "up")}
                  aria-label="Move group up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={gi === groups.length - 1 || pending}
                  onClick={() => moveGroup(group.id, "down")}
                  aria-label="Move group down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeletingGroup(group)}
                  aria-label="Delete group"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {group.skills.length === 0 && (
                <p className="text-xs text-muted-foreground">No skills in this group.</p>
              )}
              <ul className="space-y-1">
                {group.skills.map((skill, si) => (
                  <li
                    key={skill.id}
                    className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{skill.name}</span>
                      {skill.platform && (
                        <span className="text-xs text-muted-foreground">
                          · {skill.platform}
                        </span>
                      )}
                      {skill.years != null && (
                        <span className="text-xs text-muted-foreground">
                          · {skill.years}y
                        </span>
                      )}
                      <span aria-label={`Level ${skill.level} of 5`} title={`Level ${skill.level}/5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              "inline-block h-1.5 w-1.5 rounded-full mx-px",
                              i < skill.level ? "bg-accent" : "bg-muted",
                            )}
                          />
                        ))}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={si === 0 || pending}
                        onClick={() => moveSkill(skill.id, "up")}
                        aria-label="Move skill up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={si === group.skills.length - 1 || pending}
                        onClick={() => moveSkill(skill.id, "down")}
                        aria-label="Move skill down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditing({ skill, groupId: group.id })}
                        aria-label="Edit skill"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeletingSkill(skill)}
                        aria-label="Delete skill"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setAddingTo(group.id)}
                className="mt-2"
              >
                <Plus className="h-4 w-4" /> Add skill
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <SkillFormDialog
        open={addingTo !== null}
        onOpenChange={(o) => !o && setAddingTo(null)}
        groupId={addingTo ?? ""}
      />

      <SkillFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        groupId={editing?.groupId ?? ""}
        initial={
          editing
            ? {
                id: editing.skill.id,
                groupId: editing.groupId,
                name: editing.skill.name,
                platform: editing.skill.platform ?? "",
                years: editing.skill.years ?? undefined,
                level: editing.skill.level,
                sortOrder: editing.skill.sortOrder,
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={!!deletingSkill}
        onOpenChange={(o) => !o && setDeletingSkill(null)}
        title="Delete skill?"
        description={deletingSkill?.name}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDeleteSkill}
      />

      <ConfirmDialog
        open={!!deletingGroup}
        onOpenChange={(o) => !o && setDeletingGroup(null)}
        title="Delete skill group?"
        description={
          deletingGroup
            ? `${deletingGroup.name} and all ${deletingGroup.skills.length} skill(s) inside it`
            : ""
        }
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDeleteGroup}
      />

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>New skill group</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createGroup();
            }}
          >
            <DialogBody className="space-y-3">
              <Field label="Group name" required htmlFor="groupName">
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Programming"
                  autoFocus
                />
              </Field>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setGroupDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={groupPending || !groupName.trim()}>
                {groupPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}