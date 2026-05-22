import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(req) {
  const { nextUrl } = req
  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  const isLoggedIn = !!token

  const isAuthPage = nextUrl.pathname === "/login"
  const isDashboard = nextUrl.pathname.startsWith("/dashboard")
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth")

  if (isApiAuth) {
    return NextResponse.next()
  }

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
    return NextResponse.next()
  }

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
}
