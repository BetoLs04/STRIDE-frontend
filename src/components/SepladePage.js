import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/SepladePage.css';

const API_URL = 'https://api1.strideutmat.com';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const SepladePage = ({ user }) => {
  const { hojaId } = useParams();
  const navigate = useNavigate();
  const esSuperAdmin = user?.tipo === 'superadmin';

  const [hoja, setHoja] = useState(null);
  const [indicadores, setIndicadores] = useState([]);
  const [valores, setValores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalValue, setModalValue] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalIndicadorId, setModalIndicadorId] = useState(null);
  const [modalField, setModalField] = useState(null);
  const [modalMes, setModalMes] = useState(null);
  const [modalTipo, setModalTipo] = useState(null);

  const getValor = (indicadorId, mes, tipo) => {
    const v = valores.find(
      val => val.indicador_id === indicadorId && val.mes === mes && val.tipo === tipo
    );
    return v?.valor || '';
  };

  const fetchHoja = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/university/seplade-hojas/${hojaId}`);
      if (res.data.success && res.data.data) {
        setHoja(res.data.data);
        setIndicadores(res.data.data.indicadores || []);
        setValores(res.data.data.valores || []);
      }
    } catch (error) {
      toast.error('Error al cargar hoja SEPLADE');
    } finally {
      setLoading(false);
    }
  }, [hojaId]);

  useEffect(() => {
    fetchHoja();
  }, [fetchHoja]);

  const openModal = (indicadorId, field, mes, tipo, currentValue) => {
    setModalIndicadorId(indicadorId);
    setModalField(field);
    setModalMes(mes);
    setModalTipo(tipo);
    setModalValue(currentValue || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalIndicadorId(null);
    setModalField(null);
    setModalMes(null);
    setModalTipo(null);
    setModalValue('');
  };

  const handleSaveModal = async () => {
    if (!modalIndicadorId) return;
    setModalSaving(true);
    try {
      if (modalField === 'valor') {
        await axios.put(`${API_URL}/api/university/seplade-valores/${modalIndicadorId}`, {
          mes: modalMes,
          tipo: modalTipo,
          valor: modalValue
        });
        setValores(prev => prev.map(v =>
          v.indicador_id === modalIndicadorId && v.mes === modalMes && v.tipo === modalTipo
            ? { ...v, valor: modalValue }
            : v
        ));
      } else {
        await axios.put(`${API_URL}/api/university/seplade-indicadores/${modalIndicadorId}`, {
          [modalField]: modalValue
        });
        setIndicadores(prev => prev.map(i =>
          i.id === modalIndicadorId ? { ...i, [modalField]: modalValue } : i
        ));
      }
      closeModal();
      toast.success('Celda guardada');
    } catch (error) {
      toast.error('Error al guardar celda');
    } finally {
      setModalSaving(false);
    }
  };

  const handleAddIndicador = async () => {
    setAdding(true);
    try {
      const res = await axios.post(`${API_URL}/api/university/seplade-indicadores`, { hoja_id: parseInt(hojaId) });
      setIndicadores(prev => [...prev, res.data.data]);
      // Add empty values for the new indicator
      const newValores = [];
      for (let mes = 1; mes <= 12; mes++) {
        newValores.push({ indicador_id: res.data.data.id, mes, tipo: 'programado', valor: '' });
        newValores.push({ indicador_id: res.data.data.id, mes, tipo: 'realizado', valor: '' });
      }
      setValores(prev => [...prev, ...newValores]);
      toast.success('Indicador agregado');
    } catch (error) {
      toast.error('Error al agregar indicador');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteIndicador = async (indicadorId) => {
    if (!window.confirm('¿Eliminar este indicador?')) return;
    try {
      await axios.delete(`${API_URL}/api/university/seplade-indicadores/${indicadorId}`);
      setIndicadores(prev => prev.filter(i => i.id !== indicadorId));
      setValores(prev => prev.filter(v => v.indicador_id !== indicadorId));
      toast.success('Indicador eliminado');
    } catch (error) {
      toast.error('Error al eliminar indicador');
    }
  };

  const goBack = () => {
    if (esSuperAdmin) navigate('/admin/dashboard', { state: { tab: 'seplade' } });
    else navigate('/');
  };

  if (loading) {
    return (
      <div className="seplade-page-container">
        <div className="loading">Cargando SEPLADE...</div>
      </div>
    );
  }

  if (!hoja) {
    return (
      <div className="seplade-page-container">
        <div className="no-data">
          <p>Hoja no encontrada</p>
          <button className="btn btn-secondary" onClick={goBack}>← Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="seplade-page-container">
      <div className="seplade-page-toolbar">
        <button className="btn btn-secondary" onClick={goBack}>← Volver</button>
        {esSuperAdmin && (
          <button className="btn btn-primary" onClick={handleAddIndicador} disabled={adding}>
            {adding ? '...' : '+ Agregar indicador'}
          </button>
        )}
      </div>

      <div className="seplade-page">
        <div className="seplade-header">
          <h1>{hoja.titulo}</h1>
          {hoja.subtitulo && <p>{hoja.subtitulo}</p>}
        </div>

        <table className="seplade-table">
          <thead>
            <tr>
              <th rowSpan="3" style={{ minWidth: '200px' }}>Indicador</th>
              <th rowSpan="3">Nivel</th>
              <th rowSpan="3">Unidad de<br />Medida</th>
              <th rowSpan="3">Meta<br />Anual</th>
              <th rowSpan="3">Programado /<br />Realizado</th>
              {MESES.map((mes, i) => (
                <th key={i} className="month-group" colSpan="1">{mes}</th>
              ))}
              <th rowSpan="3">Encargado</th>
              <th rowSpan="3" style={{ minWidth: '160px' }}>Evidencia Física</th>
              <th rowSpan="3" style={{ minWidth: '160px' }}>Evidencia en línea</th>
              {esSuperAdmin && <th rowSpan="3" style={{ width: '40px' }}>Acc</th>}
            </tr>
          </thead>
          <tbody>
            {indicadores.length === 0 ? (
              <tr>
                <td colSpan={20 + (esSuperAdmin ? 1 : 0)} className="td-empty">
                  Sin indicadores registrados. {esSuperAdmin ? 'Haz clic en "+ Agregar indicador"' : ''}
                </td>
              </tr>
            ) : (
              indicadores.map(ind => (
                <React.Fragment key={ind.id}>
                  <tr className="row-prog">
                    <td
                      className="col-indicador"
                      rowSpan="2"
                      onClick={() => esSuperAdmin && openModal(ind.id, 'nombre', null, null, ind.nombre)}
                      style={{ cursor: esSuperAdmin ? 'pointer' : 'default' }}
                    >{ind.nombre}</td>
                    <td
                      rowSpan="2"
                      onClick={() => esSuperAdmin && openModal(ind.id, 'nivel', null, null, ind.nivel)}
                      style={{ cursor: esSuperAdmin ? 'pointer' : 'default' }}
                    >{ind.nivel || '—'}</td>
                    <td
                      rowSpan="2"
                      onClick={() => esSuperAdmin && openModal(ind.id, 'unidad_medida', null, null, ind.unidad_medida)}
                      style={{ cursor: esSuperAdmin ? 'pointer' : 'default' }}
                    >{ind.unidad_medida || '—'}</td>
                    <td
                      rowSpan="2"
                      onClick={() => esSuperAdmin && openModal(ind.id, 'meta_anual', null, null, ind.meta_anual)}
                      style={{ cursor: esSuperAdmin ? 'pointer' : 'default' }}
                    >{ind.meta_anual || '—'}</td>
                    <td className="meta-label-prog">Programado</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(mes => {
                      const val = getValor(ind.id, mes, 'programado');
                      const hasVal = val !== '';
                      return (
                        <td
                          key={mes}
                          className={hasVal ? '' : 'fill-green'}
                          onClick={() => esSuperAdmin && openModal(ind.id, 'valor', mes, 'programado', val)}
                          style={{ cursor: esSuperAdmin ? 'pointer' : 'default' }}
                        >{val || ''}</td>
                      );
                    })}
                    <td
                      rowSpan="2"
                      onClick={() => esSuperAdmin && openModal(ind.id, 'encargado', null, null, ind.encargado)}
                      style={{ cursor: esSuperAdmin ? 'pointer' : 'default' }}
                    >{ind.encargado || '—'}</td>
                    <td
                      rowSpan="2"
                      className="col-evidencia col-evidence-green"
                      onClick={() => esSuperAdmin && openModal(ind.id, 'evidencia_fisica', null, null, ind.evidencia_fisica)}
                      style={{ cursor: esSuperAdmin ? 'pointer' : 'default' }}
                    >{ind.evidencia_fisica || '—'}</td>
                    <td
                      rowSpan="2"
                      className="col-online col-evidence-green"
                      onClick={() => esSuperAdmin && openModal(ind.id, 'evidencia_online', null, null, ind.evidencia_online)}
                      style={{ cursor: esSuperAdmin ? 'pointer' : 'default' }}
                    >{ind.evidencia_online || '—'}</td>
                    {esSuperAdmin && (
                      <td rowSpan="2">
                        <button className="btn btn-danger btn-small" onClick={() => handleDeleteIndicador(ind.id)}>🗑️</button>
                      </td>
                    )}
                  </tr>
                  <tr className="row-real">
                    <td className="meta-label-real">Realizado</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(mes => {
                      const val = getValor(ind.id, mes, 'realizado');
                      const progVal = getValor(ind.id, mes, 'programado');
                      const progHasVal = progVal !== '';
                      return (
                        <td
                          key={mes}
                          className={progHasVal ? 'fill-green' : 'fill-red'}
                          onClick={() => openModal(ind.id, 'valor', mes, 'realizado', val)}
                          style={{ cursor: 'pointer' }}
                        >{val || ''}</td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>

        <div className="seplade-symbology">
          <strong>Simbología:</strong>
          <div className="sym-box">
            <div className="sym-color" style={{ background: '#d5f5e3' }}></div>
            <span>Espacios a llenar</span>
          </div>
          <div className="sym-box">
            <div className="sym-color" style={{ background: '#fadbd8' }}></div>
            <span>Se hicieron antes o después del plazo</span>
          </div>
        </div>
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

export default SepladePage;
