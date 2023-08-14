     // Function to handle inline editing
     const handleInlineEdit = (event, inventoryId, fieldName) => {
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
                updateInventoryItem(inventoryId, fieldName, updatedValue);
            }
        };

        inputField.addEventListener('keydown', handleKeyDown);
        cell.textContent = '';
        cell.appendChild(inputField);
        inputField.focus();
    };

    // Function to update an inventory item field
    const updateInventoryItem = (inventoryId, fieldName, fieldValue) => {
        const updatedData = { [fieldName]: fieldValue };
        console.log(fieldName)
        console.log(fieldValue)
        fetch(`/inventory/${inventoryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                alert('Inventory item updated successfully');
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };

    // Function to delete an inventory item
    const deleteInventoryItem = (inventoryId) => {
        fetch(`/inventory/${inventoryId}`, {
            method: 'DELETE',
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                alert('Inventory item deleted successfully');
                location.reload();
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };

    document.getElementById('submitButton').addEventListener('click', () => {
        // Get the form input values
        const productName = document.getElementById('productName').value;
        const sku = document.getElementById('sku').value;
        const quantity = document.getElementById('quantity').value;
        const storageLocation1 = document.getElementById('storageLocation1').value;
        const storageLocation2 = document.getElementById('storageLocation2').value;
        const category = document.getElementById('category').value;
        const reorderPoint = document.getElementById('reorderPoint').value;
        const productDescription = document.getElementById('productDescription').value;

        const storageLocation = [storageLocation1, storageLocation2].join(', ');
        console.log(storageLocation);

        // Create an object with the inventory data
        const inventoryData = {
            productName,
            sku,
            quantity,
            storageLocation,
            category,
            reorderPoint,
            productDescription
        };

        fetch('/inventory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(inventoryData)
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                alert('Inserted Successfully!');
                location.reload();
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });

    // Fetch the inventory data from the server
    fetch('/inventory')
        .then(response => response.json())
        .then(inventoryList => {
            const tableBody = document.querySelector('#inventoryTable tbody');

            inventoryList.forEach(inventory => {
                const row = document.createElement('tr');

                const productIdCell = document.createElement('td');
                productIdCell.textContent = inventory.productId;
                row.appendChild(productIdCell);

                const productNameCell = document.createElement('td');
                productNameCell.textContent = inventory.productName;
                productNameCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, inventory.productId, 'productName');
                });
                row.appendChild(productNameCell);

                const skuCell = document.createElement('td');
                skuCell.textContent = inventory.sku;
                skuCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, inventory.productId, 'sku');
                });
                row.appendChild(skuCell);

                const quantityCell = document.createElement('td');
                quantityCell.textContent = inventory.quantity;
                quantityCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, inventory.productId, 'quantity');
                });
                row.appendChild(quantityCell);

                const storageLocationCell = document.createElement('td');
                storageLocationCell.textContent = inventory.storageLocation;
                storageLocationCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, inventory.productId, 'storageLocation');
                });
                row.appendChild(storageLocationCell);

                const categoryCell = document.createElement('td');
                categoryCell.textContent = inventory.category;
                categoryCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, inventory.productId, 'category');
                });
                row.appendChild(categoryCell);

                const reorderPointCell = document.createElement('td');
                reorderPointCell.textContent = inventory.reorderPoint;
                reorderPointCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, inventory.productId, 'reorderPoint');
                });
                row.appendChild(reorderPointCell);

                const descriptionCell = document.createElement('td');
                descriptionCell.textContent = inventory.productDescription;
                descriptionCell.classList.add('description-cell');
                descriptionCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, inventory.productId, 'productDescription');
                });
                row.appendChild(descriptionCell);

                const deleteCell = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('btn', 'btn-danger', 'delete-button');
                deleteButton.dataset.id = inventory.productId; 
                deleteButton.addEventListener('click', () => {
                    const inventoryId = deleteButton.dataset.id;
                    deleteInventoryItem(inventoryId);
                });
                deleteCell.appendChild(deleteButton);
                row.appendChild(deleteCell);

                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Failed to fetch inventory data:', error);
        });