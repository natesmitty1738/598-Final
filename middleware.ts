import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

// Authentication-exempt paths
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/pricing',
  '/features',
  '/demo',
  '/terms',
  '/privacy',
  '/contact',
  '/api/auth/register',
  '/api/auth/[...nextauth]'
]

// Onboarding-exempt paths
const onboardingExemptPaths = [
  ...publicPaths,
  '/onboarding',
  '/api/onboarding/status',
  '/api/onboarding/progress',
  '/api/onboarding/complete'
]

// Permission-restricted routes
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

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({ req: request })
    
    if (!token) {
      return redirectToLogin(request)
    }
    
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

  const token = await getToken({ req: request })

  if (!token) {
    return redirectToLogin(request)
  }
  
  if (isOnboardingExempt(pathname)) {
    return NextResponse.next()
  }
  
  try {
    const hasCompletedOnboarding = await checkOnboardingStatus(token.id as string)
    
    if (!hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error)
  }
  
  // Admins can access everything
  const role = token.role as string
  if (role === 'ADMIN') {
    return NextResponse.next()
  }

  // Permission check for restricted routes
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
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Role-based access
  if (role === 'MANAGER') {
    return NextResponse.next() 
  }

  if (role === 'SALES_REP' && pathname.includes('/sales')) {
    return NextResponse.next() 
  }

  if (role === 'INVENTORY_MANAGER' && pathname.includes('/inventory')) {
    return NextResponse.next() 
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

async function checkOnboardingStatus(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/onboarding/status`, {
      headers: {
        'Cookie': `next-auth.session-token=${userId}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      
      if (data.completed === true) {
        // Verify all required steps are completed
        const requiredSteps = ['welcome', 'business-profile', 'inventory-setup', 'payment-setup', 'completion']
        const allStepsCompleted = requiredSteps.every(step => data.completedSteps?.includes(step))
        
        if (!allStepsCompleted) {
          console.log('Middleware detected completed flag is true but not all steps are done')
          return false
        }
        
        return true
      }
      
      return false
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
     * Match all request paths except static files, images, and favicon
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 