// lib/api/endpoints/discover.ts

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/api/axios";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import type { ApiError, ApiResponse, DiscoverBook, DiscoverShlok, DiscoverListResponse } from "@/types";

// ── API FUNCTIONS ───────────────────────────────────────────

export const discoverApi = {
  getBooks: (page = 1, pageSize = 20) =>
    axiosInstance
      .get<ApiResponse<DiscoverListResponse<DiscoverBook>>>("/discover/books", {
        params: { page, page_size: pageSize },
      })
      .then((r) => r.data),

  getShloks: (page = 1, pageSize = 20) =>
    axiosInstance
      .get<ApiResponse<DiscoverListResponse<DiscoverShlok>>>("/discover/shloks", {
        params: { page, page_size: pageSize },
      })
      .then((r) => r.data),
};

// ── REACT QUERY HOOKS ───────────────────────────────────────

export function useDiscoverBooksQuery(page = 1) {
  return useQuery<ApiResponse<DiscoverListResponse<DiscoverBook>>, ApiError>({
    queryKey: QUERY_KEYS.DISCOVER_BOOKS(page),
    queryFn: () => discoverApi.getBooks(page),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDiscoverShloksQuery(page = 1) {
  return useQuery<ApiResponse<DiscoverListResponse<DiscoverShlok>>, ApiError>({
    queryKey: QUERY_KEYS.DISCOVER_SHLOKS(page),
    queryFn: () => discoverApi.getShloks(page),
    staleTime: 1000 * 60 * 5,
  });
}
