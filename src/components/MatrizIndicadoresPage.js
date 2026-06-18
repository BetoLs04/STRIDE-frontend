import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/MatrizIndicadoresPage.css';

const API_URL = 'https://api1.strideutmat.com';

const COLUMNAS_RESULTADO = [
  '1er Cuatrimestre',
  '2do Cuatrimestre',
  '3er Cuatrimestre',
  'Anual'
];

const MatrizIndicadoresPage = () => {
  const { seccionId } = useParams();
  const navigate = useNavigate();

  const [seccion, setSeccion] = useState(null);
  const [encabezado, setEncabezado] = useState(null);
  const [columnas, setColumnas] = useState([]);
  const [filas, setFilas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const columnasActivas = columnas.filter(c => c.activa !== 0);
  const totalColumnas = columnasActivas.length + COLUMNAS_RESULTADO.length;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [secRes, encRes, colRes, filasRes] = await Promise.all([
        axios.get(`${API_URL}/api/university/matriz-secciones`),
        axios.get(`${API_URL}/api/university/matriz-encabezado`),
        axios.get(`${API_URL}/api/university/matriz-columnas`),
        axios.get(`${API_URL}/api/university/matriz-filas/${seccionId}`)
      ]);

      const found = (secRes.data.data || []).find(s => s.id === parseInt(seccionId));
      setSeccion(found || null);
      setEncabezado(encRes.data.data || null);
      setColumnas(colRes.data.data || []);
      setFilas(filasRes.data.data || []);
    } catch (error) {
      toast.error('Error al cargar datos de la matriz');
    } finally {
      setLoading(false);
    }
  }, [seccionId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getValor = (fila, key) => {
    try {
      const valores = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
      return valores[key] || '';
    } catch {
      return '';
    }
  };

  const handleCellChange = async (fila, key, value) => {
    const valores = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
    valores[key] = value;
    try {
      const res = await axios.put(`${API_URL}/api/university/matriz-filas/${fila.id}`, { valores });
      setFilas(prev => prev.map(f => f.id === fila.id ? res.data.data : f));
    } catch (error) {
      toast.error('Error al guardar celda');
    }
  };

  const handleAddFila = async () => {
    setAdding(true);
    try {
      const res = await axios.post(`${API_URL}/api/university/matriz-filas`, {
        seccion_id: parseInt(seccionId),
        valores: {}
      });
      setFilas(prev => [...prev, res.data.data]);
      toast.success('Fila agregada');
    } catch (error) {
      toast.error('Error al agregar fila');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteFila = async (fila) => {
    if (!window.confirm('¿Eliminar esta fila?')) return;
    try {
      await axios.delete(`${API_URL}/api/university/matriz-filas/${fila.id}`);
      setFilas(prev => prev.filter(f => f.id !== fila.id));
      toast.success('Fila eliminada');
    } catch (error) {
      toast.error('Error al eliminar fila');
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

  return (
    <div className="matriz-page-container">
      <div className="matriz-page-toolbar">
        <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>← Volver al Dashboard</button>
        <span className="matriz-page-seccion">{seccion.nombre}</span>
        <button className="btn btn-primary" onClick={handleAddFila} disabled={adding}>+ Agregar fila</button>
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

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {columnasActivas.map((col) => (
                  <th key={col.id}>{col.nombre}</th>
                ))}
                {COLUMNAS_RESULTADO.map((col, i) => (
                  <th key={i} className={col === 'Anual' ? 'anual' : 'resultado'}>{col}</th>
                ))}
                <th className="th-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={totalColumnas + 1} className="td-empty">Sin filas registradas. Haz clic en "+ Agregar fila"</td>
                </tr>
              ) : (
                filas.map((fila) => (
                  <tr key={fila.id}>
                    {columnasActivas.map((col) => (
                      <td key={col.id}>
                        <input
                          className="cell-input"
                          value={getValor(fila, `d_${col.id}`)}
                          onChange={e => handleCellChange(fila, `d_${col.id}`, e.target.value)}
                        />
                      </td>
                    ))}
                    {COLUMNAS_RESULTADO.map((_, i) => (
                      <td key={i}>
                        <input
                          className="cell-input"
                          value={getValor(fila, `f_${i}`)}
                          onChange={e => handleCellChange(fila, `f_${i}`, e.target.value)}
                        />
                      </td>
                    ))}
                    <td>
                      <button className="btn btn-danger btn-small" onClick={() => handleDeleteFila(fila)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MatrizIndicadoresPage;
