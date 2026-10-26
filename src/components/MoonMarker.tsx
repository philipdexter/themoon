interface MoonMarkerProps {
  x: number
  y: number
  phaseAngle: number
  selected?: boolean
  ghost?: boolean
}

function illuminatedPath(phaseAngle: number, radius: number): string {
  const phase = ((phaseAngle % 360) + 360) % 360
  const waxing = phase <= 180
  const steps = 32
  const limb: string[] = []
  const terminator: string[] = []

  for (let index = 0; index <= steps; index += 1) {
    const y = -radius + (2 * radius * index) / steps
    const edge = Math.sqrt(Math.max(0, radius * radius - y * y))
    limb.push(`${waxing ? edge : -edge},${y}`)
  }
  for (let index = steps; index >= 0; index -= 1) {
    const y = -radius + (2 * radius * index) / steps
    const edge = Math.sqrt(Math.max(0, radius * radius - y * y))
    const terminatorX = waxing ? Math.cos((phase * Math.PI) / 180) * edge : -Math.cos((phase * Math.PI) / 180) * edge
    terminator.push(`${terminatorX},${y}`)
  }

  return `M ${[...limb, ...terminator].join(' L ')} Z`
}

export function MoonMarker({ x, y, phaseAngle, selected = false, ghost = false }: MoonMarkerProps) {
  const radius = selected ? 12 : 9
  return (
    <g
      className={`moon-marker ${selected ? 'moon-marker--selected' : ''} ${ghost ? 'moon-marker--ghost' : ''}`}
      transform={`translate(${x} ${y})`}
      aria-hidden="true"
    >
      <circle className="moon-marker__halo" r={radius + 10} />
      <circle className="moon-marker__dark" r={radius} />
      <path className="moon-marker__light" d={illuminatedPath(phaseAngle, radius)} />
      <circle className="moon-marker__rim" r={radius} />
      {selected && <circle className="moon-marker__focus" r={radius + 5} />}
    </g>
  )
}

export function MoonPhaseIcon({ phaseAngle }: { phaseAngle: number }) {
  return (
    <svg className="phase-icon" viewBox="-28 -28 56 56" aria-hidden="true">
      <defs>
        <radialGradient id="phase-light" cx="35%" cy="30%">
          <stop offset="0" stopColor="#fff9d9" />
          <stop offset="1" stopColor="#e7c983" />
        </radialGradient>
      </defs>
      <circle r="23" fill="#25334a" />
      <path d={illuminatedPath(phaseAngle, 23)} fill="url(#phase-light)" />
      <circle cx="8" cy="-8" r="3.2" fill="#bda66e" opacity=".24" />
      <circle cx="-6" cy="9" r="4.2" fill="#927f57" opacity=".18" />
      <circle r="23" fill="none" stroke="#f8e9b0" strokeOpacity=".35" />
    </svg>
  )
}
