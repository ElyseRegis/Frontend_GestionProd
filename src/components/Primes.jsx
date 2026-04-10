import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Primes = () => {
  const { user } = useAuth();
  const [primes, setPrimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrimes();
  }, []);

  const fetchPrimes = async () => {
    try {
      const response = await api.get('/primes/my-primes');
      setPrimes(response.data);
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Erreur:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const total = primes.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  if (loading) return <div className="loading-spinner">Chargement...</div>;

  return (
    <div>
      <h1 className="page-title"><i className="fas fa-coins"></i> Mes primes</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon orange"><i className="fas fa-chart-line"></i></div>
          <div className="stat-info"><h3>{total.toFixed(2)} pts</h3><p>Total des primes</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><i className="fas fa-calendar"></i></div>
          <div className="stat-info"><h3>{primes.length}</h3><p>Paiements reçus</p></div>
        </div>
      </div>
      
      <table className="data-table">
        <thead><tr><th>Projet</th><th>Type</th><th>Montant</th><th>Mois</th><th>Statut</th></tr></thead>
        <tbody>
          {primes.map(p => (
            <tr key={p.id}>
              <td>{p.project_name || '-'}</td>
              <td>{p.type === 'sprint' ? 'Prime de sprint' : 'Bonus final'}</td>
              <td className="prime-value">{parseFloat(p.amount).toFixed(2)} pts</td>
              <td>{p.month || '-'}</td>
              <td>{p.paid ? '✅ Payé' : '⏳ En attente'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Primes;