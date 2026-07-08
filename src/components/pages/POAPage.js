import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { ROUTES } from '../../constants/routes';
import { toast } from 'react-toastify';
import '../../styles/POAPage.css';
import { handleApiError } from '../../utils/errorHandler';
import useSocketEvent from '../../hooks/useSocketEvent';

const POAPage = ({ user }) => {
  const { seccionId } = useParams();
  const navigate = useNavigate();

  const puedeEditar = ['superadmin', 'directivo', 'personal'].includes(user?.tipo);
  const esSuperAdmin = user?.tipo === 'superadmin';

  const [seccion, setSeccion] = useState(null);
  const [encabezado, setEncabezado] = useState(null);
  const [columnas, setColumnas] = useState([]);
  const [filas, setFilas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [denied, setDenied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFila, setModalFila] = useState(null);
  const [modalKey, setModalKey] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const columnasActivas = columnas.filter(c => c.activa !== 0);
  const totalColumnas = columnasActivas.length;

  const getValor = (fila, key) => {
    try {
      const valores = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
      return valores[key] || '';
    } catch {
      return '';
    }
  };

  const setValorEnFila = (fila, key, value) => {
    const valores = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
    valores[key] = value;
    return valores;
  };

  const saveFila = async (fila, valores) => {
    const res = await api.put(`/api/university/poa-filas/${fila.id}`, { valores });
    setFilas(prev => prev.map(f => f.id === fila.id ? res.data.data : f));
    return res.data.data;
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [secRes, encRes, colRes, filasRes] = await Promise.all([
        api.get('/api/university/poa-secciones'),
        api.get('/api/university/poa-encabezado'),
        api.get('/api/university/poa-columnas'),
        api.get(`/api/university/poa-filas/${seccionId}`)
      ]);

      const found = (secRes.data.data || []).find(s => s.id === parseInt(seccionId));
      if (found && !esSuperAdmin) {
        const tieneAcceso = (found.usuarios || []).some(u => u.usuario_id === user?.id && u.usuario_tipo === user?.tipo);
        if (!tieneAcceso) {
          setDenied(true);
          setSeccion(null);
          setLoading(false);
          return;
        }
      }
      setSeccion(found || null);
      setEncabezado(encRes.data.data || null);
      setColumnas(colRes.data.data || []);
      setFilas(filasRes.data.data || []);
    } catch (error) {
      handleApiError(error, 'Error al cargar datos del POA');
    } finally {
      setLoading(false);
    }
  }, [seccionId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refreshRef = useRef();
  refreshRef.current = fetchAll;

  useSocketEvent('poa:updated', () => refreshRef.current());

  const openModal = (fila, key) => {
    setModalFila(fila);
    setModalKey(key);
    setModalValue(getValor(fila, key));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalFila(null);
    setModalKey('');
    setModalValue('');
  };

  const handleSaveModal = async () => {
    if (!modalFila) return;
    setModalSaving(true);
    try {
      const valores = setValorEnFila(modalFila, modalKey, modalValue);
      await saveFila(modalFila, valores);
      closeModal();
      toast.success('Celda guardada');
    } catch (error) {
      handleApiError(error, 'Error al guardar celda');
    } finally {
      setModalSaving(false);
    }
  };

  const handleAddFila = async () => {
    setAdding(true);
    try {
      const res = await api.post('/api/university/poa-filas', {
        seccion_id: parseInt(seccionId),
        valores: {}
      });
      setFilas(prev => [...prev, res.data.data]);
      toast.success('Fila agregada');
    } catch (error) {
      handleApiError(error, 'Error al agregar fila');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteFila = async (fila) => {
    if (!window.confirm('¿Eliminar esta fila?')) return;
    try {
      await api.delete(`/api/university/poa-filas/${fila.id}`);
      setFilas(prev => prev.filter(f => f.id !== fila.id));
      toast.success('Fila eliminada');
    } catch (error) {
      handleApiError(error, 'Error al eliminar fila');
    }
  };

  const goBack = () => {
    if (user?.tipo === 'superadmin') navigate(ROUTES.ADMIN_DASHBOARD, { state: { tab: 'poa' } });
    else if (user?.tipo === 'directivo') navigate(ROUTES.DIRECTIVO_DASHBOARD);
    else navigate(ROUTES.PERSONAL_DASHBOARD);
  };

  if (loading) {
    return (
      <div className="poa-page-container">
        <div className="loading">Cargando POA...</div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="poa-page-container">
        <div className="no-data" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h2>Permiso denegado</h2>
          <p style={{ marginBottom: '2rem', color: '#6b7280' }}>No tienes acceso a esta hoja del POA.</p>
          <button className="btn btn-secondary" onClick={goBack}>← Volver</button>
        </div>
      </div>
    );
  }

  if (!seccion) {
    return (
      <div className="poa-page-container">
        <div className="no-data">
          <p>Hoja no encontrada</p>
          <button className="btn btn-secondary" onClick={goBack}>← Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="poa-page-container">
      <div className="poa-page-toolbar">
        <button className="btn btn-secondary" onClick={goBack}>← Volver</button>
        <span className="poa-page-seccion">{seccion.nombre}</span>
        {puedeEditar && (
          <button className="btn btn-primary" onClick={handleAddFila} disabled={adding}>+ Agregar actividad</button>
        )}
      </div>

      <div className="poa-wrapper">
        <h1 className="poa-title">{encabezado?.direccion || 'DIRECCIÓN'}</h1>
        <h2 className="poa-subtitle">Programa Operativo Anual (POA) {encabezado?.anio || ''}{encabezado?.cuatrimestre ? ` — ${encabezado.cuatrimestre}` : ''}</h2>

        <div className="poa-table-wrapper">
          <table className="poa-table">
            <thead>
              <tr>
                {columnasActivas.map(col => (
                  <th key={col.id} style={{ textAlign: col.alineacion || 'center' }}>{col.nombre}</th>
                ))}
                {puedeEditar && <th className="poa-th-acciones">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={totalColumnas + (puedeEditar ? 1 : 0)} className="poa-td-empty">
                    Sin actividades registradas. {puedeEditar ? 'Haz clic en "+ Agregar actividad"' : ''}
                  </td>
                </tr>
              ) : (
                filas.map(fila => (
                  <tr key={fila.id}>
                    {columnasActivas.map((col, idx) => {
                      const key = `d_${col.id}`;
                      const colBloqueada = col.bloqueada;
                      const puedeEditarCol = puedeEditar && (esSuperAdmin || !colBloqueada);
                      return (
                        <td
                          key={col.id}
                          className={`poa-cell-td${!puedeEditarCol ? ' poa-cell-td-readonly' : ''}`}
                          style={{ textAlign: col.alineacion || 'center' }}
                          onClick={() => puedeEditarCol && openModal(fila, key)}
                        >
                          <span className="poa-cell-text">{getValor(fila, key) || (puedeEditarCol ? <span className="poa-cell-placeholder">Escribir...</span> : '')}</span>
                        </td>
                      );
                    })}
                    {puedeEditar && (
                      <td>
                        <button className="btn btn-danger btn-small" onClick={() => handleDeleteFila(fila)}>🗑️</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="poa-modal-overlay" onClick={closeModal}>
          <div className="poa-modal" onClick={e => e.stopPropagation()}>
            <div className="poa-modal-header">
              <h3>Editar celda</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="poa-modal-body">
              <textarea
                className="poa-modal-textarea"
                value={modalValue}
                onChange={e => setModalValue(e.target.value)}
                autoFocus
              />
            </div>
            <div className="poa-modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveModal} disabled={modalSaving}>
                {modalSaving ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POAPage;
