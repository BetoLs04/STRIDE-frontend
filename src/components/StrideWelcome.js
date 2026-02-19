import React from 'react';
import { useNavigate } from 'react-router-dom';

const StrideWelcome = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="stride-welcome-container">
      <div className="stride-hero">
        <div className="stride-hero-content">
          <div className="stride-logo">🎓</div>
          <h1 className="hero-title">STRIDE University</h1>
          <p className="hero-subtitle">
            Sistema Tecnológico para la Gestión y Desarrollo Educativo
          </p>
          
          {user && (
            <div className="welcome-user" style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              padding: '1rem', 
              borderRadius: '10px',
              marginTop: '2rem',
              backdropFilter: 'blur(10px)'
            }}>
              <h2 style={{ marginBottom: '0.5rem' }}>¡Bienvenido, {user.username}!</h2>
              <p>Has iniciado sesión correctamente en el sistema STRIDE</p>
            </div>
          )}
        </div>
      </div>

      <div className="stride-mission">
        <h2 className="mission-title">Nuestra Misión</h2>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
          En STRIDE University nos comprometemos a proporcionar una herramienta unica para
          la gestion de actividades academicas y administrativas, facilitando el desarrollo educativo
          a traves de tecnologia innovadora y soporte dedicado.
        </p>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">📚</div>
          <h3>Gestión Académica</h3>
          <p>Control de actividades realizados o por realizar</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">👨‍🏫</div>
          <h3>Panel Docente</h3>
          <p>Herramientas especializadas para el cuerpo docente</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <h3>Seguimiento Estudiantil</h3>
          <p>Monitoreo del progreso académico de cada estudiante</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Seguridad Total</h3>
          <p>Protección de datos con encriptación de última generación</p>
        </div>
      </div>

      <div className="button-group" style={{ justifyContent: 'center', marginTop: '3rem' }}>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/dashboard')}
        >
          Ir al Dashboard
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/')}
        >
          Volver al Inicio
        </button>
        {!user && (
          <button 
            className="btn btn-accent"
            onClick={() => navigate('/login')}
          >
            Iniciar Sesión
          </button>
        )}
      </div>
    </div>
  );
};

export default StrideWelcome;