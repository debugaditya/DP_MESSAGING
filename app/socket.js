import { io } from 'socket.io-client';

// The URL for your live server. It will be read from your environment variables.
const URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const socket = io(URL, {
  autoConnect: false,
});

export const connectSocket = (userId) => {
  if (socket.connected) {
    return;
  }
  // Pass the userId in the 'auth' object for registration on the server
  socket.auth = { userId };
  socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const sendMessage = (senderId, recipientId, messageContent) => {
  socket.emit('send-message', { from: senderId, to: recipientId, content: messageContent });
};

export const onMessageReceive = (handler) => {
  socket.on('receive-message', handler);
};

export const offMessageReceive = (handler) => {
  socket.off('receive-message', handler);
};

export const sendNotification = (senderId, recipientId, type) => {
  socket.emit('send-notification', { from: senderId, to: recipientId, type:type });
};

export const onNotificationReceive = (handler) => {
  socket.on('notification', handler);
};

export const offNotificationReceive = (handler) => {
  socket.off('notification', handler);
};

const socketService = {
  socket,
  connectSocket,
  disconnectSocket,
  sendMessage,
  onMessageReceive,
  offMessageReceive,
  sendNotification,
  onNotificationReceive,
  offNotificationReceive,
};

export default socketService;
