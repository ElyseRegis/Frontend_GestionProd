import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // Don't fetch if not authenticated

      const [notifsRes, countRes] = await Promise.all([
        api.get('/notifications/my-notifications?limit=10'),
        api.get('/notifications/my-notifications/unread-count')
      ]);
      setNotifications(notifsRes.data);
      setUnreadCount(countRes.data.count);
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired, will be handled by ProtectedRoute
        return;
      }
      console.error('Error fetching notifications:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/my-notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleDashboardPath = (role) => {
    switch(role) {
      case 'admin': return '/admin/dashboard';
      case 'cdp': return '/cdp/dashboard';
      case 'dev': return '/dev/dashboard';
      default: return '/dashboard';
    }
  };

  const navItems = [
    { path: getRoleDashboardPath(user?.role), icon: 'fa-chart-line', label: 'Tableau de bord', roles: ['admin', 'cdp', 'dev'] },
    { path: '/projects', icon: 'fa-folder-open', label: 'Projets', roles: ['admin', 'cdp'] },
    { path: '/tasks', icon: 'fa-tasks', label: 'Mes tâches', roles: ['admin', 'cdp', 'dev'] },
    { path: '/users', icon: 'fa-users', label: 'Utilisateurs', roles: ['admin'] },
    { path: '/admin/summary', icon: 'fa-chart-bar', label: 'Résumé Mensuel', roles: ['admin'] },
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
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                background: user?.role === 'admin' ? '#DC2626' : user?.role === 'cdp' ? '#3B82F6' : '#10B981',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {user?.role === 'admin' && 'Administrateur'}
                {user?.role === 'cdp' && 'Chef de Projet'}
                {user?.role === 'dev' && 'Développeur'}
              </span>
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
        {/* Header with theme toggle and notifications */}
        <div className="content-header">
          <div style={{ flex: 1 }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                transition: 'all 0.2s'
              }}
              title={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
            >
              <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  position: 'relative',
                  transition: 'all 0.2s'
                }}
                title="Notifications"
              >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#EF4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '380px',
                  maxHeight: '500px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: 'var(--card-shadow-hover)',
                  overflow: 'auto',
                  zIndex: 1000
                }}>
                  <div style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <h4 style={{ margin: 0 }}>Notifications</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-primary)',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  
                  <div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <i className="fas fa-bell-slash" style={{ fontSize: '2rem', marginBottom: '12px' }}></i>
                        <p>Aucune notification</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border-color)',
                            background: !notif.is_read ? 'var(--bg-secondary)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onClick={() => {
                            if (notif.link) navigate(notif.link);
                          }}
                        >
                          <div style={{ fontWeight: notif.is_read ? '400' : '600', fontSize: '0.9rem', marginBottom: '4px' }}>
                            {notif.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            {notif.message}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                            {new Date(notif.created_at).toLocaleString('fr-FR')}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: `hsl(${(user?.id * 60) % 360}, 70%, 60%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.85rem'
            }}>
              {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
};

export default Layout;