const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'ERP Backend API', version: '2.0', status: 'running' });
});

// API Routes
const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const orderRoutes = require('./src/routes/orders');
const chatRoutes = require('./src/routes/chat');
const reportRoutes = require('./src/routes/reports');
const adminRoutes = require('./src/routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on('message', (data) => {
    console.log('Message received:', data);
    // Handle messages
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };

