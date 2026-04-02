import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/api/axios";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import type {
  ApiError,
  ApiResponse,
  CreateGranthRequest,
  UpdateGranthRequest,
  GranthResponse,
  GranthPageResponse,
  UpdateGranthPageRequest,
  UpdateProgressRequest,
  ProgressResponse,
} from "@/types";

// ── API FUNCTIONS ───────────────────────────────────────────

export const granthsApi = {
  list: () =>
    axiosInstance
      .get<ApiResponse<GranthResponse[]>>("/granths")
      .then((r) => r.data),

  get: (id: string) =>
    axiosInstance
      .get<ApiResponse<GranthResponse>>(`/granths/${id}`)
      .then((r) => r.data),

  create: (data: CreateGranthRequest) =>
    axiosInstance
      .post<ApiResponse<GranthResponse>>("/granths", data)
      .then((r) => r.data),

  update: ({ id, data }: { id: string; data: UpdateGranthRequest }) =>
    axiosInstance
      .put<ApiResponse<GranthResponse>>(`/granths/${id}`, data)
      .then((r) => r.data),

  delete: (id: string) =>
    axiosInstance.delete(`/granths/${id}`).then((r) => r.data),

  // Pages
  getPages: (granthId: string) =>
    axiosInstance
      .get<ApiResponse<GranthPageResponse[]>>(`/granths/${granthId}/pages`)
      .then((r) => r.data),

  getPage: (granthId: string, pageNumber: number) =>
    axiosInstance
      .get<ApiResponse<GranthPageResponse>>(
        `/granths/${granthId}/pages/${pageNumber}`
      )
      .then((r) => r.data),

  addPage: ({
    granthId,
    pageNumber,
    content,
    imageUrl,
  }: {
    granthId: string;
    pageNumber: number;
    content?: string;
    imageUrl?: string;
  }) =>
    axiosInstance
      .post<ApiResponse<GranthPageResponse>>(
        `/granths/${granthId}/pages`,
        { page_number: pageNumber, content: content ?? "", image_url: imageUrl ?? null }
      )
      .then((r) => r.data),

  updatePage: ({
    granthId,
    pageNumber,
    data,
  }: {
    granthId: string;
    pageNumber: number;
    data: UpdateGranthPageRequest;
  }) =>
    axiosInstance
      .put<ApiResponse<GranthPageResponse>>(
        `/granths/${granthId}/pages/${pageNumber}`,
        data
      )
      .then((r) => r.data),

  deletePage: ({
    granthId,
    pageNumber,
  }: {
    granthId: string;
    pageNumber: number;
  }) =>
    axiosInstance
      .delete(`/granths/${granthId}/pages/${pageNumber}`)
      .then((r) => r.data),

  // Progress
  getProgress: (granthId: string) =>
    axiosInstance
      .get<ApiResponse<ProgressResponse | null>>(`/granths/${granthId}/progress`)
      .then((r) => r.data),

  updateProgress: ({
    granthId,
    data,
  }: {
    granthId: string;
    data: UpdateProgressRequest;
  }) =>
    axiosInstance
      .put<ApiResponse<ProgressResponse>>(
        `/granths/${granthId}/progress`,
        data
      )
      .then((r) => r.data),
};

// ── REACT QUERY HOOKS ───────────────────────────────────────

export function useGranthsQuery() {
  return useQuery<ApiResponse<GranthResponse[]>, ApiError>({
    queryKey: QUERY_KEYS.GRANTHS_LIST,
    queryFn: granthsApi.list,
  });
}

export function useGranthDetailQuery(id: string) {
  return useQuery<ApiResponse<GranthResponse>, ApiError>({
    queryKey: QUERY_KEYS.GRANTH_DETAIL(id),
    queryFn: () => granthsApi.get(id),
    enabled: !!id,
  });
}

// Alias for consistency
export const useGranthQuery = useGranthDetailQuery;

export function useCreateGranthMutation() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<GranthResponse>, ApiError, CreateGranthRequest>({
    mutationFn: granthsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.GRANTHS_LIST }),
  });
}

export function useUpdateGranthMutation() {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<GranthResponse>,
    ApiError,
    { id: string; data: UpdateGranthRequest }
  >({
    mutationFn: granthsApi.update,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.GRANTHS_LIST });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.GRANTH_DETAIL(vars.id) });
    },
  });
}

export function useDeleteGranthMutation() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: granthsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.GRANTHS_LIST }),
  });
}

// Pages
export function useGranthPagesQuery(granthId: string) {
  return useQuery<ApiResponse<GranthPageResponse[]>, ApiError>({
    queryKey: QUERY_KEYS.GRANTH_PAGES(granthId),
    queryFn: () => granthsApi.getPages(granthId),
    enabled: !!granthId,
  });
}

export function useGranthPageQuery(granthId: string, pageNumber: number) {
  return useQuery<ApiResponse<GranthPageResponse>, ApiError>({
    queryKey: QUERY_KEYS.GRANTH_PAGE(granthId, pageNumber),
    queryFn: () => granthsApi.getPage(granthId, pageNumber),
    enabled: !!granthId && pageNumber > 0,
  });
}

export function useAddGranthPageMutation(granthId: string) {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<GranthPageResponse>,
    ApiError,
    { granthId: string; pageNumber: number; content?: string; imageUrl?: string }
  >({
    mutationFn: granthsApi.addPage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.GRANTH_PAGES(granthId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.GRANTH_DETAIL(granthId) });
    },
  });
}

export function useUpdateGranthPageMutation(granthId: string) {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<GranthPageResponse>,
    ApiError,
    { granthId: string; pageNumber: number; data: UpdateGranthPageRequest }
  >({
    mutationFn: granthsApi.updatePage,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.GRANTH_PAGES(granthId) });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.GRANTH_PAGE(granthId, vars.pageNumber),
      });
    },
  });
}

export function useDeleteGranthPageMutation(granthId: string) {
  const qc = useQueryClient();
  return useMutation<
    unknown,
    ApiError,
    { granthId: string; pageNumber: number }
  >({
    mutationFn: granthsApi.deletePage,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.GRANTH_PAGES(granthId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.GRANTH_DETAIL(granthId) });
      qc.removeQueries({ queryKey: QUERY_KEYS.GRANTH_PAGE(granthId, vars.pageNumber) });
    },
  });
}

// Progress
export function useGranthProgressQuery(granthId: string) {
  return useQuery<ApiResponse<ProgressResponse | null>, ApiError>({
    queryKey: QUERY_KEYS.GRANTH_PROGRESS(granthId),
    queryFn: () => granthsApi.getProgress(granthId),
    enabled: !!granthId,
  });
}

export function useUpdateGranthProgressMutation(granthId: string) {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<ProgressResponse>,
    ApiError,
    { granthId: string; data: UpdateProgressRequest }
  >({
    mutationFn: granthsApi.updateProgress,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.GRANTH_PROGRESS(granthId) }),
  });
}
