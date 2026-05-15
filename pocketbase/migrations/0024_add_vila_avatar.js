migrate(
  (app) => {
    const vilas = app.findCollectionByNameOrId('vilas')
    vilas.fields.add(
      new FileField({
        name: 'avatar',
        maxSelect: 1,
        maxSize: 2097152, // 2MB
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    )
    app.save(vilas)
  },
  (app) => {
    const vilas = app.findCollectionByNameOrId('vilas')
    vilas.fields.removeByName('avatar')
    app.save(vilas)
  },
)
