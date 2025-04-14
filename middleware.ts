import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

// Paths that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/pricing',
  '/features',
  '/demo',
  '/api/auth/register',
  '/api/auth/[...nextauth]'
]

// Paths that don't require onboarding completion
const onboardingExemptPaths = [
  ...publicPaths,
  '/onboarding',
  '/api/onboarding/status',
  '/api/onboarding/progress',
  '/api/onboarding/complete'
]

// Routes that require specific permissions
const restrictedRoutes: Record<string, string[]> = {
  '/inventory': ['MANAGE_INVENTORY'],
  '/api/inventory': ['MANAGE_INVENTORY'],
  '/sales': ['MANAGE_SALES'],
  '/api/sales': ['MANAGE_SALES'],
  '/reports': ['VIEW_REPORTS'],
  '/api/reports': ['VIEW_REPORTS'],
  '/analytics': ['VIEW_ANALYTICS'],
  '/api/analytics': ['VIEW_ANALYTICS'],
  '/api/employees': ['MANAGE_EMPLOYEES'],
  '/settings': ['MANAGE_SETTINGS'],
  '/api/settings': ['MANAGE_SETTINGS'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is public
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Get the user's token
  const token = await getToken({ req: request })

  // If there's no token, redirect to login
  if (!token) {
    return redirectToLogin(request)
  }
  
  // Admin users have access to everything
  const role = token.role as string
  if (role === 'ADMIN') {
    return NextResponse.next()
  }

  // For employees, check if they have the required permissions for restricted routes
  const userPermissions = token.permissions as string[] || []
  const restrictedPath = Object.keys(restrictedRoutes).find(route => 
    pathname.startsWith(route)
  )

  if (restrictedPath) {
    const requiredPermissions = restrictedRoutes[restrictedPath]
    const hasPermission = requiredPermissions.some((permission: string) => 
      userPermissions.includes(permission)
    )

    if (!hasPermission) {
      // Redirect to dashboard or show error
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Grant automatic permissions based on role
  if (role === 'MANAGER') {
    return NextResponse.next() // Managers can access everything except what's explicitly denied
  }

  if (role === 'SALES_REP' && pathname.includes('/sales')) {
    return NextResponse.next() // Sales reps can access sales pages
  }

  if (role === 'INVENTORY_MANAGER' && pathname.includes('/inventory')) {
    return NextResponse.next() // Inventory managers can access inventory pages
  }

  // If the path is exempt from onboarding check, proceed
  if (isOnboardingExempt(pathname)) {
    return NextResponse.next()
  }

  // Check if the user has completed onboarding
  try {
    const hasCompletedOnboarding = await checkOnboardingStatus(token.id as string)
    
    if (!hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error)
  }

  return NextResponse.next()
}

// Helper functions
function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => pathname.startsWith(path))
}

function isOnboardingExempt(pathname: string): boolean {
  return onboardingExemptPaths.some(path => pathname.startsWith(path))
}

function redirectToLogin(request: NextRequest) {
  const url = new URL('/login', request.url)
  url.searchParams.set('callbackUrl', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

// Function to check if a user has completed onboarding
async function checkOnboardingStatus(userId: string): Promise<boolean> {
  try {
    // Make an API call to check onboarding status
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/onboarding/status`, {
      headers: {
        'Cookie': `next-auth.session-token=${userId}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      return data.completed === true
    }

    return false
  } catch (error) {
    console.error('Error fetching onboarding status:', error)
    return false
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 