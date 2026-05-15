onRecordCreate((e) => {
  const role = e.record.getString('role')
  if (!role) {
    const count = $app.countRecords('users')
    if (count === 0) {
      e.record.set('role', 'admin')
    } else {
      e.record.set('role', 'membro')
    }
  }
  e.next()
}, 'users')
