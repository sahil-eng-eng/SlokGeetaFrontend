// lib/api/endpoints/chat.ts

import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { useEffect, useRef, useCallback } from "react";
import axiosInstance from "@/lib/api/axios";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import type {
  ApiError,
  ApiResponse,
  MessageResponse,
  MessageListResponse,
  ConversationPreview,
} from "@/types";

// ── API FUNCTIONS ───────────────────────────────────────────

export const chatApi = {
  getConversations: () =>
    axiosInstance
      .get<ApiResponse<ConversationPreview[]>>("/chat/conversations")
      .then((r) => r.data),

  getMessages: (partnerId: string, limit = 50, beforeId?: string) =>
    axiosInstance
      .get<ApiResponse<MessageListResponse>>(`/chat/messages/${partnerId}`, {
        params: { limit, ...(beforeId ? { before_id: beforeId } : {}) },
      })
      .then((r) => r.data),

  sendMessage: (partnerId: string, content: string) =>
    axiosInstance
      .post<ApiResponse<MessageResponse>>(`/chat/messages/${partnerId}`, { content })
      .then((r) => r.data),

  markSeen: (partnerId: string) =>
    axiosInstance
      .post(`/chat/messages/${partnerId}/seen`)
      .then((r) => r.data),

  deleteMessage: (messageId: string) =>
    axiosInstance
      .delete<ApiResponse<MessageResponse>>(`/chat/messages/${messageId}`)
      .then((r) => r.data),

  editMessage: (messageId: string, content: string) =>
    axiosInstance
      .patch<ApiResponse<MessageResponse>>(`/chat/messages/${messageId}`, { content })
      .then((r) => r.data),
};

// ── REACT QUERY HOOKS ───────────────────────────────────────

export function useConversationsQuery() {
  return useQuery<ApiResponse<ConversationPreview[]>, ApiError>({
    queryKey: QUERY_KEYS.CHAT_CONVERSATIONS,
    queryFn: chatApi.getConversations,
    refetchInterval: 15000,
  });
}

export function useMessagesQuery(partnerId: string) {
  return useQuery<ApiResponse<MessageListResponse>, ApiError>({
    queryKey: QUERY_KEYS.CHAT_MESSAGES(partnerId),
    queryFn: () => chatApi.getMessages(partnerId),
    enabled: !!partnerId,
  });
}

export function useMessagesInfiniteQuery(partnerId: string) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.CHAT_MESSAGES(partnerId),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      chatApi.getMessages(partnerId, 20, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: ApiResponse<MessageListResponse>) =>
      lastPage.data?.next_cursor ?? undefined,
    enabled: !!partnerId,
  });
}

export function useSendMessageMutation(partnerId: string) {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<MessageResponse>, ApiError, string>({
    mutationFn: (content) => chatApi.sendMessage(partnerId, content),
    onSuccess: (data) => {
      // Append the new message to the latest page
      queryClient.setQueryData<InfiniteData<ApiResponse<MessageListResponse>>>(
        QUERY_KEYS.CHAT_MESSAGES(partnerId),
        (old) => {
          if (!old?.pages?.length) return old;
          const pages = [...old.pages];
          const latestPage = pages[0];
          if (!latestPage?.data) return old;
          const newMsg = data.data;
          const exists = latestPage.data.items.some((m) => m.id === newMsg.id);
          if (exists) return old;
          pages[0] = { ...latestPage, data: { ...latestPage.data, items: [...latestPage.data.items, newMsg] } };
          return { ...old, pages };
        }
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHAT_CONVERSATIONS });
    },
  });
}

export function useMarkSeenMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: chatApi.markSeen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHAT_CONVERSATIONS });
    },
  });
}

export function useDeleteMessageMutation(partnerId: string) {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<MessageResponse>, ApiError, string>({
    mutationFn: chatApi.deleteMessage,
    onSuccess: (data) => {
      queryClient.setQueryData<InfiniteData<ApiResponse<MessageListResponse>>>(
        QUERY_KEYS.CHAT_MESSAGES(partnerId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data
                ? { ...page.data, items: page.data.items.map((m) => m.id === data.data.id ? { ...m, is_deleted: true, content: "" } : m) }
                : page.data,
            })),
          };
        }
      );
    },
  });
}

export function useEditMessageMutation(partnerId: string) {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<MessageResponse>, ApiError, { messageId: string; content: string }>({
    mutationFn: ({ messageId, content }) => chatApi.editMessage(messageId, content),
    onSuccess: (data) => {
      queryClient.setQueryData<InfiniteData<ApiResponse<MessageListResponse>>>(
        QUERY_KEYS.CHAT_MESSAGES(partnerId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data
                ? { ...page.data, items: page.data.items.map((m) => m.id === data.data.id ? { ...m, content: data.data.content, edited_at: data.data.edited_at } : m) }
                : page.data,
            })),
          };
        }
      );
    },
  });
}

// ── WEBSOCKET HOOK ──────────────────────────────────────────

export function useChatSocket(
  onMessage: (msg: MessageResponse) => void,
  onTyping?: (senderId: string) => void,
  onCallEvent?: (data: Record<string, unknown>) => void,
) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  // Use refs so the socket is only created once but always calls latest callbacks
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onCallEventRef = useRef(onCallEvent);

  useEffect(() => { onMessageRef.current = onMessage; });
  useEffect(() => { onTypingRef.current = onTyping; });
  useEffect(() => { onCallEventRef.current = onCallEvent; });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8003";
    const wsBase = apiBase.startsWith("https")
      ? apiBase.replace("https://", "wss://")
      : apiBase.replace("http://", "ws://");

    const ws = new WebSocket(`${wsBase}/api/v1/chat/ws?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as Record<string, unknown>;
        if (data.type === "new_message") {
          onMessageRef.current(data.message as MessageResponse);
        } else if (data.type === "typing") {
          onTypingRef.current?.(data.sender_id as string);
        } else if (data.type === "message_deleted") {
          // Invalidate all loaded DM message caches so they refetch fresh data
          queryClient.invalidateQueries({ queryKey: ["chat", "messages"] });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHAT_CONVERSATIONS });
        } else if (data.type === "message_edited") {
          queryClient.invalidateQueries({ queryKey: ["chat", "messages"] });
        } else if (
          data.type === "group_message" ||
          data.type === "group_message_deleted" ||
          data.type === "group_message_edited" ||
          data.type === "group_added" ||
          data.type === "group_left" ||
          data.type === "group_updated"
        ) {
          // Delegate to group cache updater
          type GroupMsg = { id: string; group_id: string; content: string; edited_at?: string | null; is_deleted?: boolean };
          if (data.type === "group_message") {
            const msg = data.message as GroupMsg;
            if (msg?.group_id) {
              queryClient.setQueryData<ApiResponse<GroupMsg[]>>(
                ["groups", "messages", msg.group_id],
                (old: ApiResponse<GroupMsg[]> | undefined) => {
                  if (!old) return old;
                  const exists = (old.data ?? []).some((m) => m.id === msg.id);
                  if (exists) return old;
                  return { ...old, data: [...(old.data ?? []), msg] };
                }
              );
              queryClient.invalidateQueries({ queryKey: ["groups", "list"] });
            }
          } else if (data.type === "group_message_deleted") {
            const msg = data.message as GroupMsg;
            if (msg?.group_id) {
              queryClient.setQueryData<ApiResponse<GroupMsg[]>>(
                ["groups", "messages", msg.group_id],
                (old: ApiResponse<GroupMsg[]> | undefined) => {
                  if (!old) return old;
                  return { ...old, data: (old.data ?? []).map((m) => m.id === msg.id ? { ...m, is_deleted: true, content: "" } : m) };
                }
              );
            }
          } else if (data.type === "group_message_edited") {
            const msg = data.message as GroupMsg;
            if (msg?.group_id) {
              queryClient.setQueryData<ApiResponse<GroupMsg[]>>(
                ["groups", "messages", msg.group_id],
                (old: ApiResponse<GroupMsg[]> | undefined) => {
                  if (!old) return old;
                  return { ...old, data: (old.data ?? []).map((m) => m.id === msg.id ? { ...m, content: msg.content, edited_at: msg.edited_at } : m) };
                }
              );
            }
          } else if (data.type === "group_added") {
            queryClient.invalidateQueries({ queryKey: ["groups", "list"] });
          } else if (data.type === "group_left" || data.type === "group_updated") {
            queryClient.invalidateQueries({ queryKey: ["groups", "list"] });
          }
        } else if (
          data.type === "call_offer" ||
          data.type === "call_answer" ||
          data.type === "call_reject" ||
          data.type === "call_ice_candidate" ||
          data.type === "call_end"
        ) {
          onCallEventRef.current?.(data);
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => ws.close();

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendTyping = useCallback((receiverId: string, isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "typing", receiver_id: receiverId, is_typing: isTyping })
      );
    }
  }, []);

  const sendWsEvent = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { sendTyping, sendWsEvent };
}
