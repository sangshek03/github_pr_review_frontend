export interface AuthData {
  refreshToken: string;
  accessToken: string;
  user_id: string;
  user_verified: boolean;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // First try to get from the new auth endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    if (baseUrl) {
      // We'll return a placeholder for now and let the ChatService handle the async auth
      // This is a synchronous function, so we can't make async calls here
    }

    // Fallback to cookie-based auth
    const cookies = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-cookie='));

    if (!cookies) {
      return null;
    }

    let cookieValue = cookies.split('=')[1];

    // If it starts with 'j%3A', it's JSON stringified and URL encoded
    if (cookieValue.startsWith('j%3A')) {
      cookieValue = cookieValue.substring(4); // Remove 'j%3A' prefix (URL encoded 'j:')
    }

    // URL decode the cookie value
    cookieValue = decodeURIComponent(cookieValue);

    const authData: AuthData = JSON.parse(cookieValue);

    return authData.accessToken || null;
  } catch (error) {
    console.error('Error extracting auth token:', error);
    return null;
  }
}

export function getAuthData(): AuthData | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cookies = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-cookie='));

    if (!cookies) {
      return null;
    }

    let cookieValue = cookies.split('=')[1];

    // If it starts with 'j%3A', it's JSON stringified and URL encoded
    if (cookieValue.startsWith('j%3A')) {
      cookieValue = cookieValue.substring(4); // Remove 'j%3A' prefix (URL encoded 'j:')
    }

    // URL decode the cookie value
    cookieValue = decodeURIComponent(cookieValue);

    const authData: AuthData = JSON.parse(cookieValue);

    return authData;
  } catch (error) {
    console.error('Error extracting auth data:', error);
    return null;
  }
}