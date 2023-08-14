// Wait for the DOM to be ready
$(document).ready(function () {
  $('#submit').click(function (event) {
    event.preventDefault();

    // Get the form input values
    const username = $('input[name="username"]').val();
    const password = $('input[name="password"]').val();
    const roleSelect = document.getElementById('roleSelect');
    const selectedRole = roleSelect.value;

    if (!validator.isLength(username, { min: 1 })) {
      alert('Username is required.');
      return;
    }

    if (!validator.isLength(password, { min: 1 })) {
      alert('Password is required.');
      return;
    }

    var formData = {
      companyRegistrationNo: $('input[name="username"]').val(),
      password: $('input[name="password"]').val()
    };
    var formData2 = {
      employeeEmail: $('input[name="username"]').val(),
      employeePassword: $('input[name="password"]').val()
    };
    var formData3 = {
      adminEmail: $('input[name="username"]').val(),
      password: $('input[name="password"]').val()
    };

    if (selectedRole === "Company Admin") {
      // Send an AJAX POST request to the server's login route
      fetch('/companyAccount/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
        .then(response => response.json())
        .then(data => {
          if (data.message === 'Login successful') {
            alert('Login successful');
            sessionStorage.setItem('loggedInUser', JSON.stringify(data));
            window.location.href = '/companyadmins';
          } else {
            console.log('Login failed:', data.message);
            alert('Login failed. Please check your credentials.');
          }
        })
        .catch(error => {
          console.error(error);
          alert('Login failed. Please check your credentials.');
        });
    }


    else if (selectedRole === "Company Employee") {
      fetch('/companyAdmin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData2)
      })
        .then(response => response.json())
        .then(data => {
          if (data.message === 'Login successful') {
            alert('Login successsful');
            sessionStorage.setItem('loggedInUser', JSON.stringify(data));
            // Redirect to the desired page
            employeeRole = data.employee.employeeRole;
            if (employeeRole === "Inbound Manager") {
              window.location.href = '/inboundmanager';
            }
            else if (employeeRole === "Outbound Manager") {
              window.location.href = '/outboundmanager';
            }
            else if (employeeRole === "Inventory Admin") {
              window.location.href = '/inventoryadmin';
            }
            else if (employeeRole === "Put-Away Employee") {
              window.location.href = '/putawayemployee';
            }

          } else {
            console.log('Login failed:', data.message);
            alert('Login failed. Please check your credentials.');
          }
        })
        .catch(error => {
          console.error(error);
          alert('Login failed. Please check your credentials.');
        });
    }
    else {
      fetch('/superAdmin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData3)
      })
        .then(response => response.json())
        .then(data => {
          if (data.message === 'Login successful') {
            alert('Login successful');
            window.location.href = '/admin';
          } else {
            console.log('Login failed:', data.message);
            alert('Login failed. Please check your credentials.');
          }
        })
        .catch(error => {
          console.error(error);
          alert('Login failed. Please check your credentials.');
        });
    }
  });
});

