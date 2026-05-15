migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('aula_progresso')
    col.listRule =
      "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'admin')"
    col.viewRule =
      "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'admin')"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('aula_progresso')
    col.listRule = "@request.auth.id != '' && user = @request.auth.id"
    col.viewRule = "@request.auth.id != '' && user = @request.auth.id"
    app.save(col)
  },
)
