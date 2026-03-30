import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/api/axios";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import type {
  ApiError,
  ApiResponse,
  CreateShlokRequest,
  UpdateShlokRequest,
  ShlokResponse,
  ShlokListResponse,
  CrossReferenceRequest,
  CrossReferenceResponse,
} from "@/types";

// ── API FUNCTIONS ───────────────────────────────────────────

export const shloksApi = {
  createShlok: (data: CreateShlokRequest) =>
    axiosInstance
      .post<ApiResponse<ShlokResponse>>("/shloks", data)
      .then((r) => r.data),

  listByBook: (
    bookId: string,
    params?: { cursor?: string; limit?: number }
  ) =>
    axiosInstance
      .get<ApiResponse<ShlokListResponse>>(`/shloks/book/${bookId}`, {
        params,
      })
      .then((r) => r.data),

  getShlok: (shlokId: string) =>
    axiosInstance
      .get<ApiResponse<ShlokResponse>>(`/shloks/${shlokId}`)
      .then((r) => r.data),

  updateShlok: ({
    shlokId,
    data,
  }: {
    shlokId: string;
    data: UpdateShlokRequest;
  }) =>
    axiosInstance
      .patch<ApiResponse<ShlokResponse>>(`/shloks/${shlokId}`, data)
      .then((r) => r.data),

  deleteShlok: (shlokId: string) =>
    axiosInstance
      .delete<ApiResponse<null>>(`/shloks/${shlokId}`)
      .then((r) => r.data),

  uploadAudio: ({ shlokId, file }: { shlokId: string; file: File }) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosInstance
      .post<ApiResponse<ShlokResponse>>(`/shloks/${shlokId}/audio`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  getRelated: (shlokId: string) =>
    axiosInstance
      .get<ApiResponse<ShlokResponse[]>>(`/shloks/${shlokId}/related`)
      .then((r) => r.data),

  addCrossReference: ({
    shlokId,
    data,
  }: {
    shlokId: string;
    data: CrossReferenceRequest;
  }) =>
    axiosInstance
      .post<ApiResponse<CrossReferenceResponse>>(
        `/shloks/${shlokId}/cross-references`,
        data
      )
      .then((r) => r.data),

  getCrossReferences: (shlokId: string) =>
    axiosInstance
      .get<ApiResponse<CrossReferenceResponse[]>>(
        `/shloks/${shlokId}/cross-references`
      )
      .then((r) => r.data),
};

// ── REACT QUERY HOOKS ───────────────────────────────────────

export function useCreateShlokMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<ShlokResponse>, ApiError, CreateShlokRequest>({
    mutationFn: shloksApi.createShlok,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SHLOKS_BY_BOOK(variables.book_id),
      });
    },
  });
}

export function useShloksByBookQuery(
  bookId: string,
  params?: { cursor?: string; limit?: number }
) {
  return useQuery<ApiResponse<ShlokListResponse>, ApiError>({
    queryKey: [...QUERY_KEYS.SHLOKS_BY_BOOK(bookId), params],
    queryFn: () => shloksApi.listByBook(bookId, params),
    enabled: !!bookId,
  });
}

export function useShlokDetailQuery(shlokId: string) {
  return useQuery<ApiResponse<ShlokResponse>, ApiError>({
    queryKey: QUERY_KEYS.SHLOK_DETAIL(shlokId),
    queryFn: () => shloksApi.getShlok(shlokId),
    enabled: !!shlokId,
  });
}

export function useUpdateShlokMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<ShlokResponse>,
    ApiError,
    { shlokId: string; data: UpdateShlokRequest }
  >({
    mutationFn: shloksApi.updateShlok,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SHLOK_DETAIL(variables.shlokId),
      });
    },
  });
}

export function useDeleteShlokMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, string>({
    mutationFn: shloksApi.deleteShlok,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shloks"] });
    },
  });
}

export function useUploadShlokAudioMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<ShlokResponse>,
    ApiError,
    { shlokId: string; file: File }
  >({
    mutationFn: shloksApi.uploadAudio,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SHLOK_DETAIL(variables.shlokId),
      });
    },
  });
}

export function useShlokRelatedQuery(shlokId: string) {
  return useQuery<ApiResponse<ShlokResponse[]>, ApiError>({
    queryKey: QUERY_KEYS.SHLOK_RELATED(shlokId),
    queryFn: () => shloksApi.getRelated(shlokId),
    enabled: !!shlokId,
  });
}

export function useAddCrossReferenceMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<CrossReferenceResponse>,
    ApiError,
    { shlokId: string; data: CrossReferenceRequest }
  >({
    mutationFn: shloksApi.addCrossReference,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SHLOK_CROSS_REFS(variables.shlokId),
      });
    },
  });
}

export function useShlokCrossReferencesQuery(shlokId: string) {
  return useQuery<ApiResponse<CrossReferenceResponse[]>, ApiError>({
    queryKey: QUERY_KEYS.SHLOK_CROSS_REFS(shlokId),
    queryFn: () => shloksApi.getCrossReferences(shlokId),
    enabled: !!shlokId,
  });
}
