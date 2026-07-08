import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { ROUTES } from '../../constants/routes';
import { toast } from 'react-toastify';
import '../../styles/POAPage.css';
import { handleApiError } from '../../utils/errorHandler';
import useSocketEvent from '../../hooks/useSocketEvent';

const CUATRIMESTRES = [
  { label: '1° CUATRIMESTRE', prefix: 'c1' },
  { label: '2° CUATRIMESTRE', prefix: 'c2' },
  { label: '3° CUATRIMESTRE', prefix: 'c3' }
];

const COLUMNAS_FIJAS = [
  { key: 'actividad', label: 'ACTIVIDADES', className: 'poa-col-actividad' },
  { key: 'unidad_medida', label: 'UNIDAD DE MEDIDA', className: 'poa-col-angosta' },
  { key: 'meta', label: 'META CUATRIMESTRAL / ANUAL', className: 'poa-col-angosta' }
];

const POAPage = ({ user }) => {
  const { seccionId } = useParams();
  const navigate = useNavigate();

  const puedeEditar = ['superadmin', 'directivo', 'personal'].includes(user?.tipo);

  const [seccion, setSeccion] = useState(null);
  const [encabezado, setEncabezado] = useState(null);
  const [filas, setFilas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [denied, setDenied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFila, setModalFila] = useState(null);
  const [modalKey, setModalKey] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteModalFila, setNoteModalFila] = useState(null);
  const [noteModalKey, setNoteModalKey] = useState('');
  const [noteModalValue, setNoteModalValue] = useState('');
  const [noteModalSaving, setNoteModalSaving] = useState(false);

  const getNota = (fila, cellKey) => {
    try {
      const valores = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
      return valores[`_nota_${cellKey}`] || '';
    } catch {
      return '';
    }
  };

  const totalColumnas = COLUMNAS_FIJAS.length + CUATRIMESTRES.length * 4;

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
      const [secRes, encRes, filasRes] = await Promise.all([
        api.get('/api/university/poa-secciones'),
        api.get('/api/university/poa-encabezado'),
        api.get(`/api/university/poa-filas/${seccionId}`)
      ]);

      const found = (secRes.data.data || []).find(s => s.id === parseInt(seccionId));
      if (found && user?.tipo !== 'superadmin') {
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

  const openNoteModal = (fila, cellKey) => {
    setNoteModalFila(fila);
    setNoteModalKey(cellKey);
    setNoteModalValue(getNota(fila, cellKey));
    setNoteModalOpen(true);
  };

  const closeNoteModal = () => {
    setNoteModalOpen(false);
    setNoteModalFila(null);
    setNoteModalKey('');
    setNoteModalValue('');
  };

  const handleSaveNote = async () => {
    if (!noteModalFila) return;
    setNoteModalSaving(true);
    try {
      const valores = typeof noteModalFila.valores === 'string' ? JSON.parse(noteModalFila.valores) : (noteModalFila.valores || {});
      valores[`_nota_${noteModalKey}`] = noteModalValue;
      await saveFila(noteModalFila, valores);
      closeNoteModal();
      toast.success('Nota guardada');
    } catch (error) {
      handleApiError(error, 'Error al guardar nota');
    } finally {
      setNoteModalSaving(false);
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
      toast.success('Actividad agregada');
    } catch (error) {
      handleApiError(error, 'Error al agregar actividad');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteFila = async (fila) => {
    if (!window.confirm('¿Eliminar esta actividad?')) return;
    try {
      await api.delete(`/api/university/poa-filas/${fila.id}`);
      setFilas(prev => prev.filter(f => f.id !== fila.id));
      toast.success('Actividad eliminada');
    } catch (error) {
      handleApiError(error, 'Error al eliminar actividad');
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
        <h1 className="poa-title">{seccion.nombre}</h1>

        <div className="poa-table-wrapper">
          <table className="poa-table">
            <thead>
              <tr className="poa-th-row-1">
                {COLUMNAS_FIJAS.map(col => (
                  <th key={col.key} className={col.className || ''} rowSpan={4}>{col.label}</th>
                ))}
                <th className="poa-th-datos" colSpan={12}>CALENDARIO {encabezado?.anio || ''} CUATRIMESTRAL</th>
                {puedeEditar && <th className="poa-th-acciones" rowSpan={4}>Acciones</th>}
              </tr>
              <tr className="poa-th-row-2">
                {CUATRIMESTRES.map(c => (
                  <th key={c.prefix} className="poa-th-cuatri" colSpan={4}>{c.label}</th>
                ))}
              </tr>
              <tr className="poa-th-row-3">
                {CUATRIMESTRES.map(c => (
                  <React.Fragment key={c.prefix}>
                    <th className="poa-th-prog" colSpan={2}>PROG</th>
                    <th className="poa-th-alc" colSpan={2}>ALC</th>
                  </React.Fragment>
                ))}
              </tr>
              <tr className="poa-th-row-4">
                {CUATRIMESTRES.map(c => (
                  <React.Fragment key={c.prefix}>
                    <th>#</th>
                    <th>%</th>
                    <th>#</th>
                    <th>%</th>
                  </React.Fragment>
                ))}
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
                    {COLUMNAS_FIJAS.map(col => {
                      const puedeEditarCelda = user?.tipo === 'superadmin';
                      return (
                        <td
                          key={col.key}
                          className={`poa-cell-td ${col.className || ''}${!puedeEditarCelda ? ' poa-cell-td-readonly' : ''}`}
                          onClick={() => puedeEditarCelda && openModal(fila, col.key)}
                        >
                          <span className="poa-cell-text">{getValor(fila, col.key) || (puedeEditarCelda ? <span className="poa-cell-placeholder">Escribir...</span> : '')}</span>
                        </td>
                      );
                    })}
                    {CUATRIMESTRES.map(c => (
                      <React.Fragment key={c.prefix}>
                        {['prog_num', 'prog_pct', 'alc_num', 'alc_pct'].map(suf => {
                          const key = `${c.prefix}_${suf}`;
                          const esALC = suf.startsWith('alc');
                          const puedeEditarCelda = esALC ? puedeEditar : (user?.tipo === 'superadmin');
                          return (
                            <td
                              key={key}
                              className={`poa-cell-td poa-cell-cuatri${esALC ? ' poa-cell-alc' : ' poa-cell-prog'}${!puedeEditarCelda ? ' poa-cell-td-readonly' : ''}`}
                              onClick={() => puedeEditarCelda && openModal(fila, key)}
                            >
                              <span className="poa-cell-text">{getValor(fila, key) || (puedeEditarCelda ? <span className="poa-cell-placeholder">—</span> : '')}</span>
                              {esALC && puedeEditar && (
                                <div className="poa-cell-actions">
                                  {getNota(fila, key) && <span className="poa-note-indicator" />}
                                  <button
                                    className="poa-note-btn"
                                    title="Nota"
                                    onClick={e => { e.stopPropagation(); openNoteModal(fila, key); }}
                                  >📝</button>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </React.Fragment>
                    ))}
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

      {noteModalOpen && (
        <div className="poa-modal-overlay" onClick={closeNoteModal}>
          <div className="poa-modal" onClick={e => e.stopPropagation()}>
            <div className="poa-modal-header">
              <h3>Nota</h3>
              <button className="close-btn" onClick={closeNoteModal}>×</button>
            </div>
            <div className="poa-modal-body">
              <textarea
                className="poa-modal-textarea"
                value={noteModalValue}
                onChange={e => setNoteModalValue(e.target.value)}
                autoFocus
                placeholder="Escribe una nota o justificación..."
              />
            </div>
            <div className="poa-modal-footer">
              <button className="btn btn-secondary" onClick={closeNoteModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveNote} disabled={noteModalSaving}>
                {noteModalSaving ? 'Guardando...' : '💾 Guardar nota'}
              </button>
            </div>
          </div>
        </div>
      )}

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
