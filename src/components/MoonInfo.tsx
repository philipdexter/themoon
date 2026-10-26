import type { MoonEvents, MoonPosition } from '../astronomy/moonCalculations'
import { MoonPhaseIcon } from './MoonMarker'

interface MoonInfoProps {
  selected: MoonPosition
  events: MoonEvents
  isLive: boolean
}

function formatEvent(date: Date | null) {
  if (!date) return 'None in next 24h'
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function MoonInfo({ selected, events, isLive }: MoonInfoProps) {
  const statusMessage = events.visibility === 'always-above'
    ? 'The Moon remains above your horizon for this entire 24-hour window.'
    : events.visibility === 'always-below'
      ? 'The Moon remains below your horizon for this entire 24-hour window.'
      : null

  return (
    <section className="moon-info" aria-labelledby="moon-info-title">
      <div className="moon-info__heading">
        <div className="phase-title">
          <MoonPhaseIcon phaseAngle={selected.phaseAngle} />
          <div>
            <p className="eyebrow">{isLive ? 'At this moment' : 'At selected time'}</p>
            <h2 id="moon-info-title">{selected.phaseName}</h2>
          </div>
        </div>
        {!selected.aboveHorizon && <p className="below-callout">Moon is {isLive ? 'currently' : 'then'} below the horizon.</p>}
      </div>

      <dl className="readings">
        <div>
          <dt>Altitude</dt>
          <dd>{selected.altitude.toFixed(1)}°</dd>
          <small>{selected.aboveHorizon ? 'above horizon' : 'below horizon'}</small>
        </div>
        <div>
          <dt>Direction</dt>
          <dd>{selected.direction}</dd>
          <small>{selected.azimuth.toFixed(0)}° azimuth</small>
        </div>
        <div>
          <dt>Illumination</dt>
          <dd>{Math.round(selected.illumination * 100)}%</dd>
          <small>visible disk</small>
        </div>
      </dl>

      <div className="event-divider">
        <span>Upcoming from now</span>
      </div>
      {statusMessage && <p className="polar-note">{statusMessage}</p>}
      <dl className="events">
        <div>
          <dt><span className="event-symbol event-symbol--rise">↗</span>Next moonrise</dt>
          <dd>{events.visibility === 'always-above' ? 'Already above' : formatEvent(events.nextRise)}</dd>
        </div>
        <div>
          <dt><span className="event-symbol event-symbol--set">↘</span>Next moonset</dt>
          <dd>{events.visibility === 'always-below' ? 'Already below' : formatEvent(events.nextSet)}</dd>
        </div>
        <div>
          <dt><span className="event-symbol">⌃</span>Highest point</dt>
          <dd>{formatEvent(events.highest.time)} · {events.highest.altitude.toFixed(1)}°</dd>
        </div>
      </dl>
    </section>
  )
}
