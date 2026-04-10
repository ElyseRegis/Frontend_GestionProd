import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import CdpDashboard from './components/CdpDashboard';
import DevDashboard from './components/DevDashboard';
import Projects from './components/Projects';
import Tasks from './components/Tasks';
import Users from './components/Users';
import Primes from './components/Primes';
import Calendar from './components/Calendar';
import Sprints from './components/Sprints';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-spinner">Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" />;
    if (user.role === 'cdp') return <Navigate to="/cdp/dashboard" />;
    if (user.role === 'dev') return <Navigate to="/dev/dashboard" />;
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/register/:token" element={<Register />} />

      {/* Main app routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Role-based dashboards */}
        <Route path="admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="cdp/dashboard" element={
          <ProtectedRoute allowedRoles={['cdp']}>
            <CdpDashboard />
          </ProtectedRoute>
        } />
        <Route path="dev/dashboard" element={
          <ProtectedRoute allowedRoles={['dev']}>
            <DevDashboard />
          </ProtectedRoute>
        } />

        {/* Projects */}
        <Route path="projects" element={
          <ProtectedRoute allowedRoles={['admin', 'cdp']}>
            <Projects />
          </ProtectedRoute>
        } />
        <Route path="admin/projets" element={
          <ProtectedRoute allowedRoles={['admin', 'cdp']}>
            <Projects />
          </ProtectedRoute>
        } />
        
        {/* Tasks */}
        <Route path="tasks" element={<Tasks />} />
        <Route path="dev/taches" element={<Tasks />} />
        
        {/* Users (Admin only) */}
        <Route path="users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Users />
          </ProtectedRoute>
        } />
        <Route path="admin/utilisateurs" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Users />
          </ProtectedRoute>
        } />
        
        {/* Primes */}
        <Route path="primes" element={<Primes />} />
        <Route path="dev/points" element={<Primes />} />
        
        {/* Calendar */}
        <Route path="calendar" element={<Calendar />} />
        
        {/* Sprints */}
        <Route path="sprints/:projectId" element={
            <ProtectedRoute allowedRoles={['admin', 'cdp', 'dev']}>
                <Sprints />
            </ProtectedRoute>
        } />
        <Route path="admin/projets/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'cdp']}>
                <Sprints />
            </ProtectedRoute>
        } />
        <Route path="cdp/projets/:id" element={
            <ProtectedRoute allowedRoles={['cdp']}>
                <Sprints />
            </ProtectedRoute>
        } />
        <Route path="dev/sprints/:id" element={
            <ProtectedRoute allowedRoles={['dev']}>
                <Sprints />
            </ProtectedRoute>
        } />
      </Route>

      {/* Catch all - redirect */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--card-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            },
            success: {
              iconTheme: {
                primary: 'var(--accent-success)',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--accent-danger)',
                secondary: '#fff',
              },
            },
          }}
        />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;