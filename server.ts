import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { eventRoutes } from './src/routes/event.routes.ts';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const PORT = 5173;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/events', eventRoutes);

  // WebSocket Logic
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-event', (eventId) => {
      socket.join(`event:${eventId}`);
      console.log(`User ${socket.id} joined event room: ${eventId}`);
    });

    socket.on('send-message', (data) => {
      // data: { eventId, userId, userName, text, timestamp }
      io.to(`event:${data.eventId}`).emit('new-message', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Vite middleware for development
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`QueSale Server running at http://localhost:${PORT}`);
    console.log(`Mode: ${isProd ? 'production' : 'development'}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
