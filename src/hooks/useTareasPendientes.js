import { useState, useEffect, useCallback } from 'react';
import api from '../api';

const useTareasPendientes = (userId, userTipo) => {
  const [pendientes, setPendientes] = useState(0);

  const cargar = useCallback(async () => {
    if (!userId || userTipo !== 'personal') return;
    try {
      const response = await api.get(`/api/university/tareas/personal/${userId}/conteo`);
      if (response.data.success) {
        setPendientes(response.data.data.pendientes);
      }
    } catch (error) {
      console.error('Error cargando tareas pendientes:', error);
    }
  }, [userId, userTipo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { pendientes, reload: cargar };
};

export default useTareasPendientes;
