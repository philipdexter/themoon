import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { MoonPosition } from '../astronomy/moonCalculations'
import type { CompassReading, CompassStatus } from '../hooks/useCompassGuide'
import { clamp, signedAngularDifference } from '../sensors/orientationMath'

interface CompassGuideProps {
  target: MoonPosition
  status: CompassStatus
  reading: CompassReading | null
  onRetry: () => void
  onClose: () => void
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function sensorMessage(status: CompassStatus) {
  if (status === 'requesting') return 'Waiting for compass permission…'
  if (status === 'denied') return 'Motion and orientation access was declined.'
  if (status === 'unsupported') return window.isSecureContext
    ? 'This device does not expose an orientation sensor.'
    : 'Compass guidance requires the secure HTTPS site.'
  if (status === 'unavailable') return 'No absolute compass reading arrived from this device.'
  return 'The compass could not be started.'
}

export function CompassGuide({ target, status, reading, onRetry, onClose }: CompassGuideProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  const horizontalError = reading
    ? signedAngularDifference(target.azimuth, reading.heading)
    : 0
  const verticalError = reading ? target.altitude - reading.altitude : 0
  const nearZenith = target.altitude >= 85
  const needsCalibration = reading?.accuracy !== null && reading?.accuracy !== undefined && reading.accuracy > 25
  const aligned = Boolean(
    reading &&
    Math.abs(verticalError) <= 5 &&
    (nearZenith || Math.abs(horizontalError) <= 5),
  )

  let instruction = 'Hold the phone upright in front of you.'
  if (reading) {
    const steps: string[] = []
    if (!nearZenith && Math.abs(horizontalError) > 5) {
      steps.push(`Turn ${horizontalError > 0 ? 'right' : 'left'} ${Math.round(Math.abs(horizontalError))}°`)
    }
    if (Math.abs(verticalError) > 5) {
      steps.push(`${verticalError > 0 ? 'Raise' : 'Lower'} the phone ${Math.round(Math.abs(verticalError))}°`)
    }
    instruction = aligned
      ? 'You’re looking in the right place.'
      : nearZenith && !steps.length
        ? 'Look almost straight overhead.'
        : steps.join(' · ') || 'Make a small adjustment.'
  }

  const instructionRef = useRef(instruction)
  instructionRef.current = instruction
  const [announcedInstruction, setAnnouncedInstruction] = useState(instruction)
  useEffect(() => {
    const timer = window.setInterval(() => setAnnouncedInstruction(instructionRef.current), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const targetX = clamp(horizontalError / 60, -1, 1) * 43
  const targetY = clamp(-verticalError / 45, -1, 1) * 38
  const markerStyle = {
    '--target-left': `${50 + targetX}%`,
    '--target-top': `${50 + targetY}%`,
  } as CSSProperties
  const hasSensorFailure = ['denied', 'unsupported', 'unavailable', 'error'].includes(status)

  return (
    <div className="compass-guide" role="dialog" aria-modal="true" aria-labelledby="compass-guide-title">
      <header className="compass-guide__header">
        <div>
          <p className="eyebrow">Compass guide · {formatTime(target.time)}</p>
          <h2 id="compass-guide-title">Find the Moon</h2>
        </div>
        <button type="button" className="compass-guide__close" onClick={onClose} autoFocus aria-label="Close compass guide">×</button>
      </header>

      <div className={`compass-view ${aligned ? 'compass-view--aligned' : ''}`}>
        <div className="compass-view__glow" />
        <div className="compass-view__bearing" aria-hidden="true">
          <span>{reading ? `${Math.round(reading.heading)}°` : '—'}</span>
          <small>{reading ? 'phone heading' : 'waiting for heading'}</small>
        </div>
        <div className="compass-view__crosshair" aria-hidden="true"><i /><i /></div>
        {reading && (
          <div className="compass-view__target" style={markerStyle} aria-hidden="true">
            <span className="compass-view__moon" />
            <small>MOON</small>
          </div>
        )}
        {!reading && (
          <div className="compass-view__waiting" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}
        <div className="compass-view__horizon" aria-hidden="true" />
      </div>

      <section className="compass-guide__readout">
        {hasSensorFailure ? (
          <>
            <p className="compass-guide__status">{sensorMessage(status)}</p>
            <h3>Use your phone’s compass</h3>
            <p className="manual-bearing">Face <strong>{target.direction}</strong> at <strong>{Math.round(target.azimuth)}°</strong>, then look <strong>{Math.round(target.altitude)}° up</strong>.</p>
            <button type="button" className="compass-guide__retry" onClick={onRetry}>Try sensors again</button>
          </>
        ) : (
          <>
            {needsCalibration && <p className="calibration-note"><span>∞</span> Move your phone in a figure eight to improve compass accuracy.</p>}
            <p className={`guide-instruction ${aligned ? 'guide-instruction--aligned' : ''}`}>{instruction}</p>
            <p className="sr-only" aria-live="polite">{announcedInstruction}</p>
            <p className="guide-target-numbers">Target {Math.round(target.azimuth)}° azimuth · {target.altitude.toFixed(1)}° altitude</p>
          </>
        )}
      </section>

      <div className="compass-guide__footer">
        <p>Sensor readings stay on this device.</p>
        <p>Stand still and stay aware of your surroundings.</p>
      </div>
    </div>
  )
}
