migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('vilas')

    if (col.fields.getByName('membros_count')) {
      col.fields.removeByName('membros_count')
    }
    if (col.fields.getByName('idade_anos')) {
      col.fields.removeByName('idade_anos')
    }
    if (!col.fields.getByName('cover')) {
      col.fields.add(
        new FileField({
          name: 'cover',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        }),
      )
    }

    col.updateRule = "@request.auth.id != ''"

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('vilas')

    if (col.fields.getByName('cover')) {
      col.fields.removeByName('cover')
    }
    if (!col.fields.getByName('membros_count')) {
      col.fields.add(new NumberField({ name: 'membros_count' }))
    }
    if (!col.fields.getByName('idade_anos')) {
      col.fields.add(new NumberField({ name: 'idade_anos' }))
    }

    col.updateRule = null

    app.save(col)
  },
)
