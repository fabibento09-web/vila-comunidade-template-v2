import React from 'react'

export function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
  if (!content) return null

  const isHtml = /^\s*</.test(content) && />/.test(content)

  if (isHtml) {
    return (
      <div
        className={`prose prose-sage max-w-none text-base leading-relaxed ${className || ''}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  const html = content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /!\[(.*?)\]\((.*?)\)/g,
      '<img src="$2" alt="$1" class="rounded-xl border border-line max-w-full my-4 block" />',
    )
    .replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sage underline hover:text-sage/80">$1</a>',
    )
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')

  const blocks = html.split(/\n\s*\n/)
  const result = blocks.map((block) => {
    const listLines = block.split('\n')
    const isList = listLines.every((l) => l.trim().match(/^[-*]\s/) || l.trim() === '')

    if (isList) {
      const listItems = listLines
        .filter((l) => l.trim().match(/^[-*]\s/))
        .map((l) => `<li>${l.replace(/^[-*]\s+/, '')}</li>`)
      if (listItems.length > 0) {
        return `<ul class="list-disc pl-5 my-4 space-y-1 text-ink/80">${listItems.join('')}</ul>`
      }
    }
    return `<p class="mb-4">${block.replace(/\n/g, '<br />')}</p>`
  })

  return (
    <div
      className={`prose prose-sage max-w-none text-base leading-relaxed ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: result.join('') }}
    />
  )
}
