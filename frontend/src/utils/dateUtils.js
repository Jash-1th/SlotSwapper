export const formatLocalDate = (utcDateString) => {
  if (!utcDateString) return '';
  
  const date = new Date(utcDateString);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
};

/**
 * Formats a date string into a time string (HH:MM AM/PM)
 * @param {string|Date} dateString - The date string or Date object to format
 * @returns {string} Formatted time string (e.g., "02:30 PM")
 */
export const formatTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ''; // Handle invalid dates
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
