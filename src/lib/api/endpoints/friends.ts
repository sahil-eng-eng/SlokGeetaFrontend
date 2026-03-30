// lib/api/endpoints/friends.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import axiosInstance from "@/lib/api/axios";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import type {
  ApiError,
  ApiResponse,
  UserSearchResult,
  SendFriendRequestRequest,
  FriendRequestResponse,
  FriendResponse,
} from "@/types";

// ── API FUNCTIONS ───────────────────────────────────────────

export const friendsApi = {
  searchUsers: (q: string) =>
    axiosInstance
      .get<ApiResponse<UserSearchResult[]>>("/users/search", { params: { q } })
      .then((r) => r.data),

  sendRequest: (data: SendFriendRequestRequest) =>
    axiosInstance
      .post<ApiResponse<FriendRequestResponse>>("/friends/request", data)
      .then((r) => r.data),

  listIncoming: () =>
    axiosInstance
      .get<ApiResponse<FriendRequestResponse[]>>("/friends/requests/incoming")
      .then((r) => r.data),

  listOutgoing: () =>
    axiosInstance
      .get<ApiResponse<FriendRequestResponse[]>>("/friends/requests/outgoing")
      .then((r) => r.data),

  acceptRequest: (requestId: string) =>
    axiosInstance
      .patch<ApiResponse<FriendRequestResponse>>(`/friends/requests/${requestId}/accept`)
      .then((r) => r.data),

  rejectRequest: (requestId: string) =>
    axiosInstance
      .patch<ApiResponse<FriendRequestResponse>>(`/friends/requests/${requestId}/reject`)
      .then((r) => r.data),

  cancelRequest: (requestId: string) =>
    axiosInstance.delete(`/friends/requests/${requestId}`).then((r) => r.data),

  listFriends: () =>
    axiosInstance
      .get<ApiResponse<FriendResponse[]>>("/friends")
      .then((r) => r.data),

  unfriend: (friendId: string) =>
    axiosInstance.delete(`/friends/${friendId}`).then((r) => r.data),
};

// ── REACT QUERY HOOKS ───────────────────────────────────────

export function useUserSearchQuery(q: string) {
  return useQuery<ApiResponse<UserSearchResult[]>, ApiError>({
    queryKey: QUERY_KEYS.USERS_SEARCH(q),
    queryFn: () => friendsApi.searchUsers(q),
    enabled: q.length >= 2,
  });
}

export function useFriendsListQuery() {
  return useQuery<ApiResponse<FriendResponse[]>, ApiError>({
    queryKey: QUERY_KEYS.FRIENDS_LIST,
    queryFn: friendsApi.listFriends,
  });
}

export function useIncomingRequestsQuery() {
  return useQuery<ApiResponse<FriendRequestResponse[]>, ApiError>({
    queryKey: QUERY_KEYS.FRIENDS_REQUESTS_INCOMING,
    queryFn: friendsApi.listIncoming,
  });
}

export function useOutgoingRequestsQuery() {
  return useQuery<ApiResponse<FriendRequestResponse[]>, ApiError>({
    queryKey: QUERY_KEYS.FRIENDS_REQUESTS_OUTGOING,
    queryFn: friendsApi.listOutgoing,
  });
}

export function useSendFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<FriendRequestResponse>, ApiError, SendFriendRequestRequest>({
    mutationFn: friendsApi.sendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS_REQUESTS_OUTGOING });
    },
  });
}

export function useAcceptRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<FriendRequestResponse>, ApiError, string>({
    mutationFn: friendsApi.acceptRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS_REQUESTS_INCOMING });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS_LIST });
    },
  });
}

export function useRejectRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<FriendRequestResponse>, ApiError, string>({
    mutationFn: friendsApi.rejectRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS_REQUESTS_INCOMING });
    },
  });
}

export function useCancelRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: friendsApi.cancelRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS_REQUESTS_OUTGOING });
    },
  });
}

export function useUnfriendMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: friendsApi.unfriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS_LIST });
    },
  });
}

// ── WEBSOCKET HOOK ──────────────────────────────────────────
// Connects to the shared /chat/ws endpoint and listens for friend events.
// Call this on FriendsPage so the UI auto-refreshes when the other user
// accepts/rejects a request or sends one.

export function useFriendsSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";
    const wsBase = apiBase.startsWith("https")
      ? apiBase.replace("https://", "wss://")
      : apiBase.replace("http://", "ws://");

    const ws = new WebSocket(`${wsBase}/api/v1/chat/ws?token=${encodeURIComponent(token)}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as Record<string, unknown>;
        if (data.type === "friend_request") {
          // Someone sent us a request → refresh incoming list
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS_REQUESTS_INCOMING });
        } else if (data.type === "friend_accepted") {
          // Our request was accepted → refresh friends list + outgoing
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS_LIST });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS_REQUESTS_OUTGOING });
        } else if (data.type === "friend_rejected") {
          // Our request was rejected → refresh outgoing
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS_REQUESTS_OUTGOING });
        } else if (data.type === "friend_removed") {
          // Someone unfriended us (or we unfriended them) → refresh friends list
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS_LIST });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHAT_CONVERSATIONS });
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => ws.close();

    return () => {
      ws.close();
    };
  }, [queryClient]); // eslint-disable-line react-hooks/exhaustive-deps
}
