import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { getConviteByToken, aceitarConvite, getVilaInfo } from '@/services/api'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { Loader2, Mail, Shield, ArrowRight } from 'lucide-react'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [vila, setVila] = useState<any>(null)
  const [invite, setInvite] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      if (!token) return
      try {
        const [vilaData, inviteData] = await Promise.all([getVilaInfo(), getConviteByToken(token)])
        setVila(vilaData)
        setInvite(inviteData)
      } catch (err: any) {
        setError(err.status === 404 ? 'Convite não encontrado' : 'Erro ao carregar convite')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const isExpired = invite && invite.expira_em && new Date(invite.expira_em) < new Date()
  const isUsed = invite && invite.usado

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || isExpired || isUsed) return

    setAccepting(true)
    setFieldErrors({})
    try {
      const payload = user
        ? undefined
        : {
            name,
            password,
            ...(!invite.email && { email }),
          }
      const res = await aceitarConvite(token, payload)
      if (res.token && res.record) {
        pb.authStore.save(res.token, res.record)
      }
      toast.success('Convite aceito com sucesso! Bem-vindo(a).')
      navigate('/feed')
    } catch (err: any) {
      const errs = extractFieldErrors(err)
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs)
      } else {
        toast.error(err.message || 'Erro ao aceitar convite')
      }
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wash flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-mute" />
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-wash flex items-center justify-center p-4">
        <div className="bg-paper p-8 rounded-2xl shadow-subtle max-w-md w-full text-center border border-line">
          <h1 className="text-xl font-medium text-ink mb-2">Ops!</h1>
          <p className="text-mute mb-6">{error || 'Convite inválido.'}</p>
          <Button asChild className="w-full bg-warm text-white rounded-full">
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wash flex items-center justify-center p-4">
      <div className="bg-paper p-6 sm:p-8 rounded-2xl shadow-subtle max-w-md w-full border border-line">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sage/20 text-sage mb-4">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-ink mb-2">Você foi convidado(a)</h1>
          <p className="text-mute">
            Para participar de{' '}
            <span className="font-medium text-ink">{vila?.nome || 'nossa comunidade'}</span>
          </p>
        </div>

        {isUsed ? (
          <div className="text-center p-6 bg-wash rounded-xl border border-line">
            <p className="text-ink font-medium">Este convite já foi utilizado.</p>
            <Button asChild variant="outline" className="mt-4 w-full rounded-full">
              <Link to="/">Acessar a Comunidade</Link>
            </Button>
          </div>
        ) : isExpired ? (
          <div className="text-center p-6 bg-wash rounded-xl border border-line">
            <p className="text-ink font-medium">Este convite expirou.</p>
          </div>
        ) : (
          <form onSubmit={handleAccept} className="space-y-6">
            <div className="bg-wash/50 p-4 rounded-xl border border-line space-y-3">
              {invite.mensagem && (
                <div className="text-sm italic text-mute border-l-2 border-sage pl-3">
                  "{invite.mensagem}"
                </div>
              )}
              {invite.email ? (
                <div className="flex items-center gap-2 text-sm text-ink">
                  <span className="font-medium">Para:</span> {invite.email}
                </div>
              ) : (
                <div className="text-sm text-ink">
                  Link aberto &middot; qualquer pessoa pode aceitar usando seu próprio e-mail abaixo
                </div>
              )}
              {invite.role === 'pro' && (
                <div className="flex items-center gap-2 text-sm text-warm font-medium">
                  <Shield className="w-4 h-4" /> Acesso PRO incluído
                </div>
              )}
              {invite.expand?.target_espaco && (
                <div className="flex items-center gap-2 text-sm text-ink">
                  <span className="text-lg">{invite.expand.target_espaco.emoji}</span>
                  Acesso direto ao espaço{' '}
                  <span className="font-medium">{invite.expand.target_espaco.nome}</span>
                </div>
              )}
            </div>

            {user ? (
              <div className="p-4 bg-sage/10 rounded-xl border border-sage/20 text-center">
                <p className="text-sm text-ink mb-1">Você está logado como:</p>
                <p className="font-medium text-sage">
                  {user.name} ({user.email})
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {!invite.email && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Seu e-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="exemplo@email.com"
                      className="h-12 bg-wash"
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-red-500">{fieldErrors.email}</p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Seu nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Como quer ser chamado?"
                    className="h-12 bg-wash"
                  />
                  {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Crie uma senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="h-12 bg-wash"
                  />
                  {fieldErrors.password && (
                    <p className="text-xs text-red-500">{fieldErrors.password}</p>
                  )}
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={
                accepting || (!user && (!name || password.length < 6 || (!invite.email && !email)))
              }
              className="w-full h-12 rounded-full bg-warm hover:bg-warm/90 text-paper text-base"
            >
              {accepting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Aceitar Convite <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
