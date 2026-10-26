import { useCallback, useEffect, useState } from 'react'
import type { ObserverLocation } from '../astronomy/moonCalculations'

const STORAGE_KEY = 'moon-finder-location-v1'

export function geolocationErrorMessage(code: number, permissionDeniedCode = 1): string {
  return code === permissionDeniedCode
    ? 'Location access was declined. Your saved location is still available, or enter coordinates manually.'
    : 'Your location could not be determined. Enter coordinates manually.'
}

function savedLocation(): ObserverLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ObserverLocation
    if (
      Number.isFinite(parsed.latitude) && parsed.latitude >= -90 && parsed.latitude <= 90 &&
      Number.isFinite(parsed.longitude) && parsed.longitude >= -180 && parsed.longitude <= 180 &&
      Number.isFinite(parsed.elevation)
    ) {
      return { ...parsed, source: 'saved' }
    }
  } catch {
    // Storage can be unavailable in strict privacy modes.
  }
  return null
}

function persist(location: ObserverLocation) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location))
  } catch {
    // The application remains fully usable without persistence.
  }
}

export function useLocation() {
  const [location, setLocation] = useState<ObserverLocation | null>(() => savedLocation())
  const [status, setStatus] = useState<'idle' | 'requesting' | 'ready' | 'error'>(() =>
    savedLocation() ? 'ready' : 'idle',
  )
  const [error, setError] = useState<string | null>(null)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error')
      setError('Geolocation is not supported by this browser. Enter coordinates below.')
      return
    }
    setStatus('requesting')
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next: ObserverLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          elevation: position.coords.altitude ?? 0,
          source: 'geolocation',
        }
        setLocation(next)
        persist(next)
        setStatus('ready')
      },
      (geolocationError) => {
        setStatus(location ? 'ready' : 'error')
        setError(geolocationErrorMessage(geolocationError.code, geolocationError.PERMISSION_DENIED))
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5 * 60 * 1000 },
    )
  }, [location])

  const applyManualLocation = useCallback((next: ObserverLocation) => {
    const manual = { ...next, source: 'manual' as const }
    setLocation(manual)
    persist(manual)
    setError(null)
    setStatus('ready')
  }, [])

  useEffect(() => {
    requestLocation()
    // The first-visit request should run only once; explicit refreshes use the button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { location, status, error, requestLocation, applyManualLocation }
}
