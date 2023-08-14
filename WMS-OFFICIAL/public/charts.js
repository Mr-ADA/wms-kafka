const socket = io("http://localhost:3000/monitoring-socket"); // Connect to the Socket.io server
companyRegistrationNo = loggedInUser.company.companyRegistrationNo;

socket.on("connect", () => {
  console.log("connected");
  socket.emit("request_monitoring_chart", companyRegistrationNo);
  socket.on("incoming_chart_result", (monitoring_data) => {
    // Update the chart's data and labels
    console.log("============== CHARTS DATA RETRIEVED ===============");
    console.log(monitoring_data);
    const account_canvas = document.getElementById("account-chart").getContext("2d");
    const inventory_canvas = document.getElementById("inventory-chart").getContext("2d");
    const inventory_adm_canvas = document.getElementById("inventory-adm-chart").getContext("2d");
    const storage_canvas = document.getElementById("storage-chart").getContext("2d");
    const picking_canvas = document.getElementById("picking-list-chart").getContext("2d");

    //if this problem takes so long, isolate and fix in different file
    const account_chart = new Chart(account_canvas, {
      type: "line", // Choose your chart type
      data: {
        labels: [], // Initialize with empty labels
        datasets: [
          {
            label: "Account Monitoring",
            data: [],
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
    });
    const inventory_chart = new Chart(inventory_canvas, {
      type: "line", // Choose your chart type
      data: {
        labels: [], // Initialize with empty labels
        datasets: [
          {
            label: "Inventory Monitoring",
            data: [],
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
    });
    const inventory_adm_chart = new Chart(inventory_adm_canvas, {
      type: "line", // Choose your chart type
      data: {
        labels: [], // Initialize with empty labels
        datasets: [
          {
            label: "Inventory Admin Monitoring",
            data: [],
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
    });
    const storage_chart = new Chart(storage_canvas, {
      type: "line", // Choose your chart type
      data: {
        labels: [], // Initialize with empty labels
        datasets: [
          {
            label: "Storage Monitoring",
            data: [],
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
    });
    const picking_chart = new Chart(picking_canvas, {
      type: "line", // Choose your chart type
      data: {
        labels: [], // Initialize with empty labels
        datasets: [
          {
            label: "Picking Monitoring",
            data: [],
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
    });

    monitoring_data.forEach((metrics) => {
      if (metrics.company_registration_no == companyRegistrationNo) {
        if (metrics.service_name == "Company Account") {
          account_chart.data.labels.push(metrics.timestamps); // Update labels with timestamps
          account_chart.data.datasets[0].data.push(metrics.request_num);
        }
        if (metrics.service_name == "Inventory") {
          inventory_chart.data.labels.push(metrics.timestamps); // Update labels with timestamps
          inventory_chart.data.datasets[0].data.push(metrics.request_num);
        }
        if (metrics.service_name == "Inventory Admin") {
          inventory_adm_chart.data.labels.push(metrics.timestamps); // Update labels with timestamps
          inventory_adm_chart.data.datasets[0].data.push(metrics.request_num);
        }
        if (metrics.service_name == "Storage") {
          storage_chart.data.labels.push(metrics.timestamps); // Update labels with timestamps
          storage_chart.data.datasets[0].data.push(metrics.request_num);
        }
        if (metrics.service_name == "Picking Service") {
          picking_chart.data.labels.push(metrics.timestamps); // Update labels with timestamps
          picking_chart.data.datasets[0].data.push(metrics.request_num);
        }
      }
    });

    setInterval(() => {
      account_chart.update();
      inventory_chart.update();
      inventory_adm_chart.update();
      storage_chart.update();
      picking_chart.update();
    }, 1000);
  });
});

// Listen for data updates from the server

// const xValues2 = ["Power Tools", "Hand Tools", "Measurement Instruments", "Welding Equipment", "Cutting Tools"];

// new Chart("myLineChart", {
//     type: "line",
//     data: {
//         labels: xValues2,
//         datasets: [{
//             label: "Inventory Levels",
//             data: [320, 210, 290, 340, 430],
//             borderColor: "#116A7B",
//             fill: false
//         }, {
//             label: "Reorder Points",
//             data: [150, 150, 150, 150, 150],
//             borderColor: "#967E76",
//             fill: false,
//         }]
//     },
//     options: {
//         title: {
//             display: true,
//             text: "Inventory Levels"
//         },
//         legend: { display: true },

//         scales: {
//             yAxes: [{ ticks: { min: 0, max: 500 } }],
//         }
//     }
// });

// var xValues3 = ["Power Tools", "Hand Tools", "Measurement Instruments", "Welding Equipment", "Cutting Tools", "Drill bits", "Milling cutters"];
// var yValues3 = [120, 210, 290, 340, 400, 430, 500];
// var barColors2 = [
//     '#C2DEDC',
//     '#ECE5C7',
//     '#CDC2AE',
//     '#116A7B',
//     '#9BABB8',
//     '#D7C0AE',
//     '#73A9AD'];

// new Chart("myBarChart", {
//     type: "bar",
//     data: {
//         labels: xValues3,
//         datasets: [{
//             backgroundColor: barColors2,
//             borderWidth: 1,
//             data: yValues3
//         }]
//     },
//     options: {
//         legend: { display: false },
//         title: {
//             display: true,
//             text: "Top Selling Products"
//         }
//     }
// });

// var xValues4 = ["New Orders", "Proccessing Orders", "Shipping", "Delivered"];
// var yValues4 = [55, 49, 44, 24];
// var barColors4 = [
//     "#C2DEDC",
//     "#ECE5C7",
//     "#9BABB8",
//     "#116A7B"
// ];

// new Chart("myPieChart", {
//     type: "pie",
//     data: {
//         labels: xValues4,
//         datasets: [{
//             backgroundColor: barColors4,
//             data: yValues4
//         }]
//     },
//     options: {
//         title: {
//             display: true,
//             text: "Distribution of Order Statuses by Volume"
//         }
//     }
// });

// var xValues = ["Power Tools", "Hand Tools", "Measurement Instruments", "Welding Equipment", "Cutting Tools"];
// var yValues = [200, 150, 200, 150, 300];
// var barColors = [
//     "#C2DEDC",
//     "#9BABB8",
//     "#ECE5C7",
//     "#967E76",
//     "#116A7B"
// ];

// new Chart("myDoughnutChart", {
//     type: "doughnut",
//     data: {
//         labels: xValues,
//         datasets: [{
//             backgroundColor: barColors,
//             data: yValues
//         }]
//     },
//     options: {
//         title: {
//             display: true,
//             text: "Distribution of inventory"
//         }
//     }
// });
