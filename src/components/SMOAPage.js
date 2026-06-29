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

  const [encabezado, setEncabezado] = useState(null);
  const [columnas, setColumnas] = useState([]);
  const [filas, setFilas] = useState([]);
  const [permisosPptx, setPermisosPptx] = useState({});
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [adding, setAdding] = useState(false);

  const [uploadingFila, setUploadingFila] = useState(null);

  const puedeSubirPptxFila = (filaId) => {
    if (esSuperAdmin) return true;
    const filaPermisos = permisosPptx[filaId] || [];
    return filaPermisos.some(p => p.usuario_id === user?.id && p.usuario_tipo === user?.tipo && p.puede_subir);
  };
  const puedeCambiarPptxFila = (filaId) => {
    if (esSuperAdmin) return true;
    const filaPermisos = permisosPptx[filaId] || [];
    return filaPermisos.some(p => p.usuario_id === user?.id && p.usuario_tipo === user?.tipo && p.puede_cambiar);
  };
  const puedeEliminarPptxFila = (filaId) => {
    if (esSuperAdmin) return true;
    const filaPermisos = permisosPptx[filaId] || [];
    return filaPermisos.some(p => p.usuario_id === user?.id && p.usuario_tipo === user?.tipo && p.puede_eliminar);
  };
  const puedeVerPptxFila = (filaId) => {
    if (esSuperAdmin) return true;
    const filaPermisos = permisosPptx[filaId] || [];
    return filaPermisos.some(p => p.usuario_id === user?.id && p.usuario_tipo === user?.tipo && (p.puede_subir || p.puede_cambiar || p.puede_eliminar));
  };

  // Permission helpers for column cells
  const getUploadedBy = (fila, key) => {
    const valores = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
    return valores[`${key}_uploaded_by`] || null;
  };

  const esPropietario = (fila, key) => {
    const uploadedBy = getUploadedBy(fila, key);
    if (!uploadedBy) return false;
    return uploadedBy === `${user?.id}_${user?.tipo}`;
  };

  const puedeSubirColumna = (columna) => {
    if (esSuperAdmin) return true;
    if (columna.permiso_subida === 'solo_admin') return false;
    return true;
  };

  const puedeCambiarColumna = (fila, columna) => {
    const key = `d_${columna.id}`;
    if (esSuperAdmin) return true;
    if (columna.permiso_subida === 'solo_admin') return false;
    if (esPropietario(fila, key)) return true;
    return false;
  };

  const puedeEliminarColumna = (fila, columna) => {
    return puedeCambiarColumna(fila, columna);
  };

  // Modal for text type columns
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFila, setModalFila] = useState(null);
  const [modalKey, setModalKey] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  // Modal for enlace type columns
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalFila, setLinkModalFila] = useState(null);
  const [linkModalColumna, setLinkModalColumna] = useState(null);
  const [linkModalValue, setLinkModalValue] = useState('');
  const [linkModalSaving, setLinkModalSaving] = useState(false);

  // File upload state for documento columns
  const [uploadingColFile, setUploadingColFile] = useState(null);
  const [uploadingColFila, setUploadingColFila] = useState(null);
  const [uploadingColColumna, setUploadingColColumna] = useState(null);

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

      const [encRes, colRes, filasRes, permisosRes] = await Promise.all([
        axios.get(`${API_URL}/api/university/smoa-encabezado`),
        axios.get(`${API_URL}/api/university/smoa-columnas`),
        axios.get(`${API_URL}/api/university/smoa-filas`),
        esSuperAdmin ? Promise.resolve({ data: { data: {} } }) : axios.get(`${API_URL}/api/university/smoa-permisos-pptx`)
      ]);

      setEncabezado(encRes.data.data || null);
      setColumnas(colRes.data.data || []);
      setFilas(filasRes.data.data || []);
      if (!esSuperAdmin && permisosRes.data?.data) {
        setPermisosPptx(permisosRes.data.data);
      }
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
    if (!puedeEditar && !puedeSubirPptxFila(fila.id) && !puedeCambiarPptxFila(fila.id)) return;
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

  // Handlers for text-type cells
  const openTextModal = (fila, key, columna) => {
    if (!puedeCambiarColumna(fila, columna)) return;
    setModalFila(fila);
    setModalKey(key);
    setModalColumna(columna);
    setModalValue(getValor(fila, key));
    setModalOpen(true);
  };

  const closeTextModal = () => {
    setModalOpen(false);
    setModalFila(null);
    setModalKey('');
    setModalColumna(null);
    setModalValue('');
  };

  const handleSaveTextModal = async () => {
    if (!modalFila) return;
    setModalSaving(true);
    try {
      const valores = setValorEnFila(modalFila, modalKey, modalValue);
      valores[`${modalKey}_uploaded_by`] = `${user?.id}_${user?.tipo}`;
      await saveFila(modalFila, valores);
      closeTextModal();
      toast.success('Celda guardada');
    } catch (error) {
      toast.error('Error al guardar celda');
    } finally {
      setModalSaving(false);
    }
  };

  // Handlers for enlace-type cells
  const openLinkModal = (fila, columna) => {
    if (!puedeCambiarColumna(fila, columna)) return;
    const key = `d_${columna.id}`;
    setLinkModalFila(fila);
    setLinkModalColumna(columna);
    setLinkModalValue(getValor(fila, key));
    setLinkModalOpen(true);
  };

  const closeLinkModal = () => {
    setLinkModalOpen(false);
    setLinkModalFila(null);
    setLinkModalColumna(null);
    setLinkModalValue('');
  };

  const handleSaveLinkModal = async () => {
    if (!linkModalFila || !linkModalColumna) return;
    setLinkModalSaving(true);
    try {
      const key = `d_${linkModalColumna.id}`;
      const valores = setValorEnFila(linkModalFila, key, linkModalValue);
      valores[`${key}_uploaded_by`] = `${user?.id}_${user?.tipo}`;
      await saveFila(linkModalFila, valores);
      closeLinkModal();
      toast.success('Enlace guardado');
    } catch (error) {
      toast.error('Error al guardar enlace');
    } finally {
      setLinkModalSaving(false);
    }
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Enlace copiado al portapapeles');
    }).catch(() => {
      toast.error('Error al copiar enlace');
    });
  };

  const handleDeleteLink = async (fila, columna) => {
    if (!window.confirm('¿Eliminar este enlace?')) return;
    try {
      const key = `d_${columna.id}`;
      const valores = setValorEnFila(fila, key, '');
      delete valores[`${key}_uploaded_by`];
      await saveFila(fila, valores);
      toast.success('Enlace eliminado');
    } catch (error) {
      toast.error('Error al eliminar enlace');
    }
  };

  // Handlers for documento-type cells
  const handleUploadColFile = async (fila, columna, file) => {
    if (!file) return;
    setUploadingColFila(fila.id);
    setUploadingColColumna(columna.id);
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      formData.append('usuario_id', user?.id);
      formData.append('usuario_tipo', user?.tipo);

      const res = await axios.post(
        `${API_URL}/api/university/smoa-filas/${fila.id}/columna/${columna.id}/subir`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setFilas(prev => prev.map(f => f.id === fila.id ? res.data.data : f));
      toast.success('Archivo subido exitosamente');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al subir archivo');
    } finally {
      setUploadingColFila(null);
      setUploadingColColumna(null);
    }
  };

  const handleDeleteColFile = async (fila, columna) => {
    if (!window.confirm('¿Eliminar este archivo?')) return;
    try {
      const res = await axios.delete(
        `${API_URL}/api/university/smoa-filas/${fila.id}/columna/${columna.id}/eliminar`
      );
      setFilas(prev => prev.map(f => f.id === fila.id ? res.data.data : f));
      toast.success('Archivo eliminado');
    } catch (error) {
      toast.error('Error al eliminar archivo');
    }
  };

  const handleSelectColFile = (fila, columna) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) handleUploadColFile(fila, columna, file);
    };
    input.click();
  };

  // Wrapper for fixed columns (dir_nombre) - admin only
  const openModal = (fila, key) => {
    if (!puedeEditar) return;
    setModalFila(fila);
    setModalKey(key);
    setModalColumna(null);
    setModalValue(getValor(fila, key));
    setModalOpen(true);
  };
  const closeModal = closeTextModal;
  const handleSaveModal = handleSaveTextModal;
  const [modalColumna, setModalColumna] = useState(null);

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
      {encabezado?.imagen && (
        <div className="smoa-encabezado-imagen-view">
          <img
            src={`${API_URL}/api/university/smoa-editor-images/${encabezado.imagen}`}
            alt="Encabezado SMOA"
            style={encabezado.imagen_ancho ? { width: encabezado.imagen_ancho + 'px', maxWidth: '100%' } : {}}
          />
        </div>
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
                    className={`smoa-cell smoa-cell-fija${(!puedeEditar || !puedeVerPptxFila(fila.id)) ? ' smoa-cell-readonly' : ''}`}
                    onClick={() => { if (puedeEditar && puedeVerPptxFila(fila.id)) openModal(fila, 'dir_nombre'); }}
                  >
                    <span className="smoa-cell-text">
                      {puedeVerPptxFila(fila.id) ? (getValor(fila, 'dir_nombre') || (puedeEditar ? <span className="smoa-cell-placeholder">Escribir...</span> : '')) : <span className="smoa-cell-placeholder">—</span>}
                    </span>
                  </td>
                  <td className="smoa-cell smoa-cell-fija smoa-cell-pptx">
                    {getValor(fila, 'pres_archivo') && puedeVerPptxFila(fila.id) ? (
                      <div className="smoa-pptx-actions">
                        <a
                          href={`${API_URL}/api/university/smoa-uploads/${getValor(fila, 'pres_archivo')}`}
                          className="smoa-pptx-link"
                          download
                        >
                          Descargar
                        </a>
                        {(puedeEditar || puedeCambiarPptxFila(fila.id)) && (
                          <button className="btn btn-secondary btn-small" onClick={() => handleFileSelect(fila)}>Reemplazar</button>
                        )}
                        {(puedeEditar || puedeEliminarPptxFila(fila.id)) && (
                          <button className="btn btn-danger btn-small" onClick={() => handleEliminarPptx(fila)}>Eliminar</button>
                        )}
                      </div>
                    ) : (
                      (puedeEditar || puedeSubirPptxFila(fila.id)) ? (
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
                    const valor = getValor(fila, key);
                    const tipo = col.tipo_dato || 'texto';
                    const puedeCambiar = puedeCambiarColumna(fila, col);
                    const puedeSubir = puedeSubirColumna(col);
                    const puedeEliminar = puedeEliminarColumna(fila, col);
                    const esReadonly = !puedeEditar && !puedeCambiar && !puedeSubir;
                    const tieneAccesoFila = esSuperAdmin || puedeVerPptxFila(fila.id);

                    if (!tieneAccesoFila) {
                      return <td key={col.id} className="smoa-cell smoa-cell-readonly"><span className="smoa-cell-placeholder">—</span></td>;
                    }

                    if (tipo === 'documento') {
                      return (
                        <td key={col.id} className="smoa-cell smoa-cell-pptx">
                          {valor ? (
                            <div className="smoa-pptx-actions">
                              <a
                                href={`${API_URL}/api/university/smoa-uploads/col/${valor}`}
                                className="smoa-pptx-link"
                                download
                              >
                                Descargar
                              </a>
                              {puedeCambiar && (
                                <button className="btn btn-secondary btn-small" onClick={() => handleSelectColFile(fila, col)}>Reemplazar</button>
                              )}
                              {puedeEliminar && (
                                <button className="btn btn-danger btn-small" onClick={() => handleDeleteColFile(fila, col)}>Eliminar</button>
                              )}
                            </div>
                          ) : (
                            puedeSubir ? (
                              <button
                                className="smoa-pptx-upload-btn"
                                onClick={() => handleSelectColFile(fila, col)}
                                disabled={uploadingColFila === fila.id && uploadingColColumna === col.id}
                              >
                                {uploadingColFila === fila.id && uploadingColColumna === col.id ? '...' : 'Subir archivo'}
                              </button>
                            ) : (
                              <span className="smoa-cell-placeholder">—</span>
                            )
                          )}
                        </td>
                      );
                    }

                    if (tipo === 'enlace') {
                      return (
                        <td
                          key={col.id}
                          className={`smoa-cell${esReadonly ? ' smoa-cell-readonly' : ''}`}
                        >
                          {valor ? (
                            <div className="smoa-enlace-actions">
                              <a
                                href={valor}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="smoa-enlace-link"
                                title={valor}
                              >
                                {valor.length > 30 ? valor.substring(0, 30) + '...' : valor}
                              </a>
                              <button
                                className="smoa-enlace-copy-btn"
                                onClick={() => handleCopyLink(valor)}
                                title="Copiar enlace"
                              >
                                📋
                              </button>
                              {puedeCambiar && (
                                <button className="btn btn-secondary btn-small" onClick={() => openLinkModal(fila, col)}>Editar</button>
                              )}
                              {puedeEliminar && (
                                <button className="btn btn-danger btn-small" onClick={() => handleDeleteLink(fila, col)}>Eliminar</button>
                              )}
                            </div>
                          ) : (
                            puedeSubir ? (
                              <span
                                className="smoa-cell-text smoa-cell-link-add"
                                onClick={() => openLinkModal(fila, col)}
                              >
                                <span className="smoa-cell-placeholder">+ Agregar enlace</span>
                              </span>
                            ) : (
                              <span className="smoa-cell-placeholder">—</span>
                            )
                          )}
                        </td>
                      );
                    }

                    // Default: texto
                    return (
                      <td
                        key={col.id}
                        className={`smoa-cell${esReadonly ? ' smoa-cell-readonly' : ''}`}
                        onClick={() => openTextModal(fila, key, col)}
                      >
                        <span className="smoa-cell-text">{valor || (puedeSubir ? <span className="smoa-cell-placeholder">Escribir...</span> : '')}</span>
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
        <div className="cell-modal-overlay" onClick={closeTextModal}>
          <div className="cell-modal" onClick={e => e.stopPropagation()}>
            <div className="cell-modal-header">
              <h3>Editar texto</h3>
              <button className="close-btn" onClick={closeTextModal}>×</button>
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
              <button className="btn btn-secondary" onClick={closeTextModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveTextModal} disabled={modalSaving}>
                {modalSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {linkModalOpen && (
        <div className="cell-modal-overlay" onClick={closeLinkModal}>
          <div className="cell-modal" onClick={e => e.stopPropagation()}>
            <div className="cell-modal-header">
              <h3>{getValor(linkModalFila, `d_${linkModalColumna?.id}`) ? 'Editar enlace' : 'Agregar enlace'}</h3>
              <button className="close-btn" onClick={closeLinkModal}>×</button>
            </div>
            <div className="cell-modal-body">
              <input
                type="url"
                className="cell-modal-input"
                value={linkModalValue}
                onChange={e => setLinkModalValue(e.target.value)}
                placeholder="https://ejemplo.com/archivo"
                autoFocus
              />
            </div>
            <div className="cell-modal-footer">
              <button className="btn btn-secondary" onClick={closeLinkModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveLinkModal} disabled={linkModalSaving}>
                {linkModalSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMOAPage;
