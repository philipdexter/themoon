import { describe, expect, it } from 'vitest'
import { calculateMoonData, calculateMoonPosition, compassDirection, phaseName } from './moonCalculations'

describe('Moon calculations', () => {
  it('uses actual topocentric Astronomy Engine results', () => {
    const position = calculateMoonPosition(new Date('2026-10-26T12:00:00Z'), {
      latitude: 60.1699,
      longitude: 24.9384,
      elevation: 20,
    })
    expect(position.altitude).toBeGreaterThanOrEqual(-90)
    expect(position.altitude).toBeLessThanOrEqual(90)
    expect(position.azimuth).toBeGreaterThanOrEqual(0)
    expect(position.azimuth).toBeLessThan(360)
    expect(position.illumination).toBeGreaterThanOrEqual(0)
    expect(position.illumination).toBeLessThanOrEqual(1)
  })

  it('handles an Arctic observer and produces a complete 24-hour window', () => {
    const start = new Date('2026-12-31T23:30:00Z')
    const data = calculateMoonData(start, { latitude: 78.2232, longitude: 15.6469, elevation: 25 })
    expect(data.samples).toHaveLength(289)
    expect(data.endTime.getTime() - data.startTime.getTime()).toBe(24 * 60 * 60 * 1000)
    expect(data.events.highest.time.getTime()).toBeGreaterThanOrEqual(start.getTime())
    expect(data.events.highest.time.getTime()).toBeLessThanOrEqual(data.endTime.getTime())
  })

  it('uses elapsed timestamps, so midnight and DST boundaries cannot alter the 24-hour duration', () => {
    const start = new Date('2026-03-29T00:30:00+02:00')
    const data = calculateMoonData(start, { latitude: 60.1699, longitude: 24.9384, elevation: 0 })
    expect(data.samples.at(-1)!.time.getTime() - data.samples[0].time.getTime()).toBe(86_400_000)
  })

  it('labels compass octants and phases', () => {
    expect(compassDirection(359)).toBe('North')
    expect(compassDirection(48)).toBe('Northeast')
    expect(phaseName(90)).toBe('First Quarter')
    expect(phaseName(220)).toBe('Waning Gibbous')
  })

  it('classifies path samples before and after local sunset from solar altitude', () => {
    const location = { latitude: 0, longitude: 0, elevation: 0 }
    const noon = calculateMoonPosition(new Date('2026-03-20T12:00:00Z'), location)
    const midnight = calculateMoonPosition(new Date('2026-03-20T00:00:00Z'), location)
    expect(noon.skyCondition).toBe('daylight')
    expect(midnight.skyCondition).toBe('night')
    expect(noon.solarAltitude).toBeGreaterThan(80)
    expect(midnight.solarAltitude).toBeLessThan(-80)
  })
})
