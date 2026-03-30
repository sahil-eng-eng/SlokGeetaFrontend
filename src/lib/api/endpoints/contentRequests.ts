// lib/api/endpoints/contentRequests.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/api/axios";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import type {
  ApiError,
  ApiResponse,
  ContentRequestResponse,
  CreateContentRequestRequest,
  ReviewContentRequestRequest,
} from "@/types";

// ── API FUNCTIONS ───────────────────────────────────────────

export const contentRequestsApi = {
  create: (data: CreateContentRequestRequest) =>
    axiosInstance
      .post<ApiResponse<ContentRequestResponse>>("/requests", data)
      .then((r) => r.data),

  listIncoming: (status?: string) =>
    axiosInstance
      .get<ApiResponse<ContentRequestResponse[]>>("/requests/incoming", {
        params: status ? { status } : undefined,
      })
      .then((r) => r.data),

  listOutgoing: (status?: string) =>
    axiosInstance
      .get<ApiResponse<ContentRequestResponse[]>>("/requests/outgoing", {
        params: status ? { status } : undefined,
      })
      .then((r) => r.data),

  pendingCount: () =>
    axiosInstance
      .get<ApiResponse<{ count: number }>>("/requests/pending-count")
      .then((r) => r.data),

  review: (id: string, data: ReviewContentRequestRequest) =>
    axiosInstance
      .patch<ApiResponse<ContentRequestResponse>>(`/requests/${id}/review`, data)
      .then((r) => r.data),
};

// ── REACT QUERY HOOKS ───────────────────────────────────────

export function useIncomingContentRequestsQuery(status?: string) {
  return useQuery<ApiResponse<ContentRequestResponse[]>, ApiError>({
    queryKey: [...QUERY_KEYS.CONTENT_REQUESTS_INCOMING, status ?? "all"],
    queryFn: () => contentRequestsApi.listIncoming(status),
  });
}

export function useOutgoingContentRequestsQuery(status?: string) {
  return useQuery<ApiResponse<ContentRequestResponse[]>, ApiError>({
    queryKey: [...QUERY_KEYS.CONTENT_REQUESTS_OUTGOING, status ?? "all"],
    queryFn: () => contentRequestsApi.listOutgoing(status),
  });
}

export function usePendingCountQuery() {
  return useQuery<ApiResponse<{ count: number }>, ApiError>({
    queryKey: QUERY_KEYS.CONTENT_REQUESTS_PENDING_COUNT,
    queryFn: contentRequestsApi.pendingCount,
    refetchInterval: 30_000,
  });
}

export function useCreateContentRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<ContentRequestResponse>, ApiError, CreateContentRequestRequest>({
    mutationFn: contentRequestsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTENT_REQUESTS_OUTGOING });
    },
  });
}

export function useReviewContentRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<ContentRequestResponse>,
    ApiError,
    { id: string; data: ReviewContentRequestRequest }
  >({
    mutationFn: ({ id, data }) => contentRequestsApi.review(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTENT_REQUESTS_INCOMING });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTENT_REQUESTS_PENDING_COUNT });
    },
  });
}
