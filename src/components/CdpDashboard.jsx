import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const CdpDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects?include_archived=false');
      setProjects(response.data);
      
      // Fetch sprints for each project to calculate completion
      const projectsWithSprints = await Promise.all(
        response.data.map(async (project) => {
          try {
            const sprintsRes = await api.get(`/sprints/project/${project.id}`);
            const sprints = sprintsRes.data;
            const validated = sprints.filter(s => s.validated).length;
            const total = sprints.length;
            return {
              ...project,
              sprintStats: { validated, total }
            };
          } catch (error) {
            return { ...project, sprintStats: { validated: 0, total: 0 } };
          }
        })
      );
      
      setProjects(projectsWithSprints);
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Erreur:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getProjectCompletion = (project) => {
    if (project.sprintStats && project.sprintStats.total > 0) {
      return Math.round((project.sprintStats.validated / project.sprintStats.total) * 100);
    }
    return project.project_completed ? 100 : 0;
  };

  const getDeadlineInfo = (deadline) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Dépassé', color: '#EF4444' };
    if (diffDays <= 7) return { text: `${diffDays}j`, color: '#F59E0B' };
    if (diffDays <= 30) return { text: `${diffDays}j`, color: '#3B82F6' };
    return { text: `${diffDays}j`, color: '#10B981' };
  };

  if (loading) return <div className="loading-spinner">Chargement...</div>;

  return (
    <div>
      <h1 className="page-title">
        <i className="fas fa-user-tie"></i> Tableau de bord Chef de Projet
      </h1>

      {/* Projets assignés */}
      <div className="card-modern" style={{ marginBottom: '24px' }}>
        <h3><i className="fas fa-folder-open"></i> Mes Projets</h3>
        
        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <i className="fas fa-inbox" style={{ fontSize: '3rem', marginBottom: '16px' }}></i>
            <p>Aucun projet assigné</p>
          </div>
        ) : (
          <div className="projects-grid" style={{ marginTop: '20px' }}>
            {projects.map(project => {
              const deadlineInfo = getDeadlineInfo(project.deadline);
              const completion = getProjectCompletion(project);

              return (
                <div key={project.id} className="project-card">
                  <div className="project-header" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
                    <i className="fas fa-folder-open"></i>
                    <span>{project.name}</span>
                  </div>
                  <div className="project-body">
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Avancement</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-primary)' }}>{completion}%</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${completion}%`, background: 'var(--accent-primary)', transition: 'width 0.3s' }}></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                      <span style={{ fontSize: '0.85rem', color: deadlineInfo.color }}>
                        <i className="fas fa-clock"></i> {deadlineInfo.text}
                      </span>
                      <button
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        onClick={() => navigate(`/cdp/projets/${project.id}`)}
                      >
                        <i className="fas fa-arrow-right"></i> Voir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sprints à valider */}
      <div className="card-modern">
        <h3><i className="fas fa-check-double"></i> Sprints en attente de validation</h3>
        <div style={{ marginTop: '16px', textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
          <i className="fas fa-check-circle" style={{ fontSize: '2rem', color: 'var(--accent-success)' }}></i>
          <p style={{ marginTop: '12px' }}>Aucun sprint en attente de validation</p>
        </div>
      </div>
    </div>
  );
};

export default CdpDashboard;
