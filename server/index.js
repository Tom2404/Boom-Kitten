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
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');
const registerGameSocket = require('./sockets/gameSocket');

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

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

registerGameSocket(io);

const PORT = Number(process.env.PORT ?? 5000);
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  if (!MONGO_URI) throw new Error('Missing MONGO_URI in environment');
  await mongoose.connect(MONGO_URI);
  server.listen(PORT, () => {
    // Startup log for local development visibility.
    process.stdout.write(`Server listening on http://localhost:${PORT}\n`);
  });
}

start().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
