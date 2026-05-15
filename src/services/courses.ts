import pb from '@/lib/pocketbase/client'

export const getCursos = async (includeUnpublished = false) => {
  return pb.collection('cursos').getFullList({
    filter: includeUnpublished ? '' : 'publicado = true',
    sort: 'ordem,-created',
    expand: 'autor',
  })
}

export const getCursoBySlug = async (slug: string) => {
  return pb.collection('cursos').getFirstListItem(`slug = "${slug}"`, {
    expand: 'autor',
  })
}

export const getModulosByCurso = async (cursoId: string) => {
  return pb.collection('modulos').getFullList({
    filter: `curso = "${cursoId}"`,
    sort: 'ordem',
  })
}

export const getAulasByCurso = async (cursoId: string) => {
  return pb.collection('aulas').getFullList({
    filter: `curso = "${cursoId}"`,
    sort: 'ordem',
    expand: 'modulo',
  })
}

export const getAulaBySlug = async (slug: string) => {
  return pb.collection('aulas').getFirstListItem(`slug = "${slug}"`, {
    expand: 'curso,modulo',
  })
}

export const getCourseAnalytics = async (cursoId: string) => {
  return pb.collection('aula_progresso').getFullList({
    filter: `aula.curso = "${cursoId}"`,
    expand: 'aula,user',
  })
}

export const getProgressoCurso = async (userId: string, cursoId: string) => {
  const progresso = await pb.collection('aula_progresso').getFullList({
    filter: `user = "${userId}" && completou = true`,
    expand: 'aula',
  })

  return progresso.filter((p) => p.expand?.aula?.curso === cursoId)
}

export const toggleAulaProgresso = async (userId: string, aulaId: string, completou: boolean) => {
  try {
    const existing = await pb
      .collection('aula_progresso')
      .getFirstListItem(`user = "${userId}" && aula = "${aulaId}"`)
    return await pb.collection('aula_progresso').update(existing.id, { completou })
  } catch (err) {
    return await pb.collection('aula_progresso').create({
      user: userId,
      aula: aulaId,
      completou,
    })
  }
}

export const createCurso = async (data: any) => {
  return pb.collection('cursos').create(data)
}

export const updateCurso = async (id: string, data: any) => {
  return pb.collection('cursos').update(id, data)
}

export const deleteCurso = async (id: string) => {
  return pb.collection('cursos').delete(id)
}

export const createModulo = async (data: any) => {
  return pb.collection('modulos').create(data)
}

export const updateModulo = async (id: string, data: any) => {
  return pb.collection('modulos').update(id, data)
}

export const deleteModulo = async (id: string) => {
  return pb.collection('modulos').delete(id)
}

export const createAula = async (data: any) => {
  return pb.collection('aulas').create(data)
}

export const updateAula = async (id: string, data: any) => {
  return pb.collection('aulas').update(id, data)
}

export const deleteAula = async (id: string) => {
  return pb.collection('aulas').delete(id)
}
