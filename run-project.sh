#!/bin/bash

echo "🚀 WhatsApp Web Clone - Project Setup and Run Script"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Create environment files if they don't exist
echo "📝 Setting up environment files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    echo "Creating backend .env file..."
    cat > backend/.env << EOF
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/whatsapp-clone

# JWT Configuration
JWT_SECRET=whatsapp-clone-jwt-secret-key-2024
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Email Configuration (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CLIENT_URL=http://localhost:5173

# WhatsApp Business API (optional)
WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token
WHATSAPP_DISPLAY_PHONE_NUMBER=+1234567890
EOF
    echo "✅ Backend .env file created"
else
    echo "✅ Backend .env file already exists"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend .env file..."
    cat > frontend/.env << EOF
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Socket Configuration
VITE_SOCKET_URL=http://localhost:5000
EOF
    echo "✅ Frontend .env file created"
else
    echo "✅ Frontend .env file already exists"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend dependencies already installed"
fi
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi
cd ..

echo ""
echo "🎯 Setup Complete!"
echo "=================="
echo ""
echo "⚠️  IMPORTANT: Make sure MongoDB is running before starting the servers!"
echo ""
echo "To start MongoDB locally:"
echo "  mongod"
echo ""
echo "Or use MongoDB Atlas (cloud) and update MONGODB_URI in backend/.env"
echo ""
echo "🚀 To run the application:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "🌐 Access the application:"
echo "  Frontend: http://localhost:5173"
echo "  Backend API: http://localhost:5000/api"
echo "  Health Check: http://localhost:5000/health"
echo ""
echo "📚 For more information, see setup.md"
