"use client";

import { useEffect, useRef, useCallback } from "react";

export interface UseFormKeyboardNavigationOptions {
  /**
   * Ref to the form element. If not provided, a ref will be created internally and returned.
   */
  formRef?: React.RefObject<HTMLFormElement | null>;
  /**
   * Ref to the first input field to auto-focus. If not provided, an internal ref will be created.
   */
  firstInputRef?: React.RefObject<HTMLInputElement | null>;
  /**
   * Callback to trigger when the save shortcut key (default F2) is pressed anywhere.
   */
  onSave?: () => void;
  /**
   * Key code for triggering save. Default is "F2".
   */
  saveKey?: string;
  /**
   * Whether pressing Enter moves to the next field. Default is true.
   */
  enableEnterNav?: boolean;
  /**
   * Whether ArrowDown and ArrowUp move between fields. Default is true.
   */
  enableArrowNav?: boolean;
  /**
   * Whether to automatically focus the first field on mount. Default is true.
   */
  autoFocusFirstField?: boolean;
  /**
   * Whether pressing Enter on a password input submits the form directly. Default is true.
   */
  submitOnPasswordEnter?: boolean;
}

/**
 * Helper to query all visible, enabled interactive elements in document order
 */
export function getFocusableFormElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'input:not([type="hidden"]):not([type="file"]):not([disabled]):not([readonly])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[role="button"][tabindex="0"]:not([disabled])',
    '[role="region"][tabindex="0"]:not([disabled])',
    'button[type="submit"]:not([disabled])',
  ].join(", ");

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((el) => {
    if (el.hasAttribute("disabled")) return false;
    // Ensure element is visible on the DOM layout or is an accessible screen-reader styled checkbox/radio
    if (el.classList.contains("sr-only")) return true;
    return el.offsetParent !== null;
  });
}

/**
 * Programmatically moves focus to next or previous field in container
 */
export function navigateFormField(
  container: HTMLElement,
  currentElement: HTMLElement,
  direction: "next" | "prev"
): boolean {
  const elements = getFocusableFormElements(container);
  let currentIndex = elements.indexOf(currentElement);
  if (currentIndex === -1) {
    const parent = currentElement.closest<HTMLElement>(
      'input, select, textarea, [role="button"][tabindex="0"], [role="region"][tabindex="0"], button[type="submit"]'
    );
    if (parent) {
      currentIndex = elements.indexOf(parent);
    }
  }
  if (currentIndex === -1) return false;

  const targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
  if (targetIndex >= 0 && targetIndex < elements.length) {
    const targetEl = elements[targetIndex];
    targetEl.focus();
    if (
      targetEl instanceof HTMLInputElement &&
      targetEl.type !== "button" &&
      targetEl.type !== "submit" &&
      targetEl.type !== "checkbox" &&
      targetEl.type !== "radio"
    ) {
      targetEl.select();
    }
    return true;
  }

  return false;
}

/**
 * Reusable Hook: Provides seamless keyboard-only navigation (Enter / Arrow keys)
 * and global shortcut (F2) save for enterprise forms.
 */
export function useFormKeyboardNavigation(options: UseFormKeyboardNavigationOptions = {}) {
  const {
    formRef: externalFormRef,
    firstInputRef: externalFirstInputRef,
    onSave,
    saveKey = "F2",
    enableEnterNav = true,
    enableArrowNav = true,
    autoFocusFirstField = true,
    submitOnPasswordEnter = true,
  } = options;

  const internalFormRef = useRef<HTMLFormElement | null>(null);
  const internalFirstInputRef = useRef<HTMLInputElement | null>(null);

  const formRef = externalFormRef || internalFormRef;
  const firstInputRef = externalFirstInputRef || internalFirstInputRef;

  // Stash latest onSave callback to avoid stale closures in event listeners
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  // 1. Auto-focus the first field on component mount
  useEffect(() => {
    if (!autoFocusFirstField) return;

    const doFocus = () => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
        firstInputRef.current.select?.();
        return true;
      } else if (formRef.current) {
        const elements = getFocusableFormElements(formRef.current);
        if (elements.length > 0) {
          elements[0].focus();
          if (elements[0] instanceof HTMLInputElement) {
            elements[0].select?.();
          }
          return true;
        }
      }
      return false;
    };

    // Immediate attempt
    doFocus();

    // Secondary attempt to guarantee focus after layout paints
    const timer = setTimeout(doFocus, 60);
    return () => clearTimeout(timer);
  }, [autoFocusFirstField, firstInputRef, formRef]);

  // 2. Global shortcut listener (e.g. F2 to Save & Launch)
  useEffect(() => {
    if (!onSave) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === saveKey) {
        e.preventDefault();
        onSaveRef.current?.();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [saveKey, onSave]);

  // 3. Form onKeyDown Handler for Enter / Arrow navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLFormElement>) => {
      // Check for save key inside the form
      if (e.key === saveKey && onSaveRef.current) {
        e.preventDefault();
        onSaveRef.current();
        return;
      }

      // If an inner dropdown or popup already consumed the event, ignore
      if (e.defaultPrevented) return;

      const target = e.target as HTMLElement;
      if (!target || !formRef.current) return;

      // Allow multiline typing in textarea
      if (target.tagName.toLowerCase() === "textarea") return;

      const isEnter = enableEnterNav && e.key === "Enter";
      const isArrowDown = enableArrowNav && e.key === "ArrowDown";
      const isArrowUp = enableArrowNav && e.key === "ArrowUp";
      const isArrowRight = enableArrowNav && e.key === "ArrowRight";
      const isArrowLeft = enableArrowNav && e.key === "ArrowLeft";

      if (!isEnter && !isArrowDown && !isArrowUp && !isArrowRight && !isArrowLeft) return;

      // If pressing Enter on a submit button, allow default form submission
      if (isEnter && target.getAttribute("type") === "submit") return;

      // If pressing Enter on a password input, allow normal form submission
      if (
        isEnter &&
        submitOnPasswordEnter &&
        target instanceof HTMLInputElement &&
        target.type === "password"
      ) {
        return;
      }

      // If pressing Enter on an upload box, let its onKeyDown trigger the file picker
      const isUploadBox = Boolean(
        target.getAttribute("role") === "button" ||
        target.getAttribute("role") === "region" ||
        target.closest('[role="button"], [role="region"]')
      );
      if (isEnter && isUploadBox) return;

      // If a dropdown or combobox popup is currently open, allow arrow keys to navigate options inside it
      const hasOpenListbox = Boolean(
        document.querySelector('[role="listbox"], [data-state="open"], .combobox-dropdown')
      );
      if (hasOpenListbox && (isArrowDown || isArrowUp)) return;

      // Check whether ArrowLeft / ArrowRight should navigate between fields
      if (isArrowRight || isArrowLeft) {
        if (target instanceof HTMLInputElement && target.type !== "button" && target.type !== "submit") {
          const val = target.value || "";
          const selStart = target.selectionStart ?? 0;
          const selEnd = target.selectionEnd ?? 0;
          const isAllSelected = selStart === 0 && selEnd === val.length;
          const isDropdownInput = Boolean(target.closest('[data-combobox], [role="combobox"], .cursor-pointer'));

          if (isArrowRight) {
            // Navigate right if cursor is at the end, text is all selected, input is empty, or it's a dropdown input
            const canNavRight = isDropdownInput || isAllSelected || selStart === val.length || val.length === 0;
            if (!canNavRight) return;
          } else if (isArrowLeft) {
            // Navigate left if cursor is at the start, text is all selected, input is empty, or it's a dropdown input
            const canNavLeft = isDropdownInput || isAllSelected || (selStart === 0 && selEnd === 0) || val.length === 0;
            if (!canNavLeft) return;
          }
        }
      }

      if (isEnter || isArrowDown || isArrowRight) {
        e.preventDefault();
        navigateFormField(formRef.current, target, "next");
      } else if (isArrowUp || isArrowLeft) {
        e.preventDefault();
        navigateFormField(formRef.current, target, "prev");
      }
    },
    [saveKey, enableEnterNav, enableArrowNav, submitOnPasswordEnter, formRef]
  );

  return {
    formRef,
    firstInputRef,
    handleKeyDown,
    focusFirstField: () => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
        firstInputRef.current.select();
      }
    },
    focusNextField: (currentEl: HTMLElement) => {
      if (formRef.current) {
        navigateFormField(formRef.current, currentEl, "next");
      }
    },
    focusPrevField: (currentEl: HTMLElement) => {
      if (formRef.current) {
        navigateFormField(formRef.current, currentEl, "prev");
      }
    },
  };
}
