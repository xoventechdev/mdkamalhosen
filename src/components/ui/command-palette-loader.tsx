"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  COMMAND_PALETTE_OPEN,
  COMMAND_PALETTE_TOGGLE,
} from "@/lib/command-palette-events";

// The palette (and the static search index it imports) is only needed once a
// visitor actually opens it. Keeping it out of the initial client graph saves
// parse/execute work on every page load.
const CommandPalette = dynamic(
  () => import("@/components/ui/command-palette").then((m) => m.CommandPalette),
  { ssr: false },
);

/**
 * Tiny event listener that mounts the real command palette on first use.
 * It handles the same triggers the palette itself does (Cmd/Ctrl-K and the
 * header's custom events), then passes `defaultOpen` so the first trigger
 * still opens the dialog immediately after the lazy chunk loads.
 */
export function CommandPaletteLoader() {
  const [ready, setReady] = React.useState(false);
  const [initialOpen, setInitialOpen] = React.useState(false);

  React.useEffect(() => {
    if (ready) return;

    function trigger() {
      setInitialOpen(true);
      setReady(true);
    }

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        trigger();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(COMMAND_PALETTE_TOGGLE, trigger);
    window.addEventListener(COMMAND_PALETTE_OPEN, trigger);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(COMMAND_PALETTE_TOGGLE, trigger);
      window.removeEventListener(COMMAND_PALETTE_OPEN, trigger);
    };
  }, [ready]);

  if (!ready) return null;
  return <CommandPalette defaultOpen={initialOpen} />;
}
