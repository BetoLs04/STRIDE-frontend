import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/SuperAdminMatrizIndicadores.css';

const API_URL = 'https://api1.strideutmat.com';

const SuperAdminMatrizIndicadores = ({ onClose }) => {
  const [secciones, setSecciones] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formNombre, setFormNombre] = useState('');
  const [saving, setSaving] = useState(false);

  const [showAsignar, setShowAsignar] = useState(null);
  const [direccionAsignar, setDireccionAsignar] = useState('');

  useEffect(() => {
    fetchData();
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
