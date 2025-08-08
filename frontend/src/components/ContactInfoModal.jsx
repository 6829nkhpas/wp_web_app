import React from 'react';
import { X, Phone, MessageCircle, UserX, Trash2, Archive, VolumeX, Volume2, Download, User } from 'lucide-react';
import { format } from 'date-fns';

const ContactInfoModal = ({
  isOpen,
  onClose,
  contact,
  conversation,
  onBlockUser,
  onDeleteChat,
  onArchiveChat,
  onMuteChat,
  onExportChat,
  onStartCall,
}) => {
  if (!isOpen || !contact) return null;

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';

    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Online';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;

    return format(date, 'dd MMM yyyy \'at\' HH:mm');
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleOverlayClick}></div>

      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Contact info</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Profile Section */}
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 bg-whatsapp-green rounded-full flex items-center justify-center">
              {contact.profileImage ? (
                <img
                  src={contact.profileImage}
                  alt={contact.name}
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-white" />
              )}
            </div>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {contact.name || 'Unknown User'}
            </h3>

            <p className="text-gray-600 dark:text-gray-400 mb-1">
              {contact.phoneNumber || contact.wa_id}
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last seen: {formatLastSeen(contact.lastSeen)}
            </p>

            {contact.isOnline && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 mt-2">
                Online
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                onStartCall?.();
                onClose();
              }}
              className="flex flex-col items-center justify-center p-4 bg-whatsapp-green hover:bg-whatsapp-green-dark text-white rounded-lg transition-colors"
            >
              <Phone className="w-6 h-6 mb-2" />
              <span className="text-sm">Call</span>
            </button>

            <button
              onClick={() => {
                // Message is already open, just close modal
                onClose();
              }}
              className="flex flex-col items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <MessageCircle className="w-6 h-6 mb-2" />
              <span className="text-sm">Message</span>
            </button>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">About</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {contact.about || 'No status available'}
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Phone number</h4>
              <p className="text-gray-600 dark:text-gray-400">
                {contact.phoneNumber || contact.wa_id}
              </p>
            </div>
          </div>

          {/* Chat Actions */}
          {conversation && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Chat settings</h4>

              {/* Mute/Unmute */}
              <button
                onClick={() => {
                  onMuteChat?.(conversation.conversationId, !conversation.isMuted);
                  onClose();
                }}
                className="w-full flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {conversation.isMuted ? <Volume2 className="w-5 h-5 mr-3" /> : <VolumeX className="w-5 h-5 mr-3" />}
                <span className="text-gray-700 dark:text-gray-300">
                  {conversation.isMuted ? 'Unmute notifications' : 'Mute notifications'}
                </span>
              </button>

              {/* Archive Chat */}
              <button
                onClick={() => {
                  onArchiveChat?.(conversation.conversationId);
                  onClose();
                }}
                className="w-full flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Archive className="w-5 h-5 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">Archive chat</span>
              </button>
            </div>
          )}

          {/* Danger Zone */}
          {conversation && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
              {/* Delete Chat */}
              <button
                onClick={() => {
                  onDeleteChat?.(conversation.conversationId);
                  onClose();
                }}
                className="w-full flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-5 h-5 mr-3" />
                <span>Delete chat</span>
              </button>

              {/* Block User */}
              <button
                onClick={() => {
                  onBlockUser?.(contact.wa_id || contact._id);
                  onClose();
                }}
                className="w-full flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-red-600 dark:text-red-400"
              >
                <UserX className="w-5 h-5 mr-3" />
                <span>Block {contact.name || 'user'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactInfoModal;
