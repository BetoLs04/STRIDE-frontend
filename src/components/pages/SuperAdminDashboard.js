import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSocketEvent from '../../hooks/useSocketEvent';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import { ROUTES } from '../../constants/routes';
import { toast } from 'react-toastify';
import FormNuevaDireccion from '../shared/FormNuevaDireccion';
import FormNuevoDirectivo from '../shared/FormNuevoDirectivo';
import FormNuevoPersonal from '../shared/FormNuevoPersonal';
import PanelComunicadosAdmin from '../shared/PanelComunicadosAdmin';
import SuperAdminMatrizIndicadores from './SuperAdminMatrizIndicadores';
import SuperAdminSMOA from './SuperAdminSMOA';
import SuperAdminSeplade from './SuperAdminSeplade';
import SuperAdminPOA from './SuperAdminPOA';
import SuperAdminEstadisticosGenero from './SuperAdminEstadisticosGenero';
import SuperAdminEstadisticosDocentes from './SuperAdminEstadisticosDocentes';
import FormInput from '../shared/FormInput';
import '../../styles/SuperAdminDashboard.css';
import FormSelect from '../shared/FormSelect';
import FormFileUpload from '../shared/FormFileUpload';
import { handleApiError } from '../../utils/errorHandler';
import { LIMITS, IMAGES } from '../../constants/index';
import { API_URL } from '../../api';

const SuperAdminDashboard = ({ admin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showFormDireccion, setShowFormDireccion] = useState(false);
  const [showFormDirectivo, setShowFormDirectivo] = useState(false);
  const [showFormPersonal, setShowFormPersonal] = useState(false);

  const [showEditDirectivo, setShowEditDirectivo] = useState(false);
  const [showEditPersonal, setShowEditPersonal] = useState(false);
  const [editingDirectivo, setEditingDirectivo] = useState(null);
  const [editingPersonal, setEditingPersonal] = useState(null);
  const [editFormDirectivo, setEditFormDirectivo] = useState({ nombre_completo: '', cargo: '', direccion_id: '', email: '', password: '' });
  const [editFormPersonal, setEditFormPersonal] = useState({ nombre_completo: '', puesto: '', direccion_id: '', email: '', password: '' });
  const [editPersonalFoto, setEditPersonalFoto] = useState(null);
  const [editPersonalFotoPreview, setEditPersonalFotoPreview] = useState(null);
  const [editPersonalRemoveFoto, setEditPersonalRemoveFoto] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [usuarios, setUsuarios] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [directivos, setDirectivos] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [estadisticas, setEstadisticas] = useState({ usuarios: 0, direcciones: 0, directivos: 0, personal: 0, comunicados: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!admin) { navigate(ROUTES.LOGIN); return; }
    if (location.state?.tab === 'matriz') {
      setActiveTab('matriz');
      window.history.replaceState({}, document.title);
    }
    if (location.state?.tab === 'smoa') {
      setActiveTab('smoa');
      window.history.replaceState({}, document.title);
    }
    if (location.state?.tab === 'seplade') {
      setActiveTab('seplade');
      window.history.replaceState({}, document.title);
    }
    if (location.state?.tab === 'poa') {
      setActiveTab('poa');
      window.history.replaceState({}, document.title);
    }
    if (location.state?.tab === 'estadisticos-genero') {
      setActiveTab('estadisticos-genero');
      window.history.replaceState({}, document.title);
    }
    if (location.state?.tab === 'estadisticos-docentes') {
      setActiveTab('estadisticos-docentes');
      window.history.replaceState({}, document.title);
    }
    fetchData();
  }, [admin, navigate, location.state]);

  const fetchData = async () => {
    setLoading(true);
    try {
      try {
        const statsRes = await api.get('/api/university/estadisticas');
        setEstadisticas(statsRes.data.data || { usuarios: 0, direcciones: 0, directivos: 0, personal: 0, comunicados: 0 });
      } catch (e) { console.warn('Error estadísticas:', e.message); }

      try {
        const usersRes = await api.get('/api/university/superusers');
        setUsuarios(usersRes.data.data || []);
      } catch (e) { console.warn('Error usuarios:', e.message); }

      try {
        const dirRes = await api.get('/api/university/direcciones');
        setDirecciones(dirRes.data.data || []);
      } catch (e) { console.warn('Error direcciones:', e.message); }

      try {
        const divRes = await api.get('/api/university/directivos');
        setDirectivos(divRes.data.data || []);
      } catch (e) { console.warn('Error directivos:', e.message); }

      try {
        const persRes = await api.get('/api/university/personal');
        setPersonal(persRes.data.data || []);
      } catch (e) { console.warn('Error personal:', e.message); }

      try {
        const comRes = await api.get('/api/university/comunicados-admin');
        const comunicados = comRes.data.data || [];
        setEstadisticas(prev => ({ ...prev, comunicados: comunicados.length }));
      } catch (e) { console.warn('Error comunicados:', e.message); }

    } catch (error) {
      handleApiError(error, 'Error al cargar datos del sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDirectivo = (directivo) => {
    setEditingDirectivo(directivo);
    setEditFormDirectivo({
      nombre_completo: directivo.nombre_completo,
      cargo: directivo.cargo,
      direccion_id: directivo.direccion_id,
      email: directivo.email,
      password: ''
    });
    setShowEditDirectivo(true);
  };

  const handleSaveEditDirectivo = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await api.put(`/api/university/directivos/${editingDirectivo.id}`, editFormDirectivo);
      toast.success('Directivo actualizado exitosamente');
      setShowEditDirectivo(false);
      setEditingDirectivo(null);
      fetchData();
    } catch (error) {
      handleApiError(error, 'Error al actualizar directivo');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteDirectivo = async (directivo) => {
    if (!window.confirm(`¿Estás seguro de eliminar al directivo "${directivo.nombre_completo}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/api/university/directivos/${directivo.id}`);
      toast.success('Directivo eliminado exitosamente');
      fetchData();
    } catch (error) {
      handleApiError(error, 'Error al eliminar directivo');
    }
  };

  const handleOpenEditPersonal = (persona) => {
    setEditingPersonal(persona);
    setEditFormPersonal({
      nombre_completo: persona.nombre_completo,
      puesto: persona.puesto,
      direccion_id: persona.direccion_id,
      email: persona.email,
      password: ''
    });
    setEditPersonalFoto(null);
    setEditPersonalFotoPreview(null);
    setEditPersonalRemoveFoto(false);
    setShowEditPersonal(true);
  };

  const handleEditPersonalFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > LIMITS.FILE_SIZE.PHOTO) { toast.error('La foto no puede exceder 2MB'); return; }
    setEditPersonalFoto(file);
    setEditPersonalFotoPreview(URL.createObjectURL(file));
    setEditPersonalRemoveFoto(false);
  };

  const handleRemoveEditPersonalFoto = () => {
    if (editPersonalFotoPreview) URL.revokeObjectURL(editPersonalFotoPreview);
    setEditPersonalFoto(null);
    setEditPersonalFotoPreview(null);
    setEditPersonalRemoveFoto(true);
  };

  const handleSaveEditPersonal = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const formData = new FormData();
      formData.append('nombre_completo', editFormPersonal.nombre_completo);
      formData.append('puesto', editFormPersonal.puesto);
      formData.append('direccion_id', editFormPersonal.direccion_id);
      formData.append('email', editFormPersonal.email);
      if (editFormPersonal.password) formData.append('password', editFormPersonal.password);
      if (editPersonalRemoveFoto) formData.append('removeFoto', 'true');
      if (editPersonalFoto) formData.append('foto', editPersonalFoto);
      await api.put(`/api/university/personal/${editingPersonal.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Personal actualizado exitosamente');
      setShowEditPersonal(false);
      setEditingPersonal(null);
      if (editPersonalFotoPreview) URL.revokeObjectURL(editPersonalFotoPreview);
      fetchData();
    } catch (error) {
      handleApiError(error, 'Error al actualizar personal');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePersonal = async (persona) => {
    if (!window.confirm(`¿Estás seguro de eliminar a "${persona.nombre_completo}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/api/university/personal/${persona.id}`);
      toast.success('Personal eliminado exitosamente');
      fetchData();
    } catch (error) {
      handleApiError(error, 'Error al eliminar personal');
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="welcome-section">
        <h2>Panel de Super Administración</h2>
        <p>Bienvenido, <strong>{admin?.username || 'Administrador'}</strong>. Gestiona todo el sistema universitario.</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card" onClick={() => setActiveTab('usuarios')}>
          <span className="stat-number">{estadisticas.usuarios || 0}</span>
          <span className="stat-label">Super Usuarios</span>
          <div className="stat-icon">👥</div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('direcciones')}>
          <span className="stat-number">{estadisticas.direcciones || 0}</span>
          <span className="stat-label">Direcciones/Áreas</span>
          <div className="stat-icon">🏛️</div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('directivos')}>
          <span className="stat-number">{estadisticas.directivos || 0}</span>
          <span className="stat-label">Directivos</span>
          <div className="stat-icon">👔</div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('personal')}>
          <span className="stat-number">{estadisticas.personal || 0}</span>
          <span className="stat-label">Personal</span>
          <div className="stat-icon">👤</div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('comunicados')}>
          <span className="stat-number">{estadisticas.comunicados || 0}</span>
          <span className="stat-label">Comunicados</span>
          <div className="stat-icon">📢</div>
        </div>
      </div>
      <div className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => setShowFormDireccion(true)}>
            <span className="action-icon">➕</span>
            <span>Nueva Dirección</span>
          </button>
          <button className="action-btn" onClick={() => setShowFormDirectivo(true)}>
            <span className="action-icon">👤</span>
            <span>Nuevo Directivo</span>
          </button>
          <button className="action-btn" onClick={() => setShowFormPersonal(true)}>
            <span className="action-icon">👥</span>
            <span>Nuevo Personal</span>
          </button>
          <button className="action-btn" onClick={() => setActiveTab('comunicados')}>
            <span className="action-icon">📢</span>
            <span>Gestionar Comunicados</span>
          </button>
          <button className="action-btn" onClick={() => navigate(ROUTES.ADMIN_ACTIVIDADES)}>
            <span className="action-icon">📋</span>
            <span>Ver Todas las Actividades</span>
          </button>
          <button className="action-btn" onClick={fetchData}>
            <span className="action-icon">🔄</span>
            <span>Actualizar Datos</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderUsuarios = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>👥 Super Usuarios</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>← Volver al Dashboard</button>
          <button className="btn btn-primary" onClick={() => navigate(ROUTES.CREATE_SUPERADMIN)}>+ Nuevo Super Admin</button>
        </div>
      </div>
      {loading ? <div className="loading">Cargando usuarios...</div> :
        usuarios.length === 0 ? (
          <div className="no-data">
            <p>No hay usuarios registrados</p>
            <button className="btn btn-primary" onClick={() => navigate(ROUTES.CREATE_SUPERADMIN)}>Crear Primer Usuario</button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>ID</th><th>Usuario</th><th>Email</th><th>Fecha de Registro</th></tr></thead>
              <tbody>
                {usuarios.map(usuario => (
                  <tr key={usuario.id}>
                    <td><strong>#{usuario.id}</strong></td>
                    <td>
                      {usuario.username}
                      {usuario.id === admin?.id && (
                        <span style={{ marginLeft: '10px', background: 'var(--accent-gold)', color: 'var(--primary-blue)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Tú</span>
                      )}
                    </td>
                    <td>{usuario.email}</td>
                    <td>{new Date(usuario.created_at).toLocaleDateString('es-ES')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );

  const renderDirecciones = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>🏛️ Direcciones/Áreas</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>← Volver al Dashboard</button>
          <button className="btn btn-primary" onClick={() => setShowFormDireccion(true)}>+ Nueva Dirección</button>
        </div>
      </div>
      {loading ? <div className="loading">Cargando direcciones...</div> :
        direcciones.length === 0 ? (
          <div className="no-data">
            <p>No hay direcciones registradas</p>
            <button className="btn btn-primary" onClick={() => setShowFormDireccion(true)}>Crear Primera Dirección</button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>ID</th><th>Nombre</th><th>Fecha de Creación</th></tr></thead>
              <tbody>
                {direcciones.map(dir => (
                  <tr key={dir.id}>
                    <td><strong>#{dir.id}</strong></td>
                    <td>{dir.nombre}</td>
                    <td>{new Date(dir.created_at).toLocaleDateString('es-ES')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );

  const renderDirectivos = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>👔 Directivos</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>← Volver al Dashboard</button>
          <button className="btn btn-primary" onClick={() => setShowFormDirectivo(true)}>+ Nuevo Directivo</button>
        </div>
      </div>
      {loading ? <div className="loading">Cargando directivos...</div> :
        directivos.length === 0 ? (
          <div className="no-data">
            <p>No hay directivos registrados</p>
            <button className="btn btn-primary" onClick={() => setShowFormDirectivo(true)}>Crear Primer Directivo</button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th><th>Cargo</th><th>Dirección</th><th>Email</th><th>Fecha de Registro</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {directivos.map(dir => (
                  <tr key={dir.id}>
                    <td><strong>{dir.nombre_completo}</strong></td>
                    <td>{dir.cargo}</td>
                    <td>{dir.direccion_nombre || 'Sin asignar'}</td>
                    <td>{dir.email}</td>
                    <td>{new Date(dir.created_at).toLocaleDateString('es-ES')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary btn-small" onClick={() => handleOpenEditDirectivo(dir)}>✏️ Editar</button>
                        <button className="btn btn-danger btn-small" onClick={() => handleDeleteDirectivo(dir)}>🗑️ Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );

  const renderPersonal = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>👥 Personal Administrativo</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>← Volver al Dashboard</button>
          <button className="btn btn-primary" onClick={() => setShowFormPersonal(true)}>+ Nuevo Personal</button>
        </div>
      </div>
      {loading ? <div className="loading">Cargando personal...</div> :
        personal.length === 0 ? (
          <div className="no-data">
            <p>No hay personal registrado</p>
            <button className="btn btn-primary" onClick={() => setShowFormPersonal(true)}>Crear Primer Personal</button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Foto</th><th>Nombre</th><th>Puesto</th><th>Dirección</th><th>Email</th><th>Fecha de Registro</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {personal.map(pers => {
                  const fotoUrl = pers.foto_perfil
                    ? `${API_URL}/api/university/personal/foto/${pers.foto_perfil}`
                    : `${API_URL}${IMAGES.DEFAULT_AVATAR}`;
                  return (
                    <tr key={pers.id}>
                      <td>
                        <div className="personal-foto-cell">
                          <img
                            src={fotoUrl}
                            alt={pers.nombre_completo}
                            className="personal-foto"
                            onError={(e) => { e.target.src = `${API_URL}${IMAGES.DEFAULT_AVATAR}`; }}
                          />
                        </div>
                      </td>
                      <td><strong>{pers.nombre_completo}</strong></td>
                      <td>{pers.puesto}</td>
                      <td>{pers.direccion_nombre || 'Sin asignar'}</td>
                      <td>{pers.email}</td>
                      <td>{new Date(pers.created_at).toLocaleDateString('es-ES')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-primary btn-small" onClick={() => handleOpenEditPersonal(pers)}>✏️ Editar</button>
                          <button className="btn btn-danger btn-small" onClick={() => handleDeletePersonal(pers)}>🗑️ Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="stats-footer">
              <small>Total: {personal.length} | Con foto: {personal.filter(p => p.foto_perfil).length} | Sin foto: {personal.filter(p => !p.foto_perfil).length}</small>
            </div>
          </div>
        )
      }
    </div>
  );

  const renderModalEditDirectivo = () => {
    if (!showEditDirectivo || !editingDirectivo) return null;
    return (
      <div className="form-modal">
        <div className="form-modal-content" style={{ maxWidth: '550px' }}>
          <div className="form-header">
            <h2>✏️ Editar Directivo</h2>
            <p>Modificando: <strong>{editingDirectivo.nombre_completo}</strong></p>
            <button className="close-btn" onClick={() => setShowEditDirectivo(false)}>×</button>
          </div>
          <form onSubmit={handleSaveEditDirectivo} style={{ padding: '20px 30px 30px' }}>
            <FormInput label="Nombre Completo *" name="edit-directivo-nombre" value={editFormDirectivo.nombre_completo} onChange={e => setEditFormDirectivo({ ...editFormDirectivo, nombre_completo: e.target.value })} required />
            <FormInput label="Cargo *" name="edit-directivo-cargo" value={editFormDirectivo.cargo} onChange={e => setEditFormDirectivo({ ...editFormDirectivo, cargo: e.target.value })} required />
            <FormSelect label="Dirección *" name="edit-directivo-direccion" value={editFormDirectivo.direccion_id} onChange={e => setEditFormDirectivo({ ...editFormDirectivo, direccion_id: e.target.value })} required>
              <option value="">Seleccionar dirección...</option>
              {direcciones.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </FormSelect>
            <FormInput label="Email *" name="edit-directivo-email" type="email" value={editFormDirectivo.email} onChange={e => setEditFormDirectivo({ ...editFormDirectivo, email: e.target.value })} required />
            <FormInput label="Nueva Contraseña" name="edit-directivo-password" type="password" value={editFormDirectivo.password} onChange={e => setEditFormDirectivo({ ...editFormDirectivo, password: e.target.value })} placeholder="Nueva contraseña (opcional)" hint="(dejar vacío para no cambiar)" />
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditDirectivo(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={savingEdit}>{savingEdit ? 'Guardando...' : '💾 Guardar Cambios'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderModalEditPersonal = () => {
    if (!showEditPersonal || !editingPersonal) return null;
    const fotoActual = editingPersonal.foto_perfil && !editPersonalRemoveFoto ? `${API_URL}/api/university/personal/foto/${editingPersonal.foto_perfil}` : null;
    return (
      <div className="form-modal">
        <div className="form-modal-content" style={{ maxWidth: '550px' }}>
          <div className="form-header">
            <h2>✏️ Editar Personal</h2>
            <p>Modificando: <strong>{editingPersonal.nombre_completo}</strong></p>
            <button className="close-btn" onClick={() => setShowEditPersonal(false)}>×</button>
          </div>
          <form onSubmit={handleSaveEditPersonal} style={{ padding: '20px 30px 30px' }}>
            <FormInput label="Nombre Completo *" name="edit-personal-nombre" value={editFormPersonal.nombre_completo} onChange={e => setEditFormPersonal({ ...editFormPersonal, nombre_completo: e.target.value })} required />
            <FormInput label="Puesto *" name="edit-personal-puesto" value={editFormPersonal.puesto} onChange={e => setEditFormPersonal({ ...editFormPersonal, puesto: e.target.value })} required />
            <FormSelect label="Dirección *" name="edit-personal-direccion" value={editFormPersonal.direccion_id} onChange={e => setEditFormPersonal({ ...editFormPersonal, direccion_id: e.target.value })} required>
              <option value="">Seleccionar dirección...</option>
              {direcciones.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </FormSelect>
            <FormInput label="Email *" name="edit-personal-email" type="email" value={editFormPersonal.email} onChange={e => setEditFormPersonal({ ...editFormPersonal, email: e.target.value })} required />
            <FormInput label="Nueva Contraseña" name="edit-personal-password" type="password" value={editFormPersonal.password} onChange={e => setEditFormPersonal({ ...editFormPersonal, password: e.target.value })} placeholder="Nueva contraseña (opcional)" hint="(dejar vacío para no cambiar)" />
            <FormFileUpload label="Foto de Perfil" accept="image/*" onChange={handleEditPersonalFoto} preview={editPersonalFotoPreview || fotoActual} onPreviewRemove={handleRemoveEditPersonalFoto} noFileLabel="📷 Subir foto" previewLabel="📷 Cambiar foto" hint="Máximo 2MB • JPG, PNG, GIF" />
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditPersonal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={savingEdit}>{savingEdit ? 'Guardando...' : '💾 Guardar Cambios'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const refreshRef = useRef();
  refreshRef.current = fetchData;

  useSocketEvent('direccion:created', () => refreshRef.current());
  useSocketEvent('directivo:created', () => refreshRef.current());
  useSocketEvent('directivo:updated', () => refreshRef.current());
  useSocketEvent('directivo:deleted', () => refreshRef.current());
  useSocketEvent('personal:created', () => refreshRef.current());
  useSocketEvent('personal:updated', () => refreshRef.current());
  useSocketEvent('personal:deleted', () => refreshRef.current());
  useSocketEvent('actividad:created', () => refreshRef.current());
  useSocketEvent('actividad:updated', () => refreshRef.current());
  useSocketEvent('actividad:deleted', () => refreshRef.current());
  useSocketEvent('actividad:estado-changed', () => refreshRef.current());
  useSocketEvent('comunicado:created', () => refreshRef.current());
  useSocketEvent('comunicado:updated', () => refreshRef.current());
  useSocketEvent('comunicado:deleted', () => refreshRef.current());
  useSocketEvent('tarea:created', () => refreshRef.current());
  useSocketEvent('tarea:updated', () => refreshRef.current());
  useSocketEvent('tarea:deleted', () => refreshRef.current());
  useSocketEvent('tarea:completada', () => refreshRef.current());
  useSocketEvent('logo:updated', () => refreshRef.current());

  return (
    <div className="superadmin-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>STRIDE University Admin</h1>
          <div className="user-info">
            <span className="user-avatar">{(admin?.username || 'A').charAt(0).toUpperCase()}</span>
            <span>{admin?.username || 'Admin'} • Super Admin</span>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>🏠 Dashboard</button>
        <button className={`tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => setActiveTab('usuarios')}>👥 Usuarios</button>
        <button className={`tab-btn ${activeTab === 'direcciones' ? 'active' : ''}`} onClick={() => setActiveTab('direcciones')}>🏛️ Direcciones</button>
        <button className={`tab-btn ${activeTab === 'directivos' ? 'active' : ''}`} onClick={() => setActiveTab('directivos')}>👔 Directivos</button>
        <button className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>👤 Personal</button>
        <button className={`tab-btn ${activeTab === 'comunicados' ? 'active' : ''}`} onClick={() => setActiveTab('comunicados')}>📢 Comunicados</button>
        <button className={`tab-btn ${activeTab === 'matriz' ? 'active' : ''}`} onClick={() => setActiveTab('matriz')}>📊 Matriz de Indicadores</button>
        <button className={`tab-btn ${activeTab === 'smoa' ? 'active' : ''}`} onClick={() => setActiveTab('smoa')}>📈 SOA</button>
        <button className={`tab-btn ${activeTab === 'seplade' ? 'active' : ''}`} onClick={() => setActiveTab('seplade')}>📋 SEPLADE</button>
        <button className={`tab-btn ${activeTab === 'poa' ? 'active' : ''}`} onClick={() => setActiveTab('poa')}>📋 POA</button>
      </div>
      <div className="dashboard-tabs-row">
        <button className={`tab-btn ${activeTab === 'estadisticos-genero' ? 'active' : ''}`} onClick={() => setActiveTab('estadisticos-genero')}>📊 Estadísticos de Aprovechamiento Académico</button>
        <button className={`tab-btn ${activeTab === 'estadisticos-docentes' ? 'active' : ''}`} onClick={() => setActiveTab('estadisticos-docentes')}>📊 Datos Estadísticos - Docentes</button>
      </div>

      <div className="dashboard-main">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'usuarios' && renderUsuarios()}
        {activeTab === 'direcciones' && renderDirecciones()}
        {activeTab === 'directivos' && renderDirectivos()}
        {activeTab === 'personal' && renderPersonal()}
        {activeTab === 'comunicados' && <PanelComunicadosAdmin admin={admin} onClose={() => setActiveTab('dashboard')} />}
        {activeTab === 'matriz' && <SuperAdminMatrizIndicadores onClose={() => setActiveTab('dashboard')} />}
        {activeTab === 'smoa' && <SuperAdminSMOA onClose={() => setActiveTab('dashboard')} />}
        {activeTab === 'seplade' && <SuperAdminSeplade onClose={() => setActiveTab('dashboard')} />}
        {activeTab === 'poa' && <SuperAdminPOA onClose={() => setActiveTab('dashboard')} />}
        {activeTab === 'estadisticos-genero' && <SuperAdminEstadisticosGenero onClose={() => setActiveTab('dashboard')} />}
        {activeTab === 'estadisticos-docentes' && <SuperAdminEstadisticosDocentes onClose={() => setActiveTab('dashboard')} />}
      </div>

      {showFormDireccion && <FormNuevaDireccion onClose={() => setShowFormDireccion(false)} onSuccess={fetchData} />}
      {showFormDirectivo && <FormNuevoDirectivo admin={admin} onClose={() => setShowFormDirectivo(false)} onSuccess={fetchData} />}
      {showFormPersonal && <FormNuevoPersonal admin={admin} onClose={() => setShowFormPersonal(false)} onSuccess={fetchData} />}

      {renderModalEditDirectivo()}
      {renderModalEditPersonal()}
    </div>
  );
};

export default SuperAdminDashboard;