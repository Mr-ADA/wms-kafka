const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const connectToDatabase = require('./database');
const mongoose = require('mongoose');
connectToDatabase();

const adminCounterSchema = new mongoose.Schema({
    _id: String,
    sequence_value: { type: Number, default: 1000 }
});

const adminCounter = mongoose.model('adminCounter', adminCounterSchema);
const adminSchema = new mongoose.Schema({
    adminId: { type: Number, unique: true },
    adminName: String,
    adminEmail: String,
    adminPhoneNumber: Number,
    password: String,
});

adminSchema.pre('save', function (next) {
    const admin = this;
    adminCounter.findByIdAndUpdate(
        { _id: 'adminId' },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
    )
        .then((counter) => {
            admin.adminId = counter.sequence_value;
            next();
        })
        .catch((error) => {
            console.error('Failed to generate admin ID:', error);
            next(error);
        });
});

adminSchema.set('autoIndex', false);
adminSchema.index({ userId: 1 }, { unique: true, sparse: true });
const admins = mongoose.model('superAdmins', adminSchema, 'superAdmins');
router.use(express.json());

//Fetch super admin data
router.get('/', (req, res) => {
    admins.find({}, (err, adminsList) => {
        if (err) {
            console.error('Failed to fetch admin data:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.json(adminsList);
    });
});

//Insert super admin
router.post('/', (req, res) => {
    const newAdminData = req.body; 

    const newAdmin = new admins(newAdminData);

    newAdmin.save()
        .then(savedAdmin => {
            console.log('New admin inserted:', savedAdmin);
            res.status(201).json(savedAdmin); 
        })
        .catch(error => {
            console.error('Failed to insert admin:', error);
            res.status(500).send('Internal Server Error');
        });
});

// Login route
router.post('/login', async (req, res) => {
    try {
      const { adminEmail, password } = req.body;
      const admin = await admins.findOne({ adminEmail });
  
      if (!admin) {
        return res.status(404).json({ message: 'Invalid username or password' });
      }
  
      const isMatch = await bcryptjs.compare(password, admin.password);
  
      if (isMatch) {
        res.json({ message: 'Login successful', admin });
      } else {
        res.status(401).json({ message: 'Invalid username or password' });
      }
    } catch (err) {
      console.error('Error occurred during login:', err);
      res.status(500).send('Internal Server Error');
    }
  });
  
module.exports = router;
