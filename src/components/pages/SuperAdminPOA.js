import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { ROUTES } from '../../constants/routes';
import { toast } from 'react-toastify';
import '../../styles/SuperAdminPOA.css';
import FormInput from '../shared/FormInput';
import { handleApiError } from '../../utils/errorHandler';
import useSocketEvent from '../../hooks/useSocketEvent';

const SuperAdminPOA = ({ onClose }) => {
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
    anio: ''
  });
  const [encabezadoLoading, setEncabezadoLoading] = useState(true);
  const [encabezadoSaving, setEncabezadoSaving] = useState(false);
  const [editingEncabezado, setEditingEncabezado] = useState(false);

  useEffect(() => {
    fetchData();
    fetchEncabezado();
  }, []);

  const refreshRef = useRef();

  useSocketEvent('poa:updated', () => refreshRef.current && refreshRef.current());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [secRes, usuRes] = await Promise.all([
        api.get('/api/university/poa-secciones'),
        api.get('/api/university/poa-usuarios')
      ]);
      setSecciones(secRes.data.data || []);
      setUsuarios(usuRes.data.data || []);
    } catch (error) {
      handleApiError(error, 'Error al cargar hojas');
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
      const res = await api.get('/api/university/poa-encabezado');
      if (res.data.success && res.data.data) {
        setEncabezado(res.data.data);
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
      await api.put('/api/university/poa-encabezado', encabezado);
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
        await api.put(`/api/university/poa-secciones/${editId}`, { nombre: formNombre.trim() });
        toast.success('Hoja actualizada');
      } else {
        await api.post('/api/university/poa-secciones', { nombre: formNombre.trim() });
        toast.success('Hoja creada');
      }
      setShowForm(false);
      setEditId(null);
      setFormNombre('');
      fetchData();
    } catch (error) {
      handleApiError(error, 'Error al guardar hoja');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (seccion) => {
    if (!window.confirm(`¿Eliminar la hoja "${seccion.nombre}"?\nTambién se eliminarán las asignaciones de usuarios.`)) return;
    try {
      await api.delete(`/api/university/poa-secciones/${seccion.id}`);
      toast.success('Hoja eliminada');
      fetchData();
    } catch (error) {
      handleApiError(error, 'Error al eliminar hoja');
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

  const toggleAllUsuarios = (value) => {
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
          api.post(`/api/university/poa-secciones/${showAsignarSeccion.id}/usuarios`, {
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
    if (!window.confirm(`¿Quitar a "${usuario.nombre}" de esta hoja?`)) return;
    try {
      await api.delete(`/api/university/poa-secciones/${seccionId}/usuarios/${usuario.usuario_id}/${usuario.usuario_tipo}`);
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
    <div className="tab-content poa-admin">
      <div className="tab-header">
        <h2>📋 POA - Programa Operativo Anual</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={onClose}>← Volver al Dashboard</button>
          <button className="btn btn-primary" onClick={handleOpenNew}>+ Nueva Hoja</button>
        </div>
      </div>

      <div className="poa-admin-layout">
        <div className="poa-admin-left">
          {loading ? (
            <div className="loading">Cargando hojas...</div>
          ) : secciones.length === 0 ? (
            <div className="no-data">
              <p>No hay hojas registradas</p>
              <button className="btn btn-primary" onClick={handleOpenNew}>Crear Primera Hoja</button>
            </div>
          ) : (
            <div className="poa-secciones-list">
              {secciones.map(seccion => (
                <div key={seccion.id} className="poa-seccion-card">
                  <div className="poa-seccion-header">
                    <div className="poa-seccion-info">
                      <h3>{seccion.nombre}</h3>
                      <span className="poa-seccion-badge">{seccion.total_usuarios || 0} usuario(s)</span>
                      <button className="btn btn-outline btn-small" onClick={() => handleOpenAsignar(seccion)} style={{ marginLeft: '8px' }}>👥 Asignar</button>
                    </div>
                    <div className="poa-seccion-actions">
                      <button className="btn btn-info btn-small" onClick={() => navigate(`/admin/poa/${seccion.id}`)}>📄 Visitar hoja</button>
                      <button className="btn btn-secondary btn-small" onClick={() => handleOpenEdit(seccion)}>✏️ Editar</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(seccion)}>🗑️ Eliminar</button>
                    </div>
                  </div>

                  <div className="poa-seccion-usuarios">
                    {(!seccion.usuarios || seccion.usuarios.length === 0) ? (
                      <p className="text-muted">Sin usuarios asignados</p>
                    ) : (
                      <div className="poa-usuarios-tags">
                        {seccion.usuarios.map(u => (
                          <span key={u.asignacion_id} className="poa-usuario-tag">
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

        <div className="poa-admin-right">
          <div className="poa-encabezado-panel">
            <div className="poa-encabezado-header">
              <h3>📋 Datos</h3>
              {!encabezadoLoading && (
                <button className="poa-encabezado-edit-toggle" onClick={() => setEditingEncabezado(!editingEncabezado)} title={editingEncabezado ? 'Cancelar edición' : 'Editar'}>
                  {editingEncabezado ? '✕' : '✏️'}
                </button>
              )}
            </div>
            {encabezadoLoading ? (
              <div className="loading" style={{ padding: '1rem' }}>Cargando...</div>
            ) : editingEncabezado ? (
              <div className="poa-encabezado-form">
                <FormInput label="AÑO" name="poa-anio" value={encabezado.anio || ''} onChange={e => handleEncabezadoChange('anio', e.target.value)} placeholder="AAAA" className="poa-encabezado-field" />
                <div className="poa-encabezado-form-actions">
                  <button className="btn btn-secondary" onClick={handleCancelEncabezado} disabled={encabezadoSaving}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleSaveEncabezado} disabled={encabezadoSaving}>
                    {encabezadoSaving ? 'Guardando...' : '💾 Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="poa-encabezado-view">
                <div className="poa-encabezado-row">
                  <span className="poa-encabezado-label">AÑO</span>
                  <span className="poa-encabezado-value">{encabezado.anio || '—'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-modal-content" style={{ maxWidth: '450px' }}>
            <div className="form-header">
              <h2>{editId ? '✏️ Editar Hoja' : '➕ Nueva Hoja'}</h2>
              <button className="close-btn" onClick={() => { setShowForm(false); setEditId(null); setFormNombre(''); }}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 30px 30px' }}>
              <FormInput label="Nombre de la Hoja *" name="poa-seccion-nombre" value={formNombre} onChange={e => setFormNombre(e.target.value)} placeholder="Ej: Dirección de Gestión Administrativa" required autoFocus />
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); setFormNombre(''); }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editId ? '💾 Guardar Cambios' : '✓ Crear Hoja'}
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
                      toggleAllUsuarios(!allSelected);
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

export default SuperAdminPOA;
