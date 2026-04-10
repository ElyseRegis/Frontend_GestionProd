import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [verifying, setVerifying] = useState(true);
  const [inviteError, setInviteError] = useState('');

  // Verify invitation token on mount
  useEffect(() => {
    const verifyInvitation = async () => {
      try {
        const response = await api.get(`/invitations/verify/${token}`);
        if (response.data.valid) {
          setInvitation(response.data);
          setFormData(prev => ({ ...prev, email: response.data.email }));
        } else {
          setInviteError('Invitation invalide ou expirée');
        }
      } catch (err) {
        setInviteError('Invitation invalide ou expirée');
      } finally {
        setVerifying(false);
      }
    };

    verifyInvitation();
  }, [token]);

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate fields
    if (!formData.first_name.trim() || formData.first_name.length < 2) {
      newErrors.first_name = 'Prénom requis (min. 2 caractères)';
    }
    if (!formData.last_name.trim() || formData.last_name.length < 2) {
      newErrors.last_name = 'Nom requis (min. 2 caractères)';
    }
    if (!validatePassword(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 chiffre et 1 caractère spécial';
    }
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Les mots de passe ne correspondent pas';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        token,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: invitation.email,
        password: formData.password
      });

      // Auto-login after registration
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect based on role
      if (response.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (response.data.user.role === 'cdp') {
        navigate('/cdp/dashboard');
      } else {
        navigate('/dev/dashboard');
      }
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Erreur lors de l\'inscription' });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="login-page">
        <div className="loading-spinner">Vérification de l'invitation...</div>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>❌ Invitation invalide</h1>
          <p style={{ color: '#dc2626', marginTop: '16px' }}>{inviteError}</p>
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Link to="/auth/login" style={{ color: '#6366f1' }}>
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '600px' }}>
        <h1>🎉 Bienvenue !</h1>
        <p style={{ marginBottom: '24px', color: '#64748b' }}>
          Vous avez été invité à rejoindre <strong>{invitation?.organization || 'GestPro+'}</strong> en tant que <strong>{invitation?.role}</strong>
        </p>

        {errors.submit && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-row">
            <div className="form-group">
              <label>Prénom *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Jean"
                className={errors.first_name ? 'error' : ''}
                autoFocus
              />
              {errors.first_name && (
                <p className="error-message">{errors.first_name}</p>
              )}
            </div>

            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Dupont"
                className={errors.last_name ? 'error' : ''}
              />
              {errors.last_name && (
                <p className="error-message">{errors.last_name}</p>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Email professionnel</label>
            <input
              type="email"
              value={formData.email}
              disabled
              style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
            />
            <p className="help-text">Cet email a été fourni par l'administrateur</p>
          </div>

          <div className="form-group">
            <label>Mot de passe *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 8 caractères, 1 maj., 1 chiffre, 1 spécial"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && (
              <p className="error-message">{errors.password}</p>
            )}
            <p className="help-text">
              Exemple: MonMotDePasse123!
            </p>
          </div>

          <div className="form-group">
            <label>Confirmer le mot de passe *</label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Retapez votre mot de passe"
              className={errors.confirm_password ? 'error' : ''}
            />
            {errors.confirm_password && (
              <p className="error-message">{errors.confirm_password}</p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Inscription...</>
            ) : (
              <><i className="fas fa-check"></i> Créer mon compte</>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link to="/auth/login" style={{ color: '#6366f1' }}>
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
