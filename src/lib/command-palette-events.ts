/**
 * Event names used to open/toggle the global command palette.
 *
 * Kept in a tiny standalone module so components (header, lazy loader) can
 * import the constants without pulling the palette + search index into the
 * initial client bundle.
 */
export const COMMAND_PALETTE_TOGGLE = "puku:command-palette:toggle";
export const COMMAND_PALETTE_OPEN = "puku:command-palette:open";
export const COMMAND_PALETTE_CLOSE = "puku:command-palette:close";
