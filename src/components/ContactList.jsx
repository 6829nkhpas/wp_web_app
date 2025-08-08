import React, { useState, useEffect } from 'react';
import { X, Search, User, Phone, MessageCircle, UserMinus, Loader } from 'lucide-react';
import { authAPI } from '../services/api';
import { generateConversationId } from '../utils/conversation';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ContactList = ({ isOpen, onClose, onStartChat }) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load all contacts
  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getAllUsers({ limit: 100 });
      setContacts(response.users || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phoneNumber?.includes(searchTerm)
  );

  const handleStartChat = (contact) => {
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

    onStartChat(conversation);
    onClose();
    toast.success(`Started chat with ${contact.name}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a3942] rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <h2 className="text-white text-lg font-semibold">All Contacts</h2>
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
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#111b21] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-whatsapp-green focus:border-transparent placeholder-gray-400"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="w-6 h-6 text-whatsapp-green animate-spin mr-2" />
              <span className="text-gray-400">Loading contacts...</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <User className="w-12 h-12 text-gray-500 mb-4" />
              <p className="text-gray-400 font-medium mb-2">
                {searchTerm ? 'No contacts found' : 'No contacts yet'}
              </p>
              <p className="text-gray-500 text-sm">
                {searchTerm ? 'Try a different search term' : 'Add some contacts to get started'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-600">
              {filteredContacts.map((contact) => (
                <div
                  key={contact._id}
                  className="flex items-center p-4 hover:bg-[#111b21] transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative mr-3">
                    <div className="w-12 h-12 bg-whatsapp-green rounded-full flex items-center justify-center">
                      {contact.profileImage ? (
                        <img
                          src={contact.profileImage}
                          alt={contact.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-medium text-lg">
                          {contact.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    {contact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2a3942]"></div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{contact.name}</h3>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Phone className="w-3 h-3 mr-1" />
                      <span>+{contact.phoneNumber}</span>
                    </div>
                    {contact.isOnline ? (
                      <span className="text-green-400 text-xs">Online</span>
                    ) : (
                      <span className="text-gray-500 text-xs">
                        Last seen {new Date(contact.lastSeen).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStartChat(contact)}
                      className="p-2 bg-whatsapp-green text-white rounded-lg hover:bg-whatsapp-green-dark transition-colors"
                      title="Start Chat"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-600 bg-[#111b21]">
          <p className="text-gray-500 text-xs text-center">
            {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactList;
