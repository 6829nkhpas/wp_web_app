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
    <form className="bg-whatsapp-panel-header border-t border-whatsapp-border-default p-2 sm:p-4 flex items-end space-x-1 sm:space-x-2 relative" onSubmit={handleSubmit}>
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-14 left-0 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
        </div>
      )}

      {/* Attachment Button */}
      <button
        type="button"
        className="p-2 rounded-full hover:bg-whatsapp-bg-tertiary transition-colors"
        onClick={triggerFileUpload}
        tabIndex={-1}
        aria-label="Attach file"
      >
        <Paperclip className="w-5 h-5 text-whatsapp-text-secondary" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        tabIndex={-1}
        multiple
        onChange={handleFileUpload}
      />

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        className="chat-input custom-scrollbar bg-transparent text-whatsapp-text-primary placeholder-whatsapp-text-secondary resize-none focus:ring-2 focus:ring-whatsapp-green max-h-[100px] text-base flex-1"
        placeholder={placeholder}
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        rows={1}
        disabled={disabled}
        aria-label="Type a message"
      />

      {/* Emoji Button */}
      <button
        type="button"
        className="p-2 rounded-full hover:bg-whatsapp-bg-tertiary transition-colors"
        onClick={() => setShowEmojiPicker(val => !val)}
        tabIndex={-1}
        aria-label="Emoji picker"
      >
        <Smile className="w-5 h-5 text-whatsapp-text-secondary" />
      </button>

      {/* Send Button */}
      <button
        type="submit"
        className="p-2 rounded-full bg-whatsapp-green hover:bg-whatsapp-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        disabled={disabled || !message.trim()}
        aria-label="Send message"
      >
        <Send className="w-5 h-5 text-white" />
      </button>

      {/* Typing indicator */}
      {isTyping && (
        <div className="absolute left-14 bottom-14 mt-1 sm:mt-2 text-xs text-gray-400 ml-12 sm:ml-14">
          Typing...
        </div>
      )}
    </form>
  );
};

export default SendBox;
