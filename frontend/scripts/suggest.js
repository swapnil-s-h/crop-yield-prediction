document.addEventListener('DOMContentLoaded', function() {
    const suggestButton = document.getElementById('suggest-crops-btn');
    const suggestionsDiv = document.getElementById('suggestions');

    suggestButton.addEventListener('click', async () => {
        const lat = parseFloat(document.getElementById('latitude').value);
        const lon = parseFloat(document.getElementById('longitude').value);
        const seasonCode = parseInt(document.getElementById('season').value);

        if (isNaN(lat) || isNaN(lon) || isNaN(seasonCode)) {
            suggestionsDiv.innerHTML = `<div class="alert alert-danger">Please fill all fields properly!</div>`;
            return;
        }

        try {
            // Step 1: Fetch Soil + Weather first
            const soilWeatherResponse = await fetch('http://127.0.0.1:8000/get_weather_soil', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ latitude: lat, longitude: lon })
            });

            const soilWeatherData = await soilWeatherResponse.json();

            localStorage.setItem('soilWeather', JSON.stringify(soilWeatherData));

            // Step 2: Suggest crops based on soil/weather/season
            const suggestResponse = await fetch('http://127.0.0.1:8000/suggest_crops', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    season_code: seasonCode,
                    rainfall_mm: soilWeatherData.weather_data.rainfall_mm,
                    temperature_celsius: soilWeatherData.weather_data.temperature_celsius,
                    zn_percent: soilWeatherData.soil_data.zn_percent,
                    fe_percent: soilWeatherData.soil_data.fe_percent,
                    cu_percent: soilWeatherData.soil_data.cu_percent,
                    mn_percent: soilWeatherData.soil_data.mn_percent,
                    b_percent: soilWeatherData.soil_data.b_percent,
                    s_percent: soilWeatherData.soil_data.s_percent
                })
            });

            const suggestData = await suggestResponse.json();

            localStorage.setItem('suggestedCrops', JSON.stringify(suggestData.suggested_crops));

            if (suggestData.suggested_crops.length === 0) {
                suggestionsDiv.innerHTML = `<div class="alert alert-warning">No suitable crops found for these conditions.</div>`;
                return;
            }

            // Step 3: Display Suggestions
            suggestionsDiv.innerHTML = `<h4>Recommended Crops:</h4>`;

            suggestData.suggested_crops.forEach(crop => {
                const card = `
                    <div class="card mt-3 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">${crop.crop}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">Score: ${crop.score}</h6>
                            <ul>
                                ${crop.reasons.map(r => `<li>${r}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `;
                suggestionsDiv.innerHTML += card;
            });

        } catch (error) {
            suggestionsDiv.innerHTML = `<div class="alert alert-danger">Error suggesting crops!</div>`;
        }
    });
});
