migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'demo@vila.com')
      return // already seeded
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('demo@vila.com')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Visitante Demo')
    record.set('role', 'membro')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'demo@vila.com')
      app.delete(record)
    } catch (_) {}
  },
)
