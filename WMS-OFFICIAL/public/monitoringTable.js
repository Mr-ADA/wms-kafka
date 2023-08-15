companyRegistrationNo = loggedInUser.company.companyRegistrationNo;

function displayTable(data) {
  //account
  data.forEach((metric) => {
    if (metric.company_registration_no == companyRegistrationNo) {
      //Company Account
      if (metric._id == "Company Account") {
        var serviceNameCell = document.getElementById("admin-table-service");
        var numRequestCell = document.getElementById("admin-table-num-request");
        var avgTimeCell = document.getElementById("admin-table-avg-time");
        var availabilityCell = document.getElementById("admin-table-availability");

        serviceNameCell.innerHTML = metric._id;
        numRequestCell.innerHTML = metric.total_request;
        avgTimeCell.innerHTML = metric.avgDuration + " ms";
        console.log("service availability" + metric.latest_request_status);
        availabilityCell.innerHTML = metric.latest_request_status ? "Available" : "Unavailable";
      }

      if (metric._id == "Inventory") {
        //inventory
        var serviceNameCell = document.getElementById("inventory-table-service");
        var numRequestCell = document.getElementById("inventory-table-num-request");
        var avgTimeCell = document.getElementById("inventory-table-avg-time");
        var availabilityCell = document.getElementById("inventory-table-availability");

        serviceNameCell.innerHTML = metric._id;
        numRequestCell.innerHTML = metric.total_request;
        avgTimeCell.innerHTML = metric.avgDuration + " ms";
        console.log("service availability" + metric.latest_request_status);
        availabilityCell.innerHTML = metric.latest_request_status ? "Available" : "Unavailable";
      }

      if (metric._id == "Inventory Admin") {
        //inventory admin
        var serviceNameCell = document.getElementById("inventory-admin-table-service");
        var numRequestCell = document.getElementById("inventory-admin-table-num-request");
        var avgTimeCell = document.getElementById("inventory-admin-table-avg-time");
        var availabilityCell = document.getElementById("inventory-admin-table-availability");
        serviceNameCell.innerHTML = metric._id;
        numRequestCell.innerHTML = metric.total_request;
        avgTimeCell.innerHTML = metric.avgDuration + " ms";
        console.log("service availability" + metric.latest_request_status);
        availabilityCell.innerHTML = metric.latest_request_status ? "Available" : "Unavailable";
      }

      if (metric._id == "Picking Service") {
        //picking service
        var serviceNameCell = document.getElementById("picking-list-table-service");
        var numRequestCell = document.getElementById("picking-list-table-num-request");
        var avgTimeCell = document.getElementById("picking-list-table-avg-time");
        var availabilityCell = document.getElementById("picking-list-table-availability");
        serviceNameCell.innerHTML = metric._id;
        numRequestCell.innerHTML = metric.total_request;
        avgTimeCell.innerHTML = metric.avgDuration + " ms";
        console.log("service availability" + metric.latest_request_status);
        availabilityCell.innerHTML = metric.latest_request_status ? "Available" : "Unavailable";
      }

      if (metric._id == "Storage") {
        //storage service
        var serviceNameCell = document.getElementById("storage-table-service");
        var numRequestCell = document.getElementById("storage-table-num-request");
        var avgTimeCell = document.getElementById("storage-table-avg-time");
        var availabilityCell = document.getElementById("storage-table-availability");
        serviceNameCell.innerHTML = metric._id;
        numRequestCell.innerHTML = metric.total_request;
        avgTimeCell.innerHTML = metric.avgDuration + " ms";
        console.log("service availability" + metric.latest_request_status);
        availabilityCell.innerHTML = metric.latest_request_status ? "Available" : "Unavailable";
      }
    }
  });
}
function getRealTimeMessage() {
  //connect client socket to server socket through /monitoring-socket endpoint
  const socket = io("http://localhost:3000/monitoring-socket");
  socket.on("connect", () => {
    console.log("connected");
    // Request monitoring result from the server
    console.log("company registration: " + companyRegistrationNo);
    socket.emit("request_monitoring", companyRegistrationNo);
    console.log("================ EMITTING REQUEST_MONITORING =================");
    // Listen for the incoming monitoring result
    socket.on("incoming_result", (data) => {
      console.log("================ INCOMING RESULT =================");
      console.log("Received monitoring result:", data);
      displayTable(data);
    });
    console.log("================ END =================");
  });

  //error handling event listeners
  socket.on("connect_timeout", () => {
    console.error("Connection timeout");
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
}
getRealTimeMessage();
