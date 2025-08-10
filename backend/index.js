import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { initializeSocket } from './websocket/socket.js';

// Import routes
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import payloadRoutes from './routes/payloads.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const io = initializeSocket(server);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://whats-app-frontend-two.vercel.app','https://whatsapp-backend-d1qg.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp Web Clone Server is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payloads', payloadRoutes);

// Webhook endpoint for WhatsApp Business API (for future use)
app.post('/webhook/whatsapp', (req, res) => {
  console.log('Received webhook:', JSON.stringify(req.body, null, 2));

  // Verify webhook (if needed)
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.status(200).json({ success: true });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp Web Clone API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      users: '/api/users',
      messages: '/api/messages',
      payloads: '/api/payloads'
    },
    documentation: 'Check /health for server status'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-clone';

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected successfully');

    // Log database info
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Connected to database: ${dbName}`);

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log('\n⚠️ Received shutdown signal, closing server gracefully...');

  server.close(() => {
    console.log('🔌 HTTP server closed');

    mongoose.connection.close(() => {
      console.log('📊 MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle process signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Start server
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log('\n🚀 Server Status:');
      console.log(`   ✅ Server running on port ${PORT}`);
      console.log(`   🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   📡 Socket.IO enabled`);
      console.log(`   🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`   ❤️  Health Check: http://localhost:${PORT}/health`);
      console.log('\n📋 Available Endpoints:');
      console.log('   POST /api/users/register');
      console.log('   POST /api/users/login');
      console.log('   GET  /api/users/profile');
      console.log('   GET  /api/users/all');
      console.log('   GET  /api/messages/conversations');
      console.log('   POST /api/messages/send');
      console.log('   GET  /api/messages/conversation/:id');
      console.log('   POST /api/payloads/load-payloads');
      console.log('   POST /api/payloads/process-payloads');
      console.log('   GET  /api/payloads/stats');
      console.log('\n🎯 Ready to process messages!');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();
