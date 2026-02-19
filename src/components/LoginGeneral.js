import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const LoginGeneral = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [superAdminExists, setSuperAdminExists] = useState(false);
  const [checkingSuperAdmin, setCheckingSuperAdmin] = useState(true);

  useEffect(() => {
    // Verificar si ya existe un super admin
    checkSuperAdminExistence();
  }, []);

  const checkSuperAdminExistence = async () => {
    try {
      const response = await axios.get('/api/university/superusers');
      const hasSuperAdmin = response.data.data && response.data.data.length > 0;
      setSuperAdminExists(hasSuperAdmin);
      console.log('¿Super Admin existe?', hasSuperAdmin);
    } catch (error) {
      console.error('Error verificando super admin:', error);
      setSuperAdminExists(false);
    } finally {
      setCheckingSuperAdmin(false);
    }
  };

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
      console.log('Intentando login general con:', formData.email);
      
      const response = await axios.post('/api/university/login-general', {
        email: formData.email,
        password: formData.password
      });

      console.log('Respuesta del servidor:', response.data);

      if (response.data.success && response.data.user) {
        const userData = response.data.user;
        console.log('Usuario autenticado:', userData);
        
        // Guardar en localStorage
        localStorage.setItem('stride_user', JSON.stringify(userData));
        
        // Llamar a onLogin callback
        if (onLogin) {
          onLogin(userData);
        }
        
        toast.success(`¡Bienvenido ${userData.nombre || userData.username}!`);
        
        // Redirigir según tipo de usuario
        navigate('/')
      }
      
    } catch (error) {
      console.error('Error completo:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.response) {
        errorMessage = error.response.data?.error || errorMessage;
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Credenciales de prueba para desarrollo

  if (checkingSuperAdmin) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Verificando configuración del sistema...</p>
          </div>
        </div>
      </div>
    );
  }

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
              placeholder="usuario@stride.edu"
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
              placeholder="Tu contraseña"
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
          
            {!superAdminExists && (
              <div className="warning-note">
                <small>⚠️ No hay Super Admin configurado. Contacta al administrador del sistema.</small>
              </div>
            )}


          <div className="auth-footer">
            {/* Solo mostrar enlace para crear super admin si NO existe ninguno */}
            {!superAdminExists ? (
              <p>
                ¿Eres el primer administrador?{' '}
                <Link to="/create-superadmin" style={{ color: 'var(--secondary-blue)', fontWeight: 'bold' }}>
                  Crear cuenta de Super Admin
                </Link>
              </p>
            ) : (
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                Sistema configurado correctamente
              </p>
            )}
            <Link to="/" className="btn btn-text">
              ← Volver al inicio
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginGeneral;