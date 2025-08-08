import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { messagesAPI } from '../services/api';
import { useWindowSize } from '../hooks/index';
import { generateConversationId } from '../utils/conversation';
import { Search, MoreVertical, MessageCircle, Settings, LogOut, User, UserPlus, Edit, Archive } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';
import AddContact from './AddContact';
import NewChat from './NewChat';
import ContactList from './ContactList';
import ArchivedChatsModal from './ArchivedChatsModal';

const ChatSidebar = ({ selectedConversation, onConversationSelect, conversations, loading, onNewConversation }) => {
  const { user, logout } = useAuth();
  const { isMobile } = useWindowSize();
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showContactList, setShowContactList] = useState(false);
  const [showArchivedChats, setShowArchivedChats] = useState(false);

  const handleContactAdded = (contact, startChat = false) => {
    if (startChat) {
      // Create a new conversation and start chatting
      const conversation = {
        conversationId: generateConversationId(user.wa_id, contact.wa_id),
        user: {
          _id: contact._id,
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          wa_id: contact.wa_id,
          profileImage: contact.profileImage,
          isOnline: contact.isOnline,
          lastSeen: contact.lastSeen
        },
        lastMessage: '',
        lastMessageTime: new Date(),
        unreadCount: 0
      };

      if (onNewConversation) {
        onNewConversation(conversation);
      }
      onConversationSelect(conversation);
    }
  };

  const handleStartNewChat = (conversation) => {
    if (onNewConversation) {
      onNewConversation(conversation);
    }
    onConversationSelect(conversation);
  };

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv =>
    conv.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  return (
    <aside className={`${isMobile && selectedConversation ? 'hidden' : 'flex'} flex-col h-full bg-whatsapp-bg-primary border-r border-whatsapp-border-default w-full max-w-[380px] min-w-[320px] transition-all duration-200`}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-whatsapp-panel-header border-b border-whatsapp-border-default relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center gap-3 group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-whatsapp-green bg-whatsapp-bg-tertiary group-hover:ring-2 group-hover:ring-whatsapp-green transition-all">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt="Profile"
                className="w-10 h-10 object-cover"
              />
            ) : (
              <span className="text-white font-medium text-lg flex items-center justify-center h-full">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <span className="text-whatsapp-text-primary font-semibold text-base hidden sm:block">
            {user?.name || 'Me'}
          </span>
        </button>
        {/* Profile dropdown */}
        {showProfileMenu && (
          <div className="absolute left-0 mt-2 w-48 bg-whatsapp-bg-tertiary rounded-lg shadow-lg border border-whatsapp-border-default z-50 animate-slide-in">
            <button
              className="flex items-center w-full px-4 py-2 text-whatsapp-text-primary hover:bg-whatsapp-green/10 transition-colors rounded-t-lg"
              onClick={() => setShowContactList(true)}
            >
              <User className="w-4 h-4 mr-3" />
              Contacts
            </button>
            <button
              className="flex items-center w-full px-4 py-2 text-whatsapp-text-primary hover:bg-whatsapp-green/10 transition-colors"
              onClick={() => setShowAddContact(true)}
            >
              <UserPlus className="w-4 h-4 mr-3" />
              Add Contact
            </button>
            <button
              className="flex items-center w-full px-4 py-2 text-whatsapp-text-primary hover:bg-whatsapp-green/10 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="p-2 rounded-full hover:bg-whatsapp-bg-tertiary transition-colors"
            aria-label="Options"
          >
            <MoreVertical className="w-6 h-6 text-whatsapp-text-primary" />
          </button>
          {/* Options dropdown */}
          {showOptionsMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-whatsapp-bg-tertiary rounded-lg shadow-lg border border-whatsapp-border-default z-50 animate-slide-in">
              <button
                className="flex items-center w-full px-4 py-2 text-whatsapp-text-primary hover:bg-whatsapp-green/10 transition-colors rounded-t-lg"
                onClick={() => {
                  setShowOptionsMenu(false);
                  setShowNewChat(true);
                }}
              >
                <MessageCircle className="w-4 h-4 mr-3" />
                New Chat
              </button>
              <button
                className="flex items-center w-full px-4 py-2 text-whatsapp-text-primary hover:bg-whatsapp-green/10 transition-colors"
                onClick={() => {
                  setShowOptionsMenu(false);
                  setShowArchivedChats(true);
                }}
              >
                <Archive className="w-4 h-4 mr-3" />
                Archived
              </button>
              <button
                className="flex items-center w-full px-4 py-2 text-whatsapp-text-primary hover:bg-whatsapp-green/10 transition-colors rounded-b-lg"
                onClick={() => setShowOptionsMenu(false)}
              >
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-3 bg-[#111b21]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-whatsapp-panel-input text-whatsapp-text-primary rounded-lg border border-whatsapp-border-default focus:outline-none focus:ring-2 focus:ring-whatsapp-green focus:border-transparent placeholder-whatsapp-text-secondary"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
                <div className="w-12 h-12 bg-whatsapp-bg-tertiary rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-whatsapp-bg-tertiary rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-whatsapp-bg-secondary rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-500 mb-4" />
            <p className="text-gray-400 text-lg font-medium mb-2">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p className="text-gray-500 text-sm mb-6">
              {searchTerm ? 'Try a different search term' : 'Start a new conversation to get started'}
            </p>

            {!searchTerm && (
              <div className="flex flex-col space-y-3 w-full max-w-xs">
                <button
                  onClick={() => setShowNewChat(true)}
                  className="bg-whatsapp-green hover:bg-whatsapp-green-dark text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start New Chat
                </button>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Contact
                </button>
                <button
                  onClick={() => setShowContactList(true)}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <User className="w-4 h-4 mr-2" />
                  View All Contacts
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.conversationId}
                onClick={() => onConversationSelect(conversation)}
                className={`flex items-center p-3 hover:bg-whatsapp-bg-tertiary cursor-pointer transition-colors ${selectedConversation?.conversationId === conversation.conversationId
                  ? 'bg-whatsapp-bg-tertiary'
                  : ''
                  }`}
              >
                {/* Avatar */}
                <div className="relative mr-3">
                  <div className="w-12 h-12 bg-whatsapp-green rounded-full flex items-center justify-center">
                    {conversation.user?.profileImage ? (
                      <img
                        src={conversation.user.profileImage}
                        alt={conversation.user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-medium text-lg">
                        {conversation.user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  {conversation.user?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-whatsapp-green rounded-full border-2 border-whatsapp-bg-primary"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-whatsapp-text-primary font-medium truncate">
                      {conversation.user?.name || 'Unknown User'}
                    </h3>
                    <span className="text-xs text-whatsapp-text-secondary">
                      {formatMessageTime(conversation.lastMessageTime)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-whatsapp-text-secondary text-sm truncate">
                      {truncateMessage(conversation.lastMessage)}
                    </p>

                    {conversation.unreadCount > 0 && (
                      <span className="ml-2 bg-whatsapp-green text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Button for New Chat - Mobile Only */}
      <div className="absolute bottom-20 right-6 z-10 lg:hidden">
        <button
          onClick={() => setShowNewChat(true)}
          className="w-14 h-14 bg-whatsapp-green hover:bg-whatsapp-green-dark rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-105"
          title="Start New Chat"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Footer */}
      <div className="p-3 bg-whatsapp-panel-header border-t border-whatsapp-border-default">
        <p className="text-xs text-whatsapp-text-secondary text-center">
          WhatsApp Web Clone - Demo Version
        </p>
      </div>

      {/* Modals */}
      <AddContact
        isOpen={showAddContact}
        onClose={() => setShowAddContact(false)}
        onContactAdded={handleContactAdded}
      />

      <NewChat
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
        onStartChat={handleStartNewChat}
      />

      <ContactList
        isOpen={showContactList}
        onClose={() => setShowContactList(false)}
        onStartChat={handleStartNewChat}
      />

      <ArchivedChatsModal
        isOpen={showArchivedChats}
        onClose={() => setShowArchivedChats(false)}
        onChatSelect={onConversationSelect}
        onUnarchiveChat={(conversationId) => {
          // Optionally refresh conversations list or handle unarchive
          toast.success('Chat moved back to main list');
        }}
      />
    </div>
  );
};

export default ChatSidebar;
