import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  getCursoBySlug,
  getModulosByCurso,
  getAulasByCurso,
  getAulaBySlug,
  getProgressoCurso,
  toggleAulaProgresso,
  updateAula,
} from '@/services/courses'
import { useAuth } from '@/hooks/use-auth'
import {
  ChevronLeft,
  CheckCircle2,
  Circle,
  Menu,
  X,
  Lock,
  Check,
  Save,
  Plus,
  Trash2,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { getEmbedUrl } from '@/lib/video-helper'
import {
  FileIcon,
  Image as ImageIcon,
  FileTextIcon,
  PresentationIcon,
  TableIcon,
  DownloadIcon,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { AuroraBackground } from '@/components/AuroraBackground'

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (['pdf'].includes(ext || '')) return <FileTextIcon className="w-5 h-5 text-red-500" />
  if (['doc', 'docx'].includes(ext || '')) return <FileTextIcon className="w-5 h-5 text-blue-500" />
  if (['xls', 'xlsx'].includes(ext || '')) return <TableIcon className="w-5 h-5 text-green-500" />
  if (['ppt', 'pptx'].includes(ext || ''))
    return <PresentationIcon className="w-5 h-5 text-orange-500" />
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || ''))
    return <ImageIcon className="w-5 h-5 text-purple-500" />
  return <FileIcon className="w-5 h-5 text-mute" />
}

export default function LessonPlayerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { slug, aulaSlug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [curso, setCurso] = useState<any>(null)
  const [aula, setAula] = useState<any>(null)
  const [modulos, setModulos] = useState<any[]>([])
  const [aulas, setAulas] = useState<any[]>([])
  const [progresso, setProgresso] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  const isAdmin = user?.role === 'admin'
  const [isEditMode, setIsEditMode] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [removedFiles, setRemovedFiles] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRefVideo = useRef<HTMLInputElement>(null)
  const [videoTab, setVideoTab] = useState<'url' | 'upload'>('url')
  const [uploadingVideo, setUploadingVideo] = useState(false)

  useEffect(() => {
    if (isAdmin && searchParams.get('edit') === '1') {
      setIsEditMode(true)
    } else {
      setIsEditMode(false)
    }
  }, [searchParams, isAdmin])

  useEffect(() => {
    if (!slug || !aulaSlug || !user) return
    loadData()
  }, [slug, aulaSlug, user])

  useEffect(() => {
    if (aula) {
      setEditData({
        titulo: aula.titulo,
        video_url: aula.video_url || '',
        duracao_min: aula.duracao_min || 0,
        descricao: aula.descricao || '',
      })
      setPendingFiles([])
      setRemovedFiles([])
      setVideoTab(aula.video_file ? 'upload' : 'url')
    }
  }, [aula?.id])

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 15728640 // 15 MB
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      toast.error(
        `Arquivo grande demais (${sizeMB} MB). Limite: 15 MB. Use YouTube/Vimeo pra vídeos maiores.`,
      )
      if (fileInputRefVideo.current) {
        fileInputRefVideo.current.value = ''
      }
      return
    }

    setUploadingVideo(true)
    const toastId = toast.loading('Subindo vídeo...')
    try {
      const formData = new FormData()
      formData.append('video_file', file)
      await updateAula(aula.id, formData)

      const refetched = await getAulaBySlug(aulaSlug as string)
      setAula(refetched)
      setAulas((prev) => prev.map((a) => (a.id === refetched.id ? refetched : a)))

      toast.success('Vídeo enviado com sucesso!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Erro ao enviar vídeo.', { id: toastId })
    } finally {
      setUploadingVideo(false)
      if (fileInputRefVideo.current) {
        fileInputRefVideo.current.value = ''
      }
    }
  }

  const handleRemoveVideoFile = async () => {
    if (!window.confirm('Tem certeza que deseja remover este vídeo?')) return
    setUploadingVideo(true)
    const toastId = toast.loading('Removendo vídeo...')
    try {
      const formData = new FormData()
      formData.append('video_file', '')
      await updateAula(aula.id, formData)

      const refetched = await getAulaBySlug(aulaSlug as string)
      setAula(refetched)
      setAulas((prev) => prev.map((a) => (a.id === refetched.id ? refetched : a)))

      toast.success('Vídeo removido com sucesso!', { id: toastId })
      setVideoTab('url')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao remover vídeo.', { id: toastId })
    } finally {
      setUploadingVideo(false)
    }
  }

  const isDirty =
    editData &&
    aula &&
    (editData.titulo !== aula.titulo ||
      editData.video_url !== (aula.video_url || '') ||
      editData.duracao_min !== (aula.duracao_min || 0) ||
      editData.descricao !== (aula.descricao || '') ||
      pendingFiles.length > 0 ||
      removedFiles.length > 0)

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const loadData = async () => {
    setLoading(true)
    try {
      const c = await getCursoBySlug(slug as string)

      if (c.tipo === 'pro' && user?.role !== 'admin' && user?.role !== 'pro') {
        setCurso(c)
        setLoading(false)
        return
      }

      const a = await getAulaBySlug(aulaSlug as string)
      if (a.expand?.curso?.id !== c.id) throw new Error('Mismatch')

      const [m, al, p] = await Promise.all([
        getModulosByCurso(c.id),
        getAulasByCurso(c.id),
        getProgressoCurso(user!.id, c.id),
      ])

      setCurso(c)
      setAula(a)
      setModulos(m)
      setAulas(al)
      setProgresso(p)
    } catch (err) {
      console.error(err)
      navigate(`/cursos/${slug}`)
    } finally {
      setLoading(false)
      setSidebarOpen(false)
    }
  }

  const handleToggleProgresso = async () => {
    if (!user || !aula || updating) return
    setUpdating(true)
    const isCompleted = progresso.some((p) => p.aula === aula.id)

    try {
      await toggleAulaProgresso(user.id, aula.id, !isCompleted)
      if (isCompleted) {
        setProgresso(progresso.filter((p) => p.aula !== aula.id))
      } else {
        setProgresso([...progresso, { aula: aula.id, completou: true }])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  const handleToggleEdit = () => {
    if (isEditMode && isDirty) {
      if (
        !window.confirm(
          'Você tem mudanças não salvas. Tem certeza que deseja sair do modo de edição?',
        )
      ) {
        return
      }
      setEditData({
        titulo: aula.titulo,
        video_url: aula.video_url || '',
        duracao_min: aula.duracao_min || 0,
        descricao: aula.descricao || '',
      })
      setPendingFiles([])
      setRemovedFiles([])
    }

    if (isEditMode) {
      searchParams.delete('edit')
      setSearchParams(searchParams, { replace: true })
    } else {
      setSearchParams({ edit: '1' }, { replace: true })
    }
  }

  const handleSave = async () => {
    if (!editData.titulo.trim()) {
      toast.error('O título não pode estar vazio')
      return
    }
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('titulo', editData.titulo)
      formData.append('video_url', editData.video_url)
      formData.append('duracao_min', String(editData.duracao_min))
      formData.append('descricao', editData.descricao)

      pendingFiles.forEach((f) => formData.append('anexos+', f))
      removedFiles.forEach((r) => formData.append('anexos-', r))

      const updated = await updateAula(aula.id, formData)

      setAula(updated)
      setAulas(aulas.map((a) => (a.id === updated.id ? updated : a)))

      setPendingFiles([])
      setRemovedFiles([])
      toast.success('Aula salva com sucesso')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar aula')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex justify-center items-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-sage border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!curso) return null

  if (curso.tipo === 'pro' && user?.role !== 'admin' && user?.role !== 'pro') {
    return (
      <div className="h-screen w-full relative flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <AuroraBackground />
        <div className="w-16 h-16 bg-warm/10 rounded-2xl flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-warm" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-ink mb-2">Conteúdo Pro Exclusivo</h1>
        <p className="text-mute mb-8 max-w-sm">
          Esta aula faz parte de um curso exclusivo para assinantes Pro. Faça o upgrade para ter
          acesso.
        </p>
        <Link to={`/cursos/${curso.slug}`}>
          <Button
            variant="outline"
            className="rounded-xl border-line text-ink hover:bg-white h-12 px-6 font-medium"
          >
            Voltar para o curso
          </Button>
        </Link>
      </div>
    )
  }

  if (!aula) return null

  const isCompleted = progresso.some((p) => p.aula === aula.id)

  const currentIndex = aulas.findIndex((a) => a.id === aula.id)
  const prevAula = currentIndex > 0 ? aulas[currentIndex - 1] : null
  const nextAula = currentIndex < aulas.length - 1 ? aulas[currentIndex + 1] : null

  const activeVideoUrl = isEditMode ? editData?.video_url : aula.video_url

  const renderSidebar = () => (
    <div className="flex flex-col h-full bg-paper border-r border-line w-80 shrink-0 relative">
      <div className="p-5 border-b border-line flex flex-col gap-4 relative z-10 bg-paper">
        <Link
          to={`/cursos/${curso.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-mute hover:text-ink transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Voltar
        </Link>
        <h2 className="font-serif font-bold text-lg text-ink leading-tight line-clamp-2">
          {curso.titulo}
        </h2>
      </div>

      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="flex flex-col py-2">
          {modulos.map((modulo, i) => {
            const modAulas = aulas.filter((a) => a.modulo === modulo.id)
            if (modAulas.length === 0) return null
            return (
              <div key={modulo.id} className="mb-4">
                <div className="px-5 py-2">
                  <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-mute">
                    Mod {i + 1} · {modulo.titulo}
                  </h3>
                </div>
                <div className="flex flex-col">
                  {modAulas.map((a, j) => {
                    const active = a.id === aula.id
                    const comp = progresso.some((p) => p.aula === a.id)
                    return (
                      <Link
                        to={`/cursos/${curso.slug}/aula/${a.slug}${isEditMode ? '?edit=1' : ''}`}
                        key={a.id}
                        className={cn(
                          'px-5 py-2.5 flex items-start gap-3 transition-colors',
                          active ? 'bg-sage/10 relative' : 'hover:bg-wash',
                          comp && !active ? 'opacity-70 hover:opacity-100' : '',
                        )}
                        onClick={(e) => {
                          if (isDirty && active) {
                            e.preventDefault()
                            if (
                              window.confirm(
                                'Você tem mudanças não salvas. Tem certeza que deseja sair?',
                              )
                            ) {
                              navigate(
                                `/cursos/${curso.slug}/aula/${a.slug}${isEditMode ? '?edit=1' : ''}`,
                              )
                            }
                          } else if (isDirty && !active) {
                            e.preventDefault()
                            if (
                              window.confirm(
                                'Você tem mudanças não salvas. Tem certeza que deseja sair e perder as alterações?',
                              )
                            ) {
                              navigate(
                                `/cursos/${curso.slug}/aula/${a.slug}${isEditMode ? '?edit=1' : ''}`,
                              )
                            }
                          }
                        }}
                      >
                        {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-sage" />}
                        <div className="pt-0.5 shrink-0">
                          {comp ? (
                            <CheckCircle2 className="w-4 h-4 text-sage" />
                          ) : (
                            <Circle
                              className={cn('w-4 h-4', active ? 'text-sage' : 'text-mute/50')}
                            />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={cn(
                              'text-sm font-medium leading-snug line-clamp-2',
                              active ? 'text-ink' : 'text-ink/80',
                            )}
                          >
                            {j + 1}. {a.titulo}
                          </span>
                          <span className="text-[10px] text-mute font-mono mt-1">
                            {a.duracao_min} min
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden relative animate-fade-in">
      <AuroraBackground />
      <div className="md:hidden flex items-center justify-between p-4 bg-paper border-b border-line shrink-0 z-20 relative">
        <Link to={`/cursos/${curso.slug}`} className="text-mute">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <span className="font-serif font-bold text-sm truncate px-4">{curso.titulo}</span>
        <button onClick={() => setSidebarOpen(true)} className="text-ink">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="w-80 max-w-[85vw] h-full bg-paper relative z-10 shadow-2xl flex flex-col slide-in-from-left-full animate-in duration-300">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-mute hover:text-ink z-20 bg-wash rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
            {renderSidebar()}
          </div>
        </div>
      )}

      <div className="hidden md:flex h-full">{renderSidebar()}</div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <ScrollArea className="flex-1 w-full">
          <div className="max-w-4xl mx-auto w-full p-4 md:p-8 lg:py-12">
            {isAdmin && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-line bg-paper shadow-subtle">
                <div className="flex items-center gap-3">
                  <Switch checked={isEditMode} onCheckedChange={handleToggleEdit} id="edit-mode" />
                  <label htmlFor="edit-mode" className="text-sm font-bold text-ink cursor-pointer">
                    Modo Edição (Admin)
                  </label>
                </div>

                {isEditMode && (
                  <div className="flex items-center gap-4">
                    {isDirty && (
                      <span className="text-xs font-medium text-warm animate-pulse">
                        Mudanças não salvas
                      </span>
                    )}
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!isDirty || isSaving}
                      className={cn(
                        'gap-2',
                        isDirty ? 'bg-ink text-white' : 'bg-wash text-mute border-line shadow-none',
                      )}
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Salvar mudanças
                    </Button>
                  </div>
                )}
              </div>
            )}

            {isEditMode ? (
              <Input
                className="font-serif text-3xl font-bold text-ink mb-6 h-auto py-2 border-x-0 border-t-0 border-b-2 border-dashed border-line rounded-none focus-visible:ring-0 focus-visible:border-sage px-0 bg-transparent shadow-none"
                value={editData?.titulo || ''}
                onChange={(e) => setEditData({ ...editData, titulo: e.target.value })}
                placeholder="Título da Aula"
              />
            ) : (
              <h1 className="font-serif text-3xl font-bold text-ink mb-6">{aula.titulo}</h1>
            )}

            <div
              className="w-full min-h-[300px] bg-ink rounded-2xl overflow-hidden shadow-xl mb-8 border border-ink/10 relative group"
              style={{ aspectRatio: '16 / 9' }}
            >
              {aula.video_file ? (
                <video
                  src={getPublicFileUrl(aula, aula.video_file)}
                  controls
                  controlsList="nodownload"
                  preload="metadata"
                  className="w-full h-full object-cover absolute inset-0"
                  onError={(e) => {
                    const target = e.target as HTMLVideoElement
                    toast.error('Não foi possível carregar o vídeo.')
                    console.error(
                      `Erro no vídeo: ${target.error?.message || 'Desconhecido'} (Código: ${target.error?.code || 'N/A'})\nURL: ${target.src}`,
                    )
                  }}
                />
              ) : activeVideoUrl ? (
                <iframe
                  src={getEmbedUrl(activeVideoUrl).url || activeVideoUrl}
                  className="w-full h-full border-0 absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/50 text-sm font-mono gap-2">
                  <Video className="w-8 h-8 opacity-50" />
                  {isEditMode ? 'Configure o vídeo abaixo' : 'Vídeo não disponível'}
                </div>
              )}
            </div>

            {isEditMode && (
              <div className="bg-paper p-5 rounded-2xl border border-line mb-8 shadow-subtle flex flex-col">
                <div className="flex gap-4 border-b border-line mb-6">
                  <button
                    onClick={() => setVideoTab('url')}
                    className={cn(
                      'px-4 py-2 text-sm font-bold border-b-2 transition-colors -mb-[1px]',
                      videoTab === 'url'
                        ? 'border-sage text-ink'
                        : 'border-transparent text-mute hover:text-ink',
                    )}
                  >
                    URL Externa
                  </button>
                  <button
                    onClick={() => setVideoTab('upload')}
                    className={cn(
                      'px-4 py-2 text-sm font-bold border-b-2 transition-colors -mb-[1px]',
                      videoTab === 'upload'
                        ? 'border-sage text-ink'
                        : 'border-transparent text-mute hover:text-ink',
                    )}
                  >
                    Upload Próprio
                  </button>
                </div>

                <div className="grid sm:grid-cols-[1fr_120px] gap-6">
                  {videoTab === 'url' ? (
                    <div className="grid gap-2 content-start">
                      <label className="text-xs font-bold text-ink uppercase tracking-wider">
                        URL do vídeo (embed)
                      </label>
                      <Input
                        value={editData?.video_url || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          const { url, converted } = getEmbedUrl(val)
                          setEditData({ ...editData, video_url: val })
                          if (converted) {
                            setTimeout(
                              () => setEditData((p: any) => ({ ...p, video_url: url })),
                              100,
                            )
                          }
                        }}
                        placeholder="YouTube, Vimeo, etc..."
                        className="shadow-none bg-wash"
                      />
                      <p className="text-[10px] text-mute mt-1">
                        Suporta links do YouTube, Vimeo, Loom e Cloudflare Stream. Conversão
                        automática.
                      </p>
                      {aula.video_file && (
                        <p className="text-[10px] text-warm font-medium mt-1">
                          ⚠️ Um vídeo enviado por upload já existe e tem prioridade. Remova-o para
                          usar esta URL.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-2 content-start">
                      <label className="text-xs font-bold text-ink uppercase tracking-wider">
                        Arquivo de vídeo
                      </label>
                      {aula.video_file ? (
                        <div className="flex items-center justify-between p-3 rounded-xl border border-sage/30 bg-sage/5">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <Video className="w-5 h-5 text-sage shrink-0" />
                            <span className="text-sm font-medium text-sage truncate">
                              {aula.video_file.replace(/_[a-zA-Z0-9]+\./, '.')}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveVideoFile}
                            disabled={uploadingVideo}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/x-msvideo"
                            className="hidden"
                            ref={fileInputRefVideo}
                            onChange={handleVideoUpload}
                          />
                          <Button
                            variant="outline"
                            className="w-full border-dashed h-11 text-mute hover:text-ink font-medium"
                            onClick={() => fileInputRefVideo.current?.click()}
                            disabled={uploadingVideo}
                          >
                            {uploadingVideo ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                              <Video className="w-4 h-4 mr-2" />
                            )}
                            {uploadingVideo ? 'Enviando...' : 'Selecionar vídeo (Até 15MB)'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid gap-2 content-start">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">
                      Duração (min)
                    </label>
                    <Input
                      type="number"
                      value={editData?.duracao_min || 0}
                      onChange={(e) =>
                        setEditData({ ...editData, duracao_min: Number(e.target.value) })
                      }
                      className="shadow-none bg-wash"
                    />
                  </div>
                </div>
              </div>
            )}

            {!isEditMode && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-paper p-4 rounded-2xl border border-line shadow-subtle">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleToggleProgresso}
                    disabled={updating}
                    className={cn(
                      'rounded-xl h-11 px-6 text-sm font-medium transition-all shadow-none',
                      isCompleted
                        ? 'bg-sage/10 text-sage hover:bg-sage/20 border border-sage/20'
                        : 'bg-ink text-white hover:bg-ink/90',
                    )}
                  >
                    {updating ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    ) : isCompleted ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    {isCompleted ? 'Concluída' : 'Marcar como concluída'}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={!prevAula}
                    onClick={() =>
                      prevAula && navigate(`/cursos/${curso.slug}/aula/${prevAula.slug}`)
                    }
                    className="rounded-xl h-11 flex-1 sm:flex-none font-medium border-line text-ink"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!nextAula}
                    onClick={() =>
                      nextAula && navigate(`/cursos/${curso.slug}/aula/${nextAula.slug}`)
                    }
                    className="rounded-xl h-11 flex-1 sm:flex-none font-medium border-line text-ink"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}

            <div className="mb-12">
              {isEditMode ? (
                <div className="mb-12">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider mb-2 block">
                    Descrição da Aula
                  </label>
                  <MarkdownEditor
                    value={editData?.descricao || ''}
                    onChange={(val) => setEditData({ ...editData, descricao: val })}
                    minHeight="300px"
                  />
                </div>
              ) : (
                aula.descricao && <MarkdownRenderer content={aula.descricao} />
              )}

              {(aula.anexos?.length > 0 || isEditMode) && (
                <div className="mt-12 pt-8 border-t border-line">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                      Material de Apoio
                    </h3>
                    {isEditMode && (
                      <>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              setPendingFiles([...pendingFiles, ...Array.from(e.target.files)])
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="border-dashed"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Adicionar arquivos
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {aula.anexos
                      ?.filter((a: string) => !removedFiles.includes(a))
                      .map((filename: string) => (
                        <div
                          key={filename}
                          className="flex items-center gap-3 p-3 rounded-xl border border-line bg-wash hover:bg-paper transition-colors group shadow-subtle hover:shadow-sm"
                        >
                          <div className="bg-paper border border-line p-2 rounded-lg">
                            {getFileIcon(filename)}
                          </div>
                          <a
                            href={getPublicFileUrl(aula, filename)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 overflow-hidden"
                          >
                            <p className="text-sm font-medium text-ink truncate group-hover:text-sage transition-colors">
                              {filename.replace(/_[a-zA-Z0-9]+\./, '.')}
                            </p>
                          </a>
                          {isEditMode ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setRemovedFiles([...removedFiles, filename])}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ) : (
                            <a
                              href={getPublicFileUrl(aula, filename)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <DownloadIcon className="w-4 h-4 text-mute group-hover:text-sage transition-colors shrink-0" />
                            </a>
                          )}
                        </div>
                      ))}

                    {isEditMode &&
                      pendingFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 rounded-xl border border-sage/30 bg-sage/5 transition-colors shadow-subtle"
                        >
                          <div className="bg-paper border border-line p-2 rounded-lg">
                            {getFileIcon(file.name)}
                          </div>
                          <div className="flex-1 overflow-hidden flex items-center gap-2">
                            <p className="text-sm font-medium text-sage truncate">{file.name}</p>
                            <span className="text-[10px] bg-sage/20 text-sage px-1.5 rounded uppercase font-bold tracking-wider shrink-0">
                              Novo
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setPendingFiles(pendingFiles.filter((_, i) => i !== idx))
                            }
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
