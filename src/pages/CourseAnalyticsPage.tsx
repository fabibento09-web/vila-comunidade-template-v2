import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Users, CheckCircle, Clock, Activity } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getCursoBySlug, getAulasByCurso, getCourseAnalytics } from '@/services/courses'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'
import { format, differenceInDays, parseISO, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'

const completionConfig = { completion: { label: 'Conclusão', color: 'hsl(var(--primary))' } }
const timelineConfig = { inscritos: { label: 'Inscritos', color: 'hsl(var(--primary))' } }

export default function CourseAnalyticsPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [curso, setCurso] = useState<any>(null)
  const [aulas, setAulas] = useState<any[]>([])
  const [progressos, setProgressos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/cursos')
      return
    }
    load()
  }, [slug, user])

  const load = async () => {
    try {
      const c = await getCursoBySlug(slug as string)
      setCurso(c)
      const a = await getAulasByCurso(c.id)
      setAulas(a)
      const p = await getCourseAnalytics(c.id)
      setProgressos(p)
    } catch (e) {
      navigate('/cursos')
    } finally {
      setLoading(false)
    }
  }

  const { kpis, heatmapData, timelineData, students } = useMemo(() => {
    if (!curso || !aulas.length)
      return { kpis: null, heatmapData: [], timelineData: [], students: [] }

    const userMap = new Map<string, any>()

    progressos.forEach((p) => {
      if (!p.expand?.user || !p.expand?.aula) return
      const uId = p.user
      if (!userMap.has(uId)) {
        userMap.set(uId, { user: p.expand.user, records: [] })
      }
      userMap.get(uId).records.push(p)
    })

    const totalAulas = aulas.length
    let totalCompleted = 0
    let totalInactive = 0
    let sumProgress = 0

    const studentsList: any[] = []
    const weekMap = new Map<string, number>()

    for (const [uId, data] of userMap.entries()) {
      const completedCount = data.records.filter((r: any) => r.completou).length
      const progressPercent = Math.round((completedCount / totalAulas) * 100)

      const dates = data.records.map((r: any) => parseISO(r.updated))
      const createdDates = data.records.map((r: any) => parseISO(r.created))

      const lastActivity = new Date(Math.max(...dates.map((d: Date) => d.getTime())))
      const enrollmentDate = new Date(Math.min(...createdDates.map((d: Date) => d.getTime())))

      const isCompleted = completedCount === totalAulas
      const isInactive = !isCompleted && differenceInDays(new Date(), lastActivity) > 7

      if (isCompleted) totalCompleted++
      if (isInactive) totalInactive++
      sumProgress += progressPercent

      let status: 'Concluído' | 'Parou' | 'Em andamento' = 'Em andamento'
      if (isCompleted) status = 'Concluído'
      else if (isInactive) status = 'Parou'

      studentsList.push({
        id: uId,
        user: data.user,
        progressPercent,
        lastActivity,
        enrollmentDate,
        status,
      })

      const weekStart = startOfWeek(enrollmentDate)
      const weekKey = format(weekStart, 'yyyy-MM-dd')
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1)
    }

    const totalSubscribers = userMap.size
    const avgProgress = totalSubscribers > 0 ? Math.round(sumProgress / totalSubscribers) : 0

    const heatmapData = aulas.map((a, i) => {
      const completedThis = progressos.filter((p) => p.aula === a.id && p.completou).length
      const percent =
        totalSubscribers > 0 ? Math.round((completedThis / totalSubscribers) * 100) : 0
      return { name: `Aula ${i + 1}`, title: a.titulo, completion: percent, count: completedThis }
    })

    const timelineData = Array.from(weekMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => ({
        label: format(parseISO(t.date), 'dd/MMM', { locale: ptBR }),
        inscritos: t.count,
      }))

    studentsList.sort((a, b) => b.progressPercent - a.progressPercent)

    return {
      kpis: {
        inscritos: totalSubscribers,
        concluidos: totalCompleted,
        avgProgress: avgProgress,
        inativos: totalInactive,
      },
      heatmapData,
      timelineData,
      students: studentsList,
    }
  }, [curso, aulas, progressos])

  if (loading || !curso) return null

  return (
    <main className="flex-1 p-6 md:p-8 max-w-[1280px] mx-auto w-full flex flex-col gap-10 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-6 gap-4">
        <div>
          <Link
            to={`/cursos/${curso.slug}/editar`}
            className="text-sm font-medium text-mute hover:text-ink flex items-center gap-2 mb-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar para edição
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink">Analytics</h1>
          <p className="text-mute mt-2">
            {curso.titulo} • {aulas.length} aulas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-paper border border-line rounded-2xl p-6 shadow-subtle flex flex-col">
          <div className="flex items-center gap-3 text-mute mb-4">
            <Users className="w-5 h-5 text-sage" />
            <span className="text-sm font-bold uppercase tracking-wider">Inscritos</span>
          </div>
          <span className="text-4xl font-serif font-bold text-ink">{kpis?.inscritos || 0}</span>
        </div>
        <div className="bg-paper border border-line rounded-2xl p-6 shadow-subtle flex flex-col">
          <div className="flex items-center gap-3 text-mute mb-4">
            <CheckCircle className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold uppercase tracking-wider">Concluíram</span>
          </div>
          <span className="text-4xl font-serif font-bold text-ink">{kpis?.concluidos || 0}</span>
        </div>
        <div className="bg-paper border border-line rounded-2xl p-6 shadow-subtle flex flex-col">
          <div className="flex items-center gap-3 text-mute mb-4">
            <Activity className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-bold uppercase tracking-wider">% Médio</span>
          </div>
          <span className="text-4xl font-serif font-bold text-ink">{kpis?.avgProgress || 0}%</span>
        </div>
        <div className="bg-paper border border-line rounded-2xl p-6 shadow-subtle flex flex-col">
          <div className="flex items-center gap-3 text-mute mb-4">
            <Clock className="w-5 h-5 text-red-400" />
            <span className="text-sm font-bold uppercase tracking-wider">Pararam</span>
          </div>
          <span className="text-4xl font-serif font-bold text-ink">{kpis?.inativos || 0}</span>
          <span className="text-xs text-mute mt-2">Inativos há +7 dias</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-paper border border-line rounded-2xl p-6 shadow-subtle">
          <h2 className="text-lg font-bold text-ink mb-6">Taxa de Conclusão por Aula</h2>
          {heatmapData && heatmapData.length > 0 ? (
            <div className="h-[300px]">
              <ChartContainer config={completionConfig} className="w-full h-full">
                <BarChart data={heatmapData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--line))" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--mute))', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--mute))', fontSize: 12 }}
                    unit="%"
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-ink text-white text-xs p-2 rounded-lg shadow-lg">
                          <p className="font-bold mb-1">{d.title}</p>
                          <p>
                            {d.completion}% ({d.count} alunos)
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="completion"
                    fill="var(--color-completion)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-mute text-sm border border-dashed border-line rounded-xl">
              Sem dados suficientes
            </div>
          )}
        </div>

        <div className="bg-paper border border-line rounded-2xl p-6 shadow-subtle">
          <h2 className="text-lg font-bold text-ink mb-6">Crescimento de Inscritos</h2>
          {timelineData && timelineData.length > 0 ? (
            <div className="h-[300px]">
              <ChartContainer config={timelineConfig} className="w-full h-full">
                <LineChart
                  data={timelineData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--line))" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--mute))', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--mute))', fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="inscritos"
                    stroke="var(--color-inscritos)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: 'var(--color-inscritos)' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-mute text-sm border border-dashed border-line rounded-xl">
              Sem dados suficientes
            </div>
          )}
        </div>
      </div>

      <div className="bg-paper border border-line rounded-2xl shadow-subtle overflow-hidden">
        <div className="p-6 border-b border-line">
          <h2 className="text-lg font-bold text-ink">Lista de Alunos</h2>
        </div>

        {students && students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-wash/50 text-xs uppercase tracking-wider text-mute border-b border-line">
                  <th className="px-6 py-4 font-bold">Aluno</th>
                  <th className="px-6 py-4 font-bold">Inscrição</th>
                  <th className="px-6 py-4 font-bold">Progresso</th>
                  <th className="px-6 py-4 font-bold">Última Atividade</th>
                  <th className="px-6 py-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/50">
                {students.map((s: any) => (
                  <tr key={s.id} className="hover:bg-wash/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 border border-line shadow-sm">
                          <AvatarImage src={getPublicFileUrl(s.user, s.user.avatar)} />
                          <AvatarFallback className="bg-wash text-ink text-xs font-bold">
                            {s.user.name?.[0] || s.user.email?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-ink">
                            {s.user.name || 'Sem nome'}
                          </span>
                          <span className="text-xs text-mute">{s.user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-mute">
                      {format(s.enrollmentDate, 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Progress
                          value={s.progressPercent}
                          className="w-24 h-2 bg-wash [&>div]:bg-sage"
                        />
                        <span className="text-xs font-bold text-ink min-w-[2.5rem]">
                          {s.progressPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-mute">
                      {differenceInDays(new Date(), s.lastActivity) === 0
                        ? 'Hoje'
                        : `Há ${differenceInDays(new Date(), s.lastActivity)} dias`}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border
                        ${s.status === 'Concluído' ? 'bg-sage/10 text-sage border-sage/20' : ''}
                        ${s.status === 'Em andamento' ? 'bg-orange-50 text-orange-600 border-orange-200' : ''}
                        ${s.status === 'Parou' ? 'bg-wash text-mute border-line' : ''}
                      `}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-mute text-sm">Nenhum aluno ainda.</div>
        )}
      </div>
    </main>
  )
}
