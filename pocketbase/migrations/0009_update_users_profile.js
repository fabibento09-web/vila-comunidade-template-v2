migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    users.fields.add(new TextField({ name: 'bio', max: 200 }))
    users.fields.add(new TextField({ name: 'cidade', max: 80 }))
    users.fields.add(
      new FileField({
        name: 'cover',
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    )
    users.fields.add(new TextField({ name: 'website' }))
    users.fields.add(new TextField({ name: 'instagram' }))
    users.fields.add(new TextField({ name: 'twitter' }))

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('bio')
    users.fields.removeByName('cidade')
    users.fields.removeByName('cover')
    users.fields.removeByName('website')
    users.fields.removeByName('instagram')
    users.fields.removeByName('twitter')
    app.save(users)
  },
)
