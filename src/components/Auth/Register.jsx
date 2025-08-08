import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFormValidation } from '../../hooks';
import { MessageCircle, Phone, User, Mail, Eye, EyeOff, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Form validation rules
  const validationRules = {
    name: {
      required: 'Name is required',
      minLength: 2,
      maxLength: 50,
    },
    phoneNumber: {
      required: 'Phone number is required',
      pattern: /^\+?\d{10,15}$/,
      patternMessage: 'Please enter a valid phone number (10-15 digits)',
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: 'Please enter a valid email address',
    },
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
  } = useFormValidation({
    name: '',
    phoneNumber: '',
    email: '',
  }, validationRules);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      await register(values);
      navigate('/chat');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^\d+]/g, '');
    if (value && !value.startsWith('+')) {
      value = '+' + value;
    }
    handleChange('phoneNumber', value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-whatsapp-teal via-whatsapp-green-dark to-whatsapp-green flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <MessageCircle className="w-8 h-8 text-whatsapp-green" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join WhatsApp Web</h1>
          <p className="text-whatsapp-green-light">Create your account to start chatting</p>
        </div>

        {/* Form */}
        <div className="glass-effect rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="text"
                  id="name"
                  value={values.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-whatsapp-green transition-all ${errors.name && touched.name ? 'border-red-400 focus:ring-red-400' : 'border-white/20'
                    }`}
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>
              {errors.name && touched.name && (
                <p className="mt-1 text-sm text-red-300">{errors.name}</p>
              )}
            </div>

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
                Enter your phone number with country code
              </p>
            </div>

            {/* Email Field (Optional) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address 
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="email"
                  id="email"
                  value={values.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-whatsapp-green transition-all ${errors.email && touched.email ? 'border-red-400 focus:ring-red-400' : 'border-white/20'
                    }`}
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>
              {errors.email && touched.email && (
                <p className="mt-1 text-sm text-red-300">{errors.email}</p>
              )}
              <p className="mt-1 text-xs text-gray-300">
                We'll send you a welcome email with updates
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-whatsapp-green hover:bg-whatsapp-green-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-whatsapp-green focus:ring-offset-2 focus:ring-offset-transparent flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin w-5 h-5 mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-whatsapp-green hover:text-whatsapp-green-light font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>

          {/* Terms */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-whatsapp-green hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-whatsapp-green hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-white/10 rounded-lg">
          <p className="text-sm text-white text-center">
            <span className="font-semibold">Demo Mode:</span> This is a WhatsApp Web clone for demonstration purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
