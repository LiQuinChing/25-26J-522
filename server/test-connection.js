/**
 * MongoDB Connection Test
 * Run this to verify MongoDB connection is working
 * 
 * Usage: node test-connection.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB Connection...\n');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://research:1234@cluster0.yxuwo8u.mongodb.net/?appName=Cluster0';

console.log('Connection String: ' + MONGODB_URI.replace(/:[^:]*@/, ':****@'));
console.log('Connecting...\n');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✓ Successfully connected to MongoDB!');
  console.log('✓ Database Ready for use');
  console.log('\nConnection Details:');
  console.log('  - Database: Cluster0');
  console.log('  - Host: cluster0.yxuwo8u.mongodb.net');
  console.log('  - User: research');
  console.log('  - Collections: (will be created when data is saved)');
  console.log('\nYou can now start the backend server:');
  console.log('  npm run dev   (development)');
  console.log('  npm start     (production)');
  
  mongoose.disconnect();
  process.exit(0);
})
.catch((error) => {
  console.error('✗ Connection Failed!');
  console.error('Error:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Check your internet connection');
  console.error('2. Verify MongoDB Atlas credentials');
  console.error('3. Check firewall settings');
  console.error('4. Ensure your IP is whitelisted in MongoDB Atlas');
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('\n✗ Connection timeout - MongoDB Atlas may be unreachable');
  process.exit(1);
}, 10000);
