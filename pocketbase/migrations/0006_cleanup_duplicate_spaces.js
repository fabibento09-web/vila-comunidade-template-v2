migrate(
  (app) => {
    const espacos = app.findRecordsByFilter('espacos', "id != ''", '', 10000, 0)
    const seenSlugs = new Map()

    for (const e of espacos) {
      const slug = e.getString('slug')
      if (!slug) continue

      if (!seenSlugs.has(slug)) {
        seenSlugs.set(slug, e)
      } else {
        const existing = seenSlugs.get(slug)
        if (new Date(e.getString('created')) < new Date(existing.getString('created'))) {
          app.delete(existing)
          seenSlugs.set(slug, e)
        } else {
          app.delete(e)
        }
      }
    }

    const ativos = app.findRecordsByFilter('espacos', "id != ''", '', 10000, 0)
    for (const e of ativos) {
      const nome = e.getString('nome')
      if (nome && nome.includes(':')) {
        e.set('nome', nome.replace(/:/g, '·'))
        app.save(e)
      }
    }
  },
  (app) => {},
)
