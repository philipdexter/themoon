import { TRAJECTORY_STEPS } from '../astronomy/moonCalculations'

interface TimeSliderProps {
  index: number
  selectedTime: Date
  playing: boolean
  onChange: (index: number) => void
  onNow: () => void
  onTogglePlay: () => void
}

export function TimeSlider({ index, selectedTime, playing, onChange, onNow, onTogglePlay }: TimeSliderProps) {
  const time = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(selectedTime)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return (
    <section className="time-control" aria-labelledby="time-control-title">
      <div className="time-control__top">
        <div>
          <p className="eyebrow" id="time-control-title">Time travel</p>
          <div className="selected-time">
            <time dateTime={selectedTime.toISOString()}>{time}</time>
            {index === 0 && <span className="live-badge"><i />Live</span>}
          </div>
          <p className="timezone-note">{timezone} · {index === 0 ? 'current sky' : `${Math.floor(index / 12)}h ${(index % 12) * 5}m from now`}</p>
        </div>
        <div className="time-control__buttons">
          <button type="button" className="icon-button" onClick={onTogglePlay} aria-label={playing ? 'Pause Moon animation' : 'Play Moon animation'}>
            {playing ? <span className="pause-icon" aria-hidden="true" /> : <span className="play-icon" aria-hidden="true" />}
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="now-button" onClick={onNow} disabled={index === 0}>Now</button>
        </div>
      </div>
      <div className="range-wrap">
        <input
          type="range"
          min="0"
          max={TRAJECTORY_STEPS}
          step="1"
          value={index}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label="Select a time in the next 24 hours"
          aria-valuetext={time}
          style={{ '--range-progress': `${(index / TRAJECTORY_STEPS) * 100}%` } as React.CSSProperties}
        />
        <div className="range-labels" aria-hidden="true">
          <span>Now</span><span>+6h</span><span>+12h</span><span>+18h</span><span>+24h</span>
        </div>
      </div>
    </section>
  )
}
