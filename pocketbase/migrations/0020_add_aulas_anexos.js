migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('aulas')
    col.fields.add(
      new FileField({
        name: 'anexos',
        maxSelect: 10,
        maxSize: 26214400,
        mimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/zip',
        ],
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('aulas')
    col.fields.removeByName('anexos')
    app.save(col)
  },
)
