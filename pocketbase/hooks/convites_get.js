routerAdd('GET', '/backend/v1/convites/{token}', (e) => {
  const token = e.request.pathValue('token')
  try {
    const convite = $app.findFirstRecordByData('convites', 'token', token)
    $app.expandRecord(convite, ['target_espaco', 'criado_por'])
    return e.json(200, convite)
  } catch (err) {
    return e.notFoundError('Convite não encontrado')
  }
})
