// frontend/scripts/weather.js

document.addEventListener('DOMContentLoaded', function() {
    const fetchButton = document.getElementById('fetch-soil-weather');
    const resultDiv = document.getElementById('soil-weather-result');

    fetchButton.addEventListener('click', async () => {
        const lat = parseFloat(document.getElementById('latitude').value);
        const lon = parseFloat(document.getElementById('longitude').value);

        if (isNaN(lat) || isNaN(lon)) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Please enter valid latitude and longitude!</div>`;
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/get_weather_soil', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ latitude: lat, longitude: lon })
            });

            const result = await response.json();

            if (result.error) {
                resultDiv.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
                return;
            }

            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <h5>Detected Details:</h5>
                    <p><strong>District:</strong> ${result.district_detected}</p>
                    <h6 class="mt-3">Soil Nutrients (%):</h6>
                    <ul>
                        <li><strong>Zinc (Zn):</strong> ${result.soil_data.zn_percent}</li>
                        <li><strong>Iron (Fe):</strong> ${result.soil_data.fe_percent}</li>
                        <li><strong>Copper (Cu):</strong> ${result.soil_data.cu_percent}</li>
                        <li><strong>Manganese (Mn):</strong> ${result.soil_data.mn_percent}</li>
                        <li><strong>Boron (B):</strong> ${result.soil_data.b_percent}</li>
                        <li><strong>Sulfur (S):</strong> ${result.soil_data.s_percent}</li>
                    </ul>
                    <h6 class="mt-3">Weather Data:</h6>
                    <ul>
                        <li><strong>Temperature:</strong> ${result.weather_data.temperature_celsius} °C</li>
                        <li><strong>Rainfall:</strong> ${result.weather_data.rainfall_mm} mm/year</li>
                    </ul>
                </div>
            `;

            // Save to localStorage
            localStorage.setItem('soilWeather', JSON.stringify(result));

        } catch (error) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Error fetching details!</div>`;
        }
    });
});
