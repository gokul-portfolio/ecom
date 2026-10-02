"use client";

import { useEffect, useRef, useCallback, RefObject } from "react";

/**
 * Supported focusable selectors for forms and interactive containers
 */
const FOCUSABLE_SELECTORS = [
  "input:not([type='hidden']):not([disabled]):not([readonly])",
  "select:not([disabled]):not([readonly])",
  "textarea:not([disabled]):not([readonly])",
  "button:not([disabled])",
  "[tabindex='0']:not([disabled])",
  "[role='combobox']:not([aria-disabled='true'])",
  "[role='button']:not([aria-disabled='true'])",
].join(", ");

export interface FormKeyboardNavigationOptions {
  /**
   * If true, ArrowDown and ArrowUp navigate between form fields
   * @default true
   */
  enableArrowKeys?: boolean;
  /**
   * If true, Enter key navigates to the next input field instead of submitting form
   * (Standard for ERP, SAP, Excel-like industrial data entry)
   * @default true
   */
  enableEnterNavigation?: boolean;
  /**
   * If true, pressing Ctrl+Enter or Cmd+Enter will submit the form
   * @default true
   */
  submitOnCtrlEnter?: boolean;
  /**
   * If true, wraps to the first field after reaching the last field, and vice versa
   * @default false
   */
  wrapAround?: boolean;
  /**
   * Automatically focuses the first focusable input on component mount
   * @default false
   */
  autoFocusFirst?: boolean;
  /**
   * Callback fired when Ctrl+Enter or Cmd+Enter is pressed
   */
  onSubmit?: () => void;
  /**
   * Callback fired when Escape key is pressed inside the form
   */
  onCancel?: () => void;
  /**
   * Custom selector filter for focusable elements
   */
  customSelector?: string;
}

/**
 * Enterprise Form Keyboard Navigation Hook
 * Enables Arrow Keys (Up/Down) & Enter key navigation across all form fields
 * Prevents accidental form submissions and provides rapid data entry ergonomics.
 */
export function useFormKeyboardNavigation<T extends HTMLElement = HTMLFormElement>(
  options: FormKeyboardNavigationOptions = {}
) {
  const {
    enableArrowKeys = true,
    enableEnterNavigation = true,
    submitOnCtrlEnter = true,
    wrapAround = false,
    autoFocusFirst = false,
    onSubmit,
    onCancel,
    customSelector = FOCUSABLE_SELECTORS,
  } = options;

  const containerRef = useRef<T | null>(null);

  // Helper to retrieve all active focusable elements within container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    const elements = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(customSelector)
    );
    // Filter out invisible or hidden elements
    return elements.filter((el) => {
      const style = window.getComputedStyle(el);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        el.offsetParent !== null
      );
    });
  }, [customSelector]);

  // Navigate focus to next or previous field
  const moveFocus = useCallback(
    (direction: "next" | "prev", currentElement: HTMLElement) => {
      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const currentIndex = focusable.indexOf(currentElement);
      if (currentIndex === -1) return;

      let targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;

      if (wrapAround) {
        if (targetIndex >= focusable.length) targetIndex = 0;
        if (targetIndex < 0) targetIndex = focusable.length - 1;
      } else {
        if (targetIndex >= focusable.length || targetIndex < 0) return;
      }

      const targetElement = focusable[targetIndex];
      if (targetElement) {
        targetElement.focus();
        // If it's a text input, optionally select text for quick overwrite
        if (
          targetElement instanceof HTMLInputElement &&
          ["text", "number", "email", "tel"].includes(targetElement.type)
        ) {
          targetElement.select();
        }
      }
    },
    [getFocusableElements, wrapAround]
  );

  // Auto-focus first input on mount
  useEffect(() => {
    if (!autoFocusFirst) return;
    const timer = setTimeout(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [autoFocusFirst, getFocusableElements]);

  // Main keydown handler for the form
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<T>) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement ||
        target.getAttribute("role") === "combobox";

      // 1. Handle Submit on Ctrl+Enter / Cmd+Enter
      if (submitOnCtrlEnter && (e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (onSubmit) {
          onSubmit();
        } else if (containerRef.current instanceof HTMLFormElement) {
          containerRef.current.requestSubmit();
        }
        return;
      }

      // 2. Handle Escape to Cancel / Reset
      if (e.key === "Escape" && onCancel) {
        e.preventDefault();
        onCancel();
        return;
      }

      // If key is pressed inside a textarea, respect multi-line typing unless Ctrl or Alt is held
      if (target instanceof HTMLTextAreaElement) {
        if (!e.ctrlKey && !e.altKey) {
          // Allow natural typing and arrow keys inside textarea
          return;
        }
      }

      // 3. Handle Enter Key navigation (Next Field)
      if (enableEnterNavigation && e.key === "Enter" && !e.shiftKey) {
        // Do not intercept Enter on button click or submit button
        if (target instanceof HTMLButtonElement) {
          return;
        }
        e.preventDefault();
        moveFocus("next", target);
        return;
      }

      // 4. Handle Shift+Enter (Previous Field)
      if (enableEnterNavigation && e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        moveFocus("prev", target);
        return;
      }

      // 5. Handle Arrow Keys (Down -> Next Field, Up -> Prev Field)
      if (enableArrowKeys && isInput) {
        // If native select is active and alt is not pressed, native select uses arrows to choose options
        if (target instanceof HTMLSelectElement && !e.altKey) {
          return;
        }

        if (e.key === "ArrowDown") {
          e.preventDefault();
          moveFocus("next", target);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          moveFocus("prev", target);
        }
      }
    },
    [
      enableArrowKeys,
      enableEnterNavigation,
      submitOnCtrlEnter,
      moveFocus,
      onSubmit,
      onCancel,
    ]
  );

  return {
    containerRef,
    handleKeyDown,
    getFocusableElements,
  };
}

/**
 * Keyboard Shortcuts Definition Map
 */
export type ShortcutHandler = (e: KeyboardEvent) => void;
export type ShortcutsMap = Record<string, ShortcutHandler>;

export interface KeyboardShortcutsOptions {
  /**
   * If true, shortcuts fire even when user is typing inside an input/textarea/select
   * (Typically true for modifier keys like Ctrl+S, F-keys, etc.)
   * @default false
   */
  enableInInputs?: boolean;
  /**
   * Target element to attach listener to (defaults to window for global shortcuts)
   */
  target?: RefObject<HTMLElement | null> | HTMLElement | Window;
  /**
   * Automatically call preventDefault on matched shortcut events
   * @default true
   */
  preventDefault?: boolean;
}

/**
 * Industrial Keyboard Shortcuts Hook
 * Supports single keys, F-keys (F1-F12), and modifier combinations:
 * 'ctrl+s', 'meta+s', 'alt+n', 'f1', 'f2', 'f4', 'shift+?', 'escape'
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutsMap,
  options: KeyboardShortcutsOptions = {}
) {
  const {
    enableInInputs = false,
    target,
    preventDefault = true,
  } = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute("contenteditable") === "true";

      // Normalize current event key combination
      const pressedKeys: string[] = [];
      if (e.ctrlKey) pressedKeys.push("ctrl");
      if (e.metaKey) pressedKeys.push("meta");
      if (e.altKey) pressedKeys.push("alt");
      if (e.shiftKey) pressedKeys.push("shift");

      const keyName = e.key.toLowerCase();
      // Avoid pushing duplicate modifier names
      if (!["control", "meta", "alt", "shift"].includes(keyName)) {
        pressedKeys.push(keyName);
      }

      const currentCombo = pressedKeys.join("+");

      // Match against registered shortcuts (supports comma-separated aliases, e.g. "ctrl+s, meta+s")
      for (const [shortcutPattern, handler] of Object.entries(shortcuts)) {
        const patterns = shortcutPattern
          .toLowerCase()
          .split(",")
          .map((p) => p.trim());

        const isMatch = patterns.some((p) => {
          // Exact combo match
          if (p === currentCombo) return true;
          // Match single key if no modifiers needed
          if (p === keyName && pressedKeys.length === 1) return true;
          return false;
        });

        if (isMatch) {
          // If in input field, only allow if modifier was pressed or enableInInputs is explicitly true
          const hasModifier = e.ctrlKey || e.metaKey || e.altKey || keyName.startsWith("f");
          if (isInput && !enableInInputs && !hasModifier) {
            continue;
          }

          if (preventDefault) {
            e.preventDefault();
          }
          handler(e);
          break;
        }
      }
    };

    const targetEl =
      target && "current" in target ? target.current : target || window;

    if (targetEl) {
      targetEl.addEventListener("keydown", handleKeyDown as EventListener);
      return () => {
        targetEl.removeEventListener("keydown", handleKeyDown as EventListener);
      };
    }
  }, [shortcuts, enableInInputs, target, preventDefault]);
}

/**
 * Convenient single hotkey hook
 */
export function useHotkeys(
  keyCombo: string,
  callback: (e: KeyboardEvent) => void,
  options?: KeyboardShortcutsOptions
) {
  useKeyboardShortcuts(
    {
      [keyCombo]: callback,
    },
    options
  );
}

/**
 * Table Row Arrow Keyboard Navigation Hook
 * Enables ArrowUp / ArrowDown navigation through table rows,
 * Enter to open/view, Space to select/checkbox.
 */
export interface TableKeyboardNavigationOptions<T> {
  data: T[];
  onSelectRow?: (item: T, index: number) => void;
  onActivateRow?: (item: T, index: number) => void;
  selectedIndex?: number;
}

export function useTableKeyboardNavigation<T>({
  data,
  onSelectRow,
  onActivateRow,
  selectedIndex = 0,
}: TableKeyboardNavigationOptions<T>) {
  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (data.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(selectedIndex + 1, data.length - 1);
        onSelectRow?.(data[next], next);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = Math.max(selectedIndex - 1, 0);
        onSelectRow?.(data[prev], prev);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (data[selectedIndex]) {
          onActivateRow?.(data[selectedIndex], selectedIndex);
        }
      }
    },
    [data, selectedIndex, onSelectRow, onActivateRow]
  );

  return { handleTableKeyDown };
}
