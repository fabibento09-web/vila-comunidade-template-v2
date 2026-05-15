import React, { useRef } from 'react'
import { Bold, Italic, Link as LinkIcon, List, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = '160px',
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const insertText = (before: string, after: string, defaultText = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const replacement = before + (selectedText || defaultText) + after

    const newValue = value.substring(0, start) + replacement + value.substring(end)
    onChange(newValue)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        end + before.length + (selectedText ? 0 : defaultText.length),
      )
    }, 0)
  }

  const handleBold = () => insertText('**', '**', 'negrito')
  const handleItalic = () => insertText('*', '*', 'itálico')
  const handleLink = () => {
    const url = prompt('URL do link:')
    if (url) insertText('[', `](${url})`, 'texto do link')
  }
  const handleList = () => insertText('\n- ', '', 'item da lista')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const toastId = toast.loading('Fazendo upload da imagem...')
    try {
      const record = await pb.collection('uploads').create({
        user: pb.authStore.model?.id,
        file: file,
        context: 'markdown_editor',
      })

      const fileUrl = pb.files.getURL(record, record.file)
      insertText('![', `](${fileUrl})`, file.name)
      toast.success('Imagem enviada', { id: toastId })
    } catch (err) {
      toast.error('Erro ao enviar imagem', { id: toastId })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault()
      handleBold()
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault()
      handleItalic()
    }
  }

  return (
    <div className="flex flex-col border border-line rounded-xl overflow-hidden bg-background focus-within:ring-2 focus-within:ring-sage shadow-subtle transition-shadow">
      <div className="flex items-center gap-1 border-b border-line p-1 bg-wash">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-mute hover:text-ink"
          onClick={handleBold}
          title="Negrito (Cmd+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-mute hover:text-ink"
          onClick={handleItalic}
          title="Itálico (Cmd+I)"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-mute hover:text-ink"
          onClick={handleLink}
          title="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-mute hover:text-ink"
          onClick={handleList}
          title="Lista"
        >
          <List className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-line mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-mute hover:text-ink"
          onClick={() => fileInputRef.current?.click()}
          title="Imagem"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 w-full p-4 text-sm bg-transparent border-0 focus:outline-none resize-y"
        style={{ minHeight }}
      />
    </div>
  )
}
