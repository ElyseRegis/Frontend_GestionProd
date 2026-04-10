import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalUsers: 0,
    totalSprints: 0,
    totalTasks: 0,
    overdueSprints: 0
  });
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        api.get('/projects?include_archived=false'),
        api.get('/users')
      ]);

      setProjects(projectsRes.data);
      setUsers(usersRes.data);

      // Calculate stats with sprints info
      let totalSprints = 0;
      let overdueSprints = 0;
      let totalTasks = 0;
      const today = new Date();

      for (const project of projectsRes.data) {
        try {
          const sprintsRes = await api.get(`/sprints/project/${project.id}`);
          totalSprints += sprintsRes.data.length;
          
          for (const sprint of sprintsRes.data) {
            if (!sprint.validated && new Date(sprint.end_date) < today) {
              overdueSprints++;
            }
            totalTasks += parseInt(sprint.total_tasks || 0);
          }
        } catch (error) {
          // Silently handle sprint errors
          console.error(`Error fetching sprints for project ${project.id}:`, error);
        }
      }

      setStats({
        totalProjects: projectsRes.data.length,
        totalUsers: usersRes.data.length,
        totalSprints,
        totalTasks,
        overdueSprints
      });
    } catch (error) {
      // AuthContext interceptor will handle 401
      if (error.response?.status !== 401) {
        console.error('Erreur:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const devPointsData = users
    .filter(u => u.role === 'dev')
    .map(u => ({
      name: u.full_name,
      points: u.total_points_earned || 0
    }));

  const projectStatusData = [
    { name: 'En cours', value: projects.filter(p => !p.project_completed).length },
    { name: 'Terminés', value: projects.filter(p => p.project_completed).length }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) return <div className="loading-spinner">Chargement...</div>;

  return (
    <div>
      <h1 className="page-title">
        <i className="fas fa-chart-line"></i> Tableau de bord Admin
      </h1>

      {/* Stats globales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <i className="fas fa-folder-open"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.totalProjects}</h3>
            <p>Projets totaux</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.totalUsers}</h3>
            <p>Utilisateurs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <i className="fas fa-flag"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.totalSprints}</h3>
            <p>Sprints totaux</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.overdueSprints}</h3>
            <p>Sprints en retard</p>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3><i className="fas fa-chart-bar"></i> Points par développeur</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={devPointsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="points" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3><i className="fas fa-chart-pie"></i> Statut des projets</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Liste des projets en retard */}
      <div className="card-modern" style={{ marginTop: '24px' }}>
        <h3><i className="fas fa-exclamation-circle"></i> Sprints en retard / à risque</h3>
        <table style={{ width: '100%', marginTop: '16px' }}>
          <thead>
            <tr>
              <th>Projet</th>
              <th>Sprint</th>
              <th>Deadline</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {/* This would be populated from actual data */}
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                Aucun sprint en retard
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
