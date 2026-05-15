import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { ChevronLeft, ShieldCheck, Settings, Hash, BookOpen } from 'lucide-react'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'
import { MembroAvatar } from '@/components/MembroAvatar'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function UserAccessPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const [targetUser, setTargetUser] = useState<any>(null)
  const [espacos, setEspacos] = useState<any[]>([])
  const [cursos, setCursos] = useState<any[]>([])
  const [espacoMembros, setEspacoMembros] = useState<any[]>([])
  const [cursoMembros, setCursoMembros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/membros')
      return
    }
    if (!id) return
    loadData()
  }, [id, currentUser])

  const loadData = async () => {
    try {
      const userRecord = await pb.collection('users').getOne(id as string)
      setTargetUser(userRecord)

      const [e, c, em, cm] = await Promise.all([
        pb.collection('espacos').getFullList({ sort: 'nome' }),
        pb.collection('cursos').getFullList({ sort: 'titulo' }),
        pb.collection('espaco_membros').getFullList({ filter: `user="${id}"` }),
        pb.collection('curso_membros').getFullList({ filter: `user="${id}"` }),
      ])

      setEspacos(e)
      setCursos(c)
      setEspacoMembros(em)
      setCursoMembros(cm)
    } catch (err) {
      console.error(err)
      toast.error('Usuário não encontrado')
      navigate('/membros')
    } finally {
      setLoading(false)
    }
  }

  const updateRole = async (newRole: string) => {
    try {
      await pb.collection('users').update(id as string, { role: newRole })
      setTargetUser({ ...targetUser, role: newRole })
      toast.success('Role atualizada com sucesso')
    } catch (err: any) {
      console.error(err, err.response?.data)
      toast.error('Erro ao atualizar role')
    }
  }

  const toggleEspaco = async (espacoId: string, desiredAccess: boolean, defaultAccess: boolean) => {
    try {
      let existingRecord = null
      try {
        existingRecord = await pb
          .collection('espaco_membros')
          .getFirstListItem(`user="${id}" && espaco="${espacoId}"`)
      } catch (e) {
        // Not found, ignore
      }

      if (desiredAccess === defaultAccess) {
        if (existingRecord) {
          await pb.collection('espaco_membros').delete(existingRecord.id)
          setEspacoMembros((prev) => prev.filter((em) => em.id !== existingRecord?.id))
        }
      } else {
        if (existingRecord) {
          const updated = await pb.collection('espaco_membros').update(existingRecord.id, {
            bloqueado: !desiredAccess,
          })
          setEspacoMembros((prev) =>
            prev.map((em) => (em.id === existingRecord?.id ? updated : em)),
          )
        } else {
          const created = await pb.collection('espaco_membros').create({
            user: id,
            espaco: espacoId,
            bloqueado: !desiredAccess,
          })
          setEspacoMembros((prev) => [...prev, created])
        }
      }
      toast.success(desiredAccess ? 'Acesso liberado' : 'Acesso bloqueado')
    } catch (err: any) {
      console.error('toggleEspaco error', {
        userId: id,
        espacoId,
        desiredAccess,
        defaultAccess,
        status: err?.status,
        body: err?.response,
        data: err?.response?.data,
        message: err?.message,
      })
      toast.error(err?.response?.message || err?.message || 'Erro ao atualizar acesso')
    }
  }

  const toggleCurso = async (cursoId: string, desiredAccess: boolean, defaultAccess: boolean) => {
    try {
      let existingRecord = null
      try {
        existingRecord = await pb
          .collection('curso_membros')
          .getFirstListItem(`user="${id}" && curso="${cursoId}"`)
      } catch (e) {
        // Not found, ignore
      }

      if (desiredAccess === defaultAccess) {
        if (existingRecord) {
          await pb.collection('curso_membros').delete(existingRecord.id)
          setCursoMembros((prev) => prev.filter((cm) => cm.id !== existingRecord?.id))
        }
      } else {
        if (existingRecord) {
          const updated = await pb.collection('curso_membros').update(existingRecord.id, {
            bloqueado: !desiredAccess,
          })
          setCursoMembros((prev) => prev.map((cm) => (cm.id === existingRecord?.id ? updated : cm)))
        } else {
          const created = await pb.collection('curso_membros').create({
            user: id,
            curso: cursoId,
            bloqueado: !desiredAccess,
          })
          setCursoMembros((prev) => [...prev, created])
        }
      }
      toast.success(desiredAccess ? 'Acesso liberado' : 'Acesso bloqueado')
    } catch (err: any) {
      console.error('toggleCurso error', {
        userId: id,
        cursoId,
        desiredAccess,
        defaultAccess,
        status: err?.status,
        body: err?.response,
        data: err?.response?.data,
        message: err?.message,
      })
      toast.error(err?.response?.message || err?.message || 'Erro ao atualizar acesso')
    }
  }

  if (loading || !targetUser) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-sage border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <main className="flex-1 pb-20 p-6 md:p-8 max-w-4xl mx-auto w-full animate-fade-in-up">
      <div className="mb-8">
        <Link
          to="/membros"
          className="inline-flex items-center gap-2 text-sm font-medium text-mute hover:text-ink transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar pra membros
        </Link>
        <h1 className="font-serif text-3xl font-bold text-ink flex items-center gap-3">
          <Settings className="w-7 h-7 text-sage" />
          Gerenciar acesso
        </h1>
      </div>

      <div className="bg-paper border border-line rounded-2xl p-6 mb-8 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <MembroAvatar
            name={targetUser.name || 'User'}
            avatarUrl={
              targetUser.avatar ? getPublicFileUrl(targetUser, targetUser.avatar) : undefined
            }
            className="w-16 h-16 text-lg"
          />
          <div>
            <h2 className="font-bold text-xl text-ink">{targetUser.name || 'Usuário Sem Nome'}</h2>
            <p className="text-mute text-sm">{targetUser.email}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-mute uppercase tracking-wider font-mono">
            Role
          </label>
          <div className="relative">
            <select
              value={targetUser.role || 'membro'}
              onChange={(e) => updateRole(e.target.value)}
              className="appearance-none bg-wash border border-line rounded-xl pl-4 pr-10 py-2.5 font-medium text-ink focus:outline-none focus:ring-2 focus:ring-sage"
            >
              <option value="admin">Administrador</option>
              <option value="pro">Membro Pro</option>
              <option value="membro">Membro Base</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-mute">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Espaços Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-5 h-5 text-mute" />
            <h3 className="font-serif text-xl font-bold text-ink">Espaços</h3>
          </div>
          <div className="bg-paper border border-line rounded-2xl overflow-hidden divide-y divide-line/50">
            {espacos.map((espaco) => {
              const isAberto = espaco.tipo === 'aberto' || !espaco.tipo
              const isPro = espaco.tipo === 'pago'

              const defaultAccess =
                targetUser.role === 'admin' || isAberto || (isPro && targetUser.role === 'pro')

              const existingRecord = espacoMembros.find((em) => em.espaco === espaco.id)
              const hasOverride = !!existingRecord
              const currentAccess = hasOverride ? !existingRecord.bloqueado : defaultAccess

              return (
                <div
                  key={espaco.id}
                  className="p-4 flex items-center justify-between hover:bg-wash/50 transition-colors"
                >
                  <div className="flex flex-col pr-4">
                    <span className="font-medium text-ink">
                      {espaco.emoji} {espaco.nome}
                    </span>
                    <span className="text-xs text-mute mt-1">
                      {isAberto
                        ? 'Aberto — todos têm acesso'
                        : defaultAccess && !hasOverride
                          ? `Acesso por role (${espaco.tipo})`
                          : `Restrito — requer convite/grant (${espaco.tipo})`}
                      {hasOverride && (
                        <span className="ml-2 text-warm font-medium uppercase tracking-widest text-[10px]">
                          • override
                        </span>
                      )}
                    </span>
                  </div>
                  <Switch
                    checked={currentAccess}
                    onCheckedChange={(c) => toggleEspaco(espaco.id, c, defaultAccess)}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Cursos Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-mute" />
            <h3 className="font-serif text-xl font-bold text-ink">Cursos</h3>
          </div>
          <div className="bg-paper border border-line rounded-2xl overflow-hidden divide-y divide-line/50">
            {cursos.map((curso) => {
              const isFree = curso.tipo === 'free'
              const isPro = curso.tipo === 'pro'

              const defaultAccess =
                targetUser.role === 'admin' || isFree || (isPro && targetUser.role === 'pro')

              const existingRecord = cursoMembros.find((cm) => cm.curso === curso.id)
              const hasOverride = !!existingRecord
              const currentAccess = hasOverride ? !existingRecord.bloqueado : defaultAccess

              return (
                <div
                  key={curso.id}
                  className="p-4 flex items-center justify-between hover:bg-wash/50 transition-colors"
                >
                  <div className="flex flex-col pr-4">
                    <span className="font-medium text-ink leading-tight line-clamp-1">
                      {curso.titulo}
                    </span>
                    <span className="text-xs text-mute mt-1">
                      {isFree
                        ? 'Gratuito — todos têm acesso'
                        : defaultAccess && !hasOverride
                          ? `Acesso por role (${curso.tipo})`
                          : `Premium — requer grant (${curso.tipo})`}
                      {hasOverride && (
                        <span className="ml-2 text-warm font-medium uppercase tracking-widest text-[10px]">
                          • override
                        </span>
                      )}
                    </span>
                  </div>
                  <Switch
                    checked={currentAccess}
                    onCheckedChange={(c) => toggleCurso(curso.id, c, defaultAccess)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
