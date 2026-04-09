import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ projects: [], tasks: [], primes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, tasksRes, primesRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks/my-tasks'),
        api.get('/primes/my-primes')
      ]);
      setStats({ projects: projectsRes.data, tasks: tasksRes.data, primes: primesRes.data });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner">Chargement...</div>;

  const tasksByStatus = {
    pending: stats.tasks.filter(t => t.status === 'pending').length,
    progress: stats.tasks.filter(t => t.status === 'progress').length,
    done: stats.tasks.filter(t => t.status === 'done').length,
    validated: stats.tasks.filter(t => t.status === 'validated').length
  };

  const pieData = {
    labels: ['En attente', 'En cours', 'Terminées', 'Validées'],
    datasets: [{
      data: [tasksByStatus.pending, tasksByStatus.progress, tasksByStatus.done, tasksByStatus.validated],
      backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'],
      borderWidth: 0
    }]
  };

  const totalPrimes = stats.primes.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div>
      <h1 className="page-title"><i className="fas fa-chart-line"></i> Tableau de bord</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><i className="fas fa-folder-open"></i></div>
          <div className="stat-info"><h3>{stats.projects.length}</h3><p>Projets</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><i className="fas fa-tasks"></i></div>
          <div className="stat-info"><h3>{stats.tasks.length}</h3><p>Tâches</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><i className="fas fa-coins"></i></div>
          <div className="stat-info"><h3>{totalPrimes.toFixed(0)} pts</h3><p>Primes</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><i className="fas fa-check-circle"></i></div>
          <div className="stat-info"><h3>{tasksByStatus.validated}</h3><p>Validées</p></div>
        </div>
      </div>
      
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Répartition des tâches</h3>
          <div className="chart-container"><Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
        </div>
        <div className="chart-card">
          <h3>Projets récents</h3>
          <div className="projects-list">
            {stats.projects.slice(0, 5).map(p => (
              <div key={p.id} style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <strong>{p.name}</strong><br />
                <small>Deadline: {new Date(p.deadline).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;