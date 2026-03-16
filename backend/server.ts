import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import net from 'net';
import path from 'path';

async function findAvailablePort(startPort: number, maxTries = 20): Promise<number> {
  for (let offset = 0; offset < maxTries; offset++) {
    const candidate = startPort + offset;

    // Probe the port by opening a temporary TCP server.
    const isAvailable = await new Promise<boolean>((resolve) => {
      const tester = net.createServer();
      tester.once('error', () => resolve(false));
      tester.once('listening', () => {
        tester.close(() => resolve(true));
      });
      tester.listen(candidate, '0.0.0.0');
    });

    if (isAvailable) {
      return candidate;
    }
  }

  throw new Error(`No free port found starting from ${startPort}.`);
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const requestedPort = Number(process.env.PORT ?? '3000');
  const PORT = await findAvailablePort(requestedPort);

  // Simple in-memory storage for chat and notifications
  const messages: any[] = [];
  const notifications: any[] = [];

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/messages', (req, res) => {
    res.json(messages);
  });

  app.get('/api/notifications', (req, res) => {
    res.json(notifications);
  });

  // Socket.io logic
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Send existing data
    socket.emit('init', { messages, notifications });

    socket.on('send_message', (msg) => {
      const newMsg = { ...msg, id: Date.now().toString(), timestamp: new Date().toISOString() };
      messages.push(newMsg);
      io.emit('receive_message', newMsg);

      // Also create a notification for the receiver
      const notif = {
        id: Date.now().toString(),
        type: 'message',
        title: 'New Message',
        message: `You have a new message from ${msg.senderName}`,
        read: false,
        timestamp: new Date().toISOString(),
        recipientId: msg.receiverId,
      };
      notifications.push(notif);
      io.emit('receive_notification', notif);
    });

    socket.on('send_notification', (notif) => {
      const newNotif = { ...notif, id: Date.now().toString(), timestamp: new Date().toISOString(), read: false };
      notifications.push(newNotif);
      io.emit('receive_notification', newNotif);
    });

    socket.on('mark_notification_read', (id) => {
      const notif = notifications.find((n) => n.id === id);
      if (notif) {
        notif.read = true;
        io.emit('notification_updated', notif);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: path.join(process.cwd(), 'frontend'),
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
      configFile: path.join(process.cwd(), 'frontend', 'vite.config.ts'),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'frontend', 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    if (PORT !== requestedPort) {
      console.log(`Port ${requestedPort} was busy, using ${PORT} instead.`);
    }
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
