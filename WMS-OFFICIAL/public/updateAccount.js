function populateUpdateProfileModal(employeeId) {
    fetch(`/companyAdmin/${employeeId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 404) {
                throw new Error('Employee not found.');
            } else {
                throw new Error('Failed to fetch employee data.');
            }
        })
        .then(data => {
            document.getElementById('profileEmployeeName').value = data.employeeName;
            document.getElementById('profileEmployeeEmail').value = data.employeeEmail;
            document.getElementById('profileEmployeeAddress').value = data.employeeAddress;
            document.getElementById('profileEmployeeDob').value = data.employeeDOB;
            document.getElementById('profileEmployeePhoneNo').value = data.employeePhoneNo;
            document.getElementById('profileEmployeePassword').value = '';

        })
        .catch(error => {
            alert(error.message); // Display the error message
            console.error('Error:', error);
        });
}
populateUpdateProfileModal(loggedInUser.employee.employeeId);


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
    const employeeName = document.getElementById('profileEmployeeName').value;
    const employeeEmail = document.getElementById('profileEmployeeEmail').value;
    const employeeAddress = document.getElementById('profileEmployeeAddress').value;
    const employeeDOB = document.getElementById('profileEmployeeDob').value;
    const employeePhoneNo = document.getElementById('profileEmployeePhoneNo').value;
    const password = document.getElementById('profileEmployeePassword').value;


    if (!validator.isLength(employeeName, { min: 1 })) {
        alert('Employee Name is required.');
        return;
    }

    if (!validator.isLength(employeeEmail, { min: 1 })) {
        alert('Employee Email is required.');
        return;
    }

    if (!validator.isLength(employeeAddress, { min: 1 })) {
        alert('Employee Address is required.');
        return;
    }

    if (!validator.isDate(employeeDOB, { format: 'DD-MM-YY' })) {
        alert('Invalid Date Of Birth. Please use the format DD-MM-YY.');
        return;
    }

    if (!validator.isNumeric(employeePhoneNo) || !validator.isLength(employeePhoneNo, { min: 8, max: 8 })) {
        alert('Phone Number must be 8 digits (numbers only).');
        return;
    }

    if (!validator.isLength(password, { min: 8 })) {
        alert('Password must be at least 8 characters long.');
        return;
    }
    // Hash the password before sending it to the server
    hashPassword(password)
        .then(hashedPassword => {
            const employeeData = {
                employeeName,
                employeeEmail,
                employeeAddress,
                employeeDOB,
                employeePhoneNo,
                employeePassword: hashedPassword,
            };
            fetch(`/companyAdmin/${loggedInUser.employee.employeeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(employeeData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update account.');
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
                alert('Employee Account Updated Successfully!');
                populateUpdateProfileModal(loggedInUser.employee.employeeId);
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