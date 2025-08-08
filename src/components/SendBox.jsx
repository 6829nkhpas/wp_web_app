import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Mic, X } from 'lucide-react';
import { useDebounce } from '../hooks';
import EmojiPicker from 'emoji-picker-react';

const SendBox = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = "Type a message..."
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Debounce typing indicator
  const debouncedMessage = useDebounce(message, 300);

  // Handle typing indicators
  useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    } else if (!message.trim() && isTyping) {
      setIsTyping(false);
      onTypingStop?.();
    }
  }, [debouncedMessage, message, isTyping, onTypingStart, onTypingStop]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  }, [message]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSendMessage({
      message: trimmedMessage,
      messageType: 'text'
    });

    setMessage('');
    setIsTyping(false);
    onTypingStop?.();

    // Focus back to textarea
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiClick = (emojiData) => {
    const cursor = textareaRef.current?.selectionStart || message.length;
    const newMessage =
      message.slice(0, cursor) +
      emojiData.emoji +
      message.slice(cursor);

    setMessage(newMessage);

    // Focus and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          cursor + emojiData.emoji.length,
          cursor + emojiData.emoji.length
        );
      }
    }, 0);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // For demo purposes, just show a message
    // In a real app, you'd upload the file and get a URL
    onSendMessage({
      message: `📎 File shared: ${file.name}`,
      messageType: 'document'
    });

    // Reset file input
    e.target.value = '';
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-whatsapp-panel-header border-t border-whatsapp-border-default p-2 sm:p-4">
      <div className="flex items-end space-x-1 sm:space-x-2">
        {/* Emoji Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-whatsapp-text-secondary hover:text-whatsapp-text-primary transition-colors rounded-lg hover:bg-whatsapp-bg-tertiary/50"
            disabled={disabled}
          >
            <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-2 z-50">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme="dark"
                width={280}
                height={350}
                className="sm:!w-[300px] sm:!h-[400px]"
              />
            </div>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="flex-1 flex items-end space-x-1 sm:space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-whatsapp-panel-input text-whatsapp-text-primary rounded-lg border border-whatsapp-border-default focus:outline-none focus:ring-2 focus:ring-whatsapp-green focus:border-transparent placeholder-whatsapp-text-secondary resize-none max-h-[80px] sm:max-h-[100px] custom-scrollbar text-sm sm:text-base"
              rows={1}
            />

            {/* Character counter (optional) */}
            {message.length > 4000 && (
              <div className="absolute -top-5 sm:-top-6 right-0 text-xs text-whatsapp-text-secondary">
                {message.length}/4096
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className={`p-2 sm:p-3 rounded-full transition-all duration-200 flex-shrink-0 ${message.trim() && !disabled
              ? 'bg-whatsapp-green hover:bg-whatsapp-green-dark text-white'
              : 'bg-whatsapp-bg-secondary text-whatsapp-text-secondary cursor-not-allowed'
              }`}
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>
      </div>

      {/* Typing indicator */}
      {isTyping && (
        <div className="mt-1 sm:mt-2 text-xs text-gray-400 ml-12 sm:ml-14">
          Typing...
        </div>
      )}
    </div>
  );
};

export default SendBox;
