import pb from '@/lib/pocketbase/client'

export const getVilaInfo = async () => {
  const vilas = await pb.collection('vilas').getFullList()
  return vilas[0]
}

export const getEspacos = async (vilaId: string) => {
  return pb
    .collection('espacos')
    .getFullList({ filter: `vila_id = "${vilaId}"`, sort: '-nao_lidos,nome' })
}

export const getPostagens = async () => {
  return pb.collection('postagens').getList(1, 50, {
    filter: `status = "publicado"`,
    sort: '-publicado_em',
    expand: 'autor,espaco',
  })
}

export const getEspacoBySlug = async (slug: string) => {
  return pb.collection('espacos').getFirstListItem(`slug = "${slug}"`)
}

export const getPostagensByEspaco = async (espacoId: string) => {
  return pb.collection('postagens').getList(1, 50, {
    filter: `espaco = "${espacoId}" && status = "publicado"`,
    sort: '-pinned,-created',
    expand: 'autor,espaco',
  })
}

export const getPostagem = async (id: string) => {
  return pb.collection('postagens').getOne(id, { expand: 'autor,espaco' })
}

export const getComentarios = async (postagemId: string) => {
  return pb.collection('comentarios').getFullList({
    filter: `postagem = "${postagemId}"`,
    sort: 'created',
    expand: 'autor,parent_id',
  })
}

export const createComentario = async (data: any) => {
  return pb.collection('comentarios').create(data)
}

export const toggleCurtidaPostagem = async (postId: string, userId: string) => {
  let existingRecord = null
  try {
    existingRecord = await pb
      .collection('postagem_curtidas')
      .getFirstListItem(`user="${userId}" && postagem="${postId}"`)
  } catch {
    // swallow lookup error
  }

  if (existingRecord) {
    try {
      await pb.collection('postagem_curtidas').delete(existingRecord.id)
      return { liked: false }
    } catch (err: any) {
      console.error('Delete like failed:', {
        status: err?.status,
        data: err?.response,
        message: err?.message,
      })
      throw err
    }
  } else {
    try {
      await pb.collection('postagem_curtidas').create({ user: userId, postagem: postId })
      return { liked: true }
    } catch (err: any) {
      console.error('Create like failed:', {
        userId,
        postId,
        status: err?.status,
        data: err?.response,
        message: err?.message,
      })
      throw err
    }
  }
}

export const getCurtidasCount = async (postId: string) => {
  try {
    const result = await pb
      .collection('postagem_curtidas')
      .getList(1, 1, { filter: `postagem="${postId}"` })
    return result.totalItems
  } catch {
    return 0
  }
}

export const userCurtiu = async (postId: string, userId: string) => {
  try {
    await pb
      .collection('postagem_curtidas')
      .getFirstListItem(`user="${userId}" && postagem="${postId}"`)
    return true
  } catch {
    return false
  }
}

export const likePostagem = async (id: string, userId: string) => {
  return toggleCurtidaPostagem(id, userId)
}

export const likeComentario = async (id: string, currentLikes: number) => {
  return pb.collection('comentarios').update(id, { curtidas: currentLikes + 1 })
}

export const getDrafts = async (userId: string) => {
  return pb.collection('postagens').getFullList({
    filter: `autor = "${userId}" && status != "publicado"`,
    sort: '-updated',
    expand: 'espaco',
  })
}

export const deletePostagem = async (id: string) => {
  return pb.collection('postagens').delete(id)
}

export const getAvisos = async (userId: string) => {
  return pb.collection('avisos').getList(1, 20, {
    filter: `user = "${userId}"`,
    sort: '-created',
    expand: 'ator,postagem,comentario,espaco',
  })
}

export const markAvisoAsRead = async (id: string) => {
  return pb.collection('avisos').update(id, { lido: true })
}

export const markAllAvisosAsRead = async (userId: string) => {
  const unread = await pb.collection('avisos').getFullList({
    filter: `user = "${userId}" && lido = false`,
  })
  return Promise.all(unread.map((u) => pb.collection('avisos').update(u.id, { lido: true })))
}

export const getConviteByToken = async (token: string) => {
  return pb.send(`/backend/v1/convites/${token}`, { method: 'GET' })
}

export const aceitarConvite = async (
  token: string,
  data?: { name?: string; password?: string; email?: string },
) => {
  return pb.send(`/backend/v1/convites/${token}/aceitar`, {
    method: 'POST',
    body: JSON.stringify(data || {}),
    headers: { 'Content-Type': 'application/json' },
  })
}
