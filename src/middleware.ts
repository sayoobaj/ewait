import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Allow access if authenticated
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow login and register pages without auth
        if (
          req.nextUrl.pathname === '/admin/login' ||
          req.nextUrl.pathname === '/admin/register'
        ) {
          return true
        }
        // Require auth for all other admin pages
        return !!token
      }
    }
  }
)

export const config = {
  matcher: ['/admin/:path*']
}
