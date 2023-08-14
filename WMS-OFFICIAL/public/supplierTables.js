// Function to handle inline editing
const supplierHandleInlineEdit = (event, supplierId, fieldName) => {
    const cell = event.target;
    const currentValue = cell.textContent;
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.value = currentValue;
    inputField.classList.add('form-control');
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            const updatedValue = inputField.value.trim();
            cell.textContent = updatedValue;
            cell.removeEventListener('keydown', handleKeyDown);
            updateSupplierItem(supplierId, fieldName, updatedValue);
        }
    };
    inputField.addEventListener('keydown', handleKeyDown);
    cell.textContent = '';
    cell.appendChild(inputField);
    inputField.focus();
};

// Function to update an supplier item field
const updateSupplierItem = (supplierId, fieldName, fieldValue) => {
    const updatedData = { [fieldName]: fieldValue };
    fetch(`/supplier/${supplierId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            displaySuppliers();
            alert('Supplier updated successfully');
        })
        .catch(error => {
            console.error('Error:', error);
        });
};

// Function to delete an supplier item
const deleteSupplierItem = (supplierId) => {
    fetch(`/supplier/${supplierId}`, {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            displaySuppliers();
            alert('Supplier deleted successfully');
        })
        .catch(error => {
            console.error('Error:', error);
        });
};

document.getElementById('submitButton').addEventListener('click', () => {
    // Get the form input values
    const supplierName = document.getElementById('supplierName');
    const supplierAddress = document.getElementById('supplierAddress');
    const supplierPhone = document.getElementById('supplierPhone');
    const productName = document.getElementById('productName');
    const productCategory = document.getElementById('productCategory');
    const productPrice = document.getElementById('productPrice');
    const productWeight = document.getElementById('productWeight');
    const productDescription = document.getElementById('productDescription');

    // Perform validation using Validator.js functions
    if (!validator.isLength(supplierName.value, { min: 1 })) {
        alert('Supplier Name is required.');
        return;
    }

    if (!validator.isAlpha(supplierName.value, 'en-US', { ignore: ' ' })) {
        alert('Supplier Name must contain letters only.');
        return;
    }

    if (!validator.isLength(supplierAddress.value, { min: 1 })) {
        alert('Supplier Address is required.');
        return;
    }

    if (!validator.isNumeric(supplierPhone.value) || !validator.isLength(supplierPhone.value, { min: 8, max: 8 })) {
        alert('Supplier Phone must be 8 digits (numbers only).');
        return;
    }

    if (!validator.isLength(productName.value, { min: 1 })) {
        alert('Product Name is required.');
        return;
    }

    if (!validator.isLength(productCategory.value, { min: 1 })) {
        alert('Product category is required.');
        return;
    }

    if (!validator.isAlpha(productCategory.value, 'en-US', { ignore: ' ' })) {
        alert('Product category must contain letters only.');
        return;
    }

    if (!validator.isNumeric(productPrice.value)) {
        alert('Product Price must be a number.');
        return;
    }

    if (!validator.isNumeric(productWeight.value)) {
        alert('Product Weight must be a number.');
        return;
    }

    if (!validator.isLength(productDescription.value, { min: 1 })) {
        alert('Product Description is required.');
        return;
    }

    const supplierData = {
        supplierName: supplierName.value,
        supplierAddress: supplierAddress.value,
        supplierPhone: supplierPhone.value,
        productName: productName.value,
        productCategory: productCategory.value,
        productPrice: productPrice.value,
        productWeight: productWeight.value,
        productDescription: productDescription.value
    };

    fetch('/supplier', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(supplierData)
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            displaySuppliers();
            alert('Inserted Successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
        });
});


function displaySuppliers() {
    // Fetch the supplier data from the server
    fetch('/supplier')
        .then(response => response.json())
        .then(supplierList => {
            const tableBody = document.querySelector('#supplierTable tbody');
            tableBody.innerHTML = '';

            supplierList.forEach(supplier => {
                const row = document.createElement('tr');
                // Create table cells and populate them with data
                const supplierIdCell = document.createElement('td');
                supplierIdCell.textContent = supplier.supplierId;
                row.appendChild(supplierIdCell);

                const supplierNameCell = document.createElement('td');
                supplierNameCell.textContent = supplier.supplierName;
                supplierNameCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'supplierName');
                });
                row.appendChild(supplierNameCell);

                const supplierAddressCell = document.createElement('td');
                supplierAddressCell.textContent = supplier.supplierAddress;
                supplierAddressCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'supplierAddress');
                });
                row.appendChild(supplierAddressCell);

                const supplierPhoneCell = document.createElement('td');
                supplierPhoneCell.textContent = supplier.supplierPhone;
                supplierPhoneCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'supplierPhone');
                });
                row.appendChild(supplierPhoneCell);

                const productNameCell = document.createElement('td');
                productNameCell.textContent = supplier.productName;
                productNameCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'productName');
                });
                row.appendChild(productNameCell);

                const productCategoryCell = document.createElement('td');
                productCategoryCell.textContent = supplier.productCategory;
                productCategoryCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'productCategory');
                });
                row.appendChild(productCategoryCell);

                const productPriceCell = document.createElement('td');
                productPriceCell.textContent = "$" + supplier.productPrice;
                productPriceCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'productPrice');
                });
                row.appendChild(productPriceCell);

                const productWeightCell = document.createElement('td');
                productWeightCell.textContent = supplier.productWeight + "KG";
                productWeightCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'productWeight');
                });
                row.appendChild(productWeightCell);

                const productDescriptionCell = document.createElement('td');
                productDescriptionCell.textContent = supplier.productDescription;
                productDescriptionCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'productDescription');
                });
                row.appendChild(productDescriptionCell);

                const deleteCell = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('btn', 'btn-danger', 'delete-button');
                deleteButton.dataset.id = supplier.supplierId;
                deleteButton.addEventListener('click', () => {
                    const supplierId = deleteButton.dataset.id;
                    deleteSupplierItem(supplierId);
                });
                deleteCell.appendChild(deleteButton);
                row.appendChild(deleteCell);

                // Append the row to the table body
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Failed to fetch supplier data:', error);
        });
}

function searchSuppliers() {
    const searchInput = document.getElementById('supplierSearch');
    const searchText = searchInput.value.toLowerCase();

    fetch('/supplier')
        .then(response => response.json())
        .then(supplierList => {
            const filteredSuppliers = supplierList.filter(supplier =>
                supplier.supplierId.toString().includes(searchText) ||
                supplier.supplierName.toLowerCase().includes(searchText) ||                 
                supplier.productCategory.toLowerCase().includes(searchText)
            );

            const tableBody = document.querySelector('#supplierTable tbody');
            tableBody.innerHTML = '';

            filteredSuppliers.forEach(supplier => {
                const row = document.createElement('tr');
                const supplierIdCell = document.createElement('td');
                supplierIdCell.textContent = supplier.supplierId;
                row.appendChild(supplierIdCell);

                const supplierNameCell = document.createElement('td');
                supplierNameCell.textContent = supplier.supplierName;
                supplierNameCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'supplierName');
                });
                row.appendChild(supplierNameCell);

                const supplierAddressCell = document.createElement('td');
                supplierAddressCell.textContent = supplier.supplierAddress;
                supplierAddressCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'supplierAddress');
                });
                row.appendChild(supplierAddressCell);

                const supplierPhoneCell = document.createElement('td');
                supplierPhoneCell.textContent = supplier.supplierPhone;
                supplierPhoneCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'supplierPhone');
                });
                row.appendChild(supplierPhoneCell);

                const productNameCell = document.createElement('td');
                productNameCell.textContent = supplier.productName;
                productNameCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'productName');
                });
                row.appendChild(productNameCell);

                const productCategoryCell = document.createElement('td');
                productCategoryCell.textContent = supplier.productCategory;
                productCategoryCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'productCategory');
                });
                row.appendChild(productCategoryCell);

                const productPriceCell = document.createElement('td');
                productPriceCell.textContent = "$" + supplier.productPrice;
                productPriceCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'productPrice');
                });
                row.appendChild(productPriceCell);

                const productWeightCell = document.createElement('td');
                productWeightCell.textContent = supplier.productWeight + "KG";
                productWeightCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'productWeight');
                });
                row.appendChild(productWeightCell);

                const productDescriptionCell = document.createElement('td');
                productDescriptionCell.textContent = supplier.productDescription;
                productDescriptionCell.addEventListener('click', (event) => {
                    supplierHandleInlineEdit(event, supplier.supplierId, 'productDescription');
                });
                row.appendChild(productDescriptionCell);

                const deleteCell = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('btn', 'btn-danger', 'delete-button');
                deleteButton.dataset.id = supplier.supplierId;
                deleteButton.addEventListener('click', () => {
                    const supplierId = deleteButton.dataset.id;
                    deleteSupplierItem(supplierId);
                });
                deleteCell.appendChild(deleteButton);
                row.appendChild(deleteCell);

                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Failed to fetch supplier data:', error);
        });
}
displaySuppliers();
searchInput = document.getElementById('supplierSearch');
searchInput.addEventListener('input', searchSuppliers);