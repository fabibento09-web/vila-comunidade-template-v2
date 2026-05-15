onRecordAfterCreateSuccess((e) => {
  const comentario = e.record
  const ator = comentario.getString('autor')
  const postagemId = comentario.getString('postagem')
  const parentId = comentario.getString('parent_id')

  try {
    const postagem = $app.findRecordById('postagens', postagemId)
    const count = postagem.getInt('comentarios')
    postagem.set('comentarios', count + 1)
    $app.save(postagem)
  } catch (_) {}

  if (parentId) {
    try {
      const parent = $app.findRecordById('comentarios', parentId)
      const parentAutor = parent.getString('autor')
      if (parentAutor && parentAutor !== ator) {
        const avisosCol = $app.findCollectionByNameOrId('avisos')
        const aviso = new Record(avisosCol)
        aviso.set('user', parentAutor)
        aviso.set('ator', ator)
        aviso.set('tipo', 'resposta')
        aviso.set('postagem', postagemId)
        aviso.set('comentario', comentario.id)
        $app.save(aviso)
      }
    } catch (_) {}
  } else {
    try {
      const postagem = $app.findRecordById('postagens', postagemId)
      const postagemAutor = postagem.getString('autor')
      if (postagemAutor && postagemAutor !== ator) {
        const avisosCol = $app.findCollectionByNameOrId('avisos')
        const aviso = new Record(avisosCol)
        aviso.set('user', postagemAutor)
        aviso.set('ator', ator)
        aviso.set('tipo', 'comentario')
        aviso.set('postagem', postagemId)
        aviso.set('comentario', comentario.id)
        $app.save(aviso)
      }
    } catch (_) {}
  }
  e.next()
}, 'comentarios')

onRecordCreateRequest((e) => {
  const em = e.record
  const user = em.getString('user')
  const espaco = em.getString('espaco')
  const bloqueado = em.getBool('bloqueado')
  const authId = e.auth ? e.auth.id : null

  if (!bloqueado && authId && authId !== user) {
    try {
      const avisosCol = $app.findCollectionByNameOrId('avisos')
      const aviso = new Record(avisosCol)
      aviso.set('user', user)
      aviso.set('ator', authId)
      aviso.set('tipo', 'espaco_adicionado')
      aviso.set('espaco', espaco)
      $app.save(aviso)
    } catch (_) {}
  }
  e.next()
}, 'espaco_membros')

onRecordAfterDeleteSuccess((e) => {
  const comentario = e.record
  const postagemId = comentario.getString('postagem')

  try {
    const postagem = $app.findRecordById('postagens', postagemId)
    const count = postagem.getInt('comentarios')
    postagem.set('comentarios', Math.max(0, count - 1))
    $app.save(postagem)
  } catch (_) {}

  e.next()
}, 'comentarios')
