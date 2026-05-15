import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, PlayCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getCursos } from '@/services/courses'
import pb from '@/lib/pocketbase/client'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'
import { useAuth } from '@/hooks/use-auth'
import { MembroAvatar } from '@/components/MembroAvatar'

type FilterType = 'todos' | 'free' | 'pago' | 'pro'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { createCurso } from '@/services/courses'

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default function CoursesPage() {
  const { user } = useAuth()
  const [cursos, setCursos] = useState<any[]>([])
  const [cursoMembros, setCursoMembros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('todos')

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newTagline, setNewTagline] = useState('')
  const [newTipo, setNewTipo] = useState<'free' | 'pago' | 'pro'>('free')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      const data = await getCursos(user?.role === 'admin')
      setCursos(data)
      if (user) {
        try {
          const userGrants = await pb
            .collection('curso_membros')
            .getFullList({ filter: `user="${user.id}"` })
          setCursoMembros(userGrants)
        } catch {
          /* intentionally ignored */
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCursos = cursos.filter((c) => filter === 'todos' || c.tipo === filter)

  const isLocked = (curso: any) => {
    if (user?.role === 'admin') return false

    const override = cursoMembros.find((cm) => cm.curso === curso.id)
    if (override) return override.bloqueado

    if (curso.tipo === 'free') return false
    if (curso.tipo === 'pro' && user?.role === 'pro') return false

    return true
  }

  return (
    <main className="flex-1 pb-20 p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-2">Cursos</h1>
          <p className="text-lg text-mute">Aprenda no seu ritmo. Sem LMS confuso.</p>
        </div>
        {user?.role === 'admin' && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="w-full md:w-auto">
            Novo curso
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
        {(['todos', 'free', 'pago', 'pro'] as FilterType[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full capitalize text-xs tracking-wider font-mono shrink-0',
              filter === f ? 'bg-ink text-white' : 'text-mute hover:text-ink',
            )}
          >
            {f === 'free' ? 'Gratuitos' : f === 'pago' ? 'Pagos' : f}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-wash animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : filteredCursos.length === 0 ? (
        <div className="text-center py-20 bg-wash/50 rounded-3xl border border-dashed border-line">
          <GraduationCap className="w-10 h-10 text-mute mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-medium text-ink">Nenhum curso encontrado</h3>
          <p className="text-mute">Tente mudar o filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCursos.map((curso) => {
            const locked = isLocked(curso)
            const badgeColors = {
              pro: 'bg-warm text-white',
              pago: 'bg-ink text-white',
              free: 'bg-sage text-white',
            }

            return (
              <Link
                to={locked ? '#' : `/cursos/${curso.slug}`}
                key={curso.id}
                className={cn(
                  'group flex flex-col bg-paper rounded-2xl border border-line overflow-hidden hover:shadow-subtle transition-all',
                  locked && 'opacity-80 cursor-not-allowed hover:shadow-none',
                )}
              >
                <div className="aspect-[4/3] bg-wash relative overflow-hidden flex items-center justify-center">
                  {curso.cover ? (
                    <img
                      src={getPublicFileUrl(curso, curso.cover)}
                      alt={curso.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-noise flex items-center justify-center bg-gradient-to-br from-sage/20 to-warm/20 group-hover:scale-105 transition-transform duration-700">
                      <PlayCircle className="w-16 h-16 text-white/80 drop-shadow-md" />
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex gap-2">
                    {!curso.publicado && user?.role === 'admin' && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-warm/90 text-white">
                        Rascunho
                      </span>
                    )}
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full',
                        badgeColors[curso.tipo as keyof typeof badgeColors] || 'bg-ink text-white',
                      )}
                    >
                      {curso.tipo === 'free' ? 'Gratuito' : curso.tipo === 'pago' ? 'Pago' : 'Pro'}
                    </span>
                  </div>

                  {locked && (
                    <div className="absolute inset-0 bg-paper/60 backdrop-blur-sm flex items-center justify-center z-10">
                      <div className="bg-white p-4 rounded-full shadow-lg">
                        <Lock className="w-6 h-6 text-warm" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-serif text-xl font-bold text-ink leading-tight mb-2 group-hover:text-sage transition-colors">
                    {curso.titulo}
                  </h3>
                  <p className="text-mute italic text-sm line-clamp-2 mb-4 flex-1">
                    {curso.tagline}
                  </p>

                  {curso.expand?.autor && (
                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-line/50">
                      <MembroAvatar
                        name={curso.expand.autor.name}
                        avatarUrl={
                          curso.expand.autor.avatar
                            ? getPublicFileUrl(curso.expand.autor, curso.expand.autor.avatar)
                            : undefined
                        }
                        className="w-6 h-6"
                      />
                      <span className="text-xs text-mute font-medium">
                        {curso.expand.autor.name}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Curso</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Formação em React"
              />
              {newTitle.length > 0 && newTitle.length < 3 && (
                <p className="text-xs text-red-500">Mínimo de 3 caracteres</p>
              )}
              {newTitle.length >= 3 && (
                <p className="text-xs text-mute font-mono">Slug: {generateSlug(newTitle)}</p>
              )}
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tagline</label>
              <Input
                value={newTagline}
                onChange={(e) => setNewTagline(e.target.value)}
                placeholder="Ex: Aprenda do zero ao avançado"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tipo de Acesso</label>
              <div className="flex gap-2">
                {(['free', 'pago', 'pro'] as const).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={newTipo === t ? 'default' : 'outline'}
                    onClick={() => setNewTipo(t)}
                    className="flex-1 capitalize"
                  >
                    {t === 'free' ? 'Gratuito' : t}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (newTitle.length < 3) return
                setIsCreating(true)
                try {
                  const slug = generateSlug(newTitle)
                  const res = await createCurso({
                    titulo: newTitle,
                    slug,
                    tagline: newTagline,
                    tipo: newTipo,
                    publicado: true,
                    autor: user?.id,
                    ordem: 0,
                  })
                  toast.success('Curso criado com sucesso!')
                  window.location.href = `/cursos/${res.slug}/editar`
                } catch (err: any) {
                  toast.error(err.message || 'Erro ao criar curso')
                } finally {
                  setIsCreating(false)
                }
              }}
              disabled={newTitle.length < 3 || isCreating}
            >
              {isCreating ? 'Criando...' : 'Criar Curso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
