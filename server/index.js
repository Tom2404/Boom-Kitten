// Express + Socket.io server bootstrap and route registration.
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/room');
const userRoutes = require('./routes/user');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
const missionRoutes = require('./routes/mission');
const adminSavedViewRoutes = require('./routes/adminSavedViews');
const adminTournamentRoutes = require('./routes/adminTournaments');
const tournamentRoutes = require('./routes/tournaments');
const liveOpsRoutes = require('./routes/liveOps');
const reportRoutes = require('./routes/reports');
const adminModerationRoutes = require('./routes/adminModeration');
const leaderboardRoutes = require('./routes/leaderboard');
const errorHandler = require('./middleware/errorHandler');
const requestContext = require('./middleware/requestContext');
const securityHeaders = require('./middleware/securityHeaders');
const registerGameSocket = require('./sockets/gameSocket');
const { startAnnouncementScheduler } = require('./services/admin/announcementService');

dotenv.config();

// Automatically close server when parent process dies (e.g. terminal closes on Windows/POSIX)
const ppid = process.ppid;
if (ppid && ppid !== 1) {
  const checkParent = setInterval(() => {
    try {
      process.kill(ppid, 0);
    } catch (e) {
      clearInterval(checkParent);
      process.exit(0);
    }
  }, 2000);
  checkParent.unref();
}

// Handle SIGHUP when the terminal window is closed
process.on('SIGHUP', () => {
  process.exit(0);
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

app.set('io', io);
app.disable('x-powered-by');

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(securityHeaders);
app.use(express.json({ limit: '100kb' }));
app.use(requestContext);

const assetRoutes = require('./routes/assets');
const { STORAGE_ROOT } = require('./services/admin/storageProvider');

app.use('/uploads', express.static(STORAGE_ROOT));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/admin/assets', assetRoutes);
app.use('/api/admin/moderation', adminModerationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/saved-views', adminSavedViewRoutes);
app.use('/api/admin/tournaments', adminTournamentRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/live-ops', liveOpsRoutes);
app.use('/api/missions', missionRoutes);
app.use(errorHandler);

registerGameSocket(io);

const PORT = Number(process.env.PORT ?? 5000);
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  if (!MONGO_URI) throw new Error('Missing MONGO_URI in environment');
  await mongoose.connect(MONGO_URI);
  // HTTP listen failures are emitted asynchronously, so bridge them into start().
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, () => {
      server.off('error', reject);
      resolve();
    });
  });
  startAnnouncementScheduler({ io });
  process.stdout.write(`Server listening on http://localhost:${PORT}\n`);
}

start().catch((error) => {
  const message = error.code === 'EADDRINUSE'
    ? `Port ${PORT} is already in use. Stop the existing server process or set a different PORT.`
    : error.message;
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
