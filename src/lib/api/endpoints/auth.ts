import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/api/axios";
import type {
  ApiError,
  ApiResponse,
  TokenResponse,
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
} from "@/types";
import { QUERY_KEYS } from "@/lib/api/queryKeys";

// ── API FUNCTIONS ───────────────────────────────────────────

export const authApi = {
  register: (data: RegisterRequest) =>
    axiosInstance
      .post<ApiResponse<{ message: string }>>("/auth/register", data)
      .then((r) => r.data),

  verifyEmail: (token: string) =>
    axiosInstance
      .post<ApiResponse<{ message: string }>>("/auth/verify-email", { token })
      .then((r) => r.data),

  resendOtp: (email: string) =>
    axiosInstance
      .post<ApiResponse<{ message: string }>>("/auth/resend-otp", { email })
      .then((r) => r.data),

  login: (data: LoginRequest) =>
    axiosInstance
      .post<ApiResponse<TokenResponse>>("/auth/login", data)
      .then((r) => r.data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    axiosInstance
      .post<ApiResponse<{ message: string }>>("/auth/forgot-password", data)
      .then((r) => r.data),

  resetPassword: (data: ResetPasswordRequest) =>
    axiosInstance
      .post<ApiResponse<{ message: string }>>("/auth/reset-password", data)
      .then((r) => r.data),
};

// ── REACT QUERY HOOKS ───────────────────────────────────────

export function useCurrentUserQuery() {
  return useQuery<ApiResponse<User>, ApiError>({
    queryKey: QUERY_KEYS.AUTH_ME,
    queryFn: () =>
      axiosInstance.get<ApiResponse<User>>("/auth/me").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if ((error as ApiError).status_code === 401) return false;
      return failureCount < 2;
    },
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<TokenResponse>, ApiError, LoginRequest>({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      localStorage.setItem("access_token", data.data.access_token);
      localStorage.setItem("refresh_token", data.data.refresh_token);
      // Pre-populate the AUTH_ME cache so no extra network call is needed right after login
      queryClient.setQueryData(QUERY_KEYS.AUTH_ME, {
        status_code: data.status_code,
        message: data.message,
        data: data.data.user,
      });
    },
  });
}

export function useRegisterMutation() {
  return useMutation<ApiResponse<{ message: string }>, ApiError, RegisterRequest>({
    mutationFn: authApi.register,
  });
}

export function useVerifyEmailMutation() {
  return useMutation<ApiResponse<{ message: string }>, ApiError, string>({
    mutationFn: authApi.verifyEmail,
  });
}

export function useResendOtpMutation() {
  return useMutation<ApiResponse<{ message: string }>, ApiError, string>({
    mutationFn: authApi.resendOtp,
  });
}

export function useForgotPasswordMutation() {
  return useMutation<ApiResponse<{ message: string }>, ApiError, ForgotPasswordRequest>({
    mutationFn: authApi.forgotPassword,
  });
}

export function useResetPasswordMutation() {
  return useMutation<ApiResponse<{ message: string }>, ApiError, ResetPasswordRequest>({
    mutationFn: authApi.resetPassword,
  });
}
