import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import '../styles/PersonalDashboard.css';

const PersonalDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFormActividad, setShowFormActividad] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo_actividad: '', 
    fecha_inicio: '',
    fecha_fin: '',
    imagenes: []
  });

  // Estado para controlar expansión de años y períodos
  const [expansiones, setExpansiones] = useState({
    años: {}, // Ej: { '2024': true, '2023': false }
    periodos: {} // Ej: { '2024-enero-abril': true, '2024-mayo-agosto': false }
  });

  // Configuración del carrusel
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true
  };

  // Configuración del carrusel SIN DOTS (para modal)
  const carouselSettingsModal = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: true,
    autoplay: false,
    pauseOnHover: true
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.tipo !== 'personal') {
      toast.error('Acceso no autorizado');
      navigate('/login');
      return;
    }
    
    fetchActividades();
  }, [user, navigate]);

  const fetchActividades = async () => {
    try {
      if (!user.direccion_id) {
        toast.error('No tienes una dirección asignada');
        setError('No tienes una dirección asignada');
        return;
      }
      
      const response = await axios.get(`https://api1.strideutmat.com/api/university/actividades/direccion/${user.direccion_id}`);
      setActividades(response.data.data || []);
    } catch (error) {
      console.error('Error fetching actividades:', error);
      toast.error('Error al cargar actividades');
      setError('No se pudieron cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  // ========== FUNCIONES PARA AGRUPAR POR AÑO Y PERÍODO ==========
  
  // Función para obtener año y período
  const obtenerAnioYPeriodo = (fecha) => {
    if (!fecha) return { anio: 'Sin año', periodo: 'sin-fecha', anioNum: 0 };
    
    const fechaActividad = new Date(fecha);
    const anio = fechaActividad.getFullYear();
    const mes = fechaActividad.getMonth() + 1; // 1-12
    
    let periodo;
    if (mes >= 1 && mes <= 4) periodo = 'enero-abril';
    else if (mes >= 5 && mes <= 8) periodo = 'mayo-agosto';
    else if (mes >= 9 && mes <= 12) periodo = 'septiembre-diciembre';
    else periodo = 'sin-periodo';
    
    return { 
      anio: anio.toString(), 
      periodo, 
      anioNum: anio,
      periodoNum: mes
    };
  };

  // Agrupar actividades por AÑO primero, luego por PERÍODO
  const agruparPorAnioYPeriodo = (actividadesLista) => {
    const agrupacion = {};
    
    actividadesLista.forEach(actividad => {
      const { anio, periodo, anioNum } = obtenerAnioYPeriodo(actividad.fecha_inicio);
      
      if (!agrupacion[anio]) {
        agrupacion[anio] = {
          anio: anio,
          anioNum: anioNum,
          actividades: [],
          periodos: {
            'enero-abril': { 
              actividades: [], 
              label: '❄️ Enero - Abril', 
              color: '#4A90E2',
              emoji: '❄️',
              orden: 1
            },
            'mayo-agosto': { 
              actividades: [], 
              label: '🌸 Mayo - Agosto', 
              color: '#50C878',
              emoji: '🌸',
              orden: 2
            },
            'septiembre-diciembre': { 
              actividades: [], 
              label: '🍂 Septiembre - Diciembre', 
              color: '#FF7F50',
              emoji: '🍂',
              orden: 3
            },
            'sin-fecha': { 
              actividades: [], 
              label: '📅 Sin fecha definida', 
              color: '#A0A0A0',
              emoji: '📅',
              orden: 4
            }
          }
        };
      }
      
      // Agregar a actividades totales del año
      agrupacion[anio].actividades.push(actividad);
      
      // Agregar al período correspondiente
      if (agrupacion[anio].periodos[periodo]) {
        agrupacion[anio].periodos[periodo].actividades.push(actividad);
      }
    });
    
    // Ordenar años de más reciente a más antiguo
    const añosOrdenados = Object.values(agrupacion).sort((a, b) => b.anioNum - a.anioNum);
    
    // Ordenar actividades dentro de cada período por fecha (más reciente primero)
    añosOrdenados.forEach(año => {
      Object.values(año.periodos).forEach(periodo => {
        periodo.actividades.sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));
      });
      año.actividades.sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));
    });
    
    return añosOrdenados;
  };

  // Función para obtener el período actual (año y período)
  const obtenerPeriodoActual = () => {
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth() + 1;
    
    let periodoActual;
    if (mesActual >= 1 && mesActual <= 4) periodoActual = 'enero-abril';
    else if (mesActual >= 5 && mesActual <= 8) periodoActual = 'mayo-agosto';
    else if (mesActual >= 9 && mesActual <= 12) periodoActual = 'septiembre-diciembre';
    else periodoActual = 'enero-abril';
    
    return { anio: anioActual.toString(), periodo: periodoActual };
  };

  // Funciones para controlar expansión
  const toggleAnioExpandido = (anio) => {
    setExpansiones(prev => ({
      ...prev,
      años: {
        ...prev.años,
        [anio]: !prev.años[anio]
      }
    }));
  };

  const togglePeriodoExpandido = (anio, periodoKey) => {
    const key = `${anio}-${periodoKey}`;
    setExpansiones(prev => ({
      ...prev,
      periodos: {
        ...prev.periodos,
        [key]: !prev.periodos[key]
      }
    }));
  };

  // ========== FUNCIONES PARA FECHAS ==========

  // Obtener fecha mínima (2 semanas antes de hoy)
  const getMinDate = () => {
    const hoy = new Date();
    const dosSemanasAtras = new Date(hoy);
    dosSemanasAtras.setDate(hoy.getDate() - 14); // 2 semanas = 14 días
    
    return dosSemanasAtras.toISOString().split('T')[0];
  };

  // Obtener fecha máxima (1 año desde hoy)
  const getMaxDate = () => {
    const hoy = new Date();
    const unAnoAdelante = new Date(hoy);
    unAnoAdelante.setFullYear(hoy.getFullYear() + 1);
    
    return unAnoAdelante.toISOString().split('T')[0];
  };

  // Validación para asegurar que fecha_inicio no sea muy antigua
  const isFechaInicioValida = (fecha) => {
    const fechaSeleccionada = new Date(fecha);
    const hoy = new Date();
    const dosSemanasAtras = new Date(hoy);
    dosSemanasAtras.setDate(hoy.getDate() - 14);
    
    return fechaSeleccionada >= dosSemanasAtras;
  };

  const getInitial = () => {
    if (!user || !user.nombre) return '?';
    return user.nombre.charAt(0).toUpperCase();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (files) => {
    const newFiles = Array.from(files);
    
    if (newFiles.length + formData.imagenes.length > 5) {
      toast.error('Solo puedes subir máximo 5 imágenes');
      return;
    }

    const oversizedFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Alguna imagen excede el tamaño máximo de 5MB');
      return;
    }

    const invalidFiles = newFiles.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    const imagenesConPreview = newFiles.map(file => {
      return {
        file: file,
        preview: URL.createObjectURL(file),
        nombre: file.name,
        tamano: file.size,
        tipo: file.type
      };
    });

    setFormData({
      ...formData,
      imagenes: [...formData.imagenes, ...imagenesConPreview]
    });

    toast.success(`${newFiles.length} imagen(es) cargada(s) correctamente`);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files);
    }
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(formData.imagenes[index].preview);
    
    const nuevasImagenes = formData.imagenes.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      imagenes: nuevasImagenes
    });
    toast.info('Imagen eliminada');
  };

  const handleSubmitActividad = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }
    
    // NUEVA VALIDACIÓN: tipo_actividad es requerido
    if (!formData.tipo_actividad.trim()) {
      toast.error('El tipo de actividad es requerido');
      return;
    }
    
    // Validar longitud del tipo_actividad
    if (formData.tipo_actividad.length > 100) {
      toast.error('El tipo de actividad no puede exceder los 100 caracteres');
      return;
    }
    
    if (!formData.fecha_inicio) {
      toast.error('La fecha de inicio es requerida');
      return;
    }
    
    // Validar que fecha_inicio esté en el rango permitido
    if (!isFechaInicioValida(formData.fecha_inicio)) {
      toast.error('La fecha de inicio debe ser de los últimos 14 días');
      return;
    }
    
    if (formData.fecha_fin && new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
      toast.error('La fecha de fin no puede ser anterior a la fecha de inicio');
      return;
    }
    
    const wordCount = formData.descripcion.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 200) {
      toast.error('La descripción no puede exceder las 200 palabras');
      return;
    }
    
    setUploadingImages(true);
    
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('tipo_actividad', formData.tipo_actividad); // NUEVO: agregar tipo_actividad
      formDataToSend.append('fecha_inicio', formData.fecha_inicio);
      formDataToSend.append('fecha_fin', formData.fecha_fin || '');
      formDataToSend.append('direccion_id', user.direccion_id);
      formDataToSend.append('creado_por_id', user.id);
      formDataToSend.append('creado_por_tipo', 'personal');
      
      formData.imagenes.forEach((imagenObj, index) => {
        formDataToSend.append(`imagenes`, imagenObj.file);
      });
      
      console.log('Enviando actividad con', formData.imagenes.length, 'imágenes');
      console.log('Tipo de actividad:', formData.tipo_actividad);
      
      const response = await axios.post('https://api1.strideutmat.com/api/university/actividades', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Actividad creada exitosamente con ' + formData.imagenes.length + ' imagen(es)!');
      
      // Limpiar formulario
      setFormData({ 
        titulo: '', 
        descripcion: '', 
        tipo_actividad: '', // Limpiar este campo también
        fecha_inicio: '',
        fecha_fin: '',
        imagenes: [] 
      });
      setShowFormActividad(false);
      fetchActividades();
      
    } catch (error) {
      console.error('Error al crear actividad:', error);
      toast.error(error.response?.data?.error || 'Error al crear actividad');
    } finally {
      setUploadingImages(false);
    }
  };

  useEffect(() => {
    return () => {
      formData.imagenes.forEach(imagen => {
        if (imagen.preview) {
          URL.revokeObjectURL(imagen.preview);
        }
      });
    };
  }, [formData.imagenes]);

  const getEstadoBadge = (estado) => {
    const estados = {
      pendiente: { label: 'Pendiente', class: 'estado-pendiente' },
      en_progreso: { label: 'En Progreso', class: 'estado-progreso' },
      completada: { label: 'Completada', class: 'estado-completada' }
    };
    
    const estadoInfo = estados[estado] || estados.pendiente;
    return <span className={`badge ${estadoInfo.class}`}>{estadoInfo.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getDiasRestantes = (fechaFin) => {
    if (!fechaFin) return null;
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diffTime = fin - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `Faltan ${diffDays} días`;
    if (diffDays === 0) return 'Finaliza hoy';
    return `Finalizó hace ${Math.abs(diffDays)} días`;
  };

  const updateEstadoActividad = async (actividadId, nuevoEstado) => {
    try {
      await axios.put(`https://api1.strideutmat.com/api/university/actividades/${actividadId}/estado`, {
        estado: nuevoEstado
      });
      
      toast.success('Estado actualizado');
      fetchActividades();
      
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const eliminarActividad = async (actividadId, titulo) => {
    if (!window.confirm(`¿Estás seguro de eliminar la actividad "${titulo}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      const response = await axios.delete(`https://api1.strideutmat.com/api/university/actividades/${actividadId}`);
      
      if (response.data.success) {
        toast.success('Actividad eliminada exitosamente');
        
        setActividades(prev => prev.filter(a => a.id !== actividadId));
        
        if (response.data.imagenesEliminadas > 0) {
          toast.info(`Se eliminaron ${response.data.imagenesEliminadas} imágenes`);
        }
      }
      
    } catch (error) {
      console.error('Error eliminando actividad:', error);
      
      let errorMessage = 'Error al eliminar actividad';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast.error(errorMessage);
    }
  };

  // ========== FUNCIONES PARA MODAL ==========

  // Función para abrir modal de actividad
  const abrirModalActividad = (actividad) => {
    setActividadSeleccionada(actividad);
    setModalAbierto(true);
    document.body.style.overflow = 'hidden';
  };

  // Función para cerrar modal
  const cerrarModal = () => {
    setModalAbierto(false);
    setActividadSeleccionada(null);
    document.body.style.overflow = 'auto';
  };

  // Cerrar modal con ESC
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && modalAbierto) {
        cerrarModal();
      }
    };

    if (modalAbierto) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [modalAbierto]);

  // ========== COMPONENTE TARJETA MINIMALISTA ==========

  // Componente para tarjeta de actividad minimalista (similar a DirectivoDashboard)
  const TarjetaActividadMinimalista = ({ actividad }) => {
    return (
      <div className="actividad-minimalista-card">
        <div className="actividad-minimalista-content">
          <div className="actividad-minimalista-info">
            <h3>{actividad.titulo}</h3>
            <div className="actividad-minimalista-metadata">
              <span className="actividad-minimalista-creador">
                👤 {actividad.creado_por_nombre || 'Sistema'}
              </span>
              <span className="actividad-minimalista-fecha">
                📅 {new Date(actividad.fecha_inicio).toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </span>
              {getEstadoBadge(actividad.estado)}
            </div>
          </div>
          
          <div className="actividad-minimalista-actions">
            <button 
              className="btn btn-primary btn-small"
              onClick={() => abrirModalActividad(actividad)}
            >
              👁️ Ver detalles
            </button>
            
            {actividad.creado_por_id === user.id && (
              <button
                className="btn btn-danger btn-small"
                onClick={() => eliminarActividad(actividad.id, actividad.titulo)}
                title="Eliminar esta actividad"
                style={{ marginLeft: '10px' }}
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="loading-container" style={{ height: '100vh' }}>
        <div className="spinner"></div>
        <p>Cargando información del usuario...</p>
      </div>
    );
  }

  // Obtener actividades agrupadas por año y período
  const agrupacionPorAnio = agruparPorAnioYPeriodo(actividades);
  const periodoActual = obtenerPeriodoActual();

  return (
    <div className="dashboard-container">
      {/* CABECERA CORREGIDA (estilo Directivo) - MANTENIENDO EL ESTILO ORIGINAL */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Panel de Personal</h1>
        </div>
        
        <div className="header-center-personal">
        <div className="user-info-center">
          <div className="user-avatar-large">
            {getInitial()}
          </div>
          <div className="user-details-center">
            <h3>{user.nombre || 'Usuario no identificado'}</h3>
            <p>
              <span className="user-cargo-center">{user.puesto || 'Sin puesto'}</span>
              <span className="user-separator-center"> - </span>
              <span className="user-direccion-center">{user.direccion_nombre || 'Sin dirección asignada'}</span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="header-right-personal">
        <button className="btn btn-primary" onClick={() => setShowFormActividad(true)}>
          + Nueva Actividad
        </button>
      </div>
      </div>

      <div className="dashboard-content">
        {/* BANNER MEJORADO */}
        <div className="dashboard-header-banner">
          <div className="banner-left">
            <h2 className="banner-title">📋 Gestión de Actividades</h2>
            <p className="banner-subtitle">
              Crea y gestiona actividades para {user.direccion_nombre || 'tu dirección'}
            </p>
          </div>
          
          <div className="banner-right">
            <div className="periodo-actual-banner">
              <span className="periodo-emoji-banner">
                {periodoActual.periodo === 'enero-abril' ? '❄️' : 
                 periodoActual.periodo === 'mayo-agosto' ? '🌸' : '🍂'}
              </span>
              <div className="periodo-text-banner">
                <h4>📅 PERÍODO ACTUAL</h4>
                <p>
                  Año {periodoActual.anio} • 
                  {periodoActual.periodo === 'enero-abril' ? ' Enero - Abril' : 
                   periodoActual.periodo === 'mayo-agosto' ? ' Mayo - Agosto' : ' Septiembre - Diciembre'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* ESTADÍSTICAS CON ICONOS */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-number">{actividades.length}</span>
            <span className="stat-label">Total</span>
            <div className="stat-icon">📋</div>
          </div>
          
          <div className="stat-card">
            <span className="stat-number">
              {actividades.filter(a => a.creado_por_id === user.id).length}
            </span>
            <span className="stat-label">Creadas por mí</span>
            <div className="stat-icon">👤</div>
          </div>
          
          <div className="stat-card">
            <span className="stat-number">
              {actividades.filter(a => a.estado === 'completada').length}
            </span>
            <span className="stat-label">Completadas</span>
            <div className="stat-icon">✅</div>
          </div>
          
          <div className="stat-card">
            <span className="stat-number">
              {actividades.filter(a => a.estado === 'en_progreso').length}
            </span>
            <span className="stat-label">En Progreso</span>
            <div className="stat-icon">🚀</div>
          </div>
          
          <div className="stat-card">
            <span className="stat-number">
              {actividades.filter(a => a.estado === 'pendiente').length}
            </span>
            <span className="stat-label">Pendientes</span>
            <div className="stat-icon">⏳</div>
          </div>
        </div>

        <div className="section-header">
          <h2>📋 Mis Actividades</h2>
          <p>Gestiona las actividades de {user.direccion_nombre || 'tu dirección'}</p>
        </div>

        {error ? (
          <div className="error-message-box">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchActividades}>
              Reintentar
            </button>
          </div>
        ) : loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando actividades...</p>
          </div>
        ) : actividades.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📭</div>
            <h3>No hay actividades registradas</h3>
            <p>Crea tu primera actividad para comenzar.</p>
            <button className="btn btn-primary" onClick={() => setShowFormActividad(true)}>
              + Crear Primera Actividad
            </button>
          </div>
        ) : (
          <div className="periodos-container">
            <div className="periodos-controls">
              <h3>📅 Actividades por Período</h3>
            </div>

            {/* Mostrar años con actividades */}
            {agrupacionPorAnio
              .filter(añoData => añoData.actividades.length > 0)
              .map(añoData => (
                <div key={añoData.anio} className="año-acordeon">
                  <div 
                    className="año-acordeon-header" 
                    onClick={() => toggleAnioExpandido(añoData.anio)}
                    style={{ 
                      backgroundColor: añoData.anio === periodoActual.anio 
                        ? '#e8f4fd' 
                        : '#f8f9fa' 
                    }}
                  >
                    <div className="año-acordeon-title">
                      <span className="año-emoji">📅</span>
                      <h3>Año {añoData.anio}</h3>
                      {añoData.anio === periodoActual.anio && (
                        <span className="año-actual-badge">AÑO ACTUAL</span>
                      )}
                    </div>
                    
                    <div className="año-acordeon-controls">
                      <span className="año-count">
                        {añoData.actividades.length} actividad(es)
                      </span>
                      <span className="año-toggle">
                        {expansiones.años[añoData.anio] ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>
                  
                  {expansiones.años[añoData.anio] && (
                    <div className="año-acordeon-content">
                      {/* Mostrar períodos dentro del año */}
                      {Object.entries(añoData.periodos)
                        .filter(([_, periodoData]) => periodoData.actividades.length > 0)
                        .sort(([keyA, a], [keyB, b]) => a.orden - b.orden)
                        .map(([periodoKey, periodoData]) => (
                          <div key={periodoKey} className="periodo-acordeon">
                            <div 
                              className="periodo-acordeon-header" 
                              onClick={() => togglePeriodoExpandido(añoData.anio, periodoKey)}
                              style={{ borderLeftColor: periodoData.color }}
                            >
                              <div className="periodo-acordeon-title">
                                <span className="periodo-emoji">{periodoData.emoji}</span>
                                <h4>{periodoData.label}</h4>
                                {añoData.anio === periodoActual.anio && periodoKey === periodoActual.periodo && (
                                  <span className="periodo-actual-badge">PERÍODO ACTUAL</span>
                                )}
                              </div>
                              
                              <div className="periodo-acordeon-controls">
                                <span className="periodo-count">
                                  {periodoData.actividades.length} actividad(es)
                                </span>
                                <span className="periodo-toggle">
                                  {expansiones.periodos[`${añoData.anio}-${periodoKey}`] ? '▲' : '▼'}
                                </span>
                              </div>
                            </div>
                            
                            {expansiones.periodos[`${añoData.anio}-${periodoKey}`] && (
                              <div className="periodo-acordeon-content">
                                <div className="actividades-lista-minimalista">
                                  {periodoData.actividades.map(actividad => (
                                    <TarjetaActividadMinimalista 
                                      key={actividad.id} 
                                      actividad={actividad} 
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modal de Actividad */}
      {modalAbierto && actividadSeleccionada && (
        <div className="actividad-modal-overlay" onClick={cerrarModal}>
          <div className="actividad-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={cerrarModal}>
              ✕
            </button>
            
            <div className="modal-header">
              <h2>{actividadSeleccionada.titulo}</h2>
              <div className="modal-header-badges">
                {getEstadoBadge(actividadSeleccionada.estado)}
                <span className={`tipo-badge-modal ${actividadSeleccionada.creado_por_tipo}`}>
                  {actividadSeleccionada.creado_por_tipo === 'personal' ? '📝 Personal' : '👔 Directivo'}
                </span>
              </div>
            </div>
            
            <div className="modal-body">
              <div className="modal-creador-info">
                <span className="creador-label">👤 Creador:</span>
                <span className="creador-valor">
                  {actividadSeleccionada.creado_por_nombre || 'Sistema'}
                </span>
                <span className="creador-separator">•</span>
                <span className="creador-direccion">
                  🏛️ {actividadSeleccionada.direccion_nombre || 'Sin dirección'}
                </span>
              </div>
              
              <div className="modal-descripcion">
                <h4>📄 Descripción:</h4>
                <p>{actividadSeleccionada.descripcion || 'Sin descripción'}</p>
              </div>
              
              {/* Mostrar tipo de actividad en modal */}
              <div className="modal-descripcion">
                <h4>📌 Tipo de Actividad:</h4>
                <p>{actividadSeleccionada.tipo_actividad || 'No especificado'}</p>
              </div>
              
              {/* Carrusel de imágenes en modal */}
              {actividadSeleccionada.imagenes && actividadSeleccionada.imagenes.length > 0 && (
                <div className="modal-imagenes">
                  <h4>🖼️ Galería de Evidencias ({actividadSeleccionada.imagenes.length})</h4>
                  <Slider {...carouselSettingsModal} className="modal-carousel">
                    {actividadSeleccionada.imagenes.map((img, index) => (
                      <div key={index} className="modal-slide">
                        <div className="modal-slide-content">
                          <img 
                            src={img.url} 
                            alt={`Evidencia ${index + 1} - ${actividadSeleccionada.titulo}`}
                            className="modal-image"
                            onError={(e) => {
                              e.target.src = '/placeholder.jpg';
                              e.target.alt = 'Imagen no disponible';
                            }}
                          />
                          <div className="modal-image-info">
                            <span>Evidencia {index + 1} de {actividadSeleccionada.imagenes.length}</span>
                            <small>{img.nombre_archivo || 'Sin nombre'}</small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>
              )}
              
              <div className="modal-fechas">
                <h4>📅 Información de Fechas</h4>
                <div className="modal-fechas-grid">
                  <div className="modal-fecha-item">
                    <div className="modal-fecha-header">
                      <span className="modal-fecha-icon">📅</span>
                      <span className="modal-fecha-label">Fecha de creación:</span>
                    </div>
                    <div className="modal-fecha-valor">
                      {formatDate(actividadSeleccionada.fecha_creacion)}
                    </div>
                  </div>
                  
                  <div className="modal-fecha-item">
                    <div className="modal-fecha-header">
                      <span className="modal-fecha-icon">🚀</span>
                      <span className="modal-fecha-label">Fecha de inicio:</span>
                    </div>
                    <div className="modal-fecha-valor">
                      {formatDate(actividadSeleccionada.fecha_inicio)}
                    </div>
                  </div>
                  
                  <div className="modal-fecha-item">
                    <div className="modal-fecha-header">
                      <span className="modal-fecha-icon">🏁</span>
                      <span className="modal-fecha-label">Fecha de fin:</span>
                    </div>
                    <div className="modal-fecha-valor">
                      {formatDate(actividadSeleccionada.fecha_fin)}
                      {actividadSeleccionada.fecha_fin && (
                        <span className="modal-dias-restantes">
                          <span className={`dias-restantes ${new Date(actividadSeleccionada.fecha_fin) < new Date() ? 'finalizado' : 'activo'}`}>
                            {getDiasRestantes(actividadSeleccionada.fecha_fin)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Solo mostrar opciones de estado si es el creador */}
              {actividadSeleccionada.creado_por_id === user.id && (
                <div className="modal-actions">
                  <h4>⚙️ Cambiar Estado:</h4>
                  <div className="estado-selector-modal">
                    <div className="estado-botones">
                      <button 
                        className={`estado-btn ${actividadSeleccionada.estado === 'pendiente' ? 'activo' : ''}`}
                        onClick={() => {
                          updateEstadoActividad(actividadSeleccionada.id, 'pendiente');
                          setActividadSeleccionada({
                            ...actividadSeleccionada,
                            estado: 'pendiente'
                          });
                        }}
                      >
                        <span className="estado-emoji">⏳</span>
                        <span className="estado-texto">Pendiente</span>
                      </button>
                      <button 
                        className={`estado-btn ${actividadSeleccionada.estado === 'en_progreso' ? 'activo' : ''}`}
                        onClick={() => {
                          updateEstadoActividad(actividadSeleccionada.id, 'en_progreso');
                          setActividadSeleccionada({
                            ...actividadSeleccionada,
                            estado: 'en_progreso'
                          });
                        }}
                      >
                        <span className="estado-emoji">🚀</span>
                        <span className="estado-texto">En Progreso</span>
                      </button>
                      <button 
                        className={`estado-btn ${actividadSeleccionada.estado === 'completada' ? 'activo' : ''}`}
                        onClick={() => {
                          updateEstadoActividad(actividadSeleccionada.id, 'completada');
                          setActividadSeleccionada({
                            ...actividadSeleccionada,
                            estado: 'completada'
                          });
                        }}
                      >
                        <span className="estado-emoji">✅</span>
                        <span className="estado-texto">Completada</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={cerrarModal}>
                Cerrar
              </button>
              
              {actividadSeleccionada.creado_por_id === user.id && (
                <button 
                  className="btn btn-danger"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar la actividad "${actividadSeleccionada.titulo}"?`)) {
                      eliminarActividad(actividadSeleccionada.id, actividadSeleccionada.titulo);
                      cerrarModal();
                    }
                  }}
                >
                  🗑️ Eliminar Actividad
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para nueva actividad */}
      {showFormActividad && (
        <div className="form-modal">
          <div className="form-modal-content large-modal">
            <div className="form-header">
              <h2>Nueva Actividad</h2>
              <p>Crear nueva actividad para {user.direccion_nombre || 'tu dirección'}</p>
              <button className="close-btn" onClick={() => setShowFormActividad(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmitActividad}>
              <div className="form-group">
                <label>Título de la Actividad *</label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ej: Jornada de capacitación técnica"
                  required
                  autoFocus
                />
              </div>
              
              {/* Campo para tipo de actividad (texto libre) */}
              <div className="form-group">
                <label>Tipo de Actividad *</label>
                <input
                  type="text"
                  name="tipo_actividad"
                  value={formData.tipo_actividad}
                  onChange={handleChange}
                  placeholder="Ej: Taller, Conferencia, Reunión de trabajo, Seminario, etc."
                  required
                  maxLength="100"
                />
                <small className="form-hint">
                  Describe qué tipo de actividad es (máximo 100 caracteres)
                  <span className="word-counter" style={{display: 'block', marginTop: '5px'}}>
                    {formData.tipo_actividad.length} / 100 caracteres
                  </span>
                </small>
              </div>
              
              <div className="form-group">
                <label>Descripción (Minimo 120 palabras)</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Describe los detalles de la actividad, objetivos, participantes, etc..."
                  rows="4"
                  maxLength="2000"
                />
                <div className="word-counter">
                  <small>
                    {formData.descripcion.split(/\s+/).filter(word => word.length > 0).length} / 200 palabras
                    {formData.descripcion.split(/\s+/).filter(word => word.length > 0).length > 200 && 
                      <span style={{ color: '#dc3545', marginLeft: '10px' }}>⚠️ Límite excedido</span>
                    }
                  </small>
                </div>
              </div>
              
              <div className="form-grid dates-grid">
                <div className="form-group">
                  <label>Fecha de Inicio *</label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                    required
                    min={getMinDate()}
                    max={getMaxDate()}
                  />
                  <small className="form-hint">
                    Puedes seleccionar desde {getMinDate()} (2 semanas atrás) hasta {getMaxDate()} (1 año adelante)
                  </small>
                </div>
                
                <div className="form-group">
                  <label>Fecha de Fin (Opcional)</label>
                  <input
                    type="date"
                    name="fecha_fin"
                    value={formData.fecha_fin}
                    onChange={handleChange}
                    min={formData.fecha_inicio || getMinDate()}
                    max={getMaxDate()}
                  />
                  <small className="form-hint">
                    Último día del evento/actividad
                  </small>
                </div>
              </div>
              
              {/* Indicador del año y período seleccionado */}
              <div className="form-group">
                <label>Año y Período de la Actividad</label>
                <div className="periodo-preview">
                  {formData.fecha_inicio ? (
                    <>
                      <span className="periodo-preview-icon">
                        {obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'enero-abril' ? '❄️' : 
                         obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'mayo-agosto' ? '🌸' : 
                         obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'septiembre-diciembre' ? '🍂' : '📅'}
                      </span>
                      <span className="periodo-preview-text">
                        Esta actividad pertenecerá a: 
                        <strong> Año {obtenerAnioYPeriodo(formData.fecha_inicio).anio} • {
                          obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'enero-abril' ? 'Enero - Abril' : 
                          obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'mayo-agosto' ? 'Mayo - Agosto' : 
                          obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'septiembre-diciembre' ? 'Septiembre - Diciembre' : 'Sin período'
                        }</strong>
                      </span>
                    </>
                  ) : (
                    <span className="periodo-preview-empty">
                      📅 Selecciona una fecha de inicio para ver el año y período
                    </span>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label>Imágenes (Máximo 5)</label>
                <div className="image-upload-container">
                  <div className="image-upload-area">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e.target.files)}
                      disabled={uploadingImages || formData.imagenes.length >= 5}
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor="image-upload" 
                      className={`image-upload-label ${isDragOver ? 'drag-over' : ''} ${uploadingImages ? 'uploading' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="upload-icon">📷</div>
                      <div className="upload-text">
                        {isDragOver ? 'Suelta las imágenes aquí' : 'Subir imágenes del evento'}
                      </div>
                      <div className="upload-hint">
                        {isDragOver ? 'Suelta para cargar' : 'Haz clic o arrastra imágenes aquí'}
                      </div>
                      <div className="upload-limit">
                        Máximo 5 imágenes • 5MB cada una • Formatos: JPG, PNG, GIF
                      </div>
                    </label>
                    
                    {formData.imagenes.length > 0 && (
                      <div className="image-previews">
                        <h4>Imágenes cargadas ({formData.imagenes.length}/5):</h4>
                        <div className="preview-grid">
                          {formData.imagenes.map((img, index) => (
                            <div key={index} className="preview-item">
                              <img 
                                src={img.preview} 
                                alt={`Vista previa ${index + 1}`}
                                className="preview-image"
                              />
                              <button
                                type="button"
                                className="remove-image-btn"
                                onClick={() => removeImage(index)}
                                title="Eliminar imagen"
                              >
                                ×
                              </button>
                              <div className="image-info">
                                <small>{img.nombre}</small>
                                <small>{(img.tamano / 1024).toFixed(1)} KB</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="form-info">
                <p><strong>Nota:</strong> Esta actividad será visible para los directivos de {user.direccion_nombre || 'tu dirección'}</p>
                <p><small>Las imágenes se mostrarán en un carrusel en el panel de actividades.</small></p>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={formData.descripcion.split(/\s+/).filter(word => word.length > 0).length > 200 || 
                           uploadingImages || 
                           !formData.fecha_inicio ||
                           !formData.tipo_actividad.trim() ||
                           formData.tipo_actividad.length > 100}
                >
                  {uploadingImages ? 'Subiendo...' : `Crear Actividad con ${formData.imagenes.length} imagen(es)`}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowFormActividad(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalDashboard;