import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MonthlySummary = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [years, setYears] = useState([]);

  useEffect(() => {
    // Generate available years (current year and 2 years back)
    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear, currentYear - 1, currentYear - 2];
    setYears(yearOptions.map(y => y.toString()));
    fetchSummary(currentYear.toString());
  }, []);

  const fetchSummary = async (year) => {
    try {
      setLoading(true);
      const response = await api.get(`/primes/monthly-summary?year=${year}`);
      setSummary(response.data.data || []);
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    fetchSummary(year);
  };

  const monthNames = [
    'JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
    'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE'
  ];

  const monthKeys = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  if (loading) return <div className="loading-spinner">Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">
            <i className="fas fa-chart-bar"></i> Tableau Récapitulatif Mensuel
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>
            Points EXE (Développeurs) et CDP (Chefs de Projet) par mois
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
            <i className="fas fa-calendar"></i> Année :
          </label>
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '2px solid var(--border-primary)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-modern" style={{ overflow: 'auto' }}>
        <table className="data-table" style={{ minWidth: '1200px' }}>
          <thead>
            <tr>
              <th rowSpan="2" style={{ minWidth: '200px', textAlign: 'center' }}>
                <i className="fas fa-user"></i> Nom
              </th>
              {monthNames.map((month, idx) => (
                <th key={idx} colSpan="2" style={{ textAlign: 'center', background: 'var(--bg-tertiary)' }}>
                  {month}
                </th>
              ))}
            </tr>
            <tr>
              {monthKeys.map((_, idx) => (
                <React.Fragment key={idx}>
                  <th style={{ 
                    textAlign: 'center', 
                    fontSize: '0.8rem',
                    background: '#D1FAE5',
                    color: '#059669',
                    padding: '8px 4px'
                  }}>
                    EXE
                  </th>
                  <th style={{ 
                    textAlign: 'center', 
                    fontSize: '0.8rem',
                    background: '#E0E7FF',
                    color: '#4F46E5',
                    padding: '8px 4px'
                  }}>
                    CDP
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.length === 0 ? (
              <tr>
                <td colSpan="25" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <i className="fas fa-inbox" style={{ fontSize: '2rem', marginBottom: '8px', display: 'block' }}></i>
                  Aucune donnée pour l'année {selectedYear}
                </td>
              </tr>
            ) : (
              summary.map((user, index) => (
                <tr key={user.user_id}>
                  <td style={{ 
                    fontWeight: '600',
                    background: index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i 
                        className={`fas ${user.role === 'cdp' ? 'fa-user-tie' : 'fa-code'}`}
                        style={{ 
                          color: user.role === 'cdp' ? '#4F46E5' : '#059669',
                          fontSize: '1.1rem'
                        }}
                      ></i>
                      <span>{user.full_name}</span>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: user.role === 'cdp' ? '#E0E7FF' : '#D1FAE5',
                      color: user.role === 'cdp' ? '#4F46E5' : '#059669',
                      fontWeight: '600',
                      marginLeft: '28px',
                      display: 'block',
                      marginTop: '4px'
                    }}>
                      {user.role === 'cdp' ? 'CDP' : 'EXE'}
                    </span>
                  </td>
                  {monthKeys.map((monthKey, monthIdx) => {
                    const monthData = user.months[monthKey] || { exe: 0, cdp: 0 };
                    return (
                      <React.Fragment key={monthIdx}>
                        <td style={{ 
                          textAlign: 'center',
                          background: monthData.exe > 0 ? '#D1FAE5' : 'transparent',
                          fontWeight: monthData.exe > 0 ? '600' : '400',
                          color: monthData.exe > 0 ? '#059669' : 'var(--text-secondary)'
                        }}>
                          {monthData.exe > 0 ? Math.round(monthData.exe) : '-'}
                        </td>
                        <td style={{ 
                          textAlign: 'center',
                          background: monthData.cdp > 0 ? '#E0E7FF' : 'transparent',
                          fontWeight: monthData.cdp > 0 ? '600' : '400',
                          color: monthData.cdp > 0 ? '#4F46E5' : 'var(--text-secondary)'
                        }}>
                          {monthData.cdp > 0 ? Math.round(monthData.cdp) : '-'}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
          {summary.length > 0 && (
            <tfoot>
              <tr style={{ 
                background: 'var(--bg-tertiary)',
                fontWeight: '700',
                borderTop: '3px solid var(--border-primary)'
              }}>
                <td style={{ textAlign: 'left' }}>
                  <i className="fas fa-calculator"></i> TOTAL
                </td>
                {monthKeys.map((monthKey, monthIdx) => {
                  const exeTotal = summary.reduce((sum, user) => sum + (user.months[monthKey]?.exe || 0), 0);
                  const cdpTotal = summary.reduce((sum, user) => sum + (user.months[monthKey]?.cdp || 0), 0);
                  return (
                    <React.Fragment key={monthIdx}>
                      <td style={{ 
                        textAlign: 'center',
                        color: '#059669',
                        fontSize: '0.95rem'
                      }}>
                        {exeTotal > 0 ? Math.round(exeTotal) : '-'}
                      </td>
                      <td style={{ 
                        textAlign: 'center',
                        color: '#4F46E5',
                        fontSize: '0.95rem'
                      }}>
                        {cdpTotal > 0 ? Math.round(cdpTotal) : '-'}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Legend */}
      <div className="card-modern" style={{ marginTop: '16px', padding: '16px' }}>
        <h4 style={{ marginBottom: '12px' }}><i className="fas fa-info-circle"></i> Légende</h4>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              background: '#D1FAE5', 
              borderRadius: '4px',
              border: '2px solid #059669'
            }}></div>
            <span><strong>EXE</strong> - Points développeurs (Sprint + Projet + Bonus Client)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              background: '#E0E7FF', 
              borderRadius: '4px',
              border: '2px solid #4F46E5'
            }}></div>
            <span><strong>CDP</strong> - Points chefs de projet (Sprint + Projet + Bonus Client)</span>
          </div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <p><strong>Types de primes inclus :</strong></p>
          <ul style={{ marginLeft: '20px', marginTop: '4px' }}>
            <li><strong>Variable du Sprint :</strong> 50% des points distribués lors de la validation du sprint</li>
            <li><strong>Variable du Projet :</strong> 50% des points distribués lors de la validation finale du projet</li>
            <li><strong>Bonus Client :</strong> Bonus dégressif basé sur le pourcentage d'anomalies (0% = bonus complet, 100% = aucun bonus)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MonthlySummary;
