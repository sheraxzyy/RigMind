import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import gamesRouter from './routes/games.js';
import compatibilityRouter from './routes/compatibility.js';

dotenv.config();

// Prevent unhandled network or promise rejections from crashing the server
process.on('unhandledRejection', (reason) => {
  console.warn('[RigMind Server] Unhandled Promise Rejection (non-fatal):', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.error('[RigMind Server] Uncaught Exception (recovered):', err?.message || err);
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', gamesRouter);
app.use('/api', compatibilityRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'RigMind PC Gaming Intelligence Backend',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[RigMind Server] Core API server running on http://localhost:${PORT}`);
});

export default app;
