import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, ImageIcon } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

const schema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  bio: z.string().max(200, 'A bio não pode passar de 200 caracteres').optional(),
  cidade: z.string().optional(),
  status_dia: z.string().max(80, 'O status não pode passar de 80 caracteres').optional(),
  verificada: z.boolean().default(false),
})

type FormValues = z.infer<typeof schema>

export default function VilaSettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [vilaId, setVilaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    async function load() {
      try {
        const vilas = await pb.collection('vilas').getFullList()
        if (vilas.length > 0) {
          const v = vilas[0]
          setVilaId(v.id)
          setValue('nome', v.nome || '')
          setValue('bio', v.bio || '')
          setValue('cidade', v.cidade || '')
          setValue('status_dia', v.status_dia || '')
          setValue('verificada', v.verificada || false)

          if (v.cover) {
            setCoverPreview(getPublicFileUrl(v, v.cover))
          }
          if (v.avatar) {
            setAvatarPreview(getPublicFileUrl(v, v.avatar))
          }
        }
      } catch (err) {
        console.error(err)
        toast.error('Erro ao carregar configurações da Vila')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [setValue])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem não pode passar de 5MB')
        return
      }
      setCoverFile(file)
      const url = URL.createObjectURL(file)
      setCoverPreview(url)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A foto de perfil não pode passar de 2MB')
        return
      }
      setAvatarFile(file)
      const url = URL.createObjectURL(file)
      setAvatarPreview(url)
    }
  }

  const onSubmit = async (data: FormValues) => {
    if (!vilaId) return
    setSaving(true)
    const tid = toast.loading('Salvando configurações...')

    try {
      const formData = new FormData()
      formData.append('nome', data.nome)
      formData.append('bio', data.bio || '')
      formData.append('cidade', data.cidade || '')
      formData.append('status_dia', data.status_dia || '')
      formData.append('verificada', String(data.verificada))

      if (coverFile) {
        formData.append('cover', coverFile)
      }
      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      await pb.collection('vilas').update(vilaId, formData)
      toast.success('Configurações salvas com sucesso', { id: tid })
    } catch (err) {
      toast.error(getErrorMessage(err), { id: tid })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-mute w-8 h-8" />
      </div>
    )
  }

  return (
    <main className="max-w-[760px] w-full mx-auto pb-24">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-ink">Configurações da Vila</h1>
        <p className="text-mute mt-2">Personalize a identidade da sua comunidade.</p>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8 bg-paper p-6 md:p-8 rounded-2xl border border-line shadow-subtle"
      >
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            <Label className="text-base mb-3 block">Foto da Vila</Label>
            <div
              className="w-24 h-24 rounded-full border-2 border-dashed border-line overflow-hidden relative group cursor-pointer bg-wash flex items-center justify-center"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarPreview ? (
                <>
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center text-mute group-hover:text-ink transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
              )}
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
            </div>
            <p className="text-xs text-mute mt-2 text-center">Até 2MB</p>
          </div>
        </div>

        <div>
          <Label className="text-base mb-3 block">Capa da Vila</Label>
          <div
            className="w-full h-48 md:h-56 rounded-xl border-2 border-dashed border-line overflow-hidden relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {coverPreview ? (
              <>
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white flex items-center gap-2 font-medium">
                    <Upload className="w-5 h-5" /> Trocar imagem
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#A0B099] via-[#E8E8DE] to-[#E8B5A1] bg-noise flex items-center justify-center relative">
                <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center text-mute group-hover:text-ink transition-colors gap-2">
                  <ImageIcon className="w-8 h-8" />
                  <span className="font-medium">Fazer upload de capa</span>
                  <span className="text-xs">JPG, PNG ou WEBP até 5MB</span>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              {...register('nome')}
              placeholder="Nome da sua comunidade"
              className="mt-1.5"
            />
            {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              {...register('bio')}
              placeholder="Uma breve descrição sobre a Vila"
              className="mt-1.5 resize-none h-20"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-mute">Aparece na barra lateral</p>
              {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="status_dia">Status do dia</Label>
            <Input
              id="status_dia"
              {...register('status_dia')}
              placeholder="Ex: Gravando aula nova 🎙️"
              className="mt-1.5"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-mute">Uma mensagem curta para hoje</p>
              {errors.status_dia && (
                <p className="text-xs text-red-500">{errors.status_dia.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              {...register('cidade')}
              placeholder="Ex: São Paulo"
              className="mt-1.5"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-wash rounded-xl border border-line mt-6">
            <div className="space-y-0.5">
              <Label className="text-base">Vila Verificada</Label>
              <p className="text-sm text-mute">Mostra o selo de verificação ao lado do nome.</p>
            </div>
            <Switch
              checked={watch('verificada')}
              onCheckedChange={(val) => setValue('verificada', val)}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-line flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-ink hover:bg-ink/90 text-white rounded-full px-8"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar alterações
          </Button>
        </div>
      </form>
    </main>
  )
}
