import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SuperAdminSeplade.css';

const SuperAdminSeplade = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="tab-content seplade-indicadores">
      <div className="tab-header">
        <h2>SEPLADE - Programación Anual de Metas de Indicadores de Desempeño</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={onClose}>← Volver al Dashboard</button>
          <button
            className="btn btn-success"
            onClick={() => navigate('/admin/seplade')}
          >
            Entrar a Hoja de SEPLADE
          </button>
        </div>
      </div>

      <div className="seplade-info-card">
        <div className="seplade-info-icon">📋</div>
        <div className="seplade-info-content">
          <h3>SEPLADE 2026</h3>
          <p>Programación Anual de Metas de Indicadores de Desempeño 2026</p>
          <p className="seplade-info-desc">
            Programa Presupuestario 12684. Programa Universidades Tecnológicas,
            subsidios para organismos descentralizados estatales (U006).
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSeplade;
