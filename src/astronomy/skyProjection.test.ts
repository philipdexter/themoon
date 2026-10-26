import { describe, expect, it } from 'vitest'
import {
  interpolateAzimuth,
  projectToSky,
  splitVisibleSegments,
  type HorizonSample,
} from './skyProjection'

const radius = 100

describe('azimuthal equidistant projection', () => {
  it('projects zenith to the center', () => {
    expect(projectToSky(90, 137, radius)).toEqual({ x: 100, y: 100 })
  })

  it.each([
    [0, 100, 0],
    [90, 200, 100],
    [180, 100, 200],
    [270, 0, 100],
  ])('projects horizon azimuth %s to the circle boundary', (azimuth, x, y) => {
    const point = projectToSky(0, azimuth, radius)!
    expect(point.x).toBeCloseTo(x, 8)
    expect(point.y).toBeCloseTo(y, 8)
    expect(Math.hypot(point.x - radius, point.y - radius)).toBeCloseTo(radius, 8)
  })

  it('does not project below-horizon points', () => {
    expect(projectToSky(-0.01, 45, radius)).toBeNull()
  })
})

describe('trajectory segmentation', () => {
  const sample = (minute: number, altitude: number, azimuth: number): HorizonSample => ({
    time: new Date(Date.UTC(2026, 9, 26, 22, minute)),
    altitude,
    azimuth,
  })

  it('splits separate above-horizon segments and inserts horizon endpoints', () => {
    const segments = splitVisibleSegments([
      sample(0, 4, 350), sample(5, -4, 355), sample(10, -3, 1), sample(15, 3, 6), sample(20, 6, 12),
    ])
    expect(segments).toHaveLength(2)
    expect(segments[0].at(-1)?.altitude).toBe(0)
    expect(segments[1][0].altitude).toBe(0)
  })

  it('interpolates across north using the short angular route', () => {
    expect(interpolateAzimuth(359, 1, 0.5)).toBeCloseTo(0)
    expect(interpolateAzimuth(1, 359, 0.5)).toBeCloseTo(0)
  })

  it('returns no visible path for a fully below-horizon period', () => {
    expect(splitVisibleSegments([sample(0, -5, 10), sample(5, -4, 20)])).toEqual([])
  })
})
