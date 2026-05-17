/**
 * MongoDB Atlas Database Connection
 * 
 * Secure connection to MongoDB Atlas for storing:
 * - AI generation metadata
 * - Input scripts and prompts
 * - Output video URLs
 * - Voice/style settings
 * - Timestamps and analytics
 */

const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Connect to MongoDB Atlas
 * Uses MONGO_URI from environment variables
 * Mongoose v6+ uses default options (no need for useNewUrlParser/useUnifiedTopology)
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`✅ MongoDB Atlas Connected Successfully`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Atlas Connection Error:');
    console.error('Error Details:', error.message);
    console.warn('⚠️  Server will continue without MongoDB. Some features may be unavailable.');
  }
};

/**
 * Handle MongoDB connection events
 */
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB Atlas');
});

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB Atlas connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;
