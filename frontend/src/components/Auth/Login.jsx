import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFormValidation } from '../../hooks';
import { MessageCircle, Phone, Loader, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  // Form validation rules
  const validationRules = {
    phoneNumber: {
      required: 'Phone number is required',
      pattern: /^\+?\d{10,15}$/,
      patternMessage: 'Please enter a valid phone number (10-15 digits)',
    },
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
  } = useFormValidation({
    phoneNumber: '',
  }, validationRules);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      toast.error('Please enter a valid phone number');
      return;
    }

    try {
      await login(values);
      navigate('/chat');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^\d+]/g, '');
    if (value && !value.startsWith('+')) {
      value = '+' + value;
    }
    handleChange('phoneNumber', value);
  };

  // Demo account suggestions
  const demoAccounts = [
    { name: 'Ravi Kumar', phone: '+919937320320' },
    { name: 'Neha Joshi', phone: '+929967673820' },
  ];

  const handleDemoLogin = (phone) => {
    handleChange('phoneNumber', phone);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-whatsapp-teal via-whatsapp-green-dark to-whatsapp-green flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <MessageCircle className="w-8 h-8 text-whatsapp-green" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-whatsapp-green-light">Sign in to continue chatting</p>
        </div>

        {/* Demo Accounts */}
        <div className="glass-effect rounded-2xl p-6 mb-6 shadow-xl">
          <h3 className="text-white font-semibold mb-3 text-center">Quick Demo Login</h3>
          <div className="space-y-2">
            {demoAccounts.map((account, index) => (
              <button
                key={index}
                onClick={() => handleDemoLogin(account.phone)}
                className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-all duration-200 flex items-center justify-between"
                disabled={loading}
              >
                <span>{account.name}</span>
                <span className="text-whatsapp-green-light">{account.phone}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-300 text-center mt-3">
            Click to use demo account credentials
          </p>
        </div>

        {/* Form */}
        <div className="glass-effect rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number Field */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-white mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="tel"
                  id="phoneNumber"
                  value={values.phoneNumber}
                  onChange={handlePhoneChange}
                  onBlur={() => handleBlur('phoneNumber')}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-whatsapp-green transition-all ${errors.phoneNumber && touched.phoneNumber ? 'border-red-400 focus:ring-red-400' : 'border-white/20'
                    }`}
                  placeholder="+1234567890"
                  disabled={loading}
                />
              </div>
              {errors.phoneNumber && touched.phoneNumber && (
                <p className="mt-1 text-sm text-red-300">{errors.phoneNumber}</p>
              )}
              <p className="mt-1 text-xs text-gray-300">
                Enter your registered phone number with country code
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !values.phoneNumber}
              className="w-full bg-whatsapp-green hover:bg-whatsapp-green-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-whatsapp-green focus:ring-offset-2 focus:ring-offset-transparent flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin w-5 h-5 mr-2" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-whatsapp-green hover:text-whatsapp-green-light font-medium transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>

          {/* Forgot Password */}
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-gray-400 hover:text-whatsapp-green transition-colors"
              onClick={() => toast.info('Contact support for account recovery')}
            >
              Need help accessing your account?
            </button>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 p-4 bg-white/10 rounded-lg">
          <p className="text-sm text-white text-center">
            <span className="font-semibold">🔒 Security:</span> We use phone number-based authentication similar to WhatsApp.
          </p>
        </div>

        {/* Demo Info */}
        <div className="mt-4 p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
          <p className="text-sm text-blue-100 text-center">
            <span className="font-semibold">📱 Demo Mode:</span> Use the demo accounts above or create a new account to test all features.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
