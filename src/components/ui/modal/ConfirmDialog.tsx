"use client";

import React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Modal, ModalFooter } from "./Modal";
import { Button } from "../button/Button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "destructive" | "warning";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {message}
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  itemName?: string;
  title?: string;
  message?: string;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onDelete,
  itemName = "item",
  title = "Delete Confirmation",
  message,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {message || (
                <>
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    &ldquo;{itemName}&rdquo;
                  </strong>
                  ? This action cannot be undone.
                </>
              )}
            </p>
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            loading={isLoading}
          >
            Delete Permanently
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
