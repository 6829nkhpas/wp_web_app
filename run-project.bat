@echo off
echo 🚀 WhatsApp Web Clone - Project Setup and Run Script
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v16 or higher.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Create environment files if they don't exist
echo 📝 Setting up environment files...

REM Backend .env
if not exist "backend\.env" (
    echo Creating backend .env file...
    (
        echo # Server Configuration
        echo PORT=5000
        echo NODE_ENV=development
        echo.
        echo # Database Configuration
        echo MONGODB_URI=mongodb://localhost:27017/whatsapp-clone
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=whatsapp-clone-jwt-secret-key-2024
        echo JWT_EXPIRES_IN=7d
        echo.
        echo # CORS Configuration
        echo CORS_ORIGINS=http://localhost:3000,http://localhost:5173
        echo.
        echo # Email Configuration ^(optional^)
        echo EMAIL_SERVICE=gmail
        echo EMAIL_USER=your-email@gmail.com
        echo EMAIL_PASS=your-app-password
        echo CLIENT_URL=http://localhost:5173
        echo.
        echo # WhatsApp Business API ^(optional^)
        echo WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token
        echo WHATSAPP_DISPLAY_PHONE_NUMBER=+1234567890
    ) > backend\.env
    echo ✅ Backend .env file created
) else (
    echo ✅ Backend .env file already exists
)

REM Frontend .env
if not exist "frontend\.env" (
    echo Creating frontend .env file...
    (
        echo # API Configuration
        echo VITE_API_URL=http://localhost:5000/api
        echo.
        echo # Socket Configuration
        echo VITE_SOCKET_URL=http://localhost:5000
    ) > frontend\.env
    echo ✅ Frontend .env file created
) else (
    echo ✅ Frontend .env file already exists
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
if not exist "node_modules" (
    npm install
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend dependencies already installed
)
cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
if not exist "node_modules" (
    npm install
    echo ✅ Frontend dependencies installed
) else (
    echo ✅ Frontend dependencies already installed
)
cd ..

echo.
echo 🎯 Setup Complete!
echo ==================
echo.
echo ⚠️  IMPORTANT: Make sure MongoDB is running before starting the servers!
echo.
echo To start MongoDB locally:
echo   mongod
echo.
echo Or use MongoDB Atlas ^(cloud^) and update MONGODB_URI in backend\.env
echo.
echo 🚀 To run the application:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   npm run dev
echo.
echo Terminal 2 - Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo 🌐 Access the application:
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:5000/api
echo   Health Check: http://localhost:5000/health
echo.
echo 📚 For more information, see setup.md
pause
