migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('aulas')
    col.fields.add(
      new FileField({
        name: 'video_file',
        maxSelect: 1,
        maxSize: 104857600, // 100MB
        mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/x-msvideo'],
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('aulas')
    col.fields.removeByName('video_file')
    app.save(col)
  },
)
