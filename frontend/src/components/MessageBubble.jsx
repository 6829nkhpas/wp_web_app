import React, { useState, useRef, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Check, CheckCheck, Clock, AlertCircle, MoreVertical, Reply, Copy, Trash2, Info, Forward } from 'lucide-react';

const MessageBubble = ({
  message,
  isOwn,
  showAvatar = true,
  isGrouped = false,
  onDeleteMessage,
  onDeleteForEveryone,
  onReplyToMessage,
  onForwardMessage,
  onMessageInfo
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);
  const bubbleRef = useRef(null);
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);

    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd/MM/yy HH:mm');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'read':
        return 'text-blue-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  // Handle right-click context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPosition({
      x: e.clientX,
      y: e.clientY
    });
    setShowContextMenu(true);
  };

  // Handle long press for mobile
  const handleLongPress = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    const rect = bubbleRef.current.getBoundingClientRect();
    setContextMenuPosition({
      x: rect.right - 150,
      y: rect.top - 10
    });
    setShowContextMenu(true);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showContextMenu]);

  const handleCopyMessage = () => {
    if (message.content?.body) {
      navigator.clipboard.writeText(message.content.body);
      setShowContextMenu(false);
    }
  };

  const handleDeleteMessage = () => {
    onDeleteMessage?.(message.messageId);
    setShowContextMenu(false);
  };

  const handleDeleteForEveryone = () => {
    onDeleteForEveryone?.(message.messageId);
    setShowContextMenu(false);
  };

  const handleReply = () => {
    onReplyToMessage?.(message);
    setShowContextMenu(false);
  };

  const handleForward = () => {
    onForwardMessage?.(message);
    setShowContextMenu(false);
  };

  const handleInfo = () => {
    onMessageInfo?.(message);
    setShowContextMenu(false);
  };

  // Check if message can be deleted for everyone (within 7 minutes)
  const canDeleteForEveryone = () => {
    if (!isOwn) return false;
    const messageTime = new Date(message.timestamp);
    const now = new Date();
    const diffInMinutes = (now - messageTime) / (1000 * 60);
    return diffInMinutes <= 7; // WhatsApp allows 7 minutes
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 ${isGrouped ? 'mt-1' : 'mt-4'} px-2 sm:px-0`}>
      <div className={`flex items-end space-x-2 max-w-[85%] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>

        {/* Spacer for grouped messages */}
        {!isOwn && (!showAvatar || isGrouped) && (
          <div className="w-6 sm:w-8"></div>
        )}

        {/* Message Bubble */}
        <div
          ref={bubbleRef}
          onContextMenu={handleContextMenu}
          onTouchStart={(e) => {
            let touchTimeout;
            const touchStartHandler = () => {
              handleLongPress(e);
            };
            touchTimeout = setTimeout(touchStartHandler, 500);

            const cleanup = () => {
              clearTimeout(touchTimeout);
              document.removeEventListener('touchend', cleanup);
              document.removeEventListener('touchmove', cleanup);
            };

            document.addEventListener('touchend', cleanup);
            document.addEventListener('touchmove', cleanup);
          }}
          className={`message-bubble group relative px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl shadow-none cursor-pointer transition-all max-w-[75%] whitespace-pre-line break-words
            ${isOwn
              ? 'bg-whatsapp-bubble-outgoing text-white ml-auto rounded-br-md rounded-tr-xl'
              : 'bg-whatsapp-bubble-incoming text-whatsapp-text-primary mr-auto rounded-bl-md rounded-tl-xl'}
            ${showContextMenu ? 'ring-2 ring-whatsapp-green' : ''}
          `}
        >

          {/* Message content */}
          <div className="break-words">
            {message.messageType === 'text' ? (
              <p className="text-sm sm:text-sm leading-relaxed whitespace-pre-wrap">
                {message.content?.body}
              </p>
            ) : message.messageType === 'deleted' ? (
              <p className="text-sm italic text-gray-400">
                <Trash2 className="w-4 h-4 inline mr-1" />
                {isOwn ? 'You deleted this message' : 'This message was deleted'}
              </p>
            ) : (
              <div className="space-y-2">
                {message.content?.mediaUrl && (
                  <div className="bg-black/20 rounded p-2">
                    <p className="text-xs text-gray-300 mb-1">
                      {message.messageType.toUpperCase()} FILE
                    </p>
                    <a
                      href={message.content.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:text-blue-200 text-xs sm:text-sm underline break-all"
                    >
                      View {message.messageType}
                    </a>
                  </div>
                )}
                {message.content?.caption && (
                  <p className="text-sm leading-relaxed">
                    {message.content.caption}
                  </p>
                )}
                {message.content?.filename && (
                  <p className="text-xs text-gray-300 break-all">
                    📎 {message.content.filename}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Timestamp and status */}
          <div className={`flex items-center justify-end space-x-1 mt-1 ${isOwn ? 'text-gray-200' : 'text-gray-400'}`}>
            <span className="text-xs whitespace-nowrap">
              {formatMessageTime(message.timestamp)}
            </span>
            {isOwn && message.messageType !== 'deleted' && (
              <div className={`${getStatusColor(message.status)} flex-shrink-0`}>
                {getStatusIcon(message.status)}
              </div>
            )}
          </div>

          {/* Reply indicator */}
          {message.replyTo && (
            <div className="mt-2 pt-2 border-t border-white/20">
              <p className="text-xs text-gray-300">
                ↩️ Reply to message
              </p>
            </div>
          )}

          {/* Message bubble tail */}
          <div
            className={`absolute bottom-0 ${isOwn
              ? 'right-0 transform translate-x-1 border-l-6 sm:border-l-8 border-l-green-900 border-t-6 sm:border-t-8 border-t-transparent'
              : 'left-0 transform -translate-x-1 border-r-6 sm:border-r-8 border-r-[#2a3942] border-t-6 sm:border-t-8 border-t-transparent'
              } ${isGrouped ? 'hidden' : ''}`}
          />
        </div>

        {/* Context Menu */}
        {showContextMenu && (
          <>
            <div className="fixed inset-0 z-40" />
            <div
              ref={contextMenuRef}
              className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[150px]"
              style={{
                left: `${Math.min(contextMenuPosition.x, window.innerWidth - 200)}px`,
                top: `${Math.min(contextMenuPosition.y, window.innerHeight - 300)}px`,
              }}
            >
              {/* Copy */}
              {message.messageType === 'text' && message.content?.body && (
                <button
                  onClick={handleCopyMessage}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-gray-700 dark:text-gray-300"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              )}

              {/* Message Info */}
              {isOwn && message.messageType !== 'deleted' && (
                <button
                  onClick={handleInfo}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-gray-700 dark:text-gray-300"
                >
                  <Info className="w-4 h-4" />
                  <span>Info</span>
                </button>
              )}

              <hr className="my-1 border-gray-200 dark:border-gray-600" />

              {/* Delete for me */}
              <button
                onClick={handleDeleteMessage}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete for me</span>
              </button>

              {/* Delete for everyone */}
              {canDeleteForEveryone() && (
                <button
                  onClick={handleDeleteForEveryone}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete for everyone</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
