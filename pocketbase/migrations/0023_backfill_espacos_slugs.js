migrate(
  (app) => {
    const records = app.findRecordsByFilter('espacos', "slug = ''", '', 10000, 0)

    const generateSlug = (name) => {
      return (name || 'espaco')
        .toString()
        .toLowerCase()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    }

    for (let record of records) {
      let baseSlug = generateSlug(record.get('nome'))
      let slug = baseSlug
      let counter = 1

      while (true) {
        try {
          const existing = app.findFirstRecordByData('espacos', 'slug', slug)
          if (existing.id === record.id) break
          slug = baseSlug + '-' + counter
          counter++
        } catch (_) {
          break
        }
      }

      record.set('slug', slug)
      app.save(record)
    }
  },
  (app) => {},
)
