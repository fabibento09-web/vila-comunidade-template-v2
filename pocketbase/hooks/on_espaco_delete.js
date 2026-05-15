onRecordAfterDeleteSuccess((e) => {
  const espacoId = e.record.id

  try {
    const membros = $app.findRecordsByFilter('espaco_membros', `espaco = {:id}`, '', 0, 0, {
      id: espacoId,
    })
    for (const m of membros) {
      $app.delete(m)
    }
  } catch (_) {}

  try {
    const postagens = $app.findRecordsByFilter('postagens', `espaco = {:id}`, '', 0, 0, {
      id: espacoId,
    })
    for (const p of postagens) {
      const pId = p.id

      try {
        const comentarios = $app.findRecordsByFilter('comentarios', `postagem = {:id}`, '', 0, 0, {
          id: pId,
        })
        for (const c of comentarios) {
          $app.delete(c)
        }
      } catch (_) {}

      try {
        const salvos = $app.findRecordsByFilter('salvos', `postagem = {:id}`, '', 0, 0, { id: pId })
        for (const s of salvos) {
          $app.delete(s)
        }
      } catch (_) {}

      try {
        const avisosP = $app.findRecordsByFilter('avisos', `postagem = {:id}`, '', 0, 0, {
          id: pId,
        })
        for (const a of avisosP) {
          $app.delete(a)
        }
      } catch (_) {}

      $app.delete(p)
    }
  } catch (_) {}

  try {
    const avisosE = $app.findRecordsByFilter('avisos', `espaco = {:id}`, '', 0, 0, { id: espacoId })
    for (const a of avisosE) {
      $app.delete(a)
    }
  } catch (_) {}

  e.next()
}, 'espacos')
