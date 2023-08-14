const express = require("express");
const app = express();
const path = require("path");
const bcryptjs = require("bcryptjs");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const axios = require("axios");

//io configuration
// const io = new Server(server);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const cors = require("cors");

// Require the inventoryService module
const inventoryService = require("./Inventory");
const supplierService = require("./Supplier");
const orderService = require("./Orders");
const companyAccountService = require("./CompanyAccountService");
const companyAdminService = require("./CompanyAdminService");
const inventoryAdminService = require("./InventoryAdminService");
const storageLocationService = require("./StorageLocationService");
const pickingListService = require("./PickingListService");
const superAdminService = require("./SuperAdminService");
const monitoringService = require("./Monitoring");

// Middleware to parse the request body as JSON
app.use(express.json());
app.use(cors());
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "html")));

// Route for serving the HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/html/index.html"));
});

app.get("/employee", (req, res) => {
  res.sendFile(path.join(__dirname, "/html/EmployeeHome.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "/html/Registration.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "/html/AdminHome.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/html/Registration.html");
});

app.get("/companyadmins", (req, res) => {
  res.sendFile(__dirname + "/html/CompanyAdminHome.html");
});

app.get("/inboundmanager", (req, res) => {
  res.sendFile(__dirname + "/html/InboundManager.html");
});

app.get("/inventoryadmin", (req, res) => {
  res.sendFile(__dirname + "/html/InventoryAdmin.html");
});

app.get("/outboundmanager", (req, res) => {
  res.sendFile(__dirname + "/html/OutboundManager.html");
});

app.get("/putawayemployee", (req, res) => {
  res.sendFile(__dirname + "/html/PutAwayEmployee.html");
});

app.get("/node_modules/quagga/dist/quagga.js", (req, res) => {
  res.type("text/javascript");
  res.sendFile(path.join(__dirname, "/node_modules/quagga/dist/quagga.js"));
});

app.get("/socket.io", (req, res) => {
  res.type("text/javascript");
  res.sendFile(__dirname + "/node_modules/socket.io/client-dist/socket.io.js");
});

app.post("/hash", async (req, res) => {
  try {
    const plainPassword = req.body.password;
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(plainPassword, salt);

    res.send({ hashedPassword }); // Send the hashed password as a response
  } catch (err) {
    res.status(500).send("Error occurred during hashing.");
  }
});

// Use the inventoryService module as middleware for '/inventory' route
app.use("/inventory", inventoryService);
app.use("/supplier", supplierService);
app.use("/orders", orderService);
app.use("/companyAccount", companyAccountService);
app.use("/companyAdmin", companyAdminService);
app.use("/inventoryAdmin", inventoryAdminService);
app.use("/storageLocation", storageLocationService);
app.use("/pickingList", pickingListService);
app.use("/superAdmin", superAdminService);
app.use("/monitoring", monitoringService);

io.of("/monitoring-socket").use((socket, next) => {
  // socket.routerIO = monitoringService.io;
  console.log("A user connected");
  // Listen for events from clients
  let response = null;

  socket.on("request_monitoring", async (companyRegistrationNo) => {
    console.log("================== MONITORING TABLE ============================");
    // Simulate sending the monitoring result back to the client
    console.log("Received Registration No", companyRegistrationNo);
    setInterval(async () => {
      const axios_response = await axios.get(`http://localhost:3000/monitoring/monitoring-result/${companyRegistrationNo}`);
      response = axios_response.data;
      console.log("Response: ", response);
      if (response != null) {
        socket.emit("incoming_result", response);
      }
    }, 1000);
  });

  socket.on("request_monitoring_chart", async (companyRegistrationNo) => {
    console.log("================== MONITORING CHART ============================");
    console.log("Received Registration No", companyRegistrationNo);
    const save_monitoring = await axios.get(`http://localhost:3000/monitoring/monitoring-chart/${companyRegistrationNo}`);
    if (save_monitoring.data.status) {
      setInterval(async () => {
        const fetch_monitoring = await axios.get(`http://localhost:3000/monitoring/fetch-monitoring-chart/${companyRegistrationNo}`);
        var monitoring_response = fetch_monitoring.data;
        console.log("Response: ", monitoring_response);

        if (monitoring_response != null) {
          socket.emit("incoming_chart_result", monitoring_response);
        }
      }, 1000);
    }
  });
  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
  next();
});

// Use process.env.PORT to bind to the dynamic port provided by Heroku
const port = process.env.PORT || 3000;

// Start the server
server.listen(port, () => {
  console.log("Server is running on port 3000");
});
