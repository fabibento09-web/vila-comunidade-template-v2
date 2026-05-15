import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getEspacoBySlug, getPostagensByEspaco } from '@/services/api'
import { PostagemCard } from '@/components/PostagemCard'
import { Button } from '@/components/ui/button'
import { Loader2, Settings, UserPlus } from 'lucide-react'
import { useComposer } from '@/hooks/use-composer'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { ManageSpaceModal } from '@/components/ManageSpaceModal'

export default function SpacePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openComposer } = useComposer()
  const [espaco, setEspaco] = useState<any>(null)
  const [postagens, setPostagens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [manageOpen, setManageOpen] = useState(false)

  useEffect(() => {
    async function load() {
      if (!slug) return
      setLoading(true)
      try {
        const esp = await getEspacoBySlug(slug)
        if (esp) {
          const userRole = user?.role || 'membro'
          let hasAccess = false

          if (userRole === 'admin') hasAccess = true
          else if (esp.tipo === 'aberto' || !esp.tipo) hasAccess = true
          else if (esp.tipo === 'pago' && userRole === 'pro') hasAccess = true
          else if (esp.tipo === 'restrito' && user) {
            try {
              await pb
                .collection('espaco_membros')
                .getFirstListItem(`espaco="${esp.id}" && user="${user.id}"`)
              hasAccess = true
            } catch (err) {
              hasAccess = false
            }
          }

          if (!hasAccess) {
            toast.error('Você não tem permissão para acessar este espaço.')
            navigate('/feed', { replace: true })
            return
          }

          setEspaco(esp)
          const visits = JSON.parse(localStorage.getItem('space_visits') || '{}')
          visits[esp.slug] = Date.now()
          localStorage.setItem('space_visits', JSON.stringify(visits))

          const res = await getPostagensByEspaco(esp.id)
          setPostagens(res.items)
        } else {
          setEspaco(null)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <main className="max-w-[760px] mx-auto w-full flex justify-center pt-20">
        <Loader2 className="animate-spin text-mute w-8 h-8" />
      </main>
    )
  }

  if (!espaco) {
    return (
      <main className="max-w-[760px] mx-auto w-full pt-20 text-center text-mute">
        Espaço não encontrado.
      </main>
    )
  }

  return (
    <main className="max-w-[760px] mx-auto w-full pb-24">
      <div className="mb-8 text-center px-4">
        <div className="text-5xl mb-4">{espaco.emoji || '💬'}</div>
        <div className="font-mono text-xs uppercase tracking-widest mb-2">
          {espaco.tipo === 'restrito' ? (
            <span className="text-mute">ESPAÇO · 🔒 RESTRITO</span>
          ) : espaco.tipo === 'pago' ? (
            <span className="text-warm">ESPAÇO · ✨ PRO</span>
          ) : (
            <span className="text-sage">ESPAÇO</span>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <h1 className="font-serif text-3xl font-bold text-ink mb-0">{espaco.nome}</h1>
          {user?.role === 'admin' && espaco.tipo === 'restrito' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManageOpen(true)}
              className="ml-2 border-sage text-sage hover:bg-sage hover:text-paper transition-colors gap-2 rounded-full h-8 px-3"
            >
              <UserPlus className="w-4 h-4" />
              Adicionar membros
            </Button>
          )}
          {user?.role === 'admin' && espaco.tipo !== 'restrito' && (
            <button
              onClick={() => setManageOpen(true)}
              className="p-2 text-mute hover:text-paper transition-colors bg-wash rounded-full"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-ink/80 italic text-lg mb-4 leading-relaxed max-w-lg mx-auto">
          "{espaco.descricao || 'Um espaço para conversas e trocas.'}"
        </p>
        <div className="font-mono text-xs uppercase tracking-wider text-mute mb-8">
          {postagens.length} postagens · {espaco.membros_count || 0} membros aqui
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-sage opacity-40" />
          <div className="w-1.5 h-1.5 rounded-full bg-sage opacity-60" />
          <div className="w-1.5 h-1.5 rounded-full bg-sage opacity-40" />
        </div>

        <Button
          className="bg-warm hover:bg-warm/90 text-white rounded-full px-6"
          onClick={() => openComposer(espaco.id)}
        >
          Nova postagem
        </Button>
      </div>

      <div className="space-y-6">
        {postagens.length === 0 ? (
          <div className="text-center py-12 text-mute border border-dashed border-line rounded-xl">
            Nenhuma postagem neste espaço ainda.
          </div>
        ) : (
          postagens.map((post) => <PostagemCard key={post.id} post={post} />)
        )}
      </div>

      {espaco && <ManageSpaceModal space={espaco} open={manageOpen} onOpenChange={setManageOpen} />}
    </main>
  )
}
