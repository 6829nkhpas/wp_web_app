# WhatsApp Web Clone - Setup Guide

## Prerequisites

1. **Node.js** (v16 or higher)
2. **MongoDB** (local installation or MongoDB Atlas)
3. **Git**

## Quick Setup

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

#### Backend (.env file in backend directory)

```bash
# Copy the example file
cp env.example .env

# Edit the .env file with your configuration
```

Required environment variables:

- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string for JWT signing
- `PORT`: Server port (default: 5000)

#### Frontend (.env file in frontend directory)

```bash
# Copy the example file
cp env.example .env

# Edit the .env file with your configuration
```

Required environment variables:

- `VITE_API_URL`: Backend API URL (default: http://localhost:5000/api)
- `VITE_SOCKET_URL`: Backend Socket URL (default: http://localhost:5000)

### 3. Database Setup

Make sure MongoDB is running:

```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env with your Atlas connection string
```

### 4. Run the Application

#### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## Features

### Authentication

- User registration and login
- JWT-based authentication
- Protected routes

### Real-time Messaging

- Live chat with Socket.IO
- Typing indicators
- Online/offline status
- Message read receipts

### Chat Features

- Send/receive messages
- Message status (sent, delivered, read)
- File sharing (images, documents, audio, video)
- Message deletion
- Conversation management

### User Management

- Contact list
- User profiles
- Block/unblock users
- Archive conversations

## API Endpoints

### Authentication

- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

### Messages

- `GET /api/messages/conversations` - Get all conversations
- `POST /api/messages/send` - Send message
- `GET /api/messages/conversation/:id` - Get conversation messages

### Payloads (Webhook Processing)

- `POST /api/payloads/load-payloads` - Load webhook payloads
- `POST /api/payloads/process-payloads` - Process payloads
- `GET /api/payloads/stats` - Get processing statistics

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file
   - Verify network connectivity

2. **Port Already in Use**

   - Change PORT in backend .env file
   - Update VITE_API_URL and VITE_SOCKET_URL in frontend .env

3. **CORS Errors**

   - Check CORS_ORIGINS in backend .env
   - Ensure frontend URL is included

4. **JWT Errors**
   - Verify JWT_SECRET is set in backend .env
   - Check token expiration settings

### Development Tips

- Use `npm run dev` for development with auto-reload
- Check browser console for frontend errors
- Monitor backend console for server logs
- Use MongoDB Compass for database inspection

## Production Deployment

1. Set `NODE_ENV=production` in backend .env
2. Use strong JWT_SECRET
3. Configure proper CORS origins
4. Set up MongoDB Atlas or production database
5. Use environment variables for sensitive data
6. Enable HTTPS in production

## Support

For issues and questions:

1. Check the console logs
2. Verify environment configuration
3. Ensure all dependencies are installed
4. Check MongoDB connection
