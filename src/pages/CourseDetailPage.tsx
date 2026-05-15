import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  getCursoBySlug,
  getModulosByCurso,
  getAulasByCurso,
  getProgressoCurso,
} from '@/services/courses'
import { useAuth } from '@/hooks/use-auth'
import { ChevronLeft, PlayCircle, CheckCircle2, Lock, Clock, BookOpen, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MembroAvatar } from '@/components/MembroAvatar'
import pb from '@/lib/pocketbase/client'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

export default function CourseDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [curso, setCurso] = useState<any>(null)
  const [modulos, setModulos] = useState<any[]>([])
  const [aulas, setAulas] = useState<any[]>([])
  const [progresso, setProgresso] = useState<any[]>([])
  const [cursoMembro, setCursoMembro] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    loadData()
  }, [slug, user])

  const loadData = async () => {
    try {
      const c = await getCursoBySlug(slug as string)
      setCurso(c)

      const [m, a] = await Promise.all([getModulosByCurso(c.id), getAulasByCurso(c.id)])

      setModulos(m)
      setAulas(a)

      if (user) {
        const p = await getProgressoCurso(user.id, c.id)
        setProgresso(p)
        try {
          const grants = await pb
            .collection('curso_membros')
            .getFullList({ filter: `user="${user.id}" && curso="${c.id}"` })
          setCursoMembro(grants[0] || null)
        } catch {
          /* intentionally ignored */
        }
      }
    } catch (err) {
      console.error(err)
      navigate('/cursos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-sage border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!curso) return null

  const isLocked = (() => {
    if (user?.role === 'admin') return false
    if (cursoMembro) return cursoMembro.bloqueado
    if (curso.tipo === 'free') return false
    if (curso.tipo === 'pro' && user?.role === 'pro') return false
    return true
  })()
  const totalMinutos = aulas.reduce((acc, aula) => acc + (aula.duracao_min || 0), 0)
  const totalAulas = aulas.length
  const completedCount = progresso.length
  const progressPercent = totalAulas > 0 ? Math.round((completedCount / totalAulas) * 100) : 0

  const primeiraAulaIncompleta =
    aulas.find((a) => !progresso.some((p) => p.aula === a.id)) || aulas[0]
  const ctaLink = primeiraAulaIncompleta
    ? `/cursos/${curso.slug}/aula/${primeiraAulaIncompleta.slug}`
    : '#'

  const badgeColors = {
    pro: 'bg-warm text-white',
    pago: 'bg-ink text-white',
    free: 'bg-sage text-white',
  }

  return (
    <main className="flex-1 pb-20 p-6 md:p-8 max-w-5xl mx-auto w-full animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/cursos"
          className="inline-flex items-center gap-2 text-sm font-medium text-mute hover:text-ink transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para todos os cursos
        </Link>
        {user?.role === 'admin' && (
          <Link to={`/cursos/${curso.slug}/editar`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="w-4 h-4" />
              Editar curso
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="mb-6 flex gap-2">
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full',
                badgeColors[curso.tipo as keyof typeof badgeColors] || 'bg-ink text-white',
              )}
            >
              {curso.tipo === 'free' ? 'Gratuito' : curso.tipo === 'pago' ? 'Pago' : 'Pro'}
            </span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink leading-tight mb-4">
            {curso.titulo}
          </h1>
          <p className="text-xl text-mute italic mb-8 leading-relaxed">{curso.tagline}</p>

          {curso.expand?.autor && (
            <div className="flex items-center gap-3 mb-10 pb-10 border-b border-line">
              <MembroAvatar
                name={curso.expand.autor.name}
                avatarUrl={
                  curso.expand.autor.avatar
                    ? getPublicFileUrl(curso.expand.autor, curso.expand.autor.avatar)
                    : undefined
                }
                className="w-12 h-12"
              />
              <div>
                <p className="text-sm font-medium text-ink">{curso.expand.autor.name}</p>
                <p className="text-xs text-mute font-mono uppercase tracking-wider mt-0.5">
                  Instrutor
                </p>
              </div>
            </div>
          )}

          {curso.descricao && (
            <div className="mb-12">
              <MarkdownRenderer content={curso.descricao} />
            </div>
          )}

          <h2 className="font-serif text-2xl font-bold text-ink mb-6">Conteúdo do Curso</h2>

          <div className="flex flex-col gap-6">
            {modulos.map((modulo, i) => {
              const modAulas = aulas.filter((a) => a.modulo === modulo.id)
              if (modAulas.length === 0) return null

              return (
                <div
                  key={modulo.id}
                  className="bg-paper rounded-2xl border border-line overflow-hidden shadow-subtle"
                >
                  <div className="bg-wash px-5 py-4 border-b border-line flex items-center justify-between">
                    <h3 className="font-medium text-ink flex items-center gap-2">
                      <span className="text-sage text-sm font-mono tracking-widest uppercase opacity-70">
                        Mod {i + 1}
                      </span>
                      {modulo.titulo}
                    </h3>
                    <span className="text-xs text-mute font-mono">{modAulas.length} aulas</span>
                  </div>
                  <div className="flex flex-col divide-y divide-line/50">
                    {modAulas.map((aula, j) => {
                      const completed = progresso.some((p) => p.aula === aula.id)
                      return (
                        <div
                          key={aula.id}
                          className={cn(
                            'px-5 py-4 flex items-center justify-between group',
                            completed ? 'bg-sage/5' : 'hover:bg-wash/50 transition-colors',
                          )}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {completed ? (
                              <CheckCircle2 className="w-5 h-5 text-sage shrink-0" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-line flex items-center justify-center shrink-0">
                                <PlayCircle className="w-3 h-3 text-mute/50 ml-0.5" />
                              </div>
                            )}
                            <div className="flex flex-col truncate">
                              <span
                                className={cn(
                                  'text-sm font-medium truncate',
                                  completed
                                    ? 'text-sage'
                                    : 'text-ink group-hover:text-sage transition-colors',
                                )}
                              >
                                {j + 1}. {aula.titulo}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-mute font-mono tabular-nums shrink-0 ml-4">
                            {aula.duracao_min} min
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div className="sticky top-24 bg-paper border border-line rounded-2xl overflow-hidden shadow-subtle flex flex-col">
            {curso.cover ? (
              <div className="aspect-video bg-wash relative">
                <img
                  src={getPublicFileUrl(curso, curso.cover)}
                  alt={curso.titulo}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-noise flex items-center justify-center bg-gradient-to-br from-sage/20 to-warm/20">
                <PlayCircle className="w-12 h-12 text-white/80" />
              </div>
            )}

            <div className="p-6">
              <div className="flex items-center gap-4 text-mute text-sm font-medium mb-6 justify-center">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {totalMinutos} min
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> {totalAulas} aulas
                </div>
              </div>

              {!isLocked && user && progressPercent > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-mono mb-2 text-ink">
                    <span>Progresso</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              )}

              {isLocked ? (
                <div className="bg-warm/10 text-warm rounded-xl p-4 flex flex-col items-center text-center">
                  <Lock className="w-6 h-6 mb-2" />
                  <p className="text-sm font-medium mb-1">Exclusivo Pro</p>
                  <p className="text-xs opacity-80 mb-4">
                    Faça upgrade para acessar este conteúdo.
                  </p>
                  <Button
                    disabled
                    variant="outline"
                    className="w-full bg-white border-warm/20 text-warm font-bold hover:bg-white"
                  >
                    Conteúdo Bloqueado
                  </Button>
                </div>
              ) : (
                <Link to={ctaLink} className="block w-full">
                  <Button className="w-full h-12 bg-ink hover:bg-ink/90 text-white font-medium rounded-xl text-base">
                    {progressPercent === 0
                      ? 'Começar curso'
                      : progressPercent === 100
                        ? 'Rever curso'
                        : 'Continuar de onde parou'}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
