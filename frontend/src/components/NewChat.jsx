import React, { useState, useEffect } from 'react';
import { X, Search, MessageCircle, User, Phone, Loader } from 'lucide-react';
import { authAPI } from '../services/api';
import { generateConversationId } from '../utils/conversation';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NewChat = ({ isOpen, onClose, onStartChat }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Search for users
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await authAPI.getAllUsers({ search: query, limit: 20 });
      setSearchResults(response.users || []);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleStartChat = (chatUser) => {
    // Create a conversation object similar to what the backend would return
    const conversation = {
      conversationId: generateConversationId(user.wa_id, chatUser.wa_id),
      user: {
        _id: chatUser._id,
        name: chatUser.name,
        phoneNumber: chatUser.phoneNumber,
        wa_id: chatUser.wa_id,
        profileImage: chatUser.profileImage,
        isOnline: chatUser.isOnline,
        lastSeen: chatUser.lastSeen
      },
      lastMessage: '',
      lastMessageTime: new Date(),
      unreadCount: 0
    };

    onStartChat(conversation);
    onClose();
    toast.success(`Started chat with ${chatUser.name}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a3942] rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <h2 className="text-white text-lg font-semibold">New Chat</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-600">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts or phone numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#111b21] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-whatsapp-green focus:border-transparent placeholder-gray-400"
              autoFocus
            />
            {searching && (
              <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {!searchTerm.trim() ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-500 mb-4" />
              <p className="text-gray-400 text-lg font-medium mb-2">Start a New Chat</p>
              <p className="text-gray-500 text-sm">
                Search for contacts by name or phone number to start a conversation
              </p>
            </div>
          ) : searching ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="w-6 h-6 text-whatsapp-green animate-spin mr-2" />
              <span className="text-gray-400">Searching...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Search className="w-12 h-12 text-gray-500 mb-4" />
              <p className="text-gray-400 font-medium mb-2">No contacts found</p>
              <p className="text-gray-500 text-sm">
                Try searching with a different name or phone number
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-600">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleStartChat(user)}
                  className="flex items-center p-4 hover:bg-[#111b21] cursor-pointer transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative mr-3">
                    <div className="w-12 h-12 bg-whatsapp-green rounded-full flex items-center justify-center">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-medium text-lg">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    {user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2a3942]"></div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{user.name}</h3>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Phone className="w-3 h-3 mr-1" />
                      <span>+{user.phoneNumber}</span>
                    </div>
                    {user.isOnline ? (
                      <span className="text-green-400 text-xs">Online</span>
                    ) : (
                      <span className="text-gray-500 text-xs">
                        Last seen {new Date(user.lastSeen).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Chat Icon */}
                  <div className="ml-4">
                    <MessageCircle className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-600 bg-[#111b21]">
          <p className="text-gray-500 text-xs text-center">
            💬 Click on a contact to start chatting
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewChat;
