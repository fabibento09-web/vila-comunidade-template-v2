routerAdd('POST', '/backend/v1/convites/{token}/aceitar', (e) => {
  const token = e.request.pathValue('token')
  let convite
  try {
    convite = $app.findFirstRecordByData('convites', 'token', token)
  } catch (err) {
    return e.notFoundError('Convite não encontrado')
  }

  if (convite.getBool('usado')) {
    return e.badRequestError('Convite já usado')
  }

  const expStr = convite.getString('expira_em')
  if (expStr && new Date(expStr).getTime() < Date.now()) {
    return e.badRequestError('Convite expirado')
  }

  const role = convite.getString('role')
  const targetEspaco = convite.getString('target_espaco')
  const body = e.requestInfo().body || {}

  let userToLink

  if (e.auth) {
    userToLink = e.auth
    if (role === 'pro' && userToLink.getString('role') !== 'admin') {
      userToLink.set('role', 'pro')
      $app.save(userToLink)
    }
  } else {
    const name = body.name || ''
    const password = body.password || ''
    const email = convite.getString('email') || body.email || ''

    if (!email) {
      return e.badRequestError('O e-mail é obrigatório.', {
        email: new ValidationError('validation_required', 'O e-mail é obrigatório.'),
      })
    }
    if (!password || password.length < 6) {
      return e.badRequestError('A senha deve ter no mínimo 6 caracteres.', {
        password: new ValidationError(
          'validation_invalid_password',
          'A senha deve ter no mínimo 6 caracteres.',
        ),
      })
    }
    if (!name) {
      return e.badRequestError('O nome é obrigatório.', {
        name: new ValidationError('validation_required', 'O nome é obrigatório.'),
      })
    }

    try {
      const existingUser = $app.findAuthRecordByEmail('_pb_users_auth_', email)
      if (existingUser) {
        return e.badRequestError(
          'Usuário já existe com este email. Por favor, faça login primeiro.',
        )
      }
    } catch (_) {}

    const usersCol = $app.findCollectionByNameOrId('_pb_users_auth_')
    userToLink = new Record(usersCol)
    userToLink.setEmail(email)
    userToLink.setPassword(password)
    userToLink.setVerified(true)
    userToLink.set('name', name)
    userToLink.set('role', role)
    $app.save(userToLink)
  }

  if (targetEspaco) {
    try {
      $app.findFirstRecordByFilter('espaco_membros', 'user={:user} && espaco={:espaco}', {
        user: userToLink.id,
        espaco: targetEspaco,
      })
    } catch (_) {
      const emCol = $app.findCollectionByNameOrId('espaco_membros')
      const emRecord = new Record(emCol)
      emRecord.set('user', userToLink.id)
      emRecord.set('espaco', targetEspaco)
      $app.save(emRecord)
    }
  }

  convite.set('usado', true)
  $app.save(convite)

  const criadoPor = convite.getString('criado_por')
  if (criadoPor && criadoPor !== userToLink.id) {
    const avisosCol = $app.findCollectionByNameOrId('avisos')
    const aviso = new Record(avisosCol)
    aviso.set('user', criadoPor)
    aviso.set('ator', userToLink.id)
    aviso.set('tipo', 'convite_aceito')
    if (targetEspaco) {
      aviso.set('espaco', targetEspaco)
    }
    $app.save(aviso)
  }

  if (!e.auth) {
    try {
      const token = userToLink.newAuthToken()
      return e.json(200, { token, record: userToLink })
    } catch (err) {
      return e.internalServerError(
        'Falha ao gerar sessão. Tente fazer login com seu email e senha.',
      )
    }
  }

  return e.json(200, { success: true })
})
