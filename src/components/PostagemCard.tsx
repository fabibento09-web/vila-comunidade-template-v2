import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MessageCircle,
  Heart,
  Bookmark,
  ShieldCheck,
  Sparkles,
  MoreVertical,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deletePostagem, userCurtiu, getCurtidasCount, toggleCurtidaPostagem } from '@/services/api'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MembroAvatar } from './MembroAvatar'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function PostagemCard({ post, onLike }: { post: any; onLike?: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isSaved, setIsSaved] = useState(false)
  const [salvoId, setSalvoId] = useState<string | null>(null)

  const [likesCount, setLikesCount] = useState(post.curtidas || 0)
  const [commentsCount, setCommentsCount] = useState(post.comentarios || 0)
  const [isLiked, setIsLiked] = useState(false)
  const [isLikeLoading, setIsLikeLoading] = useState(false)

  useEffect(() => {
    if (!user || post.id === 'preview') return
    pb.collection('salvos')
      .getFirstListItem(`user="${user.id}" && postagem="${post.id}"`)
      .then((res) => {
        setIsSaved(true)
        setSalvoId(res.id)
      })
      .catch(() => {
        setIsSaved(false)
        setSalvoId(null)
      })

    userCurtiu(post.id, user.id).then(setIsLiked)
    getCurtidasCount(post.id).then((count) => {
      // Set to real count if available, otherwise trust the snapshot
      if (count > 0 || (count === 0 && post.curtidas === 0)) {
        setLikesCount(count)
      }
    })

    pb.collection('comentarios')
      .getList(1, 1, { filter: `postagem="${post.id}"` })
      .then((res) => setCommentsCount(res.totalItems))
      .catch(() => {})
  }, [user, post.id, post.curtidas, post.comentarios])

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user || post.id === 'preview') return

    if (isSaved && salvoId) {
      await pb.collection('salvos').delete(salvoId)
      setIsSaved(false)
      setSalvoId(null)
      toast('Removido dos salvos.')
    } else {
      const res = await pb.collection('salvos').create({
        user: user.id,
        postagem: post.id,
      })
      setIsSaved(true)
      setSalvoId(res.id)
      toast.success('Postagem salva.')
    }
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user || post.id === 'preview' || isLikeLoading) return

    setIsLikeLoading(true)
    const previousLiked = isLiked
    const previousCount = likesCount

    // Optimistic Update
    setIsLiked(!previousLiked)
    setLikesCount(previousCount + (previousLiked ? -1 : 1))

    try {
      const { liked } = await toggleCurtidaPostagem(post.id, user.id)
      setIsLiked(liked)
      if (onLike) onLike()
    } catch (err: any) {
      // Revert if error
      setIsLiked(previousLiked)
      setLikesCount(previousCount)
      console.error('handleLike failed', err)
      toast.error(err?.response?.message || err?.message || 'Não foi possível curtir.')
    } finally {
      setIsLikeLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Apagar essa postagem? Essa ação não pode ser desfeita.')) return
    try {
      await deletePostagem(post.id)
      toast.success('Postagem apagada.')
      window.dispatchEvent(new CustomEvent('postagem-apagada', { detail: { id: post.id } }))
    } catch {
      toast.error('Não foi possível apagar. Tente novamente.')
    }
  }

  const autor = post.expand?.autor
  const espaco = post.expand?.espaco
  const coverUrl = post.cover ? getPublicFileUrl(post, post.cover) : post.cover_url
  const cleanBody = typeof post.corpo === 'string' ? post.corpo.replace(/!\[.*?\]\(.*?\)/g, '') : ''

  return (
    <div
      onClick={() => navigate(`/p/${post.id}`)}
      className="block bg-paper border border-line rounded-xl p-5 hover:border-sage/30 transition-colors shadow-subtle group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {autor ? (
            <Link to={`/u/${autor.id}`} onClick={(e) => e.stopPropagation()}>
              <MembroAvatar
                name={autor.name}
                avatarUrl={autor.avatar ? getPublicFileUrl(autor, autor.avatar) : undefined}
                className="w-10 h-10 hover:opacity-80 transition-opacity"
              />
            </Link>
          ) : (
            <MembroAvatar name="Membro" className="w-10 h-10" />
          )}
          <div>
            <div className="flex items-center gap-2">
              {autor ? (
                <Link
                  to={`/u/${autor.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-ink hover:text-sage transition-colors flex items-center gap-1.5"
                >
                  {autor.name || 'Membro'}
                  {autor.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-sage" />}
                  {autor.role === 'pro' && <Sparkles className="w-3.5 h-3.5 text-warm" />}
                </Link>
              ) : (
                <span className="font-semibold text-ink flex items-center gap-1.5">Membro</span>
              )}
              <span className="text-mute text-sm">•</span>
              <span className="text-mute text-sm">
                {post.publicado_em
                  ? formatDistanceToNow(new Date(post.publicado_em), { locale: ptBR })
                  : 'Agora'}
              </span>
            </div>
            {espaco && (
              <div className="text-xs font-mono text-mute mt-0.5">
                {espaco.emoji} {espaco.nome}
              </div>
            )}
          </div>
        </div>
        {(user?.id === post.autor || user?.role === 'admin') && post.id !== 'preview' && (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 text-mute hover:text-ink transition-colors rounded-md hover:bg-wash">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive cursor-pointer font-medium"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Apagar postagem
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="mb-4">
        <h3 className="font-serif text-xl font-bold text-ink mb-2 group-hover:text-sage transition-colors">
          {post.titulo}
        </h3>
        {coverUrl && (
          <img
            src={coverUrl}
            alt="Capa"
            className="w-full h-48 object-cover rounded-lg mb-3 border border-line"
          />
        )}
        <p className="text-mute line-clamp-3 text-sm leading-relaxed">{cleanBody}</p>
      </div>

      <div className="flex items-center justify-between text-mute text-sm border-t border-line pt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={cn(
              'flex items-center gap-1.5 transition-colors',
              isLiked ? 'text-warm' : 'hover:text-warm',
            )}
          >
            <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
            <span>{likesCount}</span>
          </button>
          <div className="flex items-center gap-1.5 hover:text-ink transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span>{commentsCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs">{post.min_leitura || 1} min ler</span>
          <button
            onClick={toggleSave}
            className={cn(
              'p-1.5 rounded-md hover:bg-wash transition-colors',
              isSaved ? 'text-warm' : 'hover:text-ink',
            )}
          >
            <Bookmark className={cn('w-4 h-4', isSaved && 'fill-current')} />
          </button>
        </div>
      </div>
    </div>
  )
}
