import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import FormNuevaDireccion from './FormNuevaDireccion';
import FormNuevoDirectivo from './FormNuevoDirectivo';
import FormNuevoPersonal from './FormNuevoPersonal';
import PanelComunicadosAdmin from './PanelComunicadosAdmin';

const SuperAdminDashboard = ({ admin }) => {
  const navigate = useNavigate();
  
  // Estados para mostrar formularios modales
  const [showFormDireccion, setShowFormDireccion] = useState(false);
  const [showFormDirectivo, setShowFormDirectivo] = useState(false);
  const [showFormPersonal, setShowFormPersonal] = useState(false);
  
  // Estados para datos
  const [usuarios, setUsuarios] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [directivos, setDirectivos] = useState([]);
  const [personal, setPersonal] = useState([]);
  
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState({ 
    usuarios: 0, 
    direcciones: 0, 
    directivos: 0, 
    personal: 0,
    comunicados: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!admin) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [admin, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Iniciando carga de datos...');

      try {
        const persRes = await axios.get('/api/university/personal');
        const personalData = persRes.data.data || [];
        
        console.log('👤 DEBUG - Datos de personal recibidos:', {
          total: personalData.length,
          primerRegistro: personalData[0] ? {
            nombre: personalData[0].nombre_completo,
            tieneFotoPerfil: !!personalData[0].foto_perfil,
            fotoPerfil: personalData[0].foto_perfil,
            tieneFotoUrl: !!personalData[0].foto_url,
            fotoUrl: personalData[0].foto_url,
            todosLosCampos: Object.keys(personalData[0])
          } : 'No hay datos'
        });
        
        setPersonal(personalData);
        console.log('👤 Personal:', personalData.length);
      } catch (error) {
        console.warn('⚠️ Error cargando personal:', error.message);
      }
      
      // 1. Obtener estadísticas
      try {
        const statsRes = await axios.get('/api/university/estadisticas');
        console.log('📊 Estadísticas:', statsRes.data);
        setEstadisticas(statsRes.data.data || { 
          usuarios: 0, 
          direcciones: 0, 
          directivos: 0, 
          personal: 0,
          comunicados: 0
        });
      } catch (error) {
        console.warn('⚠️ Error cargando estadísticas:', error.message);
      }

      // 2. Obtener super usuarios
      try {
        const usersRes = await axios.get('/api/university/superusers');
        console.log('👥 Usuarios:', usersRes.data.data?.length || 0);
        setUsuarios(usersRes.data.data || []);
      } catch (error) {
        console.warn('⚠️ Error cargando usuarios:', error.message);
      }

      // 3. Obtener direcciones
      try {
        const dirRes = await axios.get('/api/university/direcciones');
        console.log('🏛️ Direcciones:', dirRes.data.data?.length || 0);
        setDirecciones(dirRes.data.data || []);
      } catch (error) {
        console.warn('⚠️ Error cargando direcciones:', error.message);
      }

      // 4. Obtener directivos
      try {
        const dirivosRes = await axios.get('/api/university/directivos');
        console.log('👔 Directivos:', dirivosRes.data.data?.length || 0);
        setDirectivos(dirivosRes.data.data || []);
      } catch (error) {
        console.warn('⚠️ Error cargando directivos:', error.message);
      }

      // 5. Obtener personal
      try {
        const persRes = await axios.get('/api/university/personal');
        console.log('👤 Personal:', persRes.data.data?.length || 0);
        setPersonal(persRes.data.data || []);
      } catch (error) {
        console.warn('⚠️ Error cargando personal:', error.message);
      }

      // 6. Obtener estadísticas de comunicados
      try {
        const comRes = await axios.get('/api/university/comunicados-admin');
        const comunicados = comRes.data.data || [];
        setEstadisticas(prev => ({
          ...prev,
          comunicados: comunicados.length
        }));
        console.log('📢 Comunicados:', comunicados.length);
      } catch (error) {
        console.warn('⚠️ Error cargando comunicados:', error.message);
      }

      console.log('✅ Datos cargados exitosamente');
      
    } catch (error) {
      console.error('❌ Error general al cargar datos:', error);
      toast.error('Error al cargar datos del sistema');
    } finally {
      setLoading(false);
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
          <button className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>
            ← Volver al Dashboard
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/create-superadmin')}>
            + Nuevo Super Admin
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Cargando usuarios...</div>
      ) : usuarios.length === 0 ? (
        <div className="no-data">
          <p>No hay usuarios registrados</p>
          <button className="btn btn-primary" onClick={() => navigate('/create-superadmin')}>
            Crear Primer Usuario
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(usuario => (
                <tr key={usuario.id}>
                  <td><strong>#{usuario.id}</strong></td>
                  <td>
                    {usuario.username}
                    {usuario.id === admin?.id && (
                      <span style={{ 
                        marginLeft: '10px', 
                        background: 'var(--accent-gold)', 
                        color: 'var(--primary-blue)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        Tú
                      </span>
                    )}
                  </td>
                  <td>{usuario.email}</td>
                  <td>{new Date(usuario.created_at).toLocaleDateString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDirecciones = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>🏛️ Direcciones/Áreas</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>
            ← Volver al Dashboard
          </button>
          <button className="btn btn-primary" onClick={() => setShowFormDireccion(true)}>
            + Nueva Dirección
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Cargando direcciones...</div>
      ) : direcciones.length === 0 ? (
        <div className="no-data">
          <p>No hay direcciones registradas</p>
          <button className="btn btn-primary" onClick={() => setShowFormDireccion(true)}>
            Crear Primera Dirección
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Fecha de Creación</th>
              </tr>
            </thead>
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
      )}
    </div>
  );

  const renderDirectivos = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h2>👔 Directivos</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>
            ← Volver al Dashboard
          </button>
          <button className="btn btn-primary" onClick={() => setShowFormDirectivo(true)}>
            + Nuevo Directivo
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Cargando directivos...</div>
      ) : directivos.length === 0 ? (
        <div className="no-data">
          <p>No hay directivos registrados</p>
          <button className="btn btn-primary" onClick={() => setShowFormDirectivo(true)}>
            Crear Primer Directivo
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cargo</th>
                <th>Dirección</th>
                <th>Email</th>
                <th>Fecha de Registro</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderPersonal = () => (
  <div className="tab-content">
    <div className="tab-header">
      <h2>👥 Personal Administrativo</h2>
      <div className="tab-actions">
        <button className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>
          ← Volver al Dashboard
        </button>
        <button className="btn btn-primary" onClick={() => setShowFormPersonal(true)}>
          + Nuevo Personal
        </button>
      </div>
    </div>
    
    {loading ? (
      <div className="loading">Cargando personal...</div>
    ) : personal.length === 0 ? (
      <div className="no-data">
        <p>No hay personal registrado</p>
        <button className="btn btn-primary" onClick={() => setShowFormPersonal(true)}>
          Crear Primer Personal
        </button>
      </div>
    ) : (
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nombre</th>
              <th>Puesto</th>
              <th>Dirección</th>
              <th>Email</th>
              <th>Fecha de Registro</th>
            </tr>
          </thead>
          <tbody>
            {personal.map(pers => {
              // Construir URL de la foto manualmente
              const fotoUrl = pers.foto_perfil 
                ? `/api/university/personal/foto/${pers.foto_perfil}`
                : `/api/university/personal/foto/default-avatar.png`;
              
              return (
                <tr key={pers.id}>
                  <td>
                    <div className="personal-foto-cell">
                      <img 
                        src={fotoUrl}
                        alt={pers.nombre_completo}
                        className="personal-foto"
                        onError={(e) => {
                          console.error(`Error cargando foto para ${pers.nombre_completo}:`, pers.foto_perfil);
                          e.target.src = '/api/university/personal/foto/default-avatar.png';
                        }}
                      />
                    </div>
                  </td>
                  <td>
                    <strong>{pers.nombre_completo}</strong>
                    {pers.foto_perfil && (
                      <span style={{ 
                        fontSize: '0.7rem', 
                        color: 'green',
                        marginLeft: '5px'
                      }}>
                        (con foto)
                      </span>
                    )}
                  </td>
                  <td>{pers.puesto}</td>
                  <td>{pers.direccion_nombre || 'Sin asignar'}</td>
                  <td>{pers.email}</td>
                  <td>{new Date(pers.created_at).toLocaleDateString('es-ES')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Estadísticas */}
        <div className="stats-footer">
          <small>
            Total: {personal.length} | 
            Con foto: {personal.filter(p => p.foto_perfil).length} | 
            Sin foto: {personal.filter(p => !p.foto_perfil).length}
          </small>
        </div>
      </div>
    )}
  </div>
);

  return (
    <div className="superadmin-dashboard">
      {/* Header del Dashboard */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>STRIDE University Admin</h1>
          <div className="user-info">
            <span className="user-avatar">
              {(admin?.username || 'A').charAt(0).toUpperCase()}
            </span>
            <span>{admin?.username || 'Admin'} • Super Admin</span>
          </div>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          🏠 Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          👥 Usuarios
        </button>
        <button 
          className={`tab-btn ${activeTab === 'direcciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('direcciones')}
        >
          🏛️ Direcciones
        </button>
        <button 
          className={`tab-btn ${activeTab === 'directivos' ? 'active' : ''}`}
          onClick={() => setActiveTab('directivos')}
        >
          👔 Directivos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          👤 Personal
        </button>
        <button 
          className={`tab-btn ${activeTab === 'comunicados' ? 'active' : ''}`}
          onClick={() => setActiveTab('comunicados')}
        >
          📢 Comunicados
        </button>
      </div>

      {/* Contenido principal según pestaña activa */}
      <div className="dashboard-main">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'usuarios' && renderUsuarios()}
        {activeTab === 'direcciones' && renderDirecciones()}
        {activeTab === 'directivos' && renderDirectivos()}
        {activeTab === 'personal' && renderPersonal()}
        {activeTab === 'comunicados' && (
          <PanelComunicadosAdmin 
            admin={admin}
            onClose={() => setActiveTab('dashboard')}
          />
        )}
      </div>

      {/* Modales de formularios (solo se muestran cuando están activos) */}
      {showFormDireccion && (
        <FormNuevaDireccion 
          onClose={() => setShowFormDireccion(false)}
          onSuccess={fetchData}
        />
      )}
      
      {showFormDirectivo && (
        <FormNuevoDirectivo 
          admin={admin}
          onClose={() => setShowFormDirectivo(false)}
          onSuccess={fetchData}
        />
      )}
      
      {showFormPersonal && (
        <FormNuevoPersonal 
          admin={admin}
          onClose={() => setShowFormPersonal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default SuperAdminDashboard;