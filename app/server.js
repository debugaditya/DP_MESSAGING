const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, you should restrict this to your Vercel URL
  },
});

const userSocketMap = {};

function getSocketIdByUserId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log(`A user connected with socket ID: ${socket.id}`);

  // Listen for the user to register themselves with their userId
  socket.on("register-user", (userId) => {
    if (userId) {
      userSocketMap[userId] = socket.id;
      console.log(`User registered: ${userId} with socket ID: ${socket.id}`);
    }
  });

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

// Use the port provided by the hosting service, or 3001 for local development
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
