import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '', 
    type: 'web_app', 
    total_points: 1000, 
    deadline: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!newProject.name.trim()) {
        newErrors.name = 'Le nom du projet est requis';
      } else if (newProject.name.length < 3) {
        newErrors.name = 'Le nom doit contenir au moins 3 caractères';
      }
    } else if (step === 2) {
      if (!newProject.deadline) {
        newErrors.deadline = 'La deadline est requise';
      } else {
        const deadlineDate = new Date(newProject.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadlineDate <= today) {
          newErrors.deadline = 'La deadline doit être dans le futur';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const createProject = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    
    setCreating(true);
    try {
      console.log('Creating project:', newProject);
      const response = await api.post('/projects', newProject);
      console.log('Project created:', response.data);
      fetchProjects();
      setShowModal(false);
      setCurrentStep(1);
      setNewProject({ 
        name: '', 
        type: 'web_app', 
        total_points: 1000, 
        deadline: '',
        description: '' 
      });
      setErrors({});
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Erreur lors de la création du projet';
      setErrors({ submit: errorMsg });
    } finally {
      setCreating(false);
    }
  };

  const getProjectTypeIcon = (type) => {
    const icons = {
      site_vitrine: 'fa-globe',
      web_app: 'fa-laptop-code',
      app_mobile: 'fa-mobile-alt',
      microservice: 'fa-network-wired',
      logiciel: 'fa-cogs',
      refonte_site: 'fa-paint-brush',
      desktop: 'fa-desktop'
    };
    return icons[type] || 'fa-folder';
  };

  const getProjectTypeColor = (type) => {
    const colors = {
      site_vitrine: { bg: '#dbeafe', text: '#1e40af', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
      web_app: { bg: '#e0e7ff', text: '#3730a3', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
      app_mobile: { bg: '#fce7f3', text: '#9d174d', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
      microservice: { bg: '#d1fae5', text: '#065f46', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
      logiciel: { bg: '#fef3c7', text: '#92400e', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
      refonte_site: { bg: '#ede9fe', text: '#5b21b6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
      desktop: { bg: '#ccfbf9', text: '#155e75', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' }
    };
    return colors[type] || { bg: '#f3f4f6', text: '#374151', gradient: 'linear-gradient(135deg, #6b7280, #4b5563)' };
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

  const getDaysUntilDeadline = (deadline) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Dépassé', color: '#ef4444' };
    if (diffDays <= 7) return { text: `${diffDays}j restants`, color: '#f59e0b' };
    if (diffDays <= 30) return { text: `${diffDays}j restants`, color: '#3b82f6' };
    return { text: `${diffDays}j restants`, color: '#10b981' };
  };

  if (loading) return <div className="loading-spinner">Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title"><i className="fas fa-folder-open"></i> Projets</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '0.9rem' }}>
            {projects.length} projet{projects.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'cdp') && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <i className="fas fa-plus"></i> Nouveau projet
          </button>
        )}
      </div>

      {/* Modal de création de projet */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !creating && setShowModal(false)}>
          <div className="modal-content project-creation-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2><i className="fas fa-rocket"></i> Créer un nouveau projet</h2>
                <p className="modal-subtitle">Étape {currentStep} sur 3</p>
              </div>
              <button 
                className="btn-close" 
                onClick={() => !creating && setShowModal(false)}
                disabled={creating}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Barre de progression */}
            <div className="progress-steps">
              <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                <div className="step-number">{currentStep > 1 ? '✓' : '1'}</div>
                <div className="step-label">Informations</div>
              </div>
              <div className={`step-line ${currentStep > 1 ? 'active' : ''}`}></div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                <div className="step-number">{currentStep > 2 ? '✓' : '2'}</div>
                <div className="step-label">Configuration</div>
              </div>
              <div className={`step-line ${currentStep > 2 ? 'active' : ''}`}></div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">Récapitulatif</div>
              </div>
            </div>

            <form onSubmit={createProject}>
              {/* Étape 1: Informations de base */}
              {currentStep === 1 && (
                <div className="form-step">
                  <div className="form-group">
                    <label><i className="fas fa-tag"></i> Nom du projet *</label>
                    <input 
                      type="text" 
                      value={newProject.name} 
                      onChange={e => {
                        setNewProject({...newProject, name: e.target.value});
                        if (errors.name) setErrors({...errors, name: null});
                      }}
                      placeholder="Ex: Refonte du site e-commerce"
                      className={errors.name ? 'error' : ''}
                      autoFocus
                    />
                    {errors.name && <p className="error-message"><i className="fas fa-exclamation-circle"></i> {errors.name}</p>}
                  </div>

                  <div className="form-group">
                    <label><i className="fas fa-align-left"></i> Description (optionnel)</label>
                    <textarea 
                      value={newProject.description} 
                      onChange={e => setNewProject({...newProject, description: e.target.value})}
                      placeholder="Décrivez brièvement l'objectif du projet..."
                      rows="3"
                    />
                  </div>
                </div>
              )}

              {/* Étape 2: Configuration */}
              {currentStep === 2 && (
                <div className="form-step">
                  <div className="form-group">
                    <label><i className="fas fa-layer-group"></i> Type de projet *</label>
                    <div className="type-grid">
                      {Object.keys({
                        site_vitrine: 'Site Vitrine',
                        web_app: 'Application Web',
                        app_mobile: 'Application Mobile',
                        microservice: 'Microservice',
                        logiciel: 'Logiciel',
                        refonte_site: 'Refonte de Site',
                        desktop: 'Application Desktop'
                      }).map(type => (
                        <div
                          key={type}
                          className={`type-card ${newProject.type === type ? 'selected' : ''}`}
                          onClick={() => setNewProject({...newProject, type})}
                          style={{
                            background: newProject.type === type ? getProjectTypeColor(type).bg : '#f8fafc',
                            border: newProject.type === type ? `2px solid ${getProjectTypeColor(type).text}` : '2px solid #e2e8f0'
                          }}
                        >
                          <i className={`fas ${getProjectTypeIcon(type)}`} style={{ 
                            color: newProject.type === type ? getProjectTypeColor(type).text : '#94a3b8',
                            fontSize: '1.5rem',
                            marginBottom: '8px'
                          }}></i>
                          <span style={{ 
                            color: newProject.type === type ? getProjectTypeColor(type).text : '#64748b',
                            fontWeight: newProject.type === type ? '600' : '400'
                          }}>
                            {getProjectTypeName(type)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label><i className="fas fa-star"></i> Points totaux</label>
                      <input 
                        type="number" 
                        value={newProject.total_points} 
                        onChange={e => setNewProject({...newProject, total_points: parseInt(e.target.value) || 0})}
                        min="0"
                        max="10000"
                      />
                      <p className="help-text">Points pour le calcul des primes</p>
                    </div>

                    <div className="form-group">
                      <label><i className="fas fa-calendar-alt"></i> Deadline *</label>
                      <input 
                        type="date" 
                        value={newProject.deadline} 
                        onChange={e => {
                          setNewProject({...newProject, deadline: e.target.value});
                          if (errors.deadline) setErrors({...errors, deadline: null});
                        }}
                        className={errors.deadline ? 'error' : ''}
                      />
                      {errors.deadline && <p className="error-message"><i className="fas fa-exclamation-circle"></i> {errors.deadline}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Étape 3: Récapitulatif */}
              {currentStep === 3 && (
                <div className="form-step">
                  <div className="summary-card">
                    <div className="summary-header">
                      <i className={`fas ${getProjectTypeIcon(newProject.type)}`} style={{
                        background: getProjectTypeColor(newProject.type).gradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '2rem'
                      }}></i>
                      <div>
                        <h3>{newProject.name}</h3>
                        <span className="type-badge" style={{
                          background: getProjectTypeColor(newProject.type).bg,
                          color: getProjectTypeColor(newProject.type).text
                        }}>
                          {getProjectTypeName(newProject.type)}
                        </span>
                      </div>
                    </div>
                    
                    {newProject.description && (
                      <div className="summary-item">
                        <label><i className="fas fa-align-left"></i> Description</label>
                        <p>{newProject.description}</p>
                      </div>
                    )}
                    
                    <div className="summary-stats">
                      <div className="stat-item">
                        <i className="fas fa-star" style={{ color: '#f59e0b' }}></i>
                        <div>
                          <span className="stat-label">Points totaux</span>
                          <span className="stat-value">{newProject.total_points.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="stat-item">
                        <i className="fas fa-calendar" style={{ color: '#3b82f6' }}></i>
                        <div>
                          <span className="stat-label">Deadline</span>
                          <span className="stat-value">{new Date(newProject.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {errors.submit && (
                <div className="error-banner">
                  <i className="fas fa-exclamation-triangle"></i> {errors.submit}
                </div>
              )}

              {/* Navigation */}
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn-secondary" 
                  onClick={handlePrevious}
                  disabled={creating}
                >
                  <i className="fas fa-arrow-left"></i> {currentStep === 1 ? 'Annuler' : 'Précédent'}
                </button>
                
                {currentStep < 3 ? (
                  <button type="button" className="btn-primary" onClick={handleNext}>
                    Suivant <i className="fas fa-arrow-right"></i>
                  </button>
                ) : (
                  <button type="submit" className="btn-success" disabled={creating}>
                    {creating ? (
                      <><i className="fas fa-spinner fa-spin"></i> Création...</>
                    ) : (
                      <><i className="fas fa-check"></i> Créer le projet</>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grille des projets */}
      {projects.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-folder-open"></i>
          <h3>Aucun projet pour le moment</h3>
          <p>Commencez par créer votre premier projet</p>
          {(user?.role === 'admin' || user?.role === 'cdp') && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <i className="fas fa-plus"></i> Créer un projet
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => {
            const deadlineInfo = getDaysUntilDeadline(project.deadline);
            const typeColor = getProjectTypeColor(project.type);
            
            return (
              <div key={project.id} className="project-card">
                <div className="project-header" style={{ background: typeColor.gradient }}>
                  <i className={`fas ${getProjectTypeIcon(project.type)}`}></i>
                  <span className="project-type">{getProjectTypeName(project.type)}</span>
                </div>
                
                <div className="project-body">
                  <h3>{project.name}</h3>
                  
                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}
                  
                  <div className="project-stats">
                    <div className="project-stat">
                      <i className="fas fa-star"></i>
                      <span>{project.total_points?.toLocaleString() || 0} points</span>
                    </div>
                    <div className="project-stat">
                      <i className="fas fa-calendar"></i>
                      <span>{new Date(project.deadline).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  
                  <div className="project-footer">
                    <span className="deadline-badge" style={{ 
                      color: deadlineInfo.color,
                      background: `${deadlineInfo.color}15`
                    }}>
                      <i className="fas fa-clock"></i> {deadlineInfo.text}
                    </span>
                    {project.project_completed && (
                      <span className="completed-badge">
                        <i className="fas fa-check-circle"></i> Terminé
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Projects;