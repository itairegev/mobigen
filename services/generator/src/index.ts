import dotenv from 'dotenv';
dotenv.config();

import { httpServer } from './api.js';

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Generator service running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
