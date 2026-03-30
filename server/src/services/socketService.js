let _io = null;

function setupSocket(io) {
  _io = io;

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client joins their business room
    socket.on('join:business', (businessId) => {
      socket.join(`biz_${businessId}`);
      console.log(`📦 ${socket.id} joined room biz_${businessId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}

function emitToRoom(io, businessId, event, data) {
  if (!io) return;
  io.to(`biz_${businessId}`).emit(event, data);
}

module.exports = { setupSocket, emitToRoom };
