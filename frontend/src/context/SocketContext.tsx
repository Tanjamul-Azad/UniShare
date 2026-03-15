import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  recipientId: string;
}

interface SocketContextType {
  socket: Socket | null;
  messages: Message[];
  notifications: Notification[];
  sendMessage: (receiverId: string, content: string) => void;
  sendNotification: (recipientId: string, type: string, title: string, message: string) => void;
  markNotificationRead: (id: string) => void;
  unreadNotificationsCount: number;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if user is logged in
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('init', (data: { messages: Message[], notifications: Notification[] }) => {
      setMessages(data.messages);
      setNotifications(data.notifications);
    });

    newSocket.on('receive_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on('receive_notification', (notif: Notification) => {
      setNotifications((prev) => [...prev, notif]);
    });

    newSocket.on('notification_updated', (updatedNotif: Notification) => {
      setNotifications((prev) => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const sendMessage = (receiverId: string, content: string) => {
    if (socket && user) {
      socket.emit('send_message', {
        senderId: user.id,
        senderName: user.name,
        receiverId,
        content,
      });
    }
  };

  const sendNotification = (recipientId: string, type: string, title: string, message: string) => {
    if (socket) {
      socket.emit('send_notification', {
        recipientId,
        type,
        title,
        message,
      });
    }
  };

  const markNotificationRead = (id: string) => {
    if (socket) {
      socket.emit('mark_notification_read', id);
    }
  };

  // Filter notifications for current user
  const userNotifications = notifications.filter(n => n.recipientId === user?.id);
  const unreadNotificationsCount = userNotifications.filter(n => !n.read).length;

  return (
    <SocketContext.Provider value={{ 
      socket, 
      messages, 
      notifications: userNotifications, 
      sendMessage, 
      sendNotification, 
      markNotificationRead,
      unreadNotificationsCount
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
