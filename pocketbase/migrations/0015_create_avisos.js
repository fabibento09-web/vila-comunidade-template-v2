migrate(
  (app) => {
    const collection = new Collection({
      name: 'avisos',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: null,
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['comentario', 'resposta', 'espaco_adicionado', 'role_upgrade', 'convite_aceito'],
          maxSelect: 1,
        },
        {
          name: 'ator',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'postagem',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('postagens').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'comentario',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('comentarios').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'espaco',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('espacos').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'lido', type: 'bool', required: false },
        { name: 'texto', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_avisos_user_lido ON avisos (user, lido)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('avisos')
    app.delete(collection)
  },
)
