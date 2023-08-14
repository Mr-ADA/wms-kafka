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
      topic: "storage-message",
      numPartitions: 1,
      replicationFactor: 1,
    },
  ],
});
//============================= PRODUCER CONFIGURATION =====================================
const producer = kafka.producer({
  transactionTimeout: 30000,
});
producer.connect();

const storageCounterSchema = new mongoose.Schema({
  _id: String,
  sequence_value: { type: Number, default: 0 },
});
const storageCounter = mongoose.model("storageCounter", storageCounterSchema);

const storageSchema = new mongoose.Schema({
  storageId: { type: Number, unique: true },
  productName: String,
  supplierName: String,
  productCategory: String,
  productWeight: Number,
  productQuantity: Number,
  productSku: String,
  productLocation: String,
  companyInventoryAdminID: String,
  companyInventoryAdmin: String,
  companyRegistrationNo: String,
  companyName: String,
});

storageSchema.pre("save", function (next) {
  const storageLocation = this;
  storageCounter
    .findByIdAndUpdate({ _id: "storageId" }, { $inc: { sequence_value: 1 } }, { new: true, upsert: true })
    .then((counter) => {
      storageLocation.storageId = counter.sequence_value;
      next();
    })
    .catch((error) => {
      console.error("Failed to generate Storage ID:", error);
      next(error);
    });
});

storageSchema.set("autoIndex", false);
storageSchema.index({ userId: 1 }, { unique: true, sparse: true });
const storageLocation = mongoose.model("storageLocation", storageSchema, "storageLocation");
router.use(express.json());

router.post("/storage-location-available", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

router.get("/:registrationNo", (req, res) => {
  const registrationNo = req.params.registrationNo;
  //send monitoring message here
  var storage_message = {
    companyRegistrationNo: registrationNo,
    session_id: req.sessionID,
    service_name: "Storage",
    timestamp: Date.now(),
  };

  //send a message after entering the page
  producer.send({
    topic: "storage-message",
    messages: [{ key: "storage", value: JSON.stringify(storage_message) }],
    timeout: 30000,
  });

  storageLocation.find({ companyRegistrationNo: registrationNo }, (err, storageLocationList) => {
    if (err) {
      console.error("Failed to fetch Storage data:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    res.json(storageLocationList);
  });
});

router.post("/", (req, res) => {
  const { productName, productSku, companyRegistrationNo, productLocation, productQuantity, productWeight } = req.body;

  // Calculate the total product weight for all existing entries with the same productLocation and companyRegistrationNo
  storageLocation
    .aggregate([
      {
        $match: {
          productLocation,
          companyRegistrationNo,
        },
      },
      {
        $group: {
          _id: null,
          totalWeight: { $sum: "$productWeight" },
        },
      },
    ])
    .then((result) => {
      const totalWeight = result.length > 0 ? result[0].totalWeight : 0;
      // Check if adding the current product's weight would exceed 500
      if (totalWeight + productWeight > 500) {
        return res.status(400).json({ error: "Total product weight exceeds 500. Cannot insert or update." });
      }

      // Continue with insert or update operation
      storageLocation.findOne({ productName, productSku, companyRegistrationNo, productLocation }, (err, existingStorage) => {
        if (err) {
          console.error("Failed to find existing inventory:", err);
          res.status(500).send("Internal Server Error");
          return;
        }

        if (existingStorage) {
          // If an existing storage location is found, update the productQuantity
          existingStorage.productQuantity += productQuantity;
          existingStorage.save((err, updateStorage) => {
            if (err) {
              console.error("Failed to update storage:", err);
              res.status(500).send("Internal Server Error");
              return;
            }
            res.json(updateStorage);
          });
        } else {
          // If no existing storage location is found, create a new storage record
          const newStorage = new storageLocation(req.body);
          newStorage.save((err, storage) => {
            if (err) {
              console.error("Failed to insert storage location:", err);
              res.status(500).send("Internal Server Error");
              return;
            }
            res.json(storage);
          });
        }
      });
    })
    .catch((error) => {
      console.error("Failed to calculate total product weight:", error);
      res.status(500).send("Internal Server Error");
    });
});

//Get location and corresponding total weights
router.get("/locationWeights/:companyRegistrationNo", (req, res) => {
  const registrationNo = req.params.companyRegistrationNo;
  storageLocation
    .aggregate([
      {
        $match: { companyRegistrationNo: registrationNo },
      },
      {
        $group: {
          _id: { $trim: { input: "$productLocation" } },
          totalWeight: { $sum: "$productWeight" },
        },
      },
    ])
    .then((locationWeights) => {
      const locationWeightMap = new Map();
      locationWeights.forEach((location) => {
        locationWeightMap.set(location._id, location.totalWeight);
      });
      const locationWeightObj = Object.fromEntries(locationWeightMap);
      res.json(locationWeightObj);
    })
    .catch((error) => {
      console.error("Failed to calculate total product weight for locations:", error);
      res.status(500).send("Internal Server Error");
    });
});

router.get("/productDetails/:productLocation/:companyRegistrationNo", (req, res) => {
  const { productLocation, companyRegistrationNo } = req.params;
  console.log("Received productLocation:", productLocation);
  console.log("Received companyRegistrationNo:", companyRegistrationNo);

  storageLocation
    .aggregate([
      { $match: { productLocation, companyRegistrationNo } },
      {
        $group: {
          _id: "$productLocation",
          products: {
            $push: {
              productName: "$productName",
              productSku: "$productSku",
              productWeight: "$productWeight",
              productQuantity: "$productQuantity",
            },
          },
        },
      },
    ])
    .then((productDetails) => {
      console.log("Query Result:", productDetails);
      res.json(productDetails);
    })
    .catch((error) => {
      console.error("Failed to fetch product details:", error);
      res.status(500).send("Internal Server Error");
    });
});

//Route to update productQuantity based on productSku and productLocation
router.post("/updateProductQuantity", async (req, res) => {
  try {
    const updateDataArray = req.body;

    // Loop through the array and update productQuantity for each item
    for (const updateData of updateDataArray) {
      const { productSku, productLocation, pickingQuantity, productWeight } = updateData;

      // Update the productQuantity by subtracting the pickingQuantity
      await storageLocation.updateMany({ productSku: productSku, productLocation: productLocation }, { $inc: { productQuantity: -pickingQuantity, productWeight: -productWeight } });
    }

    res.json({ message: "Product quantities updated successfully" });
  } catch (error) {
    console.error("Error updating product quantities:", error);
    res.status(500).json({ error: "Failed to update product quantities" });
  }
});

module.exports = router;
