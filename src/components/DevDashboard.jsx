import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DevDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [primes, setPrimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, primesRes] = await Promise.all([
        api.get('/tasks/my-tasks'),
        api.get('/primes/my-primes')
      ]);

      setTasks(tasksRes.data);
      setPrimes(primesRes.data);
      
      // Calculate total points from tasks
      const totalPoints = tasksRes.data.reduce((sum, t) => sum + (parseFloat(t.points_earned) || 0), 0);
      setStats(prev => ({
        ...prev,
        total: tasksRes.data.length,
        pending: tasksRes.data.filter(t => t.status === 'pending').length,
        inProgress: tasksRes.data.filter(t => t.status === 'progress').length,
        done: tasksRes.data.filter(t => t.status === 'done').length,
        validated: tasksRes.data.filter(t => t.status === 'validated').length,
        totalPoints
      }));
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Erreur:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    validated: tasks.filter(t => t.status === 'validated').length
  };

  const totalPoints = tasks.reduce((sum, t) => sum + (parseFloat(t.points_earned) || 0), 0);
  const monthlyPoints = primes.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  // Group tasks by sprint
  const tasksBySprint = tasks.reduce((acc, task) => {
    const sprintName = task.sprint_name || 'Sans sprint';
    if (!acc[sprintName]) {
      acc[sprintName] = [];
    }
    acc[sprintName].push(task);
    return acc;
  }, {});

  const pointsData = Object.keys(tasksBySprint).map(sprintName => ({
    name: sprintName,
    points: tasksBySprint[sprintName].reduce((sum, t) => sum + (parseFloat(t.points_earned) || 0), 0)
  }));

  if (loading) return <div className="loading-spinner">Chargement...</div>;

  return (
    <div>
      <h1 className="page-title">
        <i className="fas fa-code"></i> Mon Tableau de Bord
      </h1>

      {/* Stats personnelles */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <i className="fas fa-tasks"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Mes tâches</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.validated}</h3>
            <p>Tâches validées</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-info">
            <h3>{totalPoints.toFixed(0)}</h3>
            <p>Points du projet</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <i className="fas fa-coins"></i>
          </div>
          <div className="stat-info">
            <h3>{monthlyPoints.toFixed(0)}</h3>
            <p>Points ce mois</p>
          </div>
        </div>
      </div>

      {/* Tâches en cours */}
      <div className="card-modern" style={{ marginBottom: '24px' }}>
        <h3><i className="fas fa-clock"></i> Mes tâches en cours</h3>
        
        {tasks.filter(t => t.status === 'progress').length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <i className="fas fa-inbox" style={{ fontSize: '3rem', marginBottom: '16px' }}></i>
            <p>Aucune tâche en cours</p>
          </div>
        ) : (
          <div style={{ marginTop: '16px' }}>
            {tasks.filter(t => t.status === 'progress').map(task => (
              <div key={task.id} className="task-card" style={{ marginBottom: '12px' }}>
                <div className="task-header">
                  <h4 style={{ margin: 0, flex: 1 }}>{task.title}</h4>
                  <span className="task-status progress">🔄 En cours</span>
                </div>
                <div className="task-body">
                  <p><strong>Projet:</strong> {task.project_name}</p>
                  <p><strong>Sprint:</strong> {task.sprint_name}</p>
                  {task.end_date && (
                    <p><strong>Deadline:</strong> {new Date(task.end_date).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
                <div className="task-actions">
                  <button
                    className="btn-success"
                    style={{ padding: '8px 16px' }}
                    onClick={async () => {
                      try {
                        await api.patch(`/tasks/${task.id}/status`, { status: 'done' });
                        fetchData();
                      } catch (error) {
                        console.error('Erreur:', error);
                      }
                    }}
                  >
                    <i className="fas fa-check"></i> Marquer comme terminée
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Points par sprint */}
      {pointsData.length > 0 && (
        <div className="chart-card">
          <h3><i className="fas fa-chart-bar"></i> Mes points par sprint</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pointsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="points" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Historique des primes */}
      <div className="card-modern" style={{ marginTop: '24px' }}>
        <h3><i className="fas fa-coins"></i> Historique de mes primes</h3>
        
        {primes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <i className="fas fa-gift" style={{ fontSize: '3rem', marginBottom: '16px' }}></i>
            <p style={{ marginTop: '12px' }}>Aucune prime attribuée pour le moment</p>
          </div>
        ) : (
          <table style={{ width: '100%', marginTop: '16px' }}>
            <thead>
              <tr>
                <th>Projet</th>
                <th>Type</th>
                <th>Points</th>
                <th>Mois</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {primes.map(prime => (
                <tr key={prime.id}>
                  <td>{prime.project_name || '-'}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: prime.type === 'sprint' ? '#DBEAFE' : '#E0E7FF',
                      color: prime.type === 'sprint' ? '#1E40AF' : '#3730A3',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      {prime.type === 'sprint' ? 'Sprint' : 'Final'}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600', fontFamily: 'var(--code-font)' }}>{parseFloat(prime.amount).toFixed(0)} pts</td>
                  <td>{prime.month || '-'}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: prime.paid ? '#D1FAE5' : '#FEF3C7',
                      color: prime.paid ? '#065F46' : '#92400E',
                      fontSize: '0.8rem'
                    }}>
                      {prime.paid ? 'Versé' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DevDashboard;
