import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/api/axios";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import type {
  ApiError,
  ApiResponse,
  CreateMeaningRequest,
  UpdateMeaningRequest,
  VoteMeaningRequest,
  MeaningResponse,
  MeaningListResponse,
} from "@/types";

// ── API FUNCTIONS ───────────────────────────────────────────

export const meaningsApi = {
  createMeaning: ({
    shlokId,
    data,
  }: {
    shlokId: string;
    data: CreateMeaningRequest;
  }) =>
    axiosInstance
      .post<ApiResponse<MeaningResponse>>(`/shloks/${shlokId}/meanings`, data)
      .then((r) => r.data),

  getMeanings: (shlokId: string) =>
    axiosInstance
      .get<ApiResponse<MeaningListResponse>>(`/shloks/${shlokId}/meanings`)
      .then((r) => r.data),

  updateMeaning: ({
    meaningId,
    data,
  }: {
    meaningId: string;
    data: UpdateMeaningRequest;
  }) =>
    axiosInstance
      .patch<ApiResponse<MeaningResponse>>(`/meanings/${meaningId}`, data)
      .then((r) => r.data),

  deleteMeaning: (meaningId: string) =>
    axiosInstance
      .delete<ApiResponse<null>>(`/meanings/${meaningId}`)
      .then((r) => r.data),

  voteMeaning: ({
    meaningId,
    data,
  }: {
    meaningId: string;
    data: VoteMeaningRequest;
  }) =>
    axiosInstance
      .post<ApiResponse<MeaningResponse>>(`/meanings/${meaningId}/vote`, data)
      .then((r) => r.data),
};

// ── REACT QUERY HOOKS ───────────────────────────────────────

export function useMeaningsQuery(shlokId: string) {
  return useQuery<ApiResponse<MeaningListResponse>, ApiError>({
    queryKey: QUERY_KEYS.MEANINGS_BY_SHLOK(shlokId),
    queryFn: () => meaningsApi.getMeanings(shlokId),
    enabled: !!shlokId,
    staleTime: 30_000,
  });
}

export function useCreateMeaningMutation(shlokId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<MeaningResponse>,
    ApiError,
    { shlokId: string; data: CreateMeaningRequest }
  >({
    mutationFn: meaningsApi.createMeaning,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MEANINGS_BY_SHLOK(shlokId),
      });
    },
  });
}

export function useUpdateMeaningMutation(shlokId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<MeaningResponse>,
    ApiError,
    { meaningId: string; data: UpdateMeaningRequest }
  >({
    mutationFn: meaningsApi.updateMeaning,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MEANINGS_BY_SHLOK(shlokId),
      });
    },
  });
}

export function useDeleteMeaningMutation(shlokId: string) {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, string>({
    mutationFn: meaningsApi.deleteMeaning,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MEANINGS_BY_SHLOK(shlokId),
      });
    },
  });
}

export function useVoteMeaningMutation(shlokId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<MeaningResponse>,
    ApiError,
    { meaningId: string; data: VoteMeaningRequest }
  >({
    mutationFn: meaningsApi.voteMeaning,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MEANINGS_BY_SHLOK(shlokId),
      });
    },
  });
}
