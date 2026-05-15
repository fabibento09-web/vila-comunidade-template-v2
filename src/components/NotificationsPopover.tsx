import { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Bell, MessageCircle, UserPlus, Reply, Check, ShieldAlert } from 'lucide-react'
import { getAvisos, markAvisoAsRead, markAllAvisosAsRead } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { MembroAvatar } from './MembroAvatar'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'

export function NotificationsPopover() {
  const { user } = useAuth()
  const [avisos, setAvisos] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const loadAvisos = async () => {
    if (!user) return
    try {
      const res = await getAvisos(user.id)
      setAvisos(res.items)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadAvisos()
  }, [user])

  useRealtime(
    'avisos',
    () => {
      loadAvisos()
    },
    !!user,
  )

  const unreadCount = avisos.filter((a) => !a.lido).length

  const handleMarkAll = async () => {
    if (!user) return
    await markAllAvisosAsRead(user.id)
    loadAvisos()
  }

  const handleClick = async (aviso: any) => {
    if (!aviso.lido) {
      await markAvisoAsRead(aviso.id)
      setAvisos((prev) => prev.map((a) => (a.id === aviso.id ? { ...a, lido: true } : a)))
    }
    setOpen(false)

    if (aviso.tipo === 'comentario' || aviso.tipo === 'resposta') {
      navigate(`/p/${aviso.postagem}`)
    } else if (aviso.tipo === 'espaco_adicionado' && aviso.expand?.espaco?.slug) {
      navigate(`/e/${aviso.expand.espaco.slug}`)
    } else if (aviso.tipo === 'espaco_adicionado') {
      navigate(`/espacos`)
    }
  }

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'comentario':
        return <MessageCircle className="w-4 h-4 text-blue-500" />
      case 'resposta':
        return <Reply className="w-4 h-4 text-purple-500" />
      case 'espaco_adicionado':
        return <UserPlus className="w-4 h-4 text-green-500" />
      case 'role_upgrade':
        return <ShieldAlert className="w-4 h-4 text-orange-500" />
      case 'convite_aceito':
        return <Check className="w-4 h-4 text-emerald-500" />
      default:
        return <Bell className="w-4 h-4 text-mute" />
    }
  }

  const getMessage = (aviso: any) => {
    const name = aviso.expand?.ator?.name || 'Alguém'
    switch (aviso.tipo) {
      case 'comentario':
        return (
          <>
            <span className="font-medium text-ink">{name}</span> comentou na sua postagem.
          </>
        )
      case 'resposta':
        return (
          <>
            <span className="font-medium text-ink">{name}</span> respondeu ao seu comentário.
          </>
        )
      case 'espaco_adicionado':
        return (
          <>
            Você foi adicionado ao espaço{' '}
            <span className="font-medium text-ink">{aviso.expand?.espaco?.nome}</span>.
          </>
        )
      case 'role_upgrade':
        return <>Sua conta foi promovida!</>
      case 'convite_aceito':
        return (
          <>
            <span className="font-medium text-ink">{name}</span> aceitou o seu convite.
          </>
        )
      default:
        return aviso.texto || 'Nova notificação'
    }
  }

  if (!user) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="p-2 text-mute hover:text-ink transition-colors relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-warm animate-pulse" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 shadow-elevation rounded-xl border border-line flex flex-col max-h-[85vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-line bg-paper">
          <h3 className="font-medium text-ink">Notificações</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="text-xs text-warm hover:text-warm/80 font-medium"
            >
              Marcar tudo como lido
            </button>
          )}
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1 bg-background">
          {avisos.length === 0 ? (
            <div className="p-8 text-center text-mute text-sm">Nenhuma notificação ainda.</div>
          ) : (
            avisos.map((aviso) => (
              <button
                key={aviso.id}
                onClick={() => handleClick(aviso)}
                className={cn(
                  'w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors',
                  aviso.lido ? 'hover:bg-wash' : 'bg-wash hover:bg-line/50',
                )}
              >
                <div className="relative shrink-0 mt-0.5">
                  <MembroAvatar
                    name={aviso.expand?.ator?.name || 'U'}
                    avatarUrl={
                      aviso.expand?.ator?.avatar
                        ? getPublicFileUrl(aviso.expand.ator, aviso.expand.ator.avatar)
                        : undefined
                    }
                    role={aviso.expand?.ator?.role}
                    className="w-9 h-9"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-[3px] shadow-sm ring-1 ring-line/50">
                    {getIcon(aviso.tipo)}
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={cn('text-sm leading-snug', aviso.lido ? 'text-mute' : 'text-ink')}>
                    {getMessage(aviso)}
                  </p>
                  <span className="text-[11px] text-mute/70 mt-1.5 block font-medium">
                    {formatDistanceToNow(new Date(aviso.created), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                {!aviso.lido && <div className="w-2 h-2 rounded-full bg-warm shrink-0 mt-2" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
