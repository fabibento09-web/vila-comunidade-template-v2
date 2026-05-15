import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useComposer } from '@/hooks/use-composer'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  Eye,
  Edit3,
  Image as ImageIcon,
  X,
  Loader2,
} from 'lucide-react'
import pbClient from '@/lib/pocketbase/client'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { PostagemCard } from './PostagemCard'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function PostComposer() {
  const { isOpen, closeComposer, initialEspacoId, initialDraftId } = useComposer()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [draftId, setDraftId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [coverCleared, setCoverCleared] = useState(false)
  const [hasUnsavedCover, setHasUnsavedCover] = useState(false)

  const [espacoId, setEspacoId] = useState(initialEspacoId || '')
  const [visibility, setVisibility] = useState<'todos' | 'pro'>('todos')
  const [publishTime, setPublishTime] = useState<'now' | 'schedule'>('now')
  const [scheduledDate, setScheduledDate] = useState('')

  const [spaces, setSpaces] = useState<any[]>([])
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [draftsCount, setDraftsCount] = useState(0)

  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && user && !initialDraftId) {
      pbClient
        .collection('postagens')
        .getList(1, 1, { filter: `autor="${user.id}" && (status="rascunho" || status="agendado")` })
        .then((res) => setDraftsCount(res.totalItems))
        .catch(console.error)
    }
  }, [isOpen, user, initialDraftId])

  useEffect(() => {
    if (isOpen) {
      if (initialDraftId) {
        pbClient
          .collection('postagens')
          .getOne(initialDraftId)
          .then((rec) => {
            setDraftId(rec.id)
            setTitle(rec.titulo)
            setBody(rec.corpo)
            setEspacoId(rec.espaco || initialEspacoId || '')
            setVisibility((rec.visibility as any) || 'todos')
            if (rec.status === 'agendado') {
              setPublishTime('schedule')
              setScheduledDate(
                rec.agendado_para ? new Date(rec.agendado_para).toISOString().slice(0, 16) : '',
              )
            } else {
              setPublishTime('now')
              setScheduledDate('')
            }
            if (rec.cover) {
              setCoverPreview(getPublicFileUrl(rec, rec.cover))
            } else {
              setCoverPreview(null)
            }
          })
          .catch(console.error)
      } else {
        setDraftId(null)
        setTitle('')
        setBody('')
        setEspacoId(initialEspacoId || '')
        setCoverFile(null)
        setCoverPreview(null)
        setVisibility('todos')
        setPublishTime('now')
        setScheduledDate('')
      }

      setStep(1)
      setPreviewMode(false)
      setSaveStatus('idle')
      setLastSaved(null)
      setCoverCleared(false)
      setHasUnsavedCover(false)
    }
  }, [isOpen, initialDraftId, initialEspacoId])

  useEffect(() => {
    pbClient
      .collection('espacos')
      .getFullList()
      .then((data) => {
        const sorted = [...data].sort((a, b) => {
          if (a.slug === 'inicio') return -1
          if (b.slug === 'inicio') return 1
          return 0
        })
        setSpaces(sorted)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (isOpen && !initialDraftId && !initialEspacoId && !espacoId && spaces.length > 0) {
      const inicioSpace = spaces.find((s) => s.slug === 'inicio')
      if (inicioSpace) {
        setEspacoId(inicioSpace.id)
      }
    }
  }, [isOpen, initialDraftId, initialEspacoId, espacoId, spaces])

  const saveDraft = useCallback(async () => {
    if (!user) return
    setSaveStatus('saving')
    try {
      const fd = new FormData()
      fd.append('titulo', title || 'Sem título')
      fd.append('corpo', body || '...')
      fd.append('status', 'rascunho')
      fd.append('autor', user.id)
      if (espacoId) fd.append('espaco', espacoId)
      fd.append('visibility', visibility)
      if (coverCleared) fd.append('cover', '')
      else if (coverFile && hasUnsavedCover) fd.append('cover', coverFile)

      let cid = draftId
      if (cid) await pbClient.collection('postagens').update(cid, fd)
      else {
        const rec = await pbClient.collection('postagens').create(fd)
        cid = rec.id
        setDraftId(rec.id)
      }
      setHasUnsavedCover(false)
      setCoverCleared(false)
      setSaveStatus('saved')
      setLastSaved(new Date())
    } catch {
      setSaveStatus('idle')
    }
  }, [title, body, user, espacoId, visibility, coverFile, hasUnsavedCover, coverCleared, draftId])

  const isDraftValid = title.trim() !== '' || body.trim() !== ''
  useEffect(() => {
    if (!isOpen || !isDraftValid) return
    const timer = setTimeout(saveDraft, 1000)
    return () => clearTimeout(timer)
  }, [title, body, espacoId, visibility, coverFile, coverCleared, isOpen, isDraftValid, saveDraft])

  useEffect(() => {
    if (saveStatus !== 'saved' || !lastSaved) return
    setSecondsAgo(0)
    const int = setInterval(
      () => setSecondsAgo(Math.floor((Date.now() - lastSaved.getTime()) / 1000)),
      1000,
    )
    return () => clearInterval(int)
  }, [saveStatus, lastSaved])

  const isScheduleValid = () => {
    if (publishTime === 'now') return true
    if (!scheduledDate) return false
    return new Date(scheduledDate) > new Date(Date.now() + 5 * 60000)
  }

  const handlePublish = async () => {
    if (!user || !espacoId) return
    if (publishTime === 'schedule' && !isScheduleValid()) return
    const fd = new FormData()
    fd.append('titulo', title)
    fd.append('corpo', body)
    fd.append('status', publishTime === 'schedule' ? 'agendado' : 'publicado')
    fd.append('espaco', espacoId)
    fd.append('visibility', visibility)
    if (publishTime === 'schedule')
      fd.append('agendado_para', new Date(scheduledDate).toISOString())
    else fd.append('publicado_em', new Date().toISOString())
    if (coverCleared) fd.append('cover', '')
    else if (coverFile && hasUnsavedCover) fd.append('cover', coverFile)

    try {
      let cid = draftId
      if (cid) await pbClient.collection('postagens').update(cid, fd)
      else cid = (await pbClient.collection('postagens').create(fd)).id

      if (publishTime === 'schedule') {
        toast(`Postagem agendada pra ${format(new Date(scheduledDate), 'dd/MM', { locale: ptBR })}`)
        closeComposer()
      } else {
        toast.success('Sua postagem tá no ar.')
        closeComposer()
        navigate(`/p/${cid}`)
      }
    } catch {
      toast.error('Erro ao publicar. Tente novamente.')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('user', user.id)
      fd.append('context', 'postagem')
      const res = await pbClient.collection('uploads').create(fd)
      const url = getPublicFileUrl(res, res.file)
      insertText(`\n![${file.name}](${url})\n`)
    } catch (err) {
      toast.error('Erro ao subir imagem.')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const renderMarkdown = (text: string) => {
    const html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" class="text-warm hover:underline" target="_blank">$1</a>',
      )
      .replace(/(?:^|\n)- (.*)/g, '\n<li>$1</li>')
      .split('\n\n')
      .map((p) =>
        p.includes('<li>')
          ? `<ul class="list-disc pl-5 my-2">${p}</ul>`
          : `<p class="my-2">${p}</p>`,
      )
      .join('')
    return { __html: html }
  }

  const insertText = (b: string, a = '') => {
    if (!textareaRef.current) return
    const { selectionStart: s, selectionEnd: e } = textareaRef.current
    setBody(body.substring(0, s) + b + body.substring(s, e) + a + body.substring(e))
    setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(s + b.length, e + b.length)
    }, 0)
  }

  const previewPost = {
    id: draftId || 'preview',
    titulo: title || 'Sem título',
    corpo: body,
    cover_url: coverPreview,
    expand: { autor: user, espaco: spaces.find((s) => s.id === espacoId) },
    publicado_em: new Date().toISOString(),
    min_leitura: Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 200) || 1,
    curtidas: 0,
    comentarios: 0,
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          if (isDraftValid) {
            toast('Rascunho salvo.', {
              action: {
                label: 'Ver rascunhos →',
                onClick: () => navigate('/rascunhos'),
              },
            })
          }
          closeComposer()
        }
      }}
    >
      <DialogContent className="max-w-3xl h-[85vh] p-0 gap-0 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden bg-background">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                disabled={s > step && s === 4 && (!title || !body || !espacoId)}
                className={`px-3 py-1 text-xs font-bold rounded-full ${s === step ? 'bg-sage text-white' : s < step ? 'text-sage hover:bg-sage/10' : 'text-mute cursor-not-allowed'}`}
              >
                {s}. {['ESCREVER', 'CAPA', 'CONTEXTO', 'REVISAR'][s - 1]}
              </button>
            ))}
          </div>
          <div className="font-mono text-xs text-mute flex items-center gap-2">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3 h-3 animate-spin" /> Salvando...
              </>
            )}
            {saveStatus === 'saved' && lastSaved && `Rascunho salvo há ${secondsAgo}s`}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
          {step === 1 && draftsCount > 0 && !draftId && (
            <div className="bg-sage/10 text-sage text-sm font-medium px-4 py-3 rounded-lg mb-6 flex items-center justify-between border border-sage/20 animate-fade-in">
              <span>
                Você tem {draftsCount} rascunho{draftsCount > 1 ? 's' : ''} salvo
                {draftsCount > 1 ? 's' : ''}.
              </span>
              <button
                onClick={() => {
                  closeComposer()
                  navigate('/rascunhos')
                }}
                className="underline hover:text-sage/80"
              >
                Ver lista →
              </button>
            </div>
          )}
          {step === 1 && (
            <div className="flex flex-col h-full min-h-[400px]">
              <input
                autoFocus
                placeholder="Título da postagem..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-3xl font-serif font-bold border-b border-line pb-4 focus:outline-none bg-transparent placeholder:text-mute"
              />
              <div className="flex items-center gap-1 py-3 border-b border-line">
                <Button variant="ghost" size="icon" onClick={() => insertText('**', '**')}>
                  <Bold className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => insertText('*', '*')}>
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => insertText('[', '](url)')}>
                  <LinkIcon className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => insertText('\n- ')}>
                  <List className="w-4 h-4" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="text-sage"
                >
                  {previewMode ? (
                    <Edit3 className="w-4 h-4 mr-2" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}{' '}
                  {previewMode ? 'Editar' : 'Pré-visualizar'}
                </Button>
              </div>
              <div className="flex-1 mt-4 relative">
                {previewMode ? (
                  <div
                    className="prose prose-sage max-w-none"
                    dangerouslySetInnerHTML={renderMarkdown(body || '*Nenhum conteúdo ainda...*')}
                  />
                ) : (
                  <textarea
                    ref={textareaRef}
                    placeholder="Escreva sua postagem aqui... Use markdown para formatar."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
                        e.preventDefault()
                        insertText('**', '**')
                      }
                      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
                        e.preventDefault()
                        insertText('*', '*')
                      }
                    }}
                    className="w-full h-full min-h-[300px] resize-none focus:outline-none bg-transparent leading-relaxed"
                  />
                )}
              </div>
              <div className="pt-4 text-xs font-mono text-mute border-t border-line mt-auto">
                {body.length} caracteres · ~
                {Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 200) || 1} min de
                leitura
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-serif font-bold text-ink mb-2">Adicionar uma capa</h2>
                <p className="text-mute">
                  A capa é opcional, mas ajuda sua postagem a se destacar.
                </p>
              </div>
              {coverPreview ? (
                <div className="relative w-full max-w-xl aspect-video rounded-xl overflow-hidden border border-line">
                  <img src={coverPreview} alt="Capa" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setCoverFile(null)
                      setCoverPreview(null)
                      setCoverCleared(true)
                      setHasUnsavedCover(false)
                    }}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    if (e.dataTransfer.files?.[0]) {
                      setCoverFile(e.dataTransfer.files[0])
                      setCoverPreview(URL.createObjectURL(e.dataTransfer.files[0]))
                      setHasUnsavedCover(true)
                      setCoverCleared(false)
                    }
                  }}
                  className={`w-full max-w-xl aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative transition-colors ${isDragging ? 'border-sage bg-sage/5' : 'border-line hover:border-sage/50 bg-wash'}`}
                >
                  <ImageIcon className="w-10 h-10 text-mute mb-4" />
                  <p className="text-ink font-medium mb-1">Arraste uma imagem para cá</p>
                  <p className="text-mute text-sm mb-4">ou clique para escolher do computador</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setCoverFile(e.target.files[0])
                        setCoverPreview(URL.createObjectURL(e.target.files[0]))
                        setHasUnsavedCover(true)
                        setCoverCleared(false)
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}
          {step === 3 && (
            <div className="max-w-xl mx-auto space-y-8 pb-10">
              <div className="mb-2 text-center">
                <h2 className="text-2xl font-serif font-bold text-ink mb-2">
                  Contexto e Visibilidade
                </h2>
                <p className="text-mute">Onde e para quem essa postagem será publicada?</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-mute">
                  1. Escolha o Espaço
                </h3>
                <div className="flex flex-wrap gap-2">
                  {spaces.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setEspacoId(s.id)}
                      className={`px-4 py-2 rounded-full border transition-colors flex items-center gap-2 ${espacoId === s.id ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-mute hover:border-ink hover:text-ink'}`}
                    >
                      <span>{s.emoji}</span>
                      <span className="font-medium text-sm">{s.nome}</span>
                    </button>
                  ))}
                </div>
                {!espacoId && (
                  <p className="text-xs text-destructive mt-1">
                    Selecione um espaço para continuar.
                  </p>
                )}
                {espacoId && spaces.find((s) => s.id === espacoId)?.slug === 'inicio' && (
                  <p className="text-sm text-sage/90 mt-2 bg-sage/5 p-3 rounded-lg border border-sage/10">
                    Postagens no Início aparecem no feed geral. Você pode escolher outro espaço
                    acima.
                  </p>
                )}
              </div>
              <div className="space-y-4 pt-4 border-t border-line">
                <h3 className="text-sm font-bold uppercase tracking-wider text-mute">
                  2. Visibilidade
                </h3>
                <div className="flex gap-4">
                  <label
                    className={`flex-1 p-4 rounded-xl border cursor-pointer transition-colors ${visibility === 'todos' ? 'border-sage bg-sage/5' : 'border-line hover:border-sage/30'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        checked={visibility === 'todos'}
                        onChange={() => setVisibility('todos')}
                        className="accent-sage"
                      />
                      <span className="font-medium text-ink">Todos da Vila</span>
                    </div>
                    <p className="text-xs text-mute ml-6">Qualquer membro pode ler e interagir.</p>
                  </label>
                  <label
                    className={`flex-1 p-4 rounded-xl border cursor-pointer transition-colors ${visibility === 'pro' ? 'border-sage bg-sage/5' : 'border-line hover:border-sage/30'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        checked={visibility === 'pro'}
                        onChange={() => setVisibility('pro')}
                        className="accent-sage"
                      />
                      <span className="font-medium text-ink">Só membros Pro</span>
                    </div>
                    <p className="text-xs text-mute ml-6">Conteúdo exclusivo para assinantes.</p>
                  </label>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-line">
                <h3 className="text-sm font-bold uppercase tracking-wider text-mute">
                  3. Quando Publicar?
                </h3>
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setPublishTime('now')}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${publishTime === 'now' ? 'border-ink bg-ink text-white' : 'border-line text-mute hover:border-ink hover:text-ink'}`}
                  >
                    Publicar agora
                  </button>
                  <button
                    onClick={() => setPublishTime('schedule')}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${publishTime === 'schedule' ? 'border-ink bg-ink text-white' : 'border-line text-mute hover:border-ink hover:text-ink'}`}
                  >
                    Agendar
                  </button>
                </div>
                {publishTime === 'schedule' && (
                  <div className="animate-fade-in-up">
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full max-w-xs p-3 rounded-lg border border-line bg-paper text-ink focus:outline-none focus:border-sage"
                    />
                    {!isScheduleValid() && scheduledDate && (
                      <p className="text-xs text-destructive mt-2">
                        A data deve ser pelo menos 5 minutos no futuro.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="max-w-2xl mx-auto space-y-8 pb-10">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-serif font-bold text-ink mb-2">Tudo pronto?</h2>
                <p className="text-mute">Revise como sua postagem vai aparecer no feed.</p>
              </div>
              <div className="pointer-events-none opacity-95">
                <PostagemCard post={previewPost} />
              </div>
              <div className="bg-wash border border-line rounded-xl p-5 font-mono text-sm space-y-3">
                <div className="flex justify-between">
                  <span className="text-mute">Espaço:</span>
                  <span className="text-ink font-medium">
                    {spaces.find((s) => s.id === espacoId)?.nome || '---'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mute">Visibilidade:</span>
                  <span className="text-ink font-medium">
                    {visibility === 'todos' ? 'Todos da Vila' : 'Membros Pro'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mute">Publicação:</span>
                  <span className="text-ink font-medium">
                    {publishTime === 'now'
                      ? 'Imediata'
                      : scheduledDate
                        ? format(new Date(scheduledDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : 'Data inválida'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-6 py-4 bg-wash/50">
          <Button
            variant="ghost"
            onClick={() => {
              if (isDraftValid) {
                toast('Rascunho salvo.', {
                  action: {
                    label: 'Ver rascunhos →',
                    onClick: () => navigate('/rascunhos'),
                  },
                })
              }
              closeComposer()
            }}
          >
            Cancelar
          </Button>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
            )}
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && (!title || !body)}
                className="bg-ink text-white hover:bg-ink/90"
              >
                Avançar
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={!isScheduleValid() || !espacoId}
                className="bg-warm text-white hover:bg-warm/90"
              >
                {publishTime === 'now' ? 'Publicar agora' : 'Agendar postagem'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
