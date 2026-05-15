migrate(
  (app) => {
    const espacoMembros = app.findCollectionByNameOrId('espaco_membros')
    espacoMembros.createRule = "@request.auth.id != ''"
    espacoMembros.updateRule = "@request.auth.id != ''"
    espacoMembros.deleteRule = "@request.auth.id != ''"
    app.save(espacoMembros)

    const cursoMembros = app.findCollectionByNameOrId('curso_membros')
    cursoMembros.createRule = "@request.auth.id != ''"
    cursoMembros.updateRule = "@request.auth.id != ''"
    cursoMembros.deleteRule = "@request.auth.id != ''"
    app.save(cursoMembros)
  },
  (app) => {
    const espacoMembros = app.findCollectionByNameOrId('espaco_membros')
    espacoMembros.createRule = "@request.auth.role = 'admin'"
    espacoMembros.updateRule = "@request.auth.role = 'admin'"
    espacoMembros.deleteRule = "@request.auth.role = 'admin'"
    app.save(espacoMembros)

    const cursoMembros = app.findCollectionByNameOrId('curso_membros')
    cursoMembros.createRule = "@request.auth.role = 'admin'"
    cursoMembros.updateRule = "@request.auth.role = 'admin'"
    cursoMembros.deleteRule = "@request.auth.role = 'admin'"
    app.save(cursoMembros)
  },
)
