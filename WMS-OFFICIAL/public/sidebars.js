/* global bootstrap: false */
(() => {
  'use strict'
  const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.forEach(tooltipTriggerEl => {
    new bootstrap.Tooltip(tooltipTriggerEl)
  })
})()


// Function to handle the logout action
function logout() {
  // Clear session storage or local storage
  sessionStorage.clear(); // Use this if you want to clear session storage
  // localStorage.clear(); // Use this if you want to clear local storage

  // Redirect the user to the login page or homepage
  window.location.href = "/"; // Replace with the desired URL
}

// Attach the logout function to the "Sign out" link
document.getElementById("logoutLink").addEventListener("click", logout);
