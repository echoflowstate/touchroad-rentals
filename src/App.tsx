import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { useReducedMotion } from './lib/motion'
import Account from './pages/Account'
import Browse from './pages/Browse'
import CarDetail from './pages/CarDetail'
import HostYourCar from './pages/HostYourCar'
import HowItWorks from './pages/HowItWorks'

export function App() {
  const location = useLocation()
  const reduced = useReducedMotion()

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.scrollTo !== 'function') return
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <AppShell>
      {/* Keyed on pathname so each route arrives with its own entrance. */}
      <div key={location.pathname} className={reduced ? undefined : 'animate-fade-slide'}>
        <Routes location={location}>
          <Route path="/" element={<Browse />} />
          <Route path="/car/:id" element={<CarDetail />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/host" element={<HostYourCar />} />
          <Route path="/account" element={<Account />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AppShell>
  )
}

export default App
