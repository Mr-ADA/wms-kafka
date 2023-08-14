const script = document.createElement('script');
script.src = '/node_modules/quagga/dist/quagga.js';
script.type = 'text/javascript';
document.body.appendChild(script);

// Quagga initialization function
function initializeQuagga() {
  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: document.getElementById("scanner"), // <video> element ID
    },
    decoder: {
      readers: ["code_39_reader"], // Only use Code 39 reader
    },
  }, function (err) {
    if (err) {
      console.error("Error initializing Quagga:", err);
      return;
    }
    console.log("Quagga initialized and ready.");
    Quagga.start(); // Start the scanner after initialization
  });

  // Quagga scanner event listener
  Quagga.onDetected(function (result) {
    const detectedBarcode = result.codeResult.code;
    const skuInput = document.getElementById('scanSKU');

    console.log("Detected barcode:", detectedBarcode);
    skuInput.value = detectedBarcode;
    Quagga.stop();

    if (skuInput.value.trim() !== '') {
      const backButton = document.getElementById('backButton');
      backButton.click();
    }
  });
}

// Add a click event listener to the "Scan" button to trigger scanning
const scanButton = document.getElementById('scanButton');
scanButton.addEventListener('click', function () {
  // Reset the scanned barcode field and start the scanner again
  const skuInput = document.getElementById('scanSKU');
  skuInput.value = '';
  initializeQuagga();
});

script.onload = function () {
  initializeQuagga(); 
};