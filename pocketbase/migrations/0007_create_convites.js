migrate(
  (app) => {
    const collection = new Collection({
      name: 'convites',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'email', type: 'email', required: false },
        { name: 'role', type: 'select', values: ['membro', 'pro'], required: true, maxSelect: 1 },
        { name: 'token', type: 'text', required: true },
        { name: 'usado', type: 'bool', required: false },
        { name: 'expira_em', type: 'date', required: false },
        {
          name: 'criado_por',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'mensagem', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_convites_token ON convites (token)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('convites')
    app.delete(collection)
  },
)
