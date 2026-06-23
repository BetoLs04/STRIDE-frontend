import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/SMOAPage.css';

const API_URL = 'https://api1.strideutmat.com';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const SMOAPage = ({ user }) => {
  const navigate = useNavigate();

  const esSuperAdmin = user?.tipo === 'superadmin';
  const puedeEditar = esSuperAdmin;

  const [encabezado, setEncabezado] = useState(null);
  const [columnas, setColumnas] = useState([]);
  const [filas, setFilas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [adding, setAdding] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalFila, setModalFila] = useState(null);
  const [modalKey, setModalKey] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const columnasActivas = columnas.filter(c => c.activa !== 0);
  const totalColumnas = columnasActivas.length + MESES.length + 1;

  const getValor = (fila, key) => {
    try {
      const valores = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
      return valores[key] || '';
    } catch {
      return '';
    }
  };

  const formatConComas = (num) => {
    if (num === '' || num === null || num === undefined) return '';
    const partes = num.toString().split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return partes.join('.');
  };

  const parseNumero = (str) => {
    if (!str) return NaN;
    const cleaned = str.replace(/[$%,]/g, '').trim();
    return parseFloat(cleaned);
  };

  const calcularAnual = (fila) => {
    const valores = [];
    for (let i = 0; i < 12; i++) {
      const v = parseNumero(getValor(fila, `f_${i}`));
      if (!isNaN(v)) valores.push(v);
    }
    if (valores.length === 0) return '';
    const suma = valores.reduce((a, b) => a + b, 0);
    const resultado = suma / valores.length;
    return resultado % 1 === 0 ? resultado.toString() : resultado.toFixed(2);
  };

  const setValorEnFila = (fila, key, value) => {
    const valores = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
    valores[key] = value;
    return valores;
  };

  const saveFila = async (fila, valores) => {
    const res = await axios.put(`${API_URL}/api/university/smoa-filas/${fila.id}`, { valores });
    setFilas(prev => prev.map(f => f.id === fila.id ? res.data.data : f));
    return res.data.data;
  };

  const checkAccess = useCallback(async () => {
    if (esSuperAdmin) return true;
    try {
      const res = await axios.get(`${API_URL}/api/university/smoa-usuarios`);
      const asignados = res.data.data || [];
      return asignados.some(u => u.usuario_id === user?.id && u.usuario_tipo === user?.tipo);
    } catch {
      return false;
    }
  }, [esSuperAdmin, user]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      if (!esSuperAdmin) {
        const tieneAcceso = await checkAccess();
        if (!tieneAcceso) {
          setDenied(true);
          setLoading(false);
          return;
        }
      }

      const [encRes, colRes, filasRes] = await Promise.all([
        axios.get(`${API_URL}/api/university/smoa-encabezado`),
        axios.get(`${API_URL}/api/university/smoa-columnas`),
        axios.get(`${API_URL}/api/university/smoa-filas`)
      ]);

      setEncabezado(encRes.data.data || null);
      setColumnas(colRes.data.data || []);
      setFilas(filasRes.data.data || []);
    } catch (error) {
      toast.error('Error al cargar datos SMOA');
    } finally {
      setLoading(false);
    }
  }, [checkAccess, esSuperAdmin]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAddFila = async () => {
    setAdding(true);
    try {
      const res = await axios.post(`${API_URL}/api/university/smoa-filas`, { valores: {} });
      setFilas(prev => [...prev, res.data.data]);
      toast.success('Fila agregada');
    } catch (error) {
      toast.error('Error al agregar fila');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteFila = async (fila) => {
    if (!window.confirm('¿Eliminar esta fila?')) return;
    try {
      await axios.delete(`${API_URL}/api/university/smoa-filas/${fila.id}`);
      setFilas(prev => prev.filter(f => f.id !== fila.id));
      toast.success('Fila eliminada');
    } catch (error) {
      toast.error('Error al eliminar fila');
    }
  };

  const openModal = (fila, key) => {
    if (!puedeEditar) return;
    let valor = getValor(fila, key);
    if (key.startsWith('f_') && key !== 'f_12') {
      const raw = parseNumero(valor);
      valor = isNaN(raw) ? '' : raw.toString();
    }
    setModalFila(fila);
    setModalKey(key);
    setModalValue(valor);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalFila(null);
    setModalKey('');
    setModalValue('');
  };

  const handleSaveModal = async () => {
    if (!modalFila) return;
    setModalSaving(true);
    try {
      const valorLimpio = modalKey.startsWith('f_') ? modalValue.replace(/[$%,]/g, '').trim() : modalValue;
      const valores = setValorEnFila(modalFila, modalKey, valorLimpio);
      const updated = await saveFila(modalFila, valores);

      if (modalKey.startsWith('f_') && modalKey !== 'f_12') {
        const anual = calcularAnual(updated);
        if (anual !== '') {
          const valsConAnual = setValorEnFila(updated, 'f_12', anual);
          await saveFila(updated, valsConAnual);
        }
      }

      closeModal();
      toast.success('Celda guardada');
    } catch (error) {
      toast.error('Error al guardar celda');
    } finally {
      setModalSaving(false);
    }
  };

  const goBack = () => {
    if (esSuperAdmin) navigate('/admin/dashboard', { state: { tab: 'smoa' } });
    else if (user?.tipo === 'directivo') navigate('/directivo/dashboard');
    else navigate('/personal/dashboard');
  };

  if (loading) {
    return (
      <div className="smoa-page-container">
        <div className="loading">Cargando SMOA...</div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="smoa-page-container">
        <div className="no-data" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h2>Permiso denegado</h2>
          <p style={{ marginBottom: '2rem', color: '#6b7280' }}>No tienes acceso al SMOA.</p>
          <button className="btn btn-secondary" onClick={goBack}>← Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="smoa-page-container">
      <div className="smoa-page-toolbar">
        <button className="btn btn-secondary" onClick={goBack}>← Volver</button>
        {puedeEditar && (
          <button className="btn btn-primary" onClick={handleAddFila} disabled={adding}>
            {adding ? '...' : '+ Agregar fila'}
          </button>
        )}
      </div>

      <div className="smoa-page-title">
        <h1>SMOA - Seguimiento Mensual de Objetivos Anuales</h1>
      </div>

      {encabezado?.contenido && (
        <div className="smoa-encabezado-contenido" dangerouslySetInnerHTML={{ __html: encabezado.contenido }} />
      )}

      <div className="smoa-banner">SEGUIMIENTO MENSUAL</div>

      <div className="smoa-table-wrapper">
        <table className="smoa-table">
          <thead>
            <tr>
              {columnasActivas.map((col) => (
                <th key={col.id}>{col.nombre}</th>
              ))}
              {MESES.map((mes, i) => (
                <th key={`mes-${i}`} className="smoa-th-mes">{mes}</th>
              ))}
              <th className="smoa-th-anual">Anual</th>
              {puedeEditar && <th className="smoa-th-acciones">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={totalColumnas + (puedeEditar ? 1 : 0)} className="smoa-td-empty">
                  Sin filas registradas. {puedeEditar ? 'Haz clic en "+ Agregar fila"' : ''}
                </td>
              </tr>
            ) : (
              filas.map((fila) => (
                <tr key={fila.id}>
                  {columnasActivas.map((col) => {
                    const key = `d_${col.id}`;
                    return (
                      <td
                        key={col.id}
                        className={`smoa-cell${!puedeEditar ? ' smoa-cell-readonly' : ''}`}
                        onClick={() => puedeEditar && openModal(fila, key)}
                      >
                        <span className="smoa-cell-text">{getValor(fila, key) || (puedeEditar ? <span className="smoa-cell-placeholder">Escribir...</span> : '')}</span>
                      </td>
                    );
                  })}
                  {MESES.map((_, i) => {
                    const key = `f_${i}`;
                    const displayVal = getValor(fila, key);
                    return (
                      <td
                        key={key}
                        className={`smoa-cell smoa-cell-mes${!puedeEditar ? ' smoa-cell-readonly' : ''}`}
                        onClick={() => puedeEditar && openModal(fila, key)}
                      >
                        <span className="smoa-cell-text">{displayVal || (puedeEditar ? <span className="smoa-cell-placeholder">0</span> : '')}</span>
                      </td>
                    );
                  })}
                  <td className="smoa-cell smoa-cell-anual smoa-cell-readonly">
                    <span className="smoa-cell-text">{getValor(fila, 'f_12') || ''}</span>
                  </td>
                  {puedeEditar && (
                    <td>
                      <button className="btn btn-danger btn-small" onClick={() => handleDeleteFila(fila)}>🗑️</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="cell-modal-overlay" onClick={closeModal}>
          <div className="cell-modal" onClick={e => e.stopPropagation()}>
            <div className="cell-modal-header">
              <h3>Editar celda</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="cell-modal-body">
              <textarea
                className="cell-modal-textarea"
                value={modalValue}
                onChange={e => setModalValue(e.target.value)}
                autoFocus
              />
            </div>
            <div className="cell-modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveModal} disabled={modalSaving}>
                {modalSaving ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMOAPage;
