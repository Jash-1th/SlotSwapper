
import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { FiBell, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const Notification = () => {
  const { notifications, clearNotifications, markAsRead } = useWebSocket();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'swapRequest':
        return <FiBell className="text-blue-500" />;
      case 'swapAccepted':
        return <FiCheck className="text-green-500" />;
      case 'swapRejected':
        return <FiAlertCircle className="text-red-500" />;
      default:
        return <FiBell />;
    }
  };

  if (!notifications.length) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <FiBell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const unreadIds = notifications
                    .filter(n => !n.read)
                    .map(n => n.id);
                  unreadIds.forEach(id => markAsRead(id));
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearNotifications();
                }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear all
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {[...notifications]
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map((notification) => (
                    <li
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                          {getIcon(notification.type)}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.message}
                            </p>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.timestamp), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;