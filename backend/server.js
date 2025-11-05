const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { logger, requestLogger } = require('./src/middleware/logger');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Trust proxy (required for rate limiter and accurate IP detection)
app.set('trust proxy', 1);

// Request logging middleware (before other middleware)
app.use(requestLogger);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (with proper trust proxy configuration)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
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
const customerRoutes = require('./src/routes/customers');
const supplierRoutes = require('./src/routes/suppliers');
const purchaseOrderRoutes = require('./src/routes/purchaseOrders');
const supplierPriceRoutes = require('./src/routes/supplierPrices');
const chatRoutes = require('./src/routes/chat');
const reportRoutes = require('./src/routes/reports');
const adminRoutes = require('./src/routes/admin');
const fineTuningRoutes = require('./src/routes/fineTuning');
const importRoutes = require('./src/routes/import');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/supplier-prices', supplierPriceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/fine-tuning', fineTuningRoutes);
app.use('/api/import', importRoutes);

// Error handling middleware
const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

// WebSocket handlers
const WebSocketHandlers = require('./src/websocket/handlers');
const wsHandlers = new WebSocketHandlers(io);

// WebSocket connection
io.on('connection', (socket) => {
  wsHandlers.initializeHandlers(socket);
});

// Initialize Redis
const { connectRedis } = require('./src/config/redis');
connectRedis()
  .then(() => logger.info('Redis connected successfully'))
  .catch(err => {
    logger.error('Redis connection error:', err);
    console.error('Redis connection error:', err);
  });

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };

