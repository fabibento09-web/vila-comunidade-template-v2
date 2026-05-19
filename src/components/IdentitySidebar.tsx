import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getEspacos, getVilaInfo } from '@/services/api'
import { MembroAvatar } from './MembroAvatar'
import { Button } from './ui/button'
import { Loader2, Plus, Pencil, Home, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'
import { CreateEspacoModal } from './CreateEspacoModal'
import { InviteModal } from './InviteModal'
import { useAuth } from '@/hooks/use-auth'
import { useVilaStats } from '@/hooks/use-vila-stats'
import { useRealtime } from '@/hooks/use-realtime'

function SmallDivider() {
  return (
    <div className="flex items-center justify-center gap-1.5 mt-5 mb-4">
      <div className="w-1 h-1 rounded-full bg-sage opacity-40" />
      <div className="w-1 h-1 rounded-full bg-sage opacity-60" />
      <div className="w-1 h-1 rounded-full bg-sage opacity-40" />
    </div>
  )
}

export function IdentitySidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const location = useLocation()
  const { user } = useAuth()
  const [vila, setVila] = useState<any>(null)
  const [espacos, setEspacos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createEspacoOpen, setCreateEspacoOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [draftsCount, setDraftsCount] = useState(0)
  const [draggedSpace, setDraggedSpace] = useState<string | null>(null)
  const [dragOverSpace, setDragOverSpace] = useState<string | null>(null)

  const { memberCount, ageLabel } = useVilaStats(vila?.id)

  const loadData = async () => {
    try {
      const v = await getVilaInfo()
      if (v) {
        setVila(v)
        const e = await getEspacos(v.id)

        const posts = await pb.collection('postagens').getFullList({ filter: 'status="publicado"' })
        const lastVisits = JSON.parse(localStorage.getItem('space_visits') || '{}')

        let userEspacoMembros: any[] = []
        if (user) {
          userEspacoMembros = await pb
            .collection('espaco_membros')
            .getFullList({ filter: `user="${user.id}"` })
        }

        const visibleEspacos = e.filter((esp) => {
          if (!user) return esp.tipo === 'aberto' || !esp.tipo
          if (user.role === 'admin') return true

          const override = userEspacoMembros.find((m) => m.espaco === esp.id)
          if (override) return !override.bloqueado

          if (esp.tipo === 'aberto' || !esp.tipo) return true
          if (esp.tipo === 'pago' && user.role === 'pro') return true
          return false
        })

        const espacosWithMetrics = visibleEspacos.map((esp) => {
          const spacePosts = posts.filter((p: any) => p.espaco === esp.id)
          const lastVisit = lastVisits[esp.slug] || 0
          const unread = spacePosts.filter(
            (p: any) => new Date(p.created).getTime() > lastVisit,
          ).length
          return { ...esp, postagens_count: spacePosts.length, nao_lidos: unread }
        })

        let sortedEspacos = espacosWithMetrics
        const savedOrderStr = user ? localStorage.getItem(`vila_espaco_order_${user.id}`) : null
        if (savedOrderStr) {
          try {
            const savedOrder = JSON.parse(savedOrderStr)
            sortedEspacos.sort((a, b) => {
              const indexA = savedOrder.indexOf(a.id)
              const indexB = savedOrder.indexOf(b.id)
              if (indexA === -1 && indexB === -1) return 0
              if (indexA === -1) return 1
              if (indexB === -1) return -1
              return indexA - indexB
            })
          } catch {
            /* intentionally ignored */
          }
        }

        setEspacos(sortedEspacos)
      }

      if (user) {
        const drafts = await pb.collection('postagens').getList(1, 1, {
          filter: `autor="${user.id}" && (status="rascunho" || status="agendado")`,
        })
        setDraftsCount(drafts.totalItems)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedSpace(id)
    e.dataTransfer.effectAllowed = 'move'
    const target = e.target as HTMLElement
    setTimeout(() => {
      target.classList.add('opacity-40')
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedSpace(null)
    setDragOverSpace(null)
    const target = e.target as HTMLElement
    target.classList.remove('opacity-40')
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedSpace && draggedSpace !== id) {
      setDragOverSpace(id)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverSpace(null)
  }

  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (!draggedSpace || draggedSpace === id) {
      setDragOverSpace(null)
      return
    }

    const newEspacos = [...espacos]
    const draggedIndex = newEspacos.findIndex((esp) => esp.id === draggedSpace)
    const dropIndex = newEspacos.findIndex((esp) => esp.id === id)

    const [removed] = newEspacos.splice(draggedIndex, 1)
    newEspacos.splice(dropIndex, 0, removed)

    setEspacos(newEspacos)
    if (user) {
      localStorage.setItem(
        `vila_espaco_order_${user.id}`,
        JSON.stringify(newEspacos.map((esp) => esp.id)),
      )
    }
    setDragOverSpace(null)
    setDraggedSpace(null)
  }

  useRealtime('vilas', (e) => {
    if (vila && e.record.id === vila.id) {
      setVila(e.record)
    }
  })

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center pt-20">
        <Loader2 className="animate-spin text-mute" />
      </div>
    )
  }

  if (!vila) return null

  return (
    <div className="w-full flex flex-col gap-4 custom-scrollbar pb-8 p-4 lg:p-4">
      {/* Village Identity Card */}
      <div className="bg-paper/55 backdrop-blur-xl rounded-2xl border border-white/50 overflow-hidden shadow-subtle shrink-0">
        <div className="h-24 bg-wash relative border-b border-line/50">
          {vila.cover ? (
            <img
              src={getPublicFileUrl(vila, vila.cover)}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full bg-noise"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, hsl(99,11%,82%) 0%, hsl(75,14%,93%) 60%, hsl(19,53%,88%) 100%)',
              }}
            />
          )}
        </div>
        <div className="px-5 pb-5 relative">
          <MembroAvatar
            name={vila.nome}
            avatarUrl={vila.avatar ? getPublicFileUrl(vila, vila.avatar) : undefined}
            className="w-16 h-16 border-4 border-paper absolute -top-8 left-4 text-xl bg-paper"
          />
          <div className="pt-10">
            <h2 className="font-serif font-semibold text-lg text-ink leading-tight flex items-center gap-1.5">
              {vila.nome}
              {vila.verificada && (
                <svg className="w-4 h-4 text-sage" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
            </h2>
            <p className="text-sm text-ink italic mt-2 opacity-90 leading-relaxed">"{vila.bio}"</p>

            <SmallDivider />

            <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-mute flex-wrap">
              <span>
                {memberCount === 1 ? '1 MEMBRO' : `${memberCount} MEMBROS`} · {ageLabel}{' '}
                {vila.cidade ? `· ${vila.cidade}` : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Status Card */}
      {vila.status_dia && (
        <div className="bg-paper/55 backdrop-blur-xl rounded-2xl border border-white/50 shadow-subtle p-4 text-center shrink-0">
          <h3 className="font-mono text-xs uppercase tracking-widest text-mute mb-2">
            Status do dia
          </h3>
          <p className="text-sm text-ink font-medium italic">"{vila.status_dia}"</p>
        </div>
      )}

      {/* Spaces Card */}
      <div className="bg-paper/55 backdrop-blur-xl rounded-2xl border border-white/50 shadow-subtle p-3 shrink-0">
        <div className="flex items-center justify-between mb-3 px-2 mt-1">
          <h3 className="font-mono text-xs uppercase tracking-widest text-mute">Espaços</h3>
          {(user?.role === 'admin' || user?.role === 'pro') && (
            <button
              onClick={() => setCreateEspacoOpen(true)}
              className="p-1 hover:bg-wash rounded-md text-mute hover:text-ink transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <Link
            to="/feed"
            onClick={onItemClick}
            className={cn(
              'flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-wash transition-colors text-left group mb-1',
              location.pathname === '/feed' && 'bg-sage/10',
            )}
          >
            <div className="flex items-center gap-3 text-sage">
              <Home className="w-4 h-4" />
              <span
                className={cn(
                  'text-sm font-medium group-hover:text-ink',
                  location.pathname === '/feed' ? 'text-ink' : 'text-ink/80',
                )}
              >
                Início
              </span>
            </div>
          </Link>

          {espacos.map((e) => {
            const isActive = location.pathname === `/e/${e.slug}`
            const isOver = dragOverSpace === e.id
            return (
              <div
                key={e.id}
                draggable={!!user}
                onDragStart={(ev) => handleDragStart(ev, e.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(ev) => handleDragOver(ev, e.id)}
                onDragLeave={handleDragLeave}
                onDrop={(ev) => handleDrop(ev, e.id)}
                className={cn(
                  'relative flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-wash transition-all text-left group/space',
                  !!user && 'cursor-grab active:cursor-grabbing',
                  isActive && 'bg-sage/10',
                  isOver && 'ring-2 ring-sage ring-inset z-10',
                )}
              >
                {!!user && (
                  <div className="absolute left-0 opacity-0 group-hover/space:opacity-100 transition-opacity -ml-2 text-mute/50 flex items-center justify-center h-full">
                    <GripVertical className="w-3 h-3" />
                  </div>
                )}
                <Link
                  to={e.slug ? `/e/${e.slug}` : '/espacos'}
                  onClick={onItemClick}
                  className="flex-1 flex items-center gap-3 overflow-hidden pointer-events-auto"
                >
                  <span className="text-base shrink-0">{e.emoji}</span>
                  <span
                    className={cn(
                      'text-sm font-medium group-hover/space:text-ink truncate',
                      isActive ? 'text-ink' : 'text-ink/80',
                    )}
                  >
                    {e.nome}
                  </span>
                </Link>
                {e.nao_lidos > 0 && (
                  <span className="bg-warm text-white text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse shrink-0 ml-2">
                    {e.nao_lidos}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Drafts Card */}
      <div className="bg-paper/55 backdrop-blur-xl rounded-2xl border border-white/50 shadow-subtle p-2 shrink-0">
        <Link
          to="/rascunhos"
          onClick={onItemClick}
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-wash transition-colors text-left group',
            location.pathname === '/rascunhos' && 'bg-sage/10',
          )}
        >
          <div className="flex items-center gap-3 text-mute group-hover:text-ink">
            <Pencil className="w-4 h-4" />
            <span
              className={cn(
                'text-sm font-medium',
                location.pathname === '/rascunhos' ? 'text-ink' : '',
              )}
            >
              Meus rascunhos
            </span>
          </div>
          {draftsCount > 0 && (
            <span className="bg-sage/10 text-sage text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {draftsCount}
            </span>
          )}
        </Link>
      </div>

      {/* Invite CTA */}
      {(user?.role === 'admin' || user?.role === 'pro') && (
        <div className="shrink-0 mt-2">
          <Button
            variant="outline"
            onClick={() => setInviteOpen(true)}
            className="w-full border-dashed border-2 border-line text-mute hover:text-ink hover:border-sage bg-paper/20 backdrop-blur-md hover:bg-sage/10 transition-all rounded-2xl"
          >
            Convidar pra Vila
          </Button>
        </div>
      )}

      <CreateEspacoModal
        open={createEspacoOpen}
        onOpenChange={setCreateEspacoOpen}
        vilaId={vila.id}
        onSuccess={loadData}
      />
      <InviteModal open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}
