import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { X, Copy, Link as LinkIcon } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export function InviteModal({ open, onOpenChange }: any) {
  const { user } = useAuth()
  const [role, setRole] = useState('membro')
  const [generatedLink, setGeneratedLink] = useState('')

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setGeneratedLink('')
      setRole('membro')
    }
    onOpenChange(isOpen)
  }

  const handleGenerateLink = async () => {
    if (!user) return
    try {
      const token = Math.random().toString(36).substring(2, 15)
      const expira_em = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      await pb.collection('convites').create({
        role,
        token,
        expira_em,
        criado_por: user.id,
        usado: false,
      })
      const link = `${window.location.origin}/convite/${token}`
      setGeneratedLink(link)
      navigator.clipboard.writeText(link)
      toast.success('Link gerado e copiado!')
    } catch (err) {
      toast.error('Erro ao gerar link.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md p-6 bg-background shadow-subtle border-line rounded-xl gap-0"
        aria-describedby="invite-desc"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif font-bold text-ink">Convidar para a Vila</h2>
          <button onClick={() => handleOpenChange(false)}>
            <X className="w-5 h-5 text-mute hover:text-ink transition-colors" />
          </button>
        </div>
        <p id="invite-desc" className="sr-only">
          Gere um link único para convidar novos membros para a comunidade.
        </p>

        <div className="space-y-6">
          {!generatedLink && (
            <div>
              <label className="text-sm font-bold text-mute uppercase tracking-wider mb-3 block">
                Papel do membro
              </label>
              <div className="flex gap-4">
                <label
                  className="flex-1 flex items-center justify-center gap-2 cursor-pointer border border-line rounded-lg p-3 transition-colors data-[checked=true]:border-sage data-[checked=true]:bg-sage/5 hover:border-sage"
                  data-checked={role === 'membro'}
                >
                  <input
                    type="radio"
                    checked={role === 'membro'}
                    onChange={() => setRole('membro')}
                    className="hidden"
                  />
                  <span className="text-sm font-bold text-ink">Membro Comum</span>
                </label>
                <label
                  className="flex-1 flex items-center justify-center gap-2 cursor-pointer border border-line rounded-lg p-3 transition-colors data-[checked=true]:border-warm data-[checked=true]:bg-warm/5 hover:border-warm"
                  data-checked={role === 'pro'}
                >
                  <input
                    type="radio"
                    checked={role === 'pro'}
                    onChange={() => setRole('pro')}
                    className="hidden"
                  />
                  <span className="text-sm font-bold text-ink">Membro Pro</span>
                </label>
              </div>
            </div>
          )}

          <div className="animate-fade-in">
            {!generatedLink && (
              <p className="text-sm text-mute mb-4 leading-relaxed">
                Gere um link único para compartilhar no WhatsApp, Telegram ou onde quiser. O link
                expira em 7 dias e permite que a pessoa crie a própria conta.
              </p>
            )}

            {generatedLink ? (
              <div className="space-y-4 animate-fade-in-up">
                <div className="bg-sage/5 p-4 rounded-xl border border-sage/20">
                  <p className="text-sm text-ink font-medium mb-3">Link gerado com sucesso!</p>
                  <div className="flex items-center gap-2 bg-wash border border-line rounded-lg p-2">
                    <input
                      readOnly
                      value={generatedLink}
                      className="flex-1 bg-transparent text-sm font-mono text-ink px-2 focus:outline-none"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink)
                        toast.success('Link copiado!')
                      }}
                    >
                      <Copy className="w-4 h-4 text-ink" />
                    </Button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-full border-line text-ink"
                  onClick={() => setGeneratedLink('')}
                >
                  Gerar outro link
                </Button>
              </div>
            ) : (
              <Button
                className="w-full bg-ink text-paper hover:bg-ink/90 rounded-full h-11"
                onClick={handleGenerateLink}
              >
                <LinkIcon className="w-4 h-4 mr-2" /> Gerar Link Único
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
