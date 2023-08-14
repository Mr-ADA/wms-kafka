const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
companyRegistrationNo = loggedInUser.employee.companyRegistrationNo;
companyName = loggedInUser.employee.companyName;
companyInboundManager = loggedInUser.employee.employeeName;
companyInboundManagerID = loggedInUser.employee.employeeId;
document.getElementById('companyName').innerHTML = companyName;

const updateShipmentStatus = (productId, fieldName, fieldValue) => {
    const updatedData = { [fieldName]: fieldValue };
    fetch(`/inventory/${productId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
    })
        .then(response => response.json())
        .then(data => {
            viewShipmentTable();
        })
        .catch(error => {
            console.error('Error:', error);
        });
};


// Fetch the supplier data from the server
fetch('/supplier')
    .then(response => response.json())
    .then(supplierList => {
        // Get the table body element
        const tableBody = document.querySelector('#supplierInboundTable tbody');

        // Clear existing table rows
        tableBody.innerHTML = '';

        // Iterate over the supplier data and create table rows
        supplierList.forEach(supplier => {
            const row = document.createElement('tr');

            // Create table cells and populate them with data
            const supplierNameCell = document.createElement('td');
            supplierNameCell.textContent = supplier.supplierName;
            row.appendChild(supplierNameCell);

            const supplierAddressCell = document.createElement('td');
            supplierAddressCell.textContent = supplier.supplierAddress;
            row.appendChild(supplierAddressCell);

            const supplierPhoneCell = document.createElement('td');
            supplierPhoneCell.textContent = supplier.supplierPhone;
            row.appendChild(supplierPhoneCell);

            const productNameCell = document.createElement('td');
            productNameCell.textContent = supplier.productName;
            row.appendChild(productNameCell);

            const productCategoryCell = document.createElement('td');
            productCategoryCell.textContent = supplier.productCategory;
            row.appendChild(productCategoryCell);

            const productPriceCell = document.createElement('td');
            productPriceCell.textContent = "$" + supplier.productPrice;
            row.appendChild(productPriceCell);

            const productWeightCell = document.createElement('td');
            productWeightCell.textContent = supplier.productWeight + "KG";
            row.appendChild(productWeightCell);

            const productDescriptionCell = document.createElement('td');
            productDescriptionCell.textContent = supplier.productDescription;
            row.appendChild(productDescriptionCell);

            // Create the cell for the modal button
            const modalButtonCell = document.createElement('td');
            const modalButton = document.createElement('button');
            modalButton.type = 'button';
            modalButton.classList.add('btn', 'btn-primary', 'btn-sm');
            modalButton.dataset.bsToggle = 'modal';
            modalButton.dataset.bsTarget = '#orderSuppliesModal';
            modalButton.textContent = 'Order';
            modalButtonCell.appendChild(modalButton);
            row.appendChild(modalButtonCell);

            // Append the row to the table body
            tableBody.appendChild(row);
        });

        // Get references to the form fields in the modal
        const modalProductName = document.getElementById('modalProductName');
        const modalProductCategory = document.getElementById('modalProductCategory');
        const modalSupplierName = document.getElementById('modalSupplierName');
        const modalSupplierAddress = document.getElementById('modalSupplierAddress');
        const modalProductDescription = document.getElementById('modalProductDescription');
        const modalProductQuantity = document.getElementById('modalProductQuantity');


        const date = new Date();
        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        let productOrderDate = `${day}-${month}-${year}`;

        document.querySelectorAll('.btn.btn-primary[data-bs-toggle="modal"]').forEach((button, index) => {
            button.addEventListener('click', () => {
                const rowData = supplierList[index];
                modalProductName.value = rowData.productName;
                modalProductCategory.value = rowData.productCategory;
                modalSupplierName.value = rowData.supplierName;
                modalSupplierAddress.value = rowData.supplierAddress;
                modalProductDescription.value = rowData.productDescription;
                modalProductPrice.value = rowData.productPrice;
                modalProductWeight.value = rowData.productWeight;
            });
        });

        document.getElementById('submitOrder').addEventListener('click', () => {
            const productName = modalProductName.value;
            const supplierName = modalSupplierName.value;
            const supplierAddress = modalSupplierAddress.value;
            const productCategory = modalProductCategory.value;
            const productPrice = modalProductPrice.value;
            const productWeight = modalProductWeight.value;
            const productQuantity = modalProductQuantity.value;
            const productOrderStatus = "Processing";

            // Validation function for checking if a value is numeric
            function isNumeric(value) {
                return /^\d+$/.test(value);
            }

            // Validate all input fields
            if (productQuantity.trim() === '' || !isNumeric(productQuantity)) {
                alert("Quantity must be non-empty & in numerical value.");
                return;
            }

            const orderSuppliesData = {
                productName,
                supplierName,
                supplierAddress,
                productCategory,
                productPrice,
                productWeight,
                productQuantity,
                productOrderDate,
                productOrderStatus,
                companyInboundManagerID,
                companyInboundManager,
                companyRegistrationNo,
                companyName
            };

            // Send the data to the inventory microservice for insertion
            fetch('/inventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderSuppliesData)
            })
                .then(response => response.json())
                .then(data => {
                    // Handle the response from the inventory microservice
                    console.log('Product inserted:', data);
                    viewShipmentTable();
                    modalProductQuantity.value = ''
                    alert("Order Submitted Successfully!");
                    // Perform any additional actions or show success message
                })
                .catch(error => {
                    console.error('Failed to insert product:', error);
                    // Handle the error and show an error message
                });
        });
        // Function to display an error message on the field
        function displayError(field, errorMessage) {
            field.value = ''; // Clear the field
            field.setAttribute('data-error', errorMessage);
        }
        // Function to clear the error message on the field
        function clearError(field) {
            field.removeAttribute('data-error');
        }
    })
    .catch(error => {
        console.error('Failed to fetch supplier data:', error);
    });

// Search suppliers Table
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById('OrderSuppliesSearch');

    searchInput.addEventListener("input", function () {
        const searchText = searchInput.value.trim().toLowerCase();
        const tableRows = document.querySelectorAll("#supplierInboundTable tbody tr");

        tableRows.forEach(row => {
            const supplierName = row.querySelector("td:nth-child(1)").textContent.toLowerCase();
            const productName = row.querySelector("td:nth-child(4)").textContent.toLowerCase();
            const productCategory = row.querySelector("td:nth-child(5)").textContent.toLowerCase();

            const display =
                supplierName.includes(searchText) ||
                    productName.includes(searchText) ||
                    productCategory.includes(searchText)
                    ? ""
                    : "none";

            row.style.display = display;
        });
    });
});

function viewShipmentTable() {

    function createTableRow(data) {
        const row = document.createElement('tr');

        const productNameCell = document.createElement('td');
        productNameCell.textContent = data.productName;
        row.appendChild(productNameCell);

        const supplierNameCell = document.createElement('td');
        supplierNameCell.textContent = data.supplierName;
        row.appendChild(supplierNameCell);

        const categoryCell = document.createElement('td');
        categoryCell.textContent = data.productCategory;
        row.appendChild(categoryCell);

        const quantityCell = document.createElement('td');
        quantityCell.textContent = data.productQuantity;
        row.appendChild(quantityCell);

        const totalPriceCell = document.createElement('td');
        totalPriceCell.textContent = "$" + data.productPrice;
        row.appendChild(totalPriceCell);

        const totalWeightCell = document.createElement('td');
        totalWeightCell.textContent = data.productWeight + "KG";
        row.appendChild(totalWeightCell);

        const dateCell = document.createElement('td');
        dateCell.textContent = data.productOrderDate;
        row.appendChild(dateCell);

        const orderStatus = document.createElement('td');
        orderStatus.textContent = data.productOrderStatus;
        row.appendChild(orderStatus);

        // Create the cell for the modal button
        const modalButtonCell = document.createElement('td');
        const modalButton = document.createElement('button');
        modalButton.type = 'button';
        modalButton.classList.add('btn', 'btn-primary', 'btn-sm');
        modalButton.dataset.bsToggle = 'modal';
        modalButton.dataset.bsTarget = '#invoiceModal';
        modalButton.textContent = 'Invoice';

        const receivedButtonCell = document.createElement('td');
        const receivedButton = document.createElement('button');
        receivedButton.type = 'button';
        receivedButton.classList.add('btn', 'btn-success', 'btn-sm');
        receivedButton.textContent = 'Received';

        receivedButton.addEventListener('click', () => {

            const productName = data.productName;
            const supplierName = data.supplierName;
            const productCategory = data.productCategory;
            const productWeight = data.productWeight;
            const productQuantity = data.productQuantity;
            const companyRegistrationNo = data.companyRegistrationNo;
            const companyName = data.companyName;
            const productOrderStatus = data.productOrderStatus;

            const inventoryAdminData = {
                productName, supplierName, productCategory,
                productWeight, productQuantity, companyRegistrationNo, companyName
            }
            if (productOrderStatus === "Processing") {

                updateShipmentStatus(data.productId, 'productOrderStatus', 'Received');

                fetch('/inventoryAdmin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(inventoryAdminData)
                })
                    .then(response => response.json())
                    .then(data => {
                        alert('Inserted Successfully!');
                        console.log(data);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
            }
            else {
                alert("Product already Recieved!")
            }
        });

        modalButton.addEventListener('click', () => {
            document.getElementById('invoiceCompanyName').textContent = data.companyName;
            document.getElementById('invoiceSupplierName').textContent = data.supplierName;
            document.getElementById('invoiceSupplierAddress').textContent = data.supplierAddress;
            document.getElementById('invoiceProductPrice').textContent = "$" + data.productPrice * data.productQuantity;

            const invoiceTableBody = document.querySelector('#invoiceModal .invoicetable tbody');
            invoiceTableBody.innerHTML = '';

            const productRow = document.createElement('tr');

            const productNameCell = document.createElement('td');
            productNameCell.textContent = data.productName;
            productRow.appendChild(productNameCell);

            const quantityCell = document.createElement('td');
            quantityCell.textContent = data.productQuantity;
            productRow.appendChild(quantityCell);

            const weightCell = document.createElement('td');
            weightCell.textContent = data.productWeight + "KG";
            productRow.appendChild(weightCell);

            const amountCell = document.createElement('td');
            amountCell.classList.add('text-end');
            amountCell.textContent = "$" + data.productPrice;
            productRow.appendChild(amountCell);

            invoiceTableBody.appendChild(productRow);
        });
        modalButtonCell.appendChild(modalButton);
        row.appendChild(modalButtonCell);
        receivedButtonCell.appendChild(receivedButton);
        row.appendChild(receivedButtonCell);
        return row;
    }

    fetch(`/inventory/${companyRegistrationNo}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#manageShipmentTable tbody');
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


function searchIncomingShipment() {
    const searchInput = document.getElementById('IncomingShipmentSearch');
    const searchText = searchInput.value.toLowerCase();

    fetch(`/inventory/${companyRegistrationNo}`)
        .then(response => response.json())
        .then(supplierList => {
            // Filter the company data based on the search text
            const filteredSupplies = supplierList.filter(supplies =>
            (supplies.supplierName.toLowerCase().includes(searchText)
                || supplies.productName.toLowerCase().includes(searchText)
                || supplies.productOrderStatus.toLowerCase().includes(searchText))
            );

            const tableBody = document.querySelector('#manageShipmentTable tbody');
            tableBody.innerHTML = '';

            filteredSupplies.forEach(supplies => {
                const row = document.createElement('tr');
                console.log(filteredSupplies)
                // Create table cells and populate them with data
                const productNameCell = document.createElement('td');
                productNameCell.textContent = supplies.productName;
                row.appendChild(productNameCell);

                const supplierNameCell = document.createElement('td');
                supplierNameCell.textContent = supplies.supplierName;
                row.appendChild(supplierNameCell);

                const categoryCell = document.createElement('td');
                categoryCell.textContent = supplies.productCategory;
                row.appendChild(categoryCell);

                const quantityCell = document.createElement('td');
                quantityCell.textContent = supplies.productQuantity;
                row.appendChild(quantityCell);

                const totalPriceCell = document.createElement('td');
                totalPriceCell.textContent = "$" + supplies.productPrice;
                row.appendChild(totalPriceCell);

                const totalWeightCell = document.createElement('td');
                totalWeightCell.textContent = supplies.productWeight + "KG";
                row.appendChild(totalWeightCell);

                const dateCell = document.createElement('td');
                dateCell.textContent = supplies.productOrderDate;
                row.appendChild(dateCell);

                const orderStatus = document.createElement('td');
                orderStatus.textContent = supplies.productOrderStatus;
                row.appendChild(orderStatus);

                // Create the cell for the modal button
                const modalButtonCell = document.createElement('td');
                const modalButton = document.createElement('button');
                modalButton.type = 'button';
                modalButton.classList.add('btn', 'btn-primary', 'btn-sm');
                modalButton.dataset.bsToggle = 'modal';
                modalButton.dataset.bsTarget = '#invoiceModal';
                modalButton.textContent = 'Invoice';

                const receivedButtonCell = document.createElement('td');
                const receivedButton = document.createElement('button');
                receivedButton.type = 'button';
                receivedButton.classList.add('btn', 'btn-success', 'btn-sm');
                receivedButton.textContent = 'Received';

                receivedButton.addEventListener('click', () => {
                    updateShipmentStatus(supplies.productId, 'productOrderStatus', 'Received');
                });

                modalButton.addEventListener('click', () => {
                    document.getElementById('invoiceCompanyName').textContent = supplies.companyName;
                    document.getElementById('invoiceSupplierName').textContent = supplies.supplierName;
                    document.getElementById('invoiceSupplierAddress').textContent = supplies.supplierAddress;
                    document.getElementById('invoiceProductPrice').textContent = "$" + supplies.productPrice;

                    const invoiceTableBody = document.querySelector('#invoiceModal .invoicetable tbody');
                    invoiceTableBody.innerHTML = '';

                    const productRow = document.createElement('tr');

                    const productNameCell = document.createElement('td');
                    productNameCell.textContent = supplies.productName;
                    productRow.appendChild(productNameCell);

                    const quantityCell = document.createElement('td');
                    quantityCell.textContent = supplies.productQuantity;
                    productRow.appendChild(quantityCell);

                    const weightCell = document.createElement('td');
                    weightCell.textContent = (supplies.productWeight / supplies.productQuantity) + "KG";
                    productRow.appendChild(weightCell);

                    const amountCell = document.createElement('td');
                    amountCell.classList.add('text-end');
                    amountCell.textContent = "$" + (supplies.productPrice / supplies.productQuantity);
                    productRow.appendChild(amountCell);


                    invoiceTableBody.appendChild(productRow);
                });
                modalButtonCell.appendChild(modalButton);
                row.appendChild(modalButtonCell);
                receivedButtonCell.appendChild(receivedButton);
                row.appendChild(receivedButtonCell);
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Failed to fetch supplier data:', error);
        });
}
viewShipmentTable();
search_IncomingShipment = document.getElementById('IncomingShipmentSearch');
search_IncomingShipment.addEventListener('input', searchIncomingShipment);