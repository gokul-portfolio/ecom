"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocketEvent } from "@/hooks/useSocket";
import { useToast } from "@/components/ui/feedback/Toast";

interface UseServerTableOptions {
  endpoint: string;
  defaultSortBy?: string;
  defaultSortOrder?: "asc" | "desc";
  defaultPageSize?: number;
  socketEventName?: string;
  autoFetch?: boolean;
}

export interface ServerPaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function useServerTable<T>({
  endpoint,
  defaultSortBy = "createdAt",
  defaultSortOrder = "desc",
  defaultPageSize = 10,
  socketEventName,
  autoFetch = true,
}: UseServerTableOptions) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Search & Sorting State
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);

  const toast = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // 300ms Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  // Main Data Fetcher
  const fetchData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }

      const res = await fetch(`${endpoint}?${params.toString()}`, {
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();

      if (json.success) {
        setData(json.data || []);
        if (json.pagination) {
          setTotalItems(json.pagination.totalItems ?? 0);
          setTotalPages(json.pagination.totalPages ?? 1);
        }
      } else {
        setError(json.error || "Failed to load records");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "Failed to load data");
      }
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, page, pageSize, debouncedSearch, sortBy, sortOrder]);

  // Trigger fetch on query param changes
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  // Real-time Socket.io Live Sync
  if (socketEventName) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSocketEvent(socketEventName, () => {
      fetchData();
      toast.info("Live Update", "Records updated in real time via WebSocket.");
    });
  }

  // Toggle sorting column
  const toggleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnKey);
      setSortOrder("asc");
    }
    setPage(1);
  };

  return {
    data,
    isLoading,
    isSubmitting,
    setIsSubmitting,
    error,
    // Pagination
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
    // Search & Sort
    search,
    setSearch,
    sortBy,
    sortOrder,
    toggleSort,
    // Refetch
    refetch: fetchData,
  };
}
