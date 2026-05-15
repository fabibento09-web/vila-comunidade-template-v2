import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Link2, Instagram, Twitter, MapPin, CalendarDays, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import pb from '@/lib/pocketbase/client'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'
import { MembroAvatar } from '@/components/MembroAvatar'
import { PostagemCard } from '@/components/PostagemCard'
import { useAuth } from '@/hooks/use-auth'

export default function ProfilePage() {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'about'>('posts')

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      try {
        const u = await pb.collection('users').getOne(id)
        setProfile(u)

        const p = await pb.collection('postagens').getFullList({
          filter: `autor="${id}" && status="publicado"`,
          sort: '-created',
          expand: 'autor,espaco',
        })
        setPosts(p)

        const c = await pb.collection('comentarios').getFullList({
          filter: `autor="${id}"`,
          sort: '-created',
          expand: 'autor,postagem',
        })
        setComments(c)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <main className="max-w-[820px] mx-auto w-full flex justify-center pt-20 pb-20">
        <Loader2 className="animate-spin text-mute w-8 h-8" />
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="max-w-[820px] mx-auto w-full pt-20 pb-20 text-center text-mute">
        Perfil não encontrado.
      </main>
    )
  }

  const isOwner = currentUser?.id === profile.id
  const coverUrl = profile.cover ? getPublicFileUrl(profile, profile.cover) : null
  const avatarUrl = profile.avatar ? getPublicFileUrl(profile, profile.avatar) : undefined
  const joinedDate = new Date(profile.created)

  return (
    <main className="max-w-[820px] mx-auto w-full pb-24 pt-4 md:pt-8">
      <div className="relative mb-16">
        <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden bg-wash border border-line">
          {coverUrl ? (
            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#A0B099] via-[#E8E8DE] to-[#E8B5A1] bg-noise" />
          )}
        </div>

        <div className="absolute -bottom-12 left-6 md:left-8 flex items-end gap-4">
          <MembroAvatar
            name={profile.name || 'User'}
            avatarUrl={avatarUrl}
            className="w-24 h-24 md:w-32 md:h-32 border-4 border-background text-3xl shadow-elevation"
          />
        </div>

        {isOwner && (
          <div className="absolute -bottom-10 right-4 md:right-8">
            <Link
              to="/configuracoes/perfil"
              className="bg-white border border-line text-ink text-sm font-medium px-4 py-2 rounded-full shadow-subtle hover:bg-wash transition-colors"
            >
              Editar perfil
            </Link>
          </div>
        )}
      </div>

      <div className="px-4 md:px-8 mb-8">
        <h1 className="font-serif text-3xl font-bold text-ink mb-2 flex items-center gap-2">
          {profile.name || 'Membro'}
          {profile.role === 'admin' && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-sage/10 text-sage px-2 py-0.5 rounded align-middle flex items-center gap-1">
              <span className="text-sage">🛡️</span> ADMIN
            </span>
          )}
          {profile.role === 'pro' && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-warm/10 text-warm px-2 py-0.5 rounded align-middle flex items-center gap-1">
              <span className="text-warm">✨</span> PRO
            </span>
          )}
        </h1>

        {profile.bio && (
          <p className="text-ink/80 text-base mb-4 leading-relaxed max-w-2xl">{profile.bio}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-mute mb-6">
          {profile.cidade && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {profile.cidade}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            membro desde {format(joinedDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {profile.website && (
            <a
              href={
                profile.website.startsWith('http') ? profile.website : `https://${profile.website}`
              }
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-wash hover:bg-line/50 rounded-full text-xs font-medium text-ink transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" /> Website
            </a>
          )}
          {profile.twitter && (
            <a
              href={`https://twitter.com/${profile.twitter.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-wash hover:bg-line/50 rounded-full text-xs font-medium text-ink transition-colors"
            >
              <Twitter className="w-3.5 h-3.5" /> Twitter
            </a>
          )}
          {profile.instagram && (
            <a
              href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-wash hover:bg-line/50 rounded-full text-xs font-medium text-ink transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 border-b border-line px-4 md:px-8 mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'posts' ? 'border-sage text-ink' : 'border-transparent text-mute hover:text-ink'}`}
        >
          Postagens ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'comments' ? 'border-sage text-ink' : 'border-transparent text-mute hover:text-ink'}`}
        >
          Comentários ({comments.length})
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'about' ? 'border-sage text-ink' : 'border-transparent text-mute hover:text-ink'}`}
        >
          Sobre
        </button>
      </div>

      <div className="px-4 md:px-8">
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => <PostagemCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-12 text-mute border border-dashed border-line rounded-xl">
                Nenhuma postagem pública.
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            {comments.length > 0 ? (
              comments.map((c) => (
                <div key={c.id} className="p-4 bg-paper border border-line rounded-xl text-sm">
                  <div className="text-mute mb-2 flex items-center gap-1.5">
                    Comentou em{' '}
                    <Link to={`/p/${c.postagem}`} className="text-ink font-medium hover:text-sage">
                      {c.expand?.postagem?.titulo || 'uma postagem'}
                    </Link>
                  </div>
                  <p className="text-ink/90 leading-relaxed">{c.corpo}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-mute border border-dashed border-line rounded-xl">
                Nenhum comentário ainda.
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="p-6 bg-paper border border-line rounded-xl prose prose-sm max-w-none text-ink/90">
            <h3 className="font-serif text-lg mb-3">Biografia</h3>
            <p>{profile.bio || 'Esta pessoa ainda não escreveu uma biografia.'}</p>
          </div>
        )}
      </div>
    </main>
  )
}
