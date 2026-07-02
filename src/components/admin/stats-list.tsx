"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export interface StatRow {
  value: string;
  label: string;
  color?: string;
}

export interface StatsListProps {
  value: StatRow[];
  onChange: (next: StatRow[]) => void;
}

/**
 * Editable list of `{ value; label; color? }` rows for the Profile form's
 * StatGrid. Mirrors the structure of `BulletList` (add/remove + per-row
 * fields) but is a separate component because the field shape differs.
 */
export function StatsList({ value, onChange }: StatsListProps) {
  function update(idx: number, patch: Partial<StatRow>) {
    onChange(value.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }
  function add() {
    onChange([...value, { value: "", label: "", color: "" }]);
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {value.length === 0 && (
          <p className="text-xs text-muted-foreground">No stats yet.</p>
        )}
        {value.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_2fr_1fr_auto]"
          >
            <Field label="Value">
              <Input
                value={row.value}
                onChange={(e) => update(i, { value: e.target.value })}
                placeholder="5+"
              />
            </Field>
            <Field label="Label">
              <Input
                value={row.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Years international"
              />
            </Field>
            <Field label="Color (optional)">
              <Input
                value={row.color ?? ""}
                onChange={(e) => update(i, { color: e.target.value })}
                placeholder="text-accent"
              />
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(i)}
                aria-label="Remove stat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          <Plus className="h-4 w-4" /> Add stat
        </Button>
      </div>
    </div>
  );
}
