import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { PostagemCard } from '@/components/PostagemCard'
import { getPostagens, likePostagem } from '@/services/api'
import { MembroAvatar } from '@/components/MembroAvatar'
import { useRealtime } from '@/hooks/use-realtime'
import { Loader2 } from 'lucide-react'
import { useComposer } from '@/hooks/use-composer'
import pb from '@/lib/pocketbase/client'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'

export default function Feed() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { openComposer } = useComposer()
  const [postagens, setPostagens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [salvos, setSalvos] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('Recentes')

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/')
    }
  }, [user, authLoading, navigate])

  const loadFeed = async () => {
    try {
      const res = await getPostagens()
      setPostagens(res.items)
      if (user) {
        const s = await pb.collection('salvos').getFullList({ filter: `user="${user.id}"` })
        setSalvos(new Set(s.map((r) => r.postagem)))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadFeed()
  }, [user])

  useEffect(() => {
    const handlePostApagada = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setPostagens((prev) => prev.filter((p) => p.id !== detail.id))
    }
    window.addEventListener('postagem-apagada', handlePostApagada)
    return () => window.removeEventListener('postagem-apagada', handlePostApagada)
  }, [])

  useRealtime('postagens', () => {
    loadFeed()
  })

  useRealtime('salvos', () => {
    if (user) {
      pb.collection('salvos')
        .getFullList({ filter: `user="${user.id}"` })
        .then((s) => setSalvos(new Set(s.map((r) => r.postagem))))
    }
  })

  const handleFilterClick = (f: string) => {
    setFilter(f)
  }

  const displayedPosts = postagens.filter((p) => {
    if (filter === 'Salvos') return salvos.has(p.id)
    return true
  })

  const postsToday = postagens.filter((p) => {
    const d = new Date(p.publicado_em || p.created)
    const today = new Date()
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    )
  }).length

  let todayMessage = 'A Vila tá quieta hoje.'
  if (postsToday === 1) todayMessage = '1 postagem nova hoje.'
  else if (postsToday > 1) todayMessage = `${postsToday} postagens novas hoje.`

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14">
        <Loader2 className="animate-spin text-warm w-8 h-8" />
      </div>
    )
  }

  if (!user) return null

  return (
    <main className="max-w-[760px] mx-auto w-full">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-ink">
          Bom dia, {user.name?.split(' ')[0] || 'Criador'}
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-sage mt-2">{todayMessage}</p>
      </header>

      <div className="bg-paper p-4 rounded-xl border border-line shadow-subtle flex items-center gap-4 mb-8">
        <MembroAvatar
          name={user.name}
          avatarUrl={user.avatar ? getPublicFileUrl(user, user.avatar) : undefined}
          className="w-10 h-10"
        />
        <button
          onClick={() => openComposer()}
          className="flex-1 bg-wash hover:bg-line/50 transition-colors text-left px-4 py-2.5 rounded-full text-mute text-sm font-medium"
        >
          Escreva uma postagem...
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-6">
        {['Recentes', 'Salvos'].map((f) => (
          <button
            key={f}
            onClick={() => handleFilterClick(f)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filter === f
                ? 'bg-ink text-white border-ink'
                : 'bg-paper text-mute border-line hover:border-ink hover:text-ink'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 pb-20">
        {displayedPosts.map((post) => (
          <PostagemCard key={post.id} post={post} />
        ))}
        {displayedPosts.length === 0 && filter === 'Salvos' && (
          <div className="text-center py-20 text-mute border border-dashed border-line rounded-xl">
            Você ainda não salvou nada.
          </div>
        )}
        {displayedPosts.length === 0 && filter !== 'Salvos' && (
          <div className="text-center py-20 text-mute border border-dashed border-line rounded-xl">
            Nenhuma postagem encontrada.
          </div>
        )}
      </div>
    </main>
  )
}
