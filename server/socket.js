const { Server } = require('socket.io');

let io;

const initSockets = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('[socket] client connecté', socket.id);
    socket.on('disconnect', () => console.log('[socket] client déconnecté', socket.id));
  });

  return io;
};

const getIo = () => io;

const emitCall = (payload) => {
  if (!io) return;
  io.emit('call', payload);
};

module.exports = { initSockets, getIo, emitCall };
