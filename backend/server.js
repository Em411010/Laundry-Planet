import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './src/config/database.js';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import serviceRoutes from './src/routes/serviceRoutes.js';
import auditRoutes from './src/routes/auditRoutes.js';
import profileRoutes from './src/routes/profileRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import salesRoutes from './src/routes/salesRoutes.js';
import customerRoutes from './src/routes/customerRoutes.js';
import serviceReportRoutes from './src/routes/serviceReportRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';
import { seedServices } from './src/models/Service.js';
import { seedShippingSettings } from './src/models/Settings.js';
import { setupSocketIO } from './src/socket/socketHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Allow multiple origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://laundry-planet.onrender.com',
  process.env.CLIENT_URL
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5001;

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Socket.IO handlers
setupSocketIO(io);

// Connect to MongoDB and seed services
connectDB().then(() => {
  seedServices();
  seedShippingSettings();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/service-reports', serviceReportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Laundry Planet API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Handle client-side routing - serve index.html for all non-API routes
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  // Serve index.html for all other routes
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server running`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };