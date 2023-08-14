// Function to handle inline editing
const handleInlineEdit = (event, companyId, fieldName) => {
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
            updateCompanyItem(companyId, fieldName, updatedValue);
        }
    };
    inputField.addEventListener('keydown', handleKeyDown);
    cell.textContent = '';
    cell.appendChild(inputField);
    inputField.focus();
};

// Function to update an company item field
const updateCompanyItem = (companyId, fieldName, fieldValue) => {
    const updatedData = { [fieldName]: fieldValue };

    fetch(`/companyAccount/${companyId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            alert('Company updated successfully');
            viewCompanyTable();
        })
        .catch(error => {
            console.error('Error:', error);
        });
};

// Function to delete an company item
const deleteCompanyItem = (companyId) => {
    fetch(`/companyAccount/${companyId}`, {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            alert('Company deleted successfully');
            viewCompanyTable();
        })
        .catch(error => {
            console.error('Error:', error);
        });
};

//Function to populate companies table
function viewCompanyTable() {
    fetch('/companyAccount')
        .then(response => response.json())
        .then(companyList => {
            // Get the table body element
            tableBody = document.querySelector('#accountTable tbody');
            acceptedCompanies = companyList.filter(company => company.status === 'Accepted');
            tableBody.innerHTML = '';

            acceptedCompanies.forEach(company => {
                const row = document.createElement('tr');
                // Create table cells and populate them with data
                const companyIdCell = document.createElement('td');
                companyIdCell.textContent = company.companyId;
                row.appendChild(companyIdCell);

                const companyNameCell = document.createElement('td');
                companyNameCell.textContent = company.companyName;
                companyNameCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, company.companyId, 'companyName');
                });
                row.appendChild(companyNameCell);

                const companyRegistrationNoCell = document.createElement('td');
                companyRegistrationNoCell.textContent = company.companyRegistrationNo;
                companyRegistrationNoCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, company.companyId, 'companyRegistrationNo');
                });
                row.appendChild(companyRegistrationNoCell);

                const companySizeCell = document.createElement('td');
                companySizeCell.textContent = company.companySize;
                companySizeCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, company.companyId, 'companySize');
                });
                row.appendChild(companySizeCell);

                const companyAddressCell = document.createElement('td');
                companyAddressCell.textContent = company.companyAddress;
                companyAddressCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, company.companyId, 'companyAddress');
                });
                row.appendChild(companyAddressCell);

                const companyEmailCell = document.createElement('td');
                companyEmailCell.textContent = company.companyEmail;
                companyEmailCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, company.companyId, 'companyEmail');
                });
                row.appendChild(companyEmailCell);

                const companyPhoneNumberCell = document.createElement('td');
                companyPhoneNumberCell.textContent = company.companyPhoneNumber;
                companyPhoneNumberCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, company.companyId, 'companyPhoneNumber');
                });
                row.appendChild(companyPhoneNumberCell);

                const deleteCell = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('btn', 'btn-danger', 'delete-button');
                deleteButton.dataset.id = company.companyId;
                deleteButton.addEventListener('click', () => {
                    const companyId = deleteButton.dataset.id;
                    deleteCompanyItem(companyId);
                });
                deleteCell.appendChild(deleteButton);
                row.appendChild(deleteCell);

                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Failed to fetch company data:', error);
        });
}


//Function to search for companies on table
function searchManageCompanies() {
    const searchInput = document.getElementById('companySearch');
    const searchText = searchInput.value.toLowerCase();

    fetch('/companyAccount')
        .then(response => response.json())
        .then(companyList => {
            // Filter the company data based on the search text
            const filteredCompanies = companyList.filter(company =>
                (company.status === 'Accepted') &&
                (company.companyId.toString().includes(searchText)
                || company.companyName.toLowerCase().includes(searchText)
                || company.companyRegistrationNo.toLowerCase().includes(searchText))
            );

            const tableBody = document.querySelector('#accountTable tbody');
            tableBody.innerHTML = '';

            filteredCompanies.forEach(company => {
                const row = document.createElement('tr');
                // Create table cells and populate them with data
                const companyIdCell = document.createElement('td');
                companyIdCell.textContent = company.companyId;
                row.appendChild(companyIdCell);

                const companyNameCell = document.createElement('td');
                companyNameCell.textContent = company.companyName;
                companyNameCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, company.companyId, 'companyName');
                });
                row.appendChild(companyNameCell);

                const companyRegistrationNoCell = document.createElement('td');
                companyRegistrationNoCell.textContent = company.companyRegistrationNo;
                companyRegistrationNoCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, company.companyId, 'companyRegistrationNo');
                });
                row.appendChild(companyRegistrationNoCell);

                const companySizeCell = document.createElement('td');
                companySizeCell.textContent = company.companySize;
                companySizeCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, company.companyId, 'companySize');
                });
                row.appendChild(companySizeCell);

                const companyAddressCell = document.createElement('td');
                companyAddressCell.textContent = company.companyAddress;
                companyAddressCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, company.companyId, 'companyAddress');
                });
                row.appendChild(companyAddressCell);

                const companyEmailCell = document.createElement('td');
                companyEmailCell.textContent = company.companyEmail;
                companyEmailCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, company.companyId, 'companyEmail');
                });
                row.appendChild(companyEmailCell);

                const companyPhoneNumberCell = document.createElement('td');
                companyPhoneNumberCell.textContent = company.companyPhoneNumber;
                companyPhoneNumberCell.addEventListener('click', (event) => {
                    handleInlineEdit(event, company.companyId, 'companyPhoneNumber');
                });
                row.appendChild(companyPhoneNumberCell);

                const deleteCell = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('btn', 'btn-danger', 'delete-button');
                deleteButton.dataset.id = company.companyId;
                deleteButton.addEventListener('click', () => {
                    const companyId = deleteButton.dataset.id;
                    deleteCompanyItem(companyId);
                });
                deleteCell.appendChild(deleteButton);
                row.appendChild(deleteCell);

                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Failed to fetch company data:', error);
        });
}

// Function to fetch and populate pending table
function pendingTable() {
    fetch('/companyAccount')
        .then(response => response.json())
        .then(data => {
            const processingCompanies = data.filter(company => company.status === 'Processing');
            const tableBody = document.querySelector('#pendingTable tbody');

            tableBody.innerHTML = '';

            processingCompanies.forEach(company => {

                const row = document.createElement('tr');

                const companyIdCell = document.createElement('td');
                companyIdCell.textContent = company.companyId;
                row.appendChild(companyIdCell);

                const companyNameCell = document.createElement('td');
                companyNameCell.textContent = company.companyName;
                row.appendChild(companyNameCell);

                const companyRegistrationNoCell = document.createElement('td');
                companyRegistrationNoCell.textContent = company.companyRegistrationNo;
                row.appendChild(companyRegistrationNoCell);

                const companySizeCell = document.createElement('td');
                companySizeCell.textContent = company.companySize;
                row.appendChild(companySizeCell);

                const companyAddressCell = document.createElement('td');
                companyAddressCell.textContent = company.companyAddress;
                row.appendChild(companyAddressCell);

                const companyStatusCell = document.createElement('td');
                companyStatusCell.textContent = company.status;
                row.appendChild(companyStatusCell);

                // Create Accept button
                const acceptButtonCell = document.createElement('td');
                const acceptButton = document.createElement('button');
                acceptButton.classList.add('btn', 'btn-success', 'btn-sm');
                acceptButton.textContent = 'Accept';
                acceptButton.addEventListener('click', () => {
                    updateStatus(company.companyId, 'Accepted');
                    alert('Company has been accepted!');
                });
                acceptButtonCell.appendChild(acceptButton);
                row.appendChild(acceptButtonCell);

                // Create Reject button
                const rejectButtonCell = document.createElement('td');
                const rejectButton = document.createElement('button');
                rejectButton.classList.add('btn', 'btn-danger', 'btn-sm');
                rejectButton.textContent = 'Reject';
                rejectButton.addEventListener('click', () => {
                    updateStatus(company.companyId, 'Rejected');
                    alert('Company has been rejected!');
                });
                rejectButtonCell.appendChild(rejectButton);
                row.appendChild(rejectButtonCell);

                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Failed to fetch company data:', error);
        });
}

// Function to update the status of a company
function updateStatus(companyId, newStatus) {
    fetch(`/companyAccount/${companyId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Status updated:', data);
            pendingTable();
            viewCompanyTable();
        })
        .catch(error => {
            console.error('Failed to update status:', error);
        });
}

function searchPendingTable() {
    const searchInput = document.getElementById('companyPendingSearch');
    const searchText = searchInput.value.toLowerCase();

    fetch('/companyAccount')
        .then(response => response.json())
        .then(datas => {

            const filteredCompanies = datas.filter(company =>
                (company.status === 'Processing') &&
                (company.companyId.toString().includes(searchText)
                || company.companyName.toLowerCase().includes(searchText)
                || company.companyRegistrationNo.toLowerCase().includes(searchText))
            );
            const tableBody = document.querySelector('#pendingTable tbody');
            tableBody.innerHTML = '';

            filteredCompanies.forEach(company => {
                const row = document.createElement('tr');

                const companyIdCell = document.createElement('td');
                companyIdCell.textContent = company.companyId;
                row.appendChild(companyIdCell);

                const companyNameCell = document.createElement('td');
                companyNameCell.textContent = company.companyName;
                row.appendChild(companyNameCell);

                const companyRegistrationNoCell = document.createElement('td');
                companyRegistrationNoCell.textContent = company.companyRegistrationNo;
                row.appendChild(companyRegistrationNoCell);

                const companySizeCell = document.createElement('td');
                companySizeCell.textContent = company.companySize;
                row.appendChild(companySizeCell);

                const companyAddressCell = document.createElement('td');
                companyAddressCell.textContent = company.companyAddress;
                row.appendChild(companyAddressCell);

                const companyStatusCell = document.createElement('td');
                companyStatusCell.textContent = company.status;
                row.appendChild(companyStatusCell);

                // Create Accept button
                const buttonCell = document.createElement('td');
                const acceptButton = document.createElement('button');
                acceptButton.classList.add('btn', 'btn-success', 'btn-sm');
                acceptButton.textContent = 'Accept';
                acceptButton.addEventListener('click', () => {
                    updateStatus(company.companyId, 'Accepted');
                    alert('Company has been accepted!');
                });
                buttonCell.appendChild(acceptButton);

                // Create Reject button
                const rejectButton = document.createElement('button');
                rejectButton.classList.add('btn', 'btn-danger', 'btn-sm');
                rejectButton.textContent = 'Reject';
                rejectButton.addEventListener('click', () => {
                    updateStatus(company.companyId, 'Rejected');
                    alert('Company has been rejected!');
                });
                buttonCell.appendChild(rejectButton);
                row.appendChild(buttonCell);

                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Failed to fetch company data:', error);
        });
}


viewCompanyTable();
pendingTable();
searchInput_pending = document.getElementById('companyPendingSearch');
searchInput_pending.addEventListener('input', searchPendingTable);
searchInput_manage = document.getElementById('companySearch');
searchInput_manage.addEventListener('input', searchManageCompanies);
