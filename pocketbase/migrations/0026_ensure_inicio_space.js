migrate(
  (app) => {
    const espacos = app.findCollectionByNameOrId('espacos')

    try {
      app.findFirstRecordByData('espacos', 'slug', 'inicio')
      return // already exists
    } catch (_) {}

    const record = new Record(espacos)
    record.set('nome', 'Início')
    record.set('slug', 'inicio')
    record.set('emoji', '🏠')
    record.set('descricao', 'Postagens gerais da comunidade.')
    record.set('tipo', 'aberto')

    try {
      const vila = app.findFirstRecordByFilter('vilas', "id != ''")
      record.set('vila_id', vila.id)
    } catch (_) {}

    app.save(record)
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('espacos', 'slug', 'inicio')
      app.delete(record)
    } catch (_) {}
  },
)
