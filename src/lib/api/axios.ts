import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiError, TokenResponse, ApiResponse } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8003";

export const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach access token to every request
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Token refresh state ───────────────────────────────────────────────────────
let isRefreshing = false;
// Queue of callbacks waiting for the new access token
let refreshQueue: Array<(token: string | null) => void> = [];

function drainQueue(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

async function attemptRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;
  try {
    const res = await axios.post<ApiResponse<TokenResponse>>(
      `${API_BASE_URL}/api/v1/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );
    const { access_token, refresh_token: newRefresh } = res.data.data;
    localStorage.setItem("access_token", access_token);
    if (newRefresh) localStorage.setItem("refresh_token", newRefresh);
    return access_token;
  } catch {
    return null;
  }
}

// Response interceptor: on 401 try refresh once; on failure clear and redirect
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Another request is already refreshing — wait for it
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosInstance(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;
      const newToken = await attemptRefresh();
      isRefreshing = false;

      if (newToken) {
        drainQueue(newToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return axiosInstance(originalRequest);
      }

      // Refresh failed — clear tokens and let the app handle redirect
      drainQueue(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }

    const apiError: ApiError = error.response?.data ?? {
      status_code: error.response?.status ?? 500,
      message: error.message || "An unexpected error occurred",
      data: null,
    };

    return Promise.reject(apiError);
  }
);

export default axiosInstance;
