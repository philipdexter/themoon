export interface SkyPoint {
  x: number
  y: number
}

export interface HorizonSample {
  time: Date
  altitude: number
  azimuth: number
}

export interface ProjectedSample extends HorizonSample, SkyPoint {}

export function projectToSky(
  altitude: number,
  azimuth: number,
  radius: number,
  centerX = radius,
  centerY = radius,
): SkyPoint | null {
  if (altitude < 0 || altitude > 90) return null
  const radialDistance = (radius * (90 - altitude)) / 90
  const radians = (azimuth * Math.PI) / 180

  return {
    x: centerX + radialDistance * Math.sin(radians),
    y: centerY - radialDistance * Math.cos(radians),
  }
}

/** Interpolates through north without taking the long way around the compass. */
export function interpolateAzimuth(from: number, to: number, amount: number): number {
  const delta = ((to - from + 540) % 360) - 180
  return (from + delta * amount + 360) % 360
}

export function interpolateHorizonCrossing(
  first: HorizonSample,
  second: HorizonSample,
): HorizonSample {
  const denominator = first.altitude - second.altitude
  const amount = denominator === 0 ? 0.5 : first.altitude / denominator
  const clamped = Math.min(1, Math.max(0, amount))

  return {
    time: new Date(first.time.getTime() + (second.time.getTime() - first.time.getTime()) * clamped),
    altitude: 0,
    azimuth: interpolateAzimuth(first.azimuth, second.azimuth, clamped),
  }
}

/** Returns separate visible runs, with horizon crossing endpoints inserted. */
export function splitVisibleSegments<T extends HorizonSample>(samples: T[]): HorizonSample[][] {
  const segments: HorizonSample[][] = []
  let current: HorizonSample[] = []

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index]
    const previous = samples[index - 1]

    if (sample.altitude >= 0) {
      if (previous && previous.altitude < 0) {
        current = [interpolateHorizonCrossing(previous, sample)]
      }
      current.push(sample)
    } else if (previous && previous.altitude >= 0) {
      current.push(interpolateHorizonCrossing(previous, sample))
      if (current.length > 1) segments.push(current)
      current = []
    }
  }

  if (current.length > 1) segments.push(current)
  return segments
}

export function projectSegment(
  samples: HorizonSample[],
  radius: number,
  centerX = radius,
  centerY = radius,
): ProjectedSample[] {
  return samples.flatMap((sample) => {
    const point = projectToSky(sample.altitude, sample.azimuth, radius, centerX, centerY)
    return point ? [{ ...sample, ...point }] : []
  })
}

export function pathFromPoints(points: SkyPoint[]): string {
  if (!points.length) return ''
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')
}
