import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/SMOAPage.css';

const API_URL = 'https://api1.strideutmat.com';

const COLUMNAS_FIJAS = [
  { id: 'dir_nombre', nombre: 'Nombre de la Dirección' },
  { id: 'pres_archivo', nombre: 'Presentación' }
];

const SMOAPage = ({ user }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const esSuperAdmin = user?.tipo === 'superadmin';
  const puedeEditar = esSuperAdmin;
  const puedeSubirPptx = !esSuperAdmin;

  const [encabezado, setEncabezado] = useState(null);
  const [columnas, setColumnas] = useState([]);
  const [filas, setFilas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [adding, setAdding] = useState(false);

  const [uploadingFila, setUploadingFila] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalFila, setModalFila] = useState(null);
  const [modalKey, setModalKey] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const columnasActivas = columnas.filter(c => c.activa !== 0);
  const totalColumnas = COLUMNAS_FIJAS.length + columnasActivas.length;

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
    const res = await axios.put(`${API_URL}/api/university/smoa-filas/${fila.id}`, { valores });
    setFilas(prev => prev.map(f => f.id === fila.id ? res.data.data : f));
    return res.data.data;
  };

  const checkAccess = useCallback(async () => {
    if (esSuperAdmin) return true;
    try {
      const res = await axios.get(`${API_URL}/api/university/smoa-usuarios`);
      const asignados = res.data.data || [];
      return asignados.some(u => u.usuario_id === user?.id && u.usuario_tipo === user?.tipo);
    } catch {
      return false;
    }
  }, [esSuperAdmin, user]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      if (!esSuperAdmin) {
        const tieneAcceso = await checkAccess();
        if (!tieneAcceso) {
          setDenied(true);
          setLoading(false);
          return;
        }
      }

      const [encRes, colRes, filasRes] = await Promise.all([
        axios.get(`${API_URL}/api/university/smoa-encabezado`),
        axios.get(`${API_URL}/api/university/smoa-columnas`),
        axios.get(`${API_URL}/api/university/smoa-filas`)
      ]);

      setEncabezado(encRes.data.data || null);
      setColumnas(colRes.data.data || []);
      setFilas(filasRes.data.data || []);
    } catch (error) {
      toast.error('Error al cargar datos SMOA');
    } finally {
      setLoading(false);
    }
  }, [checkAccess, esSuperAdmin]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAddFila = async () => {
    setAdding(true);
    try {
      const res = await axios.post(`${API_URL}/api/university/smoa-filas`, { valores: {} });
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
      const filename = getValor(fila, 'pres_archivo');
      await axios.delete(`${API_URL}/api/university/smoa-filas/${fila.id}`);
      setFilas(prev => prev.filter(f => f.id !== fila.id));
      toast.success('Fila eliminada');
    } catch (error) {
      toast.error('Error al eliminar fila');
    }
  };

  const handleUploadPptx = async (fila, file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pptx')) {
      toast.error('Solo se permiten archivos .pptx');
      return;
    }

    setUploadingFila(fila.id);
    try {
      const formData = new FormData();
      formData.append('pptx', file);

      const res = await axios.put(`${API_URL}/api/university/smoa-filas/${fila.id}/pptx`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFilas(prev => prev.map(f => f.id === fila.id ? res.data.data : f));
      toast.success('Presentación subida exitosamente');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al subir archivo');
    } finally {
      setUploadingFila(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (fila) => {
    if (!puedeEditar) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pptx';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) handleUploadPptx(fila, file);
    };
    input.click();
  };

  const handleEliminarPptx = async (fila) => {
    if (!window.confirm('¿Eliminar esta presentación?')) return;
    try {
      const res = await axios.put(`${API_URL}/api/university/smoa-filas/${fila.id}/pptx`, { eliminar: 'true' });
      setFilas(prev => prev.map(f => f.id === fila.id ? res.data.data : f));
      toast.success('Presentación eliminada');
    } catch (error) {
      toast.error('Error al eliminar presentación');
    }
  };

  const openModal = (fila, key) => {
    if (!puedeEditar) return;
    if (key === 'pres_archivo') return;
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
      toast.error('Error al guardar celda');
    } finally {
      setModalSaving(false);
    }
  };

  const goBack = () => {
    if (esSuperAdmin) navigate('/admin/dashboard', { state: { tab: 'smoa' } });
    else if (user?.tipo === 'directivo') navigate('/directivo/dashboard');
    else navigate('/personal/dashboard');
  };

  if (loading) {
    return (
      <div className="smoa-page-container">
        <div className="loading">Cargando SMOA...</div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="smoa-page-container">
        <div className="no-data" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⛔</div>
          <h2>Permiso denegado</h2>
          <p style={{ marginBottom: '2rem', color: '#6b7280' }}>No tienes acceso al SMOA.</p>
          <button className="btn btn-secondary" onClick={goBack}>← Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="smoa-page-container">
      <div className="smoa-page-toolbar">
        <button className="btn btn-secondary" onClick={goBack}>← Volver</button>
        {puedeEditar && (
          <button className="btn btn-primary" onClick={handleAddFila} disabled={adding}>
            {adding ? '...' : '+ Agregar fila'}
          </button>
        )}
      </div>

      <div className="smoa-page-title">
        <h1>Seguimiento Mensual de Objetivos Anuales</h1>
      </div>

      {encabezado?.contenido && (
        <div className="smoa-encabezado-contenido" dangerouslySetInnerHTML={{ __html: encabezado.contenido }} />
      )}

      <div className="smoa-table-wrapper">
        <table className="smoa-table">
          <thead>
            <tr>
              {COLUMNAS_FIJAS.map(col => (
                <th key={col.id} className="smoa-th-fija">{col.nombre}</th>
              ))}
              {columnasActivas.map((col) => (
                <th key={col.id}>{col.nombre}</th>
              ))}
              {puedeEditar && <th className="smoa-th-acciones">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={totalColumnas + (puedeEditar ? 1 : 0)} className="smoa-td-empty">
                  Sin filas registradas. {puedeEditar ? 'Haz clic en "+ Agregar fila"' : ''}
                </td>
              </tr>
            ) : (
              filas.map((fila) => (
                <tr key={fila.id}>
                  <td
                    className={`smoa-cell smoa-cell-fija${!puedeEditar ? ' smoa-cell-readonly' : ''}`}
                    onClick={() => openModal(fila, 'dir_nombre')}
                  >
                    <span className="smoa-cell-text">{getValor(fila, 'dir_nombre') || (puedeEditar ? <span className="smoa-cell-placeholder">Escribir...</span> : '')}</span>
                  </td>
                  <td className="smoa-cell smoa-cell-fija smoa-cell-pptx">
                    {getValor(fila, 'pres_archivo') ? (
                      <div className="smoa-pptx-actions">
                        <a
                          href={`${API_URL}/api/university/smoa-uploads/${getValor(fila, 'pres_archivo')}`}
                          className="smoa-pptx-link"
                          download
                        >
                          Descargar
                        </a>
                        {(puedeEditar || puedeSubirPptx) && (
                          <button className="btn btn-secondary btn-small" onClick={() => handleFileSelect(fila)}>Reemplazar</button>
                        )}
                        {puedeEditar && (
                          <button className="btn btn-danger btn-small" onClick={() => handleEliminarPptx(fila)}>Eliminar</button>
                        )}
                      </div>
                    ) : (
                      (puedeEditar || puedeSubirPptx) ? (
                        <button
                          className="smoa-pptx-upload-btn"
                          onClick={() => handleFileSelect(fila)}
                          disabled={uploadingFila === fila.id}
                        >
                          {uploadingFila === fila.id ? '...' : 'Subir .pptx'}
                        </button>
                      ) : (
                        <span className="smoa-cell-placeholder">—</span>
                      )
                    )}
                  </td>
                  {columnasActivas.map((col) => {
                    const key = `d_${col.id}`;
                    return (
                      <td
                        key={col.id}
                        className={`smoa-cell${!puedeEditar ? ' smoa-cell-readonly' : ''}`}
                        onClick={() => openModal(fila, key)}
                      >
                        <span className="smoa-cell-text">{getValor(fila, key) || (puedeEditar ? <span className="smoa-cell-placeholder">Escribir...</span> : '')}</span>
                      </td>
                    );
                  })}
                  {puedeEditar && (
                    <td className="smoa-cell-acciones">
                      <button className="smoa-btn-delete" onClick={() => handleDeleteFila(fila)} title="Eliminar fila">Eliminar</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="cell-modal-overlay" onClick={closeModal}>
          <div className="cell-modal" onClick={e => e.stopPropagation()}>
            <div className="cell-modal-header">
              <h3>Editar celda</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="cell-modal-body">
              <textarea
                className="cell-modal-textarea"
                value={modalValue}
                onChange={e => setModalValue(e.target.value)}
                autoFocus
              />
            </div>
            <div className="cell-modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveModal} disabled={modalSaving}>
                {modalSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMOAPage;
