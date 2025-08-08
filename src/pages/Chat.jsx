import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { messagesAPI } from '../services/api';
import socketService from '../services/socket';
import { useWindowSize } from '../hooks';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import toast from 'react-hot-toast';
import { Wifi, WifiOff } from 'lucide-react';

const Chat = () => {
  const { user, isAuthenticated } = useAuth();
  const { isMobile } = useWindowSize();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [socketConnected, setSocketConnected] = useState(false);

  // Load conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getConversations();

      if (response.success) {
        setConversations(response.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data and socket connection
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();

      // Connect socket if not already connected
      if (!socketService.isConnected()) {
        socketService.connect();
      }
    }
  }, [isAuthenticated]);

  // Socket event handlers
  useEffect(() => {
    // Connection status
    const handleConnectionStatus = (data) => {
      setSocketConnected(data.connected);
      if (data.connected) {
        // toast.success('🔗 Connected to server');
        console.log('Socket connected:');
      } else {
        // toast.error('❌ Disconnected from server');
        console.log('Socket disconnected:', data.reason);
      }
    };

    const handleConnectionError = (data) => {
      if (data.maxRetriesReached) {
        toast.error('❌ Unable to connect to server. Please refresh the page.');
      }
    };

    // Message notifications
    const handleMessageNotification = (data) => {
      // Only show notification if the conversation is not currently selected
      if (selectedConversation?.conversationId !== data.conversationId) {
        toast((t) => (
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => {
              toast.dismiss(t.id);
              // Find and select the conversation
              const conv = conversations.find(c => c.conversationId === data.conversationId);
              if (conv) {
                setSelectedConversation(conv);
              }
            }}
          >
            <div className="w-10 h-10 bg-whatsapp-green rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {data.from?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="font-medium">{data.from}</p>
              <p className="text-sm text-gray-600">{data.message}</p>
            </div>
          </div>
        ), {
          duration: 4000,
          position: 'top-right',
        });
      }

      // Refresh conversations to update unread count
      loadConversations();
    };

    // New message in current conversation
    const handleNewMessage = (data) => {
      // Refresh conversations to update last message
      loadConversations();
    };

    // User presence updates
    const handleUserPresenceUpdate = (data) => {
      setConversations(prev => prev.map(conv =>
        conv.user?.wa_id === data.wa_id
          ? {
            ...conv,
            user: {
              ...conv.user,
              isOnline: data.isOnline,
              lastSeen: data.lastSeen
            }
          }
          : conv
      ));
    };

    // Subscribe to socket events
    const unsubscribeConnectionStatus = socketService.on('connection_status', handleConnectionStatus);
    const unsubscribeConnectionError = socketService.on('connection_error', handleConnectionError);
    const unsubscribeMessageNotification = socketService.on('message_notification', handleMessageNotification);
    const unsubscribeNewMessage = socketService.on('new_message', handleNewMessage);
    const unsubscribePresenceUpdate = socketService.on('user_presence_update', handleUserPresenceUpdate);

    return () => {
      unsubscribeConnectionStatus();
      unsubscribeConnectionError();
      unsubscribeMessageNotification();
      unsubscribeNewMessage();
      unsubscribePresenceUpdate();
    };
  }, [selectedConversation, conversations]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('🌐 Back online');

      // Reconnect socket if needed
      if (!socketService.isConnected()) {
        socketService.connect();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('📵 You are offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);

    // Mark conversation as read
    socketService.markMessagesRead(conversation.conversationId);

    // Refresh conversations to update unread count
    setTimeout(loadConversations, 500);
  };

  // Handle new conversation creation
  const handleNewConversation = (conversation) => {
    // Add to conversations list if not already present
    setConversations(prev => {
      const existingIndex = prev.findIndex(c => c.conversationId === conversation.conversationId);
      if (existingIndex >= 0) {
        // Update existing conversation
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...conversation };
        return updated;
      } else {
        // Add new conversation at the top
        return [conversation, ...prev];
      }
    });
  };

  // Handle back from chat (mobile)
  const handleBackFromChat = () => {
    setSelectedConversation(null);
  };

  // Update user presence
  useEffect(() => {
    const updatePresence = () => {
      if (socketService.isConnected()) {
        socketService.updatePresence('online');
      }
    };

    // Update presence on page focus
    const handleFocus = () => updatePresence();
    const handleBlur = () => {
      if (socketService.isConnected()) {
        socketService.updatePresence('away');
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Initial presence update
    updatePresence();

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [socketConnected]);

  return (
    <div className="h-screen bg-whatsapp-bg flex flex-col">
      {/* Connection Status Bar */}
      {(!isOnline || !socketConnected) && (
        <div className="bg-yellow-600 text-white px-4 py-2 text-sm flex items-center justify-center space-x-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span>You are offline. Some features may not work.</span>
            </>
          ) : !socketConnected ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting to server...</span>
            </>
          ) : null}
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${isMobile ? 'w-full' : 'w-80'} ${isMobile && selectedConversation ? 'hidden' : 'flex'} flex-col border-r border-gray-700`}>
          <ChatSidebar
            conversations={conversations}
            selectedConversation={selectedConversation}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
            loading={loading}
          />
        </div>

        {/* Chat Window */}
        <div className={`flex-1 ${isMobile && !selectedConversation ? 'hidden' : 'flex'} flex-col`}>
          <ChatWindow
            conversation={selectedConversation}
            onBack={handleBackFromChat}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
