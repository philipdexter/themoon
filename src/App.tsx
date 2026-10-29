import { useEffect, useState } from 'react'
import { SkyDome } from './components/SkyDome'
import { TimeSlider } from './components/TimeSlider'
import { MoonInfo } from './components/MoonInfo'
import { LocationControls } from './components/LocationControls'
import { CompassGuide } from './components/CompassGuide'
import { TRAJECTORY_STEPS } from './astronomy/moonCalculations'
import { useLocation } from './hooks/useLocation'
import { useMoonData } from './hooks/useMoonData'
import { useCompassGuide } from './hooks/useCompassGuide'

function App() {
  const { location, status, error, requestLocation, applyManualLocation } = useLocation()
  const [startTime, setStartTime] = useState(() => new Date())
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const moonData = useMoonData(location, startTime)
  const compass = useCompassGuide()

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (selectedIndex === 0 && !playing) setStartTime(new Date())
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [selectedIndex, playing])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setSelectedIndex((current) => {
        if (current >= TRAJECTORY_STEPS) {
          setPlaying(false)
          return current
        }
        return current + 1
      })
    }, 180)
    return () => window.clearInterval(timer)
  }, [playing])

  const returnToNow = () => {
    setPlaying(false)
    setSelectedIndex(0)
    setStartTime(new Date())
  }

  const changeTime = (index: number) => {
    setPlaying(false)
    setSelectedIndex(index)
    if (index === 0) setStartTime(new Date())
  }

  const openGuide = () => {
    setGuideOpen(true)
    void compass.start()
  }

  const closeGuide = () => {
    setGuideOpen(false)
    compass.stop()
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Moon Finder home">
          <span className="brand-mark" aria-hidden="true"><i /></span>
          <span>MOON FINDER</span>
        </a>
        <p className="header-note">A live instrument for your night sky</p>
      </header>

      <main id="top">
        <section className="hero">
          <p className="hero-kicker"><span />Live lunar position · Next 24 hours</p>
          <h1>Find the Moon<br /><em>from where you stand.</em></h1>
          <p className="hero-copy">A precise, private map of the Moon’s path across your sky. Face the direction shown, then look up.</p>
        </section>

        <LocationControls
          location={location}
          status={status}
          error={error}
          onRequest={requestLocation}
          onApply={(next) => {
            applyManualLocation(next)
            setStartTime(new Date())
            setSelectedIndex(0)
          }}
        />

        {moonData ? (
          <>
            <SkyDome
              data={moonData}
              selected={moonData.samples[selectedIndex]}
              selectedIndex={selectedIndex}
              onOpenGuide={openGuide}
            />
            <TimeSlider
              index={selectedIndex}
              selectedTime={moonData.samples[selectedIndex].time}
              playing={playing}
              onChange={changeTime}
              onNow={returnToNow}
              onTogglePlay={() => setPlaying((value) => !value)}
            />
            <MoonInfo selected={moonData.samples[selectedIndex]} events={moonData.events} isLive={selectedIndex === 0} />
          </>
        ) : (
          <section className="empty-sky" aria-live="polite">
            <div className="empty-sky__orb"><span /></div>
            <p className="eyebrow">Waiting for an observation point</p>
            <h2>Your sky begins with a location.</h2>
            <p>Allow location access or enter coordinates above. Moon Finder works entirely on your device.</p>
          </section>
        )}
      </main>

      <footer>
        <p>Calculated on your device with Astronomy Engine.</p>
        <p>Azimuth runs clockwise from true north · Refraction modelled near the horizon</p>
      </footer>
      {guideOpen && moonData && (
        <CompassGuide
          target={moonData.samples[selectedIndex]}
          status={compass.status}
          reading={compass.reading}
          onRetry={() => void compass.start()}
          onClose={closeGuide}
        />
      )}
    </div>
  )
}

export default App
