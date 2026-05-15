import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { X, Loader2, Users, Lock, Sparkles } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export function CreateEspacoModal({ open, onOpenChange, vilaId: initialVilaId, onSuccess }: any) {
  const { user } = useAuth()
  const [nome, setNome] = useState('')
  const [emoji, setEmoji] = useState('💬')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState('aberto')
  const [vilaId, setVilaId] = useState(initialVilaId || '')
  const [isFetchingVila, setIsFetchingVila] = useState(!initialVilaId)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!vilaId) {
      pb.collection('vilas')
        .getFullList({ sort: '-created', requestKey: null })
        .then((v) => {
          if (v.length > 0) setVilaId(v[0].id)
        })
        .catch((err) => console.error(err))
        .finally(() => setIsFetchingVila(false))
    }
  }, [vilaId])

  const slug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const handleSave = async () => {
    if (nome.length < 2) return toast.error('Nome muito curto.')
    setIsSaving(true)
    try {
      const existing = await pb
        .collection('espacos')
        .getFirstListItem(`slug="${slug}"`, { requestKey: null })
        .catch(() => null)

      if (existing) {
        setIsSaving(false)
        return toast.error('Já existe um espaço com esse nome/slug.')
      }

      await pb.collection('espacos').create(
        {
          nome,
          emoji,
          descricao,
          slug,
          vila_id: vilaId,
          tipo,
        },
        { requestKey: null },
      )

      toast.success('Espaço criado!')
      setNome('')
      setEmoji('💬')
      setDescricao('')
      setTipo('aberto')
      onSuccess?.()
      onOpenChange(false)
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao criar espaço.'
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-6 bg-background shadow-subtle border-line rounded-xl gap-0"
        aria-describedby="create-space-desc"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif font-bold text-ink">Novo espaço</h2>
          <button onClick={() => onOpenChange(false)}>
            <X className="w-5 h-5 text-mute hover:text-ink transition-colors" />
          </button>
        </div>
        <p id="create-space-desc" className="sr-only">
          Crie um novo espaço de discussão para a sua comunidade.
        </p>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-16 h-16 shrink-0 bg-wash rounded-xl flex items-center justify-center text-3xl border border-line">
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-full h-full bg-transparent text-center focus:outline-none"
                maxLength={2}
              />
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <label className="text-sm font-bold text-mute uppercase tracking-wider mb-1 block">
                Nome
              </label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Avisos Gerais"
                className="w-full border-b border-line pb-1 focus:outline-none focus:border-sage bg-transparent text-lg text-ink font-medium placeholder:text-mute/50"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-mute uppercase tracking-wider mb-2 block">
              Slug da URL
            </label>
            <div className="bg-wash border border-line rounded-lg px-3 py-2 text-sm text-mute font-mono flex items-center overflow-x-auto">
              <span>/e/</span>
              <span className="text-ink">{slug || 'nome-do-espaco'}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-mute uppercase tracking-wider mb-2 block">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={140}
              placeholder="Para que serve este espaço?"
              className="w-full border border-line rounded-lg p-3 focus:outline-none focus:border-sage bg-transparent text-sm resize-none h-24 placeholder:text-mute/50"
            />
            <div className="text-xs text-right text-mute mt-1 font-mono">
              {descricao.length}/140
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-bold text-mute uppercase tracking-wider mb-2 block">
              Acesso do espaço
            </label>
            <RadioGroup value={tipo} onValueChange={setTipo} className="gap-3">
              <label
                className={cn(
                  'flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors',
                  tipo === 'aberto' ? 'border-sage bg-sage/5' : 'border-line hover:bg-wash',
                )}
              >
                <RadioGroupItem value="aberto" className="mt-1" />
                <div>
                  <div className="flex items-center gap-2 font-semibold text-ink">
                    <Users className="w-4 h-4" /> Aberto
                  </div>
                  <div className="text-sm text-mute">Todos da Vila veem e escrevem.</div>
                </div>
              </label>
              <label
                className={cn(
                  'flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors',
                  tipo === 'restrito' ? 'border-sage bg-sage/5' : 'border-line hover:bg-wash',
                )}
              >
                <RadioGroupItem value="restrito" className="mt-1" />
                <div>
                  <div className="flex items-center gap-2 font-semibold text-ink">
                    <Lock className="w-4 h-4" /> Restrito
                  </div>
                  <div className="text-sm text-mute">
                    Só membros que você adicionar manualmente.
                  </div>
                </div>
              </label>
              {user?.role === 'admin' && (
                <label
                  className={cn(
                    'flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors',
                    tipo === 'pago' ? 'border-sage bg-sage/5' : 'border-line hover:bg-wash',
                  )}
                >
                  <RadioGroupItem value="pago" className="mt-1" />
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-ink">
                      <Sparkles className="w-4 h-4" /> Pro
                    </div>
                    <div className="text-sm text-mute">Só membros Pro veem. Conteúdo premium.</div>
                  </div>
                </label>
              )}
            </RadioGroup>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-ink text-white hover:bg-ink/90 rounded-full px-6"
            onClick={handleSave}
            disabled={nome.length < 2 || isFetchingVila || isSaving}
          >
            {isFetchingVila ? (
              'Carregando...'
            ) : isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Criando...
              </span>
            ) : (
              'Criar espaço'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
