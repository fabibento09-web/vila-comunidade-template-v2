import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { openLoginModal } from '@/lib/utils'
import { ArrowRight, BookOpen, Heart, MessageCircle } from 'lucide-react'

import imgHeroTL from '@/assets/p1-cafe-conversa-9b1a3.png'
import imgHeroTR from '@/assets/p4-2pessoas-coworking-ff38b.png'
import imgHeroBL from '@/assets/p3-leitura-varanda-f74c5.png'
import imgHeroBR from '@/assets/p5-flatlay-mesa-fe6ef.png'

export default function Index() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/feed" replace />

  return (
    <div className="min-h-screen bg-background selection:bg-warm/20">
      <main>
        <section className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center overflow-hidden pt-32 pb-20">
          {/* Background Mesh */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,hsl(var(--sage)/0.55)_0%,transparent_70%)] blur-3xl mix-blend-multiply animate-blob-1" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,hsl(var(--warm)/0.40)_0%,transparent_70%)] blur-3xl mix-blend-multiply animate-blob-2" />
            <div className="absolute top-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,hsl(15_60%_60%/0.35)_0%,transparent_70%)] blur-3xl mix-blend-multiply animate-blob-3" />
          </div>

          {/* Polaroid Cards (hidden on mobile) */}
          <div className="hidden md:block absolute top-8 lg:top-12 left-4 lg:left-16 xl:left-32 z-10 animate-fade-in-up [animation-delay:300ms]">
            <div className="animate-float-1">
              <figure className="p-3 bg-white pb-10 shadow-[0_8px_30px_hsla(var(--sage)/0.25)] transition-transform duration-500 ease-out -rotate-[7deg] hover:-rotate-[2deg]">
                <div className="w-36 lg:w-48 aspect-[4/5] bg-wash overflow-hidden">
                  <img
                    src={imgHeroTL}
                    alt="Membros da comunidade conversando em um café"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
              </figure>
            </div>
          </div>

          <div className="hidden md:block absolute top-12 lg:top-16 right-4 lg:right-16 xl:right-32 z-10 animate-fade-in-up [animation-delay:400ms]">
            <div className="animate-float-2">
              <figure className="p-3 bg-white pb-10 shadow-[0_8px_30px_hsla(var(--warm)/0.25)] transition-transform duration-500 ease-out rotate-[6deg] hover:rotate-[2deg]">
                <div className="w-36 lg:w-48 aspect-[4/5] bg-wash overflow-hidden">
                  <img
                    src={imgHeroTR}
                    alt="Caderno, café e plantas em uma mesa editorial"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
              </figure>
            </div>
          </div>

          <div className="hidden md:block absolute bottom-8 lg:bottom-12 left-8 lg:left-24 xl:left-40 z-10 animate-fade-in-up [animation-delay:500ms]">
            <div className="animate-float-3">
              <figure className="p-3 bg-white pb-10 shadow-[0_8px_30px_hsla(var(--warm)/0.25)] transition-transform duration-500 ease-out rotate-[5deg] hover:rotate-[1deg]">
                <div className="w-40 lg:w-56 aspect-[4/5] bg-wash overflow-hidden">
                  <img
                    src={imgHeroBL}
                    alt="Leitura contemplativa em uma varanda cercada de plantas"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
              </figure>
            </div>
          </div>

          <div className="hidden md:block absolute bottom-12 lg:bottom-20 right-8 lg:right-24 xl:right-40 z-10 animate-fade-in-up [animation-delay:600ms]">
            <div className="animate-float-4">
              <figure className="p-3 bg-white pb-10 shadow-[0_8px_30px_hsla(var(--sage)/0.25)] transition-transform duration-500 ease-out -rotate-[6deg] hover:-rotate-[1deg]">
                <div className="w-40 lg:w-52 aspect-[4/5] bg-wash overflow-hidden">
                  <img
                    src={imgHeroBR}
                    alt="Creator bottom right"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
              </figure>
            </div>
          </div>

          {/* Central Content */}
          <div className="container max-w-3xl mx-auto px-4 z-20 relative text-center flex flex-col items-center">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-gradient-to-r from-sage/15 to-paper border border-sage/25 mb-8 shadow-subtle animate-fade-in-up [animation-delay:0ms]">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-sage animate-pulse-dot-1" />
                <div className="w-2 h-2 rounded-full bg-sage animate-pulse-dot-2" />
                <div className="w-2 h-2 rounded-full bg-warm animate-pulse-dot-3" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink/75 font-semibold mt-0.5">
                Template · Comunidade + Cursos BR
              </span>
            </div>

            {/* H1 */}
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-ink leading-[1.1] mb-6 tracking-tight animate-fade-in-up [animation-delay:150ms]">
              Sua{' '}
              <span className="relative inline-block">
                <span className="relative z-10">audiência</span>
                <span className="absolute bottom-1.5 left-0 h-3.5 bg-sage/30 -z-10 -rotate-2 animate-brush w-0 [animation-delay:750ms] rounded-full" />
              </span>{' '}
              tem <br className="hidden md:block" />
              <span className="font-serif-italic italic text-warm font-normal pr-1 text-[1.15em]">
                casa
              </span>{' '}
              nova.
            </h1>

            {/* Sub-headline */}
            <p className="text-lg md:text-xl text-ink/80 leading-relaxed mb-10 max-w-2xl font-light animate-fade-in-up [animation-delay:300ms]">
              Espaços abertos, restritos e pagos · Postagens editoriais em markdown · Comentários
              threaded.{' '}
              <span className="text-warm font-medium">
                Template Skip pronto pra rodar no seu domínio.
              </span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full animate-fade-in-up [animation-delay:450ms]">
              <Button
                onClick={openLoginModal}
                className="relative h-14 px-8 bg-warm hover:bg-warm/90 text-white rounded-full text-lg font-medium w-full sm:w-auto flex gap-2 animate-ring-pulse group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Criar minha Vila{' '}
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  window.history.pushState({}, '', '?demo=true')
                  openLoginModal()
                }}
                className="h-14 px-8 text-ink hover:bg-wash rounded-full text-lg font-medium w-full sm:w-auto"
              >
                Ver demonstração ao vivo
              </Button>
            </div>

            {/* Microcopy */}
            <p className="font-mono text-xs text-mute mt-6 tracking-wide animate-fade-in-up [animation-delay:600ms]">
              <span className="text-warm font-semibold">Duplique no Skip</span> e lance hoje.
              <span className="mx-2 text-line">·</span>
              PT-BR nativo
              <span className="mx-2 text-line">·</span>
              Sem mensalidade SaaS
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
