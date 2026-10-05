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

const useSocketEvent = (event, callback) => {
  const { socket } = useSocket();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!socket) return;

    const handler = (...args) => {
      schedule(() => callbackRef.current(...args));
    };

    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [socket, event]);
};

export default useSocketEvent;
