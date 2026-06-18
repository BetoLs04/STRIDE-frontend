import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/SuperAdminMatrizIndicadores.css';

const API_URL = 'https://api1.strideutmat.com';

const SuperAdminMatrizIndicadores = ({ onClose }) => {
  const navigate = useNavigate();
  const [secciones, setSecciones] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formNombre, setFormNombre] = useState('');
  const [saving, setSaving] = useState(false);

  const [showAsignar, setShowAsignar] = useState(null);
  const [direccionAsignar, setDireccionAsignar] = useState('');

  const [encabezado, setEncabezado] = useState({
    codigo: '', revision: '', fecha_actualizacion: '',
    fecha_revision_indicadores: '', responsable: '', anio: ''
  });
  const [encabezadoLoading, setEncabezadoLoading] = useState(true);
  const [encabezadoSaving, setEncabezadoSaving] = useState(false);
  const [editingEncabezado, setEditingEncabezado] = useState(false);

  const [columnas, setColumnas] = useState([]);
  const [columnasLoading, setColumnasLoading] = useState(true);
  const [nuevaColumna, setNuevaColumna] = useState('');
  const [editColumnaId, setEditColumnaId] = useState(null);
  const [editColumnaNombre, setEditColumnaNombre] = useState('');
  const [columnaSaving, setColumnaSaving] = useState(false);
  const [bloqueo1er, setBloqueo1er] = useState(false);
  const [bloqueo2do, setBloqueo2do] = useState(false);
  const [bloqueo3er, setBloqueo3er] = useState(false);
  const [bloqueoFilas, setBloqueoFilas] = useState(false);
  const [bloqueoToggling, setBloqueoToggling] = useState(null);

  useEffect(() => {
    fetchData();
    fetchEncabezado();
    fetchColumnas();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [secRes, dirRes] = await Promise.all([
        axios.get(`${API_URL}/api/university/matriz-secciones`),
        axios.get(`${API_URL}/api/university/direcciones`)
      ]);
      setSecciones(secRes.data.data || []);
      setDirecciones(dirRes.data.data || []);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchEncabezado = async () => {
    setEncabezadoLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/university/matriz-encabezado`);
      if (res.data.success && res.data.data) {
        setEncabezado(res.data.data);
        setBloqueo1er(!!res.data.data.bloqueo_1er_cuatrimestre);
        setBloqueo2do(!!res.data.data.bloqueo_2do_cuatrimestre);
        setBloqueo3er(!!res.data.data.bloqueo_3er_cuatrimestre);
        setBloqueoFilas(!!res.data.data.bloqueo_filas);
      }
    } catch (error) {
      toast.error('Error al cargar datos de encabezado');
    } finally {
      setEncabezadoLoading(false);
    }
  };

  const handleEncabezadoChange = (campo, valor) => {
    setEncabezado(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSaveEncabezado = async () => {
    setEncabezadoSaving(true);
    try {
      await axios.put(`${API_URL}/api/university/matriz-encabezado`, encabezado);
      toast.success('Encabezado guardado correctamente');
      setEditingEncabezado(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar encabezado');
    } finally {
      setEncabezadoSaving(false);
    }
  };

  const handleCancelEncabezado = () => {
    fetchEncabezado();
    setEditingEncabezado(false);
  };

  const fetchColumnas = async () => {
    setColumnasLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/university/matriz-columnas`);
      setColumnas(res.data.data || []);
    } catch (error) {
      toast.error('Error al cargar columnas');
    } finally {
      setColumnasLoading(false);
    }
  };

  const handleAddColumna = async () => {
    if (!nuevaColumna.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    setColumnaSaving(true);
    try {
      await axios.post(`${API_URL}/api/university/matriz-columnas`, { nombre: nuevaColumna.trim() });
      toast.success('Columna creada');
      setNuevaColumna('');
      fetchColumnas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear columna');
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
      await axios.put(`${API_URL}/api/university/matriz-columnas/${editColumnaId}`, { nombre: editColumnaNombre.trim() });
      toast.success('Columna actualizada');
      setEditColumnaId(null);
      setEditColumnaNombre('');
      fetchColumnas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar columna');
    } finally {
      setColumnaSaving(false);
    }
  };

  const handleCancelEditColumna = () => {
    setEditColumnaId(null);
    setEditColumnaNombre('');
  };

  const handleAlineacionColumna = async (columna, alineacion) => {
    try {
      const res = await axios.put(`${API_URL}/api/university/matriz-columnas/${columna.id}/alineacion`, { alineacion });
      setColumnas(prev => prev.map(c => c.id === columna.id ? res.data.data : c));
      toast.success(`Alineación: ${alineacion === 'left' ? 'Izquierda' : alineacion === 'right' ? 'Derecha' : 'Centro'}`);
    } catch (error) {
      toast.error('Error al cambiar alineación');
    }
  };

  const handleToggleColumna = async (columna) => {
    try {
      const res = await axios.put(`${API_URL}/api/university/matriz-columnas/${columna.id}/toggle`);
      setColumnas(prev => prev.map(c => c.id === columna.id ? { ...c, bloqueada: res.data.bloqueada } : c));
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const handleToggleBloqueo = async (campo, setter) => {
    setBloqueoToggling(campo);
    try {
      const res = await axios.put(`${API_URL}/api/university/matriz-encabezado/toggle-bloqueo/${campo}`);
      setter(!!res.data[campo]);
      toast.success(res.data.message);
    } catch (error) {
      toast.error('Error al cambiar bloqueo');
    } finally {
      setBloqueoToggling(null);
    }
  };

  const handleDeleteColumna = async (columna) => {
    if (!window.confirm(`¿Eliminar la columna "${columna.nombre}"?`)) return;
    try {
      await axios.delete(`${API_URL}/api/university/matriz-columnas/${columna.id}`);
      toast.success('Columna eliminada');
      fetchColumnas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar columna');
    }
  };

  const handleOpenNew = () => {
    setEditId(null);
    setFormNombre('');
    setShowForm(true);
  };

  const handleOpenEdit = (seccion) => {
    setEditId(seccion.id);
    setFormNombre(seccion.nombre);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await axios.put(`${API_URL}/api/university/matriz-secciones/${editId}`, { nombre: formNombre.trim() });
        toast.success('Sección actualizada');
      } else {
        await axios.post(`${API_URL}/api/university/matriz-secciones`, { nombre: formNombre.trim() });
        toast.success('Sección creada');
      }
      setShowForm(false);
      setEditId(null);
      setFormNombre('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (seccion) => {
    if (!window.confirm(`¿Eliminar la sección "${seccion.nombre}"?\nTambién se eliminarán las asignaciones de direcciones.`)) return;
    try {
      await axios.delete(`${API_URL}/api/university/matriz-secciones/${seccion.id}`);
      toast.success('Sección eliminada');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleOpenAsignar = (seccion) => {
    setShowAsignar(seccion.id);
    setDireccionAsignar('');
  };

  const handleAsignarDireccion = async () => {
    if (!direccionAsignar) {
      toast.error('Selecciona una dirección');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/university/matriz-secciones/${showAsignar}/direcciones`, { direccion_id: parseInt(direccionAsignar) });
      toast.success('Dirección asignada');
      setShowAsignar(null);
      setDireccionAsignar('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al asignar');
    }
  };

  const handleQuitarDireccion = async (seccionId, direccionId, nombreDir) => {
    if (!window.confirm(`¿Quitar la dirección "${nombreDir}" de esta sección?`)) return;
    try {
      await axios.delete(`${API_URL}/api/university/matriz-secciones/${seccionId}/direcciones/${direccionId}`);
      toast.success('Dirección quitada');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al quitar dirección');
    }
  };

  const getDireccionesDisponibles = (seccion) => {
    const asignadasIds = new Set((seccion.direcciones || []).map(d => d.id));
    return direcciones.filter(d => !asignadasIds.has(d.id));
  };

  return (
    <div className="tab-content matriz-indicadores">
      <div className="tab-header">
        <h2>📊 Matriz de Indicadores</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={onClose}>← Volver al Dashboard</button>
          <button className="btn btn-primary" onClick={handleOpenNew}>+ Nueva Sección</button>
        </div>
      </div>

      <div className="matriz-main-layout">
        <div className="matriz-left">
          {loading ? (
            <div className="loading">Cargando secciones...</div>
          ) : secciones.length === 0 ? (
            <div className="no-data">
              <p>No hay secciones registradas</p>
              <button className="btn btn-primary" onClick={handleOpenNew}>Crear Primera Sección</button>
            </div>
          ) : (
            <div className="secciones-list">
              {secciones.map(seccion => (
                <div key={seccion.id} className="seccion-card">
                  <div className="seccion-header">
                    <div className="seccion-info">
                      <h3>{seccion.nombre}</h3>
                      <span className="seccion-badge">{seccion.total_direcciones || 0} dirección(es)</span>
                    </div>
                    <div className="seccion-actions">
                      <button className="btn btn-info btn-small" onClick={() => navigate(`/admin/matriz-indicadores/${seccion.id}`)}>📄 Visitar hoja</button>
                      <button className="btn btn-primary btn-small" onClick={() => handleOpenAsignar(seccion)}>+ Asignar Dirección</button>
                      <button className="btn btn-secondary btn-small" onClick={() => handleOpenEdit(seccion)}>✏️ Editar</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(seccion)}>🗑️ Eliminar</button>
                    </div>
                  </div>

                  {showAsignar === seccion.id && (
                    <div className="asignar-direccion-form">
                      <select value={direccionAsignar} onChange={e => setDireccionAsignar(e.target.value)}>
                        <option value="">Seleccionar dirección...</option>
                        {getDireccionesDisponibles(seccion).map(d => (
                          <option key={d.id} value={d.id}>{d.nombre}</option>
                        ))}
                      </select>
                      <button className="btn btn-primary btn-small" onClick={handleAsignarDireccion}>Asignar</button>
                      <button className="btn btn-secondary btn-small" onClick={() => setShowAsignar(null)}>Cancelar</button>
                    </div>
                  )}

                  <div className="seccion-direcciones">
                    {(!seccion.direcciones || seccion.direcciones.length === 0) ? (
                      <p className="text-muted">Sin direcciones asignadas</p>
                    ) : (
                      <div className="direcciones-tags">
                        {seccion.direcciones.map(dir => (
                          <span key={dir.id} className="direccion-tag">
                            {dir.nombre}
                            <button className="tag-remove" onClick={() => handleQuitarDireccion(seccion.id, dir.id, dir.nombre)}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="matriz-right">
          <div className="encabezado-panel">
            <div className="encabezado-header">
              <h3>📋 Datos de Encabezado</h3>
              {!encabezadoLoading && (
                <button className="encabezado-edit-toggle" onClick={() => setEditingEncabezado(!editingEncabezado)} title={editingEncabezado ? 'Cancelar edición' : 'Editar'}>
                  {editingEncabezado ? '✕' : '✏️'}
                </button>
              )}
            </div>
            {encabezadoLoading ? (
              <div className="loading" style={{ padding: '1rem' }}>Cargando...</div>
            ) : editingEncabezado ? (
              <div className="encabezado-form">
                <div className="encabezado-field">
                  <label>CÓDIGO</label>
                  <input type="text" value={encabezado.codigo || ''} onChange={e => handleEncabezadoChange('codigo', e.target.value)} placeholder="Código" />
                </div>
                <div className="encabezado-field">
                  <label>REVISIÓN</label>
                  <input type="text" value={encabezado.revision || ''} onChange={e => handleEncabezadoChange('revision', e.target.value)} placeholder="Revisión" />
                </div>
                <div className="encabezado-field">
                  <label>FECHA DE ACTUALIZACIÓN</label>
                  <input type="text" value={encabezado.fecha_actualizacion || ''} onChange={e => handleEncabezadoChange('fecha_actualizacion', e.target.value)} placeholder="DD/MM/AAAA" />
                </div>
                <div className="encabezado-field">
                  <label>FECHA DE REVISIÓN DE INDICADORES</label>
                  <input type="text" value={encabezado.fecha_revision_indicadores || ''} onChange={e => handleEncabezadoChange('fecha_revision_indicadores', e.target.value)} placeholder="DD/MM/AAAA" />
                </div>
                <div className="encabezado-field">
                  <label>RESPONSABLE DE LA MATRIZ</label>
                  <input type="text" value={encabezado.responsable || ''} onChange={e => handleEncabezadoChange('responsable', e.target.value)} placeholder="Nombre del responsable" />
                </div>
                <div className="encabezado-field">
                  <label>AÑO</label>
                  <input type="text" value={encabezado.anio || ''} onChange={e => handleEncabezadoChange('anio', e.target.value)} placeholder="AAAA" />
                </div>
                <div className="encabezado-form-actions">
                  <button className="btn btn-secondary" onClick={handleCancelEncabezado} disabled={encabezadoSaving}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleSaveEncabezado} disabled={encabezadoSaving}>
                    {encabezadoSaving ? 'Guardando...' : '💾 Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="encabezado-view">
                <div className="encabezado-row">
                  <span className="encabezado-label">CÓDIGO</span>
                  <span className="encabezado-value">{encabezado.codigo || '—'}</span>
                </div>
                <div className="encabezado-row">
                  <span className="encabezado-label">REVISIÓN</span>
                  <span className="encabezado-value">{encabezado.revision || '—'}</span>
                </div>
                <div className="encabezado-row">
                  <span className="encabezado-label">FECHA DE ACTUALIZACIÓN</span>
                  <span className="encabezado-value">{encabezado.fecha_actualizacion || '—'}</span>
                </div>
                <div className="encabezado-row">
                  <span className="encabezado-label">FECHA DE REVISIÓN DE INDICADORES</span>
                  <span className="encabezado-value">{encabezado.fecha_revision_indicadores || '—'}</span>
                </div>
                <div className="encabezado-row">
                  <span className="encabezado-label">RESPONSABLE DE LA MATRIZ</span>
                  <span className="encabezado-value">{encabezado.responsable || '—'}</span>
                </div>
                <div className="encabezado-row">
                  <span className="encabezado-label">AÑO</span>
                  <span className="encabezado-value">{encabezado.anio || '—'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="columnas-section">
        <div className="columnas-header">
          <h3>📑 Nombre de Columnas</h3>
        </div>
        {columnasLoading ? (
          <div className="loading" style={{ padding: '1rem' }}>Cargando columnas...</div>
        ) : (
          <div className="columnas-content">
            <div className="columnas-add-form">
              <input
                type="text"
                value={nuevaColumna}
                onChange={e => setNuevaColumna(e.target.value)}
                placeholder="Nombre de la nueva columna"
                onKeyDown={e => { if (e.key === 'Enter') handleAddColumna(); }}
              />
              <button className="btn btn-primary btn-small" onClick={handleAddColumna} disabled={columnaSaving}>
                {columnaSaving && !editColumnaId ? '...' : '+ Agregar'}
              </button>
            </div>
            {columnas.length === 0 ? (
              <p className="text-muted columnas-empty">No hay columnas registradas</p>
            ) : (
              <div className="columnas-list">
                {columnas.map((columna, index) => (
                  <div key={columna.id} className={`columna-item ${columna.bloqueada ? 'columna-bloqueada' : ''}`}>
                    <span className="columna-index">{index + 1}.</span>
                    {editColumnaId === columna.id ? (
                      <div className="columna-edit-inline">
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
                        <span className="columna-nombre">{columna.nombre}</span>
                        {columna.bloqueada && <span className="columna-badge-bloqueada">Bloqueada</span>}
                        <div className="columna-alineacion">
                          <button
                            className={`btn-alineacion${columna.alineacion === 'left' ? ' active' : ''}`}
                            onClick={() => handleAlineacionColumna(columna, 'left')}
                            title="Izquierda"
                          >≡</button>
                          <button
                            className={`btn-alineacion${columna.alineacion === 'center' ? ' active' : ''}`}
                            onClick={() => handleAlineacionColumna(columna, 'center')}
                            title="Centro"
                          >≡</button>
                          <button
                            className={`btn-alineacion${columna.alineacion === 'right' ? ' active' : ''}`}
                            onClick={() => handleAlineacionColumna(columna, 'right')}
                            title="Derecha"
                          >≡</button>
                        </div>
                        <div className="columna-actions">
                          <button className="btn btn-warning btn-small" onClick={() => handleToggleColumna(columna)}>
                            {columna.bloqueada ? '🔓 Desbloquear' : '🔒 Bloquear'}
                          </button>
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

      <div className="bloqueo-cuatrimestres-section">
        <div className="bloqueo-cuatrimestres-header">
          <h3>🔒 Bloqueo de Columnas Cuatrimestrales</h3>
        </div>
        <div className="bloqueo-cuatrimestres-content">
          <p className="bloqueo-descripcion">Bloquea la edición individual de cada columna cuatrimestral para todos los usuarios.</p>
          <div className="bloqueo-individuales">
            <div className="bloqueo-item">
              <span className="bloqueo-label">1er Cuatrimestre</span>
              <button
                className={`btn ${bloqueo1er ? 'btn-danger' : 'btn-success'} btn-small`}
                onClick={() => handleToggleBloqueo('bloqueo_1er_cuatrimestre', setBloqueo1er)}
                disabled={bloqueoToggling === 'bloqueo_1er_cuatrimestre'}
              >
                {bloqueoToggling === 'bloqueo_1er_cuatrimestre' ? '...' : bloqueo1er ? '🔓 Desbloquear' : '🔒 Bloquear'}
              </button>
              <span className={`bloqueo-estado ${bloqueo1er ? 'bloqueado' : 'desbloqueado'}`}>
                {bloqueo1er ? 'Bloqueado' : 'Libre'}
              </span>
            </div>
            <div className="bloqueo-item">
              <span className="bloqueo-label">2do Cuatrimestre</span>
              <button
                className={`btn ${bloqueo2do ? 'btn-danger' : 'btn-success'} btn-small`}
                onClick={() => handleToggleBloqueo('bloqueo_2do_cuatrimestre', setBloqueo2do)}
                disabled={bloqueoToggling === 'bloqueo_2do_cuatrimestre'}
              >
                {bloqueoToggling === 'bloqueo_2do_cuatrimestre' ? '...' : bloqueo2do ? '🔓 Desbloquear' : '🔒 Bloquear'}
              </button>
              <span className={`bloqueo-estado ${bloqueo2do ? 'bloqueado' : 'desbloqueado'}`}>
                {bloqueo2do ? 'Bloqueado' : 'Libre'}
              </span>
            </div>
            <div className="bloqueo-item">
              <span className="bloqueo-label">3er Cuatrimestre</span>
              <button
                className={`btn ${bloqueo3er ? 'btn-danger' : 'btn-success'} btn-small`}
                onClick={() => handleToggleBloqueo('bloqueo_3er_cuatrimestre', setBloqueo3er)}
                disabled={bloqueoToggling === 'bloqueo_3er_cuatrimestre'}
              >
                {bloqueoToggling === 'bloqueo_3er_cuatrimestre' ? '...' : bloqueo3er ? '🔓 Desbloquear' : '🔒 Bloquear'}
              </button>
              <span className={`bloqueo-estado ${bloqueo3er ? 'bloqueado' : 'desbloqueado'}`}>
                {bloqueo3er ? 'Bloqueado' : 'Libre'}
              </span>
            </div>
            <div className="bloqueo-item">
              <span className="bloqueo-label">Agregar / Eliminar filas</span>
              <button
                className={`btn ${bloqueoFilas ? 'btn-danger' : 'btn-success'} btn-small`}
                onClick={() => handleToggleBloqueo('bloqueo_filas', setBloqueoFilas)}
                disabled={bloqueoToggling === 'bloqueo_filas'}
              >
                {bloqueoToggling === 'bloqueo_filas' ? '...' : bloqueoFilas ? '🔓 Desbloquear' : '🔒 Bloquear'}
              </button>
              <span className={`bloqueo-estado ${bloqueoFilas ? 'bloqueado' : 'desbloqueado'}`}>
                {bloqueoFilas ? 'Bloqueado' : 'Libre'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-modal-content" style={{ maxWidth: '450px' }}>
            <div className="form-header">
              <h2>{editId ? '✏️ Editar Sección' : '➕ Nueva Sección'}</h2>
              <button className="close-btn" onClick={() => { setShowForm(false); setEditId(null); setFormNombre(''); }}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 30px 30px' }}>
              <div className="form-group">
                <label>Nombre de la Sección *</label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={e => setFormNombre(e.target.value)}
                  placeholder="Ej: Indicadores Académicos"
                  required
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); setFormNombre(''); }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editId ? '💾 Guardar Cambios' : '✓ Crear Sección'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminMatrizIndicadores;
