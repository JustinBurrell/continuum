const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected Successfully!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Connection Error:', error.message);
  }
};

testConnection();
