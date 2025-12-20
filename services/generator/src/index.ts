import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { httpServer } from './api';

const PORT = process.env.GENERATOR_PORT || process.env.PORT || 4000;

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
