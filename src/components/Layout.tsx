import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { TopNav } from './TopNav'
import { IdentitySidebarContent } from './IdentitySidebar'
import { AuroraBackground } from './AuroraBackground'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  const isPublicRoute = location.pathname === '/'

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      navigate('/', { replace: true })
    }
  }, [loading, user, isPublicRoute, navigate])

  if (loading) {
    return (
      <div className="min-h-screen text-foreground font-sans flex flex-col relative items-center justify-center">
        <AuroraBackground />
        <Loader2 className="w-8 h-8 animate-spin text-mute z-10" />
      </div>
    )
  }

  if (!user && !isPublicRoute) {
    return null
  }

  const showSidebar = !isPublicRoute

  return (
    <div className="min-h-screen text-foreground font-sans flex flex-col relative">
      <AuroraBackground />
      <TopNav />
      <div className="flex-1 flex flex-col pt-14">
        {showSidebar ? (
          <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 py-6 flex gap-10 items-start">
            <aside className="w-[300px] shrink-0 hidden lg:flex flex-col sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto custom-scrollbar">
              <IdentitySidebarContent />
            </aside>
            <div className="flex-1 min-w-0">
              <Outlet />
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  )
}
