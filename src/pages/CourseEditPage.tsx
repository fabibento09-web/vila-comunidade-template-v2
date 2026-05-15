import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Plus,
  Trash2,
  Video,
  Pencil,
  BarChart3,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import pb from '@/lib/pocketbase/client'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'
import {
  getCursoBySlug,
  getModulosByCurso,
  getAulasByCurso,
  updateCurso,
  deleteCurso,
  createModulo,
  updateModulo,
  deleteModulo,
  createAula,
  updateAula,
  deleteAula,
} from '@/services/courses'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

export default function CourseEditPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [curso, setCurso] = useState<any>(null)
  const [modulos, setModulos] = useState<any[]>([])
  const [aulas, setAulas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State for inline interactions
  const [isCreatingModulo, setIsCreatingModulo] = useState(false)
  const [newModuloTitle, setNewModuloTitle] = useState('')
  const [savingModulo, setSavingModulo] = useState(false)
  const [editingModulo, setEditingModulo] = useState<{ id: string; titulo: string } | null>(null)
  const [savingRename, setSavingRename] = useState(false)
  const [deletingItem, setDeletingItem] = useState<{ type: 'modulo' | 'aula'; id: string } | null>(
    null,
  )

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('Acesso negado')
      navigate(`/cursos/${slug}`)
      return
    }
    load()
  }, [slug, user])

  const load = async () => {
    try {
      const c = await getCursoBySlug(slug as string)
      setCurso(c)
      const [m, a] = await Promise.all([getModulosByCurso(c.id), getAulasByCurso(c.id)])
      setModulos(m)
      setAulas(a)
    } catch (e) {
      navigate('/cursos')
    } finally {
      setLoading(false)
    }
  }

  const handleCourseUpdate = async (data: any) => {
    try {
      const res = await updateCurso(curso.id, data)
      setCurso(res)
      toast.success('Salvo')
      if (data.slug && data.slug !== slug)
        navigate(`/cursos/${data.slug}/editar`, { replace: true })
    } catch (e) {
      toast.error('Erro ao salvar')
    }
  }

  const handleCreateModuloSubmit = async (title: string) => {
    if (savingModulo) return
    if (!title.trim()) {
      setIsCreatingModulo(false)
      return
    }
    setSavingModulo(true)
    try {
      const res = await createModulo({
        titulo: title.trim(),
        curso: curso.id,
        ordem: modulos.length,
      })
      setModulos([...modulos, res])
      setIsCreatingModulo(false)
      setNewModuloTitle('')
    } catch (err) {
      toast.error('Erro ao criar módulo')
    } finally {
      setSavingModulo(false)
    }
  }

  const handleRenameModuloSubmit = async (id: string, newTitle: string) => {
    if (savingRename) return
    if (!newTitle.trim()) {
      setEditingModulo(null)
      return
    }
    setSavingRename(true)
    try {
      const res = await updateModulo(id, { titulo: newTitle.trim() })
      setModulos(modulos.map((m) => (m.id === id ? res : m)))
      setEditingModulo(null)
    } catch (err) {
      toast.error('Erro ao renomear módulo')
    } finally {
      setSavingRename(false)
    }
  }

  const handleDeleteModulo = async (id: string) => {
    await deleteModulo(id)
    setModulos(modulos.filter((m) => m.id !== id))
    setAulas(aulas.filter((a) => a.modulo !== id))
    setDeletingItem(null)
  }

  const handleDeleteAulaConfirm = async (id: string) => {
    await deleteAula(id)
    setAulas(aulas.filter((a) => a.id !== id))
    setDeletingItem(null)
  }

  const handleCreateAula = async (moduloId: string) => {
    try {
      const title = 'Nova aula'
      const slug = `nova-aula-${Math.random().toString(36).substring(2, 8)}`
      const formData = new FormData()
      formData.append('titulo', title)
      formData.append('slug', slug)
      formData.append('modulo', moduloId)
      formData.append('curso', curso.id)
      formData.append('ordem', String(aulas.filter((a) => a.modulo === moduloId).length))

      const res = await createAula(formData)
      navigate(`/cursos/${curso.slug}/aula/${res.slug}?edit=1`)
    } catch (err) {
      toast.error('Erro ao criar aula')
    }
  }

  const [dragMod, setDragMod] = useState<string | null>(null)
  const onDropMod = async (targetId: string) => {
    if (!dragMod || dragMod === targetId) return
    const arr = [...modulos].sort((a, b) => a.ordem - b.ordem)
    const from = arr.findIndex((m) => m.id === dragMod)
    const to = arr.findIndex((m) => m.id === targetId)
    const [item] = arr.splice(from, 1)
    arr.splice(to, 0, item)
    const updated = arr.map((m, i) => ({ ...m, ordem: i }))
    setModulos(updated)
    setDragMod(null)
    Promise.all(updated.map((m) => updateModulo(m.id, { ordem: m.ordem })))
  }

  const [dragAula, setDragAula] = useState<string | null>(null)
  const onDropAula = async (targetId: string, modId: string) => {
    if (!dragAula || dragAula === targetId) return
    const modAulas = aulas.filter((a) => a.modulo === modId).sort((a, b) => a.ordem - b.ordem)
    const from = modAulas.findIndex((a) => a.id === dragAula)
    const to = modAulas.findIndex((a) => a.id === targetId)
    if (from === -1 || to === -1) return
    const [item] = modAulas.splice(from, 1)
    modAulas.splice(to, 0, item)
    const updated = modAulas.map((a, i) => ({ ...a, ordem: i }))
    setAulas([...aulas.filter((a) => a.modulo !== modId), ...updated])
    setDragAula(null)
    Promise.all(updated.map((a) => updateAula(a.id, { ordem: a.ordem })))
  }

  if (loading || !curso) return null

  return (
    <main className="flex-1 p-6 md:p-8 max-w-[1280px] mx-auto w-full flex flex-col gap-10 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-6 gap-4">
        <div>
          <Link
            to={`/cursos/${curso.slug}`}
            className="text-sm font-medium text-mute hover:text-ink flex items-center gap-2 mb-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar pro curso
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink">Editar Curso</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/cursos/${curso.slug}/analytics`}
            className="flex items-center gap-2 text-sm bg-wash border border-line px-4 py-2.5 rounded-xl font-medium hover:bg-line/50 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-sage" /> Analytics
          </Link>
          <Link
            to={`/cursos/${curso.slug}`}
            className="flex items-center gap-2 text-sm bg-wash border border-line px-4 py-2.5 rounded-xl font-medium hover:bg-line/50 transition-colors"
          >
            Ver como aluno <Eye className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div
            className="relative aspect-[21/9] bg-wash rounded-2xl border-2 border-dashed border-line flex items-center justify-center overflow-hidden group cursor-pointer hover:border-sage/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {curso.cover ? (
              <img
                src={getPublicFileUrl(curso, curso.cover)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                alt="Capa"
              />
            ) : (
              <div className="text-center text-mute">
                <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <span className="text-sm font-medium">Clique para upload da capa</span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleCourseUpdate({ cover: file })
              }}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-bold text-ink">Título</label>
            <Input
              defaultValue={curso.titulo}
              onBlur={(e) => {
                if (e.target.value && e.target.value !== curso.titulo)
                  handleCourseUpdate({ titulo: e.target.value, slug: toSlug(e.target.value) })
              }}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-bold text-ink">Tagline</label>
            <Input
              defaultValue={curso.tagline}
              onBlur={(e) => {
                if (e.target.value !== curso.tagline)
                  handleCourseUpdate({ tagline: e.target.value })
              }}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-bold text-ink">Descrição Completa</label>
            <div>
              <MarkdownEditor
                value={curso.descricao || ''}
                onChange={(val) => setCurso({ ...curso, descricao: val })}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-max"
              onClick={() => handleCourseUpdate({ descricao: curso.descricao })}
            >
              Salvar Descrição
            </Button>
          </div>

          <div className="mt-8 border-t border-line/50 pt-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-bold text-ink">Módulos e Aulas</h2>
              <Button
                onClick={() => {
                  setIsCreatingModulo(true)
                  setNewModuloTitle('')
                }}
                size="sm"
                className="gap-2 bg-ink text-white hover:bg-ink/90"
              >
                <Plus className="w-4 h-4" /> Novo módulo
              </Button>
            </div>
            <div className="flex flex-col gap-6">
              {isCreatingModulo && (
                <div className="bg-paper border border-line rounded-2xl overflow-hidden shadow-subtle p-4">
                  <Input
                    autoFocus
                    value={newModuloTitle}
                    onChange={(e) => setNewModuloTitle(e.target.value)}
                    placeholder="Título do módulo (Enter pra criar, Esc pra cancelar)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateModuloSubmit(newModuloTitle)
                      else if (e.key === 'Escape') setIsCreatingModulo(false)
                    }}
                    onBlur={() => handleCreateModuloSubmit(newModuloTitle)}
                  />
                </div>
              )}

              {modulos
                .sort((a, b) => a.ordem - b.ordem)
                .map((m) => (
                  <div
                    key={m.id}
                    draggable={!editingModulo && deletingItem?.id !== m.id}
                    onDragStart={() => setDragMod(m.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDropMod(m.id)}
                    className="bg-paper border border-line rounded-2xl overflow-hidden shadow-subtle transition-all"
                  >
                    {deletingItem?.type === 'modulo' && deletingItem.id === m.id ? (
                      <div className="bg-red-50 px-5 py-4 flex items-center justify-between border-b border-red-200">
                        <span className="text-sm font-bold text-red-700">
                          Excluir módulo {m.titulo}?
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-700 hover:text-red-800 hover:bg-red-100"
                            onClick={() => setDeletingItem(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteModulo(m.id)}
                          >
                            Sim, excluir
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-wash px-5 py-4 border-b border-line flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-wash/80">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-mute/50" />
                          {editingModulo?.id === m.id ? (
                            <Input
                              autoFocus
                              value={editingModulo.titulo}
                              onChange={(e) =>
                                setEditingModulo({ ...editingModulo, titulo: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter')
                                  handleRenameModuloSubmit(m.id, editingModulo.titulo)
                                else if (e.key === 'Escape') setEditingModulo(null)
                              }}
                              onBlur={() => handleRenameModuloSubmit(m.id, editingModulo.titulo)}
                              className="h-8 min-w-[200px]"
                            />
                          ) : (
                            <h3
                              className="font-bold text-ink hover:text-sage cursor-pointer transition-colors"
                              onClick={() => setEditingModulo({ id: m.id, titulo: m.titulo })}
                            >
                              {m.titulo}
                            </h3>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateAula(m.id)}
                            className="h-8 gap-1.5 font-medium"
                          >
                            <Plus className="w-3 h-3" /> Aula
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500/70 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeletingItem({ type: 'modulo', id: m.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col divide-y divide-line/50">
                      {aulas
                        .filter((a) => a.modulo === m.id)
                        .sort((a, b) => a.ordem - b.ordem)
                        .map((a) => (
                          <div key={a.id}>
                            {deletingItem?.type === 'aula' && deletingItem.id === a.id ? (
                              <div className="px-5 py-3 flex items-center justify-between bg-red-50 border-b border-red-100 last:border-0">
                                <span className="text-sm font-bold text-red-700">
                                  Excluir aula {a.titulo}?
                                </span>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-700 hover:text-red-800 hover:bg-red-100"
                                    onClick={() => setDeletingItem(null)}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteAulaConfirm(a.id)}
                                  >
                                    Sim, excluir
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                draggable
                                onDragStart={() => setDragAula(a.id)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => onDropAula(a.id, m.id)}
                                className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-wash/30 cursor-grab active:cursor-grabbing gap-3 group transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <GripVertical className="w-4 h-4 text-mute/30 group-hover:text-mute/50" />
                                  <Video className="w-4 h-4 text-sage" />
                                  <span className="text-sm font-medium text-ink/90 group-hover:text-ink">
                                    {a.titulo}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pl-11 sm:pl-0">
                                  <span className="text-xs text-mute font-mono bg-wash px-2 py-1 rounded-md">
                                    {a.duracao_min} min
                                  </span>
                                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-mute hover:text-ink"
                                      onClick={() => {
                                        navigate(`/cursos/${curso.slug}/aula/${a.slug}?edit=1`)
                                      }}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500/70 hover:text-red-600 hover:bg-red-50"
                                      onClick={() => setDeletingItem({ type: 'aula', id: a.id })}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              {modulos.length === 0 && !isCreatingModulo && (
                <div className="text-center py-10 border border-dashed border-line rounded-2xl bg-wash/30">
                  <p className="text-sm text-mute">Nenhum módulo criado ainda.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-paper p-6 rounded-2xl border border-line flex flex-col gap-8 shadow-subtle sticky top-24">
            <div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-4">
                Visibilidade
              </h3>
              <div className="flex items-center justify-between bg-wash p-3 rounded-xl border border-line/50">
                <span className="text-sm font-medium text-ink">Curso Publicado</span>
                <Switch
                  checked={curso.publicado}
                  onCheckedChange={(v) => handleCourseUpdate({ publicado: v })}
                />
              </div>
              <p className="text-xs text-mute mt-3 leading-relaxed">
                Cursos não publicados ficam visíveis apenas para administradores.
              </p>
            </div>

            <hr className="border-line border-dashed" />

            <div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-4">
                Tipo de Acesso
              </h3>
              <div className="flex flex-col gap-2">
                {(['free', 'pago', 'pro'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleCourseUpdate({ tipo: t })}
                    className={cn(
                      'px-4 py-3.5 rounded-xl border text-sm font-medium text-left transition-all',
                      curso.tipo === t
                        ? 'border-ink bg-ink text-white shadow-md'
                        : 'border-line text-mute bg-wash hover:border-ink/30 hover:bg-paper',
                    )}
                  >
                    <div className="capitalize flex items-center justify-between">
                      {t === 'free' ? 'Gratuito' : t}
                      {curso.tipo === t && (
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 p-6 rounded-2xl border border-red-200 bg-red-50">
            <h3 className="text-base font-bold text-red-700 mb-2">Zona de Perigo</h3>
            <p className="text-xs text-red-600/80 mb-5 leading-relaxed">
              A exclusão do curso é permanente e apagará irremediavelmente todos os módulos, aulas e
              o progresso dos alunos.
            </p>
            <Button
              variant="destructive"
              className="w-full font-bold shadow-sm hover:shadow-md transition-shadow"
              onClick={async () => {
                if (window.confirm('Tem certeza absoluta? Esta ação não pode ser desfeita.')) {
                  await deleteCurso(curso.id)
                  navigate('/cursos')
                }
              }}
            >
              Excluir curso
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
