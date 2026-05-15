import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function EventsPage() {
  return (
    <main className="flex-1 pb-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-sage/10 rounded-2xl flex items-center justify-center mb-6">
        <Calendar className="w-8 h-8 text-sage" />
      </div>

      <div className="flex gap-1 mb-6">
        <div className="w-1.5 h-1.5 rounded-full bg-sage" />
        <div className="w-1.5 h-1.5 rounded-full bg-sage/60" />
        <div className="w-1.5 h-1.5 rounded-full bg-sage/30" />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-warm mb-3 block">
        Em breve
      </span>
      <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink mb-4 max-w-lg">
        Encontros ao vivo
      </h1>
      <p className="text-lg text-mute mb-8 max-w-md leading-relaxed">
        Agende mentorias, lives e encontros comunitários nativamente, com lembretes automáticos e
        integração com calendário.
      </p>

      <Button
        onClick={() => toast.success('Você será avisado quando a funcionalidade estiver pronta!')}
        className="bg-ink hover:bg-ink/90 text-white rounded-full px-8 h-12 text-base font-medium"
      >
        Avisar quando estiver pronto
      </Button>
    </main>
  )
}
