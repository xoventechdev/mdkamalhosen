"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export interface HighlightRow {
  text: string;
  jobSeekingOnly?: boolean;
}

export interface HighlightsListProps {
  value: HighlightRow[];
  onChange: (next: HighlightRow[]) => void;
}

/**
 * Editable list of `{ text; jobSeekingOnly }` rows for the Profile form's
 * Marketing highlights card. Each row has a text input and a checkbox;
 * `jobSeekingOnly` items are filtered out of the home page marquee when
 * the admin turns off `lookingToNewOpportunity`.
 */
export function HighlightsList({ value, onChange }: HighlightsListProps) {
  function update(idx: number, patch: Partial<HighlightRow>) {
    onChange(value.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }
  function add() {
    onChange([...value, { text: "", jobSeekingOnly: false }]);
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {value.length === 0 && (
          <p className="text-xs text-muted-foreground">No highlights yet.</p>
        )}
        {value.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_auto_auto]"
          >
            <Field label="Text">
              <Input
                value={row.text}
                onChange={(e) => update(i, { text: e.target.value })}
                placeholder="Honeywell Alerton"
              />
            </Field>
            <Field label="Job-seeking only" className="sm:w-44">
              <label className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
                <input
                  type="checkbox"
                  checked={row.jobSeekingOnly}
                  onChange={(e) =>
                    update(i, { jobSeekingOnly: e.target.checked })
                  }
                  aria-label="Job-seeking only"
                  className="h-4 w-4 rounded border-input"
                />
                Hide when not seeking
              </label>
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(i)}
                aria-label="Remove highlight"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          <Plus className="h-4 w-4" /> Add highlight
        </Button>
      </div>
    </div>
  );
}
