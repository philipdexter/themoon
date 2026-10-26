import { useMemo } from 'react'
import { calculateMoonData, type ObserverLocation } from '../astronomy/moonCalculations'

export function useMoonData(location: ObserverLocation | null, startTime: Date) {
  return useMemo(() => {
    if (!location) return null
    return calculateMoonData(startTime, location)
  }, [location, startTime])
}
