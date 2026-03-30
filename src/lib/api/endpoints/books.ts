import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/api/axios";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import type {
  ApiError,
  ApiResponse,
  CreateBookRequest,
  UpdateBookRequest,
  BookResponse,
  BookListResponse,
} from "@/types";

// ── API FUNCTIONS ───────────────────────────────────────────

export const booksApi = {
  createBook: (data: CreateBookRequest) =>
    axiosInstance
      .post<ApiResponse<BookResponse>>("/books", data)
      .then((r) => r.data),

  listMyBooks: (params?: { cursor?: string; limit?: number }) =>
    axiosInstance
      .get<ApiResponse<BookListResponse>>("/books/me", { params })
      .then((r) => r.data),

  listPublicBooks: (params?: {
    cursor?: string;
    limit?: number;
    category?: string;
    owner_id?: string;
  }) =>
    axiosInstance
      .get<ApiResponse<BookListResponse>>("/books/public", { params })
      .then((r) => r.data),

  getBook: (bookId: string) =>
    axiosInstance
      .get<ApiResponse<BookResponse>>(`/books/${bookId}`)
      .then((r) => r.data),

  updateBook: ({ bookId, data }: { bookId: string; data: UpdateBookRequest }) =>
    axiosInstance
      .patch<ApiResponse<BookResponse>>(`/books/${bookId}`, data)
      .then((r) => r.data),

  deleteBook: (bookId: string) =>
    axiosInstance
      .delete<ApiResponse<null>>(`/books/${bookId}`)
      .then((r) => r.data),

  uploadCover: ({ bookId, file }: { bookId: string; file: File }) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosInstance
      .post<ApiResponse<BookResponse>>(`/books/${bookId}/cover`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  listSharedWithMe: () =>
    axiosInstance
      .get<ApiResponse<BookListResponse>>("/books/shared-with-me")
      .then((r) => r.data),
};

// ── REACT QUERY HOOKS ───────────────────────────────────────

export function useCreateBookMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<BookResponse>, ApiError, CreateBookRequest>({
    mutationFn: booksApi.createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKS_MY });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKS_PUBLIC });
    },
  });
}

export function useMyBooksQuery(params?: { cursor?: string; limit?: number }) {
  return useQuery<ApiResponse<BookListResponse>, ApiError>({
    queryKey: [...QUERY_KEYS.BOOKS_MY, params],
    queryFn: () => booksApi.listMyBooks(params),
  });
}

export function usePublicBooksQuery(params?: {
  cursor?: string;
  limit?: number;
  category?: string;
  owner_id?: string;
}) {
  return useQuery<ApiResponse<BookListResponse>, ApiError>({
    queryKey: [...QUERY_KEYS.BOOKS_PUBLIC, params],
    queryFn: () => booksApi.listPublicBooks(params),
  });
}

export function useBookDetailQuery(bookId: string) {
  return useQuery<ApiResponse<BookResponse>, ApiError>({
    queryKey: QUERY_KEYS.BOOK_DETAIL(bookId),
    queryFn: () => booksApi.getBook(bookId),
    enabled: !!bookId,
  });
}

export function useUpdateBookMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<BookResponse>,
    ApiError,
    { bookId: string; data: UpdateBookRequest }
  >({
    mutationFn: booksApi.updateBook,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BOOK_DETAIL(variables.bookId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKS_MY });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKS_PUBLIC });
    },
  });
}

export function useDeleteBookMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<null>, ApiError, string>({
    mutationFn: booksApi.deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKS_MY });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKS_PUBLIC });
    },
  });
}

export function useUploadBookCoverMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<BookResponse>,
    ApiError,
    { bookId: string; file: File }
  >({
    mutationFn: booksApi.uploadCover,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BOOK_DETAIL(variables.bookId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKS_MY });
    },
  });
}

export function useSharedWithMeBooksQuery() {
  return useQuery<ApiResponse<BookListResponse>, ApiError>({
    queryKey: QUERY_KEYS.BOOKS_SHARED_WITH_ME,
    queryFn: booksApi.listSharedWithMe,
  });
}
