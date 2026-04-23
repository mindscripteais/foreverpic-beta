import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth')
  const isPublicRoute =
    nextUrl.pathname === '/' ||
    nextUrl.pathname.startsWith('/events/') ||
    nextUrl.pathname.startsWith('/signin') ||
    nextUrl.pathname.startsWith('/signup')

  const isStaticAsset =
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/static') ||
    nextUrl.pathname.startsWith('/favicon')

  if (isStaticAsset || isApiAuthRoute || isPublicRoute) {
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/signin', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
