import { io } from 'socket.io-client';
import { getAuthToken } from './api.js';

class SocketService {
  constructor() {
    this.socket = null;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryInterval = 3000;
    this.listeners = new Map();
  }

  connect() {
    const token = getAuthToken();

    if (!token) {
      console.warn('No auth token found, cannot connect to socket');
      return;
    }

    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    try {
      this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxRetries,
        reconnectionDelay: this.retryInterval,
        autoConnect: true,
      });

      this.setupEventListeners();

    } catch (error) {
      console.error('Socket connection error:', error);
      this.handleConnectionError();
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      this.connectionAttempts = 0;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.emit('connection_status', { connected: false, reason });

      if (reason === 'io server disconnect') {
        // Server disconnected the socket, need to reconnect manually
        setTimeout(() => this.connect(), this.retryInterval);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connectionAttempts++;

      if (this.connectionAttempts >= this.maxRetries) {
        console.error('Max connection attempts reached');
        this.emit('connection_error', { error: error.message, maxRetriesReached: true });
      } else {
        this.emit('connection_error', { error: error.message, attempt: this.connectionAttempts });
      }
    });

    // Message events
    this.socket.on('new_message', (data) => {
      console.log('📩 New message received:', data);
      this.emit('new_message', data);
    });

    this.socket.on('message_status_update', (data) => {
      console.log('📊 Message status updated:', data);
      this.emit('message_status_update', data);
    });

    this.socket.on('message_deleted', (data) => {
      console.log('🗑️ Message deleted:', data);
      this.emit('message_deleted', data);
    });

    this.socket.on('message_notification', (data) => {
      console.log('🔔 Message notification:', data);
      this.emit('message_notification', data);
    });

    // Typing events
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_stop_typing', (data) => {
      this.emit('user_stop_typing', data);
    });

    // Presence events
    this.socket.on('user_presence_update', (data) => {
      this.emit('user_presence_update', data);
    });

    this.socket.on('messages_read', (data) => {
      this.emit('messages_read', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('socket_error', { error });
    });
  }

  // Event management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event handler for ${event}:`, error);
        }
      });
    }
  }

  // Socket actions
  joinConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', conversationId);
      console.log(`📞 Joined conversation: ${conversationId}`);
    }
  }

  leaveConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', conversationId);
      console.log(`📴 Left conversation: ${conversationId}`);
    }
  }

  startTyping(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { conversationId });
    }
  }

  stopTyping(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { conversationId });
    }
  }

  markMessagesRead(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit('mark_messages_read', { conversationId });
    }
  }

  updatePresence(status = 'online') {
    if (this.socket?.connected) {
      this.socket.emit('update_presence', status);
    }
  }

  // Connection management
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket disconnected manually');
    }
  }

  reconnect() {
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  handleConnectionError() {
    // Implement exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000);

    setTimeout(() => {
      if (this.connectionAttempts < this.maxRetries) {
        this.connect();
      }
    }, delay);
  }

  // Cleanup
  destroy() {
    this.listeners.clear();
    this.disconnect();
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
