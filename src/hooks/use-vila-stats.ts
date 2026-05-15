import { useState, useEffect } from 'react'
import { differenceInMonths, differenceInYears } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export function useVilaStats(vilaId?: string) {
  const [memberCount, setMemberCount] = useState(0)
  const [ageLabel, setAgeLabel] = useState('')

  const loadStats = async () => {
    try {
      const users = await pb.collection('users').getList(1, 1)
      setMemberCount(users.totalItems)

      if (vilaId) {
        const vila = await pb.collection('vilas').getOne(vilaId)
        const created = new Date(vila.created)
        const months = differenceInMonths(new Date(), created)
        const years = differenceInYears(new Date(), created)

        let label = ''
        if (years >= 1) {
          label = `há ${years} ${years === 1 ? 'ano' : 'anos'}`
        } else if (months >= 1) {
          label = `há ${months} ${months === 1 ? 'mês' : 'meses'}`
        } else {
          label = 'há poucos dias'
        }
        setAgeLabel(label)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadStats()
  }, [vilaId])

  useRealtime('users', () => {
    loadStats()
  })

  return { memberCount, ageLabel }
}
