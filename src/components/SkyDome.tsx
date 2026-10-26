import { useMemo } from 'react'
import type { MoonData, MoonPosition } from '../astronomy/moonCalculations'
import {
  pathFromPoints,
  projectSegment,
  projectToSky,
  splitVisibleSegments,
} from '../astronomy/skyProjection'
import { MoonMarker } from './MoonMarker'

interface SkyDomeProps {
  data: MoonData
  selected: MoonPosition
  selectedIndex: number
}

const CENTER = 350
const RADIUS = 286

function formatMarkerTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)
}

export function SkyDome({ data, selected, selectedIndex }: SkyDomeProps) {
  const selectedTime = selected.time.getTime()
  const visibleSegments = useMemo(
    () => splitVisibleSegments(data.samples).map((segment) => projectSegment(segment, RADIUS, CENTER, CENTER)),
    [data.samples],
  )
  const selectedPoint = projectToSky(selected.altitude, selected.azimuth, RADIUS, CENTER, CENTER)
  const live = data.samples[0]
  const livePoint = projectToSky(live.altitude, live.azimuth, RADIUS, CENTER, CENTER)
  const hourlyMarkers = data.samples.filter((sample, index) => index % 12 === 0 && sample.altitude >= 0)
  const pathCondition = (time: Date) => {
    const index = Math.max(0, Math.min(data.samples.length - 1, Math.round((time.getTime() - data.startTime.getTime()) / 300_000)))
    return data.samples[index].skyCondition
  }
  const conditionLabel = selected.skyCondition === 'daylight'
    ? 'Before sunset · daylight'
    : selected.skyCondition === 'twilight'
      ? 'After sunset · twilight'
      : 'After sunset · night'

  return (
    <section className="sky-wrap" aria-labelledby="sky-title">
      <div className="sky-heading">
        <div>
          <p className="eyebrow">Observer's sky</p>
          <h2 id="sky-title">Look up, then turn {selected.direction.toLowerCase()}</h2>
        </div>
        <div className={`visibility-chip ${selected.aboveHorizon ? '' : 'visibility-chip--below'}`}>
          <span className="visibility-chip__dot" />
          {selected.aboveHorizon ? `${selected.altitude.toFixed(1)}° above horizon` : 'Below the horizon'}
        </div>
      </div>
      <p className={`sun-state sun-state--${selected.skyCondition}`}><span />{conditionLabel}</p>

      <svg
        className="sky-dome"
        viewBox="0 0 700 745"
        role="img"
        aria-label={`Fisheye sky view. Moon at ${selected.azimuth.toFixed(0)} degrees azimuth and ${selected.altitude.toFixed(1)} degrees altitude.`}
      >
        <defs>
          <radialGradient id="sky-gradient" cx="48%" cy="43%" r="64%">
            <stop offset="0" stopColor="#183457" />
            <stop offset=".58" stopColor="#0b203b" />
            <stop offset="1" stopColor="#061222" />
          </radialGradient>
          <radialGradient id="horizon-glow" cx="50%" cy="50%" r="50%">
            <stop offset="74%" stopColor="#7692ad" stopOpacity="0" />
            <stop offset="100%" stopColor="#85a6c3" stopOpacity=".13" />
          </radialGradient>
          <filter id="path-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id="sky-clip"><circle cx={CENTER} cy={CENTER} r={RADIUS} /></clipPath>
          <marker id="travel-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#eacb7a" />
          </marker>
        </defs>

        <circle cx={CENTER} cy={CENTER} r={RADIUS + 6} className="sky-outer-ring" />
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#sky-gradient)" />
        <g clipPath="url(#sky-clip)">
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#horizon-glow)" />
          <path className="milky-haze" d="M55 462 C200 250 421 180 645 94" />
          <circle cx="180" cy="206" r="1.1" className="star star--1" />
          <circle cx="507" cy="171" r=".9" className="star star--2" />
          <circle cx="432" cy="495" r="1.2" className="star star--3" />
          <circle cx="233" cy="471" r=".8" className="star star--4" />

          <g className="sky-grid">
            <circle cx={CENTER} cy={CENTER} r={(RADIUS * 2) / 3} />
            <circle cx={CENTER} cy={CENTER} r={RADIUS / 3} />
            <line x1={CENTER} y1={CENTER - RADIUS} x2={CENTER} y2={CENTER + RADIUS} />
            <line x1={CENTER - RADIUS} y1={CENTER} x2={CENTER + RADIUS} y2={CENTER} />
            <line x1="148" y1="148" x2="552" y2="552" className="sky-grid__diagonal" />
            <line x1="552" y1="148" x2="148" y2="552" className="sky-grid__diagonal" />
          </g>

          {visibleSegments.map((points, segmentIndex) => (
            <g key={segmentIndex}>
              {points.slice(1).map((point, pointIndex) => {
                const previous = points[pointIndex]
                const temporalClass = point.time.getTime() <= selectedTime ? 'trajectory--travelled' : 'trajectory--future'
                const condition = pathCondition(new Date((point.time.getTime() + previous.time.getTime()) / 2))
                return (
                  <path
                    key={`${segmentIndex}-${pointIndex}`}
                    className={`trajectory ${temporalClass} trajectory--${condition}`}
                    d={pathFromPoints([previous, point])}
                  />
                )
              })}
            </g>
          ))}

          {hourlyMarkers.map((sample, index) => {
            const point = projectToSky(sample.altitude, sample.azimuth, RADIUS, CENTER, CENTER)
            if (!point) return null
            const elapsedHours = Math.round((sample.time.getTime() - data.startTime.getTime()) / 3_600_000)
            return (
              <g className="hour-marker" key={sample.time.toISOString()}>
                <circle cx={point.x} cy={point.y} r={index === 0 ? 3.5 : 2.4}>
                  <title>{`${elapsedHours === 0 ? 'Now' : `+${elapsedHours} hr`} · ${formatMarkerTime(sample.time)} · ${sample.altitude.toFixed(1)}° · ${sample.skyCondition === 'daylight' ? 'before sunset' : `after sunset (${sample.skyCondition})`}`}</title>
                </circle>
              </g>
            )
          })}

          {selectedIndex > 0 && livePoint && (
            <MoonMarker x={livePoint.x} y={livePoint.y} phaseAngle={live.phaseAngle} ghost />
          )}
          {selectedPoint && (
            <MoonMarker x={selectedPoint.x} y={selectedPoint.y} phaseAngle={selected.phaseAngle} selected />
          )}
        </g>

        <circle cx={CENTER} cy={CENTER} r={RADIUS} className="horizon-ring" />
        <g className="altitude-labels" aria-hidden="true">
          <text x={CENTER + 8} y={CENTER - RADIUS / 3 + 4}>60°</text>
          <text x={CENTER + 8} y={CENTER - (RADIUS * 2) / 3 + 4}>30°</text>
          <text x={CENTER + 9} y={CENTER + 4} className="zenith-label">Z</text>
          <circle cx={CENTER} cy={CENTER} r="3" />
        </g>
        <g className="cardinal-labels" aria-hidden="true">
          <text x={CENTER} y="34">N</text>
          <text x="671" y={CENTER + 7}>E</text>
          <text x={CENTER} y="678">S</text>
          <text x="29" y={CENTER + 7}>W</text>
        </g>

        <g className="observer-silhouette" aria-hidden="true">
          <ellipse cx="350" cy="721" rx="55" ry="7" />
          <path d="M324 716 C329 692 337 681 348 678 C359 681 371 692 378 716 Z" />
          <circle cx="348" cy="667" r="12" />
          <path className="observer-silhouette__nose" d="M354 665 L363 661 L356 671" />
          <path className="observer-silhouette__gaze" d="M361 661 L395 618" />
        </g>
      </svg>

      <div className="legend" aria-label="Sky chart legend">
        <span><i className="legend__moon" />Selected Moon</span>
        {selectedIndex > 0 && <span><i className="legend__live" />Real position</span>}
        <span><i className="legend__future" />Future path</span>
        <span><i className="legend__past" />Travelled</span>
        <span><i className="legend__daylight" />Before sunset</span>
        <span><i className="legend__twilight" />Twilight</span>
        <span><i className="legend__night" />After sunset</span>
        <span><i className="legend__horizon" />Horizon</span>
      </div>
    </section>
  )
}
