import { describe, expect, it } from 'vitest'
import { geolocationErrorMessage } from './useLocation'

describe('geolocation fallback', () => {
  it('gives a manual-coordinate path when permission is denied', () => {
    expect(geolocationErrorMessage(1)).toContain('enter coordinates manually')
    expect(geolocationErrorMessage(1)).toContain('declined')
  })

  it('handles unavailable positions without throwing', () => {
    expect(() => geolocationErrorMessage(2)).not.toThrow()
    expect(geolocationErrorMessage(2)).toContain('could not be determined')
  })
})
