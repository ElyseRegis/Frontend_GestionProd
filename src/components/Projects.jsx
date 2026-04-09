import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '', type: 'web_app', total_points: 1000, deadline: '', sprunts: []
  });

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

  const createProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      fetchProjects();
      setShowForm(false);
      setNewProject({ name: '', type: 'web_app', total_points: 1000, deadline: '', sprunts: [] });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (loading) return <div className="loading-spinner">Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title"><i className="fas fa-folder-open"></i> Projets</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <i className="fas fa-plus"></i> Nouveau projet
        </button>
      </div>
      
      {showForm && (
        <div className="card-modern" style={{ marginBottom: '24px' }}>
          <h3>Créer un projet</h3>
          <form onSubmit={createProject} className="form-grid-modern">
            <div className="form-group"><label>Nom</label><input type="text" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} required /></div>
            <div className="form-group"><label>Type</label><select value={newProject.type} onChange={e => setNewProject({...newProject, type: e.target.value})}><option value="web_app">Application web</option><option value="app_mobile">Application mobile</option><option value="site_vitrine">Site vitrine</option></select></div>
            <div className="form-group"><label>Points totaux</label><input type="number" value={newProject.total_points} onChange={e => setNewProject({...newProject, total_points: parseInt(e.target.value)})} /></div>
            <div className="form-group"><label>Deadline</label><input type="date" value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} /></div>
            <button type="submit" className="btn-primary">Créer</button>
          </form>
        </div>
      )}
      
      <div className="tasks-grid">
        {projects.map(project => (
          <div key={project.id} className="task-card">
            <h3>{project.name}</h3>
            <p><strong>Type:</strong> {project.type}</p>
            <p><strong>Points:</strong> {project.total_points}</p>
            <p><strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;