import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let io;

export const initializeSocket = (server) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = decoded.userId;
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.name} (${socket.user.wa_id})`);

    // Join user to their personal room
    socket.join(`user_${socket.user.wa_id}`);

    // Update user online status
    updateUserOnlineStatus(socket.user._id, true);

    // Join conversation rooms
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`📞 User ${socket.user.name} joined conversation: ${conversationId}`);
    });

    // Leave conversation rooms
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`📴 User ${socket.user.name} left conversation: ${conversationId}`);
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      socket.to(data.conversationId).emit('user_typing', {
        userId: socket.user._id,
        userName: socket.user.name,
        wa_id: socket.user.wa_id,
        conversationId: data.conversationId
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(data.conversationId).emit('user_stop_typing', {
        userId: socket.user._id,
        wa_id: socket.user.wa_id,
        conversationId: data.conversationId
      });
    });

    // Handle message read receipts
    socket.on('mark_messages_read', (data) => {
      socket.to(data.conversationId).emit('messages_read', {
        readBy: socket.user.wa_id,
        conversationId: data.conversationId,
        timestamp: new Date()
      });
    });

    // Handle user presence updates
    socket.on('update_presence', (status) => {
      if (['online', 'away', 'busy'].includes(status)) {
        updateUserOnlineStatus(socket.user._id, status === 'online');

        // Broadcast presence to all user's conversations
        socket.broadcast.emit('user_presence_update', {
          userId: socket.user._id,
          wa_id: socket.user.wa_id,
          isOnline: status === 'online',
          lastSeen: new Date()
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`❌ User disconnected: ${socket.user.name} (${reason})`);

      // Update user offline status
      updateUserOnlineStatus(socket.user._id, false);

      // Broadcast offline status
      socket.broadcast.emit('user_presence_update', {
        userId: socket.user._id,
        wa_id: socket.user.wa_id,
        isOnline: false,
        lastSeen: new Date()
      });
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.name}:`, error);
    });
  });

  console.log('🚀 Socket.IO server initialized');
  return io;
};

// Helper function to update user online status
const updateUserOnlineStatus = async (userId, isOnline) => {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: new Date()
    });
  } catch (error) {
    console.error('Error updating user online status:', error);
  }
};

// Get IO instance
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Emit to specific user
export const emitToUser = (wa_id, event, data) => {
  if (io) {
    io.to(`user_${wa_id}`).emit(event, data);
  }
};

// Emit to conversation
export const emitToConversation = (conversationId, event, data) => {
  if (io) {
    io.to(conversationId).emit(event, data);
  }
};

// Emit to all connected clients
export const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Get connected users count
export const getConnectedUsersCount = () => {
  return io ? io.engine.clientsCount : 0;
};

// Get users in specific room
export const getUsersInRoom = async (roomName) => {
  if (!io) return [];

  try {
    const sockets = await io.in(roomName).fetchSockets();
    return sockets.map(socket => ({
      userId: socket.userId,
      user: socket.user
    }));
  } catch (error) {
    console.error('Error fetching users in room:', error);
    return [];
  }
};
