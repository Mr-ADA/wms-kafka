//============================= DEVELOPMENT ENVIRONMENT =========================================
const { Kafka } = require("kafkajs");
const express = require("express");
const path = require("path");
const router = express.Router();
const mongoose = require("mongoose");
const axios = require("axios");

router.io = require("socket.io")();

//=========================== MONITORING FUNCTIONALITY =========================================

router.use(express.static(path.join(__dirname, "public")));
router.use(express.static(path.join(__dirname, "html")));

//============================== KAFKA ENVIRONMENT =========================================
const kafka = new Kafka({
  brokers: ["kafka_service:9092"],
  retry: {
    initialRetryTime: 100,
    retries: 8,
    restartOnFailure: (err) => {
      console.log(err);
      return true;
    },
  },
});

//============================= ADMIN CONFIGURATION =====================================
const admin = kafka.admin();
admin.connect();
console.log("Connected to Kafka cluster");

//============================= PRODUCER CONFIGURATION =====================================
const producer = kafka.producer({
  transactionTimeout: 30000,
});
producer.connect();

//============================= CONSUMER ADMIN SERVICE CONFIGURATION =====================================
const consumer = kafka.consumer({
  groupId: "monitoring-group",
  allowAutoTopicCreation: true,
});
consumer.connect();

//consuming topics
consumer.subscribe({ topic: "account-message", fromBeginning: false });
consumer.subscribe({ topic: "inventory-admin-message", fromBeginning: false });
consumer.subscribe({ topic: "inventory-message", fromBeginning: false });
consumer.subscribe({ topic: "picking-list-message", fromBeginning: false });
consumer.subscribe({ topic: "storage-message", fromBeginning: false });

//================== MONGODB ENVIRONMENT ================================================
const servicesRunning = async () => {
  mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", function () {
    console.log("MongoDB is connected");
  });
};

servicesRunning();

//=========================== REQUEST SCHEMA DEFINITION =========================================
const Schema = mongoose.Schema;

const requestSchema = new Schema({
  company_registration_no: {
    type: String,
    required: true,
  },
  session_id: {
    type: String,
    required: true,
  },
  service_name: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
    required: true,
  },
  request_duration: {
    type: Number,
    required: true,
  },
  request_status: {
    type: Boolean,
    required: true,
  },
  expireAt: {
    type: Date,
    //expires in 60 second (change according to usage)
    expires: 60,
  },
});

requestSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const Request = mongoose.model("Request", requestSchema);

//=========================== PROCESSED REQUEST SCHEMA DEFINITION =========================================

const ProcessedRequestSchema = new Schema({
  service_name: {
    type: String,
    required: true,
  },
  request_num: {
    type: Number,
    required: true,
  },
  timestamps: {
    type: String,
    required: true,
  },
  company_registration_no: {
    type: String,
    required: true,
  },
});

const ProcessedRequest = mongoose.model("ProcessedRequest", ProcessedRequestSchema);

Request.createCollection()
  .then((collection) => {
    console.log("========================= COLLECTION IS CREATED! ====================================");
  })
  .catch((err) => {
    console.log("==================== ERROR ON COLLECTION CREATION ===============================");
    console.log(err);
  });

//defining incoming_messages to save incoming messages
let incoming_messages = [];

// List microservices and its endpoints for health checking
const microserviceUrls = {
  "Company Account": "http://localhost:3000/companyAccount/account-service-available",
  "Inventory Admin": "http://localhost:3000/inventoryAdmin/inventory-admin-available",
  Inventory: "http://localhost:3000/inventory/inventory-available",
  "Picking Service": "http://localhost:3000/pickingList/picking-list-available",
  Storage: "http://localhost:3000/storageLocation/storage-location-available",
};
async function checkMicroservicesHealth(microserviceUrls) {
  const serviceAvailability = {};
  for (const [serviceName, serviceUrl] of Object.entries(microserviceUrls)) {
    try {
      const response = await axios.post(`${serviceUrl}`);
      if (response.status === 200) {
        console.log(`${serviceName} is available.`);
        serviceAvailability[serviceName] = true;
      } else {
        console.log(`${serviceName} is unavailable.`);
        serviceAvailability[serviceName] = false;
      }
    } catch (error) {
      console.log(`${serviceName} is unavailable. Error: ${error.message}`);
    }
  }
  return serviceAvailability;
}

async function receiveMessage() {
  //============================= CONSUMER ADMIN SERVICE CONFIGURATION =====================================

  const topicExists = true;
  try {
    if (topicExists) {
      consumer.run({
        eachMessage: ({ topic, partition, message }) => {
          var oneMessage = JSON.parse(message.value);
          console.log("TOPIC: " + topic);
          console.log("====================== MESSAGE VALUE ===============================");
          console.log(oneMessage);

          incoming_messages.push(oneMessage);

          saveMessage();
        },
      });
    } else {
      console.log("==================== TOPIC DOES NOT EXIST ===============================");
    }
  } catch (err) {
    //log error if exists => for debugging purpose
    console.log(err);
    console.log("==================== ERROR ON RECEIVING MESSAGE ===============================");
  }
}

async function saveMessage() {
  for (const message of incoming_messages) {
    //iterate through each message and keep the metadata
    //retrieve company_registration from message from FE
    const request = new Request({
      company_registration_no: message.companyRegistrationNo,
      session_id: message.session_id,
      service_name: message.service_name,
      time: Date.now(),
      request_duration: Date.now() - message.timestamp,
      request_status: true,
    });

    try {
      //check the existence of the document
      const documentExists = await checkDocumentAvailability(request);
      console.log("Document exists:", documentExists);

      if (!documentExists) {
        await request.save();
        console.log("Request saved successfully");
      } else {
        console.log("Request already exists in the database");
      }
    } catch (error) {
      console.log("Error checking document availability:", error);
    }
  }
}

//check kafka availability by using provided admin library
const check_availability = async () => {
  try {
    const topicMetadata = await admin.fetchTopicMetadata();
    console.log("Check available topics:");
    console.log(
      "Available topics:",
      topicMetadata.topics.map((topic) => topic.name)
    );
  } catch (error) {
    console.error("Error connecting to Kafka cluster:", error);
  }
};

async function checkDocumentAvailability(value) {
  //checking the existence of the current incoming request by its session ID
  try {
    //message is available
    const message = await Request.find({ session_id: value.session_id }).exec();
    return message.length > 0;
  } catch (err) {
    //message is not available
    console.log("error checking document availability:", error);
    return false;
  }
}

//aggregate result of the MongoDB document
async function processMonitoring(registrationId) {
  try {
    var monitoring_result = await Request.aggregate([
      {
        $match: {
          company_registration_no: registrationId,
        },
      },
      {
        //_id:-1 => sort the result backwards
        $sort: { _id: -1 },
      },
      // Group by "service_name" and get the required data
      {
        $group: {
          _id: "$service_name",
          total_request: { $count: {} },
          avgDuration: { $avg: "$request_duration" },
          // Use $first to get the latest inserted "request_status"
          latest_request_status: { $first: "$request_status" },
          company_registration_no: { $first: "$company_registration_no" },
        },
      },
    ]).exec();
    return monitoring_result;
  } catch (err) {
    console.log(err);
    console.log("==================== ERROR ON PROCESS MONITORING ===============================");
  }
}

async function saveProcessedMonitoring(registrationId) {
  const monitoring_result = await processMonitoring(registrationId);
  monitoring_result.forEach((data) => {
    const processed_request = new ProcessedRequest({
      service_name: data._id,
      request_num: data.total_request,
      timestamps: new Date().toLocaleTimeString(),
      company_registration_no: registrationId,
    });
    processed_request.save();
  });
}

async function fetchProcessedMonitoring(registrationId) {
  try {
    var result = await ProcessedRequest.find({ company_registration_no: registrationId });
    return result;
  } catch (err) {
    console.log("Error fetching processed monitoring: ", err);
    return [];
  }
}

receiveMessage();
check_availability();
console.log("===================== THIS IS MONITORING.JS =======================");

router.get("/monitoring-result/:registrationId", async (req, res) => {
  try {
    const companyRegistrationId = req.params.registrationId;
    var service_availability = await checkMicroservicesHealth(microserviceUrls);
    var monitoring_result = await processMonitoring(companyRegistrationId);
    monitoring_result.forEach((message) => {
      try {
        message.latest_request_status = service_availability[message._id];
        console.log("==================== PROCESS MONITORING ===============================");
        console.log(message);
      } catch (err) {
        console.log(err);
      }
    });

    res.json(monitoring_result);
  } catch (err) {
    console.log("Error on router monitoring result: ", err);
  }
});

router.get("/fetch-monitoring-chart/:registrationId", async (req, res) => {
  try {
    const companyRegistrationId = req.params.registrationId;
    var processedMonitoringResult = await fetchProcessedMonitoring(companyRegistrationId);
    res.json(processedMonitoringResult);
  } catch (err) {
    console.log("Error occured on monitoring-chart, ", err);
  }
});
router.get("/monitoring-chart/:registrationId", async (req, res) => {
  try {
    const companyRegistrationId = req.params.registrationId;
    saveProcessedMonitoring(companyRegistrationId);
    res.json({ status: true });
  } catch (err) {
    console.log("Error occured on monitoring-chart, ", err);
    res.json({ status: false });
  }
});
module.exports = router;
