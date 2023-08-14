const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
companyId = loggedInUser.company.companyId;
companyName = loggedInUser.company.companyName;
companyAddress = loggedInUser.company.companyAddress;
companyRegistrationNo = loggedInUser.company.companyRegistrationNo;
companySize = loggedInUser.company.companySize;
document.getElementById('companyName').innerHTML = companyName;
document.getElementById('profileCompanyRegNo').value = companyRegistrationNo;


function populateUpdateProfileModal(companyRegistrationNo) {
    fetch(`/companyAccount/${companyRegistrationNo}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 404) {
                throw new Error('Company not found.');
            } else {
                throw new Error('Failed to fetch company data.');
            }
        })
        .then(data => {
            document.getElementById('profileCompanyName').value = data.companyName;
            document.getElementById('profileCompanyAddress').value = data.companyAddress;
            document.getElementById('profileCompanyPhoneNo').value = data.companyPhoneNumber;
            document.getElementById('profileCompanyEmail').value = data.companyEmail;
            document.getElementById('profileCompanyPassword').value = "";
        })
        .catch(error => {
            alert(error.message); // Display the error message
            console.error('Error:', error);
        });
}
populateUpdateProfileModal(companyRegistrationNo);

// Function to handle inline editing
const companyAdminHandleInlineEdit = (event, employeeId, fieldName) => {
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
            updateCompanyEmployee(employeeId, fieldName, updatedValue);
        }
    };
    inputField.addEventListener('keydown', handleKeyDown);
    cell.textContent = '';
    cell.appendChild(inputField);
    inputField.focus();
};

// Function to update an Employee field
const updateCompanyEmployee = (employeeId, fieldName, fieldValue) => {
    const updatedData = { [fieldName]: fieldValue };
    fetch(`/companyAdmin/${employeeId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            displayEmployees();
            alert('Employee updated successfully');
        })
        .catch(error => {
            console.error('Error:', error);
        });
};


// Function to delete an Employee
const deleteEmployee = (employeeId) => {
    fetch(`/companyAdmin/${employeeId}`, {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            displayEmployees();
            alert('Employee deleted successfully');
        })
        .catch(error => {
            console.error('Error:', error);
        });
};

async function hashPassword(password) {
    try {
        const response = await fetch('/hash', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        if (!response.ok) {
            throw new Error('Failed to hash password.');
        }

        const data = await response.json();
        return data.hashedPassword;
    } catch (error) {
        console.error('Error occurred during password hashing:', error);
        throw error;
    }
}

//Update function inside modal
document.getElementById('updateAccountButton').addEventListener('click', () => {
    const companyName = document.getElementById('profileCompanyName');
    const companyAddress = document.getElementById('profileCompanyAddress');
    const companyPhone = document.getElementById('profileCompanyPhoneNo');
    const companyPassword = document.getElementById('profileCompanyPassword');
    const companyEmail = document.getElementById('profileCompanyEmail');

    if (!validator.isLength(companyName.value, { min: 1 })) {
        alert('Company Name is required.');
        return;
    }

    if (!validator.isLength(companyAddress.value, { min: 1 })) {
        alert('Company Address is required.');
        return;
    }

    if (!validator.isNumeric(companyPhone.value) || !validator.isLength(companyPhone.value, { min: 8, max: 8 })) {
        alert('Company Phone Number must be 8 digits (numbers only).');
        return;
    }

    if (!validator.isLength(companyPassword.value, { min: 8 })) {
        alert('Password must be at least 8 characters long.');
        return;
    }

    // Hash the password before sending it to the server
    hashPassword(companyPassword.value)
        .then(hashedPassword => {
            const companyData = {
                companyName: companyName.value,
                companyAddress: companyAddress.value,
                companyEmail: companyEmail.value,
                companyPhoneNumber: parseInt(companyPhone.value),
                password: hashedPassword,
            };
            console.log(companyData);
            fetch(`/companyAccount/${companyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(companyData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update account.');
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
                alert('Company Account Updated Successfully!');
                populateUpdateProfileModal(companyRegistrationNo);
                $('#updateAccountModal').modal('hide');
            })
            .catch(error => {
                console.error('Error occurred during account update:', error);
                alert('Failed to update account. Please try again.');
            });
        })
        .catch(error => {
            console.error('Error occurred during password hashing:', error);
            alert('Failed to hash password. Please try again.');
        });
});


document.getElementById('submitButton').addEventListener('click', () => {
    // Get the form input values
    const employeeName = document.getElementById('employeeName');
    const employeeEmail = document.getElementById('employeeEmail');
    const employeePassword = document.getElementById('employeePassword');
    const employeeDOB = document.getElementById('employeeDOB');
    const employeePhoneNo = document.getElementById('employeePhone');
    const employeeAddress = document.getElementById('employeeAddress');
    const employeeRole = document.getElementById('employeeRole');
    const companyRegistrationNo = loggedInUser.company.companyRegistrationNo.toString();

    if (!validator.isLength(employeeName.value, { min: 1 })) {
        alert('Full Name is required.');
        return;
    }

    if (!validator.isAlpha(employeeName.value, 'en-US', { ignore: ' ' })) {
        alert('Full Name must contain letters only.');
        return;
    }

    if (!validator.isEmail(employeeEmail.value)) {
        alert('Invalid Email.');
        return;
    }

    if (!validator.isLength(employeePassword.value, { min: 8 })) {
        alert('Password must be at least 8 characters long.');
        return;
    }

    if (!validator.isDate(employeeDOB.value, { format: 'DD-MM-YY' })) {
        alert('Invalid Date Of Birth. Please use the format DD-MM-YY.');
        return;
    }

    if (!validator.isNumeric(employeePhoneNo.value) || !validator.isLength(employeePhoneNo.value, { min: 8, max: 8 })) {
        alert('Employee Phone Number must be 8 digits (numbers only).');
        return;
    }

    if (!validator.isLength(employeeAddress.value, { min: 1 })) {
        alert('Address is required.');
        return;
    }

    if (employeeRole.value === 'Select Role') {
        alert('Please select a valid role.');
        return;
    }

    // Hash the password before sending it to the server
    hashPassword(employeePassword.value)
        .then(hashedPassword => {

            const employeeData = {
                employeeName: employeeName.value,
                employeeEmail: employeeEmail.value,
                employeePassword: hashedPassword,
                employeeDOB: employeeDOB.value,
                employeePhoneNo: employeePhoneNo.value,
                employeeAddress: employeeAddress.value,
                employeeRole: employeeRole.value,
                companyRegistrationNo,
                companyName,
                companyAddress,
                companySize
            };
            //Insert account into database
            fetch('/companyAdmin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(employeeData)
            })
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                    displayEmployees();
                    alert('Inserted Successfully!');
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        })
        .catch(error => {
            console.error('Error occurred during password hashing:', error);
            alert('Failed to hash password. Please try again.');
        });
});


function displayEmployees() {
    // Fetch employee data from database
    fetch('/companyAdmin')
        .then(response => response.json())
        .then(companyAdminList => {
            const tableBody = document.querySelector('#employeeTable tbody');
            companyRegNo = loggedInUser.company.companyRegistrationNo;
            companyEmployee = companyAdminList.filter(employee => employee.companyRegistrationNo === companyRegNo);
            tableBody.innerHTML = '';

            // Iterate over the employee data and create table rows
            companyEmployee.forEach(employee => {
                const row = document.createElement('tr');
                const EmployeeIdCell = document.createElement('td');
                EmployeeIdCell.textContent = employee.employeeId;
                row.appendChild(EmployeeIdCell);

                const employeeNameCell = document.createElement('td');
                employeeNameCell.textContent = employee.employeeName;
                employeeNameCell.addEventListener('click', (event) => {
                    companyAdminHandleInlineEdit(event, employee.employeeId, 'employeeName');
                });
                row.appendChild(employeeNameCell);

                const employeeEmailCell = document.createElement('td');
                employeeEmailCell.textContent = employee.employeeEmail;
                employeeEmailCell.addEventListener('click', (event) => {
                    companyAdminHandleInlineEdit(event, employee.employeeId, 'employeeEmail');
                });
                row.appendChild(employeeEmailCell);

                const employeePhoneCell = document.createElement('td');
                employeePhoneCell.textContent = employee.employeePhoneNo;
                employeePhoneCell.addEventListener('click', (event) => {
                    companyAdminHandleInlineEdit(event, employee.employeeId, 'employeePhoneNo');
                });
                row.appendChild(employeePhoneCell);

                const employeeAddressCell = document.createElement('td');
                employeeAddressCell.textContent = employee.employeeAddress;
                employeeAddressCell.addEventListener('click', (event) => {
                    companyAdminHandleInlineEdit(event, employee.employeeId, 'employeeAddress');
                });
                row.appendChild(employeeAddressCell);

                const employeeDobCell = document.createElement('td');
                employeeDobCell.textContent = employee.employeeDOB;
                employeeDobCell.addEventListener('click', (event) => {
                    companyAdminHandleInlineEdit(event, employee.employeeId, 'employeeDOB');
                });
                row.appendChild(employeeDobCell);

                const employeeRoleCell = document.createElement('td');
                employeeRoleCell.textContent = employee.employeeRole;
                employeeRoleCell.addEventListener('click', (event) => {
                    companyAdminHandleInlineEdit(event, employee.employeeId, 'employeeRole');
                });
                row.appendChild(employeeRoleCell);

                const deleteCell = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('btn', 'btn-danger', 'delete-button');
                deleteButton.dataset.id = employee.employeeId;
                deleteButton.addEventListener('click', () => {
                    const employeeId = deleteButton.dataset.id;
                    deleteEmployee(employeeId);
                });
                deleteCell.appendChild(deleteButton);
                row.appendChild(deleteCell);
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Failed to fetch employee data:', error);
        });
}

function searchEmployees() {
    const searchInput = document.getElementById('employeeSearch');
    const searchText = searchInput.value.toLowerCase();

    fetch('/companyAdmin')
        .then(response => response.json())
        .then(companyAdminList => {
            const filteredEmployees = companyAdminList.filter(employee =>
                employee.employeeId.toString().includes(searchText) && employee.companyRegistrationNo === companyRegNo ||
                employee.employeeName.toLowerCase().includes(searchText) && employee.companyRegistrationNo === companyRegNo
            );

            const tableBody = document.querySelector('#employeeTable tbody');
            tableBody.innerHTML = '';

            // Create table rows for the filtered suppliers
            filteredEmployees.forEach(employee => {
                const row = document.createElement('tr');
                const EmployeeIdCell = document.createElement('td');
                EmployeeIdCell.textContent = employee.employeeId;
                row.appendChild(EmployeeIdCell);

                const employeeNameCell = document.createElement('td');
                employeeNameCell.textContent = employee.employeeName;
                employeeNameCell.addEventListener('click', (event) => {
                    companyAdminHandleInlineEdit(event, employee.employeeId, 'employeeName');
                });
                row.appendChild(employeeNameCell);

                const employeeEmailCell = document.createElement('td');
                employeeEmailCell.textContent = employee.employeeEmail;
                employeeEmailCell.addEventListener('click', (event) => {
                    companyAdminHandleInlineEdit(event, employee.employeeId, 'employeeEmail');
                });
                row.appendChild(employeeEmailCell);

                const employeePhoneCell = document.createElement('td');
                employeePhoneCell.textContent = employee.employeePhoneNo;
                employeePhoneCell.addEventListener('click', (event) => {
                    companyAdminHandleInlineEdit(event, employee.employeeId, 'employeePhoneNo');
                });
                row.appendChild(employeePhoneCell);

                const employeeAddressCell = document.createElement('td');
                employeeAddressCell.textContent = employee.employeeAddress;
                employeeAddressCell.addEventListener('click', (event) => {
                    companyAdminHandleInlineEdit(event, employee.employeeId, 'employeeAddress');
                });
                row.appendChild(employeeAddressCell);

                const employeeDobCell = document.createElement('td');
                employeeDobCell.textContent = employee.employeeDOB;
                employeeDobCell.addEventListener('click', (event) => {
                    companyAdminHandleInlineEdit(event, employee.employeeId, 'employeeDOB');
                });
                row.appendChild(employeeDobCell);

                const employeeRoleCell = document.createElement('td');
                employeeRoleCell.textContent = employee.employeeRole;
                employeeRoleCell.addEventListener('click', (event) => {
                    companyAdminHandleInlineEdit(event, employee.employeeId, 'employeeRole');
                });
                row.appendChild(employeeRoleCell);

                const deleteCell = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('btn', 'btn-danger', 'delete-button');
                deleteButton.dataset.id = employee.employeeId;
                deleteButton.addEventListener('click', () => {
                    const employeeId = deleteButton.dataset.id;
                    deleteEmployee(employeeId);
                });
                deleteCell.appendChild(deleteButton);
                row.appendChild(deleteCell);

                // Append the row to the table body
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Failed to fetch employee data:', error);
        });
}
displayEmployees();
searchInput = document.getElementById('employeeSearch');
searchInput.addEventListener('input', searchEmployees);
