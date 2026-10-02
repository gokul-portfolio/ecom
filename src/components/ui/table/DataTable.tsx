"use client";

import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../button/Button";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "../dropdown/Dropdown";
import { Pagination } from "./Pagination";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  error?: string;
  onRowClick?: (row: TData) => void;
  bulkActions?: (selectedRows: TData[]) => React.ReactNode;
  exportFileName?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search records...",
  isLoading = false,
  error,
  onRowClick,
  bulkActions,
  exportFileName = "table-export",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((r) => r.original);

  const exportToCSV = () => {
    if (!data.length) return;
    const headers = table
      .getAllLeafColumns()
      .filter((col) => col.getIsVisible() && col.id !== "select" && col.id !== "actions")
      .map((col) => col.id);

    const rows = table.getFilteredRowModel().rows.map((row) => {
      return headers
        .map((h) => {
          const val = (row.original as Record<string, unknown>)[h];
          return `"${String(val ?? "").replace(/"/g, '""')}"`;
        })
        .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${exportFileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-3">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Column Visibility Dropdown */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              >
                Columns
              </Button>
            </DropdownTrigger>
            <DropdownMenu align="right" width="w-48">
              <div className="p-2 space-y-1">
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  Toggle Columns
                </span>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer capitalize"
                    >
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={(e) => column.toggleVisibility(!!e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{column.id}</span>
                    </label>
                  ))}
              </div>
            </DropdownMenu>
          </Dropdown>

          {/* Export to CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedRows.length > 0 && (
        <div className="flex items-center justify-between p-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 animate-in fade-in">
          <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            {selectedRows.length} of {table.getFilteredRowModel().rows.length} row(s) selected
          </div>
          <div className="flex items-center gap-2">
            {bulkActions?.(selectedRows)}
            <Button
              size="xs"
              variant="ghost"
              onClick={() => table.toggleAllRowsSelected(false)}
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40"
                >
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const isSorted = header.column.getIsSorted();

                    return (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none whitespace-nowrap"
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <div
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {isSorted === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />
                            ) : isSorted === "desc" ? (
                              <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    {columns.map((_, cIdx) => (
                      <td key={cIdx} className="px-4 py-3.5">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-rose-500">
                      <AlertCircle className="w-7 h-7" />
                      <p className="text-xs font-semibold">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                      <Inbox className="w-8 h-8 stroke-[1.5]" />
                      <p className="text-xs font-medium">No records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      "transition-colors",
                      row.getIsSelected()
                        ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                        : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Polished, Accessible Table Pagination */}
        <Pagination
          currentPage={table.getState().pagination.pageIndex + 1}
          totalPages={table.getPageCount() || 1}
          totalItems={table.getFilteredRowModel().rows.length}
          pageSize={table.getState().pagination.pageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          onPageChange={(page) => table.setPageIndex(page - 1)}
          onPageSizeChange={(size) => table.setPageSize(size)}
          variant="numbered"
          showPageSize={true}
          showTotal={true}
        />
      </div>
    </div>
  );
}
