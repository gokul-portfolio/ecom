"use client";

import React from "react";
import { MoreHorizontal, Eye, Edit2, Trash2, Copy } from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
} from "./Dropdown";

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface ActionMenuProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  customActions?: ActionMenuItem[];
  className?: string;
}

export function ActionMenu({
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  customActions,
  className,
}: ActionMenuProps) {
  return (
    <Dropdown className={className}>
      <DropdownTrigger>
        <button
          type="button"
          aria-label="Actions menu"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownTrigger>
      <DropdownMenu align="right" width="w-44">
        {onView && (
          <DropdownItem icon={<Eye className="w-3.5 h-3.5 text-slate-400" />} onClick={onView}>
            View Details
          </DropdownItem>
        )}
        {onEdit && (
          <DropdownItem icon={<Edit2 className="w-3.5 h-3.5 text-indigo-500" />} onClick={onEdit}>
            Edit
          </DropdownItem>
        )}
        {onDuplicate && (
          <DropdownItem icon={<Copy className="w-3.5 h-3.5 text-slate-400" />} onClick={onDuplicate}>
            Duplicate
          </DropdownItem>
        )}
        {customActions &&
          customActions.map((action, i) => (
            <DropdownItem
              key={i}
              icon={action.icon}
              onClick={action.onClick}
              destructive={action.destructive}
              disabled={action.disabled}
            >
              {action.label}
            </DropdownItem>
          ))}
        {onDelete && (
          <>
            {(onView || onEdit || onDuplicate || (customActions && customActions.length > 0)) && (
              <DropdownDivider />
            )}
            <DropdownItem
              destructive
              icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              onClick={onDelete}
            >
              Delete
            </DropdownItem>
          </>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
