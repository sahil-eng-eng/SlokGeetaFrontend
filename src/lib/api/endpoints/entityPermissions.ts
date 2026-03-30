// lib/api/endpoints/entityPermissions.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/api/axios";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import type {
  ApiError,
  ApiResponse,
  SetEntityPermissionRequest,
  EntityPermissionResponse,
  EntityType,
} from "@/types";

// ── API FUNCTIONS ───────────────────────────────────────────

export const entityPermissionsApi = {
  list: (entityType: EntityType, entityId: string) =>
    axiosInstance
      .get<ApiResponse<EntityPermissionResponse[]>>(
        `/permissions/${entityType}/${entityId}`
      )
      .then((r) => r.data),

  set: (
    entityType: EntityType,
    entityId: string,
    data: SetEntityPermissionRequest
  ) =>
    axiosInstance
      .post<ApiResponse<EntityPermissionResponse>>(
        `/permissions/${entityType}/${entityId}`,
        data
      )
      .then((r) => r.data),

  revoke: (entityType: EntityType, entityId: string, userId: string) =>
    axiosInstance
      .delete(`/permissions/${entityType}/${entityId}/${userId}`)
      .then((r) => r.data),

  listMine: () =>
    axiosInstance
      .get<ApiResponse<EntityPermissionResponse[]>>(`/permissions/mine`)
      .then((r) => r.data),
};

// ── REACT QUERY HOOKS ───────────────────────────────────────

export function useEntityPermissionsQuery(
  entityType: EntityType,
  entityId: string,
  options?: { enabled?: boolean }
) {
  return useQuery<ApiResponse<EntityPermissionResponse[]>, ApiError>({
    queryKey: QUERY_KEYS.ENTITY_PERMISSIONS(entityType, entityId),
    queryFn: () => entityPermissionsApi.list(entityType, entityId),
    enabled: (options?.enabled ?? true) && !!entityId,
  });
}

export function useSetEntityPermissionMutation(
  entityType: EntityType,
  entityId: string
) {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<EntityPermissionResponse>,
    ApiError,
    SetEntityPermissionRequest
  >({
    mutationFn: (data) => entityPermissionsApi.set(entityType, entityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ENTITY_PERMISSIONS(entityType, entityId),
      });
    },
  });
}

export function useRevokeEntityPermissionMutation(
  entityType: EntityType,
  entityId: string
) {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (userId) =>
      entityPermissionsApi.revoke(entityType, entityId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ENTITY_PERMISSIONS(entityType, entityId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PERMISSIONS_MINE });
    },
  });
}

export function useMyGrantedPermissionsQuery() {
  return useQuery<ApiResponse<EntityPermissionResponse[]>, ApiError>({
    queryKey: QUERY_KEYS.PERMISSIONS_MINE,
    queryFn: entityPermissionsApi.listMine,
  });
}
