import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/MatrizIndicadoresPage.css';

const API_URL = 'https://api1.strideutmat.com';

const COLUMNAS_FIJAS = [
  'Nombre del Indicador',
  'Objetivo de Calidad',
  'Descripción del Indicador',
  'Fórmula',
  'Unidad de Medida',
  'Frecuencia de Medición',
  'Meta',
  'Sentido del Indicador'
];

const MatrizIndicadoresPage = () => {
  const { seccionId } = useParams();
  const navigate = useNavigate();

  const [seccion, setSeccion] = useState(null);
  const [encabezado, setEncabezado] = useState(null);
  const [columnas, setColumnas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, [seccionId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [secRes, encRes, colRes] = await Promise.all([
        axios.get(`${API_URL}/api/university/matriz-secciones`),
        axios.get(`${API_URL}/api/university/matriz-encabezado`),
        axios.get(`${API_URL}/api/university/matriz-columnas`)
      ]);

      const found = (secRes.data.data || []).find(s => s.id === parseInt(seccionId));
      setSeccion(found || null);
      setEncabezado(encRes.data.data || null);
      setColumnas(colRes.data.data || []);
    } catch (error) {
      toast.error('Error al cargar datos de la matriz');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="matriz-page-container">
        <div className="loading">Cargando matriz de indicadores...</div>
      </div>
    );
  }

  if (!seccion) {
    return (
      <div className="matriz-page-container">
        <div className="no-data">
          <p>Sección no encontrada</p>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>← Volver</button>
        </div>
      </div>
    );
  }

  const columnasActivas = columnas.filter(c => c.activa !== 0);

  return (
    <div className="matriz-page-container">
      <div className="matriz-page-toolbar">
        <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>← Volver al Dashboard</button>
        <span className="matriz-page-seccion">{seccion.nombre}</span>
      </div>

      <div className="wrapper">
        <div className="header-row">
          <div className="logo-cell">Logo</div>
          <div className="title-cell">MATRIZ DE INDICADORES</div>
          <div className="ficha-cell">
            <div className="ficha-row">
              <div className="ficha-label">Código</div>
              <div className="ficha-value">{encabezado?.codigo || ''}</div>
            </div>
            <div className="ficha-row">
              <div className="ficha-label">Revisión</div>
              <div className="ficha-value">{encabezado?.revision || ''}</div>
            </div>
            <div className="ficha-row">
              <div className="ficha-label">Fecha de actualización</div>
              <div className="ficha-value">{encabezado?.fecha_actualizacion || ''}</div>
            </div>
          </div>
        </div>

        <div className="meta-row">
          <div className="meta-cell"><span>Fecha de revisión de indicadores:</span> {encabezado?.fecha_revision_indicadores || ''}</div>
          <div className="meta-cell"><span>Responsable de la matriz:</span> {encabezado?.responsable || ''}</div>
          <div className="meta-cell"><span>Año:</span> {encabezado?.anio || ''}</div>
        </div>

        <div className="resultados-banner">RESULTADOS</div>

        <table>
          <thead>
            <tr>
              {COLUMNAS_FIJAS.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
              {columnasActivas.map((col) => (
                <th key={col.id} className={col.nombre.toLowerCase() === 'anual' ? 'anual' : 'resultado'}>{col.nombre}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="empty">
              {COLUMNAS_FIJAS.map((_, i) => <td key={i}></td>)}
              {columnasActivas.map((col) => <td key={col.id}></td>)}
            </tr>
            <tr className="empty">
              {COLUMNAS_FIJAS.map((_, i) => <td key={i}></td>)}
              {columnasActivas.map((col) => <td key={col.id}></td>)}
            </tr>
            <tr className="empty">
              {COLUMNAS_FIJAS.map((_, i) => <td key={i}></td>)}
              {columnasActivas.map((col) => <td key={col.id}></td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatrizIndicadoresPage;
