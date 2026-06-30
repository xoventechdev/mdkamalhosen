"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function ChipInput({ value, onChange, placeholder, className }: ChipInputProps) {
  const [draft, setDraft] = useState("");

  function add() {
    const t = draft.trim();
    if (!t) return;
    if (value.includes(t)) {
      setDraft("");
      return;
    }
    onChange([...value, t]);
    setDraft("");
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        {value.map((chip, i) => (
          <span
            key={`${chip}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
          >
            {chip}
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${chip}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {value.length === 0 && (
          <span className="text-xs text-muted-foreground">No items yet.</span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder ?? "Type and press Enter"}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}
