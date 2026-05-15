import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { getPublicFileUrl } from '@/lib/pocketbase/file-url'
import { Camera, Upload, Loader2, ArrowLeft } from 'lucide-react'

export default function ProfileEditPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    cidade: '',
    website: '',
    twitter: '',
    instagram: '',
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    setFormData({
      name: user.name || '',
      bio: user.bio || '',
      cidade: user.cidade || '',
      website: user.website || '',
      twitter: user.twitter || '',
      instagram: user.instagram || '',
    })
    setAvatarPreview(user.avatar ? getPublicFileUrl(user, user.avatar) : null)
    setCoverPreview(user.cover ? getPublicFileUrl(user, user.cover) : null)
  }, [user, navigate])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 5MB')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    if (type === 'avatar') {
      setAvatarFile(file)
      setAvatarPreview(previewUrl)
    } else {
      setCoverFile(file)
      setCoverPreview(previewUrl)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('bio', formData.bio)
      data.append('cidade', formData.cidade)
      data.append('website', formData.website)
      data.append('twitter', formData.twitter)
      data.append('instagram', formData.instagram)

      if (avatarFile) data.append('avatar', avatarFile)
      if (coverFile) data.append('cover', coverFile)

      const updated = await pb.collection('users').update(user.id, data)
      toast.success('Perfil atualizado')
      navigate(`/u/${updated.id}`)
    } catch (err: any) {
      const msg = err.response?.message || 'Erro ao atualizar perfil'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <main className="max-w-[760px] mx-auto w-full pb-24 pt-4 md:pt-8">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-mute hover:text-ink transition-colors font-medium text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <h1 className="font-serif text-3xl font-bold text-ink">Editar Perfil</h1>
        <p className="text-mute mt-2">Personalize como você aparece na Vila.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-4">
          <label className="text-sm font-bold text-mute uppercase tracking-wider">
            Capa do Perfil
          </label>
          <div
            className="w-full h-48 md:h-56 border-2 border-dashed border-line rounded-2xl relative overflow-hidden group cursor-pointer bg-wash flex flex-col items-center justify-center"
            onClick={() => coverInputRef.current?.click()}
          >
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Capa"
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="text-center text-mute flex flex-col items-center">
                <Upload className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm font-medium">Clique para enviar capa</span>
                <span className="text-xs opacity-70 mt-1">JPG, PNG, WEBP (Máx 5MB)</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium">
              Alterar capa
            </div>
            <input
              type="file"
              ref={coverInputRef}
              className="hidden"
              accept="image/jpeg, image/png, image/webp"
              onChange={(e) => handleFileChange(e, 'cover')}
            />
          </div>
        </div>

        <div className="space-y-4 flex flex-col md:flex-row md:items-center gap-6">
          <div
            className="w-24 h-24 shrink-0 rounded-full border-2 border-dashed border-line relative overflow-hidden group cursor-pointer bg-wash flex items-center justify-center"
            onClick={() => avatarInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              />
            ) : (
              <Camera className="w-8 h-8 text-mute opacity-50" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Camera className="w-6 h-6" />
            </div>
            <input
              type="file"
              ref={avatarInputRef}
              className="hidden"
              accept="image/jpeg, image/png, image/webp"
              onChange={(e) => handleFileChange(e, 'avatar')}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-mute uppercase tracking-wider block mb-1">
              Foto de Perfil
            </label>
            <p className="text-xs text-mute mb-3">Recomendado: 256x256px.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => avatarInputRef.current?.click()}
            >
              Escolher imagem
            </Button>
          </div>
        </div>

        <div className="space-y-6 bg-paper p-6 rounded-2xl border border-line">
          <div>
            <label className="text-sm font-bold text-mute uppercase tracking-wider block mb-2">
              Nome
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Seu nome"
              className="bg-background"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-mute uppercase tracking-wider flex justify-between mb-2">
              <span>Biografia</span>
              <span className="font-mono text-xs normal-case font-normal">
                {formData.bio.length}/200
              </span>
            </label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Conte um pouco sobre você..."
              maxLength={200}
              className="bg-background resize-none h-24"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-mute uppercase tracking-wider block mb-2">
              Localização
            </label>
            <Input
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              placeholder="Ex: São Paulo, SP"
              maxLength={80}
              className="bg-background"
            />
          </div>
        </div>

        <div className="space-y-6 bg-paper p-6 rounded-2xl border border-line">
          <h3 className="font-serif font-bold text-lg text-ink">Links e Redes Sociais</h3>

          <div>
            <label className="text-sm font-bold text-mute uppercase tracking-wider block mb-2">
              Website
            </label>
            <Input
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="seusite.com.br"
              className="bg-background"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-bold text-mute uppercase tracking-wider block mb-2">
                Instagram
              </label>
              <Input
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@seuusuario"
                className="bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-mute uppercase tracking-wider block mb-2">
                Twitter / X
              </label>
              <Input
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                placeholder="@seuusuario"
                className="bg-background"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-line">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-warm hover:bg-warm/90 text-white px-8 rounded-full"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar alterações
          </Button>
        </div>
      </form>
    </main>
  )
}
