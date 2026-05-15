migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let fabiano
    try {
      fabiano = app.findAuthRecordByEmail('_pb_users_auth_', 'fabiano@adapta.org')
    } catch (_) {
      fabiano = new Record(users)
      fabiano.setEmail('fabiano@adapta.org')
      fabiano.setPassword('Skip@Pass')
      fabiano.setVerified(true)
      fabiano.set('name', 'Fabiano')
      app.save(fabiano)
    }

    let luiz
    try {
      luiz = app.findAuthRecordByEmail('_pb_users_auth_', 'luiz@example.com')
    } catch (_) {
      luiz = new Record(users)
      luiz.setEmail('luiz@example.com')
      luiz.setPassword('Skip@Pass')
      luiz.setVerified(true)
      luiz.set('name', 'Luiz Caetano')
      app.save(luiz)
    }

    let renata
    try {
      renata = app.findAuthRecordByEmail('_pb_users_auth_', 'renata@example.com')
    } catch (_) {
      renata = new Record(users)
      renata.setEmail('renata@example.com')
      renata.setPassword('Skip@Pass')
      renata.setVerified(true)
      renata.set('name', 'Renata Sá')
      app.save(renata)
    }

    const vilas = app.findCollectionByNameOrId('vilas')
    let vila
    try {
      vila = app.findFirstRecordByData('vilas', 'nome', 'Renata Sá · Mentoria')
    } catch (_) {
      vila = new Record(vilas)
      vila.set('nome', 'Renata Sá · Mentoria')
      vila.set('bio', 'Mentoria pra criadores que querem viver da própria voz.')
      vila.set('cidade', 'São Paulo')
      vila.set('verificada', true)
      vila.set('status_dia', 'Gravando aula nova 🎙️')
      app.save(vila)
    }

    const espacos = app.findCollectionByNameOrId('espacos')
    const spaceNames = [
      { nome: 'Início', emoji: '🏡', unread: 0 },
      { nome: 'Recados', emoji: '✍️', unread: 2 },
      { nome: 'Aulas Abertas', emoji: '📚', unread: 0 },
      { nome: 'Bastidores', emoji: '🎭', unread: 5 },
      { nome: 'Pro · Mentoria', emoji: '🌿', unread: 0 },
    ]

    const spaceRecords = {}
    for (const s of spaceNames) {
      try {
        spaceRecords[s.nome] = app.findFirstRecordByData('espacos', 'nome', s.nome)
      } catch (_) {
        const record = new Record(espacos)
        record.set('nome', s.nome)
        record.set('emoji', s.emoji)
        record.set('nao_lidos', s.unread)
        record.set('vila_id', vila.id)
        app.save(record)
        spaceRecords[s.nome] = record
      }
    }

    const postagens = app.findCollectionByNameOrId('postagens')
    const postsData = [
      {
        titulo: 'Como manter a consistência sem pirar',
        corpo:
          'A maior mentira que contaram pra gente é que você precisa postar todo dia. A verdade é que consistência não é frequência, é previsibilidade. Seus leitores preferem um texto bom por semana a sete textos medíocres.',
        autor: renata.id,
        espaco: spaceRecords['Aulas Abertas'].id,
        curtidas: 42,
        comentarios: 12,
        min_leitura: 4,
        cover_url: 'https://img.usecurling.com/p/800/400?q=desk&color=gray',
      },
      {
        titulo: 'O setup de gravação atualizado',
        corpo:
          'Depois de muito teste, finalmente cheguei no setup ideal pra gravar as mentorias. Microfone Shure MV7, luz principal da Amaran e uma luz de preenchimento super barata que comprei na internet.',
        autor: luiz.id,
        espaco: spaceRecords['Bastidores'].id,
        curtidas: 15,
        comentarios: 3,
        min_leitura: 2,
        cover_url: 'https://img.usecurling.com/p/800/400?q=microphone&color=black',
      },
      {
        titulo: 'Bem-vindos à turma 4!',
        corpo:
          'Que alegria receber vocês aqui. Este espaço é nosso. Usem e abusem. A primeira aula ao vivo já está marcada para a próxima terça-feira e o link será enviado por e-mail e disponibilizado aqui no espaço de aulas.',
        autor: renata.id,
        espaco: spaceRecords['Recados'].id,
        curtidas: 89,
        comentarios: 34,
        min_leitura: 1,
        cover_url: '',
      },
    ]

    for (const p of postsData) {
      try {
        app.findFirstRecordByData('postagens', 'titulo', p.titulo)
      } catch (_) {
        const record = new Record(postagens)
        record.set('titulo', p.titulo)
        record.set('corpo', p.corpo)
        record.set('autor', p.autor)
        record.set('espaco', p.espaco)
        record.set('curtidas', p.curtidas)
        record.set('comentarios', p.comentarios)
        record.set('min_leitura', p.min_leitura)
        record.set('cover_url', p.cover_url)
        record.set('publicado_em', new Date().toISOString().replace('T', ' '))
        app.save(record)
      }
    }
  },
  (app) => {},
)
