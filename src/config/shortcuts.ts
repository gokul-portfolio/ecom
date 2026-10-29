/**
 * Centralized Enterprise Keyboard Shortcuts Registry
 * Standardized for Admin Consoles, ERP, and High-Speed Data Entry
 */

export interface ShortcutDefinition {
  id: string;
  category: "Global" | "Form Entry" | "Tables & Lists" | "Function Keys";
  keys: string[];
  description: string;
  scope?: string;
}

export const SHORTCUT_REGISTRY: ShortcutDefinition[] = [
  // Global Navigation
  {
    id: "toggle-sidebar",
    category: "Global",
    keys: ["Ctrl", "B"],
    description: "Expand or collapse navigation sidebar",
  },
  {
    id: "shortcuts-help",
    category: "Global",
    keys: ["Shift", "?"],
    description: "Display keyboard shortcuts cheat sheet",
  },
  {
    id: "close-modal",
    category: "Global",
    keys: ["Esc"],
    description: "Close active modal, drawer, or dropdown",
  },

  // Form Field Navigation & Industrial Data Entry
  {
    id: "next-field",
    category: "Form Entry",
    keys: ["→", "or", "↓", "or", "Enter"],
    description: "Move focus to next input field / exit textarea boundary",
  },
  {
    id: "prev-field",
    category: "Form Entry",
    keys: ["←", "or", "↑", "or", "Shift", "Enter"],
    description: "Move focus to previous input field / exit textarea boundary",
  },
  {
    id: "jump-textarea",
    category: "Form Entry",
    keys: ["Alt", "+", "Arrows"],
    description: "Instantly jump out of multi-line textareas to next/prev field",
  },
  {
    id: "submit-form",
    category: "Form Entry",
    keys: ["Ctrl", "Enter"],
    description: "Validate and submit the active form",
  },
  {
    id: "save-draft",
    category: "Form Entry",
    keys: ["Ctrl", "S"],
    description: "Quick save draft / changes",
  },
  {
    id: "reset-field",
    category: "Form Entry",
    keys: ["Esc"],
    description: "Clear or cancel current input editing",
  },

  // Tables & Grids
  {
    id: "table-create",
    category: "Tables & Lists",
    keys: ["Insert", "or", "Alt", "N"],
    description: "Add / Create new record",
  },
  {
    id: "table-down",
    category: "Tables & Lists",
    keys: ["↓"],
    description: "Select next row in data table",
  },
  {
    id: "table-up",
    category: "Tables & Lists",
    keys: ["↑"],
    description: "Select previous row in data table",
  },
  {
    id: "table-open",
    category: "Tables & Lists",
    keys: ["Enter"],
    description: "View details of selected row",
  },
  {
    id: "table-edit",
    category: "Tables & Lists",
    keys: ["Ctrl", "E"],
    description: "Edit selected row item",
  },
  {
    id: "table-delete",
    category: "Tables & Lists",
    keys: ["Delete"],
    description: "Delete selected row item",
  },
  {
    id: "table-select",
    category: "Tables & Lists",
    keys: ["Space"],
    description: "Toggle row selection checkbox",
  },

  // Function Keys
  {
    id: "fn-help",
    category: "Function Keys",
    keys: ["F1"],
    description: "Open documentation / shortcuts help",
  },
  {
    id: "fn-edit",
    category: "Function Keys",
    keys: ["F2"],
    description: "Quick edit / rename selected item",
  },
  {
    id: "fn-find",
    category: "Function Keys",
    keys: ["F3"],
    description: "Find or filter current table",
  },
  {
    id: "fn-filter",
    category: "Function Keys",
    keys: ["F4"],
    description: "Toggle filter drawer or query panel",
  },
  {
    id: "fn-refresh",
    category: "Function Keys",
    keys: ["F5"],
    description: "Refresh current data view",
  },
  {
    id: "fn-shortcuts-drawer",
    category: "Function Keys",
    keys: ["F6"],
    description: "Toggle Keyboard Shortcuts Drawer",
  },
];
