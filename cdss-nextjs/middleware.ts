import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token    = req.nextauth.token
    const role     = token?.role as string | undefined
    const pathname = req.nextUrl.pathname

    // Halaman /patients hanya untuk ADMIN
    if (pathname.startsWith('/patients') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/screening', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/screening/:path*',
    '/history/:path*',
    '/profile/:path*',
    '/patients/:path*',
  ],
}