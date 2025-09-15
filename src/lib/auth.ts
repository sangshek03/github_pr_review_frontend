import { cookies } from 'next/headers'

export interface AuthData {
  refreshToken: string
  accessToken: string
  user_id: string
  user_verified: boolean
}

export async function getAuthData(): Promise<AuthData | null> {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth-cookie')

    if (!authCookie?.value) {
      return null
    }

    let cookieValue = authCookie.value

    // If it starts with 'j:', it's JSON stringified by Express
    if (cookieValue.startsWith('j:')) {
      cookieValue = cookieValue.substring(2) // Remove 'j:' prefix
    }

    // URL decode the cookie value
    cookieValue = decodeURIComponent(cookieValue)

    const authData: AuthData = JSON.parse(cookieValue)
    return authData
  } catch (error) {
    console.error('Error parsing auth cookie:', error)
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const authData = await getAuthData()
  return authData !== null && authData.user_verified === true
}

export async function getUserId(): Promise<string | null> {
  const authData = await getAuthData()
  return authData?.user_id || null
}

export async function getAccessToken(): Promise<string | null> {
  const authData = await getAuthData()
  return authData?.accessToken || null
}