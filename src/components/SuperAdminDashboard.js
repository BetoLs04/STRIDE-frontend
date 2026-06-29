import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import FormNuevaDireccion from './FormNuevaDireccion';
import FormNuevoDirectivo from './FormNuevoDirectivo';
import FormNuevoPersonal from './FormNuevoPersonal';
import PanelComunicadosAdmin from './PanelComunicadosAdmin';
import SuperAdminMatrizIndicadores from './SuperAdminMatrizIndicadores';
import SuperAdminSMOA from './SuperAdminSMOA';
import SuperAdminSeplade from './SuperAdminSeplade';

const API_URL = 'https://api1.strideutmat.com';

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
  const [savingEdit, setSavingEdit] = useState(false);

  const [usuarios, setUsuarios] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [directivos, setDirectivos] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [estadisticas, setEstadisticas] = useState({ usuarios: 0, direcciones: 0, directivos: 0, personal: 0, comunicados: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!admin) { navigate('/login'); return; }
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
    fetchData();
  }, [admin, navigate, location.state]);

  const fetchData = async () => {
    setLoading(true);
    try {
      try {
        const statsRes = await axios.get(`${API_URL}/api/university/estadisticas`);
        setEstadisticas(statsRes.data.data || { usuarios: 0, direcciones: 0, directivos: 0, personal: 0, comunicados: 0 });
      } catch (e) { console.warn('Error estadísticas:', e.message); }

      try {
        const usersRes = await axios.get(`${API_URL}/api/university/superusers`);
        setUsuarios(usersRes.data.data || []);
      } catch (e) { console.warn('Error usuarios:', e.message); }

      try {
        const dirRes = await axios.get(`${API_URL}/api/university/direcciones`);
        setDirecciones(dirRes.data.data || []);
      } catch (e) { console.warn('Error direcciones:', e.message); }

      try {
        const divRes = await axios.get(`${API_URL}/api/university/directivos`);
        setDirectivos(divRes.data.data || []);
      } catch (e) { console.warn('Error directivos:', e.message); }

      try {
        const persRes = await axios.get(`${API_URL}/api/university/personal`);
        setPersonal(persRes.data.data || []);
      } catch (e) { console.warn('Error personal:', e.message); }

      try {
        const comRes = await axios.get(`${API_URL}/api/university/comunicados-admin`);
        const comunicados = comRes.data.data || [];
        setEstadisticas(prev => ({ ...prev, comunicados: comunicados.length }));
      } catch (e) { console.warn('Error comunicados:', e.message); }

    } catch (error) {
      toast.error('Error al cargar datos del sistema');
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
      await axios.put(`${API_URL}/api/university/directivos/${editingDirectivo.id}`, editFormDirectivo);
      toast.success('Directivo actualizado exitosamente');
      setShowEditDirectivo(false);
      setEditingDirectivo(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar directivo');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteDirectivo = async (directivo) => {
    if (!window.confirm(`¿Estás seguro de eliminar al directivo "${directivo.nombre_completo}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await axios.delete(`${API_URL}/api/university/directivos/${directivo.id}`);
      toast.success('Directivo eliminado exitosamente');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar directivo');
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
    setShowEditPersonal(true);
  };

  const handleEditPersonalFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('La foto no puede exceder 2MB'); return; }
    setEditPersonalFoto(file);
    setEditPersonalFotoPreview(URL.createObjectURL(file));
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
      if (editPersonalFoto) formData.append('foto', editPersonalFoto);
      await axios.put(`${API_URL}/api/university/personal/${editingPersonal.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Personal actualizado exitosamente');
      setShowEditPersonal(false);
      setEditingPersonal(null);
      if (editPersonalFotoPreview) URL.revokeObjectURL(editPersonalFotoPreview);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar personal');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePersonal = async (persona) => {
    if (!window.confirm(`¿Estás seguro de eliminar a "${persona.nombre_completo}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await axios.delete(`${API_URL}/api/university/personal/${persona.id}`);
      toast.success('Personal eliminado exitosamente');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar personal');
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
          <button className="action-btn" onClick={() => navigate('/admin/actividades')}>
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
          <button className="btn btn-primary" onClick={() => navigate('/create-superadmin')}>+ Nuevo Super Admin</button>
        </div>
      </div>
      {loading ? <div className="loading">Cargando usuarios...</div> :
        usuarios.length === 0 ? (
          <div className="no-data">
            <p>No hay usuarios registrados</p>
            <button className="btn btn-primary" onClick={() => navigate('/create-superadmin')}>Crear Primer Usuario</button>
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
                    : `${API_URL}/api/university/personal/foto/default-avatar.png`;
                  return (
                    <tr key={pers.id}>
                      <td>
                        <div className="personal-foto-cell">
                          <img
                            src={fotoUrl}
                            alt={pers.nombre_completo}
                            className="personal-foto"
                            onError={(e) => { e.target.src = `${API_URL}/api/university/personal/foto/default-avatar.png`; }}
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
            <div className="form-group">
              <label>Nombre Completo *</label>
              <input type="text" value={editFormDirectivo.nombre_completo} onChange={e => setEditFormDirectivo({ ...editFormDirectivo, nombre_completo: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Cargo *</label>
              <input type="text" value={editFormDirectivo.cargo} onChange={e => setEditFormDirectivo({ ...editFormDirectivo, cargo: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Dirección *</label>
              <select value={editFormDirectivo.direccion_id} onChange={e => setEditFormDirectivo({ ...editFormDirectivo, direccion_id: e.target.value })} required>
                <option value="">Seleccionar dirección...</option>
                {direcciones.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={editFormDirectivo.email} onChange={e => setEditFormDirectivo({ ...editFormDirectivo, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Nueva Contraseña <small style={{ color: '#9ca3af', fontWeight: 400 }}>(dejar vacío para no cambiar)</small></label>
              <input type="password" value={editFormDirectivo.password} onChange={e => setEditFormDirectivo({ ...editFormDirectivo, password: e.target.value })} placeholder="Nueva contraseña (opcional)" />
            </div>
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
    const fotoActual = editingPersonal.foto_perfil ? `${API_URL}/api/university/personal/foto/${editingPersonal.foto_perfil}` : null;
    return (
      <div className="form-modal">
        <div className="form-modal-content" style={{ maxWidth: '550px' }}>
          <div className="form-header">
            <h2>✏️ Editar Personal</h2>
            <p>Modificando: <strong>{editingPersonal.nombre_completo}</strong></p>
            <button className="close-btn" onClick={() => setShowEditPersonal(false)}>×</button>
          </div>
          <form onSubmit={handleSaveEditPersonal} style={{ padding: '20px 30px 30px' }}>
            <div className="form-group">
              <label>Nombre Completo *</label>
              <input type="text" value={editFormPersonal.nombre_completo} onChange={e => setEditFormPersonal({ ...editFormPersonal, nombre_completo: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Puesto *</label>
              <input type="text" value={editFormPersonal.puesto} onChange={e => setEditFormPersonal({ ...editFormPersonal, puesto: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Dirección *</label>
              <select value={editFormPersonal.direccion_id} onChange={e => setEditFormPersonal({ ...editFormPersonal, direccion_id: e.target.value })} required>
                <option value="">Seleccionar dirección...</option>
                {direcciones.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={editFormPersonal.email} onChange={e => setEditFormPersonal({ ...editFormPersonal, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Nueva Contraseña <small style={{ color: '#9ca3af', fontWeight: 400 }}>(dejar vacío para no cambiar)</small></label>
              <input type="password" value={editFormPersonal.password} onChange={e => setEditFormPersonal({ ...editFormPersonal, password: e.target.value })} placeholder="Nueva contraseña (opcional)" />
            </div>
            <div className="form-group">
              <label>Foto de Perfil</label>
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img
                  src={editPersonalFotoPreview || fotoActual || ''}
                  alt="Foto actual"
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb', display: (editPersonalFotoPreview || fotoActual) ? 'block' : 'none' }}
                />
                <div>
                  <input type="file" id="edit-foto-input" accept="image/*" onChange={handleEditPersonalFoto} style={{ display: 'none' }} />
                  <label htmlFor="edit-foto-input" style={{ cursor: 'pointer', padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem', color: '#475569' }}>
                    📷 {editingPersonal.foto_perfil ? 'Cambiar foto' : 'Subir foto'}
                  </label>
                  {editPersonalFoto && <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#10b981' }}>✅ {editPersonalFoto.name}</span>}
                </div>
              </div>
              <small style={{ color: '#9ca3af' }}>Máximo 2MB • JPG, PNG, GIF</small>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditPersonal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={savingEdit}>{savingEdit ? 'Guardando...' : '💾 Guardar Cambios'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

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
        <button className={`tab-btn ${activeTab === 'smoa' ? 'active' : ''}`} onClick={() => setActiveTab('smoa')}>📈 SMOA</button>
        <button className={`tab-btn ${activeTab === 'seplade' ? 'active' : ''}`} onClick={() => setActiveTab('seplade')}>📋 SEPLADE</button>
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