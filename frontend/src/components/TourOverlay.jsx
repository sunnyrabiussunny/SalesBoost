import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTour } from '../TourContext'

export default function TourOverlay() {
  const tour = useTour()
  const navigate = useNavigate()
  const location = useLocation()
  const [rect, setRect] = useState(null)

  const { active, step, next, prev, finish, steps } = tour || {}
  const current = steps?.[step]

  // Navigate to the step's route if we're not already there
  useEffect(() => {
    if (!active || !current) return
    if (current.route && location.pathname !== current.route) {
      navigate(current.route)
    }
  }, [active, step]) // eslint-disable-line react-hooks/exhaustive-deps

  // Locate and track the highlighted element
  useEffect(() => {
    if (!active || !current) { setRect(null); return }
    if (current.route && location.pathname !== current.route) { setRect(null); return }

    const find = () => {
      if (!current.target) { setRect(null); return }
      const el = document.querySelector(`[data-tour="${current.target}"]`)
      setRect(el ? el.getBoundingClientRect() : null)
    }
    find()
    const id = setInterval(find, 300)
    window.addEventListener('resize', find)
    return () => { clearInterval(id); window.removeEventListener('resize', find) }
  }, [active, step, location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!active || !current) return null

  const vw = window.innerWidth
  const vh = window.innerHeight
  const cardWidth = 300

  let highlight, cardStyle
  if (rect) {
    highlight = { top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }
    const spaceBelow = vh - rect.bottom
    const left = Math.min(Math.max(rect.left, 16), Math.max(vw - cardWidth - 16, 16))
    if (spaceBelow > 200) {
      cardStyle = { top: rect.bottom + 12, left }
    } else {
      cardStyle = { top: Math.max(rect.top - 200, 16), left }
    }
  } else {
    highlight = { top: vh / 2, left: vw / 2, width: 0, height: 0 }
    cardStyle = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }
  }

  return (
    <>
      <div className="tour-highlight" style={highlight} />
      <div className="tour-card" style={cardStyle}>
        <h4>{current.title}</h4>
        <p>{current.text}</p>
        <div className="tour-card-footer">
          <span className="tour-step-indicator">{step + 1} / {steps.length}</span>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={finish}>Skip</button>
            {step > 0 && <button className="btn btn-secondary btn-sm" onClick={prev}>Back</button>}
            {step < steps.length - 1
              ? <button className="btn btn-primary btn-sm" onClick={next}>Next</button>
              : <button className="btn btn-primary btn-sm" onClick={finish}>Done</button>}
          </div>
        </div>
      </div>
    </>
  )
}
