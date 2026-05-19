migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Ensure Admin User exists via check-before-create
    let adminUser
    try {
      adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'fabiano@adapta.org')
      if (adminUser.getString('role') !== 'admin') {
        adminUser.set('role', 'admin')
        app.save(adminUser)
      }
    } catch (_) {
      adminUser = new Record(users)
      adminUser.setEmail('fabiano@adapta.org')
      adminUser.setPassword('Skip@Pass')
      adminUser.setVerified(true)
      adminUser.set('name', 'Fabiano')
      adminUser.set('role', 'admin')
      app.save(adminUser)
    }

    const espacos = app.findCollectionByNameOrId('espacos')
    const spaceNames = [
      {
        nome: 'Início',
        slug: 'inicio',
        emoji: '🏡',
        descricao: 'O lugar pra começar. Boas-vindas, novidades e bem-querer.',
        tipo: 'aberto',
      },
      {
        nome: 'Recados',
        slug: 'recados',
        emoji: '✍️',
        descricao: 'Avisos curtos do dia a dia. Sem floreios.',
        tipo: 'aberto',
      },
      {
        nome: 'Aulas Abertas',
        slug: 'aulas-abertas',
        emoji: '📚',
        descricao: 'Aulas gratuitas. Pra quem tá começando ou só de passagem.',
        tipo: 'aberto',
      },
      {
        nome: 'Bastidores',
        slug: 'bastidores',
        emoji: '🎭',
        descricao: 'O processo, os erros, os ensaios. Ninguém vê isso de fora.',
        tipo: 'aberto',
      },
      {
        nome: 'Pro · Mentoria',
        slug: 'pro-mentoria',
        emoji: '🌿',
        descricao: 'Só pra quem tá no Pro. Mentoria 1:1 e cohortes fechadas.',
        tipo: 'pago',
      },
    ]

    let mainVila
    try {
      const records = app.findRecordsByFilter('vilas', '1=1', '', 1, 0)
      if (records.length > 0) {
        mainVila = records[0]
      } else {
        throw new Error('No vilas')
      }
    } catch (_) {
      const vilas = app.findCollectionByNameOrId('vilas')
      mainVila = new Record(vilas)
      mainVila.set('nome', 'Vila Principal')
      mainVila.set('verificada', true)
      app.save(mainVila)
    }

    for (const s of spaceNames) {
      try {
        app.findFirstRecordByData('espacos', 'slug', s.slug)
      } catch (_) {
        try {
          const existingByName = app.findFirstRecordByData('espacos', 'nome', s.nome)
          if (!existingByName.getString('slug')) {
            existingByName.set('slug', s.slug)
            app.save(existingByName)
          }
        } catch (_) {
          const record = new Record(espacos)
          record.set('nome', s.nome)
          record.set('slug', s.slug)
          record.set('emoji', s.emoji)
          record.set('descricao', s.descricao)
          record.set('tipo', s.tipo)
          record.set('vila_id', mainVila.id)
          app.save(record)
        }
      }
    }

    // Ensure Demo Course exists via check-before-create
    try {
      app.findFirstRecordByData('cursos', 'slug', 'lance-sua-vila-em-7-dias')
    } catch (_) {
      const cursos = app.findCollectionByNameOrId('cursos')
      const curso = new Record(cursos)
      curso.set('titulo', 'Lance sua Vila em 7 dias')
      curso.set('slug', 'lance-sua-vila-em-7-dias')
      curso.set('tagline', 'O passo a passo para configurar e atrair os primeiros membros.')
      curso.set(
        'descricao',
        '<p>Neste curso você vai aprender do zero a configurar a sua comunidade.</p>',
      )
      curso.set('autor', adminUser.id)
      curso.set('tipo', 'free')
      curso.set('publicado', true)
      curso.set('ordem', 1)
      app.save(curso)
    }
  },
  (app) => {},
)
