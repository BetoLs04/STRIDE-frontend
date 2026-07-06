import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSocketEvent from '../../hooks/useSocketEvent';
import { useNavigate } from 'react-router-dom';
import api, { API_URL } from '../../api';
import { ROUTES } from '../../constants/routes';
import { toast } from 'react-toastify';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import '../../styles/PersonalDashboard.css';
import { handleApiError } from '../../utils/errorHandler';
import FormInput from '../shared/FormInput';
import FormFileUpload from '../shared/FormFileUpload';

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

  // Estado para modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [actividadAEditar, setActividadAEditar] = useState(null);
  const [editForm, setEditForm] = useState({
    titulo: '',
    descripcion: '',
    tipo_actividad: '',
    fecha_inicio: '',
    fecha_fin: '',
    imagenesNuevas: []
  });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [isDragOverEdit, setIsDragOverEdit] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo_actividad: '',
    fecha_inicio: '',
    fecha_fin: '',
    imagenes: []
  });

  const [expansiones, setExpansiones] = useState({
    años: {},
    periodos: {}
  });

  // ✅ Modal de confirmación personalizado
  const [confirmModal, setConfirmModal] = useState({ visible: false, titulo: '', mensaje: '', onAceptar: null, tipo: 'danger' });
  const mostrarConfirm = (titulo, mensaje, onAceptar, tipo = 'danger') => setConfirmModal({ visible: true, titulo, mensaje, onAceptar, tipo });
  const cerrarConfirm = () => setConfirmModal({ visible: false, titulo: '', mensaje: '', onAceptar: null, tipo: 'danger' });

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

  const carouselSettingsModal = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: true,
    autoplay: false,
    pauseOnHover: true,
    prevArrow: <button type="button" className="slick-prev" style={{ position: 'absolute', left: '10px', zIndex: 100, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '24px', cursor: 'pointer' }}>‹</button>,
    nextArrow: <button type="button" className="slick-next" style={{ position: 'absolute', right: '10px', zIndex: 100, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '24px', cursor: 'pointer' }}>›</button>
  };

  useEffect(() => {
    if (!user) { navigate(ROUTES.LOGIN); return; }
    if (user.tipo !== 'personal') { toast.error('Acceso no autorizado'); navigate(ROUTES.LOGIN); return; }
    fetchActividades();

    // ✅ Expandir año y período actual automáticamente al cargar
    const { anio, periodo } = obtenerPeriodoActual();
    setExpansiones({
      años: { [anio]: true },
      periodos: {}
    });
  }, [user, navigate]);

  const fetchActividades = async () => {
    try {
      if (!user.direccion_id) { toast.error('No tienes una dirección asignada'); setError('No tienes una dirección asignada'); return; }
      setLoading(true);
      const response = await api.get(`/api/university/actividades/direccion/${user.direccion_id}`);
      const nuevasActividades = response.data.data || [];
      setActividades(nuevasActividades);
      // Actualizar actividad seleccionada en modal si está abierto
      if (actividadSeleccionada) {
        const actividadActualizada = nuevasActividades.find(a => a.id === actividadSeleccionada.id);
        if (actividadActualizada) { setActividadSeleccionada(actividadActualizada); }
      }
    } catch (error) {
      handleApiError(error, 'Error al cargar datos');
      setError('No se pudieron cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const match = url.match(/(\/uploads\/.+)/);
      if (match) return `${API_URL}${match[1]}`;
      return url;
    }
    return `${API_URL}${url}`;
  };

  const obtenerAnioYPeriodo = (fecha) => {
    if (!fecha) return { anio: 'Sin año', periodo: 'sin-fecha', anioNum: 0 };
    const fechaActividad = new Date(fecha);
    const anio = fechaActividad.getFullYear();
    const mes = fechaActividad.getMonth() + 1;
    let periodo;
    if (mes >= 1 && mes <= 4) periodo = 'enero-abril';
    else if (mes >= 5 && mes <= 8) periodo = 'mayo-agosto';
    else if (mes >= 9 && mes <= 12) periodo = 'septiembre-diciembre';
    else periodo = 'sin-periodo';
    return { anio: anio.toString(), periodo, anioNum: anio, periodoNum: mes };
  };

  const agruparPorAnioYPeriodo = (actividadesLista) => {
    const agrupacion = {};
    actividadesLista.forEach(actividad => {
      const { anio, periodo, anioNum } = obtenerAnioYPeriodo(actividad.fecha_inicio);
      if (!agrupacion[anio]) {
        agrupacion[anio] = {
          anio, anioNum, actividades: [],
          periodos: {
            'enero-abril': { actividades: [], label: '❄️ Enero - Abril', color: '#4A90E2', orden: 1 },
            'mayo-agosto': { actividades: [], label: '🌸 Mayo - Agosto', color: '#50C878', orden: 2 },
            'septiembre-diciembre': { actividades: [], label: '🍂 Septiembre - Diciembre', color: '#FF7F50', orden: 3 },
            'sin-fecha': { actividades: [], label: ' Sin fecha definida', color: '#A0A0A0', orden: 4 }
          }
        };
      }
      agrupacion[anio].actividades.push(actividad);
      if (agrupacion[anio].periodos[periodo]) { agrupacion[anio].periodos[periodo].actividades.push(actividad); }
    });
    const añosOrdenados = Object.values(agrupacion).sort((a, b) => b.anioNum - a.anioNum);
    añosOrdenados.forEach(año => {
      Object.values(año.periodos).forEach(periodo => {
        periodo.actividades.sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));
      });
      año.actividades.sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));
    });
    return añosOrdenados;
  };

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

  const toggleAnioExpandido = (anio) => {
    setExpansiones(prev => ({ ...prev, años: { ...prev.años, [anio]: !prev.años[anio] } }));
  };

  const togglePeriodoExpandido = (anio, periodoKey) => {
    const key = `${anio}-${periodoKey}`;
    setExpansiones(prev => ({ ...prev, periodos: { ...prev.periodos, [key]: !prev.periodos[key] } }));
  };

  const getMinDate = () => {
    const hoy = new Date();
    const dosSemanasAtras = new Date(hoy);
    dosSemanasAtras.setDate(hoy.getDate() - 14);
    return dosSemanasAtras.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const hoy = new Date();
    const unAnoAdelante = new Date(hoy);
    unAnoAdelante.setFullYear(hoy.getFullYear() + 1);
    return unAnoAdelante.toISOString().split('T')[0];
  };

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (files) => {
    const newFiles = Array.from(files);
    if (newFiles.length + formData.imagenes.length > 5) { toast.error('Solo puedes subir máximo 5 imágenes'); return; }
    const oversizedFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) { toast.error('Alguna imagen excede el tamaño máximo de 5MB'); return; }
    const invalidFiles = newFiles.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) { toast.error('Solo se permiten archivos de imagen'); return; }
    const imagenesConPreview = newFiles.map(file => ({
      file, preview: URL.createObjectURL(file), nombre: file.name, tamano: file.size, tipo: file.type
    }));
    setFormData({ ...formData, imagenes: [...formData.imagenes, ...imagenesConPreview] });
    toast.success(`${newFiles.length} imagen(es) cargada(s) correctamente`);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files.length > 0) { handleImageUpload(e.dataTransfer.files); } };

  const removeImage = (index) => {
    URL.revokeObjectURL(formData.imagenes[index].preview);
    setFormData({ ...formData, imagenes: formData.imagenes.filter((_, i) => i !== index) });
    toast.info('Imagen eliminada');
  };

  const handleSubmitActividad = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim()) { toast.error('El título es requerido'); return; }
    if (!formData.tipo_actividad.trim()) { toast.error('El tipo de actividad es requerido'); return; }
    if (formData.tipo_actividad.length > 100) { toast.error('El tipo de actividad no puede exceder los 100 caracteres'); return; }
    if (!formData.fecha_inicio) { toast.error('La fecha de inicio es requerida'); return; }
    if (!isFechaInicioValida(formData.fecha_inicio)) { toast.error('La fecha de inicio debe ser de los últimos 14 días'); return; }
    if (formData.fecha_fin && new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) { toast.error('La fecha de fin no puede ser anterior a la fecha de inicio'); return; }
    const wordCount = formData.descripcion.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 200) { toast.error('La descripción no puede exceder las 200 palabras'); return; }
    setUploadingImages(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('tipo_actividad', formData.tipo_actividad);
      formDataToSend.append('fecha_inicio', formData.fecha_inicio);
      formDataToSend.append('fecha_fin', formData.fecha_fin || '');
      formDataToSend.append('direccion_id', user.direccion_id);
      formDataToSend.append('creado_por_id', user.id);
      formDataToSend.append('creado_por_tipo', 'personal');
      formData.imagenes.forEach(imagenObj => { formDataToSend.append('imagenes', imagenObj.file); });
      await api.post('/api/university/actividades', formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Actividad creada exitosamente con ' + formData.imagenes.length + ' imagen(es)!');
      setFormData({ titulo: '', descripcion: '', tipo_actividad: '', fecha_inicio: '', fecha_fin: '', imagenes: [] });
      setShowFormActividad(false);
      fetchActividades();
    } catch (error) {
      handleApiError(error, 'Error al guardar actividad');
    } finally {
      setUploadingImages(false);
    }
  };

  useEffect(() => {
    return () => {
      formData.imagenes.forEach(imagen => { if (imagen.preview) { URL.revokeObjectURL(imagen.preview); } });
    };
  }, [formData.imagenes]);

  // ========== FUNCIONES DE EDICIÓN ==========

  const abrirModalEdicion = (actividad) => {
    setActividadAEditar(actividad);
    setEditForm({
      titulo: actividad.titulo || '',
      descripcion: actividad.descripcion || '',
      tipo_actividad: actividad.tipo_actividad || '',
      fecha_inicio: actividad.fecha_inicio ? actividad.fecha_inicio.split(' ')[0].split('T')[0] : '',
      fecha_fin: actividad.fecha_fin ? actividad.fecha_fin.split(' ')[0].split('T')[0] : '',
      imagenesNuevas: []
    });
    setShowEditModal(true);
    document.body.style.overflow = 'hidden';
  };

  const cerrarModalEdicion = () => {
    editForm.imagenesNuevas.forEach(img => { if (img.preview) { URL.revokeObjectURL(img.preview); } });
    setShowEditModal(false);
    setActividadAEditar(null);
    setEditForm({ titulo: '', descripcion: '', tipo_actividad: '', fecha_inicio: '', fecha_fin: '', imagenesNuevas: [] });
    document.body.style.overflow = 'auto';
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditImageUpload = (files) => {
    const newFiles = Array.from(files);
    const imagenesActuales = actividadAEditar?.imagenes?.length || 0;
    const imagenesNuevasActuales = editForm.imagenesNuevas.length;
    const totalActual = imagenesActuales + imagenesNuevasActuales;
    if (newFiles.length + totalActual > 5) {
      toast.error(`Solo puedes tener máximo 5 imágenes. Actualmente tienes ${totalActual}.`);
      return;
    }
    const oversized = newFiles.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) { toast.error('Alguna imagen excede 5MB'); return; }
    const invalid = newFiles.filter(f => !f.type.startsWith('image/'));
    if (invalid.length > 0) { toast.error('Solo se permiten imágenes'); return; }
    const nuevas = newFiles.map(file => ({
      file, preview: URL.createObjectURL(file), nombre: file.name, tamano: file.size
    }));
    setEditForm(prev => ({ ...prev, imagenesNuevas: [...prev.imagenesNuevas, ...nuevas] }));
  };

  const removeEditImageNueva = (index) => {
    URL.revokeObjectURL(editForm.imagenesNuevas[index].preview);
    setEditForm(prev => ({ ...prev, imagenesNuevas: prev.imagenesNuevas.filter((_, i) => i !== index) }));
  };

  const eliminarImagenExistente = (imagenId) => {
    mostrarConfirm(
      'Eliminar imagen',
      '¿Estás seguro de que quieres eliminar esta imagen? Esta acción no se puede deshacer.',
      async () => { await doEliminarImagenExistente(imagenId); }
    );
  };

  const doEliminarImagenExistente = async (imagenId) => {
    try {
      await api.delete(`/api/university/actividades/imagen/${imagenId}`, {
        data: { creado_por_id: user.id }
      });
      setActividadAEditar(prev => ({
        ...prev,
        imagenes: prev.imagenes.filter(img => img.id !== imagenId)
      }));
      setActividades(prev => prev.map(act => {
        if (act.id === actividadAEditar.id) {
          return { ...act, imagenes: act.imagenes.filter(img => img.id !== imagenId) };
        }
        return act;
      }));
      toast.success('Imagen eliminada');
    } catch (error) {
      handleApiError(error, 'Error al cargar actividades');
    }
  };

  const handleSubmitEdicion = async (e) => {
    e.preventDefault();
    if (!editForm.titulo.trim()) { toast.error('El título es requerido'); return; }
    if (!editForm.tipo_actividad.trim()) { toast.error('El tipo de actividad es requerido'); return; }
    if (!editForm.fecha_inicio) { toast.error('La fecha de inicio es requerida'); return; }
    if (editForm.fecha_fin && new Date(editForm.fecha_fin) < new Date(editForm.fecha_inicio)) {
      toast.error('La fecha de fin no puede ser anterior a la fecha de inicio'); return;
    }
    const wordCount = editForm.descripcion.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > 200) { toast.error('La descripción no puede exceder las 200 palabras'); return; }

    setGuardandoEdicion(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', editForm.titulo);
      formDataToSend.append('descripcion', editForm.descripcion || '');
      formDataToSend.append('tipo_actividad', editForm.tipo_actividad);
      formDataToSend.append('fecha_inicio', editForm.fecha_inicio);
      formDataToSend.append('fecha_fin', editForm.fecha_fin || '');
      formDataToSend.append('creado_por_id', user.id);
      editForm.imagenesNuevas.forEach(img => { formDataToSend.append('imagenes', img.file); });

      const response = await api.put(
        `/api/university/actividades/${actividadAEditar.id}`,
        formDataToSend,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success) {
        toast.success('Actividad actualizada exitosamente');
        cerrarModalEdicion();
        fetchActividades();
      }
    } catch (error) {
      handleApiError(error, 'Error al eliminar actividad');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // ========== RESTO DE FUNCIONES ==========

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
      // ✅ Fix zona horaria: construir fecha manualmente para evitar desfase UTC
      const solo = dateString.split('T')[0].split(' ')[0];
      const [y, m, d] = solo.split('-');
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (error) { return 'Fecha inválida'; }
  };

  const getDiasRestantes = (fechaFin) => {
    if (!fechaFin) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    // ✅ Fix zona horaria
    const solo = fechaFin.split('T')[0];
    const [y, m, d] = solo.split('-');
    const fin = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const diffDays = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `Faltan ${diffDays} días`;
    if (diffDays === 0) return 'Finaliza hoy';
    return `Finalizó hace ${Math.abs(diffDays)} días`;
  };

  // ✅ FUNCIÓN CORREGIDA: updateEstadoActividad
  const updateEstadoActividad = async (actividadId, nuevoEstado) => {
    try {
      const response = await api.put(
        `/api/university/actividades/${actividadId}/estado`,
        { estado: nuevoEstado }
      );

      console.log('📡 Respuesta actualizar estado:', response.data);

      if (response.data.success) {
        // Actualizar en la lista principal
        setActividades(prev => prev.map(act =>
          act.id === actividadId ? { ...act, estado: nuevoEstado } : act
        ));
        // Actualizar en el modal si está abierto
        if (actividadSeleccionada && actividadSeleccionada.id === actividadId) {
          setActividadSeleccionada(prev => ({ ...prev, estado: nuevoEstado }));
        }
        toast.success('✅ Estado actualizado correctamente');
      } else {
        toast.error(response.data.error || 'Error al actualizar estado');
      }
    } catch (error) {
      handleApiError(error, 'Error al actualizar estado');
    }
  };

  const eliminarActividad = (actividadId, titulo) => {
    mostrarConfirm(
      'Eliminar actividad',
      `¿Estás seguro de eliminar la actividad "${titulo}"? Esta acción eliminará también todas las imágenes asociadas y no se puede deshacer.`,
      async () => { await doEliminarActividad(actividadId, titulo); }
    );
  };

  const doEliminarActividad = async (actividadId, titulo) => {
    try {
      const response = await api.delete(`/api/university/actividades/${actividadId}`);
      if (response.data.success) {
        setActividades(prev => prev.filter(a => a.id !== actividadId));
        if (actividadSeleccionada?.id === actividadId) { cerrarModal(); }
        toast.success('✅ Actividad eliminada');
        if (response.data.imagenesEliminadas > 0) { toast.info(`📸 Se eliminaron ${response.data.imagenesEliminadas} imágenes`); }
      }
    } catch (error) {
      handleApiError(error, 'Error al actualizar del bloque');
    }
  };

  const abrirModalActividad = (actividad) => {
    setActividadSeleccionada(actividad);
    setModalAbierto(true);
    document.body.style.overflow = 'hidden';
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setActividadSeleccionada(null);
    document.body.style.overflow = 'auto';
  };

  useEffect(() => {
    const handleEscKey = (event) => { if (event.key === 'Escape' && modalAbierto) { cerrarModal(); } };
    if (modalAbierto) { document.addEventListener('keydown', handleEscKey); }
    return () => { document.removeEventListener('keydown', handleEscKey); };
  }, [modalAbierto]);

  const TarjetaActividadMinimalista = ({ actividad }) => {
    return (
      <div className="actividad-minimalista-card">
        <div className="actividad-minimalista-content">
          <div className="actividad-minimalista-info">
            <h3>{actividad.titulo}</h3>
            <div className="actividad-minimalista-metadata">
              <span className="actividad-minimalista-creador">👤 {actividad.creado_por_nombre || 'Sistema'}</span>
              <span className="actividad-minimalista-fecha">
                {new Date(actividad.fecha_inicio.split(' ')[0].split('T')[0] + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              {getEstadoBadge(actividad.estado)}
            </div>
          </div>
          <div className="actividad-minimalista-actions">
            <button className="btn btn-primary btn-small" onClick={() => abrirModalActividad(actividad)}>
              Ver detalles
            </button>
            {actividad.creado_por_id === user.id && (
              <button className="btn btn-danger btn-small" onClick={() => eliminarActividad(actividad.id, actividad.titulo)} title="Eliminar esta actividad" style={{ marginLeft: '10px' }}>
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const refreshRef = useRef();
  refreshRef.current = fetchActividades;

  useSocketEvent('actividad:created', () => refreshRef.current());
  useSocketEvent('actividad:updated', () => refreshRef.current());
  useSocketEvent('actividad:deleted', () => refreshRef.current());
  useSocketEvent('actividad:estado-changed', () => refreshRef.current());

  if (!user) {
    return (
      <div className="loading-container" style={{ height: '100vh' }}>
        <div className="spinner"></div>
        <p>Cargando información del usuario...</p>
      </div>
    );
  }

  const agrupacionPorAnio = agruparPorAnioYPeriodo(actividades);
  const periodoActual = obtenerPeriodoActual();



  return (
    <>
      <div className="dashboard-container">
      {/* CABECERA */}
      <div className="dashboard-header">
        <div className="header-left"><h1>Panel de Personal</h1></div>
        <div className="header-center-personal">
          <div className="user-info-center">
            <div className="user-avatar-large">{getInitial()}</div>
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
          <button className="btn btn-secondary" onClick={fetchActividades} title="Actualizar actividades" style={{ marginRight: '10px' }}>
            Actualizar
          </button>
          <button className="btn btn-primary" onClick={() => setShowFormActividad(true)}>+ Nueva Actividad</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-header-banner">
          <div className="banner-left">
            <h2 className="banner-title">📋 Gestión de Actividades</h2>
            <p className="banner-subtitle">Crea y gestiona actividades para {user.direccion_nombre || 'tu dirección'}</p>
          </div>
          <div className="banner-right">
            <div className="periodo-actual-banner">
              <span className="periodo-emoji-banner">
                {periodoActual.periodo === 'enero-abril' ? '❄️' : periodoActual.periodo === 'mayo-agosto' ? '🌸' : '🍂'}
              </span>
              <div className="periodo-text-banner">
                <h4>PERÍODO ACTUAL</h4>
                <p>Año {periodoActual.anio} • {periodoActual.periodo === 'enero-abril' ? ' Enero - Abril' : periodoActual.periodo === 'mayo-agosto' ? ' Mayo - Agosto' : ' Septiembre - Diciembre'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card"><span className="stat-number">{actividades.length}</span><span className="stat-label">Total</span><div className="stat-icon">📋</div></div>
          <div className="stat-card"><span className="stat-number">{actividades.filter(a => a.estado === 'completada').length}</span><span className="stat-label">Completadas</span><div className="stat-icon">✅</div></div>
          <div className="stat-card"><span className="stat-number">{actividades.filter(a => a.estado === 'en_progreso').length}</span><span className="stat-label">En Progreso</span><div className="stat-icon">🚀</div></div>
          <div className="stat-card"><span className="stat-number">{actividades.filter(a => a.estado === 'pendiente').length}</span><span className="stat-label">Pendientes</span><div className="stat-icon">⏳</div></div>
        </div>

        <div className="section-header">
          <h2>📋 Mis Actividades</h2>
          <p>Gestiona las actividades de {user.direccion_nombre || 'tu dirección'}</p>
        </div>

        {error ? (
          <div className="error-message-box">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchActividades}>Reintentar</button>
          </div>
        ) : loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Cargando actividades...</p></div>
        ) : actividades.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📭</div>
            <h3>No hay actividades registradas</h3>
            <p>Crea tu primera actividad para comenzar.</p>
            <button className="btn btn-primary" onClick={() => setShowFormActividad(true)}>+ Crear Primera Actividad</button>
          </div>
        ) : (
          <div className="periodos-container">
            <div className="periodos-controls"><h3>Actividades por Período</h3></div>
            {agrupacionPorAnio.filter(añoData => añoData.actividades.length > 0).map(añoData => (
              <div key={añoData.anio} className="año-acordeon">
                <div className="año-acordeon-header" onClick={() => toggleAnioExpandido(añoData.anio)} style={{ backgroundColor: añoData.anio === periodoActual.anio ? '#e8f4fd' : '#f8f9fa' }}>
                  <div className="año-acordeon-title">
                    <span className="año-emoji"></span>
                    <h3>Año {añoData.anio}</h3>
                    {añoData.anio === periodoActual.anio && <span className="año-actual-badge">AÑO ACTUAL</span>}
                  </div>
                  <div className="año-acordeon-controls">
                    <span className="año-count">{añoData.actividades.length} actividad(es)</span>
                    <span className="año-toggle">{expansiones.años[añoData.anio] ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expansiones.años[añoData.anio] && (
                  <div className="año-acordeon-content">
                    {Object.entries(añoData.periodos).filter(([_, periodoData]) => periodoData.actividades.length > 0).sort(([keyA, a], [keyB, b]) => a.orden - b.orden).map(([periodoKey, periodoData]) => (
                      <div key={periodoKey} className="periodo-acordeon">
                        <div className="periodo-acordeon-header" onClick={() => togglePeriodoExpandido(añoData.anio, periodoKey)} style={{ borderLeftColor: periodoData.color }}>
                          <div className="periodo-acordeon-title">
                            <span className="periodo-emoji">{periodoData.emoji}</span>
                            <h4>{periodoData.label}</h4>
                            {añoData.anio === periodoActual.anio && periodoKey === periodoActual.periodo && <span className="periodo-actual-badge">PERÍODO ACTUAL</span>}
                          </div>
                          <div className="periodo-acordeon-controls">
                            <span className="periodo-count">{periodoData.actividades.length} actividad(es)</span>
                            <span className="periodo-toggle">{expansiones.periodos[`${añoData.anio}-${periodoKey}`] ? '▲' : '▼'}</span>
                          </div>
                        </div>
                        {expansiones.periodos[`${añoData.anio}-${periodoKey}`] && (
                          <div className="periodo-acordeon-content">
                            <div className="actividades-lista-minimalista">
                              {periodoData.actividades.map(actividad => (
                                <TarjetaActividadMinimalista key={actividad.id} actividad={actividad} />
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

      {/* ========== MODAL DE DETALLE ========== */}
      {modalAbierto && actividadSeleccionada && (
        <div className="actividad-modal-overlay" onClick={cerrarModal}>
          <div className="actividad-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={cerrarModal}>✕</button>
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
                <span className="creador-valor">{actividadSeleccionada.creado_por_nombre || 'Sistema'}</span>
                <span className="creador-separator">•</span>
                <span className="creador-direccion">🏛️ {actividadSeleccionada.direccion_nombre || 'Sin dirección'}</span>
              </div>
              <div className="modal-descripcion">
                <h4>📄 Descripción:</h4>
                <p>{actividadSeleccionada.descripcion || 'Sin descripción'}</p>
              </div>
              <div className="modal-descripcion">
                <h4>📌 Tipo de Actividad:</h4>
                <p>{actividadSeleccionada.tipo_actividad || 'No especificado'}</p>
              </div>
              {actividadSeleccionada.imagenes && actividadSeleccionada.imagenes.length > 0 && (
                <div className="modal-imagenes">
                  <h4>🖼️ Galería de Evidencias ({actividadSeleccionada.imagenes.length})</h4>
                  <Slider {...carouselSettingsModal} className="modal-carousel">
                    {actividadSeleccionada.imagenes.map((img, index) => (
                      <div key={index} className="modal-slide">
                        <div className="modal-slide-content">
                          <img src={getImageUrl(img.url)} alt={`Evidencia ${index + 1}`} className="modal-image" onError={(e) => { e.target.style.display = 'none'; }} />
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
                <h4>Información de Fechas</h4>
                <div className="modal-fechas-grid">
                  <div className="modal-fecha-item">
                    <div className="modal-fecha-header"><span className="modal-fecha-icon"></span><span className="modal-fecha-label">Fecha de creación:</span></div>
                    <div className="modal-fecha-valor">{formatDate(actividadSeleccionada.fecha_creacion)}</div>
                  </div>
                  <div className="modal-fecha-item">
                    <div className="modal-fecha-header"><span className="modal-fecha-icon">🚀</span><span className="modal-fecha-label">Fecha de inicio:</span></div>
                    <div className="modal-fecha-valor">{formatDate(actividadSeleccionada.fecha_inicio)}</div>
                  </div>
                  <div className="modal-fecha-item">
                    <div className="modal-fecha-header"><span className="modal-fecha-icon">🏁</span><span className="modal-fecha-label">Fecha de fin:</span></div>
                    <div className="modal-fecha-valor">
                      {formatDate(actividadSeleccionada.fecha_fin)}
                      {actividadSeleccionada.fecha_fin && (
                        <span className="modal-dias-restantes">
                          <span className={`dias-restantes ${new Date(actividadSeleccionada.fecha_fin.split(' ')[0].split('T')[0] + 'T12:00:00') < new Date() ? 'finalizado' : 'activo'}`}>
                            {getDiasRestantes(actividadSeleccionada.fecha_fin)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cambiar estado - solo si es el creador */}
              {actividadSeleccionada.creado_por_id === user.id && (
                <div className="modal-actions">
                  <h4>⚙️ Cambiar Estado:</h4>
                  <div className="estado-selector-modal">
                    <div className="estado-botones">
                      <button
                        className={`estado-btn ${actividadSeleccionada.estado === 'pendiente' ? 'activo pendiente' : ''}`}
                        onClick={() => updateEstadoActividad(actividadSeleccionada.id, 'pendiente')}
                      >
                        <span className="estado-emoji">⏳</span><span className="estado-texto">Pendiente</span>
                      </button>
                      <button
                        className={`estado-btn ${actividadSeleccionada.estado === 'en_progreso' ? 'activo en_progreso' : ''}`}
                        onClick={() => updateEstadoActividad(actividadSeleccionada.id, 'en_progreso')}
                      >
                        <span className="estado-emoji">🚀</span><span className="estado-texto">En Progreso</span>
                      </button>
                      <button
                        className={`estado-btn ${actividadSeleccionada.estado === 'completada' ? 'activo completada' : ''}`}
                        onClick={() => updateEstadoActividad(actividadSeleccionada.id, 'completada')}
                      >
                        <span className="estado-emoji">✅</span><span className="estado-texto">Completada</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={cerrarModal}>Cerrar</button>
              {actividadSeleccionada.creado_por_id === user.id && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    cerrarModal();
                    abrirModalEdicion(actividadSeleccionada);
                  }}
                >
                  ✏️ Editar Actividad
                </button>
              )}
              {actividadSeleccionada.creado_por_id === user.id && (
                <button className="btn btn-danger" onClick={() => { eliminarActividad(actividadSeleccionada.id, actividadSeleccionada.titulo); cerrarModal(); }}>
                  🗑️ Eliminar Actividad
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL DE EDICIÓN ========== */}
      {showEditModal && actividadAEditar && (
        <div className="form-modal" style={{ zIndex: 10001 }}>
          <div className="form-modal-content large-modal">
            <div className="form-header">
              <h2>✏️ Editar Actividad</h2>
              <p>Modifica los datos de tu actividad</p>
              <button className="close-btn" onClick={cerrarModalEdicion}>×</button>
            </div>
            <form onSubmit={handleSubmitEdicion}>
              <FormInput label="Título de la Actividad *" name="titulo" value={editForm.titulo} onChange={handleEditChange} placeholder="Título de la actividad" required />
              <FormInput label="Tipo de Actividad *" name="tipo_actividad" value={editForm.tipo_actividad} onChange={handleEditChange} placeholder="Ej: Taller, Conferencia, Reunión..." required maxLength={100} hint={`${editForm.tipo_actividad.length} / 100 caracteres`} />
              <div className="form-group">
                <label>Descripción</label>
                <textarea name="descripcion" value={editForm.descripcion} onChange={handleEditChange} placeholder="Describe los detalles de la actividad..." rows="4" maxLength="2000" />
                <div className="word-counter">
                  <small>
                    {editForm.descripcion.split(/\s+/).filter(w => w.length > 0).length} / 200 palabras
                    {editForm.descripcion.split(/\s+/).filter(w => w.length > 0).length > 200 && <span style={{ color: '#dc3545', marginLeft: '8px' }}>⚠️ Límite excedido</span>}
                  </small>
                </div>
              </div>
              <div className="form-grid dates-grid">
                <FormInput label="Fecha de Inicio *" name="fecha_inicio" type="date" value={editForm.fecha_inicio} onChange={handleEditChange} required />
                <FormInput label="Fecha de Fin (Opcional)" name="fecha_fin" type="date" value={editForm.fecha_fin} onChange={handleEditChange} min={editForm.fecha_inicio || ''} />
              </div>

              {actividadAEditar.imagenes && actividadAEditar.imagenes.length > 0 && (
                <div className="form-group">
                  <label>Imágenes actuales ({actividadAEditar.imagenes.length}/5)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                    {actividadAEditar.imagenes.map((img) => (
                      <div key={img.id} style={{ position: 'relative', width: '100px', height: '100px' }}>
                        <img
                          src={getImageUrl(img.url)}
                          alt={img.nombre_archivo}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <button
                          type="button"
                          onClick={() => eliminarImagenExistente(img.id)}
                          title="Eliminar imagen"
                          style={{
                            position: 'absolute', top: '-6px', right: '-6px',
                            background: '#dc3545', color: 'white', border: 'none',
                            borderRadius: '50%', width: '22px', height: '22px',
                            fontSize: '14px', cursor: 'pointer', lineHeight: '1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(actividadAEditar.imagenes?.length || 0) + editForm.imagenesNuevas.length < 5 && (
                <FormFileUpload
                  label={`Agregar imágenes (${(actividadAEditar.imagenes?.length || 0) + editForm.imagenesNuevas.length}/5 en total)`}
                  accept="image/*"
                  multiple
                  onChange={(e) => handleEditImageUpload(e.target.files)}
                  files={editForm.imagenesNuevas.map(i => i.file)}
                  onRemove={removeEditImageNueva}
                  maxFiles={5}
                  hint="Máx. 5 en total • 5MB c/u"
                />
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    guardandoEdicion ||
                    editForm.descripcion.split(/\s+/).filter(w => w.length > 0).length > 200 ||
                    !editForm.titulo.trim() ||
                    !editForm.tipo_actividad.trim()
                  }
                >
                  {guardandoEdicion ? 'Guardando...' : '💾 Guardar Cambios'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={cerrarModalEdicion}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL NUEVA ACTIVIDAD ========== */}
      {showFormActividad && (
        <div className="form-modal">
          <div className="form-modal-content large-modal">
            <div className="form-header">
              <h2>Nueva Actividad</h2>
              <p>Crear nueva actividad para {user.direccion_nombre || 'tu dirección'}</p>
              <button className="close-btn" onClick={() => setShowFormActividad(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitActividad}>
              <FormInput label="Título de la Actividad *" name="titulo" value={formData.titulo} onChange={handleChange} placeholder="Ej: Jornada de capacitación técnica" required autoFocus />
              <FormInput label="Tipo de Actividad *" name="tipo_actividad" value={formData.tipo_actividad} onChange={handleChange} placeholder="Ej: Taller, Conferencia, Reunión de trabajo, Seminario, etc." required maxLength={100} hint={`Describe qué tipo de actividad es (máximo 100 caracteres) — ${formData.tipo_actividad.length} / 100 caracteres`} />
              <div className="form-group">
                <label>Descripción (Mínimo 120 palabras)</label>
                <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Describe los detalles de la actividad, objetivos, participantes, etc..." rows="4" maxLength="2000" />
                <div className="word-counter">
                  <small>
                    {formData.descripcion.split(/\s+/).filter(word => word.length > 0).length} / 200 palabras
                    {formData.descripcion.split(/\s+/).filter(word => word.length > 0).length > 200 && <span style={{ color: '#dc3545', marginLeft: '10px' }}>⚠️ Límite excedido</span>}
                  </small>
                </div>
              </div>
              <div className="form-grid dates-grid">
                <FormInput label="Fecha de Inicio *" name="fecha_inicio" type="date" value={formData.fecha_inicio} onChange={handleChange} required min={getMinDate()} max={getMaxDate()} hint={`Puedes seleccionar desde ${getMinDate()} hasta ${getMaxDate()}`} />
                <FormInput label="Fecha de Fin (Opcional)" name="fecha_fin" type="date" value={formData.fecha_fin} onChange={handleChange} min={formData.fecha_inicio || getMinDate()} max={getMaxDate()} hint="Último día del evento/actividad" />
              </div>
              <div className="form-group">
                <label>Año y Período de la Actividad</label>
                <div className="periodo-preview">
                  {formData.fecha_inicio ? (
                    <>
                      <span className="periodo-preview-icon">
                        {obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'enero-abril' ? '❄️' : obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'mayo-agosto' ? '🌸' : '🍂'}
                      </span>
                      <span className="periodo-preview-text">
                        Esta actividad pertenecerá a: <strong>Año {obtenerAnioYPeriodo(formData.fecha_inicio).anio} • {obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'enero-abril' ? 'Enero - Abril' : obtenerAnioYPeriodo(formData.fecha_inicio).periodo === 'mayo-agosto' ? 'Mayo - Agosto' : 'Septiembre - Diciembre'}</strong>
                      </span>
                    </>
                  ) : (
                    <span className="periodo-preview-empty">Selecciona una fecha de inicio para ver el año y período</span>
                  )}
                </div>
              </div>
              <FormFileUpload
                label="Imágenes (Máximo 5)"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e.target.files)}
                files={formData.imagenes.map(i => i.file)}
                onRemove={removeImage}
                maxFiles={5}
                hint="Máximo 5 imágenes • 5MB cada una • Formatos: JPG, PNG, GIF"
              />
              <div className="form-info">
                <p><strong>Nota:</strong> Esta actividad será visible para los directivos de {user.direccion_nombre || 'tu dirección'}</p>
                <p><small>Las imágenes se mostrarán en un carrusel en el panel de actividades.</small></p>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={formData.descripcion.split(/\s+/).filter(word => word.length > 0).length > 200 || uploadingImages || !formData.fecha_inicio || !formData.tipo_actividad.trim() || formData.tipo_actividad.length > 100}>
                  {uploadingImages ? 'Subiendo...' : `Crear Actividad con ${formData.imagenes.length} imagen(es)`}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormActividad(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    {confirmModal.visible && (
      <div className="confirm-overlay" onClick={cerrarConfirm}>
        <div className="confirm-modal" onClick={e => e.stopPropagation()}>
          <div className={`confirm-icon-wrap ${confirmModal.tipo}`}>
            <span className="confirm-icon">{confirmModal.tipo === 'danger' ? '!' : '?'}</span>
          </div>
          <h3 className="confirm-titulo">{confirmModal.titulo}</h3>
          <p className="confirm-mensaje">{confirmModal.mensaje}</p>
          <div className="confirm-actions">
            <button className="btn btn-secondary" onClick={cerrarConfirm}>Cancelar</button>
            <button
              className={`btn ${confirmModal.tipo === 'danger' ? 'btn-danger' : 'btn-warning'}`}
              onClick={() => { confirmModal.onAceptar && confirmModal.onAceptar(); cerrarConfirm(); }}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default PersonalDashboard;
