import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import Cookies from "js-cookie"
import { useAuthStore } from "@/store/auth-store"

const api = axios.create({
  baseURL: "http://localhost:3002/api", // tambahkan /api
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get("auth_token")
    if (token && token !== "dummy") {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Temporarily disable logout on 401 to prevent redirect loop
    // if (error.response?.status === 401) {
    //   // Clear auth state on unauthorized
    //   useAuthStore.getState().logout()
    //   if (typeof window !== "undefined") {
    //     window.location.href = "/login"
    //   }
    // }
    return Promise.reject(error)
  },
)

export default api
