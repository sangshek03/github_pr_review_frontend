import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  withCredentials: true, // Include cookies in requests
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    // const token = localStorage.getItem('authToken')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }

    if (error.response?.status === 403) {
      // Forbidden
      console.error('Access forbidden')
    }
// @ts-ignore
    if (error.response?.status >= 500) {
      // Server error
      // @ts-ignore
      console.error('Server error:', error.response.data)
    }

    return Promise.reject(error)
  }
)

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// Generic API methods
export const apiClient = {
  get: <T = any>(url: string, config = {}): Promise<AxiosResponse<T>> =>
    api.get(url, config),

  post: <T = any>(url: string, data = {}, config = {}): Promise<AxiosResponse<T>> =>
    api.post(url, data, config),

  put: <T = any>(url: string, data = {}, config = {}): Promise<AxiosResponse<T>> =>
    api.put(url, data, config),

  patch: <T = any>(url: string, data = {}, config = {}): Promise<AxiosResponse<T>> =>
    api.patch(url, data, config),

  delete: <T = any>(url: string, config = {}): Promise<AxiosResponse<T>> =>
    api.delete(url, config),
}

export default api