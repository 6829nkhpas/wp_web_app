/**
 * Generate conversation ID between two users
 * This function must match the backend implementation exactly
 */
export const generateConversationId = (phone1, phone2) => {
  const sorted = [phone1, phone2].sort();
  return `${sorted[0]}_${sorted[1]}`;
};

/**
 * Extract other participant's phone number from conversation ID
 */
export const getOtherParticipant = (conversationId, currentUserPhone) => {
  const [phone1, phone2] = conversationId.split('_');
  return phone1 === currentUserPhone ? phone2 : phone1;
};

/**
 * Check if user has access to conversation
 */
export const hasConversationAccess = (conversationId, userPhone) => {
  const [phone1, phone2] = conversationId.split('_');
  return phone1 === userPhone || phone2 === userPhone;
};
