import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Copy } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { MembroAvatar } from './MembroAvatar'
import { useAuth } from '@/hooks/use-auth'

function RestrictedManager({ space }: { space: any }) {
  const { user } = useAuth()
  const [members, setMembers] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [pendingInvite, setPendingInvite] = useState<{ email: string; token: string } | null>(null)

  const loadMembers = async () => {
    try {
      const m = await pb
        .collection('espaco_membros')
        .getFullList({ filter: `espaco="${space.id}"`, expand: 'user' })
      setMembers(m)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [space.id])

  useEffect(() => {
    if (q.length < 2) {
      setResults([])
      return
    }
    pb.collection('users')
      .getList(1, 5, { filter: `name ~ "${q}" || email ~ "${q}"` })
      .then((r) => setResults(r.items))
      .catch(console.error)
  }, [q])

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleInvite = async (email: string) => {
    try {
      const existing = await pb.collection('convites').getList(1, 1, {
        filter: `email="${email}" && target_espaco="${space.id}" && usado=false`,
      })
      if (existing.items.length > 0) {
        toast.error('Já existe um convite ativo pra esse email neste espaço.')
        return
      }

      const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
      const expira_em = new Date()
      expira_em.setDate(expira_em.getDate() + 7)

      await pb.collection('convites').create({
        email,
        role: 'membro',
        token,
        usado: false,
        expira_em: expira_em.toISOString(),
        criado_por: user?.id,
        target_espaco: space.id,
      })

      setPendingInvite({ email, token })
      setQ('')

      toast.success('Convite gerado!', {
        description: 'Copie o link gerado e envie para a pessoa.',
      })
    } catch (e: any) {
      toast.error('Erro ao enviar convite.')
    }
  }

  const add = async (u: any) => {
    try {
      await pb.collection('espaco_membros').create({ user: u.id, espaco: space.id })
      toast.success('Membro adicionado')
      loadMembers()
      setQ('')
    } catch (e: any) {
      toast.error(e.message || 'Erro ao adicionar')
    }
  }

  const remove = async (mId: string) => {
    try {
      await pb.collection('espaco_membros').delete(mId)
      toast.success('Membro removido')
      loadMembers()
    } catch (e) {
      toast.error('Erro ao remover')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q.length >= 2 && results.length === 0 && (
          <div className="mt-2 p-4 border border-line rounded-lg bg-paper text-center">
            {isValidEmail(q) ? (
              <Button
                onClick={() => handleInvite(q)}
                variant="outline"
                className="w-full border-sage text-sage hover:bg-sage hover:text-white"
              >
                Convidar {q} pra esse espaço
              </Button>
            ) : (
              <p className="text-sm text-mute">
                Nenhum membro encontrado. Digite um email pra convidar alguém de fora.
              </p>
            )}
          </div>
        )}
        {results.length > 0 && (
          <div className="mt-2 border border-line rounded-lg overflow-hidden bg-paper shadow-sm">
            {results.map((u) => {
              const isMember = members.some((m) => m.user === u.id)
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 border-b border-line last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <MembroAvatar
                      name={u.name}
                      avatarUrl={u.avatar ? pb.files.getURL(u, u.avatar) : undefined}
                      role={u.role}
                      className="w-8 h-8"
                    />
                    <span className="text-sm font-medium">{u.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={isMember ? 'ghost' : 'default'}
                    disabled={isMember}
                    onClick={() => add(u)}
                  >
                    {isMember ? 'Adicionado' : 'Adicionar'}
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {pendingInvite && (
          <div className="mt-4 p-4 bg-sage/5 border border-sage/30 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="font-mono text-xs uppercase text-sage font-bold">
                Convite pra {pendingInvite.email}
              </span>
              <button
                onClick={() => setPendingInvite(null)}
                className="text-xs font-medium text-mute hover:text-ink transition-colors"
              >
                Fechar
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/convite/${pendingInvite.token}`}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="font-mono text-sm bg-background border-sage/20 focus-visible:ring-sage/50"
              />
              <Button
                size="icon"
                variant="outline"
                className="shrink-0 border-sage text-sage hover:bg-sage hover:text-white transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/convite/${pendingInvite.token}`,
                  )
                  toast.success('Link copiado!')
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-mute">
              Manda esse link no WhatsApp ou email. Quando a pessoa aceitar, entra direto no espaço.
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-mute mb-3">
          Membros atuais
        </h3>
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-wash border border-transparent hover:border-line transition-colors"
            >
              <div className="flex items-center gap-3">
                <MembroAvatar
                  name={m.expand?.user?.name}
                  avatarUrl={
                    m.expand?.user?.avatar
                      ? pb.files.getURL(m.expand.user, m.expand.user.avatar)
                      : undefined
                  }
                  role={m.expand?.user?.role}
                  className="w-8 h-8"
                />
                <span className="text-sm font-medium">{m.expand?.user?.name}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => remove(m.id)}
              >
                Remover
              </Button>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-mute text-center py-4">Nenhum membro adicionado.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function ManageSpaceModal({ space, open, onOpenChange }: any) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!open) setShowDeleteConfirm(false)
  }, [open])

  if (!space) return null

  const handleDelete = async () => {
    try {
      await pb.collection('espacos').delete(space.id)
      toast.success('Espaço excluído com sucesso.')
      onOpenChange(false)
      navigate('/feed')
    } catch (e) {
      toast.error('Erro ao excluir espaço.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-background shadow-subtle border-line rounded-xl gap-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif font-bold text-ink">Gerenciar espaço</h2>
          <button onClick={() => onOpenChange(false)}>
            <X className="w-5 h-5 text-mute hover:text-ink transition-colors" />
          </button>
        </div>

        {(!space.tipo || space.tipo === 'aberto') && (
          <p className="text-mute text-center py-8">
            Espaço aberto — todos os membros da Vila têm acesso automático.
          </p>
        )}

        {space.tipo === 'pago' && (
          <p className="text-mute text-center py-8">
            Espaço Pro — membros com plano Pro têm acesso automático.
          </p>
        )}

        {space.tipo === 'restrito' && <RestrictedManager space={space} />}

        {user?.role === 'admin' && (
          <div className="mt-8 pt-6 border-t border-red-100 dark:border-red-900/30">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-500 mb-3">
              Zona de Perigo
            </h3>

            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:hover:bg-red-900/20"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Excluir este espaço
              </Button>
            ) : (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg animate-fade-in-up">
                <p className="text-sm text-red-800 dark:text-red-400 mb-4">
                  Tem certeza que quer excluir <strong>{space.nome}</strong>? Todas as postagens e
                  comentários deste espaço serão apagados permanentemente. Essa ação não pode ser
                  desfeita.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 bg-white hover:bg-white/80 dark:bg-black"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                    onClick={handleDelete}
                  >
                    Sim, Excluir
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
