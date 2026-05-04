import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ["GET", "POST", "PUT"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    socket.on('join-ticket', (ticketId) => {
      socket.join(`ticket-${ticketId}`);
      console.log(`[Socket] User joined room: ticket-${ticketId}`);
    });

    socket.on('join-dept', (deptId) => {
      socket.join(`dept-${deptId}`);
      console.log(`[Socket] User joined room: dept-${deptId}`);
    });

    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`[Socket] User joined room: user-${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket(httpServer) first.');
  }
  return io;
};
