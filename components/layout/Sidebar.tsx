import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  FileText,
  User,
  Wand2,
  Users,
  Home,
  PieChart,
  Upload,
  Database
} from 'lucide-react'

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Sales', href: '/sales', icon: ShoppingCart },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Data Import', href: '/data-import', icon: Database },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/profile', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [navigation, setNavigation] = useState(navigationItems)
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  // Check if onboarding is complete
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/onboarding/status')
        if (response.ok) {
          const { complete } = await response.json()
          setOnboardingComplete(complete)
          
          // Add or remove Setup Wizard based on onboarding status
          if (!complete) {
            // Add Setup Wizard if not in the navigation items
            if (!navigation.some(item => item.name === 'Setup Wizard')) {
              setNavigation([...navigationItems, { name: 'Setup Wizard', href: '/onboarding', icon: Wand2 }])
            }
          } else {
            // Remove Setup Wizard if in the navigation items
            setNavigation(navigationItems)
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      }
    }
    
    if (session?.user) {
      checkOnboardingStatus()
    }
  }, [session, navigation])

  // If this is an admin user, show employee management
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      setNavigation(prev => {
        if (!prev.some(item => item.name === 'Employees')) {
          return [...prev, { name: 'Employees', href: '/employees', icon: Users }]
        }
        return prev
      })
    }
  }, [session])

  return (
    <div className="flex w-64 flex-col bg-white shadow-lg">
      <div className="flex h-16 items-center justify-center border-b">
        <h1 className="text-xl font-bold text-gray-800">MerchX</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
      {session?.user && (
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 