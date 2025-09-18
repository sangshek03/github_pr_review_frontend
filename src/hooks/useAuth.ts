"use client"

import { useState, useEffect } from 'react'

interface AuthData {
  refreshToken: string
  accessToken: string
  user_id: string
  user_verified: boolean
}

interface AuthState {
  isAuthenticated: boolean
  loading: boolean
  user: AuthData | null
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    user: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    const checkAuth = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL
        if (!baseUrl) {
          console.error('❌ Missing NEXT_PUBLIC_BACKEND_API_URL in env')
          setAuthState({ isAuthenticated: false, loading: false, user: null })
          return
        }

        console.log('🔍 Checking auth at:', `${baseUrl}/auth/me`)

        const res = await fetch(`${baseUrl}/auth/me`, {
          method: 'GET',
          credentials: 'include', // 🚨 send cookies
          signal: controller.signal,
        })

        console.log('📡 Auth response status:', res.status, res.statusText)

        if (!res.ok) {
          console.log('❌ Auth response not ok:', res.status)
          setAuthState({ isAuthenticated: false, loading: false, user: null })
          return
        }

        const data = await res.json()
        console.log('📦 Auth response data:', data)

        if (data?.user) {
          console.log('✅ User authenticated:', data.user.user_id)
          setAuthState({
            isAuthenticated: true,
            loading: false,
            user: data.user,
          })
        } else {
          console.log('⚠️ No user in response')
          setAuthState({ isAuthenticated: false, loading: false, user: null })
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('💥 Auth check failed:', error)
          setAuthState({ isAuthenticated: false, loading: false, user: null })
        }
      }
    }

    checkAuth()

    return () => controller.abort()
  }, [])

  return authState
}
