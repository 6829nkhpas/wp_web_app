import React, { useState, useEffect } from 'react';
import { X, Clock, Check, CheckCheck, Eye, User } from 'lucide-react';
import { format } from 'date-fns';
import { messagesAPI } from '../services/api';

const MessageInfoModal = ({ isOpen, onClose, message }) => {
  const [messageInfo, setMessageInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && message) {
      loadMessageInfo();
    }
  }, [isOpen, message]);

  const loadMessageInfo = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getMessageInfo(message.messageId);
      if (response.success) {
        setMessageInfo(response.info);
      }
    } catch (error) {
      console.error('Error loading message info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !message) return null;

  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'MMM dd, yyyy \'at\' HH:mm');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Message info
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white break-words">
                  {message.messageType === 'text'
                    ? message.content?.body
                    : `${message.messageType} message`
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Message Status Timeline */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Sent</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>

                {message.deliveredAt && (
                  <div className="flex items-center space-x-3">
                    <CheckCheck className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Delivered</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(message.deliveredAt)}
                      </p>
                    </div>
                  </div>
                )}

                {message.readAt && (
                  <div className="flex items-center space-x-3">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Read</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(message.readAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              {messageInfo && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Additional details
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Message ID:</span>
                      <span className="font-mono text-xs">{message.messageId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="capitalize">{message.messageType}</span>
                    </div>
                    {message.content?.size && (
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{Math.round(message.content.size / 1024)} KB</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInfoModal;
