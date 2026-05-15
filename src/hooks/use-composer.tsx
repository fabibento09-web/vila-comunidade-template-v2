import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ComposerContextType {
  isOpen: boolean
  openComposer: (espacoId?: string, draftId?: string) => void
  closeComposer: () => void
  initialEspacoId?: string
  initialDraftId?: string
}

const ComposerContext = createContext<ComposerContextType | undefined>(undefined)

export function ComposerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialEspacoId, setInitialEspacoId] = useState<string>()
  const [initialDraftId, setInitialDraftId] = useState<string>()

  const openComposer = (espacoId?: string, draftId?: string) => {
    setInitialEspacoId(espacoId)
    setInitialDraftId(draftId)
    setIsOpen(true)
  }

  const closeComposer = () => {
    setIsOpen(false)
    setInitialEspacoId(undefined)
    setInitialDraftId(undefined)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        openComposer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <ComposerContext.Provider
      value={{ isOpen, openComposer, closeComposer, initialEspacoId, initialDraftId }}
    >
      {children}
    </ComposerContext.Provider>
  )
}

export const useComposer = () => {
  const context = useContext(ComposerContext)
  if (!context) throw new Error('useComposer must be used within ComposerProvider')
  return context
}
