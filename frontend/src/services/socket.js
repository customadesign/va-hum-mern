import { io } from 'socket.io-client';

let socket = null;

const resolveBaseUrl = () => {
  // Prefer explicit socket URL
  const envUrl = process.env.REACT_APP_SOCKET_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  // Derive from API URL (strip trailing /api)
  const api = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  return api.replace(/\/api\/?$/, '');
};

export const initSocket = () => {
  if (socket && socket.connected) return socket;
  const base = resolveBaseUrl();
  socket = io(base, {
    withCredentials: true,
    transports: ['websocket'],
  });
  return socket;
};

export const getSocket = () => socket;

export const joinUser = (userId) => {
  if (!socket) return;
  socket.emit('join', userId);
};

export const leaveUser = (userId) => {
  if (!socket) return;
  socket.emit('leave', userId);
};

export const joinConversation = (conversationId) => {
  if (!socket) return;
  socket.emit('join-conversation', conversationId);
};

export const leaveConversation = (conversationId) => {
  if (!socket) return;
  socket.emit('leave-conversation', conversationId);
};

export const typingStart = (conversationId, userId) => {
  if (!socket) return;
  socket.emit('typing_start', { conversationId, userId });
};

export const typingStop = (conversationId, userId) => {
  if (!socket) return;
  socket.emit('typing_stop', { conversationId, userId });
};