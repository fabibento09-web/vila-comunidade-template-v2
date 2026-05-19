migrate(
  (app) => {
    // Ensure espaco_membros is fully created and configured correctly.
    // This resolves missing schema structures on fresh clones if prior
    // duplicate-prefixed migrations were skipped by the migration engine.
    let espaco_membros
    try {
      espaco_membros = app.findCollectionByNameOrId('espaco_membros')
    } catch (err) {
      const espacos = app.findCollectionByNameOrId('espacos')
      espaco_membros = new Collection({
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
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'espaco',
            type: 'relation',
            required: true,
            collectionId: espacos.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'bloqueado', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(espaco_membros)
      espaco_membros.addIndex('idx_espaco_membros_user_espaco', true, 'user,espaco', '')
      app.save(espaco_membros)
    }

    if (!espaco_membros.fields.getByName('bloqueado')) {
      espaco_membros.fields.add(new BoolField({ name: 'bloqueado' }))
      app.save(espaco_membros)
    }

    // Ensure curso_membros has the bloqueado field as well.
    let curso_membros
    try {
      curso_membros = app.findCollectionByNameOrId('curso_membros')
      if (!curso_membros.fields.getByName('bloqueado')) {
        curso_membros.fields.add(new BoolField({ name: 'bloqueado' }))
        app.save(curso_membros)
      }
    } catch (err) {}
  },
  (app) => {},
)
