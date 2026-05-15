import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { ShieldCheck, Sparkles } from 'lucide-react'

interface MembroAvatarProps {
  name: string
  avatarUrl?: string
  role?: string
  className?: string
}

const COLORS = [
  'bg-sage text-white',
  'bg-warm text-white',
  'bg-ink text-white',
  'bg-mute text-white',
]

export function MembroAvatar({ name, avatarUrl, role, className }: MembroAvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : '?'
  const colorIndex = name ? name.charCodeAt(0) % COLORS.length : 0

  return (
    <div className={cn('relative inline-block rounded-full', className)}>
      <Avatar className="w-full h-full border border-line shadow-subtle">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover" />}
        <AvatarFallback className={cn('font-mono text-xs', !avatarUrl && COLORS[colorIndex])}>
          {initials}
        </AvatarFallback>
      </Avatar>
      {role === 'admin' && (
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-line">
          <ShieldCheck className="w-3.5 h-3.5 text-sage fill-sage/20" />
        </div>
      )}
      {role === 'pro' && (
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-line">
          <Sparkles className="w-3.5 h-3.5 text-warm fill-warm/20" />
        </div>
      )}
    </div>
  )
}
