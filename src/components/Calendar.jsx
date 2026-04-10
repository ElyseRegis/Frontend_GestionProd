import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Calendar = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' or 'year'
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Erreur:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getProjectTypeColor = (type) => {
    const colors = {
      site_vitrine: { bg: '#dbeafe', text: '#1e40af', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: '#3b82f6' },
      web_app: { bg: '#e0e7ff', text: '#3730a3', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: '#6366f1' },
      app_mobile: { bg: '#fce7f3', text: '#9d174d', gradient: 'linear-gradient(135deg, #ec4899, #db2777)', border: '#ec4899' },
      microservice: { bg: '#d1fae5', text: '#065f46', gradient: 'linear-gradient(135deg, #10b981, #059669)', border: '#10b981' },
      logiciel: { bg: '#fef3c7', text: '#92400e', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', border: '#f59e0b' },
      refonte_site: { bg: '#ede9fe', text: '#5b21b6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: '#8b5cf6' },
      desktop: { bg: '#ccfbf9', text: '#155e75', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: '#06b6d4' }
    };
    return colors[type] || { bg: '#f3f4f6', text: '#374151', gradient: 'linear-gradient(135deg, #6b7280, #4b5563)', border: '#6b7280' };
  };

  const getProjectTypeName = (type) => {
    const names = {
      site_vitrine: 'Site Vitrine',
      web_app: 'Application Web',
      app_mobile: 'Application Mobile',
      microservice: 'Microservice',
      logiciel: 'Logiciel',
      refonte_site: 'Refonte de Site',
      desktop: 'Application Desktop'
    };
    return names[type] || type;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];

    // Add empty days for padding
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getProjectsForDate = (date) => {
    if (!date) return [];
    return projects.filter(project => {
      const deadline = new Date(project.deadline);
      return deadline.getDate() === date.getDate() &&
             deadline.getMonth() === date.getMonth() &&
             deadline.getFullYear() === date.getFullYear();
    });
  };

  const getDaysUntilDeadline = (deadline) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Dépassé', color: '#ef4444', bgColor: '#fee2e2' };
    if (diffDays === 0) return { text: "Aujourd'hui", color: '#f59e0b', bgColor: '#fef3c7' };
    if (diffDays <= 7) return { text: `${diffDays}j`, color: '#f97316', bgColor: '#ffedd5' };
    if (diffDays <= 30) return { text: `${diffDays}j`, color: '#3b82f6', bgColor: '#dbeafe' };
    return { text: `${diffDays}j`, color: '#10b981', bgColor: '#d1fae5' };
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateYear = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(currentDate.getFullYear() + direction);
    setCurrentDate(newDate);
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const getDayName = (index) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[index];
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  if (loading) return <div className="loading-spinner">Chargement...</div>;

  const days = getDaysInMonth(currentDate);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title"><i className="fas fa-calendar-alt"></i> Calendrier des projets</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '0.9rem' }}>
            {projects.length} projet{projects.length !== 1 ? 's' : ''} planifié{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${view === 'month' ? 'active' : ''}`}
            onClick={() => setView('month')}
          >
            <i className="fas fa-calendar"></i> Mois
          </button>
          <button 
            className={`toggle-btn ${view === 'timeline' ? 'active' : ''}`}
            onClick={() => setView('timeline')}
          >
            <i className="fas fa-stream"></i> Timeline
          </button>
        </div>
      </div>

      {view === 'month' && (
        <div className="calendar-container">
          <div className="calendar-header">
            <button className="nav-btn" onClick={() => navigateMonth(-1)}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <h2 className="calendar-title">
              <i className="fas fa-calendar"></i> {getMonthName(currentDate)}
            </h2>
            <button className="nav-btn" onClick={() => navigateMonth(1)}>
              <i className="fas fa-chevron-right"></i>
            </button>
            <button className="today-btn" onClick={() => setCurrentDate(new Date())}>
              <i className="fas fa-calendar-day"></i> Aujourd'hui
            </button>
          </div>

          <div className="calendar-grid">
            {/* Day headers */}
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}

            {/* Calendar days */}
            {days.map((date, index) => {
              const dayProjects = getProjectsForDate(date);
              const today = isToday(date);

              return (
                <div 
                  key={index} 
                  className={`calendar-day ${!date ? 'empty' : ''} ${today ? 'today' : ''}`}
                >
                  {date && (
                    <>
                      <div className="day-number">{date.getDate()}</div>
                      {dayProjects.length > 0 && (
                        <div className="day-projects">
                          {dayProjects.slice(0, 2).map(project => {
                            const typeColor = getProjectTypeColor(project.type);
                            return (
                              <div
                                key={project.id}
                                className="mini-project-badge"
                                style={{ 
                                  background: typeColor.bg,
                                  color: typeColor.text,
                                  borderLeft: `3px solid ${typeColor.border}`
                                }}
                                onClick={() => setSelectedProject(project)}
                                title={project.name}
                              >
                                {project.name}
                              </div>
                            );
                          })}
                          {dayProjects.length > 2 && (
                            <div className="more-indicator">+{dayProjects.length - 2} de plus</div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'timeline' && (
        <div className="timeline-container">
          <div className="timeline-header">
            <h2><i className="fas fa-stream"></i> Vue chronologique</h2>
            <div className="timeline-stats">
              <div className="timeline-stat">
                <i className="fas fa-clock" style={{ color: '#3b82f6' }}></i>
                <span>{projects.filter(p => !p.project_completed).length} en cours</span>
              </div>
              <div className="timeline-stat">
                <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
                <span>{projects.filter(p => p.project_completed).length} terminés</span>
              </div>
            </div>
          </div>

          <div className="timeline-list">
            {projects
              .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
              .map((project, index) => {
                const typeColor = getProjectTypeColor(project.type);
                const deadlineInfo = getDaysUntilDeadline(project.deadline);
                const deadline = new Date(project.deadline);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysDiff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                const isOverdue = daysDiff < 0 && !project.project_completed;
                const isCompleted = project.project_completed;

                return (
                  <div 
                    key={project.id} 
                    className="timeline-item"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="timeline-marker" style={{ background: typeColor.gradient }}></div>
                    <div className="timeline-content">
                      <div className="timeline-header-row">
                        <div className="timeline-title-section">
                          <h3>{project.name}</h3>
                          <span 
                            className="timeline-type-badge"
                            style={{ 
                              background: typeColor.bg,
                              color: typeColor.text,
                              border: `1px solid ${typeColor.border}`
                            }}
                          >
                            <i className={`fas fa-${project.type === 'site_vitrine' ? 'globe' : project.type === 'web_app' ? 'laptop-code' : project.type === 'app_mobile' ? 'mobile-alt' : 'folder'}`}></i>
                            {getProjectTypeName(project.type)}
                          </span>
                        </div>
                        <div className="timeline-status">
                          {isCompleted ? (
                            <span className="status-badge completed">
                              <i className="fas fa-check-circle"></i> Terminé
                            </span>
                          ) : isOverdue ? (
                            <span className="status-badge overdue">
                              <i className="fas fa-exclamation-triangle"></i> En retard
                            </span>
                          ) : (
                            <span className="status-badge active">
                              <i className="fas fa-spinner fa-spin"></i> En cours
                            </span>
                          )}
                        </div>
                      </div>

                      {project.description && (
                        <p className="timeline-description">{project.description}</p>
                      )}

                      <div className="timeline-details">
                        <div className="timeline-detail-item">
                          <i className="fas fa-calendar" style={{ color: '#3b82f6' }}></i>
                          <span>Deadline: {deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className="timeline-detail-item">
                          <i className="fas fa-clock" style={{ color: deadlineInfo.color }}></i>
                          <span style={{ color: deadlineInfo.color, fontWeight: '600' }}>
                            {deadlineInfo.text} {isCompleted ? '(terminé)' : isOverdue ? '(en retard)' : ''}
                          </span>
                        </div>
                        <div className="timeline-detail-item">
                          <i className="fas fa-star" style={{ color: '#f59e0b' }}></i>
                          <span>{project.total_points?.toLocaleString() || 0} points</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content project-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2><i className="fas fa-folder-open"></i> {selectedProject.name}</h2>
                <p className="modal-subtitle">Détails du projet</p>
              </div>
              <button className="btn-close" onClick={() => setSelectedProject(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="project-detail-body">
              <div className="detail-section">
                <div 
                  className="detail-type-badge"
                  style={{ 
                    background: getProjectTypeColor(selectedProject.type).gradient,
                    color: 'white'
                  }}
                >
                  <i className={`fas fa-${selectedProject.type === 'site_vitrine' ? 'globe' : selectedProject.type === 'web_app' ? 'laptop-code' : selectedProject.type === 'app_mobile' ? 'mobile-alt' : 'folder'}`}></i>
                  {getProjectTypeName(selectedProject.type)}
                </div>
              </div>

              {selectedProject.description && (
                <div className="detail-section">
                  <h4><i className="fas fa-align-left"></i> Description</h4>
                  <p>{selectedProject.description}</p>
                </div>
              )}

              <div className="detail-section">
                <h4><i className="fas fa-info-circle"></i> Informations</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label><i className="fas fa-calendar"></i> Deadline</label>
                    <span className="detail-value">{new Date(selectedProject.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="detail-item">
                    <label><i className="fas fa-star"></i> Points</label>
                    <span className="detail-value">{selectedProject.total_points?.toLocaleString() || 0}</span>
                  </div>
                  <div className="detail-item">
                    <label><i className="fas fa-check-circle"></i> Statut</label>
                    <span className="detail-value">{selectedProject.project_completed ? '✅ Terminé' : '🔄 En cours'}</span>
                  </div>
                  <div className="detail-item">
                    <label><i className="fas fa-clock"></i> Créé le</label>
                    <span className="detail-value">{new Date(selectedProject.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
