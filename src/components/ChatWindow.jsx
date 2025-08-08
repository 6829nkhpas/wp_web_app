import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { messagesAPI } from '../services/api';
import socketService from '../services/socket';
import { useWindowSize } from '../hooks';
import MessageBubble from './MessageBubble';
import SendBox from './SendBox';
import Header from './Header';
import ConfirmationModal from './ConfirmationModal';
import MessageInfoModal from './MessageInfoModal';
import ContactInfoModal from './ContactInfoModal';
import toast from 'react-hot-toast';
import { MessageCircle, Loader } from 'lucide-react';

const ChatWindow = ({ conversation, onBack }) => {
  const { user } = useAuth();
  const { isMobile } = useWindowSize();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'default',
    title: '',
    message: '',
    onConfirm: () => { }
  });
  const [messageInfoModal, setMessageInfoModal] = useState({
    isOpen: false,
    message: null
  });
  const [contactInfoModal, setContactInfoModal] = useState({
    isOpen: false,
    contact: null
  });

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load messages
  const loadMessages = useCallback(async (pageNum = 1, isInitial = false) => {
    if (!conversation?.conversationId) return;

    try {
      setLoading(isInitial);

      const response = await messagesAPI.getMessages(conversation.conversationId, {
        page: pageNum,
        limit: 50
      });

      if (response.success) {
        if (isInitial) {
          setMessages(response.messages);
          setPage(2);
          setTimeout(scrollToBottom, 100);
        } else {
          // Prepend older messages
          setMessages(prev => [...response.messages, ...prev]);
          setPage(prev => prev + 1);
        }

        setHasMore(response.messages.length === 50);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversation?.conversationId, scrollToBottom]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(() => {
    if (!loading && hasMore) {
      loadMessages(page, false);
    }
  }, [loading, hasMore, page, loadMessages]);

  // Initialize conversation
  useEffect(() => {
    if (conversation?.conversationId) {
      setMessages([]);
      setPage(1);
      setHasMore(true);
      loadMessages(1, true);

      // Join conversation room
      socketService.joinConversation(conversation.conversationId);

      // Mark messages as read
      socketService.markMessagesRead(conversation.conversationId);
    }

    return () => {
      if (conversation?.conversationId) {
        socketService.leaveConversation(conversation.conversationId);
      }
    };
  }, [conversation?.conversationId, loadMessages]);

  // Socket event handlers
  useEffect(() => {
    const handleNewMessage = (data) => {
      if (data.conversationId === conversation?.conversationId) {
        setMessages(prev => [...prev, data.message]);
        setTimeout(scrollToBottom, 100);
      }
    };

    const handleMessageStatusUpdate = (data) => {
      if (conversation?.conversationId) {
        setMessages(prev => prev.map(msg =>
          msg.messageId === data.messageId
            ? { ...msg, status: data.status }
            : msg
        ));
      }
    };

    const handleMessageDeleted = (data) => {
      if (data.conversationId === conversation?.conversationId) {
        setMessages(prev => prev.filter(msg => msg.messageId !== data.messageId));
      }
    };

    const handleUserTyping = (data) => {
      if (data.conversationId === conversation?.conversationId && data.wa_id !== user?.wa_id) {
        setTypingUsers(prev => new Set([...prev, data.wa_id]));

        // Clear typing after 3 seconds
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.wa_id);
            return newSet;
          });
        }, 3000);
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.conversationId === conversation?.conversationId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.wa_id);
          return newSet;
        });
      }
    };

    // Subscribe to socket events
    const unsubscribeNewMessage = socketService.on('new_message', handleNewMessage);
    const unsubscribeStatusUpdate = socketService.on('message_status_update', handleMessageStatusUpdate);
    const unsubscribeDeleted = socketService.on('message_deleted', handleMessageDeleted);
    const unsubscribeTyping = socketService.on('user_typing', handleUserTyping);
    const unsubscribeStopTyping = socketService.on('user_stop_typing', handleUserStopTyping);

    return () => {
      unsubscribeNewMessage();
      unsubscribeStatusUpdate();
      unsubscribeDeleted();
      unsubscribeTyping();
      unsubscribeStopTyping();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [conversation?.conversationId, user?.wa_id, scrollToBottom]);

  // Handle scroll for pagination
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMore && !loading) {
        const scrollHeight = container.scrollHeight;
        loadMoreMessages();

        // Maintain scroll position after loading
        setTimeout(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - scrollHeight;
          }
        }, 100);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, loadMoreMessages]);

  // Send message
  const handleSendMessage = async (messageData) => {
    if (!conversation?.user?.wa_id || sending) return;

    try {
      setSending(true);

      const response = await messagesAPI.sendMessage({
        toNumber: conversation.user.wa_id,
        message: messageData.message,
        messageType: messageData.messageType || 'text'
      });

      if (response.success) {
        // Message will be added via socket event
        // Scroll to bottom
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Typing handlers
  const handleTypingStart = () => {
    if (conversation?.conversationId) {
      socketService.startTyping(conversation.conversationId);
    }
  };

  const handleTypingStop = () => {
    if (conversation?.conversationId) {
      socketService.stopTyping(conversation.conversationId);
    }
  };

  // Header actions
  const handleCall = () => {
    toast.info('Voice calling feature coming soon!');
  };

  const handleVideoCall = () => {
    toast.info('Video calling feature coming soon!');
  };

  const handleSearch = () => {
    toast.info('Search in conversation coming soon!');
  };

  const handleMoreOptions = () => {
    toast.info('More options coming soon!');
  };

  // New message management functions
  const handleDeleteMessage = async (messageId) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Delete message',
      message: 'Are you sure you want to delete this message for you?',
      onConfirm: async () => {
        try {
          const response = await messagesAPI.deleteMessage(messageId, false);
          if (response.success) {
            toast.success('Message deleted');
            // Message will be updated via socket event
          }
        } catch (error) {
          console.error('Error deleting message:', error);
          toast.error(error.message || 'Failed to delete message');
        }
      }
    });
  };

  const handleDeleteForEveryone = async (messageId) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Delete for everyone',
      message: 'Are you sure you want to delete this message for everyone? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const response = await messagesAPI.deleteMessage(messageId, true);
          if (response.success) {
            toast.success('Message deleted for everyone');
            // Message will be updated via socket event
          }
        } catch (error) {
          console.error('Error deleting message for everyone:', error);
          toast.error(error.message || 'Failed to delete message for everyone');
        }
      }
    });
  };

  const handleReplyToMessage = (message) => {
    // TODO: Implement reply functionality
    toast.info('Reply feature coming soon!');
  };

  const handleForwardMessage = (message) => {
    // TODO: Implement forward functionality
    toast.info('Forward feature coming soon!');
  };

  const handleMessageInfo = async (message) => {
    setMessageInfoModal({
      isOpen: true,
      message: message
    });
  };

  // Chat management functions
  const handleBlockUser = async (userId) => {
    setConfirmModal({
      isOpen: true,
      type: 'block',
      title: 'Block contact',
      message: 'Block this contact? They will no longer be able to call you or send you messages.',
      confirmText: 'Block',
      onConfirm: async () => {
        try {
          const response = await messagesAPI.blockUser(userId);
          if (response.success) {
            toast.success('Contact blocked');
            // Navigate back or update UI as needed
            if (onBack) onBack();
          }
        } catch (error) {
          console.error('Error blocking user:', error);
          toast.error(error.message || 'Failed to block user');
        }
      }
    });
  };

  const handleDeleteChat = async (conversationId) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Delete chat',
      message: 'Are you sure you want to delete this entire chat? This action cannot be undone.',
      confirmText: 'Delete Chat',
      onConfirm: async () => {
        try {
          const response = await messagesAPI.deleteConversation(conversationId);
          if (response.success) {
            toast.success('Chat deleted');
            // Navigate back to chat list
            if (onBack) onBack();
          }
        } catch (error) {
          console.error('Error deleting chat:', error);
          toast.error(error.message || 'Failed to delete chat');
        }
      }
    });
  };

  const handleClearChat = async (conversationId) => {
    setConfirmModal({
      isOpen: true,
      type: 'warning',
      title: 'Clear messages',
      message: 'Are you sure you want to clear all messages in this chat? This action cannot be undone.',
      confirmText: 'Clear Messages',
      onConfirm: async () => {
        try {
          const response = await messagesAPI.clearConversation(conversationId);
          if (response.success) {
            toast.success('Chat cleared');
            setMessages([]);
          }
        } catch (error) {
          console.error('Error clearing chat:', error);
          toast.error(error.message || 'Failed to clear chat');
        }
      }
    });
  };

  const handleMuteChat = async (conversationId, mute) => {
    try {
      const response = await messagesAPI.muteConversation(conversationId, mute);
      if (response.success) {
        toast.success(mute ? 'Chat muted' : 'Chat unmuted');
      }
    } catch (error) {
      console.error('Error muting/unmuting chat:', error);
      toast.error(error.message || 'Failed to update chat settings');
    }
  };

  const handleArchiveChat = async (conversationId) => {
    setConfirmModal({
      isOpen: true,
      type: 'default',
      title: 'Archive chat',
      message: 'Are you sure you want to archive this chat? You can find it in archived chats.',
      confirmText: 'Archive',
      onConfirm: async () => {
        try {
          const response = await messagesAPI.archiveConversation(conversationId);
          if (response.success) {
            toast.success('Chat archived');
            if (onBack) onBack();
          }
        } catch (error) {
          console.error('Error archiving chat:', error);
          toast.error(error.message || 'Failed to archive chat');
        }
      }
    });
  };

  const handleExportChat = async (conversationId) => {
    try {
      toast.info('Exporting chat...');
      const response = await messagesAPI.exportConversation(conversationId);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `whatsapp-chat-${conversationId}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Chat exported successfully');
    } catch (error) {
      console.error('Error exporting chat:', error);
      toast.error(error.message || 'Failed to export chat');
    }
  };

  const handleViewContact = (user) => {
    setContactInfoModal({
      isOpen: true,
      contact: user
    });
  };

  // Group consecutive messages from same sender
  const groupMessages = (messages) => {
    const grouped = [];
    let currentGroup = [];
    let lastSender = null;
    let lastTimestamp = null;

    messages.forEach((message, index) => {
      const messageTime = new Date(message.timestamp);
      const timeDiff = lastTimestamp ? messageTime - lastTimestamp : 0;
      const isSameSender = message.fromNumber === lastSender;
      const isWithinTimeWindow = timeDiff < 60000; // 1 minute

      if (isSameSender && isWithinTimeWindow && currentGroup.length > 0) {
        currentGroup.push({ ...message, isGrouped: true });
      } else {
        if (currentGroup.length > 0) {
          grouped.push(...currentGroup);
        }
        currentGroup = [{ ...message, isGrouped: false }];
      }

      lastSender = message.fromNumber;
      lastTimestamp = messageTime;

      if (index === messages.length - 1) {
        grouped.push(...currentGroup);
      }
    });

    return grouped;
  };

  const groupedMessages = groupMessages(messages);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-whatsapp-bg-chat">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-whatsapp-text-primary mb-2">WhatsApp Web Clone</h2>
          <p className="text-whatsapp-text-secondary">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <main className={`flex flex-col h-full bg-whatsapp-bg-chat relative ${isMobile && !conversation ? 'hidden' : ''}`}>
      {/* Header */}
      <Header
        conversation={conversation}
        onBack={onBack}
        onCall={handleCall}
        onVideoCall={handleVideoCall}
        onSearch={handleSearch}
        onMoreOptions={handleMoreOptions}
        onBlockUser={handleBlockUser}
        onDeleteChat={handleDeleteChat}
        onMuteChat={handleMuteChat}
        onArchiveChat={handleArchiveChat}
        onClearChat={handleClearChat}
        onExportChat={handleExportChat}
        onViewContact={handleViewContact}
        typingUsers={Array.from(typingUsers)}
      />

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1 custom-scrollbar"
      >
        {/* Load more indicator */}
        {hasMore && (
          <div className="text-center py-2">
            {loading ? (
              <Loader className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
            ) : (
              <button
                onClick={loadMoreMessages}
                className="text-whatsapp-green hover:text-whatsapp-green-dark text-sm px-4 py-2 rounded-lg hover:bg-whatsapp-bg-secondary/50 transition-colors"
              >
                Load older messages
              </button>
            )}
          </div>
        )}

        {/* Messages */}
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <Loader className="w-8 h-8 animate-spin text-whatsapp-green mx-auto mb-4" />
              <p className="text-gray-400">Loading messages...</p>
            </div>
          </div>
        ) : groupedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No messages yet</p>
              <p className="text-gray-500 text-sm">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          groupedMessages.map((message, index) => {
            const isOwn = message.fromNumber === user?.wa_id;
            const prevMessage = groupedMessages[index - 1];
            const showAvatar = !isOwn && (!prevMessage || prevMessage.fromNumber !== message.fromNumber || !message.isGrouped);

            return (
              <MessageBubble
                key={message.messageId}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                isGrouped={message.isGrouped}
                onDeleteMessage={handleDeleteMessage}
                onDeleteForEveryone={handleDeleteForEveryone}
                onReplyToMessage={handleReplyToMessage}
                onForwardMessage={handleForwardMessage}
                onMessageInfo={handleMessageInfo}
              />
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start px-2 sm:px-0">
            <div className="bg-[#2a3942] text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg rounded-bl-sm max-w-[200px] sm:max-w-xs">
              <div className="flex items-center space-x-1">
                <span className="text-sm">Typing</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Send Box */}
      <SendBox
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        disabled={sending}
        placeholder={sending ? 'Sending...' : 'Type a message...'}
      />

      {/* Modals */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
      />

      <MessageInfoModal
        isOpen={messageInfoModal.isOpen}
        onClose={() => setMessageInfoModal(prev => ({ ...prev, isOpen: false }))}
        message={messageInfoModal.message}
      />

      <ContactInfoModal
        isOpen={contactInfoModal.isOpen}
        onClose={() => setContactInfoModal(prev => ({ ...prev, isOpen: false }))}
        contact={contactInfoModal.contact}
        conversation={conversation}
        onBlockUser={handleBlockUser}
        onDeleteChat={handleDeleteChat}
        onArchiveChat={handleArchiveChat}
        onMuteChat={handleMuteChat}
        onExportChat={handleExportChat}
        onStartCall={handleCall}
        onStartVideoCall={() => { }} // Disabled as per requirement
      />
    </div>
  );
};

export default ChatWindow;
