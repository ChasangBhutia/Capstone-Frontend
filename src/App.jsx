import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from 'react-hot-toast'
import './App.css'
import MarkAttendance from './pages/MarkAttendance'
import CreateUser from './pages/CreateUser'
import Login from './pages/Login'
import Layout from './Layout'
import AttendanceView from "./pages/AttendanceView"
import Chatbot from "./pages/Chatbot"
import DashboardHome from "./pages/DashboardHome"
import TransportTracking from "./pages/TransportTracking"
import Notifications from "./pages/Notifications"
import Landing from "./pages/Landing"

import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'parent']}>
              <DashboardHome />
            </ProtectedRoute>
          } />

          <Route path="/attendance" element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <AttendanceView />
            </ProtectedRoute>
          } />
          
          <Route path="/attendance/scan" element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <MarkAttendance />
            </ProtectedRoute>
          } />

          <Route path="/tracking" element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'parent']}>
              <TransportTracking />
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={<Notifications />} />
          <Route path="/ai/chat" element={<Chatbot />} />
          
          <Route path="/create-profile" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateUser />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App