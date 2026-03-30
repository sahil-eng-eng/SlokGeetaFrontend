// lib/api/endpoints/groups.ts

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/api/axios";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import type {
  ApiError,
  ApiResponse,
  GroupResponse,
  GroupMessageResponse,
  CreateGroupRequest,
  UpdateGroupRequest,
  UpdateMemberRoleRequest,
  SendGroupMessageRequest,
  EditGroupMessageRequest,
  AddGroupMembersRequest,
} from "@/types";

// ── API FUNCTIONS ───────────────────────────────────────────

export const groupsApi = {
  createGroup: (data: CreateGroupRequest) =>
    axiosInstance
      .post<ApiResponse<GroupResponse>>("/groups", data)
      .then((r) => r.data),

  listGroups: () =>
    axiosInstance
      .get<ApiResponse<GroupResponse[]>>("/groups")
      .then((r) => r.data),

  getGroup: (groupId: string) =>
    axiosInstance
      .get<ApiResponse<GroupResponse>>(`/groups/${groupId}`)
      .then((r) => r.data),

  addMembers: (groupId: string, data: AddGroupMembersRequest) =>
    axiosInstance
      .post<ApiResponse<GroupResponse>>(`/groups/${groupId}/members`, data)
      .then((r) => r.data),

  leaveGroup: (groupId: string) =>
    axiosInstance
      .delete<void>(`/groups/${groupId}/leave`)
      .then((r) => r.data),

  sendMessage: (groupId: string, data: SendGroupMessageRequest) =>
    axiosInstance
      .post<ApiResponse<GroupMessageResponse>>(`/groups/${groupId}/messages`, data)
      .then((r) => r.data),

  getMessages: (groupId: string, limit = 50, beforeId?: string) =>
    axiosInstance
      .get<ApiResponse<GroupMessageResponse[]>>(`/groups/${groupId}/messages`, {
        params: { limit, ...(beforeId ? { before_id: beforeId } : {}) },
      })
      .then((r) => r.data),

  deleteMessage: (groupId: string, messageId: string) =>
    axiosInstance
      .delete<ApiResponse<GroupMessageResponse>>(`/groups/${groupId}/messages/${messageId}`)
      .then((r) => r.data),

  editMessage: (groupId: string, messageId: string, content: string) =>
    axiosInstance
      .patch<ApiResponse<GroupMessageResponse>>(`/groups/${groupId}/messages/${messageId}`, { content })
      .then((r) => r.data),

  updateGroup: (groupId: string, data: UpdateGroupRequest) =>
    axiosInstance
      .patch<ApiResponse<GroupResponse>>(`/groups/${groupId}`, data)
      .then((r) => r.data),

  updateMemberRole: (groupId: string, userId: string, data: UpdateMemberRoleRequest) =>
    axiosInstance
      .patch<ApiResponse<GroupResponse>>(`/groups/${groupId}/members/${userId}/role`, data)
      .then((r) => r.data),
};

// ── REACT QUERY HOOKS ───────────────────────────────────────

export function useGroupsQuery() {
  return useQuery<ApiResponse<GroupResponse[]>, ApiError>({
    queryKey: QUERY_KEYS.GROUPS_LIST,
    queryFn: groupsApi.listGroups,
  });
}

export function useGroupMessagesQuery(groupId: string) {
  return useQuery<ApiResponse<GroupMessageResponse[]>, ApiError>({
    queryKey: QUERY_KEYS.GROUP_MESSAGES(groupId),
    queryFn: () => groupsApi.getMessages(groupId, 50),
    enabled: !!groupId,
  });
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<GroupResponse>, ApiError, CreateGroupRequest>({
    mutationFn: groupsApi.createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS_LIST });
    },
  });
}

export function useAddGroupMembersMutation(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<GroupResponse>, ApiError, AddGroupMembersRequest>({
    mutationFn: (data) => groupsApi.addMembers(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS_LIST });
    },
  });
}

export function useLeaveGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: groupsApi.leaveGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS_LIST });
    },
  });
}

export function useSendGroupMessageMutation(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<GroupMessageResponse>, ApiError, SendGroupMessageRequest>({
    mutationFn: (data) => groupsApi.sendMessage(groupId, data),
    onSuccess: (res) => {
      queryClient.setQueryData<ApiResponse<GroupMessageResponse[]>>(
        QUERY_KEYS.GROUP_MESSAGES(groupId),
        (old) => {
          if (!old || !res.data) return old;
          return { ...old, data: [...(old.data ?? []), res.data] };
        }
      );
    },
  });
}

export function useDeleteGroupMessageMutation(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<GroupMessageResponse>, ApiError, string>({
    mutationFn: (messageId) => groupsApi.deleteMessage(groupId, messageId),
    onSuccess: (res) => {
      queryClient.setQueryData<ApiResponse<GroupMessageResponse[]>>(
        QUERY_KEYS.GROUP_MESSAGES(groupId),
        (old) => {
          if (!old || !res.data) return old;
          return {
            ...old,
            data: (old.data ?? []).map((m) =>
              m.id === res.data!.id ? { ...m, is_deleted: true, content: "" } : m
            ),
          };
        }
      );
    },
  });
}

export function useEditGroupMessageMutation(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<GroupMessageResponse>, ApiError, { messageId: string; content: string }>({
    mutationFn: ({ messageId, content }) => groupsApi.editMessage(groupId, messageId, content),
    onSuccess: (res) => {
      queryClient.setQueryData<ApiResponse<GroupMessageResponse[]>>(
        QUERY_KEYS.GROUP_MESSAGES(groupId),
        (old) => {
          if (!old || !res.data) return old;
          return {
            ...old,
            data: (old.data ?? []).map((m) =>
              m.id === res.data!.id
                ? { ...m, content: res.data!.content, edited_at: res.data!.edited_at }
                : m
            ),
          };
        }
      );
    },
  });
}

export function useUpdateGroupMutation(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<GroupResponse>, ApiError, UpdateGroupRequest>({
    mutationFn: (data) => groupsApi.updateGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS_LIST });
    },
  });
}

export function useUpdateMemberRoleMutation(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<GroupResponse>, ApiError, { userId: string; data: UpdateMemberRoleRequest }>({
    mutationFn: ({ userId, data }) => groupsApi.updateMemberRole(groupId, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS_LIST });
    },
  });
}

// ── WEBSOCKET HANDLER FOR GROUP EVENTS ─────────────────────
// Call this in the main WS event handler (e.g., useChatSocket or a new useGroupSocket)

export function handleGroupSocketEvent(
  queryClient: ReturnType<typeof useQueryClient>,
  data: { type: string; [key: string]: unknown }
) {
  if (data.type === "group_message") {
    const msg = data.message as GroupMessageResponse;
    if (!msg?.group_id) return;
    queryClient.setQueryData<ApiResponse<GroupMessageResponse[]>>(
      QUERY_KEYS.GROUP_MESSAGES(msg.group_id),
      (old) => {
        if (!old) return old;
        // Avoid duplicates
        const exists = (old.data ?? []).some((m) => m.id === msg.id);
        if (exists) return old;
        return { ...old, data: [...(old.data ?? []), msg] };
      }
    );
    // Refresh groups list so last-message preview could update
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS_LIST });
  } else if (data.type === "group_message_deleted") {
    const msg = data.message as GroupMessageResponse;
    if (!msg?.group_id) return;
    queryClient.setQueryData<ApiResponse<GroupMessageResponse[]>>(
      QUERY_KEYS.GROUP_MESSAGES(msg.group_id),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data ?? []).map((m) =>
            m.id === msg.id ? { ...m, is_deleted: true, content: "" } : m
          ),
        };
      }
    );
  } else if (data.type === "group_message_edited") {
    const msg = data.message as GroupMessageResponse;
    if (!msg?.group_id) return;
    queryClient.setQueryData<ApiResponse<GroupMessageResponse[]>>(
      QUERY_KEYS.GROUP_MESSAGES(msg.group_id),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data ?? []).map((m) =>
            m.id === msg.id ? { ...m, content: msg.content, edited_at: msg.edited_at } : m
          ),
        };
      }
    );
  } else if (data.type === "group_added") {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS_LIST });
  } else if (data.type === "group_left") {
    // A member left — refresh group data so member count and list update
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS_LIST });
  } else if (data.type === "group_updated") {
    // Group name/avatar/description changed
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS_LIST });
  }
}
