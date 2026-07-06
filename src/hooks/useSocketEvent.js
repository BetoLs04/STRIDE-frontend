import { useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';

const useSocketEvent = (event, callback) => {
  const { socket } = useSocket();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!socket) return;

    const handler = (...args) => {
      callbackRef.current(...args);
    };

    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [socket, event]);
};

export default useSocketEvent;
