export interface ViewDirection {
  heading: number
  altitude: number
  horizontalStrength: number
}

const TO_RADIANS = Math.PI / 180
const TO_DEGREES = 180 / Math.PI

export function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360
}

/** Returns the shortest signed turn from current to target in [-180, 180). */
export function signedAngularDifference(target: number, current: number): number {
  return ((target - current + 540) % 360) - 180
}

export function smoothHeading(previous: number, next: number, amount: number): number {
  return normalizeDegrees(previous + signedAngularDifference(next, previous) * amount)
}

/**
 * Converts the Device Orientation Z-X'-Y'' Euler angles into the direction
 * seen through the back of the phone. Earth axes are east, north, and up.
 * The matrix follows the worked AR example in the Device Orientation spec.
 */
export function orientationToViewDirection(alpha: number, beta: number, gamma: number): ViewDirection {
  const x = beta * TO_RADIANS
  const y = gamma * TO_RADIANS
  const z = alpha * TO_RADIANS
  const cX = Math.cos(x)
  const cY = Math.cos(y)
  const cZ = Math.cos(z)
  const sX = Math.sin(x)
  const sY = Math.sin(y)
  const sZ = Math.sin(z)

  // The viewing vector is [0, 0, -1] in device coordinates, so multiplying
  // by the rotation matrix is equivalent to negating its third column.
  const east = -(cY * sZ * sX + cZ * sY)
  const north = -(sZ * sY - cZ * cY * sX)
  const up = -(cX * cY)
  const horizontalStrength = Math.hypot(east, north)

  return {
    heading: normalizeDegrees(Math.atan2(east, north) * TO_DEGREES),
    altitude: Math.asin(Math.max(-1, Math.min(1, up))) * TO_DEGREES,
    horizontalStrength,
  }
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}
