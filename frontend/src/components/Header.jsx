import React, { useState, useRef, useEffect } from 'react';
import { useWindowSize } from '../hooks';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Search,
  User,
  UserX,
  Trash2,
  Archive,
  VolumeX,
  Volume2,
  Info,
  Star,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

const Header = ({
  conversation,
  onBack,
  onCall,
  onVideoCall,
  onSearch,
  onMoreOptions,
  onBlockUser,
  onDeleteChat,
  onMuteChat,
  onArchiveChat,
  onClearChat,
  onExportChat,
  onViewContact,
  typingUsers = []
}) => {
  const { isMobile } = useWindowSize();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return '';

    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Online';
    if (diffInMinutes < 60) return `Last seen ${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `Last seen ${Math.floor(diffInMinutes / 60)}h ago`;

    return `Last seen ${format(date, 'dd/MM/yy')}`;
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);

  const handleMenuAction = (action) => {
    setShowMenu(false);
    switch (action) {
      case 'contact-info':
        onViewContact?.(conversation.user);
        break;
      case 'block':
        onBlockUser?.(conversation.user.wa_id);
        break;
      case 'delete':
        onDeleteChat?.(conversation.conversationId);
        break;
      case 'mute':
        onMuteChat?.(conversation.conversationId, !conversation.isMuted);
        break;
      case 'archive':
        onArchiveChat?.(conversation.conversationId);
        break;
      case 'clear':
        onClearChat?.(conversation.conversationId);
        break;
      case 'export':
        onExportChat?.(conversation.conversationId);
        break;
      default:
        onMoreOptions?.();
    }
  };

  if (!conversation) {
    return (
      <div className="h-14 sm:h-16 bg-whatsapp-panel-header border-b border-whatsapp-border-default flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-base sm:text-lg font-medium text-whatsapp-text-primary">WhatsApp Web Clone</h2>
          <p className="text-xs sm:text-sm text-whatsapp-text-secondary hidden sm:block">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-14 sm:h-16 bg-whatsapp-panel-header border-b border-whatsapp-border-default flex items-center px-2 sm:px-4">
      {/* Back button (mobile) */}
      {isMobile && (
        <button
          onClick={onBack}
          className="mr-2 sm:mr-3 p-1.5 sm:p-2 text-whatsapp-text-secondary hover:text-whatsapp-text-primary hover:bg-whatsapp-bg-tertiary/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* Avatar and Info */}
      <div className="flex items-center flex-1 min-w-0">
        <div className="relative mr-2 sm:mr-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-whatsapp-green rounded-full flex items-center justify-center">
            {conversation.user?.profileImage ? (
              <img
                src={conversation.user.profileImage}
                alt={conversation.user.name}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            )}
          </div>
          {conversation.user?.isOnline && (
            <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-whatsapp-green rounded-full border-2 border-whatsapp-panel-header"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-whatsapp-text-primary font-medium truncate text-sm sm:text-base">
            {conversation.user?.name || 'Unknown User'}
          </h3>
          <div className="text-xs sm:text-sm text-whatsapp-text-secondary">
            {typingUsers.length > 0 ? (
              <div className="flex items-center space-x-1">
                <span>Typing</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-whatsapp-green rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-whatsapp-green rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-whatsapp-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : conversation.user?.isOnline ? (
              'Online'
            ) : (
              <span className="truncate">{formatLastSeen(conversation.user?.lastSeen)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-0.5 sm:space-x-1">

        {/* More Options Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 sm:p-2 text-whatsapp-text-secondary hover:text-whatsapp-text-primary hover:bg-whatsapp-bg-tertiary/50 rounded-lg transition-colors"
            title="More options"
          >
            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" />
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
              >
                {/* Contact Info */}
                <button
                  onClick={() => handleMenuAction('contact-info')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-gray-700 dark:text-gray-300"
                >
                  <Info className="w-4 h-4" />
                  <span>Contact info</span>
                </button>

                <hr className="my-1 border-gray-200 dark:border-gray-600" />

                {/* Mute/Unmute */}
                <button
                  onClick={() => handleMenuAction('mute')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-gray-700 dark:text-gray-300"
                >
                  {conversation.isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>{conversation.isMuted ? 'Unmute notifications' : 'Mute notifications'}</span>
                </button>

                {/* Archive */}
                <button
                  onClick={() => handleMenuAction('archive')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-gray-700 dark:text-gray-300"
                >
                  <Archive className="w-4 h-4" />
                  <span>Archive chat</span>
                </button>

                <hr className="my-1 border-gray-200 dark:border-gray-600" />

                {/* Clear Chat */}
                <button
                  onClick={() => handleMenuAction('clear')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear messages</span>
                </button>

                {/* Delete Chat */}
                <button
                  onClick={() => handleMenuAction('delete')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete chat</span>
                </button>

                {/* Block User */}
                <button
                  onClick={() => handleMenuAction('block')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-red-600 dark:text-red-400"
                >
                  <UserX className="w-4 h-4" />
                  <span>Block {conversation.user?.name || 'user'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
