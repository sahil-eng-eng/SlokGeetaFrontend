// lib/api/endpoints/kirtan.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/api/axios";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import type {
  ApiError,
  ApiResponse,
  KirtanTrackResponse,
  CreateKirtanTrackRequest,
} from "@/types";

// ── API FUNCTIONS ───────────────────────────────────────────

export const kirtanApi = {
  listTracks: () =>
    axiosInstance
      .get<ApiResponse<KirtanTrackResponse[]>>("/kirtan/tracks")
      .then((r) => r.data),

  createTrack: (data: CreateKirtanTrackRequest) =>
    axiosInstance
      .post<ApiResponse<KirtanTrackResponse>>("/kirtan/tracks", data)
      .then((r) => r.data),

  toggleFavorite: (trackId: string) =>
    axiosInstance
      .patch<ApiResponse<KirtanTrackResponse>>(`/kirtan/tracks/${trackId}/favorite`)
      .then((r) => r.data),

  deleteTrack: (trackId: string) =>
    axiosInstance.delete(`/kirtan/tracks/${trackId}`).then((r) => r.data),

  uploadAudio: ({ trackId, file }: { trackId: string; file: File }) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosInstance
      .post<ApiResponse<KirtanTrackResponse>>(`/kirtan/tracks/${trackId}/audio`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

// ── REACT QUERY HOOKS ───────────────────────────────────────

export function useKirtanTracksQuery() {
  return useQuery<ApiResponse<KirtanTrackResponse[]>, ApiError>({
    queryKey: QUERY_KEYS.KIRTAN_TRACKS,
    queryFn: kirtanApi.listTracks,
  });
}

export function useCreateKirtanTrackMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<KirtanTrackResponse>, ApiError, CreateKirtanTrackRequest>({
    mutationFn: kirtanApi.createTrack,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.KIRTAN_TRACKS });
    },
  });
}

export function useToggleFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<KirtanTrackResponse>, ApiError, string>({
    mutationFn: kirtanApi.toggleFavorite,
    onSuccess: (data) => {
      // Optimistic-style update: update the cached track directly
      queryClient.setQueryData<ApiResponse<KirtanTrackResponse[]>>(
        QUERY_KEYS.KIRTAN_TRACKS,
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((t) =>
              t.id === data.data.id ? { ...t, is_favorite: data.data.is_favorite } : t
            ),
          };
        }
      );
    },
  });
}

export function useDeleteKirtanTrackMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: kirtanApi.deleteTrack,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.KIRTAN_TRACKS });
    },
  });
}

export function useUploadKirtanAudioMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<KirtanTrackResponse>,
    ApiError,
    { trackId: string; file: File }
  >({    mutationFn: kirtanApi.uploadAudio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.KIRTAN_TRACKS });
    },
  });
}
