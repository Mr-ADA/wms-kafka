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
      topic: "inventory-admin-message",
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

const inventoryAdminCounterSchema = new mongoose.Schema({
  _id: String,
  sequence_value: { type: Number, default: 0 },
});
const inventoryAdminCounter = mongoose.model("inventoryAdminCounter", inventoryAdminCounterSchema);

const inventoryAdminSchema = new mongoose.Schema({
  inventoryId: { type: Number, unique: true },
  productName: String,
  supplierName: String,
  productCategory: String,
  productWeight: Number,
  productQuantity: Number,
  productOrderDate: String,
  productSku: String,
  productReorderPoint: Number,
  productLocation: String,
  companyInboundManagerID: String,
  companyInboundManager: String,
  companyRegistrationNo: String,
  companyName: String,
});

inventoryAdminSchema.pre("save", function (next) {
  const inventoryAdmin = this;
  inventoryAdminCounter
    .findByIdAndUpdate({ _id: "inventoryId" }, { $inc: { sequence_value: 1 } }, { new: true, upsert: true })
    .then((counter) => {
      inventoryAdmin.inventoryId = counter.sequence_value;
      next();
    })
    .catch((error) => {
      console.error("Failed to generate Invetory ID:", error);
      next(error);
    });
});

inventoryAdminSchema.set("autoIndex", false);
inventoryAdminSchema.index({ userId: 1 }, { unique: true, sparse: true });
const inventoryAdmin = mongoose.model("inventoryAdmin", inventoryAdminSchema, "inventoryAdmin");
router.use(express.json());

router.get("/:registrationNo", (req, res) => {
  const registrationNo = req.params.registrationNo;
  var inventory_admin_request = {
    companyRegistrationNo: registrationNo,
    session_id: req.sessionID,
    service_name: "Inventory Admin",
    timestamp: Date.now(),
  };

  console.log("================================ INVENTORY ADMIN REQUEST CREATED! ======================================");

  //send a message after successful registration
  producer.send({
    topic: "inventory-admin-message",
    messages: [{ key: "inventory-admin", value: JSON.stringify(inventory_admin_request) }],
    timeout: 30000,
  });

  inventoryAdmin.find({ companyRegistrationNo: registrationNo }, (err, inventoryAdminList) => {
    if (err) {
      console.error("Failed to fetch inventory data:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    res.json(inventoryAdminList);
  });
});

//check availability of the service
router.post("/inventory-admin-available", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

router.post("/", (req, res) => {
  const { productName, supplierName, productCategory, productWeight, productQuantity, companyRegistrationNo, companyName } = req.body;

  // Check for existing inventory record with the same productName and companyRegistrationNo
  inventoryAdmin.findOne({ productName, companyRegistrationNo }, (err, existingInventory) => {
    if (err) {
      console.error("Failed to find existing inventory:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    if (existingInventory) {
      // If an existing inventory is found, update the productQuantity
      existingInventory.productQuantity += productQuantity;
      existingInventory.save((err, updatedInventory) => {
        if (err) {
          console.error("Failed to update inventory:", err);
          res.status(500).send("Internal Server Error");
          return;
        }
        res.json(updatedInventory);
      });
    } else {
      // If no existing inventory is found, create a new inventory record
      const newInventory = new inventoryAdmin({
        productName,
        supplierName,
        productCategory,
        productWeight,
        productQuantity,
        companyRegistrationNo,
        companyName,
      });
      newInventory.save((err, inventory) => {
        if (err) {
          console.error("Failed to insert product:", err);
          res.status(500).send("Internal Server Error");
          return;
        }
        res.json(inventory);
      });
    }
  });
});

router.put("/updateQuantity", (req, res) => {
  const { productSku, companyRegistrationNo, productQuantity } = req.body;

  inventoryAdmin
    .findOneAndUpdate({ productSku: productSku, companyRegistrationNo: companyRegistrationNo }, { $inc: { productQuantity: -productQuantity } }, { new: true })
    .then((updatedInventory) => {
      if (!updatedInventory) {
        // If the row with given productSKU and companyRegistrationNo is not found
        return res.status(404).json({ error: "Row not found." });
      }
      res.json(updatedInventory);
    })
    .catch((error) => {
      console.error("Failed to update product quantity:", error);
      res.status(500).send("Internal Server Error");
    });
});

router.put("/:inventoryId", (req, res) => {
  const inventoryID = req.params.inventoryId;
  const updatedData = req.body;

  inventoryAdmin.findOneAndUpdate({ inventoryId: inventoryID }, updatedData, { new: true }, (err, updatedAccount) => {
    if (err) {
      console.error("Failed to update Inventory:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    if (!updatedAccount) {
      console.log("Inventory not found:", inventoryID);
      res.status(404).json({ message: "Inventory not found" });
      return;
    }
    console.log("Inventory updated:", updatedAccount);
    res.json({ message: "Inventory updated successfully", inventory: updatedAccount });
  });
});
module.exports = router;
