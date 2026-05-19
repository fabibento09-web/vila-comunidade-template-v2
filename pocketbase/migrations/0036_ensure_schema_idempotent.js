migrate(
  (app) => {
    // Idempotent schema synchronization. Ensures all collections and fields
    // exist and are correctly configured, without failing if they already exist.

    const createIfMissing = (name, type) => {
      let col
      try {
        col = app.findCollectionByNameOrId(name)
        return col
      } catch (_) {
        try {
          if (name === 'users') {
            col = app.findCollectionByNameOrId('_pb_users_auth_')
            return col
          }
        } catch (_) {}

        col = new Collection({
          name: name,
          type: type,
          fields: [],
        })
        if (type === 'base') {
          col.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
          col.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
        }
        app.save(col)
        return col
      }
    }

    createIfMissing('users', 'auth')
    createIfMissing('vilas', 'base')
    createIfMissing('espacos', 'base')
    createIfMissing('postagens', 'base')
    createIfMissing('comentarios', 'base')
    createIfMissing('convites', 'base')
    createIfMissing('salvos', 'base')
    createIfMissing('espaco_membros', 'base')
    createIfMissing('avisos', 'base')
    createIfMissing('uploads', 'base')
    createIfMissing('cursos', 'base')
    createIfMissing('modulos', 'base')
    createIfMissing('aulas', 'base')
    createIfMissing('aula_progresso', 'base')
    createIfMissing('curso_membros', 'base')
    createIfMissing('postagem_curtidas', 'base')

    const addField = (colName, field) => {
      const col = app.findCollectionByNameOrId(colName === 'users' ? '_pb_users_auth_' : colName)
      if (!col.fields.getByName(field.name)) {
        col.fields.add(field)
        app.save(col)
      }
    }

    // users
    addField('users', new TextField({ name: 'name' }))
    addField(
      'users',
      new FileField({
        name: 'avatar',
        maxSelect: 1,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    )
    addField('users', new TextField({ name: 'bio' }))
    addField('users', new TextField({ name: 'cidade' }))
    addField(
      'users',
      new FileField({
        name: 'cover',
        maxSelect: 1,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    )
    addField('users', new TextField({ name: 'website' }))
    addField('users', new TextField({ name: 'instagram' }))
    addField('users', new TextField({ name: 'twitter' }))
    addField(
      'users',
      new SelectField({ name: 'role', values: ['admin', 'pro', 'membro'], maxSelect: 1 }),
    )

    // vilas
    addField('vilas', new TextField({ name: 'nome', required: true }))
    addField('vilas', new TextField({ name: 'bio' }))
    addField('vilas', new TextField({ name: 'cidade' }))
    addField('vilas', new BoolField({ name: 'verificada' }))
    addField('vilas', new TextField({ name: 'status_dia' }))
    addField(
      'vilas',
      new FileField({
        name: 'cover',
        maxSelect: 1,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    )
    addField(
      'vilas',
      new FileField({
        name: 'avatar',
        maxSelect: 1,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    )

    // espacos
    addField('espacos', new TextField({ name: 'nome', required: true }))
    addField('espacos', new TextField({ name: 'emoji' }))
    addField('espacos', new NumberField({ name: 'nao_lidos' }))
    addField(
      'espacos',
      new RelationField({
        name: 'vila_id',
        collectionId: app.findCollectionByNameOrId('vilas').id,
        maxSelect: 1,
      }),
    )
    addField('espacos', new TextField({ name: 'slug' }))
    addField('espacos', new TextField({ name: 'descricao' }))
    addField(
      'espacos',
      new SelectField({ name: 'tipo', values: ['aberto', 'restrito', 'pago'], maxSelect: 1 }),
    )

    // postagens
    addField('postagens', new TextField({ name: 'titulo', required: true }))
    addField('postagens', new TextField({ name: 'corpo', required: true }))
    addField('postagens', new URLField({ name: 'cover_url' }))
    addField(
      'postagens',
      new RelationField({ name: 'autor', collectionId: '_pb_users_auth_', maxSelect: 1 }),
    )
    addField(
      'postagens',
      new RelationField({
        name: 'espaco',
        collectionId: app.findCollectionByNameOrId('espacos').id,
        maxSelect: 1,
      }),
    )
    addField('postagens', new DateField({ name: 'publicado_em' }))
    addField('postagens', new NumberField({ name: 'curtidas' }))
    addField('postagens', new NumberField({ name: 'comentarios' }))
    addField('postagens', new NumberField({ name: 'min_leitura' }))
    addField('postagens', new BoolField({ name: 'pinned' }))
    addField(
      'postagens',
      new SelectField({
        name: 'status',
        values: ['rascunho', 'agendado', 'publicado'],
        maxSelect: 1,
      }),
    )
    addField('postagens', new DateField({ name: 'agendado_para' }))
    addField(
      'postagens',
      new SelectField({ name: 'visibility', values: ['todos', 'pro'], maxSelect: 1 }),
    )
    addField(
      'postagens',
      new FileField({
        name: 'cover',
        maxSelect: 1,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      }),
    )

    // comentarios
    addField(
      'comentarios',
      new RelationField({
        name: 'autor',
        collectionId: '_pb_users_auth_',
        required: true,
        maxSelect: 1,
      }),
    )
    addField(
      'comentarios',
      new RelationField({
        name: 'postagem',
        collectionId: app.findCollectionByNameOrId('postagens').id,
        required: true,
        maxSelect: 1,
      }),
    )
    addField('comentarios', new TextField({ name: 'corpo', required: true }))
    addField('comentarios', new NumberField({ name: 'curtidas' }))
    addField(
      'comentarios',
      new RelationField({
        name: 'parent_id',
        collectionId: app.findCollectionByNameOrId('comentarios').id,
        maxSelect: 1,
      }),
    )

    // convites
    addField('convites', new EmailField({ name: 'email' }))
    addField(
      'convites',
      new SelectField({ name: 'role', values: ['membro', 'pro'], required: true, maxSelect: 1 }),
    )
    addField('convites', new TextField({ name: 'token', required: true }))
    addField('convites', new BoolField({ name: 'usado' }))
    addField('convites', new DateField({ name: 'expira_em' }))
    addField(
      'convites',
      new RelationField({ name: 'criado_por', collectionId: '_pb_users_auth_', maxSelect: 1 }),
    )
    addField('convites', new TextField({ name: 'mensagem' }))
    addField(
      'convites',
      new RelationField({
        name: 'target_espaco',
        collectionId: app.findCollectionByNameOrId('espacos').id,
        maxSelect: 1,
      }),
    )

    // salvos
    addField(
      'salvos',
      new RelationField({
        name: 'user',
        collectionId: '_pb_users_auth_',
        required: true,
        maxSelect: 1,
      }),
    )
    addField(
      'salvos',
      new RelationField({
        name: 'postagem',
        collectionId: app.findCollectionByNameOrId('postagens').id,
        required: true,
        maxSelect: 1,
      }),
    )

    // espaco_membros
    addField(
      'espaco_membros',
      new RelationField({
        name: 'user',
        collectionId: '_pb_users_auth_',
        required: true,
        maxSelect: 1,
      }),
    )
    addField(
      'espaco_membros',
      new RelationField({
        name: 'espaco',
        collectionId: app.findCollectionByNameOrId('espacos').id,
        required: true,
        maxSelect: 1,
      }),
    )
    addField('espaco_membros', new BoolField({ name: 'bloqueado' }))

    // avisos
    addField(
      'avisos',
      new RelationField({
        name: 'user',
        collectionId: '_pb_users_auth_',
        required: true,
        maxSelect: 1,
      }),
    )
    addField(
      'avisos',
      new SelectField({
        name: 'tipo',
        values: ['comentario', 'resposta', 'espaco_adicionado', 'role_upgrade', 'convite_aceito'],
        required: true,
        maxSelect: 1,
      }),
    )
    addField(
      'avisos',
      new RelationField({ name: 'ator', collectionId: '_pb_users_auth_', maxSelect: 1 }),
    )
    addField(
      'avisos',
      new RelationField({
        name: 'postagem',
        collectionId: app.findCollectionByNameOrId('postagens').id,
        maxSelect: 1,
      }),
    )
    addField(
      'avisos',
      new RelationField({
        name: 'comentario',
        collectionId: app.findCollectionByNameOrId('comentarios').id,
        maxSelect: 1,
      }),
    )
    addField(
      'avisos',
      new RelationField({
        name: 'espaco',
        collectionId: app.findCollectionByNameOrId('espacos').id,
        maxSelect: 1,
      }),
    )
    addField('avisos', new BoolField({ name: 'lido' }))
    addField('avisos', new TextField({ name: 'texto' }))

    // uploads
    addField(
      'uploads',
      new RelationField({
        name: 'user',
        collectionId: '_pb_users_auth_',
        required: true,
        maxSelect: 1,
      }),
    )
    addField(
      'uploads',
      new FileField({
        name: 'file',
        required: true,
        maxSelect: 1,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
      }),
    )
    addField('uploads', new TextField({ name: 'context' }))

    // cursos
    addField('cursos', new TextField({ name: 'titulo', required: true }))
    addField('cursos', new TextField({ name: 'slug', required: true }))
    addField('cursos', new EditorField({ name: 'descricao' }))
    addField('cursos', new TextField({ name: 'tagline' }))
    addField(
      'cursos',
      new FileField({
        name: 'cover',
        maxSelect: 1,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    )
    addField(
      'cursos',
      new RelationField({ name: 'autor', collectionId: '_pb_users_auth_', maxSelect: 1 }),
    )
    addField(
      'cursos',
      new SelectField({
        name: 'tipo',
        values: ['free', 'pago', 'pro'],
        required: true,
        maxSelect: 1,
      }),
    )
    addField('cursos', new NumberField({ name: 'ordem' }))
    addField('cursos', new BoolField({ name: 'publicado' }))

    // modulos
    addField('modulos', new TextField({ name: 'titulo', required: true }))
    addField(
      'modulos',
      new RelationField({
        name: 'curso',
        collectionId: app.findCollectionByNameOrId('cursos').id,
        required: true,
        maxSelect: 1,
      }),
    )
    addField('modulos', new NumberField({ name: 'ordem' }))

    // aulas
    addField('aulas', new TextField({ name: 'titulo', required: true }))
    addField('aulas', new TextField({ name: 'slug', required: true }))
    addField(
      'aulas',
      new RelationField({
        name: 'modulo',
        collectionId: app.findCollectionByNameOrId('modulos').id,
        required: true,
        maxSelect: 1,
      }),
    )
    addField(
      'aulas',
      new RelationField({
        name: 'curso',
        collectionId: app.findCollectionByNameOrId('cursos').id,
        required: true,
        maxSelect: 1,
      }),
    )
    addField('aulas', new URLField({ name: 'video_url' }))
    addField('aulas', new EditorField({ name: 'descricao' }))
    addField('aulas', new NumberField({ name: 'duracao_min' }))
    addField('aulas', new NumberField({ name: 'ordem' }))
    addField('aulas', new FileField({ name: 'anexos', maxSelect: 10 }))
    addField(
      'aulas',
      new FileField({
        name: 'video_file',
        maxSelect: 1,
        mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/x-msvideo'],
      }),
    )

    // aula_progresso
    addField(
      'aula_progresso',
      new RelationField({
        name: 'user',
        collectionId: '_pb_users_auth_',
        required: true,
        maxSelect: 1,
      }),
    )
    addField(
      'aula_progresso',
      new RelationField({
        name: 'aula',
        collectionId: app.findCollectionByNameOrId('aulas').id,
        required: true,
        maxSelect: 1,
      }),
    )
    addField('aula_progresso', new BoolField({ name: 'completou' }))

    // curso_membros
    addField(
      'curso_membros',
      new RelationField({
        name: 'user',
        collectionId: '_pb_users_auth_',
        required: true,
        maxSelect: 1,
      }),
    )
    addField(
      'curso_membros',
      new RelationField({
        name: 'curso',
        collectionId: app.findCollectionByNameOrId('cursos').id,
        required: true,
        maxSelect: 1,
      }),
    )
    addField('curso_membros', new BoolField({ name: 'bloqueado' }))

    // postagem_curtidas
    addField(
      'postagem_curtidas',
      new RelationField({
        name: 'user',
        collectionId: '_pb_users_auth_',
        required: true,
        maxSelect: 1,
      }),
    )
    addField(
      'postagem_curtidas',
      new RelationField({
        name: 'postagem',
        collectionId: app.findCollectionByNameOrId('postagens').id,
        required: true,
        maxSelect: 1,
      }),
    )

    // Set the correct rules for all collections
    const rules = {
      _pb_users_auth_: {
        list: "@request.auth.id != ''",
        view: "@request.auth.id != ''",
        create: '',
        update: "id = @request.auth.id || @request.auth.role = 'admin'",
        delete: "@request.auth.role = 'admin'",
      },
      vilas: {
        list: '',
        view: '',
        create: "@request.auth.role = 'admin'",
        update: "@request.auth.id != ''",
        delete: null,
      },
      espacos: {
        list: '',
        view: '',
        create: "@request.auth.role = 'admin' || @request.auth.role = 'pro'",
        update: "@request.auth.role = 'admin'",
        delete: "@request.auth.role = 'admin'",
      },
      postagens: {
        list: '',
        view: '',
        create: "@request.auth.id != ''",
        update: "autor = @request.auth.id || @request.auth.role = 'admin'",
        delete: "autor = @request.auth.id || @request.auth.role = 'admin'",
      },
      comentarios: {
        list: '',
        view: '',
        create: "@request.auth.id != ''",
        update: "autor = @request.auth.id || @request.auth.role = 'admin'",
        delete: "autor = @request.auth.id || @request.auth.role = 'admin'",
      },
      convites: {
        list: "@request.auth.role = 'admin' || @request.auth.role = 'pro'",
        view: "@request.auth.role = 'admin' || @request.auth.role = 'pro'",
        create: "@request.auth.role = 'admin' || @request.auth.role = 'pro'",
        update: "@request.auth.role = 'admin'",
        delete: "@request.auth.role = 'admin'",
      },
      salvos: {
        list: "@request.auth.id != '' && user = @request.auth.id",
        view: "@request.auth.id != '' && user = @request.auth.id",
        create: "@request.auth.id != '' && user = @request.auth.id",
        update: "@request.auth.id != '' && user = @request.auth.id",
        delete: "@request.auth.id != '' && user = @request.auth.id",
      },
      espaco_membros: {
        list: "@request.auth.id != ''",
        view: "@request.auth.id != ''",
        create: "@request.auth.id != ''",
        update: "@request.auth.id != ''",
        delete: "@request.auth.id != ''",
      },
      avisos: {
        list: "@request.auth.id != '' && user = @request.auth.id",
        view: "@request.auth.id != '' && user = @request.auth.id",
        create: null,
        update: "@request.auth.id != '' && user = @request.auth.id",
        delete: "@request.auth.id != '' && user = @request.auth.id",
      },
      uploads: {
        list: "@request.auth.id != '' && user = @request.auth.id",
        view: "@request.auth.id != ''",
        create: "@request.auth.id != '' && user = @request.auth.id",
        update: null,
        delete: "@request.auth.id != '' && user = @request.auth.id",
      },
      cursos: {
        list: '',
        view: '',
        create: "@request.auth.role = 'admin'",
        update: "@request.auth.role = 'admin'",
        delete: "@request.auth.role = 'admin'",
      },
      modulos: {
        list: '',
        view: '',
        create: "@request.auth.role = 'admin'",
        update: "@request.auth.role = 'admin'",
        delete: "@request.auth.role = 'admin'",
      },
      aulas: {
        list: '',
        view: '',
        create: "@request.auth.role = 'admin'",
        update: "@request.auth.role = 'admin'",
        delete: "@request.auth.role = 'admin'",
      },
      aula_progresso: {
        list: "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'admin')",
        view: "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'admin')",
        create: "@request.auth.id != ''",
        update: "@request.auth.id != '' && user = @request.auth.id",
        delete: "@request.auth.id != '' && user = @request.auth.id",
      },
      curso_membros: {
        list: "@request.auth.id != ''",
        view: "@request.auth.id != ''",
        create: "@request.auth.id != ''",
        update: "@request.auth.id != ''",
        delete: "@request.auth.id != ''",
      },
      postagem_curtidas: {
        list: "@request.auth.id != ''",
        view: "@request.auth.id != ''",
        create: "@request.auth.id != '' && user = @request.auth.id",
        update: "@request.auth.id != '' && user = @request.auth.id",
        delete: "@request.auth.id != '' && user = @request.auth.id",
      },
    }

    for (const [name, ruleSet] of Object.entries(rules)) {
      try {
        const col = app.findCollectionByNameOrId(name)
        col.listRule = ruleSet.list
        col.viewRule = ruleSet.view
        col.createRule = ruleSet.create
        col.updateRule = ruleSet.update
        col.deleteRule = ruleSet.delete
        app.save(col)
      } catch (_) {}
    }

    // Idempotently add unique indexes
    const indexCalls = [
      {
        col: '_pb_users_auth_',
        name: 'idx_email__pb_users_auth_',
        expr: "CREATE UNIQUE INDEX `idx_email__pb_users_auth_` ON `users` (`email`) WHERE `email` != ''",
        cols: 'email',
      },
      {
        col: 'convites',
        name: 'idx_convites_token',
        expr: 'CREATE UNIQUE INDEX idx_convites_token ON convites (token)',
        cols: 'token',
      },
      {
        col: 'salvos',
        name: 'idx_salvos_user_postagem',
        expr: 'CREATE UNIQUE INDEX idx_salvos_user_postagem ON salvos (user, postagem)',
        cols: 'user,postagem',
      },
      {
        col: 'espaco_membros',
        name: 'idx_espaco_membros_user_espaco',
        expr: 'CREATE UNIQUE INDEX idx_espaco_membros_user_espaco ON espaco_membros (user, espaco)',
        cols: 'user,espaco',
      },
      {
        col: 'cursos',
        name: 'idx_cursos_slug',
        expr: 'CREATE UNIQUE INDEX idx_cursos_slug ON cursos (slug)',
        cols: 'slug',
      },
      {
        col: 'aulas',
        name: 'idx_aulas_slug',
        expr: 'CREATE UNIQUE INDEX idx_aulas_slug ON aulas (slug)',
        cols: 'slug',
      },
      {
        col: 'aula_progresso',
        name: 'idx_aula_progresso_user_aula',
        expr: 'CREATE UNIQUE INDEX idx_aula_progresso_user_aula ON aula_progresso (user, aula)',
        cols: 'user,aula',
      },
      {
        col: 'curso_membros',
        name: 'idx_curso_membros_user_curso',
        expr: 'CREATE UNIQUE INDEX idx_curso_membros_user_curso ON curso_membros (user, curso)',
        cols: 'user,curso',
      },
      {
        col: 'postagem_curtidas',
        name: 'idx_postagem_curtidas_user_postagem',
        expr: 'CREATE UNIQUE INDEX idx_postagem_curtidas_user_postagem ON postagem_curtidas (user, postagem)',
        cols: 'user,postagem',
      },
    ]

    for (const idx of indexCalls) {
      try {
        const col = app.findCollectionByNameOrId(idx.col)
        const existing = app.tableIndexes(col.name)
        if (!existing || !existing[idx.name]) {
          if (idx.cols.includes(',')) {
            const parts = idx.cols.split(',')
            app
              .db()
              .newQuery(
                `DELETE FROM ${col.name} WHERE id NOT IN (SELECT MIN(id) FROM ${col.name} GROUP BY ${parts[0]}, ${parts[1]}) AND ${parts[0]} IS NOT NULL AND ${parts[1]} IS NOT NULL`,
              )
              .execute()
          } else {
            app
              .db()
              .newQuery(
                `DELETE FROM ${col.name} WHERE id NOT IN (SELECT MIN(id) FROM ${col.name} GROUP BY ${idx.cols}) AND ${idx.cols} IS NOT NULL AND ${idx.cols} != ''`,
              )
              .execute()
          }
          col.addIndex(idx.name, true, idx.cols, '')
          app.save(col)
        }
      } catch (_) {}
    }

    // Non-unique indexes
    const nonUniqueIndexCalls = [
      {
        col: 'avisos',
        name: 'idx_avisos_user_lido',
        expr: 'CREATE INDEX idx_avisos_user_lido ON avisos (user, lido)',
        cols: 'user,lido',
      },
    ]

    for (const idx of nonUniqueIndexCalls) {
      try {
        const col = app.findCollectionByNameOrId(idx.col)
        const existing = app.tableIndexes(col.name)
        if (!existing || !existing[idx.name]) {
          col.addIndex(idx.name, false, idx.cols, '')
          app.save(col)
        }
      } catch (_) {}
    }
  },
  (app) => {},
)
