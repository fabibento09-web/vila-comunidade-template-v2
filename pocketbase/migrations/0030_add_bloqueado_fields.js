migrate(
  (app) => {
    const espacoMembros = app.findCollectionByNameOrId('espaco_membros')
    espacoMembros.fields.add(new BoolField({ name: 'bloqueado' }))
    app.save(espacoMembros)

    const cursoMembros = app.findCollectionByNameOrId('curso_membros')
    cursoMembros.fields.add(new BoolField({ name: 'bloqueado' }))
    app.save(cursoMembros)
  },
  (app) => {
    const espacoMembros = app.findCollectionByNameOrId('espaco_membros')
    espacoMembros.fields.removeByName('bloqueado')
    app.save(espacoMembros)

    const cursoMembros = app.findCollectionByNameOrId('curso_membros')
    cursoMembros.fields.removeByName('bloqueado')
    app.save(cursoMembros)
  },
)
