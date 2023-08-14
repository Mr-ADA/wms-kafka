const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
const companyName = loggedInUser.employee.companyName;
const companyRegistrationNo = loggedInUser.employee.companyRegistrationNo;
document.getElementById('navTitle').innerHTML = companyName;

function calculatePickingStatus(products) {
    const allOngoing = products.every((product) => product.pickingStatus === 'Ongoing');
    const hasPicked = products.some((product) => product.pickingStatus === 'Picked');
    const allPicked = products.every((product) => product.pickingStatus === 'Picked');

    if (allPicked) {
        return 'Completed';
    } else if (allOngoing) {
        return 'Available';
    } else if (hasPicked) {
        return 'Ongoing';
    }
}

function populateTable(groupedData) {
    const tableBody = document.querySelector('#viewPickingListTable tbody');
    tableBody.innerHTML = "";

    for (const pickingId in groupedData) {
        const products = groupedData[pickingId];
        const pickingStatus = calculatePickingStatus(products);
        const row = document.createElement('tr');
        const pickingIdCell = document.createElement('td');
        const pickingStatusCell = document.createElement('td');
        const modalButtonCell = document.createElement('td');
        const modalTitle = document.getElementById('pickingModalTitle');

        pickingIdCell.textContent = pickingId;
        pickingStatusCell.textContent = pickingStatus;

        if (pickingStatusCell.textContent == "Available") {
            pickingStatusCell.style.color = 'orange';
            pickingStatusCell.style.fontWeight = 'bold';
        }
        else if (pickingStatusCell.textContent == "Ongoing") {
            pickingStatusCell.style.color = 'red';
            pickingStatusCell.style.fontWeight = 'bold';
        }
        else {
            pickingStatusCell.style.color = 'green';
            pickingStatusCell.style.fontWeight = 'bold';
        }

        const modalButton = document.createElement('button');
        modalButton.setAttribute('type', 'button');
        modalButton.setAttribute('class', 'btn btn-primary');
        modalButton.setAttribute('data-bs-toggle', 'modal');
        modalButton.setAttribute('data-bs-target', '#exampleModal');
        modalButton.textContent = 'View List';

        modalButton.addEventListener('click', function () {
            document.getElementById('scanSKU').value = '';
            modalTitle.textContent = pickingIdCell.textContent;
            const productsForPickingId = groupedData[pickingId];
            function populateModalTable(products) {

                const modalTableBody = document.querySelector('#viewSinglePickingList tbody');
                modalTableBody.innerHTML = "";

                products.forEach(product => {
                    const row = modalTableBody.insertRow();

                    const pickLocationCell = row.insertCell();
                    pickLocationCell.textContent = product.productLocation;

                    const qtyCell = row.insertCell();
                    qtyCell.textContent = product.pickingQuantity;

                    const skuCell = row.insertCell();
                    skuCell.textContent = product.productSku;

                    const productNameCell = row.insertCell();
                    productNameCell.textContent = product.productName;

                    const pickedStatusCell = row.insertCell();
                    pickedStatusCell.textContent = product.pickingStatus;
                });
            }
            populateModalTable(productsForPickingId);
        });

        modalButtonCell.appendChild(modalButton);
        row.appendChild(pickingIdCell);
        row.appendChild(pickingStatusCell);
        row.appendChild(modalButtonCell); 
        tableBody.appendChild(row);
    }

    const pickButton = document.getElementById('pickButton');
    pickButton.addEventListener('click', function () {
        const pickingId = document.getElementById('pickingModalTitle').textContent;
        const productSku = document.getElementById('scanSKU').value;
        const pickingQuantity = parseInt(document.getElementById('scanQuantity').value);
        const scanQuantityInput = document.getElementById('scanQuantity');

        if (pickingId == '' || productSku == '' || pickingQuantity == '') {
            alert("Please Fill in Empty Field!");
        }
        else {
            const updateData = {
                companyRegistrationNo,
                pickingId,
                productSku,
                pickingQuantity,
            };
            fetch('/pickingList/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            })
                .then((response) => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        if (response.status === 404) {
                            throw new Error('Invalid input or already picked.');
                        } else {
                            throw new Error('Failed to update picking.');
                        }
                    }
                })
                .then((updatedPicking) => {
                    alert('Item Successfully Picked!');
                    $('#exampleModal').modal('hide');
                    scanQuantityInput.value = '';
                    fetchPickingListData(companyRegistrationNo);
                })
                .catch((error) => {
                    // Handle errors here
                    console.error('Error updating picking:', error);
                });
        }
    });
}

function fetchPickingListData(registrationNo) {
    return fetch(`/pickingList/${registrationNo}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            // Process the data as needed
            const groupedData = groupByPickingId(data);
            populateTable(groupedData);
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
            throw error;
        });
}

// Function to group the data by picking ID
function groupByPickingId(data) {
    const groupedData = {};
    data.forEach((item) => {
        if (!groupedData[item.pickingId]) {
            groupedData[item.pickingId] = [];
        }
        groupedData[item.pickingId].push(item);
    });
    return groupedData;
}

fetchPickingListData(companyRegistrationNo);

//Start Camera and Ask permission to access camera
function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function (stream) {
            var video = document.getElementById("scanner");
            video.srcObject = stream;
            video.play();
        })
        .catch(function (error) {
            console.error("Error accessing the camera:", error);
        });
}


function searchPickingList() {
    const searchInput = document.getElementById('pickingListSearch');
    const searchText = searchInput.value.trim().toLowerCase();

    fetch(`/pickingList/${companyRegistrationNo}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            const filteredData = data.filter(item => {

                const pickingIdCell = document.createElement('td');
                pickingIdCell.textContent = item.pickingId;
                const pickingStatusCell = document.createElement('td');
                pickingStatusCell.textContent = calculatePickingStatus([item]); 

                return (
                    pickingIdCell.textContent.toString().toLowerCase().includes(searchText) ||
                    pickingStatusCell.textContent.toLowerCase().includes(searchText)
                );
            });

            const groupedData = groupByPickingId(filteredData);
            populateTable(groupedData);
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
        });
}
const searchInput = document.getElementById('pickingListSearch');
searchInput.addEventListener('input', searchPickingList);