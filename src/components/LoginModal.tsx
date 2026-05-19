import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export function LoginModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('fabiano@adapta.org')
  const [password, setPassword] = useState('Skip@Pass')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (open) {
      const isDemo = new URLSearchParams(window.location.search).get('demo') === 'true'
      if (isDemo) {
        setEmail('demo@vila.com')
        setPassword('Skip@Pass')
      }
    } else {
      if (new URLSearchParams(window.location.search).has('demo')) {
        const url = new URL(window.location.href)
        url.searchParams.delete('demo')
        window.history.replaceState({}, '', url)
      }
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const { error } = isLogin ? await signIn(email, password) : await signUp(email, password)
    setLoading(false)

    if (error) {
      toast({
        title: isLogin ? 'Erro ao entrar' : 'Erro ao cadastrar',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-8 bg-paper border-line">
        <DialogHeader className="mb-6">
          <DialogTitle className="font-serif text-2xl text-ink text-center">
            {isLogin ? 'Entrar na Vila' : 'Criar sua conta na Vila'}
          </DialogTitle>
          <DialogDescription className="text-center text-mute mt-2">
            {isLogin
              ? 'Use as credenciais abaixo para acessar a conta.'
              : 'Preencha os dados abaixo para se cadastrar.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">E-mail</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-wash border-line focus-visible:ring-warm h-12"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-wash border-line focus-visible:ring-warm h-12"
              required
            />
          </div>
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Confirmar Senha</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-wash border-line focus-visible:ring-warm h-12"
                required
              />
            </div>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-warm hover:bg-warm/90 text-white font-medium text-base rounded-lg mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLogin ? (
              'Entrar'
            ) : (
              'Cadastrar'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-mute hover:text-ink underline focus:outline-none"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já é usuário? Entre'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
