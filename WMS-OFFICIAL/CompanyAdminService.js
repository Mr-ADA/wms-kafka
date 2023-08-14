const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');
const connectToDatabase = require('./database');
connectToDatabase();

const companyAdminCounterSchema = new mongoose.Schema({
  _id: String,
  sequence_value: { type: Number, default: 1000 }
});
const companyAdminCounter = mongoose.model('companyAdminCounter', companyAdminCounterSchema);
const companyAdminSchema = new mongoose.Schema({
  employeeId: { type: Number, unique: true },
  employeeName: String,
  employeeEmail: String,
  employeePhoneNo: String,
  employeeAddress: String,
  employeePassword: String,
  employeeDOB: String,
  employeeRole: String,
  companySize: String,
  companyRegistrationNo: String,
  companyName: String,
  companyAddress: String
});

companyAdminSchema.pre('save', function (next) {
  const companyAdmin = this;
  companyAdminCounter.findByIdAndUpdate(
    { _id: 'employeeId' },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  )
    .then((counter) => {
      companyAdmin.employeeId = counter.sequence_value;
      next();
    })
    .catch((error) => {
      console.error('Failed to generate Employee ID:', error);
      next(error);
    });
});

companyAdminSchema.set('autoIndex', false);
companyAdminSchema.index({ userId: 1 }, { unique: true, sparse: true });
const companiesAdmin = mongoose.model('companiesAdmin', companyAdminSchema, 'companiesAdmin');
router.use(express.json());

router.get('/', (req, res) => {
  companiesAdmin.find({}, (err, companyAdminList) => {
    if (err) {
      console.error('Failed to fetch employee data:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.json(companyAdminList);
  });
});

// Insert a new employee
router.post('/', (req, res) => {
  const newEmployee = new companiesAdmin(req.body);
  newEmployee.save((err, employee) => {
    if (err) {
      console.error('Failed to insert Employee:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.json(employee);
  });
});


// Update an employee
router.put('/:employeeId', (req, res) => {
  const employeeID = req.params.employeeId;
  const updatedData = req.body;

  companiesAdmin.findOneAndUpdate(
    { employeeId: employeeID },
    updatedData,
    { new: true },
    (err, updatedAccount) => {
      if (err) {
        console.error('Failed to update account:', err);
        res.status(500).send('Internal Server Error');
        return;
      }

      if (!updatedAccount) {
        console.log('Account not found:', employeeID);
        res.status(404).json({ message: 'Employee not found' });
        return;
      }

      console.log('Account updated:', updatedAccount);
      res.json({ message: 'Account updated successfully', employee: updatedAccount });
    }
  );
});

// Delete an employee
router.delete('/:employeeId', (req, res) => {
  const employeeID = req.params.employeeId;

  companiesAdmin.findOneAndDelete({ employeeId: employeeID }, (err, deletedAccount) => {
    if (err) {
      console.error('Failed to delete account:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    if (!deletedAccount) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.json({ message: 'Account deleted successfully', employee: deletedAccount });
  });
});


// Login route
router.post('/login', (req, res) => {
  const { employeeEmail, employeePassword } = req.body;

  // Find the employee by their email
  companiesAdmin.findOne({ employeeEmail }, async (err, employee) => {
    if (err) {
      console.error('Failed to find employee:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    if (!employee) {
      res.status(404).json({ message: 'Invalid username or password' });
      return;
    }

    try {
      // Compare the user-provided password with the stored hashed password
      const isMatch = await bcryptjs.compare(employeePassword, employee.employeePassword);

      if (isMatch) {
        // Passwords match, login successful
        res.json({ message: 'Login successful', employee });
      } else {
        // Passwords do not match, login failed
        res.status(401).json({ message: 'Invalid username or password' });
      }
    } catch (error) {
      console.error('Error occurred during password comparison:', error);
      res.status(500).send('Internal Server Error');
    }
  });
});

// Retrieve a employee by registration number
router.get('/:employeeId', (req, res) => {
  const employeeID = req.params.employeeId;
  companiesAdmin.findOne({ employeeId: employeeID }, (err, employee) => {
    if (err) {
      console.error('Failed to fetch employee data:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.json(employee);
  });
});
module.exports = router;
