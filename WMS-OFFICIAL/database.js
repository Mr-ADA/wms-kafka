const mongoose = require('mongoose');
// MongoDB Atlas connection URL
const url = 'mongodb+srv://WMS:123@wms.2m5rxyp.mongodb.net/WMS?retryWrites=true&w=majority';
const connectToDatabase = async () => {
  try {
    await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
  }
};

module.exports = connectToDatabase;

console.log("");