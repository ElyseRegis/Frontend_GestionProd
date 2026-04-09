import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
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
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={
          <ProtectedRoute allowedRoles={['admin', 'cdp']}>
            <Projects />
          </ProtectedRoute>
        } />
        <Route path="tasks" element={<Tasks />} />
        <Route path="users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Users />
          </ProtectedRoute>
        } />
        <Route path="primes" element={<Primes />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="sprints/:projectId" element={
            <ProtectedRoute allowedRoles={['admin', 'cdp', 'dev']}>
                <Sprints />
            </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;