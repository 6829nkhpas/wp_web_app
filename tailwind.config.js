/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          // Primary WhatsApp colors
          green: '#00a884',          // WhatsApp's primary green
          'green-dark': '#008069',   // Darker green for hover states
          'green-light': '#d1f4cc', // Light green for message bubbles
          'green-pale': '#e7f3ff',  // Very light green

          // Background colors (matching WhatsApp Web exactly)
          'bg-primary': '#111b21',   // Main dark background
          'bg-secondary': '#202c33', // Secondary dark background
          'bg-tertiary': '#2a3942',  // Tertiary background (sidebar items hover)
          'bg-chat': '#0b141a',      // Chat area background

          // Panel colors
          'panel-header': '#2a3942', // Header background
          'panel-input': '#2a3942',  // Input field background

          // Text colors
          'text-primary': '#e9edef',   // Primary white text
          'text-secondary': '#8696a0', // Secondary gray text
          'text-tertiary': '#667781',  // Tertiary gray text
          'text-green': '#00a884',     // Green accent text

          // Border colors
          'border-default': '#313d45', // Default border color
          'border-light': '#3b4a54',   // Light border

          // Message bubble colors
          'bubble-outgoing': '#005c4b', // Outgoing message bubble
          'bubble-incoming': '#202c33', // Incoming message bubble

          // Status colors
          'blue': '#53bdeb',           // Blue for links and status
          'blue-light': '#e7f3ff',    // Light blue
          'yellow': '#ffeb3b',         // Yellow for warnings
          'red': '#f44336',            // Red for errors

          // Teal variations (WhatsApp's signature color family)
          'teal': '#075e54',
          'teal-dark': '#064e45',
          'teal-light': '#128c7e',
        }
      },
      fontFamily: {
        'whatsapp': ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif']
      },
      screens: {
        'xs': '475px',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-out',
        'typing': 'typing 1.4s infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        bounceSubtle: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        typing: {
          '0%': { opacity: '0.4' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.4' }
        }
      },
      backgroundImage: {
        'whatsapp-pattern': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5ddd5' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        'glassmorphism': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))'
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
