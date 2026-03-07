const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://research:1234@cluster0.yxuwo8u.mongodb.net/ecg_results?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  console.log('📊 Database: ecg_results');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('Please check your MongoDB URI and internet connection');
});

// Import routes
const apiRoutes = require('./routes/api');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ECG Backend API is running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 ECG Backend Server Running`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`\n📝 Available endpoints:`);
  console.log(`   GET    /api/patient/:patientId`);
  console.log(`   POST   /api/patient`);
  console.log(`   POST   /api/result`);
  console.log(`   GET    /api/results/:patientId`);
  console.log(`   GET    /api/results`);
  console.log(`   DELETE /api/result/:resultId`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
});

module.exports = app;
