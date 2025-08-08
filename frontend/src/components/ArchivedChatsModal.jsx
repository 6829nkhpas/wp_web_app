import React, { useState, useEffect } from 'react';
import { X, Archive, MessageCircle, Loader, Search, ArchiveRestore } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { messagesAPI } from '../services/api';
import toast from 'react-hot-toast';

const ArchivedChatsModal = ({
  isOpen,
  onClose,
  onChatSelect,
  onUnarchiveChat
}) => {
  const [archivedChats, setArchivedChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadArchivedChats();
    }
  }, [isOpen]);

  const loadArchivedChats = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getArchivedConversations();
      if (response.success) {
        setArchivedChats(response.conversations || []);
      }
    } catch (error) {
      console.error('Error loading archived chats:', error);
      toast.error('Failed to load archived chats');
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (conversationId) => {
    try {
      const response = await messagesAPI.unarchiveConversation(conversationId);
      if (response.success) {
        toast.success('Chat unarchived');
        // Remove from local list
        setArchivedChats(prev => prev.filter(chat => chat.conversationId !== conversationId));
        // Call parent callback
        onUnarchiveChat?.(conversationId);
      }
    } catch (error) {
      console.error('Error unarchiving chat:', error);
      toast.error('Failed to unarchive chat');
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);

    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'dd/MM/yy');
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  // Filter archived chats based on search term
  const filteredChats = archivedChats.filter(chat =>
    chat.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleOverlayClick}></div>

      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Archive className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Archived chats</h2>
            {archivedChats.length > 0 && (
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                {archivedChats.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search archived chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-whatsapp-green focus:border-transparent placeholder-gray-400"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin text-whatsapp-green mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading archived chats...</p>
              </div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No archived chats found' : 'No archived chats'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                  {searchTerm
                    ? 'Try a different search term'
                    : 'When you archive a chat, it will appear here and be hidden from your main chat list'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredChats.map((chat) => (
                <div
                  key={chat.conversationId}
                  className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  {/* Avatar */}
                  <div
                    className="relative mr-3 cursor-pointer"
                    onClick={() => {
                      onChatSelect?.(chat);
                      onClose();
                    }}
                  >
                    <div className="w-12 h-12 bg-whatsapp-green rounded-full flex items-center justify-center">
                      {chat.user?.profileImage ? (
                        <img
                          src={chat.user.profileImage}
                          alt={chat.user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-medium text-lg">
                          {chat.user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    {chat.user?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-whatsapp-green rounded-full border-2 border-white dark:border-gray-800"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      onChatSelect?.(chat);
                      onClose();
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-gray-900 dark:text-white font-medium truncate">
                        {chat.user?.name || 'Unknown User'}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatMessageTime(chat.lastMessageTime)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-gray-600 dark:text-gray-400 text-sm truncate">
                        {truncateMessage(chat.lastMessage)}
                      </p>

                      {chat.unreadCount > 0 && (
                        <span className="ml-2 bg-whatsapp-green text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center mt-1">
                      <Archive className="w-3 h-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Archived</span>
                    </div>
                  </div>

                  {/* Unarchive button */}
                  <button
                    onClick={() => handleUnarchive(chat.conversationId)}
                    className="ml-3 p-2 text-gray-400 hover:text-whatsapp-green hover:bg-whatsapp-green/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Unarchive chat"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredChats.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Click on a chat to view it, or use the unarchive button to move it back to your main chat list
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedChatsModal;
