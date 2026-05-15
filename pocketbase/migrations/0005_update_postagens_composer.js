migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('postagens')

    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['rascunho', 'agendado', 'publicado'],
        maxSelect: 1,
      }),
    )

    col.fields.add(
      new DateField({
        name: 'agendado_para',
      }),
    )

    col.fields.add(
      new SelectField({
        name: 'visibility',
        values: ['todos', 'pro'],
        maxSelect: 1,
      }),
    )

    col.fields.add(
      new FileField({
        name: 'cover',
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      }),
    )

    app.save(col)

    app
      .db()
      .newQuery(
        "UPDATE postagens SET status = 'publicado', visibility = 'todos' WHERE status IS NULL OR status = ''",
      )
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('postagens')
    col.fields.removeByName('status')
    col.fields.removeByName('agendado_para')
    col.fields.removeByName('visibility')
    col.fields.removeByName('cover')
    app.save(col)
  },
)
