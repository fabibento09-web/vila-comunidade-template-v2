import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Link } from 'react-router-dom'
import { CreateEspacoModal } from '@/components/CreateEspacoModal'
import { Button } from '@/components/ui/button'
import { Plus, Lock, Sparkles, Users } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function SpacesListPage() {
  const { user } = useAuth()
  const [espacos, setEspacos] = useState<any[]>([])
  const [createOpen, setCreateOpen] = useState(false)

  const loadEspacos = async () => {
    try {
      const e = await pb.collection('espacos').getFullList({ sort: 'nome' })
      const posts = await pb.collection('postagens').getFullList({ filter: 'status="publicado"' })
      const lastVisits = JSON.parse(localStorage.getItem('space_visits') || '{}')

      let userEspacoMembros: string[] = []
      if (user) {
        const membs = await pb
          .collection('espaco_membros')
          .getFullList({ filter: `user="${user.id}"` })
        userEspacoMembros = membs.map((m: any) => m.espaco)
      }

      const visibleEspacos = e.filter((esp) => {
        if (!user) return esp.tipo === 'aberto' || !esp.tipo
        if (user.role === 'admin') return true
        if (esp.tipo === 'aberto' || !esp.tipo) return true
        if (esp.tipo === 'pago' && user.role === 'pro') return true
        if (esp.tipo === 'restrito' && userEspacoMembros.includes(esp.id)) return true
        return false
      })

      const espacosWithMetrics = visibleEspacos.map((esp) => {
        const spacePosts = posts.filter((p) => p.espaco === esp.id)
        const lastVisit = lastVisits[esp.slug] || 0
        const unread = spacePosts.filter((p) => new Date(p.created).getTime() > lastVisit).length
        return { ...esp, postagens_count: spacePosts.length, nao_lidos: unread }
      })
      setEspacos(espacosWithMetrics)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadEspacos()
  }, [])

  return (
    <main className="flex-1 pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="font-serif text-3xl font-bold text-ink">Espaços</h1>
            <div className="flex gap-1 ml-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sage" />
              <div className="w-1.5 h-1.5 rounded-full bg-sage/60" />
              <div className="w-1.5 h-1.5 rounded-full bg-sage/30" />
            </div>
          </div>
          <p className="text-mute">Navegue pelas discussões e comunidades da Vila.</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'pro') && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-ink text-white hover:bg-ink/90 rounded-full px-5"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo espaço
          </Button>
        )}
      </div>
      <CreateEspacoModal open={createOpen} onOpenChange={setCreateOpen} onSuccess={loadEspacos} />

      <div className="grid md:grid-cols-2 gap-4">
        {espacos.map((espaco) => (
          <Link
            key={espaco.id}
            to={espaco.slug ? `/e/${espaco.slug}` : '/espacos'}
            className="bg-paper border border-line rounded-xl p-5 hover:border-sage/30 transition-colors flex gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-wash flex items-center justify-center text-2xl shrink-0">
              {espaco.emoji || '💬'}
            </div>
            <div>
              <h3 className="font-semibold text-ink mb-1">{espaco.nome}</h3>
              {espaco.descricao && (
                <p className="text-sm text-mute italic mb-3 line-clamp-2">{espaco.descricao}</p>
              )}
              <div className="flex items-center gap-3 text-xs font-mono text-mute">
                <span>{espaco.postagens_count || 0} postagens</span>
                {espaco.nao_lidos > 0 && (
                  <span className="text-warm font-bold">{espaco.nao_lidos} não lidas</span>
                )}
                {espaco.tipo === 'restrito' && (
                  <span className="flex items-center gap-1 text-mute">
                    <Lock className="w-3 h-3" /> Restrito
                  </span>
                )}
                {espaco.tipo === 'pago' && (
                  <span className="flex items-center gap-1 text-warm">
                    <Sparkles className="w-3 h-3" /> Pro
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}{' '}
      </div>
    </main>
  )
}
