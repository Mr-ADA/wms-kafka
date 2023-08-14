const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
companyRegistrationNo = loggedInUser.employee.companyRegistrationNo;
companySize = loggedInUser.employee.companySize;
companyName = loggedInUser.employee.companyName;
inventoryAdminName = loggedInUser.employee.employeeName;
inventoryAdminId = loggedInUser.employee.employeeId;
document.getElementById('companyName').innerHTML = companyName;
const selectElement = document.getElementById('allocateProductSelect');
const rangeInput = document.getElementById('allocateQuantityInput');
const rangeValueElement = document.getElementById('rangeValue');


function populateSelect(companyRegistrationNo) {

    const selectOption = document.createElement('option');
    selectOption.textContent = "Select Product";
    selectOption.value = ""; 
    selectElement.appendChild(selectOption);

    //Populate select input with products and set product quantity to options
    fetch(`/inventoryAdmin/${companyRegistrationNo}`)
        .then(response => response.json())
        .then(data => {

            const selectElement = document.getElementById('allocateProductSelect');

            data.forEach(product => {
                const option = document.createElement('option');
                option.textContent = product.productName;
                option.value = product.inventoryId; 
                
                // Set the data-quantity attribute to store the product quantity
                option.dataset.quantity = product.productQuantity;
                option.dataset.rowData = JSON.stringify(product);
                
                selectElement.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Failed to fetch product names:', error);
        });

    selectElement.addEventListener('change', function () {
        rangeValueElement.innerHTML = '0';
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        const productQuantity = selectedOption.dataset.quantity;
        rangeInput.max = productQuantity;
        if (selectElement.selectedIndex <= 0) {
            rangeInput.disabled = true;
        } else {
            rangeInput.disabled = false;
            rangeInput.value = 0;
        }
    });
    rangeInput.addEventListener('input', function () {
        rangeValueElement.textContent = rangeInput.value;
    });
}
populateSelect(companyRegistrationNo);


const allocateButton = document.getElementById('allocateButton');
allocateButton.addEventListener('click', function () {
    const productLocation = allocateLocationInput.value;
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const rowData = JSON.parse(selectedOption.dataset.rowData);
    const productName = rowData.productName;
    const supplierName = rowData.supplierName;
    const productCategory = rowData.productCategory;
    const productQuantity = parseInt(allocateQuantityInput.value);
    const productWeight = rowData.productWeight * productQuantity;
    const productSku = rowData.productSku;

    const storageData = {
        productName,
        supplierName,
        productCategory,
        productWeight,
        productQuantity,
        productSku,
        productLocation,
        companyRegistrationNo,
        companyName,
    };

    if (productQuantity > 0 && productLocation !== "") {
        fetch('/storageLocation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(storageData)
        })
            .then(response => {
                if (!response.ok) {
                    alert("Allocation Failed Shelf Reached Maximum Weight Limit.");
                    throw new Error('Failed to allocate storage. Storage location response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const requestOptions = {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ productSku, companyRegistrationNo, productQuantity })
                };

                return fetch('/inventoryAdmin/updateQuantity', requestOptions);
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Updated Inventory:', data);
                alert("Products Allocated Successfully!");

                populateSelect(companyRegistrationNo);

                allocateQuantityInput.value = '';
                allocateLocationInput.value = '';
                selectElement.selectedIndex = -1; // Deselect any selected option
                selectElement.innerHTML = ''
                const selectOption = document.createElement('option');
                selectOption.textContent = "Select Product";
                selectOption.value = ""; // Set the value if needed
                selectElement.appendChild(selectOption);
                fetchStorageLocationData();
                viewAdminInventoryTable();
            })
            .catch(error => {
                console.error('Error:', error.message); // Output the custom error message
            });
    }
    else if (productLocation == "" && productQuantity == 0) {
        alert("Please choose an option!");
    }
    else if (productLocation == "") {
        alert("Please Select a Location.");
    }
    else if (productQuantity == 0) {
        alert("Allocation Failed, Quantity 0.");
    }

});

//Get Square Id to allocateLocation Input
const squares = document.querySelectorAll('.square');
const allocateLocationInput = document.getElementById('allocateLocation');
const tableBody = document.getElementById('tableBody');

squares.forEach(square => {
    square.addEventListener('click', function () {
        const squareId = this.id;
        allocateLocationInput.value = squareId;

        squares.forEach(square => {
            square.classList.remove('selected');
        });
        this.classList.add('selected');

        const productLocation = squareId;
        productLocationValue.textContent = productLocation;
        fetch(`/storageLocation/productDetails/${productLocation}/${companyRegistrationNo}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                console.log('Received data:', data);
                storageProductTable.innerHTML = '';
                let totalWeight = 0;

                // Loop through the data and create table rows
                data[0]?.products.forEach(product => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${product.productName}</td>
                        <td>${product.productSku}</td>
                        <td>${product.productQuantity}</td>
                        <td>${product.productWeight} KG</td>
                    `;
                    storageProductTable.appendChild(row);
                    totalWeight += product.productWeight;
                });
                totalWeightElement.textContent = `Storage Capacity: ${totalWeight} KG / 500 KG`;
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
            });
    });
});

const updateInventoryAdminTable = (inventoryId, fieldValues) => {
    const updatedData = { ...fieldValues };
    fetch(`/inventoryAdmin/${inventoryId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
    })
        .then(response => response.json())
        .then(data => {
            viewShipmentTable();
            alert('Product SKU Successfully Generated!');
        })
        .catch(error => {
            console.error('Error:', error);
        });
};


function viewAdminInventoryTable() {

    function createTableRow(data) {
        const row = document.createElement('tr');

        const productNameCell = document.createElement('td');
        productNameCell.textContent = data.productName;
        row.appendChild(productNameCell);

        const categoryCell = document.createElement('td');
        categoryCell.textContent = data.productCategory;
        row.appendChild(categoryCell);

        const supplierNameCell = document.createElement('td');
        supplierNameCell.textContent = data.supplierName;
        row.appendChild(supplierNameCell);

        const quantityCell = document.createElement('td');
        quantityCell.textContent = data.productQuantity;
        row.appendChild(quantityCell);

        const WeightCell = document.createElement('td');
        WeightCell.textContent = (data.productWeight * data.productQuantity) + "KG";
        row.appendChild(WeightCell);

        const skuCell = document.createElement('td');
        skuCell.textContent = data.productSku;
        row.appendChild(skuCell);

        const reoderPointCell = document.createElement('td');
        reoderPointCell.textContent = data.productReorderPoint;
        row.appendChild(reoderPointCell);

        const modalButtonCell = document.createElement('td');
        const modalButton = document.createElement('button');
        modalButton.type = 'button';
        modalButton.classList.add('btn', 'btn-primary');
        modalButton.dataset.bsToggle = 'modal';
        modalButton.dataset.bsTarget = '#generateBarcodeModal';
        modalButton.textContent = 'Generate Barcode';


        const modalInventoryId = document.getElementById('modalInventoryId');
        const modalCompanyRegistrationNo = document.getElementById('modalCompanyRegistrationNo');
        const modalSkuNumber = document.getElementById('modalSkuNumber');
        const inventoryId = data.inventoryId;
        const companyRegistrationNo = data.companyRegistrationNo;
        const regNumber = companyRegistrationNo.match(/\d{5}/)[0];
        const SKU = "SKU" + regNumber + String(inventoryId);

        modalButton.addEventListener('click', () => {
            modalInventoryId.value = data.inventoryId;
            modalCompanyRegistrationNo.value = data.companyRegistrationNo;
            modalSkuNumber.value = SKU;
            document.getElementById("barcodeImage").src = "https://barcodeapi.org/api/" + modalSkuNumber.value;
            document.getElementById("barcodeDownload").href = "https://barcodeapi.org/api/" + modalSkuNumber.value;
        });

        modalButtonCell.appendChild(modalButton);
        row.appendChild(modalButtonCell);
        modalButtonCell.appendChild(modalButton);
        row.appendChild(modalButtonCell);
        return row;
    }

    fetch(`/inventoryAdmin/${companyRegistrationNo}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#viewInventoryTable tbody');
            tableBody.innerHTML = '';
            data.forEach(product => {
                const row = createTableRow(product);
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Failed to fetch inventory data:', error);
        });
}
viewAdminInventoryTable();


document.getElementById('generateButton').addEventListener('click', () => {
    const inventoryId = document.getElementById('modalInventoryId').value;
    const sku = document.getElementById('modalSkuNumber').value;
    const reorderPoint = document.getElementById('modalReorderPoint').value;
    const updatedFields = {
        productSku: sku,
        productReorderPoint: reorderPoint
    };

    // Validation function for checking if a value is numeric
    function isNumeric(value) {
        return /^\d+$/.test(value);
    }

    // Validate reorderPoint
    if (reorderPoint.trim() === '' || !isNumeric(reorderPoint)) {
        alert("Reorder must be non-empty & in numerical value.");
        return;
    }

    updateInventoryAdminTable(inventoryId, updatedFields);
    alert("Barcode Generated Successfully!")
    viewAdminInventoryTable();
    location.reload();

})

function searchAdminInventory() {
    const searchInput = document.getElementById('ViewInventorySearch');
    const searchText = searchInput.value.toLowerCase();

    fetch(`/inventoryAdmin/${companyRegistrationNo}`)
        .then(response => response.json())
        .then(inventoryList => {
            // Filter the company data based on the search text
            const filteredInventory = inventoryList.filter(inventory =>
                inventory.productName.toLowerCase().includes(searchText) ||
                inventory.supplierName.toLowerCase().includes(searchText) ||
                inventory.productSku.toLowerCase().includes(searchText)
            );

            const tableBody = document.querySelector('#viewInventoryTable tbody');
            tableBody.innerHTML = '';

            filteredInventory.forEach(data => {
                const row = createTableRow(data);
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Failed to fetch inventory data:', error);
        });
}

function createTableRow(data) {
    const row = document.createElement('tr');

    const productNameCell = createTableCell(data.productName);
    row.appendChild(productNameCell);

    const categoryCell = createTableCell(data.productCategory);
    row.appendChild(categoryCell);

    const supplierNameCell = createTableCell(data.supplierName);
    row.appendChild(supplierNameCell);

    const quantityCell = createTableCell(data.productQuantity);
    row.appendChild(quantityCell);

    const weightCell = createTableCell((data.productWeight * data.productQuantity) + 'KG');
    row.appendChild(weightCell);

    const skuCell = createTableCell(data.productSku);
    row.appendChild(skuCell);

    const reorderPointCell = createTableCell(data.productReorderPoint);
    row.appendChild(reorderPointCell);

    const modalButtonCell = document.createElement('td');
    const modalButton = document.createElement('button');
    modalButton.type = 'button';
    modalButton.classList.add('btn', 'btn-primary');
    modalButton.dataset.bsToggle = 'modal';
    modalButton.dataset.bsTarget = '#generateBarcodeModal';
    modalButton.textContent = 'Generate Barcode';

    modalButton.addEventListener('click', () => {
        const modalInventoryId = document.getElementById('modalInventoryId');
        const modalCompanyRegistrationNo = document.getElementById('modalCompanyRegistrationNo');
        const modalSkuNumber = document.getElementById('modalSkuNumber');
        const inventoryId = data.inventoryId;
        const companyRegistrationNo = data.companyRegistrationNo;
        const regNumber = companyRegistrationNo.match(/\d{5}/)[0];
        const SKU = 'SKU' + regNumber + String(inventoryId);

        modalInventoryId.value = inventoryId;
        modalCompanyRegistrationNo.value = companyRegistrationNo;
        modalSkuNumber.value = SKU;
        document.getElementById('barcodeImage').src = 'https://barcodeapi.org/api/' + modalSkuNumber.value;
    });
    modalButtonCell.appendChild(modalButton);
    row.appendChild(modalButtonCell);
    return row;
}

function createTableCell(text) {
    const cell = document.createElement('td');
    cell.textContent = text;
    return cell;
}


//Get all the products storage location
function fetchStorageLocationData() {
    fetch(`/storageLocation/locationWeights/${companyRegistrationNo}`)
        .then(response => response.json())
        .then(data => {
            updateSquareColors(data);
        })
        .catch(error => {
            console.error('Error fetching storage location data:', error);
        });
}

//Update squares according to occcupied, full or empty.
function updateSquareColors(locationWeights) {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        const location = square.id;
        const weight = locationWeights[location] || 0;

        if (weight >= 500) {
            square.style.backgroundColor = '#FF9B9B'; //Full
        } else if (weight > 0) {
            square.style.backgroundColor = '#FFD89C'; //Occupied
        } else {
            square.style.backgroundColor = '#B4FF9F'; //Empty
        }
    });
}
fetchStorageLocationData();

const mapLarge = document.getElementById('mapLarge');
const mapMedium = document.getElementById('mapMedium');
const mapSmall = document.getElementById('mapSmall');

// Show the corresponding map based on companySize
function showMapBasedOnSize() {
    switch (companySize) {
        case 'Large':
            mapLarge.style.display = 'block';
            mapMedium.style.display = 'none';
            mapSmall.style.display = 'none';
            break;
        case 'Medium':
            mapLarge.style.display = 'none';
            mapMedium.style.display = 'block';
            mapSmall.style.display = 'none';
            break;
        case 'Small':
            mapLarge.style.display = 'none';
            mapMedium.style.display = 'none';
            mapSmall.style.display = 'block';
            break;
        default:
            console.error('Invalid companySize:', companySize);
    }
}

showMapBasedOnSize();
search_AdminInventory = document.getElementById('ViewInventorySearch');
search_AdminInventory.addEventListener('input', searchAdminInventory);