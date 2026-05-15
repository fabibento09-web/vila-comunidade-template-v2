import { useEffect, useRef } from 'react'

export function AuroraBackground() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (isMobile || prefersReducedMotion) return

    let currentX = window.innerWidth / 2
    let currentY = window.innerHeight / 2
    let targetX = currentX
    let targetY = currentY
    let animationFrameId: number

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
    }

    window.addEventListener('mousemove', onMouseMove)

    const updateGlow = () => {
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08

      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${currentX}px, ${currentY}px)`
      }

      animationFrameId = requestAnimationFrame(updateGlow)
    }

    updateGlow()

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-cream">
      {/* Animated Aurora layers */}
      <div className="absolute inset-0 opacity-50 mix-blend-multiply blur-[55px]">
        <div className="absolute top-[8%] left-[5%] w-[22%] h-[22%] bg-sage/35 rounded-full animate-aurora-drift-1" />
        <div className="absolute top-[15%] right-[8%] w-[20%] h-[20%] bg-warm/30 rounded-full animate-aurora-drift-2" />
        <div className="absolute top-[55%] left-[35%] w-[18%] h-[18%] bg-sage/25 rounded-full animate-aurora-drift-3" />
        <div className="absolute bottom-[10%] left-[12%] w-[22%] h-[22%] bg-warm/25 rounded-full animate-aurora-drift-1" />
        <div className="absolute bottom-[18%] right-[12%] w-[20%] h-[20%] bg-sage/30 rounded-full animate-aurora-drift-2" />
        <div className="absolute top-[40%] right-[30%] w-[16%] h-[16%] bg-warm/20 rounded-full animate-aurora-drift-3" />
      </div>

      {/* Mouse Follow Glow - Only visible on md+ and if not reduced motion */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block motion-reduce:hidden">
        <div
          ref={glowRef}
          className="absolute top-[-175px] left-[-175px] w-[350px] h-[350px] bg-gradient-to-tr from-sage/45 via-warm/35 to-warm/40 rounded-full blur-[90px] will-change-transform"
          style={{ transform: 'translate(50vw, 50vh)' }}
        />
      </div>

      {/* Texture Layer */}
      <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay" />
    </div>
  )
}
