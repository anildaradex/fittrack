import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { getToken } from './api'
import Login from './pages/Login'
import Today from './pages/Today'
import AddFood from './pages/AddFood'
import Foods from './pages/Foods'
import FoodForm from './pages/FoodForm'
import Goals from './pages/Goals'

function Shell() {
  const [authed, setAuthed] = useState(() => !!getToken())
  useEffect(() => {
    const h = () => setAuthed(!!getToken())
    window.addEventListener('fittrack:auth', h)
    window.addEventListener('storage', h)
    return () => { window.removeEventListener('fittrack:auth', h); window.removeEventListener('storage', h) }
  }, [])
  if (!authed) return <Navigate to="/login" replace />
  return (
    <>
      <Outlet />
      <nav className="tabs">
        <NavLink to="/" end><span className="ico">📅</span>Today</NavLink>
        <NavLink to="/foods"><span className="ico">🥗</span>Foods</NavLink>
        <NavLink to="/goals"><span className="ico">🎯</span>Goals</NavLink>
      </nav>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Shell />}>
          <Route path="/" element={<Today />} />
          <Route path="/add" element={<AddFood />} />
          <Route path="/foods" element={<Foods />} />
          <Route path="/foods/new" element={<FoodForm />} />
          <Route path="/foods/:id" element={<FoodForm />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
