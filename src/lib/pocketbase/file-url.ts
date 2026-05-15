import pb from '@/lib/pocketbase/client'

export function getPublicFileUrl(record: any, filename: string, queryParams?: any): string {
  if (!record || !filename) return ''
  return pb.files.getURL(record, filename, queryParams)
}
