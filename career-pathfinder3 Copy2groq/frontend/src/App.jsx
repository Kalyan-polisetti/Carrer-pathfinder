import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import SkillGap from './pages/SkillGap'
import Roadmap from './pages/Roadmap'
import Chat from './pages/Chat'

export default function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/signup"
        element={<Signup />}
      />

      {/* ONBOARDING */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* SKILL GAP */}
      <Route
        path="/skill-gap"
        element={
          <ProtectedRoute>
            <SkillGap />
          </ProtectedRoute>
        }
      />

      {/* ROADMAP */}
      <Route
        path="/roadmap"
        element={
          <ProtectedRoute>
            <Roadmap />
          </ProtectedRoute>
        }
      />

      {/* CHAT */}
      <Route
        path="/chat/:recommendationId"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

      {/* FALLBACK */}
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  )
}