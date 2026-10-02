"use client";

import React from "react";
import { Modal } from "./Modal";
import { Button } from "../button/Button";

export interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  userEmail?: string;
  userName?: string;
}

export function LogoutConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: LogoutConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnBackdropClick={!isLoading}
    >
      <div className="text-center py-2 space-y-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Confirm Logout
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
          Are you sure you want to sign out of your account?
        </p>

        <div className="pt-4 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            loading={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? "Signing Out..." : "Confirm"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
