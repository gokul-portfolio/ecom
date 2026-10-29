"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocketEvent } from "@/hooks/useSocket";
import { useToast } from "@/components/ui/feedback/Toast";

interface UseServerTableOptions<T> {
  endpoint: string;
  defaultSortBy?: string;
  defaultSortOrder?: "asc" | "desc";
  defaultPageSize?: number;
  socketEventName?: string;
  autoFetch?: boolean;
  extraParams?: Record<string, string | number | boolean | undefined>;
  initialData?: T[];
  initialPagination?: {
    totalItems: number;
    totalPages: number;
    currentPage?: number;
    pageSize?: number;
  };
}

export interface ServerPaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Global In-Memory SWR Cache for 0ms page-flip and re-visit transitions
const swrCache = new Map<
  string,
  {
    data: unknown[];
    pagination?: { totalItems: number; totalPages: number };
    timestamp: number;
  }
>();

export function invalidateServerTableCache(endpointPrefix?: string) {
  if (!endpointPrefix) {
    swrCache.clear();
    return;
  }
  for (const key of swrCache.keys()) {
    if (key.startsWith(endpointPrefix)) {
      swrCache.delete(key);
    }
  }
}

export function useServerTable<T>({
  endpoint,
  defaultSortBy = "createdAt",
  defaultSortOrder = "desc",
  defaultPageSize = 10,
  socketEventName,
  autoFetch = true,
  extraParams,
  initialData,
  initialPagination,
}: UseServerTableOptions<T>) {
  const extraParamsKey = JSON.stringify(extraParams || {});
  // If SSR initialData is supplied, seed the initial state and cache immediately (0ms loading)
  const initialCacheKey = `${endpoint}?page=1&limit=${defaultPageSize}&sortBy=${defaultSortBy}&sortOrder=${defaultSortOrder}`;

  const [data, setData] = useState<T[]>(() => {
    if (initialData && initialData.length > 0) {
      swrCache.set(initialCacheKey, {
        data: initialData,
        pagination: initialPagination,
        timestamp: Date.now(),
      });
      return initialData;
    }
    const cached = swrCache.get(initialCacheKey);
    return (cached?.data as T[]) || [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (initialData && initialData.length > 0) return false;
    const cached = swrCache.get(initialCacheKey);
    return !cached;
  });

  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState<number>(initialPagination?.currentPage ?? 1);
  const [pageSize, setPageSize] = useState<number>(initialPagination?.pageSize ?? defaultPageSize);
  const [totalItems, setTotalItems] = useState<number>(() => {
    if (initialPagination?.totalItems !== undefined) return initialPagination.totalItems;
    const cached = swrCache.get(initialCacheKey);
    return cached?.pagination?.totalItems ?? 0;
  });
  const [totalPages, setTotalPages] = useState<number>(() => {
    if (initialPagination?.totalPages !== undefined) return initialPagination.totalPages;
    const cached = swrCache.get(initialCacheKey);
    return cached?.pagination?.totalPages ?? 1;
  });

  // Search & Sorting State
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);

  const toast = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialMount = useRef<boolean>(true);

  // 300ms Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  // Main Data Fetcher with Stale-While-Revalidate (SWR) logic
  const fetchData = useCallback(
    async (forceFresh = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }

      if (extraParams) {
        Object.entries(extraParams).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") {
            params.set(k, String(v));
          }
        });
      }

      const cacheKey = `${endpoint}?${params.toString()}`;
      const cached = swrCache.get(cacheKey);

      // SWR Step 1: If cached data exists and not forced fresh, serve cached data instantly (0ms latency)
      if (cached && !forceFresh) {
        setData(cached.data as T[]);
        if (cached.pagination) {
          setTotalItems(cached.pagination.totalItems);
          setTotalPages(cached.pagination.totalPages);
        }
        setIsLoading(false);
        setIsFetching(true); // background revalidation indicator
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const res = await fetch(`${endpoint}?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const json = await res.json();

        if (json.success) {
          const freshData = json.data || [];
          const freshPagination = json.pagination
            ? {
                totalItems: json.pagination.totalItems ?? 0,
                totalPages: json.pagination.totalPages ?? 1,
              }
            : undefined;

          // Update SWR cache
          swrCache.set(cacheKey, {
            data: freshData,
            pagination: freshPagination,
            timestamp: Date.now(),
          });

          setData(freshData);
          if (freshPagination) {
            setTotalItems(freshPagination.totalItems);
            setTotalPages(freshPagination.totalPages);
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
        setIsFetching(false);
      }
    },
    [endpoint, page, pageSize, debouncedSearch, sortBy, sortOrder, extraParamsKey]
  );

  // Trigger fetch on query param changes, skipping initial fetch if initialData was provided
  useEffect(() => {
    if (!autoFetch) return;

    if (isInitialMount.current && initialData && initialData.length > 0) {
      isInitialMount.current = false;
      return;
    }

    isInitialMount.current = false;
    fetchData();
  }, [fetchData, autoFetch, initialData]);

  // Real-time Socket.io Live Sync with automatic cache invalidation
  if (socketEventName) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSocketEvent(socketEventName, () => {
      invalidateServerTableCache(endpoint);
      fetchData(true);
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
    isFetching,
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
    // Refetch (forces fresh cache invalidation)
    refetch: () => {
      invalidateServerTableCache(endpoint);
      return fetchData(true);
    },
  };
}
