migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({ name: 'role', values: ['admin', 'pro', 'membro'], maxSelect: 1 }),
      )
    }
    app.save(users)

    const espacos = app.findCollectionByNameOrId('espacos')
    if (!espacos.fields.getByName('tipo')) {
      espacos.fields.add(
        new SelectField({ name: 'tipo', values: ['aberto', 'restrito', 'pago'], maxSelect: 1 }),
      )
    }
    espacos.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'pro'"
    espacos.updateRule = "@request.auth.role = 'admin'"
    espacos.deleteRule = "@request.auth.role = 'admin'"
    app.save(espacos)

    let espaco_membros
    try {
      espaco_membros = app.findCollectionByNameOrId('espaco_membros')
    } catch (err) {
      espaco_membros = new Collection({
        name: 'espaco_membros',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: users.id,
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
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_espaco_membros_user_espaco ON espaco_membros (user, espaco)',
        ],
      })
      app.save(espaco_membros)
    }

    const vilas = app.findCollectionByNameOrId('vilas')
    vilas.createRule = "@request.auth.role = 'admin'"
    vilas.updateRule = "@request.auth.role = 'admin'"
    app.save(vilas)

    const postagens = app.findCollectionByNameOrId('postagens')
    postagens.updateRule = "autor = @request.auth.id || @request.auth.role = 'admin'"
    postagens.deleteRule = "autor = @request.auth.id || @request.auth.role = 'admin'"
    app.save(postagens)

    const comentarios = app.findCollectionByNameOrId('comentarios')
    comentarios.updateRule = "autor = @request.auth.id || @request.auth.role = 'admin'"
    comentarios.deleteRule = "autor = @request.auth.id || @request.auth.role = 'admin'"
    app.save(comentarios)

    const convites = app.findCollectionByNameOrId('convites')
    convites.listRule = "@request.auth.role = 'admin' || @request.auth.role = 'pro'"
    convites.viewRule = "@request.auth.role = 'admin' || @request.auth.role = 'pro'"
    convites.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'pro'"
    convites.updateRule = "@request.auth.role = 'admin'"
    convites.deleteRule = "@request.auth.role = 'admin'"
    app.save(convites)

    const salvos = app.findCollectionByNameOrId('salvos')
    salvos.listRule = "@request.auth.id != '' && user = @request.auth.id"
    salvos.viewRule = "@request.auth.id != '' && user = @request.auth.id"
    salvos.createRule = "@request.auth.id != '' && user = @request.auth.id"
    salvos.updateRule = "@request.auth.id != '' && user = @request.auth.id"
    salvos.deleteRule = "@request.auth.id != '' && user = @request.auth.id"
    app.save(salvos)

    try {
      app
        .db()
        .newQuery("UPDATE users SET role = 'membro' WHERE role IS NULL OR role = ''")
        .execute()
      app
        .db()
        .newQuery(
          "UPDATE users SET role = 'admin' WHERE id = (SELECT id FROM users ORDER BY created ASC LIMIT 1)",
        )
        .execute()
      app
        .db()
        .newQuery("UPDATE espacos SET tipo = 'aberto' WHERE tipo IS NULL OR tipo = ''")
        .execute()
    } catch (err) {
      console.log(err)
    }
  },
  (app) => {},
)
