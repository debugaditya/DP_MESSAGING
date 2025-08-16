const { Server } = require("socket.io");

const io = new Server(3001, {
  cors: {
    origin: "*",
  },
});

const userSocketMap = {};

function getSocketIdByUserId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
  } else {
    console.log(`An anonymous user connected with socket ID: ${socket.id}`);
  }

  socket.on("send-message", (data) => {
    console.log(`Message from ${data.from} to ${data.to}: ${data.content}`);
    const recipientSocketId = getSocketIdByUserId(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receive-message", data);
    } else {
      console.log(`Recipient ${data.to} not found or offline.`);
    }
  });

  socket.on("send-notification", (data) => {
    console.log(`Notification for ${data.to}:`, data);
    const recipientSocketId = getSocketIdByUserId(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("notification", data);
    } else {
      console.log(`Recipient ${data.to} for notification not found or offline.`);
    }
  });

  socket.on("disconnect", () => {
    for (const [uid, sid] of Object.entries(userSocketMap)) {
      if (sid === socket.id) {
        delete userSocketMap[uid];
        console.log(`User disconnected: ${uid}`);
        break;
      }
    }
  });
});

console.log("Socket.IO server running on port 3001");