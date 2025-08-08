import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Smartphone, Users, Zap, Shield, Globe } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Real-time Messaging",
      description: "Send and receive messages instantly with WebSocket technology"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile Responsive",
      description: "Works perfectly on desktop, tablet, and mobile devices"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Contact Management",
      description: "Organize and chat with your contacts seamlessly"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Fast & Reliable",
      description: "Built with modern technologies for optimal performance"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure Authentication",
      description: "Phone number-based authentication similar to WhatsApp"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Web-based",
      description: "No installation required - works in any modern browser"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-whatsapp-teal via-whatsapp-green-dark to-whatsapp-green">
      {/* Navigation */}
      <nav className="relative z-10 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 sm:w-6 sm:h-6 text-whatsapp-green" />
            </div>
            <span className="text-white text-base sm:text-xl font-bold truncate">
              <span className="hidden sm:inline">WhatsApp Web Clone</span>
              <span className="sm:hidden">WhatsApp Clone</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated ? (
              <Link
                to="/chat"
                className="bg-white text-whatsapp-green px-3 py-2 sm:px-6 sm:py-2 rounded-full text-sm sm:text-base font-medium hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                <span className="hidden sm:inline">Open Chat</span>
                <span className="sm:hidden">Chat</span>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Link
                  to="/login"
                  className="text-white border border-white px-3 py-2 sm:px-6 sm:py-2 rounded-full text-sm sm:text-base font-medium hover:bg-white hover:text-whatsapp-green transition-colors whitespace-nowrap text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-whatsapp-green px-3 py-2 sm:px-6 sm:py-2 rounded-full text-sm sm:text-base font-medium hover:bg-gray-100 transition-colors whitespace-nowrap text-center"
                >
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 px-4 sm:px-6 pt-12 sm:pt-20 pb-20 sm:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-6 sm:mb-8 leading-tight">
            Chat Like Never Before
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-whatsapp-green-light mb-8 sm:mb-12 leading-relaxed px-2">
            Experience the power of real-time messaging with our WhatsApp Web clone.
            Built with modern web technologies for a seamless chat experience.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 px-4">
            {isAuthenticated ? (
              <Link
                to="/chat"
                className="w-full sm:w-auto bg-white text-whatsapp-green px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg text-center"
              >
                Continue Chatting
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto bg-white text-whatsapp-green px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg text-center"
                >
                  Start Chatting Now
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto text-white border-2 border-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:bg-white hover:text-whatsapp-green transition-all duration-200 text-center"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Demo Notice */}
          <div className="mt-6 sm:mt-8 mx-4 sm:mx-0 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <p className="text-white text-sm sm:text-base">
              <span className="font-semibold">🚀 Demo Version:</span> This is a fully functional WhatsApp Web clone for demonstration purposes Using <span className="font-bold">WebSocket</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for modern messaging
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200"
              >
                <div className="w-16 h-16 bg-whatsapp-green-light rounded-lg flex items-center justify-center text-whatsapp-green mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="relative z-10 bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built with Modern Technology
            </h2>
            <p className="text-xl text-gray-600">
              Leveraging the best tools for optimal performance
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "React.js", desc: "Frontend Framework" },
              { name: "Node.js", desc: "Backend Runtime" },
              { name: "Socket.IO", desc: "Real-time Communication" },
              { name: "MongoDB", desc: "Database" },
              { name: "Tailwind CSS", desc: "Styling" },
              { name: "Vite", desc: "Build Tool" },
              { name: "Express.js", desc: "Web Framework" },
              { name: "JWT", desc: "Authentication" }
            ].map((tech, index) => (
              <div
                key={index}
                className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-gray-900">{tech.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 bg-whatsapp-green py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 sm:mb-6">
            Ready to Start Chatting?
          </h2>
          <p className="text-lg sm:text-xl text-whatsapp-green-light mb-6 sm:mb-8">
            Join thousands of users already enjoying seamless messaging
          </p>

          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 px-4">
              <Link
                to="/register"
                className="w-full sm:w-auto bg-white text-whatsapp-green px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg text-center"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto text-white border-2 border-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:bg-white hover:text-whatsapp-green transition-all duration-200 text-center"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-3 mb-4">
                <div className="w-8 h-8 bg-whatsapp-green rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">WhatsApp Web Clone</span>
              </div>
              <p className="text-gray-400 text-sm sm:text-base">
                A modern, real-time messaging application built for demonstration purposes.
              </p>
            </div>

            <div className="text-center sm:text-left">
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li>Real-time messaging</li>
                <li>Mobile responsive</li>
                <li>Secure authentication</li>
                <li>Contact management</li>
              </ul>
            </div>

            <div className="text-center sm:text-left sm:col-span-2 md:col-span-1">
              <h4 className="font-semibold mb-4">Technology</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li>React.js & Node.js</li>
                <li>Socket.IO for real-time</li>
                <li>MongoDB database</li>
                <li>Tailwind CSS styling</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400 text-sm sm:text-base">
            <p>&copy; 2025 WhatsApp Web Clone. Built for demonstration purposes.</p>
          </div>
        </div>
      </footer>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Home;
