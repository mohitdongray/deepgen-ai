/**
 * AI Video Generation Platform - Node.js Express API Gateway
 * 
 * This is the main API Gateway that handles:
 * - Client authentication and authorization
 * - Rate limiting to prevent abuse
 * - Request validation and sanitization
 * - Routing requests to Python AI service
 * - Logging and error handling
 * 
 * WHY NODE.JS FOR GATEWAY?
 * - Excellent for I/O-bound operations (auth, validation, proxying)
 * - Mature middleware ecosystem (express-rate-limit, helmet, cors)
 * - Easy integration with Redis for rate limiting
 * - Better suited for handling many concurrent HTTP connections
 * - Separates concerns: Gateway (Node) vs AI Logic (Python)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Debug: Check if MONGO_URI is loaded
console.log('🔍 Debug - MONGO_URI:', process.env.MONGO_URI);

// Import database connection
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Import middleware and routes
const errorHandler = require('./middleware/errorHandler');
const securityHeaders = require('./middleware/security');
const generateRoute = require('./routes/generateRoute');

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet()); // Security headers
app.use(securityHeaders); // Custom security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads (temporary storage)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', generateRoute);

// Test route to verify server is working
app.get('/test', (req, res) => {
  res.json({ status: "Node working", port: 5000 });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource does not exist'
  });
});

// Global error handler
app.use(errorHandler);

// Start server after MongoDB connection
const startServer = async () => {
  try {
    // Connect to MongoDB Atlas first
    await connectDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 API Gateway running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 MongoDB Atlas: Connected`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
