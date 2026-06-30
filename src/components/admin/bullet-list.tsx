"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";

export interface BulletListProps {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  itemPlaceholder?: string;
  rows?: number;
}

export function BulletList({
  value,
  onChange,
  label = "Bullets",
  itemPlaceholder = "Achievement (action verb + outcome)",
  rows = 2,
}: BulletListProps) {
  function update(idx: number, v: string) {
    onChange(value.map((b, i) => (i === idx ? v : b)));
  }
  function add() {
    onChange([...value, ""]);
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="space-y-2">
        {value.map((b, i) => (
          <div key={i} className="flex items-start gap-2">
            <Field className="flex-1">
              <Textarea
                value={b}
                onChange={(e) => update(i, e.target.value)}
                placeholder={itemPlaceholder}
                rows={rows}
              />
            </Field>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(i)}
              aria-label="Remove bullet"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          <Plus className="h-4 w-4" /> Add bullet
        </Button>
      </div>
    </div>
  );
}
