import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { MembroAvatar } from './MembroAvatar'
import { Bell, Search, Menu } from 'lucide-react'
import { cn, openLoginModal } from '@/lib/utils'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'
import { LoginModal } from './LoginModal'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { IdentitySidebarContent } from './IdentitySidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { NotificationsPopover } from './NotificationsPopover'

export function TopNav() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handler = () => setLoginOpen(true)
    document.addEventListener('open-login-modal', handler)
    return () => document.removeEventListener('open-login-modal', handler)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const scrollToFeatures = () => {
    document.getElementById('por-que-vila')?.scrollIntoView({ behavior: 'smooth' })
  }

  const isPublic = !user

  if (isPublic) {
    return (
      <>
        <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300 bg-background/80 backdrop-blur-md border-b border-line/50">
          <div className="container max-w-[1120px] mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-baseline gap-0.5">
              <span className="font-serif text-2xl font-bold text-ink tracking-tight leading-none">
                Vila
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-sage shrink-0" />
            </Link>
            <div className="flex items-center gap-4 sm:gap-6">
              <button
                onClick={scrollToFeatures}
                className="text-sm font-medium text-mute hover:text-ink transition-colors hidden sm:block"
              >
                Como funciona
              </button>
              <Button
                onClick={openLoginModal}
                className="bg-warm hover:bg-warm/90 text-white rounded-full px-6 font-medium"
              >
                Entrar
              </Button>
            </div>
          </div>
        </header>
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      </>
    )
  }

  const tabs = [
    { label: 'Início', to: '/feed' },
    { label: 'Espaços', to: '/espacos' },
    { label: 'Cursos', to: '/cursos' },
    { label: 'Membros', to: '/membros' },
    { label: 'Eventos', to: '/eventos' },
  ]

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 h-14 bg-paper border-b border-line">
        <div className="w-full max-w-[1280px] mx-auto h-full flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4 md:gap-8 h-full">
            <Sheet>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2 -ml-2 text-mute hover:text-ink transition-colors">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[300px] p-0 bg-background border-r border-line"
              >
                <DialogTitle className="sr-only">Navegação</DialogTitle>
                <IdentitySidebarContent />
              </SheetContent>
            </Sheet>

            <Link to="/feed" className="flex items-baseline gap-0.5">
              <span className="font-serif text-xl font-bold text-ink leading-none">Vila</span>
              <div className="w-1.5 h-1.5 rounded-full bg-sage shrink-0" />
            </Link>

            <nav className="hidden md:flex h-full items-center gap-6">
              {tabs.map((tab) => {
                const isActive =
                  location.pathname.startsWith(tab.to) ||
                  (tab.to === '/feed' && location.pathname === '/feed')
                return (
                  <Link
                    key={tab.label}
                    to={tab.to}
                    className={cn(
                      'h-full flex items-center text-sm font-medium transition-colors relative',
                      isActive ? 'text-ink' : 'text-mute hover:text-ink',
                    )}
                  >
                    {tab.label}
                    {isActive && (
                      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-sage rounded-t-full" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsPopover />

            <div className="h-4 w-px bg-line mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none focus:outline-none">
                  <MembroAvatar
                    name={user?.name || 'User'}
                    avatarUrl={user?.avatar ? getPublicFileUrl(user, user.avatar) : undefined}
                    role={user?.role}
                    className="w-8 h-8 cursor-pointer"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {' '}
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Logada como {user?.name}</p>
                    <p className="text-xs leading-none text-mute">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/u/${user?.id}`)}>
                  Meu perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/configuracoes/perfil')}>
                  Editar perfil
                </DropdownMenuItem>
                {user?.role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/configuracoes/vila')}>
                    Configurar Vila
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate('/rascunhos')}>
                  Rascunhos
                </DropdownMenuItem>{' '}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    signOut()
                    navigate('/')
                  }}
                >
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden shadow-elevation border-line gap-0">
          <DialogTitle className="sr-only">Busca Global</DialogTitle>
          <div className="flex items-center px-4 border-b border-line">
            <Search className="w-5 h-5 text-mute" />
            <input
              disabled
              placeholder="Busca em construção..."
              className="flex-1 h-14 bg-transparent outline-none px-3 text-ink placeholder:text-mute cursor-not-allowed"
            />
            <span className="text-[10px] text-mute font-mono border border-line px-1.5 py-0.5 rounded">
              ESC
            </span>
          </div>
          <div className="p-12 text-center text-mute text-sm">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
            A busca global estará disponível na próxima atualização.
          </div>
        </DialogContent>
      </Dialog>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  )
}
