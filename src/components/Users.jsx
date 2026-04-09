import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'dev' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/users', newUser);
      fetchUsers();
      setShowForm(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'dev' });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (loading) return <div className="loading-spinner">Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title"><i className="fas fa-users"></i> Utilisateurs</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary"><i className="fas fa-user-plus"></i> Ajouter</button>
      </div>
      
      {showForm && (
        <div className="card-modern" style={{ marginBottom: '24px' }}>
          <h3>Nouvel utilisateur</h3>
          <form onSubmit={createUser} className="form-grid-modern">
            <input type="text" placeholder="Nom complet" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} required />
            <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
            <input type="password" placeholder="Mot de passe" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}><option value="dev">Développeur</option><option value="cdp">Chef de projet</option><option value="admin">Administrateur</option></select>
            <button type="submit" className="btn-primary">Créer</button>
          </form>
        </div>
      )}
      
      <table className="data-table">
        <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Date création</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}><td>{u.full_name}</td><td>{u.email}</td><td>{u.role}</td><td>{new Date(u.created_at).toLocaleDateString()}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;