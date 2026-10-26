import {
  Body,
  Equator,
  Horizon,
  Illumination,
  MoonPhase,
  Observer,
  SearchHourAngle,
  SearchRiseSet,
} from 'astronomy-engine'

export const FIVE_MINUTES_MS = 5 * 60 * 1000
export const DAY_MS = 24 * 60 * 60 * 1000
export const TRAJECTORY_STEPS = 288

export interface ObserverLocation {
  latitude: number
  longitude: number
  elevation: number
  source?: 'geolocation' | 'manual' | 'saved'
}

export interface MoonPosition {
  time: Date
  altitude: number
  azimuth: number
  direction: string
  aboveHorizon: boolean
  illumination: number
  phaseAngle: number
  phaseName: string
  solarAltitude: number
  skyCondition: 'daylight' | 'twilight' | 'night'
}

export interface MoonEvents {
  nextRise: Date | null
  nextSet: Date | null
  highest: { time: Date; altitude: number }
  visibility: 'mixed' | 'always-above' | 'always-below'
}

export interface MoonData {
  samples: MoonPosition[]
  events: MoonEvents
  startTime: Date
  endTime: Date
}

export function compassDirection(azimuth: number): string {
  const names = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest']
  return names[Math.round((((azimuth % 360) + 360) % 360) / 45) % 8]
}

export function phaseName(angle: number): string {
  const normalized = ((angle % 360) + 360) % 360
  if (normalized < 11.25 || normalized >= 348.75) return 'New Moon'
  if (normalized < 78.75) return 'Waxing Crescent'
  if (normalized < 101.25) return 'First Quarter'
  if (normalized < 168.75) return 'Waxing Gibbous'
  if (normalized < 191.25) return 'Full Moon'
  if (normalized < 258.75) return 'Waning Gibbous'
  if (normalized < 281.25) return 'Last Quarter'
  return 'Waning Crescent'
}

export function calculateMoonPosition(time: Date, location: ObserverLocation): MoonPosition {
  const observer = new Observer(location.latitude, location.longitude, location.elevation)
  // Equator(..., ofdate=true) is required before Horizon; aberration and topocentric
  // parallax are included. "normal" applies Astronomy Engine's refraction model.
  const equatorial = Equator(Body.Moon, time, observer, true, true)
  const horizontal = Horizon(time, observer, equatorial.ra, equatorial.dec, 'normal')
  const illumination = Illumination(Body.Moon, time)
  const phaseAngle = MoonPhase(time)
  const sunEquatorial = Equator(Body.Sun, time, observer, true, true)
  // Geometric solar altitude and the standard -0.833° solar-limb threshold
  // distinguish positions before/after local sunset. Civil twilight ends at -6°.
  const solarAltitude = Horizon(time, observer, sunEquatorial.ra, sunEquatorial.dec).altitude
  const skyCondition = solarAltitude >= -0.833
    ? 'daylight'
    : solarAltitude >= -6
      ? 'twilight'
      : 'night'

  return {
    time,
    altitude: horizontal.altitude,
    azimuth: horizontal.azimuth,
    direction: compassDirection(horizontal.azimuth),
    aboveHorizon: horizontal.altitude >= 0,
    illumination: illumination.phase_fraction,
    phaseAngle,
    phaseName: phaseName(phaseAngle),
    solarAltitude,
    skyCondition,
  }
}

export function calculateMoonData(startTime: Date, location: ObserverLocation): MoonData {
  const observer = new Observer(location.latitude, location.longitude, location.elevation)
  const samples = Array.from({ length: TRAJECTORY_STEPS + 1 }, (_, index) =>
    calculateMoonPosition(new Date(startTime.getTime() + index * FIVE_MINUTES_MS), location),
  )
  const endTime = samples.at(-1)!.time

  const rise = SearchRiseSet(Body.Moon, observer, +1, startTime, 1)
  const set = SearchRiseSet(Body.Moon, observer, -1, startTime, 1)
  const nextRise = rise && rise.date <= endTime ? rise.date : null
  const nextSet = set && set.date <= endTime ? set.date : null

  const candidates = [samples[0], samples.at(-1)!]
  const culmination = SearchHourAngle(Body.Moon, observer, 0, startTime, +1)
  if (culmination.time.date <= endTime) {
    candidates.push(calculateMoonPosition(culmination.time.date, location))
  }
  const highestPosition = candidates.reduce((highest, candidate) =>
    candidate.altitude > highest.altitude ? candidate : highest,
  )

  const allAbove = samples.every((sample) => sample.aboveHorizon)
  const allBelow = samples.every((sample) => !sample.aboveHorizon)

  return {
    samples,
    startTime,
    endTime,
    events: {
      nextRise,
      nextSet,
      highest: { time: highestPosition.time, altitude: highestPosition.altitude },
      visibility: allAbove ? 'always-above' : allBelow ? 'always-below' : 'mixed',
    },
  }
}
