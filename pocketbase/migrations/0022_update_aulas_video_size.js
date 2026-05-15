migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('aulas')
    const field = col.fields.getByName('video_file')
    if (field) {
      field.maxSize = 15728640
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('aulas')
    const field = col.fields.getByName('video_file')
    if (field) {
      field.maxSize = 104857600
      app.save(col)
    }
  },
)
