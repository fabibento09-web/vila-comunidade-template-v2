migrate(
  (app) => {
    try {
      app.findFirstRecordByData('cursos', 'slug', 'lance-sua-vila-em-7-dias')
      return
    } catch (_) {}

    let adminId = null
    try {
      adminId = app.findAuthRecordByEmail('_pb_users_auth_', 'fabiano@adapta.org').id
    } catch (_) {
      const users = app.findRecordsByFilter('_pb_users_auth_', '1=1', '', 1, 0)
      if (users.length > 0) adminId = users[0].id
    }

    const cursos = app.findCollectionByNameOrId('cursos')
    const modulos = app.findCollectionByNameOrId('modulos')
    const aulas = app.findCollectionByNameOrId('aulas')

    const curso = new Record(cursos)
    curso.set('titulo', 'Lance sua Vila em 7 dias')
    curso.set('slug', 'lance-sua-vila-em-7-dias')
    curso.set('tagline', 'O passo a passo para configurar e atrair os primeiros membros.')
    curso.set(
      'descricao',
      '<p>Neste curso você vai aprender do zero a configurar a sua comunidade e trazer os primeiros participantes engajados.</p>',
    )
    if (adminId) curso.set('autor', adminId)
    curso.set('tipo', 'free')
    curso.set('publicado', true)
    curso.set('ordem', 1)
    app.save(curso)

    const mod1 = new Record(modulos)
    mod1.set('titulo', 'Boas-vindas')
    mod1.set('curso', curso.id)
    mod1.set('ordem', 1)
    app.save(mod1)

    const aula1 = new Record(aulas)
    aula1.set('titulo', 'Por que uma Vila e não outra plataforma')
    aula1.set('slug', 'por-que-uma-vila')
    aula1.set('modulo', mod1.id)
    aula1.set('curso', curso.id)
    aula1.set('video_url', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
    aula1.set(
      'descricao',
      '<p>Entenda os diferenciais e a proposta de valor do modelo calmo da Vila comparado às redes tradicionais.</p>',
    )
    aula1.set('duracao_min', 12)
    aula1.set('ordem', 1)
    app.save(aula1)

    const aula2 = new Record(aulas)
    aula2.set('titulo', 'Seu nicho em uma frase')
    aula2.set('slug', 'seu-nicho-em-uma-frase')
    aula2.set('modulo', mod1.id)
    aula2.set('curso', curso.id)
    aula2.set('video_url', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
    aula2.set(
      'descricao',
      '<p>Como definir seu nicho de forma objetiva e irresistível para o seu público.</p>',
    )
    aula2.set('duracao_min', 8)
    aula2.set('ordem', 2)
    app.save(aula2)

    const mod2 = new Record(modulos)
    mod2.set('titulo', 'Setup da Vila')
    mod2.set('curso', curso.id)
    mod2.set('ordem', 2)
    app.save(mod2)

    const aula3 = new Record(aulas)
    aula3.set('titulo', 'Criando os primeiros espaços')
    aula3.set('slug', 'criando-espacos')
    aula3.set('modulo', mod2.id)
    aula3.set('curso', curso.id)
    aula3.set('video_url', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
    aula3.set(
      'descricao',
      '<p>Organize sua comunidade para evitar o caos e direcionar a comunicação.</p>',
    )
    aula3.set('duracao_min', 15)
    aula3.set('ordem', 3)
    app.save(aula3)

    const aula4 = new Record(aulas)
    aula4.set('titulo', 'Convide os 10 primeiros membros')
    aula4.set('slug', 'convide-primeiros-membros')
    aula4.set('modulo', mod2.id)
    aula4.set('curso', curso.id)
    aula4.set('video_url', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
    aula4.set(
      'descricao',
      '<p>O segredo do convite manual e exclusivo para formar a fundação da sua tribo.</p>',
    )
    aula4.set('duracao_min', 10)
    aula4.set('ordem', 4)
    app.save(aula4)
  },
  (app) => {
    try {
      const curso = app.findFirstRecordByData('cursos', 'slug', 'lance-sua-vila-em-7-dias')
      app.delete(curso)
    } catch (_) {}
  },
)
