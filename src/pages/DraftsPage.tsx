import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getDrafts, deletePostagem } from '@/services/api'
import { useComposer } from '@/hooks/use-composer'
import { Clock, FileText, Pencil, Trash } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function DraftsPage() {
  const { user } = useAuth()
  const { openComposer } = useComposer()
  const [drafts, setDrafts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadDrafts = async () => {
    if (!user) return
    try {
      const data = await getDrafts(user.id)
      setDrafts(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDrafts()
    window.addEventListener('focus', loadDrafts)
    return () => window.removeEventListener('focus', loadDrafts)
  }, [user])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Tem certeza que deseja apagar este rascunho?')) return

    const tid = toast.loading('Apagando...')
    try {
      await deletePostagem(id)
      setDrafts(drafts.filter((d) => d.id !== id))
      toast.success('Rascunho apagado', { id: tid })
    } catch {
      toast.error('Erro ao apagar rascunho', { id: tid })
    }
  }

  return (
    <main className="flex-1 max-w-[760px] pb-20">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="font-serif text-3xl font-bold text-ink">Rascunhos e Agendados</h1>
          <div className="flex gap-1 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sage" />
            <div className="w-1.5 h-1.5 rounded-full bg-sage/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-sage/30" />
          </div>
        </div>
        <p className="text-mute">Gerencie suas postagens em andamento.</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-wash rounded-xl" />
          ))}
        </div>
      ) : drafts.length === 0 ? (
        <div className="bg-wash/50 border border-line rounded-2xl flex flex-col items-center justify-center p-12 text-center">
          <FileText className="w-12 h-12 text-mute mb-4" />
          <h3 className="font-serif text-xl font-bold text-ink mb-2">Nada por aqui ainda</h3>
          <p className="text-mute mb-6 max-w-sm">
            Quando você começar a escrever uma postagem e não publicar, ela aparecerá aqui.
          </p>
          <Button
            onClick={() => openComposer()}
            className="bg-warm hover:bg-warm/90 text-white rounded-full px-6"
          >
            Escrever uma postagem
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((post) => (
            <div
              key={post.id}
              onClick={() => openComposer(post.espaco, post.id)}
              className="group relative bg-paper border border-line rounded-xl p-5 hover:border-sage/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                      post.status === 'agendado' ? 'bg-sage/10 text-sage' : 'bg-wash text-mute',
                    )}
                  >
                    {post.status}
                  </span>
                  {post.expand?.espaco && (
                    <div className="flex items-center gap-1.5 text-sm text-mute">
                      <span>{post.expand.espaco.emoji}</span>
                      <span>{post.expand.espaco.nome}</span>
                    </div>
                  )}
                  <span className="text-sm text-mute/50">•</span>
                  <span className="text-sm text-mute">
                    editado há {formatDistanceToNow(new Date(post.updated), { locale: ptBR })}
                  </span>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openComposer(post.espaco, post.id)
                    }}
                    className="p-1.5 text-mute hover:text-sage hover:bg-sage/10 rounded-md transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(post.id, e)}
                    className="p-1.5 text-mute hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-serif text-xl font-bold text-ink mb-2">
                {post.titulo || <span className="italic font-normal text-mute">Sem título</span>}
              </h3>

              <p className="text-mute line-clamp-2 text-sm leading-relaxed mb-4">
                {post.corpo || '...'}
              </p>

              {post.status === 'agendado' && post.agendado_para && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-sage">
                  <Clock className="w-4 h-4" />
                  Publica em{' '}
                  {format(new Date(post.agendado_para), "dd 'de' MMM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
