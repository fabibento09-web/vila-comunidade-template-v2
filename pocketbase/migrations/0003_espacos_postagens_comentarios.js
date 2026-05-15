migrate(
  (app) => {
    const espacos = app.findCollectionByNameOrId('espacos')
    if (!espacos.fields.getByName('slug')) {
      espacos.fields.add(new TextField({ name: 'slug' }))
    }
    if (!espacos.fields.getByName('descricao')) {
      espacos.fields.add(new TextField({ name: 'descricao' }))
    }
    app.save(espacos)

    const postagens = app.findCollectionByNameOrId('postagens')
    if (!postagens.fields.getByName('pinned')) {
      postagens.fields.add(new BoolField({ name: 'pinned' }))
    }
    app.save(postagens)

    let comentarios
    try {
      comentarios = app.findCollectionByNameOrId('comentarios')
    } catch (_) {
      comentarios = new Collection({
        name: 'comentarios',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != '' && autor = @request.auth.id",
        deleteRule: "@request.auth.id != '' && autor = @request.auth.id",
        fields: [
          {
            name: 'autor',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'postagem',
            type: 'relation',
            required: true,
            collectionId: postagens.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'corpo', type: 'text', required: true },
          { name: 'curtidas', type: 'number' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(comentarios)

      comentarios.fields.add(
        new RelationField({
          name: 'parent_id',
          collectionId: comentarios.id,
          maxSelect: 1,
          cascadeDelete: true,
        }),
      )
      app.save(comentarios)
    }
  },
  (app) => {
    try {
      const comentarios = app.findCollectionByNameOrId('comentarios')
      app.delete(comentarios)
    } catch (_) {}

    try {
      const postagens = app.findCollectionByNameOrId('postagens')
      postagens.fields.removeByName('pinned')
      app.save(postagens)
    } catch (_) {}

    try {
      const espacos = app.findCollectionByNameOrId('espacos')
      espacos.fields.removeByName('slug')
      espacos.fields.removeByName('descricao')
      app.save(espacos)
    } catch (_) {}
  },
)
