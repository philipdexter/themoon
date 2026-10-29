import { useCallback, useEffect, useRef, useState } from 'react'
import { orientationToViewDirection, smoothHeading } from '../sensors/orientationMath'

export type CompassStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'unsupported'
  | 'unavailable'
  | 'error'

export interface CompassReading {
  heading: number
  altitude: number
  accuracy: number | null
  source: 'absolute' | 'webkit'
}

interface CompassOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number
  webkitCompassAccuracy?: number
}

type OrientationEventConstructor = typeof DeviceOrientationEvent & {
  requestPermission?: (absolute?: boolean) => Promise<'granted' | 'denied'>
}

const SENSOR_TIMEOUT_MS = 3500
const SMOOTHING = 0.22

export function useCompassGuide() {
  const [status, setStatus] = useState<CompassStatus>('idle')
  const [reading, setReading] = useState<CompassReading | null>(null)
  const cleanupRef = useRef<() => void>(() => undefined)
  const sessionRef = useRef(0)

  const stop = useCallback(() => {
    sessionRef.current += 1
    cleanupRef.current()
    cleanupRef.current = () => undefined
    setReading(null)
    setStatus('idle')
  }, [])

  const start = useCallback(async () => {
    const session = ++sessionRef.current
    cleanupRef.current()
    setReading(null)
    setStatus('requesting')

    if (!window.isSecureContext) {
      setStatus('unsupported')
      return
    }
    if (!('DeviceOrientationEvent' in window)) {
      setStatus('unsupported')
      return
    }

    const OrientationEvent = window.DeviceOrientationEvent as OrientationEventConstructor
    try {
      if (typeof OrientationEvent.requestPermission === 'function') {
        // Older Safari exposes a zero-argument form; the current standard uses
        // `true` to include permission for absolute/magnetometer orientation.
        const permission = OrientationEvent.requestPermission.length === 0
          ? await OrientationEvent.requestPermission()
          : await OrientationEvent.requestPermission(true)
        if (permission !== 'granted') {
          if (session !== sessionRef.current) return
          setStatus('denied')
          return
        }
      }
    } catch {
      if (session !== sessionRef.current) return
      setStatus('error')
      return
    }
    if (session !== sessionRef.current) return

    let animationFrame = 0
    let timeout = 0
    let previousHeading: number | null = null
    let previousAltitude: number | null = null
    let latest: CompassReading | null = null
    let receivedAbsoluteEvent = false

    const publish = () => {
      animationFrame = 0
      if (!latest) return
      const nextHeading = previousHeading === null
        ? latest.heading
        : smoothHeading(previousHeading, latest.heading, SMOOTHING)
      const nextAltitude = previousAltitude === null
        ? latest.altitude
        : previousAltitude + (latest.altitude - previousAltitude) * SMOOTHING
      previousHeading = nextHeading
      previousAltitude = nextAltitude
      setReading({ ...latest, heading: nextHeading, altitude: nextAltitude })
      setStatus('active')
    }

    const accept = (event: CompassOrientationEvent, forceAbsolute = false) => {
      if (!forceAbsolute && receivedAbsoluteEvent) return
      if (event.alpha === null || event.beta === null || event.gamma === null) return

      const webkitHeading = event.webkitCompassHeading
      const isWebkit = Number.isFinite(webkitHeading)
      if (!forceAbsolute && !event.absolute && !isWebkit) return
      if (forceAbsolute) receivedAbsoluteEvent = true

      const view = orientationToViewDirection(event.alpha, event.beta, event.gamma)
      const heading = isWebkit ? webkitHeading! : view.heading
      // A sightline near vertical has no meaningful horizontal heading. Retain
      // the last stable value rather than letting sensor noise spin the guide.
      const stableHeading = view.horizontalStrength < 0.08 && previousHeading !== null
        ? previousHeading
        : heading

      latest = {
        heading: stableHeading,
        altitude: view.altitude,
        accuracy: Number.isFinite(event.webkitCompassAccuracy)
          ? event.webkitCompassAccuracy!
          : null,
        source: isWebkit ? 'webkit' : 'absolute',
      }
      window.clearTimeout(timeout)
      if (!animationFrame) animationFrame = window.requestAnimationFrame(publish)
    }

    const absoluteListener = (event: Event) => accept(event as CompassOrientationEvent, true)
    const orientationListener = (event: Event) => accept(event as CompassOrientationEvent)
    window.addEventListener('deviceorientationabsolute', absoluteListener)
    window.addEventListener('deviceorientation', orientationListener)

    timeout = window.setTimeout(() => setStatus('unavailable'), SENSOR_TIMEOUT_MS)
    cleanupRef.current = () => {
      window.removeEventListener('deviceorientationabsolute', absoluteListener)
      window.removeEventListener('deviceorientation', orientationListener)
      window.clearTimeout(timeout)
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  useEffect(() => () => cleanupRef.current(), [])

  return { status, reading, start, stop }
}
