import { useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';

// Colapsa ráfagas de eventos: máximo 1 ejecución cada THROTTLE_MS,
// con una ejecución diferida al final para no perder el último estado.
// Sin esto, cada celda guardada dispara un evento y TODOS los clientes
// refetchean al instante (ráfaga que dispara la protección anti-DDoS).
const THROTTLE_MS = 2500;
let lastRun = 0;
let timer = null;
let pendingThunk = null;

const schedule = (thunk) => {
  pendingThunk = thunk;
  const remaining = THROTTLE_MS - (Date.now() - lastRun);
  if (remaining <= 0) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastRun = Date.now();
    const run = pendingThunk;
    pendingThunk = null;
    run();
  } else if (!timer) {
    timer = setTimeout(() => {
      timer = null;
      lastRun = Date.now();
      const run = pendingThunk;
      pendingThunk = null;
      if (run) run();
    }, remaining);
  }
};

const useSocketEvent = (event, callback, options = {}) => {
  const { throttle = true } = options;
  const { socket } = useSocket();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!socket) return;

    const handler = (...args) => {
      if (throttle) {
        schedule(() => callbackRef.current(...args));
      } else {
        callbackRef.current(...args);
      }
    };

    // Al reconectar se pudo perder eventos → refrescar para resincronizar.
    // La primera conexión no refresca: la página ya cargó sus datos al montar.
    let yaConectado = socket.connected;
    const alReconectar = () => {
      if (!yaConectado) { yaConectado = true; return; }
      callbackRef.current();
    };

    socket.on(event, handler);
    socket.on('connect', alReconectar);
    return () => {
      socket.off(event, handler);
      socket.off('connect', alReconectar);
    };
  }, [socket, event, throttle]);
};

export default useSocketEvent;
