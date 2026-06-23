import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-quill-new/dist/quill.snow.css';
import '../styles/SuperAdminSMOA.css';

const API_URL = 'https://api1.strideutmat.com';

const SuperAdminSMOA = ({ onClose }) => {
  const navigate = useNavigate();

  const quillRef = useRef(null);

  const [encabezado, setEncabezado] = useState({ contenido: '' });
  const [encabezadoLoading, setEncabezadoLoading] = useState(true);
  const [encabezadoSaving, setEncabezadoSaving] = useState(false);
  const [editingEncabezado, setEditingEncabezado] = useState(false);

  const [columnas, setColumnas] = useState([]);
  const [columnasLoading, setColumnasLoading] = useState(true);
  const [nuevaColumna, setNuevaColumna] = useState('');
  const [editColumnaId, setEditColumnaId] = useState(null);
  const [editColumnaNombre, setEditColumnaNombre] = useState('');
  const [columnaSaving, setColumnaSaving] = useState(false);

  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [usuariosAsignados, setUsuariosAsignados] = useState([]);
  const [usuariosLoading, setUsuariosLoading] = useState(true);
  const [showAsignar, setShowAsignar] = useState(false);
  const [selectedUsuarios, setSelectedUsuarios] = useState(new Set());

  const [filas, setFilas] = useState([]);
  const [filasLoading, setFilasLoading] = useState(true);

  const [uploadingFilaPptx, setUploadingFilaPptx] = useState(null);
  const fileInputRef = useRef(null);
  const [fileSelectFila, setFileSelectFila] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchEncabezado(),
      fetchColumnas(),
      fetchUsuarios(),
      fetchFilas()
    ]);
  };

  const fetchFilas = async () => {
    setFilasLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/university/smoa-filas`);
      setFilas(res.data.data || []);
    } catch (error) {
      toast.error('Error al cargar filas SMOA');
    } finally {
      setFilasLoading(false);
    }
  };

  const getValor = (fila, key) => {
    try {
      const valores = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
      return valores[key] || '';
    } catch {
      return '';
    }
  };

  const handleFileSelectFila = (fila) => {
    setFileSelectFila(fila);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !fileSelectFila) return;
    if (!file.name.endsWith('.pptx')) {
      toast.error('Solo se permiten archivos .pptx');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('El archivo no puede superar los 50MB');
      return;
    }
    setUploadingFilaPptx(fileSelectFila.id);
    try {
      const formData = new FormData();
      formData.append('pptx', file);
      await axios.put(`${API_URL}/api/university/smoa-filas/${fileSelectFila.id}/pptx`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Presentación subida');
      fetchFilas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al subir presentación');
    } finally {
      setUploadingFilaPptx(null);
      setFileSelectFila(null);
    }
  };

  const handleEliminarPptxFila = async (fila) => {
    if (!window.confirm(`¿Eliminar la presentación de "${getValor(fila, 'dir_nombre')}"?`)) return;
    try {
      await axios.put(`${API_URL}/api/university/smoa-filas/${fila.id}/pptx`, { eliminar: true });
      toast.success('Presentación eliminada');
      fetchFilas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar presentación');
    }
  };

  const fetchEncabezado = async () => {
    setEncabezadoLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/university/smoa-encabezado`);
      if (res.data.success && res.data.data) {
        setEncabezado(res.data.data);
      }
    } catch (error) {
      toast.error('Error al cargar datos del encabezado SMOA');
    } finally {
      setEncabezadoLoading(false);
    }
  };

  const handleSaveEncabezado = async () => {
    setEncabezadoSaving(true);
    try {
      await axios.put(`${API_URL}/api/university/smoa-encabezado`, { contenido: encabezado.contenido });
      toast.success('Encabezado SMOA guardado correctamente');
      setEditingEncabezado(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar encabezado SMOA');
    } finally {
      setEncabezadoSaving(false);
    }
  };

  const handleCancelEncabezado = () => {
    fetchEncabezado();
    setEditingEncabezado(false);
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('imagen', file);
      try {
        const res = await axios.post(`${API_URL}/api/university/smoa-upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const url = res.data.url;
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', url);
          quill.setSelection(range.index + 1);
        }
      } catch (error) {
        toast.error('Error al subir imagen');
      }
    };
    input.click();
  };

  const fetchColumnas = async () => {
    setColumnasLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/university/smoa-columnas`);
      setColumnas(res.data.data || []);
    } catch (error) {
      toast.error('Error al cargar columnas SMOA');
    } finally {
      setColumnasLoading(false);
    }
  };

  const handleAddColumna = async () => {
    if (!nuevaColumna.trim()) {
      toast.error('El nombre de la columna es requerido');
      return;
    }
    setColumnaSaving(true);
    try {
      await axios.post(`${API_URL}/api/university/smoa-columnas`, { nombre: nuevaColumna.trim() });
      toast.success('Columna SMOA creada');
      setNuevaColumna('');
      fetchColumnas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear columna SMOA');
    } finally {
      setColumnaSaving(false);
    }
  };

  const handleStartEditColumna = (columna) => {
    setEditColumnaId(columna.id);
    setEditColumnaNombre(columna.nombre);
  };

  const handleSaveEditColumna = async () => {
    if (!editColumnaNombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    setColumnaSaving(true);
    try {
      await axios.put(`${API_URL}/api/university/smoa-columnas/${editColumnaId}`, { nombre: editColumnaNombre.trim() });
      toast.success('Columna SMOA actualizada');
      setEditColumnaId(null);
      setEditColumnaNombre('');
      fetchColumnas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar columna SMOA');
    } finally {
      setColumnaSaving(false);
    }
  };

  const handleCancelEditColumna = () => {
    setEditColumnaId(null);
    setEditColumnaNombre('');
  };

  const handleDeleteColumna = async (columna) => {
    if (!window.confirm(`¿Eliminar la columna "${columna.nombre}"?`)) return;
    try {
      await axios.delete(`${API_URL}/api/university/smoa-columnas/${columna.id}`);
      toast.success('Columna SMOA eliminada');
      fetchColumnas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar columna SMOA');
    }
  };

  const fetchUsuarios = async () => {
    setUsuariosLoading(true);
    try {
      const [dispRes, asigRes] = await Promise.all([
        axios.get(`${API_URL}/api/university/smoa-usuarios-disponibles`),
        axios.get(`${API_URL}/api/university/smoa-usuarios`)
      ]);
      setUsuariosDisponibles(dispRes.data.data || []);
      setUsuariosAsignados(asigRes.data.data || []);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setUsuariosLoading(false);
    }
  };

  const toggleUsuario = (usuario) => {
    const key = `${usuario.id}_${usuario.tipo}`;
    setSelectedUsuarios(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleConfirmarAsignacion = async () => {
    if (selectedUsuarios.size === 0) {
      toast.error('Selecciona al menos un usuario');
      return;
    }
    try {
      const promises = [];
      for (const key of selectedUsuarios) {
        const [id, tipo] = key.split('_');
        promises.push(
          axios.post(`${API_URL}/api/university/smoa-usuarios`, {
            usuario_id: parseInt(id),
            usuario_tipo: tipo
          })
        );
      }
      await Promise.all(promises);
      toast.success(`${selectedUsuarios.size} usuario(s) asignado(s) a SMOA`);
      setShowAsignar(false);
      setSelectedUsuarios(new Set());
      fetchUsuarios();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al asignar usuarios');
    }
  };

  const handleQuitarUsuario = async (asignacion) => {
    if (!window.confirm(`¿Quitar a "${asignacion.nombre}" del SMOA?`)) return;
    try {
      await axios.delete(`${API_URL}/api/university/smoa-usuarios/${asignacion.asignacion_id}`);
      toast.success('Usuario quitado de SMOA');
      fetchUsuarios();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al quitar usuario');
    }
  };

  const getUsuariosDisponibles = () => {
    const asignadosKey = new Set(usuariosAsignados.map(u => `${u.usuario_id}_${u.usuario_tipo}`));
    return usuariosDisponibles.filter(u => !asignadosKey.has(`${u.id}_${u.tipo}`));
  };

  return (
    <div className="tab-content smo-indicadores">
      <div className="tab-header">
        <h2>📈 SMOA - Seguimiento Mensual de Objetivos Anuales</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={onClose}>← Volver al Dashboard</button>
          <button style={{ marginLeft: '2rem' }} className="btn btn-primary" onClick={() => navigate('/admin/smoa')}>📄 Ver hoja SMOA</button>
        </div>
      </div>

      <div className="smoa-main-layout">
        <div className="smoa-left">
          <div className="smoa-panel">
            <div className="smoa-panel-header">
              <h3>👥 Usuarios con acceso</h3>
              <button className="btn btn-outline btn-small" onClick={() => setShowAsignar(true)}>+ Asignar</button>
            </div>
            {usuariosLoading ? (
              <div className="loading" style={{ padding: '1rem' }}>Cargando...</div>
            ) : usuariosAsignados.length === 0 ? (
              <p className="text-muted" style={{ padding: '1rem' }}>No hay usuarios asignados</p>
            ) : (
              <div className="smoa-usuarios-list">
                {usuariosAsignados.map(u => (
                  <span key={u.asignacion_id} className="smoa-usuario-tag">
                    {u.nombre} <small>({u.usuario_tipo === 'directivo' ? 'Directivo' : 'Personal'})</small>
                    <button className="tag-remove" onClick={() => handleQuitarUsuario(u)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="smoa-panel">
            <div className="smoa-panel-header">
              <h3>📁 Presentaciones por dirección</h3>
            </div>
            {filasLoading ? (
              <div className="loading" style={{ padding: '1rem' }}>Cargando...</div>
            ) : filas.length === 0 ? (
              <p className="text-muted" style={{ padding: '1rem' }}>No hay filas registradas</p>
            ) : (
              <div className="smoa-filas-pptx-list">
                {filas.map(fila => {
                  const nombre = getValor(fila, 'dir_nombre') || `Fila #${fila.id}`;
                  const archivo = getValor(fila, 'pres_archivo');
                  return (
                    <div key={fila.id} className="smoa-fila-pptx-item">
                      <span className="smoa-fila-pptx-nombre">{nombre}</span>
                      {archivo ? (
                        <div className="smoa-fila-pptx-actions">
                          <a
                            href={`${API_URL}/api/university/smoa-uploads/${archivo}`}
                            className="smoa-pptx-link"
                            download
                          >
                            📥 Descargar
                          </a>
                          <button
                            className="btn btn-danger btn-small"
                            onClick={() => handleEliminarPptxFila(fila)}
                            disabled={uploadingFilaPptx === fila.id}
                          >
                            🗑️
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-outline btn-small"
                          onClick={() => handleFileSelectFila(fila)}
                          disabled={uploadingFilaPptx === fila.id}
                        >
                          {uploadingFilaPptx === fila.id ? '...' : '📤 Subir .pptx'}
                        </button>
                      )}
                    </div>
                  );
                })}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pptx"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>

          <div className="smoa-panel">
            <div className="smoa-panel-header">
              <h3>📑 Columnas</h3>
            </div>
            {columnasLoading ? (
              <div className="loading" style={{ padding: '1rem' }}>Cargando...</div>
            ) : (
              <div className="smoa-columnas-content">
                <div className="smoa-columnas-add-form">
                  <input
                    type="text"
                    value={nuevaColumna}
                    onChange={e => setNuevaColumna(e.target.value)}
                    placeholder="Nombre de la nueva columna"
                    onKeyDown={e => { if (e.key === 'Enter') handleAddColumna(); }}
                  />
                  <button className="btn btn-primary btn-small" onClick={handleAddColumna} disabled={columnaSaving}>
                    {columnaSaving ? '...' : '+ Agregar'}
                  </button>
                </div>
                {columnas.length === 0 ? (
                  <p className="text-muted" style={{ padding: '0.5rem' }}>No hay columnas registradas</p>
                ) : (
                  <div className="smoa-columnas-list">
                    {columnas.map((columna, index) => (
                      <div key={columna.id} className="smoa-columna-item">
                        <span className="smoa-columna-index">{index + 1}.</span>
                        {editColumnaId === columna.id ? (
                          <div className="smoa-columna-edit-inline">
                            <input
                              type="text"
                              value={editColumnaNombre}
                              onChange={e => setEditColumnaNombre(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveEditColumna(); if (e.key === 'Escape') handleCancelEditColumna(); }}
                              autoFocus
                            />
                            <button className="btn btn-primary btn-small" onClick={handleSaveEditColumna} disabled={columnaSaving}>💾</button>
                            <button className="btn btn-secondary btn-small" onClick={handleCancelEditColumna}>✕</button>
                          </div>
                        ) : (
                          <>
                            <span className="smoa-columna-nombre">{columna.nombre}</span>
                            <div className="smoa-columna-actions">
                              <button className="btn btn-secondary btn-small" onClick={() => handleStartEditColumna(columna)}>✏️</button>
                              <button className="btn btn-danger btn-small" onClick={() => handleDeleteColumna(columna)}>🗑️</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="smoa-right">
          <div className="smoa-panel">
            <div className="smoa-panel-header">
              <h3>📋 Encabezado SMOA</h3>
              {!encabezadoLoading && (
                <button className="smoa-edit-toggle" onClick={() => setEditingEncabezado(!editingEncabezado)} title={editingEncabezado ? 'Cancelar edición' : 'Editar'}>
                  {editingEncabezado ? '✕' : '✏️'}
                </button>
              )}
            </div>
            {encabezadoLoading ? (
              <div className="loading" style={{ padding: '1rem' }}>Cargando...</div>
            ) : editingEncabezado ? (
              <div className="smoa-encabezado-editor">
                <ReactQuill
                  ref={quillRef}
                  value={encabezado.contenido || ''}
                  onChange={valor => setEncabezado(prev => ({ ...prev, contenido: valor }))}
                  placeholder="Escribe el contenido del encabezado SMOA..."
                  theme="snow"
                  modules={{
                    toolbar: {
                      container: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ align: [] }],
                        [{ color: [] }, { background: [] }],
                        ['link', 'image'],
                        ['clean']
                      ],
                      handlers: {
                        image: handleImageUpload
                      }
                    }
                  }}
                  style={{ minHeight: '200px' }}
                />
                <div className="smoa-encabezado-actions">
                  <button className="btn btn-secondary" onClick={handleCancelEncabezado} disabled={encabezadoSaving}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleSaveEncabezado} disabled={encabezadoSaving}>
                    {encabezadoSaving ? 'Publicando...' : '📝 Publicar encabezado'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="smoa-encabezado-view">
                {encabezado.contenido ? (
                  <div className="smoa-encabezado-contenido" dangerouslySetInnerHTML={{ __html: encabezado.contenido }} />
                ) : (
                  <p className="text-muted" style={{ padding: '1rem' }}>Sin contenido. Haz clic en ✏️ para escribir el encabezado.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAsignar && (
        <div className="form-modal" onClick={() => setShowAsignar(false)}>
          <div className="form-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="form-header">
              <h2>👥 Asignar usuarios a SMOA</h2>
              <button className="close-btn" onClick={() => setShowAsignar(false)}>×</button>
            </div>
            <div className="asignar-modal-body">
              <div className="asignar-columnas">
                <div className="asignar-seccion">
                  <h4>Directivos</h4>
                  <div className="asignar-lista">
                    {getUsuariosDisponibles().filter(u => u.tipo === 'directivo').length === 0 ? (
                      <p className="text-muted">No hay directivos disponibles</p>
                    ) : (
                      getUsuariosDisponibles().filter(u => u.tipo === 'directivo').map(u => {
                        const key = `${u.id}_${u.tipo}`;
                        return (
                          <button key={key} className={`asignar-btn-usuario${selectedUsuarios.has(key) ? ' selected' : ''}`} onClick={() => toggleUsuario(u)}>
                            <span className="asignar-check">{selectedUsuarios.has(key) ? '✓' : ''}</span>
                            <span className="asignar-usuario-nombre">{u.nombre}</span>
                            <span className="asignar-usuario-tipo">Directivo</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="asignar-divider-vertical"></div>
                <div className="asignar-seccion">
                  <h4>Personal</h4>
                  <div className="asignar-lista">
                    {getUsuariosDisponibles().filter(u => u.tipo === 'personal').length === 0 ? (
                      <p className="text-muted">No hay personal disponible</p>
                    ) : (
                      getUsuariosDisponibles().filter(u => u.tipo === 'personal').map(u => {
                        const key = `${u.id}_${u.tipo}`;
                        return (
                          <button key={key} className={`asignar-btn-usuario${selectedUsuarios.has(key) ? ' selected' : ''}`} onClick={() => toggleUsuario(u)}>
                            <span className="asignar-check">{selectedUsuarios.has(key) ? '✓' : ''}</span>
                            <span className="asignar-usuario-nombre">{u.nombre}</span>
                            <span className="asignar-usuario-tipo">Personal</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              <div className="asignar-footer">
                <span className="asignar-seleccionados">{selectedUsuarios.size} seleccionado(s)</span>
                <div className="asignar-footer-actions">
                  <button className="btn btn-secondary" onClick={() => setShowAsignar(false)}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleConfirmarAsignacion} disabled={selectedUsuarios.size === 0}>
                    Confirmar asignación
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminSMOA;
