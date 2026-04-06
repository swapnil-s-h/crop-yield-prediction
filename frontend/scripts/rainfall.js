document.addEventListener('DOMContentLoaded', function() {
    const fetchButton = document.getElementById('fetch-rainfall');
    const resultDiv = document.getElementById('rainfall-result');

    fetchButton.addEventListener('click', async () => {
        const lat = parseFloat(document.getElementById('latitude').value);
        const lon = parseFloat(document.getElementById('longitude').value);

        if (isNaN(lat) || isNaN(lon)) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Please enter valid latitude and longitude!</div>`;
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/get_rainfall', {
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
                <div class="alert alert-info">
                    <h5>Rainfall Information</h5>
                    <p class="text-white"><strong>Detected State:</strong> ${result.state_detected}</p>
                    <p class="text-white"><strong>Annual Rainfall:</strong> ${result.rainfall_mm} mm/year</p>
                    <p class="text-white"><strong>Data Source:</strong> ${result.source || 'Not specified'}</p>
                </div>
            `;

            // Save to localStorage
            localStorage.setItem('rainfallData', JSON.stringify(result));

        } catch (error) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Error fetching Rainfall data!</div>`;
        }
    });
});

/*
The below code is updated code
*/

document.addEventListener('DOMContentLoaded', function () {
    const viewMode = document.getElementById('viewMode');
    const yearInput = document.getElementById('yearInput');
    const chartCtx = document.getElementById('rainChart').getContext('2d');
    let rainChart = null;
    let currentState = null;

    // Watch map click from previous logic to store state
    map.on('click', async function (e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        const response = await fetch("http://127.0.0.1:8000/get_rainfall", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: lat, longitude: lon })
        });

        const data = await response.json();
        if (data?.region_used) {
            currentState = data.region_used.split(',')[0].trim();
        }
    });

    viewMode.addEventListener('change', () => {
        yearInput.disabled = viewMode.value === "year";
    });

    async function fetchStats() {
        const mode = viewMode.value;
        const payload = { mode };

        if (mode === "month") {
            payload.year = parseInt(yearInput.value);
        } else if (mode === "year") {
            if (!currentState) return alert("Click on the map to detect a state first.");
            payload.state = currentState;
        }

        const res = await fetch("http://127.0.0.1:8000/get_rainfall_stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const stats = await res.json();
        renderChart(stats);
    }

    function renderChart(data) {
        if (rainChart) rainChart.destroy();

        const commonOptions = {
            scales: {
                x: {
                    ticks: {
                        color: "#000000"  // white X-axis labels
                    }
                },
                y: {
                    ticks: {
                        color: "#000000"  // white Y-axis labels
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: "#000000"  // white legend text
                    }
                }
            }
        };

        if (data.mode === "month") {
            const labels = Object.keys(data.monthly_avg);
            const values = Object.values(data.monthly_avg);

            rainChart = new Chart(chartCtx, {
                type: "bar",
                data: {
                    labels,
                    datasets: [{
                        label: `Avg Monthly Rainfall (${data.year})`,
                        data: values,
                        backgroundColor: "rgba(54, 162, 235, 0.6)",
                    }]
                },
                options: commonOptions
            });

        } else if (data.mode === "year") {
            const labels = Object.keys(data.yearly_rainfall);
            const values = Object.values(data.yearly_rainfall);

            rainChart = new Chart(chartCtx, {
                type: "line",
                data: {
                    labels,
                    datasets: [{
                        label: `Annual Rainfall in ${data.state}`,
                        data: values,
                        borderColor: "green",
                        fill: false,
                    }]
                },
                options: commonOptions
            });
        }
    }

    // Auto fetch on load
    document.getElementById("viewMode").addEventListener("change", fetchStats);
    document.getElementById("yearInput").addEventListener("change", fetchStats);
    fetchStats(); // initial
});

