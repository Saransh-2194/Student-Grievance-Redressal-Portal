import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export const useSocket = (ticketId, deptId, userId) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      withCredentials: true
    });

    s.on('connect', () => {
      console.log('[Socket] Connected to server');
      if (ticketId) s.emit('join-ticket', ticketId);
      if (deptId) s.emit('join-dept', deptId);
      if (userId) s.emit('join-user', userId);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [ticketId, deptId]);

  return socket;
};
