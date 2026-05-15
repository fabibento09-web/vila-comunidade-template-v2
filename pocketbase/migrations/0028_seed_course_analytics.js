migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    let course
    try {
      const courses = app.findRecordsByFilter('cursos', '1=1', 'created', 1, 0)
      if (courses.length > 0) course = courses[0]
    } catch (e) {}

    if (!course) return

    let aulas
    try {
      aulas = app.findRecordsByFilter('aulas', `curso = '${course.id}'`, 'ordem', 10, 0)
    } catch (e) {}

    if (!aulas || aulas.length === 0) return

    const dummyUsers = [
      { email: 'student1@example.com', name: 'Alice Student' },
      { email: 'student2@example.com', name: 'Bob Student' },
      { email: 'student3@example.com', name: 'Charlie Student' },
    ]

    const createdUsers = []
    for (const du of dummyUsers) {
      try {
        createdUsers.push(app.findAuthRecordByEmail('_pb_users_auth_', du.email))
      } catch (_) {
        const rec = new Record(usersCol)
        rec.setEmail(du.email)
        rec.setPassword('Skip@Pass')
        rec.setVerified(true)
        rec.set('name', du.name)
        rec.set('role', 'membro')
        app.save(rec)
        createdUsers.push(rec)
      }
    }

    const progressoCol = app.findCollectionByNameOrId('aula_progresso')

    for (const aula of aulas) {
      try {
        app.findFirstRecordByFilter(
          'aula_progresso',
          `user = '${createdUsers[0].id}' && aula = '${aula.id}'`,
        )
      } catch (_) {
        const p = new Record(progressoCol)
        p.set('user', createdUsers[0].id)
        p.set('aula', aula.id)
        p.set('completou', true)
        app.save(p)
      }
    }

    if (aulas.length > 0) {
      try {
        app.findFirstRecordByFilter(
          'aula_progresso',
          `user = '${createdUsers[1].id}' && aula = '${aulas[0].id}'`,
        )
      } catch (_) {
        const p = new Record(progressoCol)
        p.set('user', createdUsers[1].id)
        p.set('aula', aulas[0].id)
        p.set('completou', true)
        app.save(p)

        app
          .db()
          .newQuery(
            `UPDATE aula_progresso SET updated = datetime('now', '-10 days') WHERE id = {:id}`,
          )
          .bind({ id: p.id })
          .execute()
      }
    }

    for (let i = 0; i < Math.floor(aulas.length / 2); i++) {
      try {
        app.findFirstRecordByFilter(
          'aula_progresso',
          `user = '${createdUsers[2].id}' && aula = '${aulas[i].id}'`,
        )
      } catch (_) {
        const p = new Record(progressoCol)
        p.set('user', createdUsers[2].id)
        p.set('aula', aulas[i].id)
        p.set('completou', true)
        app.save(p)
      }
    }
  },
  (app) => {},
)
