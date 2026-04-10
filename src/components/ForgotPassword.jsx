import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi du lien');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>🔑 Mot de passe oublié</h1>
        <p style={{ marginBottom: '24px', color: '#64748b' }}>
          Entrez votre email pour recevoir un lien de réinitialisation
        </p>

        {success && (
          <div style={{
            background: '#d1fae5',
            color: '#065f46',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            ✅ Si cet email existe, un lien de réinitialisation a été envoyé
          </div>
        )}

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email professionnel</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: admin@gestpro.com"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link
            to="/auth/login"
            style={{ fontSize: '0.9rem', color: '#6366f1', textDecoration: 'none' }}
          >
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
