import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Calendar = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div>
      <h1 className="page-title"><i className="fas fa-calendar-alt"></i> Calendrier des projets</h1>
      
      <div className="tasks-grid">
        {projects.map(project => (
          <div key={project.id} className="task-card">
            <h3>{project.name}</h3>
            <p><strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString()}</p>
            <p><strong>Points:</strong> {project.total_points}</p>
            <p><strong>Statut:</strong> {project.project_completed ? '✅ Terminé' : '🔄 En cours'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;