import { useState, useEffect, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'
import { Link } from 'react-router-dom'
import { MembroAvatar } from '@/components/MembroAvatar'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'

export default function MembersPage() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<any[]>([])
  const [filter, setFilter] = useState<'Todos' | 'Admin' | 'Pro' | 'Membros'>('Todos')
  const [search, setSearch] = useState('')

  useEffect(() => {
    pb.collection('users').getFullList({ sort: '-created' }).then(setUsers).catch(console.error)
  }, [])

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === 'admin').length,
      pros: users.filter((u) => u.role === 'pro').length,
    }
  }, [users])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchesSearch =
      (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    if (!matchesSearch) return false

    if (filter === 'Todos') return true
    if (filter === 'Admin') return u.role === 'admin'
    if (filter === 'Pro') return u.role === 'pro'
    if (filter === 'Membros') return u.role === 'membro' || !u.role
    return true
  })

  return (
    <main className="pb-20 max-w-[1000px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="font-serif text-3xl font-bold text-ink">Membros</h1>
          <div className="flex gap-1 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sage" />
            <div className="w-1.5 h-1.5 rounded-full bg-sage/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-sage/30" />
          </div>
        </div>
        <p className="text-mute mb-4">Conheça quem faz parte desta comunidade.</p>

        <div className="flex items-center gap-4 text-sm font-mono text-mute bg-wash/50 p-3 rounded-lg border border-line/50 w-fit">
          <div>
            <span className="font-bold text-ink">{stats.total}</span> total
          </div>
          <div>•</div>
          <div>
            <span className="font-bold text-ink">{stats.admins}</span> admins
          </div>
          <div>•</div>
          <div>
            <span className="font-bold text-ink">{stats.pros}</span> pro
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center">
        <div className="flex flex-wrap gap-2">
          {['Todos', 'Admin', 'Pro', 'Membros'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f ? 'bg-ink text-white' : 'bg-wash text-mute hover:text-ink'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-paper border border-line rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-sage transition-colors placeholder:text-mute/60"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((user) => (
          <Link
            key={user.id}
            to={`/u/${user.id}`}
            className="bg-paper border border-line rounded-xl p-5 flex flex-col items-center text-center hover:border-sage/50 transition-colors shadow-subtle group relative"
          >
            {currentUser?.role === 'admin' && currentUser?.id !== user.id && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigate(`/admin/usuarios/${user.id}`)
                }}
                className="absolute top-3 right-3 p-2 rounded-full text-mute hover:text-sage hover:bg-wash transition-colors z-10"
                title="Gerenciar acesso"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <MembroAvatar
              name={user.name || 'User'}
              avatarUrl={user.avatar ? getPublicFileUrl(user, user.avatar) : undefined}
              role={user.role}
              className="w-16 h-16 mb-3 text-lg group-hover:scale-105 transition-transform"
            />
            <h3 className="font-semibold text-ink mb-1 group-hover:text-sage transition-colors line-clamp-1">
              {user.name || 'Membro Anônimo'}
            </h3>
            {user.role && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2 ${
                  user.role === 'admin'
                    ? 'bg-sage/10 text-sage'
                    : user.role === 'pro'
                      ? 'bg-warm/10 text-warm'
                      : 'bg-line/50 text-mute'
                }`}
              >
                {user.role === 'admin' ? '🛡️ Admin' : user.role === 'pro' ? '✨ Pro' : user.role}
              </span>
            )}
            <p className="text-xs text-mute mt-auto pt-2">
              Ativo há{' '}
              {formatDistanceToNow(new Date(user.updated || user.created), { locale: ptBR })}
            </p>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-mute border border-dashed border-line rounded-xl">
            Nenhum membro encontrado neste filtro.
          </div>
        )}
      </div>
    </main>
  )
}
