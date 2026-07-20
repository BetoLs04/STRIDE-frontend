import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { toast } from 'react-toastify';
import '../../styles/SuperAdminEstadisticosGenero.css';
import FormInput from '../shared/FormInput';
import { handleApiError } from '../../utils/errorHandler';
import useSocketEvent from '../../hooks/useSocketEvent';

const COLUMNAS_FIJAS = [
  { key: 'programa', label: 'Programa', tipo: 'texto' },
  { key: 'grupos', label: 'Grupos', tipo: 'numero' },
  { key: 'cant_total', label: 'Cantidad Total', tipo: 'numero' },
  { key: 'cant_hombres', label: 'Cantidad Hombres', tipo: 'numero' },
  { key: 'cant_mujeres', label: 'Cantidad Mujeres', tipo: 'numero' },
  { key: 'aprov_hombres', label: 'Aprovechamiento Hombres', tipo: 'decimal' },
  { key: 'aprov_mujeres', label: 'Aprovechamiento Mujeres', tipo: 'decimal' },
  { key: 'aprov_total', label: 'Aprovechamiento Total', tipo: 'decimal' }
];

const SuperAdminEstadisticosGenero = ({ onClose }) => {
  const [hojas, setHojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormHoja, setShowFormHoja] = useState(false);
  const [editHojaId, setEditHojaId] = useState(null);
  const [formNombre, setFormNombre] = useState('');
  const [savingHoja, setSavingHoja] = useState(false);

  const [selectedHoja, setSelectedHoja] = useState(null);

  const [filas, setFilas] = useState([]);
  const [filasLoading, setFilasLoading] = useState(false);
  const [showFormFila, setShowFormFila] = useState(false);
  const [editFilaId, setEditFilaId] = useState(null);
  const [filaValores, setFilaValores] = useState({});
  const [filaSaving, setFilaSaving] = useState(false);

  useEffect(() => {
    fetchHojas();
  }, []);

  const refreshRef = useRef();
  useSocketEvent('estadisticos-genero:updated', () => refreshRef.current && refreshRef.current());

  const fetchHojas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/university/estadisticos-genero-hojas');
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

  const fetchFilas = async (hojaId) => {
    setFilasLoading(true);
    try {
      const res = await api.get(`/api/university/estadisticos-genero-filas?hoja_id=${hojaId}`);
      setFilas(res.data.data || []);
    } catch (error) {
      handleApiError(error, 'Error al cargar filas');
    } finally {
      setFilasLoading(false);
    }
  };

  const handleOpenNewHoja = () => {
    setEditHojaId(null);
    setFormNombre('');
    setShowFormHoja(true);
  };

  const handleOpenEditHoja = (hoja) => {
    setEditHojaId(hoja.id);
    setFormNombre(hoja.nombre || '');
    setShowFormHoja(true);
  };

  const handleSaveHoja = async (e) => {
    e.preventDefault();
    setSavingHoja(true);
    try {
      if (editHojaId) {
        await api.put(`/api/university/estadisticos-genero-hojas/${editHojaId}`, { nombre: formNombre.trim() });
        toast.success('Hoja actualizada');
      } else {
        await api.post('/api/university/estadisticos-genero-hojas', { nombre: formNombre.trim() });
        toast.success('Hoja creada');
      }
      setShowFormHoja(false);
      setEditHojaId(null);
      fetchHojas();
    } catch (error) {
      handleApiError(error, 'Error al guardar hoja');
    } finally {
      setSavingHoja(false);
    }
  };

  const handleDeleteHoja = async (hoja) => {
    if (!window.confirm(`¿Eliminar la hoja "${hoja.nombre || 'Sin nombre'}"?\nTambién se eliminarán sus filas.`)) return;
    try {
      await api.delete(`/api/university/estadisticos-genero-hojas/${hoja.id}`);
      toast.success('Hoja eliminada');
      if (selectedHoja?.id === hoja.id) setSelectedHoja(null);
      fetchHojas();
    } catch (error) {
      handleApiError(error, 'Error al eliminar hoja');
    }
  };

  const handleSelectHoja = (hoja) => {
    setSelectedHoja(hoja);
    fetchFilas(hoja.id);
  };

  const getValor = (fila, key) => {
    try {
      const valores = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
      return valores[key] || '';
    } catch {
      return '';
    }
  };

  const handleOpenNewFila = () => {
    setEditFilaId(null);
    const initial = {};
    COLUMNAS_FIJAS.forEach(c => { initial[c.key] = ''; });
    setFilaValores(initial);
    setShowFormFila(true);
  };

  const handleOpenEditFila = (fila) => {
    setEditFilaId(fila.id);
    const vals = {};
    COLUMNAS_FIJAS.forEach(c => {
      vals[c.key] = getValor(fila, c.key);
    });
    setFilaValores(vals);
    setShowFormFila(true);
  };

  const handleSaveFila = async (e) => {
    e.preventDefault();
    setFilaSaving(true);
    try {
      if (editFilaId) {
        await api.put(`/api/university/estadisticos-genero-filas/${editFilaId}`, { valores: filaValores });
        toast.success('Fila actualizada');
      } else {
        await api.post('/api/university/estadisticos-genero-filas', { valores: filaValores, hoja_id: selectedHoja.id });
        toast.success('Fila creada');
      }
      setShowFormFila(false);
      setEditFilaId(null);
      setFilaValores({});
      fetchFilas(selectedHoja.id);
    } catch (error) {
      handleApiError(error, 'Error al guardar fila');
    } finally {
      setFilaSaving(false);
    }
  };

  const handleDeleteFila = async (fila) => {
    const nombre = getValor(fila, 'programa') || `Fila #${fila.id}`;
    if (!window.confirm(`¿Eliminar la fila "${nombre}"?`)) return;
    try {
      await api.delete(`/api/university/estadisticos-genero-filas/${fila.id}`);
      toast.success('Fila eliminada');
      fetchFilas(selectedHoja.id);
    } catch (error) {
      handleApiError(error, 'Error al eliminar fila');
    }
  };

  if (selectedHoja) {
    return (
      <div className="tab-content estadisticos-genero">
        <div className="tab-header">
          <div>
            <h2>Información Estadística por Género</h2>
            <p className="text-muted" style={{ margin: 0 }}>{selectedHoja.nombre}</p>
          </div>
          <div className="tab-actions">
            <button className="btn btn-secondary" onClick={() => setSelectedHoja(null)}>← Volver a Hojas</button>
          </div>
        </div>

        <div className="eg-hoja-view">
          <div className="eg-vista-previa">
            <h3 style={{ textAlign: 'center', margin: 0 }}>Información Estadística por Género</h3>
            <p style={{ textAlign: 'center', color: '#6b7280', margin: '0.25rem 0 1rem' }}>{selectedHoja.nombre}</p>
            {filasLoading ? (
              <div className="loading" style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>
            ) : filas.length === 0 ? (
              <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Sin filas aún</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="eg-preview-table">
                  <thead>
                    <tr>
                      <th rowSpan="2">Programa</th>
                      <th rowSpan="2">Grupos</th>
                      <th colSpan="3">Cantidad</th>
                      <th colSpan="3">Aprovechamiento</th>
                    </tr>
                    <tr>
                      <th>Total</th>
                      <th>Hombres</th>
                      <th>Mujeres</th>
                      <th>Hombres</th>
                      <th>Mujeres</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((fila, index) => (
                      <tr key={fila.id}>
                        <td style={{ textAlign: 'left', fontWeight: 'bold' }}>{getValor(fila, 'programa')}</td>
                        <td>{getValor(fila, 'grupos')}</td>
                        <td>{getValor(fila, 'cant_total')}</td>
                        <td>{getValor(fila, 'cant_hombres')}</td>
                        <td>{getValor(fila, 'cant_mujeres')}</td>
                        <td>{getValor(fila, 'aprov_hombres')}</td>
                        <td>{getValor(fila, 'aprov_mujeres')}</td>
                        <td>{getValor(fila, 'aprov_total')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="eg-filas-section">
            <div className="eg-filas-header">
              <h3>Filas (Programas)</h3>
              <button className="btn btn-primary" onClick={handleOpenNewFila}>+ Nueva Fila</button>
            </div>
            {filasLoading ? (
              <div className="loading" style={{ padding: '1rem' }}>Cargando...</div>
            ) : filas.length === 0 ? (
              <p className="text-muted" style={{ padding: '1rem' }}>No hay filas registradas. Agrega la primera.</p>
            ) : (
              <div className="eg-filas-preview">
                <table className="eg-filas-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      {COLUMNAS_FIJAS.map(col => (
                        <th key={col.key}>{col.label}</th>
                      ))}
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((fila, index) => (
                      <tr key={fila.id}>
                        <td>{index + 1}</td>
                        {COLUMNAS_FIJAS.map(col => (
                          <td key={col.key}>{getValor(fila, col.key)}</td>
                        ))}
                        <td>
                          <div className="eg-fila-actions">
                            <button className="btn btn-secondary btn-small" onClick={() => handleOpenEditFila(fila)}>Editar</button>
                            <button className="btn btn-danger btn-small" onClick={() => handleDeleteFila(fila)}>Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {showFormFila && (
          <div className="form-modal" onClick={() => setShowFormFila(false)}>
            <div className="form-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
              <div className="form-header">
                <h2>{editFilaId ? 'Editar Fila' : 'Nueva Fila'}</h2>
                <button className="close-btn" onClick={() => { setShowFormFila(false); setEditFilaId(null); }}>×</button>
              </div>
              <form onSubmit={handleSaveFila} style={{ padding: '20px 30px 30px' }}>
                <div className="eg-fila-form-grid">
                  {COLUMNAS_FIJAS.map(col => (
                    <FormInput
                      key={col.key}
                      label={col.label}
                      name={`fila-${col.key}`}
                      value={filaValores[col.key] || ''}
                      onChange={e => setFilaValores(prev => ({ ...prev, [col.key]: e.target.value }))}
                      type={col.tipo === 'numero' ? 'number' : col.tipo === 'decimal' ? 'number' : 'text'}
                      step={col.tipo === 'decimal' ? '0.01' : undefined}
                    />
                  ))}
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowFormFila(false); setEditFilaId(null); }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={filaSaving}>
                    {filaSaving ? 'Guardando...' : editFilaId ? 'Guardar Cambios' : 'Crear Fila'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tab-content estadisticos-genero">
      <div className="tab-header">
        <h2>📊 Estadísticos por Género</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={onClose}>← Volver al Dashboard</button>
          <button className="btn btn-primary" onClick={handleOpenNewHoja}>+ Nueva Hoja</button>
        </div>
      </div>

      <div className="eg-info-bar">
        <h3>Información Estadística por Género</h3>
        <p>Selecciona una hoja para ver y administrar sus programas.</p>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: '2rem' }}>Cargando...</div>
      ) : hojas.length === 0 ? (
        <div className="eg-empty">
          <p>No hay hojas registradas</p>
          <button className="btn btn-primary" onClick={handleOpenNewHoja}>Crear Primera Hoja</button>
        </div>
      ) : (
        <div className="eg-hojas-list">
          {hojas.map(hoja => (
            <div key={hoja.id} className="eg-hoja-card">
              <div className="eg-hoja-info">
                <h3>{hoja.nombre || 'Sin nombre'}</h3>
              </div>
              <div className="eg-hoja-actions">
                <button className="btn btn-success" onClick={() => handleSelectHoja(hoja)}>
                  Entrar
                </button>
                <button className="btn btn-secondary btn-small" onClick={() => handleOpenEditHoja(hoja)}>✏️ Editar</button>
                <button className="btn btn-danger btn-small" onClick={() => handleDeleteHoja(hoja)}>🗑️ Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showFormHoja && (
        <div className="form-modal" onClick={() => setShowFormHoja(false)}>
          <div className="form-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="form-header">
              <h2>{editHojaId ? 'Editar Hoja' : 'Nueva Hoja'}</h2>
              <button className="close-btn" onClick={() => setShowFormHoja(false)}>×</button>
            </div>
            <form onSubmit={handleSaveHoja} style={{ padding: '20px 30px 30px' }}>
              <FormInput
                label="Nombre del cuatrimestre/período *"
                name="form-nombre"
                value={formNombre}
                onChange={e => setFormNombre(e.target.value)}
                placeholder="Ej: Cuatrimestre Enero - Abril 2025"
                required
              />
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormHoja(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={savingHoja}>
                  {savingHoja ? 'Guardando...' : '💾 Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminEstadisticosGenero;
