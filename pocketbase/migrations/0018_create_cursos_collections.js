migrate(
  (app) => {
    const cursos = new Collection({
      name: 'cursos',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'titulo', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true },
        { name: 'descricao', type: 'editor' },
        { name: 'tagline', type: 'text' },
        {
          name: 'cover',
          type: 'file',
          maxSelect: 1,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'autor', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'tipo', type: 'select', values: ['free', 'pago', 'pro'], required: true },
        { name: 'ordem', type: 'number' },
        { name: 'publicado', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_cursos_slug ON cursos (slug)'],
    })
    app.save(cursos)

    const modulos = new Collection({
      name: 'modulos',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'titulo', type: 'text', required: true },
        {
          name: 'curso',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('cursos').id,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        { name: 'ordem', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(modulos)

    const aulas = new Collection({
      name: 'aulas',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'titulo', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true },
        {
          name: 'modulo',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('modulos').id,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'curso',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('cursos').id,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        { name: 'video_url', type: 'url' },
        { name: 'descricao', type: 'editor' },
        { name: 'duracao_min', type: 'number' },
        { name: 'ordem', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_aulas_slug ON aulas (slug)'],
    })
    app.save(aulas)

    const progresso = new Collection({
      name: 'aula_progresso',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'aula',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('aulas').id,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        { name: 'completou', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_aula_progresso_user_aula ON aula_progresso (user, aula)'],
    })
    app.save(progresso)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('aula_progresso'))
    app.delete(app.findCollectionByNameOrId('aulas'))
    app.delete(app.findCollectionByNameOrId('modulos'))
    app.delete(app.findCollectionByNameOrId('cursos'))
  },
)
