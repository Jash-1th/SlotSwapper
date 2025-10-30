
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user?.token) {
      const newSocket = io('http://localhost:5000', {
        query: { token: user.token }
      });

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      newSocket.on('newSwapRequest', (data) => {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'swapRequest',
          message: `New swap request for: ${data.eventTitle}`,
          data,
          read: false,
          timestamp: new Date()
        }]);
      });

      newSocket.on('swapRequestAccepted', (data) => {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'swapAccepted',
          message: `Your swap request has been accepted!`,
          data,
          read: false,
          timestamp: new Date()
        }]);
      });

      newSocket.on('swapRequestRejected', (data) => {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'swapRejected',
          message: `Your swap request was rejected.`,
          data,
          read: false,
          timestamp: new Date()
        }]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user?.token]);

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <WebSocketContext.Provider value={{ 
      socket, 
      notifications, 
      clearNotifications,
      markAsRead
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};