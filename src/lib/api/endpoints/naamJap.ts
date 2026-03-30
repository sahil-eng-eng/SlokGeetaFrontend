// lib/api/endpoints/naamJap.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/api/axios";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import type {
  ApiError,
  ApiResponse,
  NaamTargetResponse,
  SetNaamTargetRequest,
  JapEntryResponse,
  CreateJapEntryRequest,
  DayLogResponse,
} from "@/types";

// ── API FUNCTIONS ───────────────────────────────────────────

export const naamJapApi = {
  getTarget: () =>
    axiosInstance
      .get<ApiResponse<NaamTargetResponse | null>>("/naam-jap/target")
      .then((r) => r.data),

  setTarget: (data: SetNaamTargetRequest) =>
    axiosInstance
      .post<ApiResponse<NaamTargetResponse>>("/naam-jap/target", data)
      .then((r) => r.data),

  getTodayEntries: () =>
    axiosInstance
      .get<ApiResponse<JapEntryResponse[]>>("/naam-jap/today")
      .then((r) => r.data),

  addEntry: (data: CreateJapEntryRequest) =>
    axiosInstance
      .post<ApiResponse<JapEntryResponse>>("/naam-jap/entries", data)
      .then((r) => r.data),

  deleteEntry: (entryId: string) =>
    axiosInstance.delete(`/naam-jap/entries/${entryId}`).then((r) => r.data),

  getHistory: (params?: { limit?: number; fromDate?: string; toDate?: string }) =>
    axiosInstance
      .get<ApiResponse<DayLogResponse[]>>("/naam-jap/history", {
        params: {
          limit: params?.limit ?? 7,
          from_date: params?.fromDate,
          to_date: params?.toDate,
        },
      })
      .then((r) => r.data),
};

// ── REACT QUERY HOOKS ───────────────────────────────────────

export function useNaamTargetQuery() {
  return useQuery<ApiResponse<NaamTargetResponse | null>, ApiError>({
    queryKey: QUERY_KEYS.NAAM_JAP_TARGET,
    queryFn: naamJapApi.getTarget,
  });
}

export function useSetNaamTargetMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<NaamTargetResponse>, ApiError, SetNaamTargetRequest>({
    mutationFn: naamJapApi.setTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NAAM_JAP_TARGET });
    },
  });
}

export function useTodayEntriesQuery() {
  return useQuery<ApiResponse<JapEntryResponse[]>, ApiError>({
    queryKey: QUERY_KEYS.NAAM_JAP_TODAY,
    queryFn: naamJapApi.getTodayEntries,
  });
}

export function useAddJapEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<JapEntryResponse>, ApiError, CreateJapEntryRequest>({
    mutationFn: naamJapApi.addEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NAAM_JAP_TODAY });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NAAM_JAP_HISTORY });
    },
  });
}

export function useDeleteJapEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: naamJapApi.deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NAAM_JAP_TODAY });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NAAM_JAP_HISTORY });
    },
  });
}

export function useNaamJapHistoryQuery(params?: { limit?: number; fromDate?: string; toDate?: string }) {
  return useQuery<ApiResponse<DayLogResponse[]>, ApiError>({
    queryKey: [...QUERY_KEYS.NAAM_JAP_HISTORY, params],
    queryFn: () => naamJapApi.getHistory(params),
  });
}
