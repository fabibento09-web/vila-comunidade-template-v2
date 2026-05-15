import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getPostagem, likePostagem, deletePostagem } from '@/services/api'
import { MembroAvatar } from '@/components/MembroAvatar'
import { Comments } from '@/components/Comments'
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Loader2,
  Bookmark,
  ShieldCheck,
  Sparkles,
  MoreVertical,
  Trash2,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [salvoId, setSalvoId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!id) return
      try {
        const data = await getPostagem(id)
        setPost(data)

        if (user) {
          try {
            const salvo = await pb
              .collection('salvos')
              .getFirstListItem(`user="${user.id}" && postagem="${id}"`)
            setIsSaved(true)
            setSalvoId(salvo.id)
          } catch (e) {
            setIsSaved(false)
            setSalvoId(null)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, user])

  const handleLike = async () => {
    if (!post) return
    const newLikes = (post.curtidas || 0) + 1
    setPost({ ...post, curtidas: newLikes })
    try {
      await likePostagem(post.id, post.curtidas || 0)
    } catch (err) {
      console.error(err)
      setPost({ ...post, curtidas: post.curtidas || 0 })
    }
  }

  const toggleSave = async () => {
    if (!user || !post) return

    if (isSaved && salvoId) {
      try {
        await pb.collection('salvos').delete(salvoId)
        setIsSaved(false)
        setSalvoId(null)
        toast('Removido dos salvos.')
      } catch (e) {
        console.error(e)
      }
    } else {
      try {
        const res = await pb.collection('salvos').create({
          user: user.id,
          postagem: post.id,
        })
        setIsSaved(true)
        setSalvoId(res.id)
        toast.success('Postagem salva.')
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Apagar essa postagem? Essa ação não pode ser desfeita.')) return
    try {
      await deletePostagem(post.id)
      toast.success('Postagem apagada.')
      navigate('/feed')
    } catch {
      toast.error('Não foi possível apagar. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-mute w-8 h-8" />
      </div>
    )
  }

  if (!post) {
    return <div className="text-center py-20 text-mute">Postagem não encontrada.</div>
  }

  const autor = post.expand?.autor
  const espaco = post.expand?.espaco
  const date = new Date(post.publicado_em || post.created)
  const coverUrl = post.cover ? getPublicFileUrl(post, post.cover) : post.cover_url
  const avatarUrl = autor?.avatar ? getPublicFileUrl(autor, autor.avatar) : undefined

  return (
    <main className="max-w-[820px] w-full mx-auto pb-24">
      {espaco && (
        <Link
          to={espaco.slug ? `/e/${espaco.slug}` : '/espacos'}
          className="inline-flex items-center gap-2 text-mute hover:text-ink transition-colors font-medium text-sm mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para {espaco.emoji} {espaco.nome}
        </Link>
      )}

      {coverUrl && (
        <img
          src={coverUrl}
          alt={post.titulo}
          className="w-full h-64 md:h-96 object-cover rounded-2xl mb-8"
        />
      )}

      <header className="mb-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {autor ? (
              <Link to={`/u/${autor.id}`}>
                <MembroAvatar
                  name={autor?.name}
                  avatarUrl={avatarUrl}
                  className="w-12 h-12 hover:opacity-80 transition-opacity"
                />
              </Link>
            ) : (
              <MembroAvatar name={autor?.name} avatarUrl={avatarUrl} className="w-12 h-12" />
            )}
            <div>
              <div className="flex items-center gap-2">
                {autor ? (
                  <Link
                    to={`/u/${autor.id}`}
                    className="font-semibold text-ink text-lg hover:text-sage transition-colors flex items-center gap-1.5"
                  >
                    {autor?.name}
                    {autor?.role === 'admin' && <ShieldCheck className="w-4 h-4 text-sage" />}
                    {autor?.role === 'pro' && <Sparkles className="w-4 h-4 text-warm" />}
                  </Link>
                ) : (
                  <span className="font-semibold text-ink text-lg flex items-center gap-1.5">
                    {autor?.name}
                    {autor?.role === 'admin' && <ShieldCheck className="w-4 h-4 text-sage" />}
                    {autor?.role === 'pro' && <Sparkles className="w-4 h-4 text-warm" />}
                  </span>
                )}
                {espaco && (
                  <>
                    <span className="text-mute text-sm">em</span>
                    <Link
                      to={espaco.slug ? `/e/${espaco.slug}` : '/espacos'}
                      className="text-sm font-medium text-ink bg-wash px-2 py-0.5 rounded-md hover:bg-line transition-colors"
                    >
                      {espaco.emoji} {espaco.nome}
                    </Link>
                  </>
                )}
              </div>
              <div className="text-sm text-mute font-mono tracking-tight mt-1">
                {formatDistanceToNow(date, { addSuffix: true, locale: ptBR })} ·{' '}
                {post.min_leitura || 3} min de leitura
              </div>
            </div>
          </div>
          {(user?.id === post.autor || user?.role === 'admin') && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-mute hover:text-ink transition-colors rounded-md hover:bg-wash">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive cursor-pointer font-medium"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Apagar postagem
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink leading-tight">
          {post.titulo}
        </h1>
      </header>

      <div className="prose prose-lg prose-p:leading-relaxed prose-p:text-ink/90 prose-p:font-sans max-w-none mb-12 break-words">
        {post.corpo.split('\n').map((para: string, i: number) => {
          const parts = para.split(/(!\[.*?\]\(.*?\))/g)
          if (parts.length > 1) {
            return (
              <p key={i} className="mb-4">
                {parts.map((part, j) => {
                  const m = part.match(/^!\[(.*?)\]\((.*?)\)$/)
                  if (m) {
                    return (
                      <img
                        key={j}
                        src={m[2]}
                        alt={m[1]}
                        className="w-full rounded-xl border border-line my-6 object-cover"
                      />
                    )
                  }
                  return <span key={j}>{part}</span>
                })}
              </p>
            )
          }
          return (
            <p key={i} className="mb-4">
              {para}
            </p>
          )
        })}
      </div>

      <div className="flex items-center justify-between py-4 border-y border-line/60 mb-12 text-mute">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 hover:text-warm transition-colors"
          >
            <Heart className="w-5 h-5" />
            <span className="font-medium">{post.curtidas || 0}</span>
          </button>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">{post.comentarios || 0}</span>
          </div>
        </div>
        {user && (
          <button
            onClick={toggleSave}
            className={cn(
              'flex items-center gap-2 transition-colors',
              isSaved ? 'text-warm' : 'hover:text-ink',
            )}
          >
            <Bookmark className={cn('w-5 h-5', isSaved && 'fill-current')} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mb-12">
        <div className="w-1.5 h-1.5 rounded-full bg-sage opacity-40" />
        <div className="w-1.5 h-1.5 rounded-full bg-sage opacity-60" />
        <div className="w-1.5 h-1.5 rounded-full bg-sage opacity-40" />
      </div>

      <Comments
        postId={post.id}
        onCommentAdded={() => setPost({ ...post, comentarios: (post.comentarios || 0) + 1 })}
      />
    </main>
  )
}
