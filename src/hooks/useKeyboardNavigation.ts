"use client";

import { useState, useEffect, useRef, useCallback, RefObject } from "react";

/**
 * Supported focusable selectors for forms and interactive containers
 */
/**
 * Supported focusable selectors for forms and interactive containers
 * Targets actual editable input fields and ignores internal action buttons
 */
const FOCUSABLE_SELECTORS = [
  "input:not([type='hidden']):not([type='submit']):not([type='button']):not([disabled]):not([readonly]):not([tabindex='-1'])",
  "select:not([disabled]):not([readonly]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([readonly]):not([tabindex='-1'])",
  "[role='combobox']:not([aria-disabled='true']):not([tabindex='-1'])",
  "[role='switch']:not([disabled]):not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
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
    // Filter out invisible, hidden, disabled or tabindex="-1" elements
    return elements.filter((el) => {
      if (
        el.hasAttribute("disabled") ||
        el.getAttribute("aria-hidden") === "true" ||
        el.getAttribute("tabindex") === "-1"
      ) {
        return false;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return false;
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });
  }, [customSelector]);

  // Explicitly focus the first editable input field
  const focusFirst = useCallback(() => {
    const focusable = getFocusableElements();
    const firstInput =
      focusable.find(
        (el) =>
          (el instanceof HTMLInputElement && el.type !== "hidden" && el.type !== "submit" && el.type !== "button") ||
          el instanceof HTMLSelectElement ||
          el instanceof HTMLTextAreaElement ||
          el.getAttribute("role") === "combobox"
      ) || focusable[0];

    if (firstInput) {
      firstInput.focus();
      if (
        firstInput instanceof HTMLInputElement &&
        ["text", "number", "email", "tel"].includes(firstInput.type)
      ) {
        firstInput.select();
      }
    }
  }, [getFocusableElements]);

  // Navigate focus to next or previous field
  const moveFocus = useCallback(
    (direction: "next" | "prev", currentElement: HTMLElement) => {
      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      let currentIndex = focusable.indexOf(currentElement);
      if (currentIndex === -1) {
        // Fallback: match if currentElement is within focusable or vice versa
        currentIndex = focusable.findIndex(
          (el) => el === currentElement || el.contains(currentElement) || currentElement.contains(el)
        );
      }
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
        } else if (targetElement instanceof HTMLTextAreaElement) {
          // If entering textarea going "next", place cursor at start; if going "prev", place cursor at end
          const pos = direction === "next" ? 0 : targetElement.value.length;
          try {
            targetElement.setSelectionRange(pos, pos);
          } catch {
            // Ignore if element doesn't support selection range
          }
        }
      }
    },
    [getFocusableElements, wrapAround]
  );

  // Auto-focus first input on mount
  useEffect(() => {
    if (!autoFocusFirst) return;
    const timer = setTimeout(() => {
      focusFirst();
    }, 60);
    return () => clearTimeout(timer);
  }, [autoFocusFirst, focusFirst]);

  // Main keydown handler for the form
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<T>) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLButtonElement ||
        target.getAttribute("role") === "combobox" ||
        target.getAttribute("role") === "switch" ||
        target.getAttribute("role") === "button";

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

      // 3. Handle Enter Key navigation (Next Field)
      if (enableEnterNavigation && e.key === "Enter" && !e.shiftKey) {
        // Do not intercept Enter on button click or submit button
        if (target instanceof HTMLButtonElement) {
          return;
        }
        // In a textarea, regular Enter creates a new line
        if (target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        moveFocus("next", target);
        return;
      }

      // 4. Handle Shift+Enter (Previous Field)
      if (enableEnterNavigation && e.key === "Enter" && e.shiftKey) {
        if (target instanceof HTMLButtonElement || target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        moveFocus("prev", target);
        return;
      }

      // 5. Handle Arrow Keys (Left/Right & Up/Down field switching)
      if (enableArrowKeys && isInput) {
        // If native select is active and alt is not pressed, native select uses arrows to choose options
        if (target instanceof HTMLSelectElement && !e.altKey) {
          return;
        }

        const isCombobox = target.getAttribute("role") === "combobox";
        const isComboboxOpen =
          isCombobox &&
          (target.getAttribute("aria-expanded") === "true" ||
            Boolean(target.closest("[data-select-open='true']")));

        // If target is inside an open combobox, let the combobox handle navigation
        if (isComboboxOpen) {
          return;
        }

        const isTextInput =
          target instanceof HTMLInputElement &&
          ["text", "email", "tel", "password", "search", "url", "number"].includes(target.type);

        const isTextArea = target instanceof HTMLTextAreaElement;

        // A. ArrowRight: Navigate to Next Field
        if (e.key === "ArrowRight") {
          let canNavigateNext = true;
          if (isTextInput) {
            const hasSelection =
              target.selectionStart !== null &&
              target.selectionEnd !== null &&
              target.selectionStart !== target.selectionEnd;
            const isAtEnd = target.selectionEnd === target.value.length;
            canNavigateNext = hasSelection || isAtEnd || target.value.length === 0;
          } else if (isTextArea) {
            const hasSelection =
              target.selectionStart !== null &&
              target.selectionEnd !== null &&
              target.selectionStart !== target.selectionEnd;
            const isAtEnd = target.selectionEnd === target.value.length;
            // Alt+ArrowRight or cursor at end of textarea exits to next field
            canNavigateNext = e.altKey || hasSelection || isAtEnd || target.value.length === 0;
          }
          if (canNavigateNext) {
            e.preventDefault();
            moveFocus("next", target);
            return;
          }
        }

        // B. ArrowLeft: Navigate to Previous Field
        if (e.key === "ArrowLeft") {
          let canNavigatePrev = true;
          if (isTextInput) {
            const hasSelection =
              target.selectionStart !== null &&
              target.selectionEnd !== null &&
              target.selectionStart !== target.selectionEnd;
            const isAtStart = target.selectionStart === 0;
            canNavigatePrev = hasSelection || isAtStart || target.value.length === 0;
          } else if (isTextArea) {
            const hasSelection =
              target.selectionStart !== null &&
              target.selectionEnd !== null &&
              target.selectionStart !== target.selectionEnd;
            const isAtStart = target.selectionStart === 0;
            // Alt+ArrowLeft or cursor at beginning of textarea exits to previous field
            canNavigatePrev = e.altKey || hasSelection || isAtStart || target.value.length === 0;
          }
          if (canNavigatePrev) {
            e.preventDefault();
            moveFocus("prev", target);
            return;
          }
        }

        // C. ArrowDown: If combobox, let combobox open & select. Otherwise move to next field
        if (e.key === "ArrowDown") {
          if (isCombobox) {
            return; // Let SelectInput open and navigate options
          }
          if (isTextArea) {
            const isAtEnd = target.selectionEnd === target.value.length;
            const canNavigateNext = e.altKey || isAtEnd || target.value.length === 0;
            if (canNavigateNext) {
              e.preventDefault();
              moveFocus("next", target);
              return;
            }
            return; // Allow natural multi-line down cursor inside textarea
          }
          e.preventDefault();
          moveFocus("next", target);
          return;
        }

        // D. ArrowUp: If combobox, let combobox handle. Otherwise move to previous field
        if (e.key === "ArrowUp") {
          if (isCombobox) {
            return; // Let SelectInput handle
          }
          if (isTextArea) {
            const isAtStart = target.selectionStart === 0;
            const canNavigatePrev = e.altKey || isAtStart || target.value.length === 0;
            if (canNavigatePrev) {
              e.preventDefault();
              moveFocus("prev", target);
              return;
            }
            return; // Allow natural multi-line up cursor inside textarea
          }
          e.preventDefault();
          moveFocus("prev", target);
          return;
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
    focusFirst,
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

  // Use refs so the listener is registered once, avoiding repeated remove/add on state changes
  const shortcutsRef = useRef<ShortcutsMap>(shortcuts);
  shortcutsRef.current = shortcuts;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentShortcuts = shortcutsRef.current;
      const currentOptions = optionsRef.current;
      const enableInputs = currentOptions.enableInInputs ?? false;
      const shouldPreventDefault = currentOptions.preventDefault ?? true;

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
      for (const [shortcutPattern, handler] of Object.entries(currentShortcuts)) {
        const patterns = shortcutPattern
          .toLowerCase()
          .split(",")
          .map((p) => p.trim());

        const isMatch = patterns.some((p) => {
          // Exact combo match (e.g. "ctrl+s", "shift+?")
          if (p === currentCombo) return true;
          // Single key match (e.g. "escape", "f1", "f2", "f4", "f6")
          if (p === keyName && pressedKeys.length === 1) return true;
          return false;
        });

        if (isMatch) {
          const isFKey = /^f\d+$/i.test(keyName);
          const isEscape = keyName === "escape";
          const hasModifier = e.ctrlKey || e.metaKey || e.altKey;

          // If typing in input, only fire if modifier pressed, F-key, Escape, or enableInInputs is true
          if (isInput && !enableInputs && !hasModifier && !isFKey && !isEscape) {
            continue;
          }

          if (shouldPreventDefault) {
            e.preventDefault();
            e.stopPropagation();
          }
          handler(e);
          break;
        }
      }
    };

    const targetEl =
      target && "current" in target ? target.current : target || window;

    if (targetEl) {
      // Use capture phase to intercept native browser shortcuts (like Ctrl+S Save As) before browser dialogs appear
      targetEl.addEventListener("keydown", handleKeyDown as EventListener, { capture: true });
      return () => {
        targetEl.removeEventListener("keydown", handleKeyDown as EventListener, { capture: true });
      };
    }
  }, [target]);
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
 * Enterprise Table Row Keyboard Navigation & Shortcuts Hook
 * - ArrowUp / ArrowDown: Move row selection with visual highlight
 * - Enter: View details modal
 * - Ctrl+E / Cmd+E / 'e': Edit row
 * - Delete / Ctrl+D / 'd': Delete confirmation dialog
 * - Home / End: First / Last row
 */
export interface TableKeyboardNavigationOptions<T> {
  data: T[];
  selectedIndex?: number;
  onSelectRow?: (item: T, index: number) => void;
  onView?: (item: T, index: number) => void;
  onEdit?: (item: T, index: number) => void;
  onDelete?: (item: T, index: number) => void;
  onAdd?: () => void;
  enableGlobalListener?: boolean;
}

export function useTableKeyboardNavigation<T>({
  data,
  selectedIndex: controlledIndex,
  onSelectRow,
  onView,
  onEdit,
  onDelete,
  onAdd,
  enableGlobalListener = true,
}: TableKeyboardNavigationOptions<T>) {
  const [internalIndex, setInternalIndex] = useState<number>(0);
  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;

  // Keep index within bounds if data changes
  useEffect(() => {
    if (data.length === 0) {
      setInternalIndex(0);
    } else if (activeIndex >= data.length) {
      const nextIdx = Math.max(0, data.length - 1);
      setInternalIndex(nextIdx);
      if (onSelectRow && data[nextIdx]) {
        onSelectRow(data[nextIdx], nextIdx);
      }
    }
  }, [data, activeIndex, onSelectRow]);

  const selectIndex = useCallback(
    (index: number) => {
      if (data.length === 0) return;
      const clamped = Math.max(0, Math.min(index, data.length - 1));
      setInternalIndex(clamped);
      if (onSelectRow && data[clamped]) {
        onSelectRow(data[clamped], clamped);
      }
    },
    [data, onSelectRow]
  );

  const handleTableKeyDown = useCallback(
    (e: KeyboardEvent | React.KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.getAttribute("contenteditable") === "true";

      // 0. Quick Add / Create New Record: Insert or Alt+N (available everywhere including search)
      if (
        e.key === "Insert" ||
        (e.altKey && e.key.toLowerCase() === "n") ||
        (!isTyping && (e.key === "+" || e.key.toLowerCase() === "a"))
      ) {
        if (onAdd) {
          e.preventDefault();
          onAdd();
          return;
        }
      }

      // If in search input: ArrowDown seamlessly moves focus into the table rows
      if (isTyping && target instanceof HTMLInputElement && e.key === "ArrowDown" && !e.ctrlKey && !e.altKey) {
        if (data.length > 0) {
          e.preventDefault();
          target.blur();
          selectIndex(0);
          return;
        }
      }

      // If in search input: Escape blurs input to activate table navigation shortcuts
      if (isTyping && target instanceof HTMLInputElement && e.key === "Escape") {
        e.preventDefault();
        target.blur();
        return;
      }

      // If typing in search or other inputs, allow natural text entry
      if (isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
        return;
      }

      if (data.length === 0) return;

      const currentItem = data[activeIndex];

      // 1. Arrow Down -> Next Row
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectIndex(activeIndex + 1);
        return;
      }

      // 2. Arrow Up -> Previous Row
      if (e.key === "ArrowUp") {
        e.preventDefault();
        selectIndex(activeIndex - 1);
        return;
      }

      // 3. Home -> First Row
      if (e.key === "Home") {
        e.preventDefault();
        selectIndex(0);
        return;
      }

      // 4. End -> Last Row
      if (e.key === "End") {
        e.preventDefault();
        selectIndex(data.length - 1);
        return;
      }

      // 5. Enter -> View Row Details
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
        if (currentItem && onView) {
          e.preventDefault();
          onView(currentItem, activeIndex);
        }
        return;
      }

      // 6. Ctrl+E or Cmd+E or 'e' (when not in input) -> Edit Row
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") || (!isTyping && e.key.toLowerCase() === "e")) {
        if (currentItem && onEdit) {
          e.preventDefault();
          onEdit(currentItem, activeIndex);
        }
        return;
      }

      // 7. Delete or Ctrl+Delete or 'd' (when not in input) -> Delete Row
      if (
        e.key === "Delete" ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") ||
        (!isTyping && e.key.toLowerCase() === "d")
      ) {
        if (currentItem && onDelete) {
          e.preventDefault();
          onDelete(currentItem, activeIndex);
        }
        return;
      }
    },
    [data, activeIndex, selectIndex, onView, onEdit, onDelete, onAdd]
  );

  // Global window listener for effortless table navigation when not typing in inputs
  useEffect(() => {
    if (!enableGlobalListener) return;

    const onWindowKeyDown = (e: KeyboardEvent) => {
      // Pause shortcut if any modal dialog is currently open
      const modalOpen = document.querySelector('[role="dialog"]');
      if (modalOpen) return;

      handleTableKeyDown(e);
    };

    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
  }, [enableGlobalListener, handleTableKeyDown]);

  return {
    selectedIndex: activeIndex,
    selectIndex,
    handleTableKeyDown,
  };
}
