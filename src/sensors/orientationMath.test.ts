import { describe, expect, it } from 'vitest'
import {
  normalizeDegrees,
  orientationToViewDirection,
  signedAngularDifference,
  smoothHeading,
} from './orientationMath'

describe('compass angle helpers', () => {
  it('normalizes angles into a compass turn', () => {
    expect(normalizeDegrees(-10)).toBe(350)
    expect(normalizeDegrees(370)).toBe(10)
  })

  it('chooses the short direction across north', () => {
    expect(signedAngularDifference(2, 358)).toBe(4)
    expect(signedAngularDifference(358, 2)).toBe(-4)
  })

  it('smooths across north without rotating the long way', () => {
    expect(smoothHeading(358, 2, 0.5)).toBeCloseTo(0)
  })
})

describe('device view direction', () => {
  it('points north at the horizon when held upright', () => {
    const view = orientationToViewDirection(0, 90, 0)
    expect(view.heading).toBeCloseTo(0)
    expect(view.altitude).toBeCloseTo(0)
  })

  it('turns east with the device', () => {
    const view = orientationToViewDirection(270, 90, 0)
    expect(view.heading).toBeCloseTo(90)
    expect(view.altitude).toBeCloseTo(0)
  })

  it('measures an upward viewing angle', () => {
    const view = orientationToViewDirection(0, 120, 0)
    expect(view.heading).toBeCloseTo(0)
    expect(view.altitude).toBeCloseTo(30)
  })
})
