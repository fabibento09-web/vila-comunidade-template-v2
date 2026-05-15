migrate(
  (app) => {
    try {
      const users = app.findRecordsByFilter('_pb_users_auth_', '', 'created', 1, 0)
      if (users && users.length > 0) {
        const oldestUser = users[0]
        oldestUser.set('role', 'admin')
        app.save(oldestUser)
      }
    } catch (err) {
      console.log('Failed to restore admin user:', err)
    }

    try {
      const cursos = app.findRecordsByFilter('cursos', '', '', 1000, 0)
      if (cursos && cursos.length > 0) {
        for (const curso of cursos) {
          if (!curso.getBool('publicado')) {
            curso.set('publicado', true)
            app.save(curso)
          }
        }
      }
    } catch (err) {
      console.log('Failed to publish courses:', err)
    }
  },
  (app) => {
    // Revert intentionally left empty
  },
)
