// frontend/scripts/map.js

const map = L.map('map').setView([20.5937, 78.9629], 5); // Centered on India

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Listen to map click
map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    alert(`You picked Latitude: ${lat.toFixed(4)}, Longitude: ${lng.toFixed(4)}`);
    // Later you can send lat/lon to backend to auto-fetch district/weather!
});
