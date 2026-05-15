migrate(
  (app) => {
    const vilas = new Collection({
      name: 'vilas',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'bio', type: 'text' },
        { name: 'membros_count', type: 'number' },
        { name: 'idade_anos', type: 'number' },
        { name: 'cidade', type: 'text' },
        { name: 'verificada', type: 'bool' },
        { name: 'status_dia', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(vilas)

    const espacos = new Collection({
      name: 'espacos',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'emoji', type: 'text' },
        { name: 'nao_lidos', type: 'number' },
        {
          name: 'vila_id',
          type: 'relation',
          collectionId: vilas.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(espacos)

    const postagens = new Collection({
      name: 'postagens',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && autor = @request.auth.id",
      deleteRule: "@request.auth.id != '' && autor = @request.auth.id",
      fields: [
        { name: 'titulo', type: 'text', required: true },
        { name: 'corpo', type: 'text', required: true },
        { name: 'cover_url', type: 'url' },
        {
          name: 'autor',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'espaco',
          type: 'relation',
          collectionId: espacos.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'publicado_em', type: 'date' },
        { name: 'curtidas', type: 'number' },
        { name: 'comentarios', type: 'number' },
        { name: 'min_leitura', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(postagens)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('postagens'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('espacos'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('vilas'))
    } catch (_) {}
  },
)
