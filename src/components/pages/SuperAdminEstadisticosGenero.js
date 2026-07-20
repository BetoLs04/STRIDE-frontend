import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { toast } from 'react-toastify';
import '../../styles/SuperAdminEstadisticosGenero.css';
import FormInput from '../shared/FormInput';
import { handleApiError } from '../../utils/errorHandler';
import useSocketEvent from '../../hooks/useSocketEvent';

const SuperAdminEstadisticosGenero = ({ onClose }) => {
  const [hojas, setHojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormHoja, setShowFormHoja] = useState(false);
  const [editHojaId, setEditHojaId] = useState(null);
  const [formNombre, setFormNombre] = useState('');
  const [savingHoja, setSavingHoja] = useState(false);

  const [selectedHoja, setSelectedHoja] = useState(null);

  const [columnas, setColumnas] = useState([]);
  const [columnasLoading, setColumnasLoading] = useState(false);
  const [nuevaColumna, setNuevaColumna] = useState('');
  const [nuevaColumnaTipo, setNuevaColumnaTipo] = useState('texto');
  const [editColumnaId, setEditColumnaId] = useState(null);
  const [editColumnaNombre, setEditColumnaNombre] = useState('');
  const [editColumnaTipo, setEditColumnaTipo] = useState('texto');
  const [columnaSaving, setColumnaSaving] = useState(false);

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

  const fetchHojaData = async (hojaId) => {
    setColumnasLoading(true);
    setFilasLoading(true);
    try {
      const res = await api.get(`/api/university/estadisticos-genero-hojas/${hojaId}`);
      setColumnas(res.data.data.columnas || []);
      setFilas(res.data.data.filas || []);
    } catch (error) {
      handleApiError(error, 'Error al cargar datos de la hoja');
    } finally {
      setColumnasLoading(false);
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
    if (!window.confirm(`¿Eliminar la hoja "${hoja.nombre || 'Sin nombre'}"?\nTambién se eliminarán sus columnas y filas.`)) return;
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
    fetchHojaData(hoja.id);
  };

  const handleAddColumna = async () => {
    if (!nuevaColumna.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    setColumnaSaving(true);
    try {
      await api.post('/api/university/estadisticos-genero-columnas', {
        nombre: nuevaColumna.trim(),
        tipo_dato: nuevaColumnaTipo,
        hoja_id: selectedHoja.id
      });
      toast.success('Columna creada');
      setNuevaColumna('');
      setNuevaColumnaTipo('texto');
      fetchHojaData(selectedHoja.id);
    } catch (error) {
      handleApiError(error, 'Error al crear columna');
    } finally {
      setColumnaSaving(false);
    }
  };

  const handleStartEditColumna = (columna) => {
    setEditColumnaId(columna.id);
    setEditColumnaNombre(columna.nombre);
    setEditColumnaTipo(columna.tipo_dato || 'texto');
  };

  const handleSaveEditColumna = async () => {
    if (!editColumnaNombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    setColumnaSaving(true);
    try {
      await api.put(`/api/university/estadisticos-genero-columnas/${editColumnaId}`, {
        nombre: editColumnaNombre.trim(),
        tipo_dato: editColumnaTipo
      });
      toast.success('Columna actualizada');
      setEditColumnaId(null);
      setEditColumnaNombre('');
      fetchHojaData(selectedHoja.id);
    } catch (error) {
      handleApiError(error, 'Error al actualizar columna');
    } finally {
      setColumnaSaving(false);
    }
  };

  const handleCancelEditColumna = () => {
    setEditColumnaId(null);
    setEditColumnaNombre('');
    setEditColumnaTipo('texto');
  };

  const handleDeleteColumna = async (columna) => {
    if (!window.confirm(`¿Eliminar la columna "${columna.nombre}"?`)) return;
    try {
      await api.delete(`/api/university/estadisticos-genero-columnas/${columna.id}`);
      toast.success('Columna eliminada');
      fetchHojaData(selectedHoja.id);
    } catch (error) {
      handleApiError(error, 'Error al eliminar columna');
    }
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
    columnas.forEach(c => { initial[`c_${c.id}`] = ''; });
    setFilaValores(initial);
    setShowFormFila(true);
  };

  const handleOpenEditFila = (fila) => {
    setEditFilaId(fila.id);
    const vals = {};
    columnas.forEach(c => {
      vals[`c_${c.id}`] = getValor(fila, `c_${c.id}`);
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
      fetchHojaData(selectedHoja.id);
    } catch (error) {
      handleApiError(error, 'Error al guardar fila');
    } finally {
      setFilaSaving(false);
    }
  };

  const handleDeleteFila = async (fila) => {
    const nombre = getValor(fila, 'c_1') || `Fila #${fila.id}`;
    if (!window.confirm(`¿Eliminar la fila "${nombre}"?`)) return;
    try {
      await api.delete(`/api/university/estadisticos-genero-filas/${fila.id}`);
      toast.success('Fila eliminada');
      fetchHojaData(selectedHoja.id);
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

        <div className="eg-main-layout">
          <div className="eg-left">
            <div className="eg-panel">
              <div className="eg-panel-header">
                <h3>Columnas</h3>
              </div>
              {columnasLoading ? (
                <div className="loading" style={{ padding: '1rem' }}>Cargando...</div>
              ) : (
                <div className="eg-columnas-content">
                  <div className="eg-columnas-add-form">
                    <input
                      type="text"
                      value={nuevaColumna}
                      onChange={e => setNuevaColumna(e.target.value)}
                      placeholder="Nombre de la columna"
                      onKeyDown={e => { if (e.key === 'Enter') handleAddColumna(); }}
                    />
                    <select value={nuevaColumnaTipo} onChange={e => setNuevaColumnaTipo(e.target.value)}>
                      <option value="texto">Texto</option>
                      <option value="numero">Número</option>
                      <option value="decimal">Decimal</option>
                    </select>
                    <button className="btn btn-primary btn-small" onClick={handleAddColumna} disabled={columnaSaving}>
                      {columnaSaving ? '...' : '+ Agregar'}
                    </button>
                  </div>
                  {columnas.length === 0 ? (
                    <p className="text-muted" style={{ padding: '0.5rem' }}>No hay columnas registradas</p>
                  ) : (
                    <div className="eg-columnas-list">
                      {columnas.map((columna, index) => (
                        <div key={columna.id} className="eg-columna-item">
                          <span className="eg-columna-index">{index + 1}.</span>
                          {editColumnaId === columna.id ? (
                            <div className="eg-columna-edit-inline">
                              <input
                                type="text"
                                value={editColumnaNombre}
                                onChange={e => setEditColumnaNombre(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveEditColumna(); if (e.key === 'Escape') handleCancelEditColumna(); }}
                                autoFocus
                              />
                              <select value={editColumnaTipo} onChange={e => setEditColumnaTipo(e.target.value)}>
                                <option value="texto">Texto</option>
                                <option value="numero">Número</option>
                                <option value="decimal">Decimal</option>
                              </select>
                              <button className="btn btn-primary btn-small" onClick={handleSaveEditColumna} disabled={columnaSaving}>Guardar</button>
                              <button className="btn btn-secondary btn-small" onClick={handleCancelEditColumna}>Cancelar</button>
                            </div>
                          ) : (
                            <>
                              <span className="eg-columna-nombre">{columna.nombre}</span>
                              <span className="eg-columna-tipo-badge">{columna.tipo_dato === 'numero' ? 'Número' : columna.tipo_dato === 'decimal' ? 'Decimal' : 'Texto'}</span>
                              <div className="eg-columna-actions">
                                <button className="btn btn-secondary btn-small" onClick={() => handleStartEditColumna(columna)}>Editar</button>
                                <button className="btn btn-danger btn-small" onClick={() => handleDeleteColumna(columna)}>Eliminar</button>
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
          </div>

          <div className="eg-right">
            <div className="eg-panel">
              <div className="eg-panel-header">
                <h3>Vista previa</h3>
              </div>
              <div className="eg-preview-content">
                <h4 style={{ textAlign: 'center', margin: '0.5rem 0' }}>Información Estadística por Género</h4>
                <p style={{ textAlign: 'center', color: '#6b7280', margin: '0 0 1rem' }}>{selectedHoja.nombre}</p>
                {filasLoading ? (
                  <div className="loading" style={{ padding: '1rem' }}>Cargando...</div>
                ) : filas.length === 0 ? (
                  <p className="text-muted" style={{ padding: '1rem', textAlign: 'center' }}>Sin filas aún</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="eg-preview-table">
                      <thead>
                        <tr>
                          {columnas.map(col => (
                            <th key={col.id}>{col.nombre}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filas.map((fila, index) => (
                          <tr key={fila.id}>
                            {columnas.map(col => (
                              <td key={col.id}>{getValor(fila, `c_${col.id}`)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="eg-filas-section">
          <div className="eg-filas-header">
            <h3>Filas (Programas)</h3>
            <button className="btn btn-primary" onClick={handleOpenNewFila}>+ Nueva Fila</button>
          </div>
          {filasLoading ? (
            <div className="loading" style={{ padding: '1rem' }}>Cargando filas...</div>
          ) : filas.length === 0 ? (
            <p className="text-muted" style={{ padding: '1rem' }}>No hay filas registradas. Agrega la primera.</p>
          ) : (
            <div className="eg-filas-preview">
              <table className="eg-filas-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {columnas.map(col => (
                      <th key={col.id}>{col.nombre}</th>
                    ))}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila, index) => (
                    <tr key={fila.id}>
                      <td>{index + 1}</td>
                      {columnas.map(col => (
                        <td key={col.id}>{getValor(fila, `c_${col.id}`)}</td>
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

        {showFormFila && (
          <div className="form-modal" onClick={() => setShowFormFila(false)}>
            <div className="form-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
              <div className="form-header">
                <h2>{editFilaId ? 'Editar Fila' : 'Nueva Fila'}</h2>
                <button className="close-btn" onClick={() => { setShowFormFila(false); setEditFilaId(null); }}>×</button>
              </div>
              <form onSubmit={handleSaveFila} style={{ padding: '20px 30px 30px' }}>
                <div className="eg-fila-form-grid">
                  {columnas.map(col => (
                    <FormInput
                      key={col.id}
                      label={col.nombre}
                      name={`fila-c-${col.id}`}
                      value={filaValores[`c_${col.id}`] || ''}
                      onChange={e => setFilaValores(prev => ({ ...prev, [`c_${col.id}`]: e.target.value }))}
                      type={col.tipo_dato === 'numero' ? 'number' : col.tipo_dato === 'decimal' ? 'number' : 'text'}
                      step={col.tipo_dato === 'decimal' ? '0.01' : undefined}
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
        <p>Selecciona una hoja para administrar sus columnas y filas.</p>
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
                  Administrar hoja
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
