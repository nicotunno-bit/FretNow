import { useEffect, useRef } from 'react'

export default function TruckScene() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    import('../truck-scene.js').catch(console.error)
  }, [])

  return (
    <section className="truck-scroll-section" id="truck-scene">
      <div className="truck-sticky">
        <canvas id="truck-canvas"></canvas>
        <div className="truck-overlay">
          <div className="truck-text-panel"></div>
          <div className="truck-progress-wrap">
            <div className="truck-scroll-hint">SCROLL</div>
            <div className="truck-progress-track">
              <div className="truck-progress-fill" id="truckProgressFill"></div>
            </div>
            <div className="truck-step-dots">
              <span className="truck-step-dot active"></span>
              <span className="truck-step-dot"></span>
              <span className="truck-step-dot"></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
