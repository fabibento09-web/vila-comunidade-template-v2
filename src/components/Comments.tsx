import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { getComentarios, createComentario, likeComentario } from '@/services/api'
import { MembroAvatar } from './MembroAvatar'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Heart, ShieldCheck, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'

function CommentComposer({
  postId,
  parentId,
  mention,
  onCancel,
  onSuccess,
}: {
  postId: string
  parentId?: string
  mention?: string
  onCancel?: () => void
  onSuccess: () => void
}) {
  const { user } = useAuth()
  const [text, setText] = useState(mention ? `@${mention} ` : '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!text.trim() || !user) return
    setLoading(true)
    try {
      await createComentario({ corpo: text, postagem: postId, autor: user.id, parent_id: parentId })
      setText('')
      onSuccess()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-4">
      <MembroAvatar
        name={user?.name || 'Eu'}
        avatarUrl={user?.avatar ? getPublicFileUrl(user, user.avatar) : undefined}
        className={cn(parentId ? 'w-7 h-7' : 'w-9 h-9')}
      />
      <div className="flex-1 space-y-3">
        <Textarea
          placeholder={parentId ? 'Escreva sua resposta...' : 'Deixe um comentário...'}
          className="min-h-[80px] bg-paper border-line resize-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button
            className="bg-warm hover:bg-warm/90 text-white rounded-full px-5"
            size="sm"
            onClick={handleSubmit}
            disabled={!text.trim() || loading || !user}
          >
            {parentId ? 'Responder' : 'Comentar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ReplyItem({
  reply,
  postId,
  topLevelId,
  onReplySuccess,
}: {
  reply: any
  postId: string
  topLevelId: string
  onReplySuccess: () => void
}) {
  const repAutor = reply.expand?.autor
  const [likes, setLikes] = useState(reply.curtidas || 0)
  const [replying, setReplying] = useState(false)

  const avatarUrl = repAutor?.avatar
    ? getPublicFileUrl(repAutor, repAutor.avatar)
    : reply.expand?.autor?.avatar
      ? getPublicFileUrl(reply.expand.autor, reply.expand.autor.avatar)
      : undefined

  const handleLike = async () => {
    setLikes(likes + 1)
    try {
      await likeComentario(reply.id, likes)
    } catch (err) {
      setLikes(likes)
      console.error(err)
    }
  }

  return (
    <div className="flex gap-3">
      {repAutor ? (
        <Link to={`/u/${repAutor.id}`}>
          <MembroAvatar
            name={repAutor?.name}
            avatarUrl={avatarUrl}
            className="w-7 h-7 shrink-0 hover:opacity-80 transition-opacity"
          />
        </Link>
      ) : (
        <MembroAvatar
          name={reply.expand?.autor?.name}
          avatarUrl={avatarUrl}
          className="w-7 h-7 shrink-0"
        />
      )}
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          {repAutor ? (
            <Link
              to={`/u/${repAutor.id}`}
              className="font-semibold text-ink text-sm hover:text-sage transition-colors flex items-center gap-1"
            >
              {repAutor.name}
              {repAutor.role === 'admin' && <ShieldCheck className="w-3 h-3 text-sage" />}
              {repAutor.role === 'pro' && <Sparkles className="w-3 h-3 text-warm" />}
            </Link>
          ) : (
            <span className="font-semibold text-ink text-sm flex items-center gap-1">
              {reply.expand?.autor?.name}
            </span>
          )}
          <span className="text-xs text-mute font-mono">
            {formatDistanceToNow(new Date(reply.created), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>
        <p className="text-ink/90 text-sm leading-relaxed mb-1">{reply.corpo}</p>

        <div className="flex items-center gap-4 text-mute text-xs font-medium mt-2">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 hover:text-warm transition-colors"
          >
            <Heart className="w-3.5 h-3.5" /> {likes}
          </button>
          <button
            onClick={() => setReplying(!replying)}
            className="hover:text-ink transition-colors"
          >
            Responder
          </button>
        </div>

        {replying && (
          <div className="mt-4 mb-4">
            <CommentComposer
              postId={postId}
              parentId={topLevelId}
              mention={repAutor?.name || reply.expand?.autor?.name}
              onCancel={() => setReplying(false)}
              onSuccess={() => {
                setReplying(false)
                onReplySuccess()
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function CommentItem({
  comment,
  allComments,
  postId,
  reload,
  onCommentAdded,
}: {
  comment: any
  allComments: any[]
  postId: string
  reload: () => void
  onCommentAdded?: () => void
}) {
  const [replying, setReplying] = useState(false)
  const autor = comment.expand?.autor
  const date = new Date(comment.created)
  const replies = allComments.filter((c) => c.parent_id === comment.id)
  const [likes, setLikes] = useState(comment.curtidas || 0)
  const avatarUrl = autor?.avatar ? getPublicFileUrl(autor, autor.avatar) : undefined

  const handleLike = async () => {
    setLikes(likes + 1)
    try {
      await likeComentario(comment.id, likes)
    } catch (err) {
      setLikes(likes)
      console.error(err)
    }
  }

  return (
    <div className="flex gap-4 group">
      {autor ? (
        <Link to={`/u/${autor.id}`}>
          <MembroAvatar
            name={autor?.name}
            avatarUrl={avatarUrl}
            className="w-9 h-9 shrink-0 hover:opacity-80 transition-opacity"
          />
        </Link>
      ) : (
        <MembroAvatar name={autor?.name} avatarUrl={avatarUrl} className="w-9 h-9 shrink-0" />
      )}
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          {autor ? (
            <Link
              to={`/u/${autor.id}`}
              className="font-semibold text-ink text-sm hover:text-sage transition-colors flex items-center gap-1"
            >
              {autor?.name}
              {autor?.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-sage" />}
              {autor?.role === 'pro' && <Sparkles className="w-3.5 h-3.5 text-warm" />}
            </Link>
          ) : (
            <span className="font-semibold text-ink text-sm flex items-center gap-1">
              {autor?.name}
            </span>
          )}
          <span className="text-xs text-mute font-mono">
            {formatDistanceToNow(date, { addSuffix: true, locale: ptBR })}
          </span>
        </div>
        <p className="text-ink/90 text-sm leading-relaxed mb-2">{comment.corpo}</p>

        <div className="flex items-center gap-4 text-mute text-xs font-medium">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 hover:text-warm transition-colors"
          >
            <Heart className="w-3.5 h-3.5" /> {likes}
          </button>
          {!comment.parent_id && (
            <button
              onClick={() => setReplying(!replying)}
              className="hover:text-ink transition-colors"
            >
              Responder
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-4 mb-4">
            <CommentComposer
              postId={postId}
              parentId={comment.id}
              onCancel={() => setReplying(false)}
              onSuccess={() => {
                setReplying(false)
                reload()
                onCommentAdded?.()
              }}
            />
          </div>
        )}

        {replies.length > 0 && (
          <div className="mt-4 border-l border-line pl-4 space-y-4">
            {replies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                postId={postId}
                topLevelId={comment.id}
                onReplySuccess={() => {
                  reload()
                  onCommentAdded?.()
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function Comments({
  postId,
  onCommentAdded,
}: {
  postId: string
  onCommentAdded?: () => void
}) {
  const [comments, setComments] = useState<any[]>([])
  const { user } = useAuth()

  const load = async () => {
    try {
      const data = await getComentarios(postId)
      setComments(data)
    } catch (err) {
      console.error(err)
    }
  }
  useEffect(() => {
    load()
  }, [postId])

  const topLevel = comments.filter((c) => !c.parent_id)

  const handleSuccess = () => {
    load()
    onCommentAdded?.()
  }

  return (
    <section>
      <h2 className="font-serif text-2xl font-bold text-ink mb-8">Conversas ({comments.length})</h2>

      {user ? (
        <div className="mb-10 p-6 bg-wash/50 rounded-xl border border-line/50">
          <CommentComposer postId={postId} onSuccess={handleSuccess} />
        </div>
      ) : (
        <div className="mb-10 p-6 bg-wash/50 rounded-xl border border-line/50 text-center text-mute text-sm">
          Faça login para comentar.
        </div>
      )}

      <div className="space-y-8">
        {topLevel.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            allComments={comments}
            postId={postId}
            reload={load}
            onCommentAdded={onCommentAdded}
          />
        ))}
      </div>
    </section>
  )
}
