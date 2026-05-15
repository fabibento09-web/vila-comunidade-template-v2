migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.updateRule = "id = @request.auth.id || @request.auth.role = 'admin'"
    users.deleteRule = "@request.auth.role = 'admin'"
    app.save(users)

    const convites = app.findCollectionByNameOrId('convites')
    if (!convites.fields.getByName('target_espaco')) {
      convites.fields.add(
        new RelationField({
          name: 'target_espaco',
          collectionId: app.findCollectionByNameOrId('espacos').id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
      app.save(convites)
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.updateRule = 'id = @request.auth.id'
    users.deleteRule = 'id = @request.auth.id'
    app.save(users)

    const convites = app.findCollectionByNameOrId('convites')
    const field = convites.fields.getByName('target_espaco')
    if (field) {
      convites.fields.removeByName('target_espaco')
      app.save(convites)
    }
  },
)
