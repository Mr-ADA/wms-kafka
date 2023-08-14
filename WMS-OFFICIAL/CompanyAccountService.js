const express = require("express");
const router = express.Router();
const bcryptjs = require("bcryptjs");
const connectToDatabase = require("./database");
const mongoose = require("mongoose");
const { Kafka } = require("kafkajs");
const session = require("express-session");
connectToDatabase();

//======================== SESSION SETUP =====================================
router.use(
  session({
    secret: "warehouse-management",
    resave: false,
    saveUninitialized: false,
  })
);

//============================== KAFKA ENVIRONMENT =========================================
const kafka = new Kafka({
  brokers: ["kafka_service:9092"],
  retry: {
    initialRetryTime: 100,
    retries: 8,
    restartOnFailure: (err) => {
      console.error(err); // Log the error for debugging purposes
      return true; // Restart the client on failure
    },
  },
});

//============================= ADMIN CONFIGURATION =====================================
const admin = kafka.admin();
admin.connect();

admin.createTopics({
  timeout: 5000,
  topics: [
    {
      topic: "account-message",
      numPartitions: 3,
      replicationFactor: 1,
    },
  ],
});
//============================= PRODUCER CONFIGURATION =====================================
const producer = kafka.producer({
  transactionTimeout: 30000,
});
producer.connect();

const companyCounterSchema = new mongoose.Schema({
  _id: String,
  sequence_value: { type: Number, default: 1000 },
});
const companyCounter = mongoose.model("companyCounter", companyCounterSchema);
const companySchema = new mongoose.Schema({
  companyId: { type: Number, unique: true },
  companyName: String,
  companyRegistrationNo: String,
  companySize: String,
  companyAddress: String,
  companyEmail: String,
  companyPhoneNumber: Number,
  password: String,
  status: String,
});

companySchema.pre("save", function (next) {
  const company = this;
  companyCounter
    .findByIdAndUpdate({ _id: "companyId" }, { $inc: { sequence_value: 1 } }, { new: true, upsert: true })
    .then((counter) => {
      company.companyId = counter.sequence_value;
      next();
    })
    .catch((error) => {
      console.error("Failed to generate company ID:", error);
      next(error);
    });
});

// Replace Index with createIndex
companySchema.set("autoIndex", false);
companySchema.index({ userId: 1 }, { unique: true, sparse: true });
const companies = mongoose.model("companies", companySchema, "companies");
router.use(express.json());

router.get("/", (req, res) => {
  companies.find({}, (err, companyList) => {
    if (err) {
      console.error("Failed to fetch company data:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    res.json(companyList);
  });
});

// Insert a new company
router.post("/", (req, res) => {
  const newCompany = new companies(req.body);

  // Check if the companyRegistrationNo already exists
  companies.findOne({ companyRegistrationNo: newCompany.companyRegistrationNo }, (err, existingCompany) => {
    if (err) {
      console.error("Error while checking companyRegistrationNo:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (existingCompany) {
      // The companyRegistrationNo already exists, return an error response
      res.status(400).send("Company with this registration number already exists.");
      return;
    }

    // The companyRegistrationNo does not exist, proceed with saving the new company
    newCompany.save((err, company) => {
      if (err) {
        console.error("Failed to insert company:", err);
        res.status(500).send("Internal Server Error");
        return;
      }
      res.json(company);
    });
  });
});

// Update an company
router.put("/:companyId", (req, res) => {
  console.log("Incoming request data:", req.body);
  const companyID = req.params.companyId;
  const updatedData = req.body;

  companies.findOneAndUpdate({ companyId: companyID }, updatedData, { new: true }, (err, updatedAccount) => {
    if (err) {
      console.error("Failed to update account:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (!updatedAccount) {
      console.log("Account not found:", companyID);
      res.status(404).json({ message: "Company not found" });
      return;
    }

    console.log("Account updated:", updatedAccount);
    res.json({ message: "Account updated successfully", company: updatedAccount });
  });
});

// Delete an company
router.delete("/:companyId", (req, res) => {
  const companyID = req.params.companyId;

  companies.findOneAndDelete({ companyId: companyID }, (err, deletedAccount) => {
    if (err) {
      console.error("Failed to delete account:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (!deletedAccount) {
      res.status(404).json({ message: "Company not found" });
      return;
    }

    res.json({ message: "Account deleted successfully", company: deletedAccount });
  });
});

router.post("/account-service-available", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Login route
router.post("/login", async (req, res) => {
  //============================ KAFKA PRODUCER =====================================

  try {
    const companyRegistrationNo = req.body.companyRegistrationNo;
    const userProvidedPassword = req.body.password;
    const company = await companies.findOne({ companyRegistrationNo });

    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const storedHashedPassword = company.password;
    const isMatch = await bcryptjs.compare(userProvidedPassword, storedHashedPassword);

    var account_request = {
      companyRegistrationNo: companyRegistrationNo,
      session_id: req.sessionID,
      service_name: "Company Account",
      timestamp: Date.now(),
    };

    if (isMatch) {
      res.json({ message: "Login successful", company: company });
      console.log("================================ TOPIC IS CREATED! ======================================");

      //send a message after successful login
      producer.send({
        topic: "account-message",
        messages: [{ key: "account-request", value: JSON.stringify(account_request) }],
        timeout: 30000,
      });
      console.log("================================ MESSAGE IS SENT! ======================================");
    } else {
      res.status(401).json({ message: "Invalid login credentials." });
    }
  } catch (err) {
    res.status(500).json({ message: "Error occurred during login." });
  }
});

// Retrieve a company by registration number
router.get("/:registrationNo", (req, res) => {
  const registrationNo = req.params.registrationNo;
  companies.findOne({ companyRegistrationNo: registrationNo }, (err, company) => {
    if (err) {
      console.error("Failed to fetch company data:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (!company) {
      res.status(404).json({ message: "Company not found" });
      return;
    }

    res.json(company);
  });
});
module.exports = router;
