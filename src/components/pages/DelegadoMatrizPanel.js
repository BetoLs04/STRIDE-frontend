import React from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminMatrizIndicadores from './SuperAdminMatrizIndicadores';
import '../../styles/SuperAdminMatrizIndicadores.css';

const DelegadoMatrizPanel = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="delegado-matriz-panel" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Panel de Gestión - Matriz de Indicadores</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem' }}>
            Delegado
          </span>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            ← Volver al inicio
          </button>
        </div>
      </div>
      <SuperAdminMatrizIndicadores onClose={() => navigate('/')} />
    </div>
  );
};

export default DelegadoMatrizPanel;