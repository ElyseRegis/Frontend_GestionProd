import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
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
      alert('Erreur lors de la création: ' + (error.response?.data?.error || ''));
    }
  };

  const updateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editingUser.id}`, {
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        password: newUser.password || undefined
      });
      fetchUsers();
      setEditingUser(null);
      setNewUser({ email: '', password: '', full_name: '', role: 'dev' });
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour: ' + (error.response?.data?.error || ''));
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setNewUser({
      email: user.email,
      password: '',
      full_name: user.full_name,
      role: user.role
    });
    setShowForm(false);
  };

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`⚠️ Supprimer l'utilisateur "${userName}" ?\n\nCette action est irréversible !`)) {
      try {
        await api.delete(`/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression: ' + (error.response?.data?.error || ''));
      }
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setShowForm(false);
    setNewUser({ email: '', password: '', full_name: '', role: 'dev' });
  };

  if (loading) return <div className="loading-spinner">Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title"><i className="fas fa-users"></i> Utilisateurs</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingUser(null); setNewUser({ email: '', password: '', full_name: '', role: 'dev' }); }} className="btn-primary">
          <i className="fas fa-user-plus"></i> Ajouter
        </button>
      </div>

      {(showForm || editingUser) && (
        <div className="card-modern" style={{ marginBottom: '24px' }}>
          <h3>{editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h3>
          <form onSubmit={editingUser ? updateUser : createUser} className="form-grid-modern">
            <input 
              type="text" 
              placeholder="Nom complet" 
              value={newUser.full_name} 
              onChange={e => setNewUser({...newUser, full_name: e.target.value})} 
              required 
            />
            <input 
              type="email" 
              placeholder="Email" 
              value={newUser.email} 
              onChange={e => setNewUser({...newUser, email: e.target.value})} 
              required 
            />
            <input 
              type="password" 
              placeholder="Mot de passe (laisser vide pour ne pas changer)" 
              value={newUser.password} 
              onChange={e => setNewUser({...newUser, password: e.target.value})} 
              required={!editingUser}
            />
            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
              <option value="dev">Développeur</option>
              <option value="cdp">Chef de projet</option>
              <option value="admin">Administrateur</option>
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn-primary">
                <i className={`fas ${editingUser ? 'fa-save' : 'fa-user-plus'}`}></i> 
                {editingUser ? 'Enregistrer' : 'Créer'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                <i className="fas fa-times"></i> Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Date création</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.full_name}</td>
              <td>{u.email}</td>
              <td>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: u.role === 'admin' ? '#FEE2E1' : u.role === 'cdp' ? '#E0E7FF' : '#D1FAE5',
                  color: u.role === 'admin' ? '#DC2626' : u.role === 'cdp' ? '#4F46E5' : '#059669',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}>
                  {u.role}
                </span>
              </td>
              <td>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn-icon"
                    style={{
                      padding: '6px 10px',
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                    onClick={() => handleEdit(u)}
                    title="Modifier"
                  >
                    <i className="fas fa-pencil-alt"></i>
                  </button>
                  <button
                    className="btn-icon"
                    style={{
                      padding: '6px 10px',
                      background: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                    onClick={() => handleDelete(u.id, u.full_name)}
                    title="Supprimer"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;