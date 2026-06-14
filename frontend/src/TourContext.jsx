import { createContext, useContext, useState } from 'react'

export const TOUR_STEPS = [
  {
    route: '/pipeline',
    target: null,
    title: 'Welcome to SalesBoost CRM! 👋',
    text: "This quick tour walks you through the main areas. Let's start with your sales Pipeline — where every deal lives and moves through stages.",
  },
  {
    route: '/pipeline',
    target: 'pipeline-board',
    title: 'Visual Pipeline',
    text: 'Each column is a stage in your sales process. Drag deal cards left or right as deals progress — the totals update automatically.',
  },
  {
    route: '/pipeline',
    target: 'add-deal-btn',
    title: 'Add a Deal',
    text: 'Click here to create a new deal. Set its value, link it to a customer or organization, and pick a stage.',
  },
  {
    route: '/pipeline',
    target: 'edit-stage-btn',
    title: 'Customize Stages',
    text: 'Hover a stage and click the pencil icon to rename it, set its default win probability, and configure how many days of inactivity count as "rotting".',
  },
  {
    route: '/contacts',
    target: null,
    title: 'Customers',
    text: 'Manage your customer contacts here — names, emails, phone numbers, and labels like Hot Lead or Customer.',
  },
  {
    route: '/organizations',
    target: null,
    title: 'Organizations',
    text: 'Track the companies your customers belong to, and see every deal linked to each organization at a glance.',
  },
  {
    route: '/activities',
    target: 'schedule-activity-btn',
    title: 'Activities',
    text: 'Schedule calls, meetings, tasks, and deadlines. Overdue items are highlighted in red so nothing slips through the cracks.',
  },
  {
    route: '/reports',
    target: null,
    title: 'Insights & Reports',
    text: 'Filter by pipeline, owner, or date range to see your conversion funnel, revenue forecast, and team performance.',
  },
  {
    route: '/settings',
    target: null,
    title: 'Settings',
    text: 'Change your password here. Admins can also add team members, reset their passwords, and manage roles.',
  },
  {
    route: '/pipeline',
    target: null,
    title: "You're all set! 🎉",
    text: 'That covers the basics. You can replay this tour anytime from "Start Here" in the sidebar (or the menu on mobile).',
  },
]

const TourCtx = createContext(null)

export function TourProvider({ children }) {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)

  const start = () => { setStep(0); setActive(true) }
  const next = () => setStep(s => Math.min(s + 1, TOUR_STEPS.length - 1))
  const prev = () => setStep(s => Math.max(s - 1, 0))
  const finish = () => { setActive(false); setStep(0) }

  return (
    <TourCtx.Provider value={{ active, step, start, next, prev, finish, steps: TOUR_STEPS }}>
      {children}
    </TourCtx.Provider>
  )
}

export const useTour = () => useContext(TourCtx)
