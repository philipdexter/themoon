import { useEffect, useState } from 'react'
import type { ObserverLocation } from '../astronomy/moonCalculations'

interface LocationControlsProps {
  location: ObserverLocation | null
  status: 'idle' | 'requesting' | 'ready' | 'error'
  error: string | null
  onRequest: () => void
  onApply: (location: ObserverLocation) => void
}

export function LocationControls({ location, status, error, onRequest, onApply }: LocationControlsProps) {
  const [expanded, setExpanded] = useState(!location)
  const [latitude, setLatitude] = useState(location?.latitude.toFixed(5) ?? '')
  const [longitude, setLongitude] = useState(location?.longitude.toFixed(5) ?? '')
  const [elevation, setElevation] = useState(location?.elevation.toFixed(0) ?? '0')
  const [validation, setValidation] = useState<string | null>(null)

  useEffect(() => {
    if (!location) return
    setLatitude(location.latitude.toFixed(5))
    setLongitude(location.longitude.toFixed(5))
    setElevation(location.elevation.toFixed(0))
  }, [location])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const lat = Number(latitude)
    const lon = Number(longitude)
    const elev = Number(elevation || 0)
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setValidation('Latitude must be between −90 and 90 degrees.')
      return
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      setValidation('Longitude must be between −180 and 180 degrees.')
      return
    }
    if (!Number.isFinite(elev) || elev < -500 || elev > 100000) {
      setValidation('Elevation must be between −500 and 100,000 metres.')
      return
    }
    setValidation(null)
    onApply({ latitude: lat, longitude: lon, elevation: elev })
    setExpanded(false)
  }

  return (
    <section className="location-panel" aria-labelledby="location-title">
      <div className="location-summary">
        <div className="location-pin" aria-hidden="true"><span /></div>
        <div>
          <p className="eyebrow" id="location-title">Observation point</p>
          {location ? (
            <p className="coordinates">
              {Math.abs(location.latitude).toFixed(3)}°{location.latitude >= 0 ? ' N' : ' S'} ·{' '}
              {Math.abs(location.longitude).toFixed(3)}°{location.longitude >= 0 ? ' E' : ' W'}
              <span>{location.elevation.toFixed(0)} m elevation</span>
            </p>
          ) : <p className="coordinates">Location needed for your sky</p>}
        </div>
        <div className="location-actions">
          <button type="button" className="text-button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
            {expanded ? 'Close' : 'Edit'}
          </button>
          <button type="button" className="locate-button" onClick={onRequest} disabled={status === 'requesting'}>
            <span aria-hidden="true">⌖</span>{status === 'requesting' ? 'Locating…' : 'Use my location'}
          </button>
        </div>
      </div>

      {error && <p className="location-error" role="status">{error}</p>}
      {expanded && (
        <form className="coordinate-form" onSubmit={submit} noValidate>
          <label>
            <span>Latitude</span>
            <input value={latitude} onChange={(event) => setLatitude(event.target.value)} inputMode="decimal" placeholder="60.1699" aria-label="Latitude in degrees" />
          </label>
          <label>
            <span>Longitude</span>
            <input value={longitude} onChange={(event) => setLongitude(event.target.value)} inputMode="decimal" placeholder="24.9384" aria-label="Longitude in degrees" />
          </label>
          <label>
            <span>Elevation <em>m</em></span>
            <input value={elevation} onChange={(event) => setElevation(event.target.value)} inputMode="decimal" placeholder="0" aria-label="Elevation in metres" />
          </label>
          <button type="submit" className="apply-button">Apply coordinates</button>
          {validation && <p className="form-error" role="alert">{validation}</p>}
        </form>
      )}
      <p className="privacy-note"><span aria-hidden="true">◆</span> Coordinates stay in this browser and are never sent to a server.</p>
    </section>
  )
}
