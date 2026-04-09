import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: 'fa-chart-line', label: 'Tableau de bord', roles: ['admin', 'cdp', 'dev'] },
    { path: '/projects', icon: 'fa-folder-open', label: 'Projets', roles: ['admin', 'cdp'] },
    { path: '/tasks', icon: 'fa-tasks', label: 'Mes tâches', roles: ['admin', 'cdp', 'dev'] },
    { path: '/users', icon: 'fa-users', label: 'Utilisateurs', roles: ['admin'] },
    { path: '/primes', icon: 'fa-coins', label: 'Primes', roles: ['admin', 'cdp', 'dev'] },
    { path: '/calendar', icon: 'fa-calendar', label: 'Calendrier', roles: ['admin', 'cdp'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>GestPro+</h2>
          <div className="user-info">
            <div className="user-name">{user?.full_name}</div>
            <div className="user-role">
              {user?.role === 'admin' && 'Administrateur'}
              {user?.role === 'cdp' && 'Chef de Projet'}
              {user?.role === 'dev' && 'Développeur'}
            </div>
          </div>
        </div>
        
        <nav>
          {visibleNavItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
          
          <div className="nav-link logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Déconnexion</span>
          </div>
        </nav>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;