const express = require("express");
const router = express.Router();
const connectToDatabase = require("./database");
const mongoose = require("mongoose");
connectToDatabase();
const { Kafka } = require("kafkajs");
const session = require("express-session");

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
  },
});

//============================= ADMIN CONFIGURATION =====================================
const admin = kafka.admin();
admin.connect();
admin.createTopics({
  waitForLeaders: true,
  timeout: 5000,
  topics: [
    {
      topic: "picking-list-message",
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

const pickingSchema = new mongoose.Schema({
  pickingId: { type: String, unique: true },
  productName: String,
  productSku: String,
  productCategory: String,
  pickingQuantity: Number,
  productLocation: String,
  companyOutboundAdminID: String,
  companyOutboundAdmin: String,
  companyRegistrationNo: String,
  companyName: String,
  pickingListCreatedDate: String,
  pickingStatus: String,
});

const pickingIdCounterSchema = new mongoose.Schema({
  _id: String,
  last_picking_id: { type: Number, default: 0 },
});

const pickingIdCounter = mongoose.model("pickingIdCounter", pickingIdCounterSchema);
pickingSchema.pre("save", async function (next) {
  const pickingList = this;
  try {
    const counter = await pickingIdCounter.findByIdAndUpdate({ _id: "pickingId" }, { $inc: { last_picking_id: 1 } }, { new: true, upsert: true });

    const formattedCounter = String(counter.last_picking_id).padStart(4, "0");
    pickingList.pickingId = `PK${formattedCounter}`;
    next();
  } catch (error) {
    console.error("Failed to generate Picking ID:", error);
    next(error);
  }
});

pickingSchema.set("autoIndex", false);
pickingSchema.index({ userId: 1 }, { unique: true, sparse: true });
const pickingList = mongoose.model("pickingList", pickingSchema, "pickingList");
router.use(express.json());

router.post("/picking-list-available", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

router.get("/:registrationNo", (req, res) => {
  const registrationNo = req.params.registrationNo;

  var picking_list_request = {
    companyRegistrationNo: registrationNo,
    session_id: req.sessionID,
    service_name: "Picking Service",
    timestamp: Date.now(),
  };

  console.log("================================ INVENTORY ADMIN REQUEST CREATED! ======================================");

  //send a message after successful registration
  producer.send({
    topic: "picking-list-message",
    messages: [{ key: "picking-list", value: JSON.stringify(picking_list_request) }],
    timeout: 30000,
  });

  pickingList.find({ companyRegistrationNo: registrationNo }, (err, pickingServiceList) => {
    if (err) {
      console.error("Failed to fetch Picking data:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    res.json(pickingServiceList);
  });
});
router.post("/picking-list-available", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

router.post("/insertPickingList", async (req, res) => {
  try {
    const pickingListData = req.body;
    const pickingId = await generatePickingId(); // Await the function to get the pickingId
    const pickingListWithPickingId = pickingListData.map((item) => ({ ...item, pickingId }));

    // Insert the picking list data with the same pickingId using insertMany
    await pickingList.insertMany(pickingListWithPickingId);

    res.json({ message: "Picking list data inserted successfully" });
  } catch (error) {
    console.error("Error inserting picking list data:", error);
    res.status(500).json({ error: "Failed to insert picking list data" });
  }
});

async function generatePickingId() {
  try {
    const counter = await pickingIdCounter.findByIdAndUpdate({ _id: "pickingId" }, { $inc: { last_picking_id: 1 } }, { new: true, upsert: true });

    const formattedCounter = String(counter.last_picking_id).padStart(4, "0");
    return `PK${formattedCounter}`;
  } catch (error) {
    console.error("Failed to generate Picking ID:", error);
    throw error;
  }
}

// Update route
router.put("/update", (req, res) => {
  const { companyRegistrationNo, pickingId, productSku, pickingQuantity } = req.body;

  // No need for async keyword here
  pickingList
    .findOneAndUpdate(
      {
        companyRegistrationNo,
        pickingId,
        productSku,
        pickingQuantity,
        pickingStatus: { $ne: "Picked" }, // Make sure it's not already marked as "Picked"
      },
      { pickingStatus: "Picked" },
      { new: true }
    )
    .then((updatedPicking) => {
      if (!updatedPicking) {
        // If no matching row is found or it's already marked as "Picked"
        return res.status(404).json({ error: "Picking not found or already picked." });
      }

      // If successfully updated, you can send the updated picking back as the response
      res.json(updatedPicking);
    })
    .catch((error) => {
      // Handle errors here
      console.error("Error updating picking:", error);
      res.status(500).json({ error: "Internal server error." });
    });
});
module.exports = router;
