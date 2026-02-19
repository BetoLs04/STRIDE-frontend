import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: 'admin@stride.edu',
    password: 'admin123'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Email y contraseña son requeridos');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Enviando login a https://api.strideutmat.com/api/university/login');
      const response = await axios.post('https://api.strideutmat.com/api/university/login', {
        email: formData.email,
        password: formData.password
      });

      console.log('Respuesta del login:', response.data);

      if (response.data.success) {
        // El backend devuelve 'user' no 'admin'
        const userData = response.data.user;
        
        localStorage.setItem('stride_user', JSON.stringify(userData));
        
        if (onLogin) {
          onLogin(userData);
        }
        
        toast.success('¡Login exitoso!');
        navigate('/admin/dashboard');
      }
      
    } catch (error) {
      console.error('Error completo:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      if (error.response) {
        errorMessage = error.response.data?.error || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Iniciar Sesión</h2>
          <p className="auth-subtitle">Accede al sistema STRIDE University</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="admin@stride.edu"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="admin123"
              required
              disabled={loading}
            />
          </div>

          <div className="button-group">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </div>

          <div className="auth-footer">
            <p>
              ¿No tienes cuenta?{' '}
              <Link to="/create-superadmin" style={{ color: 'var(--secondary-blue)' }}>
                Crear Super Admin
              </Link>
            </p>
            <Link to="/" className="btn btn-text">
              ← Volver al inicio
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;