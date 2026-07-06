import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { ROUTES } from '../../constants/routes';
import { toast } from 'react-toastify';
import '../../styles/SuperAdminSeplade.css';
import FormInput from '../shared/FormInput';
import { handleApiError } from '../../utils/errorHandler';
import useSocketEvent from '../../hooks/useSocketEvent';

const SuperAdminSeplade = ({ onClose }) => {
  const navigate = useNavigate();
  const [hojas, setHojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formSubtitulo, setFormSubtitulo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHojas();
  }, []);

  const refreshRef = useRef();

  useSocketEvent('seplade:updated', () => refreshRef.current && refreshRef.current());

  const fetchHojas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/university/seplade-hojas');
      setHojas(res.data.data || []);
    } catch (error) {
      handleApiError(error, 'Error al cargar hojas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshRef.current = fetchHojas;
  });

  const handleOpenNew = () => {
    setEditId(null);
    setFormTitulo('');
    setFormSubtitulo('');
    setFormNombre('');
    setShowForm(true);
  };

  const handleOpenEdit = (hoja) => {
    setEditId(hoja.id);
    setFormTitulo(hoja.titulo || '');
    setFormSubtitulo(hoja.subtitulo || '');
    setFormNombre(hoja.nombre || '');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/api/university/seplade-hojas/${editId}`, {
          titulo: formTitulo.trim(),
          subtitulo: formSubtitulo.trim(),
          nombre: formNombre.trim()
        });
        toast.success('Hoja actualizada');
      } else {
        await api.post('/api/university/seplade-hojas', {
          titulo: formTitulo.trim(),
          subtitulo: formSubtitulo.trim(),
          nombre: formNombre.trim()
        });
        toast.success('Hoja creada');
      }
      setShowForm(false);
      setEditId(null);
      fetchHojas();
    } catch (error) {
      handleApiError(error, 'Error al crear hoja');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (hoja) => {
    if (!window.confirm(`¿Eliminar la hoja "${hoja.titulo || 'Sin título'}"?\nTambién se eliminarán todos sus indicadores.`)) return;
    try {
      await api.delete(`/api/university/seplade-hojas/${hoja.id}`);
      toast.success('Hoja eliminada');
      fetchHojas();
    } catch (error) {
      handleApiError(error, 'Error al eliminar hoja');
    }
  };

  return (
    <div className="tab-content seplade-indicadores">
      <div className="seplade-toolbar">
        <button className="btn btn-secondary" onClick={onClose}>← Volver al Dashboard</button>
        <button className="btn btn-primary" onClick={handleOpenNew}>+ Nueva Hoja</button>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: '2rem' }}>Cargando...</div>
      ) : hojas.length === 0 ? (
        <div className="seplade-empty">
          <p>No hay hojas SEPLADE registradas</p>
          <button className="btn btn-primary" onClick={handleOpenNew}>Crear Primera Hoja</button>
        </div>
      ) : (
        <div className="seplade-hojas-list">
          {hojas.map(hoja => (
            <div key={hoja.id} className="seplade-hoja-card">
              <div className="seplade-hoja-info">
                <h3>{hoja.titulo || 'Sin título'}</h3>
                {hoja.nombre && <p className="seplade-hoja-sub"><strong>Nombre:</strong> {hoja.nombre}</p>}
                {hoja.subtitulo && <p className="seplade-hoja-sub">{hoja.subtitulo}</p>}
              </div>
              <div className="seplade-hoja-actions">
                <button className="btn btn-success" onClick={() => navigate(`/admin/seplade/${hoja.id}`)}>
                  Entrar a Hoja de SEPLADE
                </button>
                <button className="btn btn-secondary btn-small" onClick={() => handleOpenEdit(hoja)}>✏️ Editar</button>
                <button className="btn btn-danger btn-small" onClick={() => handleDelete(hoja)}>🗑️ Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="form-modal" onClick={() => setShowForm(false)}>
          <div className="form-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="form-header">
              <h2>{editId ? 'Editar Hoja SEPLADE' : 'Nueva Hoja SEPLADE'}</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 30px 30px' }}>
              <FormInput label="Nombre corto (para navegación)" name="form-nombre" value={formNombre} onChange={e => setFormNombre(e.target.value)} placeholder="Ej: PAMID 2026" />
              <FormInput label="Título" name="form-titulo" value={formTitulo} onChange={e => setFormTitulo(e.target.value)} placeholder="Ej: Programación Anual de Metas de Indicadores de Desempeño 2026" required />
              <FormInput label="Subtítulo" name="form-subtitulo" value={formSubtitulo} onChange={e => setFormSubtitulo(e.target.value)} placeholder="Ej: Programa Presupuestario 12684..." />
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : '💾 Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminSeplade;
