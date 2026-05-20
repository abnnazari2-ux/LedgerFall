require('dotenv').config({ path: '../.env' });

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const path = require('path');
const { Server } = require('socket.io');

const { apiLimiter, authLimiter, gameLimiter } = require('./middleware/rateLimit');
const { initRaceSocket } = require('./sockets/raceSocket');
const supabase = require('./config/supabase');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gameRoutes = require('./routes/game');
const leaderboardRoutes = require('./routes/leaderboard');
const raceRoutes = require('./routes/race');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general API rate limiter to all routes
app.use('/api', apiLimiter);

// Mount routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/game', gameLimiter, gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/race', raceRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Initialize Socket.io race handlers
initRaceSocket(io);

// =====================
// node-cron scheduled jobs
// =====================

// Daily at midnight UTC: create next day's daily challenge and clean up old ones
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Running daily challenge setup...');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Check if tomorrow's challenge already exists
    const { data: existing } = await supabase
      .from('daily_challenge')
      .select('id')
      .eq('challenge_date', tomorrowStr)
      .single();

    if (!existing) {
      const world_number = Math.floor(Math.random() * 6) + 1;
      const level_number = Math.floor(Math.random() * 5) + 1;
      const dataset_seed = Math.floor(Math.random() * 1000000);

      await supabase.from('daily_challenge').insert({
        challenge_date: tomorrowStr,
        world_number,
        level_number,
        dataset_seed,
      });

      console.log(`[CRON] Created daily challenge for ${tomorrowStr}: World ${world_number}, Level ${level_number}`);
    }
  } catch (err) {
    console.error('[CRON] Daily challenge creation error:', err);
  }
}, {
  timezone: 'UTC',
});

// Every Monday at midnight UTC: reset weekly XP
cron.schedule('0 0 * * 1', async () => {
  console.log('[CRON] Resetting weekly XP...');
  try {
    const { error } = await supabase
      .from('leaderboard_global')
      .update({ weekly_xp: 0, updated_at: new Date().toISOString() });

    if (error) {
      console.error('[CRON] Weekly XP reset error:', error);
    } else {
      console.log('[CRON] Weekly XP reset complete');
    }
  } catch (err) {
    console.error('[CRON] Weekly XP reset error:', err);
  }
}, {
  timezone: 'UTC',
});

// 1st of every month at midnight UTC: reset monthly XP
cron.schedule('0 0 1 * *', async () => {
  console.log('[CRON] Resetting monthly XP...');
  try {
    const { error } = await supabase
      .from('leaderboard_global')
      .update({ monthly_xp: 0, updated_at: new Date().toISOString() });

    if (error) {
      console.error('[CRON] Monthly XP reset error:', error);
    } else {
      console.log('[CRON] Monthly XP reset complete');
    }
  } catch (err) {
    console.error('[CRON] Monthly XP reset error:', err);
  }
}, {
  timezone: 'UTC',
});

// =====================
// Static file serving (production)
// =====================
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../client/dist');

  app.use(express.static(clientDistPath));

  // Serve client index.html for all non-API routes (SPA routing)
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`LedgerFall server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

module.exports = { app, server, io };
