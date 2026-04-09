import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks/my-tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      fetchTasks();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const filteredTasks = tasks.filter(t => filter === 'all' || t.status === filter);
  if (loading) return <div className="loading-spinner">Chargement...</div>;

  return (
    <div>
      <h1 className="page-title"><i className="fas fa-tasks"></i> Mes tâches</h1>
      
      <div className="filters-bar">
        {['all', 'pending', 'progress', 'done', 'validated'].map(f => (
          <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' && 'Toutes'}{f === 'pending' && 'En attente'}{f === 'progress' && 'En cours'}{f === 'done' && 'Terminées'}{f === 'validated' && 'Validées'}
          </button>
        ))}
      </div>
      
      <div className="tasks-grid">
        {filteredTasks.map(task => (
          <div key={task.id} className="task-card">
            <div className="task-header">
              <h3>{task.title}</h3>
              <span className={`task-status ${task.status}`}>
                {task.status === 'pending' && '⏳ En attente'}
                {task.status === 'progress' && '🔄 En cours'}
                {task.status === 'done' && '✅ Terminée'}
                {task.status === 'validated' && '✓ Validée'}
              </span>
            </div>
            <div className="task-body">
              <p><strong>Projet:</strong> {task.project_name}</p>
              <p><strong>Sprint:</strong> {task.sprint_name}</p>
              <p><strong>Dates:</strong> {task.start_date || '—'} → {task.end_date || '—'}</p>
            </div>
            <div className="task-actions">
              {user.role === 'dev' && task.status === 'pending' && (
                <button onClick={() => updateStatus(task.id, 'progress')} className="btn-primary"><i className="fas fa-play"></i> Commencer</button>
              )}
              {user.role === 'dev' && task.status === 'progress' && (
                <button onClick={() => updateStatus(task.id, 'done')} className="btn-success"><i className="fas fa-check"></i> Terminer</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;