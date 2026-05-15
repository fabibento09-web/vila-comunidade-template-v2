migrate(
  (app) => {
    const espacosData = [
      {
        nome: 'Início',
        slug: 'inicio',
        descricao: 'O lugar pra começar. Boas-vindas, novidades e bem-querer.',
      },
      { nome: 'Recados', slug: 'recados', descricao: 'Avisos curtos do dia a dia. Sem floreios.' },
      {
        nome: 'Aulas Abertas',
        slug: 'aulas-abertas',
        descricao: 'Aulas gratuitas. Pra quem tá começando ou só de passagem.',
      },
      {
        nome: 'Bastidores',
        slug: 'bastidores',
        descricao: 'O processo, os erros, os ensaios. Ninguém vê isso de fora.',
      },
      {
        nome: 'Pro: Mentoria',
        slug: 'pro-mentoria',
        descricao: 'Só pra quem tá no Pro. Mentoria 1:1 e cohortes fechadas.',
      },
    ]

    const espacos = app.findCollectionByNameOrId('espacos')

    for (const ed of espacosData) {
      let r
      try {
        r = app.findFirstRecordByData('espacos', 'slug', ed.slug)
      } catch (_) {
        try {
          r = app.findFirstRecordByData('espacos', 'nome', ed.nome)
        } catch (_) {
          r = new Record(espacos)
          r.set('nome', ed.nome)
          try {
            const vilas = app.findRecordsByFilter('vilas', '', '', 1, 0)
            if (vilas.length > 0) r.set('vila_id', vilas[0].id)
          } catch (_) {}
        }
      }
      r.set('slug', ed.slug)
      r.set('descricao', ed.descricao)
      app.save(r)
    }

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const createMockUser = (name, email) => {
      try {
        return app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        const u = new Record(users)
        u.setEmail(email)
        u.setPassword('Skip@Pass')
        u.setVerified(true)
        u.set('name', name)
        app.save(u)
        return u
      }
    }

    const uMariana = createMockUser('Mariana', 'mariana@mock.com')
    const uLuiz = createMockUser('Luiz', 'luiz@mock.com')
    const uFelipe = createMockUser('Felipe', 'felipe@mock.com')
    const uCamila = createMockUser('Camila', 'camila@mock.com')
    const uEduardo = createMockUser('Eduardo', 'eduardo@mock.com')
    const uTatiana = createMockUser('Tatiana', 'tatiana@mock.com')
    const uRenata = createMockUser('Renata Sá', 'renata@mock.com')

    const postagensCol = app.findCollectionByNameOrId('postagens')
    const pTodo = (() => {
      try {
        return app.findFirstRecordByData('postagens', 'titulo', 'To-Do lists')
      } catch (_) {
        const p = new Record(postagensCol)
        p.set('titulo', 'To-Do lists')
        p.set('corpo', 'Como vocês organizam as tarefas do dia a dia?')
        p.set('autor', uRenata.id)
        try {
          const e = app.findFirstRecordByData('espacos', 'slug', 'bastidores')
          p.set('espaco', e.id)
        } catch (_) {}
        app.save(p)
        return p
      }
    })()

    const pVagas = (() => {
      try {
        return app.findFirstRecordByData('postagens', 'titulo', 'Vagas mentoria')
      } catch (_) {
        const p = new Record(postagensCol)
        p.set('titulo', 'Vagas mentoria')
        p.set('corpo', 'Abrimos 5 novas vagas para a mentoria deste semestre.')
        p.set('autor', uRenata.id)
        try {
          const e = app.findFirstRecordByData('espacos', 'slug', 'recados')
          p.set('espaco', e.id)
        } catch (_) {}
        app.save(p)
        return p
      }
    })()

    pVagas.set('pinned', true)
    app.save(pVagas)

    const commentsCol = app.findCollectionByNameOrId('comentarios')
    const createComment = (post, autor, text, parentId) => {
      const c = new Record(commentsCol)
      c.set('postagem', post.id)
      c.set('autor', autor.id)
      c.set('corpo', text)
      if (parentId) c.set('parent_id', parentId)
      c.set('curtidas', Math.floor(Math.random() * 10))
      app.save(c)
      return c.id
    }

    try {
      const existingTodo = app.findRecordsByFilter(
        'comentarios',
        `postagem = '${pTodo.id}'`,
        '',
        1,
        0,
      )
      if (existingTodo.length === 0) {
        const c1 = createComment(
          pTodo,
          uMariana,
          'Eu uso o Notion pra tudo! Mas confesso que às vezes sinto falta do bom e velho papel.',
        )
        createComment(
          pTodo,
          uLuiz,
          'Papel é vida! Nada supera riscar uma tarefa feita à caneta.',
          c1,
        )
        createComment(
          pTodo,
          uFelipe,
          'Tô testando o Todoist agora, mas ainda apanhando um pouco da interface.',
        )
        createComment(
          pTodo,
          uCamila,
          'Eu desisti de apps. Comprei um planner e mudei minha vida.',
          c1,
        )
      }
    } catch (_) {}

    try {
      const existingVagas = app.findRecordsByFilter(
        'comentarios',
        `postagem = '${pVagas.id}'`,
        '',
        1,
        0,
      )
      if (existingVagas.length === 0) {
        const c3 = createComment(pVagas, uEduardo, 'Quais são os dias e horários dos encontros?')
        createComment(pVagas, uRenata, 'Sempre às terças, 19h! Ficam gravados também.', c3)
        createComment(pVagas, uTatiana, 'Já garanti minha vaga! Ansiosa pra começar.')
      }
    } catch (_) {}
  },
  (app) => {},
)
