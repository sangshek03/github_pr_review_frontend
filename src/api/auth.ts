import { apiClient, ApiResponse } from './api'

// Auth related types
export interface LoginRequest {
  email: string
  password: string
}

export interface SignUpRequest {
  f_name: string
  l_name: string
  email: string
  phone: string
  password: string
}

export interface AuthUser {
  user_id: string
  email: string
  f_name: string
  l_name: string
  phone: string
  user_verified: boolean
}

export interface AuthResponse {
  success: boolean
  message?: string
  data?: AuthUser
}

// Auth API functions
export const authApi = {
  // Login with email and password
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth', credentials)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  },

  // Sign up new user
  signUp: async (userData: SignUpRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/users', userData)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Sign up failed')
    }
  },

  // Get current user profile
  getProfile: async (): Promise<AuthUser> => {
    try {
      const response = await apiClient.get<ApiResponse<AuthUser>>('/auth/profile')
      return response.data.data!
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get profile')
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Logout failed')
    }
  },

  // Google OAuth redirect URL
  getGoogleAuthUrl: (): string => {
    return `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/google`
  },
}

export default authApi