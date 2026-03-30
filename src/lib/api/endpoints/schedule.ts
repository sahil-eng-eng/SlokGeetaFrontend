// lib/api/endpoints/schedule.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/api/axios";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import type {
  ApiError,
  ApiResponse,
  ScheduleVersionResponse,
  CreateScheduleVersionRequest,
  UpdateScheduleVersionRequest,
  CheckInResponse,
  CreateCheckInRequest,
} from "@/types";

// ── API FUNCTIONS ───────────────────────────────────────────

export const scheduleApi = {
  listVersions: () =>
    axiosInstance
      .get<ApiResponse<ScheduleVersionResponse[]>>("/schedule/versions")
      .then((r) => r.data),

  getActiveVersion: () =>
    axiosInstance
      .get<ApiResponse<ScheduleVersionResponse | null>>("/schedule/versions/active")
      .then((r) => r.data),

  createVersion: (data: CreateScheduleVersionRequest) =>
    axiosInstance
      .post<ApiResponse<ScheduleVersionResponse>>("/schedule/versions", data)
      .then((r) => r.data),

  activateVersion: (versionId: string) =>
    axiosInstance
      .patch<ApiResponse<ScheduleVersionResponse>>(`/schedule/versions/${versionId}/activate`)
      .then((r) => r.data),

  updateVersion: (versionId: string, data: UpdateScheduleVersionRequest) =>
    axiosInstance
      .patch<ApiResponse<ScheduleVersionResponse>>(`/schedule/versions/${versionId}`, data)
      .then((r) => r.data),

  updateCheckIn: (checkinId: string, data: CreateCheckInRequest) =>
    axiosInstance
      .patch<ApiResponse<CheckInResponse>>(`/schedule/checkins/${checkinId}`, data)
      .then((r) => r.data),

  submitCheckIn: (data: CreateCheckInRequest) =>
    axiosInstance
      .post<ApiResponse<CheckInResponse>>("/schedule/checkins", data)
      .then((r) => r.data),

  listCheckIns: (limit = 30) =>
    axiosInstance
      .get<ApiResponse<CheckInResponse[]>>("/schedule/checkins", { params: { limit } })
      .then((r) => r.data),

  getTodayCheckIn: () =>
    axiosInstance
      .get<ApiResponse<CheckInResponse | null>>("/schedule/checkins/today")
      .then((r) => r.data),
};

// ── REACT QUERY HOOKS ───────────────────────────────────────

export function useScheduleVersionsQuery() {
  return useQuery<ApiResponse<ScheduleVersionResponse[]>, ApiError>({
    queryKey: QUERY_KEYS.SCHEDULE_VERSIONS,
    queryFn: scheduleApi.listVersions,
  });
}

export function useActiveScheduleVersionQuery() {
  return useQuery<ApiResponse<ScheduleVersionResponse | null>, ApiError>({
    queryKey: QUERY_KEYS.SCHEDULE_ACTIVE,
    queryFn: scheduleApi.getActiveVersion,
  });
}

export function useCreateScheduleVersionMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<ScheduleVersionResponse>, ApiError, CreateScheduleVersionRequest>({
    mutationFn: scheduleApi.createVersion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE_VERSIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE_ACTIVE });
    },
  });
}

export function useActivateScheduleVersionMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<ScheduleVersionResponse>, ApiError, string>({
    mutationFn: scheduleApi.activateVersion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE_VERSIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE_ACTIVE });
    },
  });
}

export function useUpdateScheduleVersionMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<ScheduleVersionResponse>,
    ApiError,
    { versionId: string; data: UpdateScheduleVersionRequest }
  >({
    mutationFn: ({ versionId, data }) => scheduleApi.updateVersion(versionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE_VERSIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE_ACTIVE });
    },
  });
}

export function useUpdateCheckInMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<CheckInResponse>, ApiError, { checkinId: string; data: CreateCheckInRequest }>({
    mutationFn: ({ checkinId, data }) => scheduleApi.updateCheckIn(checkinId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE_CHECKINS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE_TODAY_CHECKIN });
    },
  });
}

export function useSubmitCheckInMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<CheckInResponse>, ApiError, CreateCheckInRequest>({
    mutationFn: scheduleApi.submitCheckIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE_CHECKINS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE_TODAY_CHECKIN });
    },
  });
}

export function useScheduleCheckInsQuery(limit = 30) {
  return useQuery<ApiResponse<CheckInResponse[]>, ApiError>({
    queryKey: [...QUERY_KEYS.SCHEDULE_CHECKINS, limit],
    queryFn: () => scheduleApi.listCheckIns(limit),
  });
}

export function useTodayCheckInQuery() {
  return useQuery<ApiResponse<CheckInResponse | null>, ApiError>({
    queryKey: QUERY_KEYS.SCHEDULE_TODAY_CHECKIN,
    queryFn: scheduleApi.getTodayCheckIn,
  });
}
