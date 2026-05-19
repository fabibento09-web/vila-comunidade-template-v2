migrate(
  (app) => {
    // Update users with role
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'pro', 'membro'],
          maxSelect: 1,
        }),
      )
      app.save(users)
    }

    // Update espacos with tipo
    const espacos = app.findCollectionByNameOrId('espacos')
    if (!espacos.fields.getByName('tipo')) {
      espacos.fields.add(
        new SelectField({
          name: 'tipo',
          values: ['aberto', 'restrito', 'pago'],
          maxSelect: 1,
        }),
      )
      app.save(espacos)
    }

    // Create espaco_membros collection
    try {
      app.findCollectionByNameOrId('espaco_membros')
    } catch (_) {
      const espacoMembros = new Collection({
        name: 'espaco_membros',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'user',
            type: 'relation',
            collectionId: users.id,
            required: true,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'espaco',
            type: 'relation',
            collectionId: espacos.id,
            required: true,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_espaco_membros_user_espaco ON espaco_membros (user, espaco)',
        ],
      })
      app.save(espacoMembros)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('espaco_membros')
      app.delete(col)
    } catch (_) {}

    try {
      const espacos = app.findCollectionByNameOrId('espacos')
      espacos.fields.removeByName('tipo')
      app.save(espacos)
    } catch (_) {}

    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.fields.removeByName('role')
      app.save(users)
    } catch (_) {}
  },
)
