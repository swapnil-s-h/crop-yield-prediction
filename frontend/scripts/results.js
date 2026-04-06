document.addEventListener('DOMContentLoaded', function () {
    const summaryDiv = document.getElementById('summary');

    const predictedYield = localStorage.getItem('predictedYield');
    const soilWeather = JSON.parse(localStorage.getItem('soilWeather') || '{}');
    const rainfallData = JSON.parse(localStorage.getItem('rainfallData') || '{}');  
    const suggestedCrops = JSON.parse(localStorage.getItem('suggestedCrops') || '[]');
    const shapExplanation = JSON.parse(localStorage.getItem('shapExplanation') || '{}');

    if (!predictedYield && !soilWeather && !rainfallData && suggestedCrops.length === 0) {
        summaryDiv.innerHTML = `<div class="alert alert-danger">No results found! Please complete the steps first.</div>`;
        return;
    }

    let htmlContent = '';

    if (predictedYield) {
        htmlContent += `
            <div class="col-md-6">
                <div class="card shadow">
                    <div class="card-body">
                        <h5 class="card-title">Predicted Yield</h5>
                        <p class="card-text">${predictedYield} kg/hectare</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (Object.keys(soilWeather).length > 0) {
        htmlContent += `
            <div class="col-md-6">
                <div class="card shadow">
                    <div class="card-body">
                        <h5 class="card-title">Soil and Weather Data</h5>
                        <ul>
                            <li><strong>District:</strong> ${soilWeather.district_detected}</li>
                        </ul>

                        <h6 class="mt-3">Soil Nutrients (%):</h6>
                        <ul>
                            <li><strong>Zinc (Zn):</strong> ${soilWeather.soil_data.zn_percent}</li>
                            <li><strong>Iron (Fe):</strong> ${soilWeather.soil_data.fe_percent}</li>
                            <li><strong>Copper (Cu):</strong> ${soilWeather.soil_data.cu_percent}</li>
                            <li><strong>Manganese (Mn):</strong> ${soilWeather.soil_data.mn_percent}</li>
                            <li><strong>Boron (B):</strong> ${soilWeather.soil_data.b_percent}</li>
                            <li><strong>Sulfur (S):</strong> ${soilWeather.soil_data.s_percent}</li>
                        </ul>

                        <h6 class="mt-3">Weather Data:</h6>
                        <ul>
                            <li><strong>Temperature:</strong> ${soilWeather.weather_data.temperature_celsius} °C</li>
                            <li><strong>Rainfall:</strong> ${soilWeather.weather_data.rainfall_mm} mm/year</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    //Rainfall-only section
    if (Object.keys(rainfallData).length > 0) {
        htmlContent += `
            <div class="col-md-6">
                <div class="card shadow">
                    <div class="card-body">
                        <h5 class="card-title">Rainfall Data</h5>
                        <ul>
                            <li><strong>District:</strong> ${rainfallData.district_detected}</li>
                            <li><strong>Annual Rainfall:</strong> ${rainfallData.rainfall_mm} mm/year</li>
                            ${rainfallData.source ? `<li><strong>Source:</strong> ${rainfallData.source}</li>` : ''}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    if (suggestedCrops.length > 0) {
        htmlContent += `
            <div class="col-12">
                <h4 class="mt-4">Suggested Crops:</h4>
            </div>
        `;

        suggestedCrops.forEach(crop => {
            htmlContent += `
                <div class="col-md-4">
                    <div class="card shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">${crop.crop}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">Score: ${crop.score}</h6>
                            <ul>
                                ${crop.reasons.map(reason => `<li>${reason}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    if (Object.keys(shapExplanation).length > 0) {
        htmlContent += `
            <div class="col-12">
                <h4 class="mt-4">Feature Impact (SHAP Explanation):</h4>
                <ul>
                    ${Object.entries(shapExplanation).map(([feature, value]) => `<li><strong>${feature}:</strong> ${value}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    summaryDiv.innerHTML = htmlContent;
});
