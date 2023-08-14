const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
companyName = loggedInUser.employee.companyName;
companyRegistrationNo = loggedInUser.employee.companyRegistrationNo;
companyOutboundAdmin = loggedInUser.employee.employeeName;
companyOutboundAdminID = loggedInUser.employee.employeeId;
document.getElementById('companyName').innerHTML = companyName;

const date = new Date();
let day = date.getDate();
let month = date.getMonth() + 1;
let year = date.getFullYear();
let pickingListCreatedDate = `${day}-${month}-${year}`;

function populatePickingTable(data) {
  const tableBody = document.querySelector("#createPickingListTable tbody");
  tableBody.innerHTML = "";

  data.forEach(item => {
    const row = document.createElement("tr");

    const productNameCell = document.createElement("td");
    productNameCell.textContent = item.productName;
    row.appendChild(productNameCell);

    const productSkuCell = document.createElement("td");
    productSkuCell.textContent = item.productSku;
    row.appendChild(productSkuCell);

    const productCategoryCell = document.createElement("td");
    productCategoryCell.textContent = item.productCategory;
    row.appendChild(productCategoryCell);

    const weightCell = document.createElement("td");
    weightCell.textContent = (item.productWeight) + " KG";
    row.appendChild(weightCell);

    const quantityCell = document.createElement("td");
    quantityCell.textContent = item.productQuantity;
    row.appendChild(quantityCell);

    const valueInput = document.createElement("input");
    valueInput.type = "number";
    valueInput.classList.add("value");
    valueInput.value = "0";
    valueInput.disabled = true; 

    const locationCell = document.createElement("td");
    locationCell.textContent = item.productLocation;
    row.appendChild(locationCell);

    const actionCell = document.createElement("td"); 
    const plusMinusButton = createPlusMinusButton(item.productQuantity); 
    actionCell.appendChild(plusMinusButton);
    row.appendChild(actionCell);

    tableBody.appendChild(row);
  });
}

//Fetch all the data from storageLocation 
function fetchDataAndPopulateTable(registrationNo) {
  fetch(`/storageLocation/${registrationNo}`)
    .then(response => response.json())
    .then(data => {
      populatePickingTable(data);
    })
    .catch(error => {
      console.error('Failed to fetch Storage data:', error);
    });
}
fetchDataAndPopulateTable(companyRegistrationNo);

function createPlusMinusButton(initialValue) {
  const plusMinusButton = document.createElement("div");
  plusMinusButton.classList.add("plus-minus-button");

  const minusButton = document.createElement("button");
  minusButton.textContent = "-";
  minusButton.classList.add("minus");

  const valueInput = document.createElement("input");
  valueInput.type = "number";
  valueInput.classList.add("value");
  valueInput.value = 0;
  valueInput.disabled = true;
  valueInput.max = initialValue.toString(); 

  const plusButton = document.createElement("button");
  plusButton.textContent = "+";
  plusButton.classList.add("plus");

  plusMinusButton.appendChild(minusButton);
  plusMinusButton.appendChild(valueInput);
  plusMinusButton.appendChild(plusButton);


  plusButton.addEventListener("click", () => {
    const currentValue = parseInt(valueInput.value);
    if (currentValue < initialValue) {
      valueInput.value = currentValue + 1;
    }
  });

  minusButton.addEventListener("click", () => {
    const currentValue = parseInt(valueInput.value);
    if (currentValue > 0) {
      valueInput.value = currentValue - 1;
    }
  });

  return plusMinusButton;
}

const createPickingListButton = document.getElementById('submitPickingList');
createPickingListButton.addEventListener('click', function () {
  const tableRows = document.querySelectorAll("#createPickingListTable tbody tr");
  const pickingListData = [];
  const pickingListUpdateData = [];

  tableRows.forEach(row => {
    const productName = row.cells[0].textContent;
    const productSku = row.cells[1].textContent;
    const productCategory = row.cells[2].textContent;
    const pickingWeight = parseFloat(row.cells[3].textContent) / parseFloat(row.cells[4].textContent);
    const pickingQuantity = parseInt(row.querySelector(".value").value);
    const productWeight = pickingWeight * pickingQuantity;
    const productLocation = row.cells[5].textContent;
    const pickingStatus = "Ongoing";

    if (pickingQuantity > 0) {
      const productData = {
        productName,
        productSku,
        productCategory,
        pickingQuantity,
        productLocation,
        companyOutboundAdminID,
        companyOutboundAdmin,
        companyRegistrationNo,
        companyName,
        pickingListCreatedDate,
        pickingStatus,
      };
      const productUpdateData = {
        productSku,
        productLocation,
        pickingQuantity,
        productWeight,
      };
      pickingListData.push(productData);
      pickingListUpdateData.push(productUpdateData);
    }
  });

  if (pickingListData.length === 0) {
    alert('Please select at least one item.');
    return;
  }

  fetch('/pickingList/insertPickingList', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(pickingListData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      alert('Picking list created successfully:', data);
      updateProductQuantitiesAfterInsertion(pickingListUpdateData);
      fetchDataAndPopulateTable(companyRegistrationNo);
      fetchDataByRegistrationNo(companyRegistrationNo);
    })
    .catch(error => {
      console.error('Error inserting picking list data:', error);
    });
});

function updateProductQuantitiesAfterInsertion(pickingListUpdateData) {
  const updateDataArray = pickingListUpdateData.map(productData => {
    return {
      productSku: productData.productSku,
      productLocation: productData.productLocation,
      pickingQuantity: productData.pickingQuantity,
      productWeight: productData.productWeight
    };
  });

  fetch('/storageLocation/updateProductQuantity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateDataArray)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      alert('Product quantities updated successfully:', data);
      fetchDataAndPopulateTable(companyRegistrationNo);
    })
    .catch(error => {
      console.error('Error updating product quantities:', error);
    });
}

function fetchDataByRegistrationNo(registrationNo) {
  return fetch(`/pickingList/${registrationNo}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      groupByPickingId(data)
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      throw error;
    });
}
fetchDataByRegistrationNo(companyRegistrationNo)

function groupByPickingId(data) {
  const groupedData = {};
  data.forEach(item => {
    if (!groupedData[item.pickingId]) {
      groupedData[item.pickingId] = [];
    }
    groupedData[item.pickingId].push(item);
  });
  console.log(groupedData);
  populatePickingTaskTable(groupedData);
}

function populatePickingTaskTable(groupedData) {
  const table = document.querySelector("#pickingTaskTable"); 
  if (!table) {
    console.error("Table element not found.");
    return;
  }

  const tableBody = table.querySelector("tbody"); 
  if (!tableBody) {
    console.error("Table body element not found.");
    return;
  }
  tableBody.innerHTML = "";

  for (const pickingId in groupedData) {
    if (groupedData.hasOwnProperty(pickingId)) {
      const items = groupedData[pickingId];

      const row = document.createElement("tr");

      const pickingIdCell = document.createElement("td");
      pickingIdCell.textContent = pickingId;
      pickingIdCell.setAttribute("rowspan", items.length); 
      pickingIdCell.style.fontWeight = "bold"; 
      row.appendChild(pickingIdCell);

      // Add the first product in the group with the pickingListCreatedDate
      const firstItem = items[0];
      const productNameCell = document.createElement("td");
      productNameCell.textContent = firstItem.productName;
      row.appendChild(productNameCell);

      const productCategoryCell = document.createElement("td");
      productCategoryCell.textContent = firstItem.productCategory;
      row.appendChild(productCategoryCell);

      const pickingQuantityCell = document.createElement("td");
      pickingQuantityCell.textContent = firstItem.pickingQuantity;
      row.appendChild(pickingQuantityCell);

      const pickingStatusCell = document.createElement("td");
      pickingStatusCell.textContent = firstItem.pickingStatus;
      row.appendChild(pickingStatusCell);

      const pickingListCreatedDateCell = document.createElement("td");
      pickingListCreatedDateCell.textContent = firstItem.pickingListCreatedDate;
      row.appendChild(pickingListCreatedDateCell);

      tableBody.appendChild(row);

      // Add sub-rows for the remaining products in the group
      for (let i = 1; i < items.length; i++) {
        const subRow = document.createElement("tr");

        const subProductNameCell = document.createElement("td");
        subProductNameCell.textContent = items[i].productName;
        subRow.appendChild(subProductNameCell);

        const subProductCategoryCell = document.createElement("td");
        subProductCategoryCell.textContent = items[i].productCategory;
        subRow.appendChild(subProductCategoryCell);

        const subPickingQuantityCell = document.createElement("td");
        subPickingQuantityCell.textContent = items[i].pickingQuantity;
        subRow.appendChild(subPickingQuantityCell);

        const subPickingStatusCell = document.createElement("td");
        subPickingStatusCell.textContent = items[i].pickingStatus;
        subRow.appendChild(subPickingStatusCell);

        // Omit the pickingListCreatedDate for sub-rows
        const subPickingListCreatedDateCell = document.createElement("td");
        subPickingListCreatedDateCell.textContent = "";
        subRow.appendChild(subPickingListCreatedDateCell);

        tableBody.appendChild(subRow);
      }
    }
  }
}


// Search function for populatePickingTable
function searchPickingTable() {
  const searchInput = document.getElementById('CreatePickingListSearch'); 
  const searchText = searchInput.value.toLowerCase();

  fetch(`/storageLocation/${companyRegistrationNo}`)
    .then(response => response.json())
    .then(pickingtableList => {
      // Filter the data based on the search text
      const filteredList = pickingtableList.filter(item =>
        item.productName.toLowerCase().includes(searchText) ||
        item.productSku.toLowerCase().includes(searchText) ||
        item.productLocation.toLowerCase().includes(searchText)
      );

      // Update the table with the filtered data
      populatePickingTable(filteredList, searchText);
    })
    .catch(error => {
      console.error('Failed to fetch Storage data:', error);
    });
}

// Search function for populatePickingTaskTable
function searchPickingTaskTable() {
  const searchInput = document.getElementById('PickingTaskSearch'); 
  const searchText = searchInput.value.toLowerCase();

  fetch(`/pickingList/${companyRegistrationNo}`)
    .then(response => response.json())
    .then(data => {
      // Filter the data based on the search text
      const filteredData = data.filter(item =>
        item.productName.toLowerCase().includes(searchText) ||
        item.productCategory.toLowerCase().includes(searchText) ||
        item.pickingStatus.toLowerCase().includes(searchText) ||
        item.pickingListCreatedDate.toLowerCase().includes(searchText) ||
        item.pickingId.toLowerCase().includes(searchText)
      );

      // Group the filtered data by pickingId
      const groupedData = {};
      filteredData.forEach(item => {
        if (!groupedData[item.pickingId]) {
          groupedData[item.pickingId] = [];
        }
        groupedData[item.pickingId].push(item);
      });
      populatePickingTaskTable(groupedData);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

const pickingTaskSearchInput = document.getElementById('PickingTaskSearch'); 
pickingTaskSearchInput.addEventListener('input', searchPickingTaskTable);
const searchInput = document.getElementById('CreatePickingListSearch'); 
searchInput.addEventListener('input', searchPickingTable);