import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { ROUTES } from '../../constants/routes';
import { toast } from 'react-toastify';
import '../../styles/SuperAdminMatrizIndicadores.css';
import FormInput from '../shared/FormInput';
import { handleApiError } from '../../utils/errorHandler';
import useSocketEvent from '../../hooks/useSocketEvent';

const SuperAdminMatrizIndicadores = ({ onClose }) => {
  const navigate = useNavigate();
  const [secciones, setSecciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formNombre, setFormNombre] = useState('');
  const [saving, setSaving] = useState(false);

  const [showAsignar, setShowAsignar] = useState(null);
  const [showAsignarSeccion, setShowAsignarSeccion] = useState(null);
  const [busquedaPersonal, setBusquedaPersonal] = useState('');
  const [selectedUsuarios, setSelectedUsuarios] = useState(new Set());

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

  const refreshRef = useRef();

  useSocketEvent('matriz:updated', () => refreshRef.current && refreshRef.current());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [secRes, usuRes] = await Promise.all([
        api.get('/api/university/matriz-secciones'),
        api.get('/api/university/matriz-usuarios')
      ]);
      setSecciones(secRes.data.data || []);
      setUsuarios(usuRes.data.data || []);
    } catch (error) {
      handleApiError(error, 'Error al cargar secciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshRef.current = fetchData;
  });

  const fetchEncabezado = async () => {
    setEncabezadoLoading(true);
    try {
      const res = await api.get('/api/university/matriz-encabezado');
      if (res.data.success && res.data.data) {
        setEncabezado(res.data.data);
        setBloqueo1er(!!res.data.data.bloqueo_1er_cuatrimestre);
        setBloqueo2do(!!res.data.data.bloqueo_2do_cuatrimestre);
        setBloqueo3er(!!res.data.data.bloqueo_3er_cuatrimestre);
        setBloqueoFilas(!!res.data.data.bloqueo_filas);
      }
    } catch (error) {
      handleApiError(error, 'Error al cargar encabezado');
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
      await api.put('/api/university/matriz-encabezado', encabezado);
      toast.success('Encabezado guardado correctamente');
      setEditingEncabezado(false);
    } catch (error) {
      handleApiError(error, 'Error al guardar encabezado');
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
      const res = await api.get('/api/university/matriz-columnas');
      setColumnas(res.data.data || []);
    } catch (error) {
      handleApiError(error, 'Error al cargar columnas');
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
      await api.post('/api/university/matriz-columnas', { nombre: nuevaColumna.trim() });
      toast.success('Columna creada');
      setNuevaColumna('');
      fetchColumnas();
    } catch (error) {
      handleApiError(error, 'Error al crear columna');
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
      await api.put(`/api/university/matriz-columnas/${editColumnaId}`, { nombre: editColumnaNombre.trim() });
      toast.success('Columna actualizada');
      setEditColumnaId(null);
      setEditColumnaNombre('');
      fetchColumnas();
    } catch (error) {
      handleApiError(error, 'Error al actualizar columna');
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
      const res = await api.put(`/api/university/matriz-columnas/${columna.id}/alineacion`, { alineacion });
      setColumnas(prev => prev.map(c => c.id === columna.id ? res.data.data : c));
      toast.success(`Alineación: ${alineacion === 'left' ? 'Izquierda' : alineacion === 'right' ? 'Derecha' : 'Centro'}`);
    } catch (error) {
      handleApiError(error, 'Error al cambiar alineación');
    }
  };

  const handleToggleColumna = async (columna) => {
    try {
      const res = await api.put(`/api/university/matriz-columnas/${columna.id}/toggle`);
      setColumnas(prev => prev.map(c => c.id === columna.id ? { ...c, bloqueada: res.data.bloqueada } : c));
      toast.success(res.data.message);
    } catch (error) {
      handleApiError(error, 'Error al cambiar estado');
    }
  };

  const handleToggleBloqueo = async (campo, setter) => {
    setBloqueoToggling(campo);
    try {
      const res = await api.put(`/api/university/matriz-encabezado/toggle-bloqueo/${campo}`);
      setter(!!res.data[campo]);
      toast.success(res.data.message);
    } catch (error) {
      handleApiError(error, 'Error al cambiar bloqueo');
    } finally {
      setBloqueoToggling(null);
    }
  };

  const handleDeleteColumna = async (columna) => {
    if (!window.confirm(`¿Eliminar la columna "${columna.nombre}"?`)) return;
    try {
      await api.delete(`/api/university/matriz-columnas/${columna.id}`);
      toast.success('Columna eliminada');
      fetchColumnas();
    } catch (error) {
      handleApiError(error, 'Error al eliminar columna');
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
        await api.put(`/api/university/matriz-secciones/${editId}`, { nombre: formNombre.trim() });
        toast.success('Sección actualizada');
      } else {
        await api.post('/api/university/matriz-secciones', { nombre: formNombre.trim() });
        toast.success('Sección creada');
      }
      setShowForm(false);
      setEditId(null);
      setFormNombre('');
      fetchData();
    } catch (error) {
      handleApiError(error, 'Error al guardar sección');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (seccion) => {
    if (!window.confirm(`¿Eliminar la sección "${seccion.nombre}"?\nTambién se eliminarán las asignaciones de usuarios.`)) return;
    try {
      await api.delete(`/api/university/matriz-secciones/${seccion.id}`);
      toast.success('Sección eliminada');
      fetchData();
    } catch (error) {
      handleApiError(error, 'Error al eliminar sección');
    }
  };

  const handleOpenAsignar = (seccion) => {
    setShowAsignarSeccion(seccion);
    setBusquedaPersonal('');
    setSelectedUsuarios(new Set());
  };

  const toggleUsuario = (usuario) => {
    const key = `${usuario.id}_${usuario.tipo}`;
    setSelectedUsuarios(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAllUsuariosMatriz = (value) => {
    const disponibles = getUsuariosDisponibles(showAsignarSeccion);
    setSelectedUsuarios(prev => {
      const next = new Set(prev);
      for (const u of disponibles) {
        const key = `${u.id}_${u.tipo}`;
        if (value) next.add(key);
        else next.delete(key);
      }
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
          api.post(`/api/university/matriz-secciones/${showAsignarSeccion.id}/usuarios`, {
            usuario_id: parseInt(id),
            usuario_tipo: tipo
          })
        );
      }
      await Promise.all(promises);
      toast.success(`${selectedUsuarios.size} usuario(s) asignado(s) a "${showAsignarSeccion.nombre}"`);
      setShowAsignarSeccion(null);
      setBusquedaPersonal('');
      fetchData();
    } catch (error) {
      handleApiError(error, 'Error al asignar usuarios');
    }
  };

  const handleQuitarUsuario = async (seccionId, usuario) => {
    if (!window.confirm(`¿Quitar a "${usuario.nombre}" de esta sección?`)) return;
    try {
      await api.delete(`/api/university/matriz-secciones/${seccionId}/usuarios/${usuario.usuario_id}/${usuario.usuario_tipo}`);
      toast.success('Usuario quitado');
      fetchData();
    } catch (error) {
      handleApiError(error, 'Error al quitar usuario');
    }
  };

  const getUsuariosDisponibles = (seccion) => {
    const asignados = seccion.usuarios || [];
    const asignadosKey = new Set(asignados.map(u => `${u.usuario_id}_${u.usuario_tipo}`));
    return usuarios.filter(u => !asignadosKey.has(`${u.id}_${u.tipo}`));
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
                      <span className="seccion-badge">{seccion.total_usuarios || 0} usuario(s)</span>
                      <button className="btn btn-outline btn-small" onClick={() => handleOpenAsignar(seccion)} style={{ marginLeft: '8px' }}>👥 Asignar</button>
                    </div>
                    <div className="seccion-actions">
                      <button className="btn btn-info btn-small" onClick={() => navigate(`/admin/matriz-indicadores/${seccion.id}`)}>📄 Visitar hoja</button>
                      <button className="btn btn-secondary btn-small" onClick={() => handleOpenEdit(seccion)}>✏️ Editar</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(seccion)}>🗑️ Eliminar</button>
                    </div>
                  </div>

                  <div className="seccion-direcciones">
                    {(!seccion.usuarios || seccion.usuarios.length === 0) ? (
                      <p className="text-muted">Sin usuarios asignados</p>
                    ) : (
                      <div className="direcciones-tags">
                        {seccion.usuarios.map(u => (
                          <span key={u.asignacion_id} className="direccion-tag">
                            {u.nombre} <small>({u.usuario_tipo === 'directivo' ? 'Directivo' : 'Personal'})</small>
                            <button className="tag-remove" onClick={() => handleQuitarUsuario(seccion.id, u)}>×</button>
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
                <FormInput label="CÓDIGO" name="encabezado-codigo" value={encabezado.codigo || ''} onChange={e => handleEncabezadoChange('codigo', e.target.value)} placeholder="Código" className="encabezado-field" />
                <FormInput label="REVISIÓN" name="encabezado-revision" value={encabezado.revision || ''} onChange={e => handleEncabezadoChange('revision', e.target.value)} placeholder="Revisión" className="encabezado-field" />
                <FormInput label="FECHA DE ACTUALIZACIÓN" name="encabezado-fecha-act" value={encabezado.fecha_actualizacion || ''} onChange={e => handleEncabezadoChange('fecha_actualizacion', e.target.value)} placeholder="DD/MM/AAAA" className="encabezado-field" />
                <FormInput label="FECHA DE REVISIÓN DE INDICADORES" name="encabezado-fecha-rev" value={encabezado.fecha_revision_indicadores || ''} onChange={e => handleEncabezadoChange('fecha_revision_indicadores', e.target.value)} placeholder="DD/MM/AAAA" className="encabezado-field" />
                <FormInput label="RESPONSABLE DE LA MATRIZ" name="encabezado-responsable" value={encabezado.responsable || ''} onChange={e => handleEncabezadoChange('responsable', e.target.value)} placeholder="Nombre del responsable" className="encabezado-field" />
                <FormInput label="AÑO" name="encabezado-anio" value={encabezado.anio || ''} onChange={e => handleEncabezadoChange('anio', e.target.value)} placeholder="AAAA" className="encabezado-field" />
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
              <FormInput label="Nombre de la Sección *" name="seccion-nombre" value={formNombre} onChange={e => setFormNombre(e.target.value)} placeholder="Ej: Indicadores Académicos" required autoFocus />
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

      {showAsignarSeccion && (
        <div className="form-modal" onClick={() => setShowAsignarSeccion(null)}>
          <div className="form-modal-content asignar-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1200px' }}>
            <div className="form-header">
              <h2>Asignar usuarios a: <em>{showAsignarSeccion.nombre}</em></h2>
              <button className="close-btn" onClick={() => setShowAsignarSeccion(null)}>×</button>
            </div>
            <div className="asignar-modal-body">
              <div className="pptx-permiso-toolbar">
                <span></span>
                <div className="pptx-permiso-toolbar-actions">
                  <button
                    className="btn btn-outline btn-small"
                    onClick={() => {
                      const disponibles = getUsuariosDisponibles(showAsignarSeccion);
                      const allSelected = disponibles.every(u => selectedUsuarios.has(`${u.id}_${u.tipo}`));
                      toggleAllUsuariosMatriz(!allSelected);
                    }}
                  >
                    {getUsuariosDisponibles(showAsignarSeccion).every(u => selectedUsuarios.has(`${u.id}_${u.tipo}`)) ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                </div>
              </div>
              <div className="asignar-columnas">
                <div className="asignar-seccion">
                  <h4>Directivos</h4>
                  <div className="asignar-lista pptx-permiso-col-lista">
                    {getUsuariosDisponibles(showAsignarSeccion).filter(u => u.tipo === 'directivo').length === 0 ? (
                      <p className="text-muted">No hay directivos disponibles</p>
                    ) : (
                      getUsuariosDisponibles(showAsignarSeccion).filter(u => u.tipo === 'directivo').map(u => {
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
                  <h4>Personal {getUsuariosDisponibles(showAsignarSeccion).filter(u => u.tipo === 'personal').length > 0 && <span className="asignar-count">{getUsuariosDisponibles(showAsignarSeccion).filter(u => u.tipo === 'personal').length}</span>}</h4>
                  <input
                    type="text"
                    className="pptx-permiso-buscar"
                    placeholder="Buscar personal..."
                    value={busquedaPersonal}
                    onChange={e => setBusquedaPersonal(e.target.value)}
                  />
                  <div className="asignar-lista pptx-permiso-col-lista">
                    {getUsuariosDisponibles(showAsignarSeccion).filter(u => u.tipo === 'personal' && (!busquedaPersonal || u.nombre.toLowerCase().includes(busquedaPersonal.toLowerCase()))).length === 0 ? (
                      <p className="text-muted">{busquedaPersonal ? 'Sin resultados para "' + busquedaPersonal + '"' : 'No hay personal disponible'}</p>
                    ) : (
                      getUsuariosDisponibles(showAsignarSeccion).filter(u => u.tipo === 'personal' && (!busquedaPersonal || u.nombre.toLowerCase().includes(busquedaPersonal.toLowerCase()))).map(u => {
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
                  <button className="btn btn-secondary" onClick={() => setShowAsignarSeccion(null)}>Cancelar</button>
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

export default SuperAdminMatrizIndicadores;
