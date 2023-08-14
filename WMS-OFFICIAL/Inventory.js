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
      topic: "inventory-message",
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

//======================== SESSION SETUP =====================================
const inventoryCounterSchema = new mongoose.Schema({
  _id: String,
  sequence_value: { type: Number, default: 0 },
});
const inventoryCounter = mongoose.model("inventoryCounter", inventoryCounterSchema);

const inventorySchema = new mongoose.Schema({
  productId: { type: Number, unique: true },
  productName: String,
  supplierName: String,
  supplierAddress: String,
  productCategory: String,
  productPrice: Number,
  productWeight: Number,
  productQuantity: Number,
  productOrderDate: String,
  productOrderStatus: String,
  productSku: String,
  productReorderPoint: Number,
  productLocation: String,
  companyInboundManagerID: String,
  companyInboundManager: String,
  companyRegistrationNo: String,
  companyName: String,
});

inventorySchema.pre("save", function (next) {
  const inventory = this;
  inventoryCounter
    .findByIdAndUpdate({ _id: "productId" }, { $inc: { sequence_value: 1 } }, { new: true, upsert: true })
    .then((counter) => {
      inventory.productId = counter.sequence_value;
      next();
    })
    .catch((error) => {
      console.error("Failed to generate product ID:", error);
      next(error);
    });
});

inventorySchema.set("autoIndex", false);
inventorySchema.index({ userId: 1 }, { unique: true, sparse: true });
const inventories = mongoose.model("inventories", inventorySchema, "inventories");
router.use(express.json());

//Fetch inventory data by companyRegistrationNo
router.get("/:registrationNo", (req, res) => {
  const registrationNo = req.params.registrationNo;

  var inventory_request = {
    companyRegistrationNo: registrationNo,
    session_id: req.sessionID,
    service_name: "Inventory",
    timestamp: Date.now(),
  };

  console.log("================================ ORDER TOPIC IS CREATED! ======================================");

  //send a message after successful registration
  producer.send({
    topic: "inventory-message",
    messages: [{ key: "inventory", value: JSON.stringify(inventory_request) }],
    timeout: 30000,
  });

  inventories.find({ companyRegistrationNo: registrationNo }, (err, inventoryList) => {
    if (err) {
      console.error("Failed to fetch inventory data:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    res.json(inventoryList);
  });
});

router.post("/inventory-available", (req, res) => {
  res.status(200).json({ status: "healthy" });
});
// Insert a new product
router.post("/", (req, res) => {
  const newInventory = new inventories(req.body);
  newInventory.save((err, inventory) => {
    if (err) {
      console.error("Failed to insert product:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    res.json(inventory);
  });
});

// Update an product
router.put("/:productId", (req, res) => {
  const productID = req.params.productId;
  const updatedData = req.body;

  inventories.findOneAndUpdate({ productId: productID }, updatedData, { new: true }, (err, updatedAccount) => {
    if (err) {
      console.error("Failed to update product:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    if (!updatedAccount) {
      console.log("Product not found:", productID);
      res.status(404).json({ message: "Product not found" });
      return;
    }
    console.log("Product updated:", updatedAccount);
    res.json({ message: "Product updated successfully", inventory: updatedAccount });
  });
});

// Delete an product
router.delete("/:productId", (req, res) => {
  const productID = req.params.productId;

  suppliers.findOneAndDelete({ productId: productID }, (err, deletedAccount) => {
    if (err) {
      console.error("Failed to delete product:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    if (!deletedAccount) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json({ message: "Product deleted successfully", company: deletedAccount });
  });
});

module.exports = router;
