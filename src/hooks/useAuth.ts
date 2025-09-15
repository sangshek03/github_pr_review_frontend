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
  user: { id: string } | null
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    user: null,
  })

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Get cookie on client side
        const cookies = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-cookie='))

        if (!cookies) {
          setAuthState({
            isAuthenticated: false,
            loading: false,
            user: null,
          })
          return
        }

        let cookieValue = cookies.split('=')[1]

        // If it starts with 'j%3A', it's JSON stringified and URL encoded
        if (cookieValue.startsWith('j%3A')) {
          cookieValue = cookieValue.substring(4) // Remove 'j%3A' prefix (URL encoded 'j:')
        }

        // URL decode the cookie value
        cookieValue = decodeURIComponent(cookieValue)

        const authData: AuthData = JSON.parse(cookieValue)

        if (authData && authData.user_verified) {
          setAuthState({
            isAuthenticated: true,
            loading: false,
            user: { id: authData.user_id },
          })
        } else {
          setAuthState({
            isAuthenticated: false,
            loading: false,
            user: null,
          })
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setAuthState({
          isAuthenticated: false,
          loading: false,
          user: null,
        })
      }
    }

    checkAuth()

    // Listen for storage events to detect auth changes in other tabs
    const handleStorageChange = () => {
      checkAuth()
    }

    // Listen for cookie changes
    const interval = setInterval(checkAuth, 1000)

    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return authState
}

export function logout() {
  // Clear the auth cookie
  document.cookie = 'auth-cookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict'
  // Redirect to login
  window.location.href = '/login'
}