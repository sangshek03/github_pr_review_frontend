import { NextRequest, NextResponse } from "next/server"

function isAuthenticated(req: NextRequest): boolean {
  try {
    const authCookie = req.cookies.get('auth-cookie')

    if (!authCookie?.value) {
      return false
    }

    // Backend sets the cookie as JSON, but it gets URL encoded
    let cookieValue = authCookie.value

    // If it starts with 'j:', it's JSON stringified by Express
    if (cookieValue.startsWith('j:')) {
      cookieValue = cookieValue.substring(2) // Remove 'j:' prefix
    }

    // URL decode the cookie value
    cookieValue = decodeURIComponent(cookieValue)

    const authData = JSON.parse(cookieValue)
    return authData && authData.user_verified === true
  } catch (error) {
    console.error('Error parsing auth cookie in middleware:', error)
    return false
  }
}

export function middleware(req: NextRequest) {
  const isAuth = isAuthenticated(req)
  const isAuthPage = req.nextUrl.pathname === "/login"
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard")

  // If user is authenticated and tries to access login page, redirect to dashboard
  if (isAuthPage && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // If user is not authenticated and tries to access protected route, redirect to login
  if (isProtectedRoute && !isAuth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"]
}