// frontend/scripts/predict.js

document.addEventListener('DOMContentLoaded', function () {
    const cropSelect = document.getElementById('crop');

    // Clear existing options
    cropSelect.innerHTML = '<option value="">Select Crop</option>';
    let count = 0;

    cropList.forEach(crop => {
        const option = document.createElement('option');
        option.value = count;
        option.textContent = crop;
        cropSelect.appendChild(option);
        count++;
    });
});


document.getElementById('predict-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const stateCode = parseInt(document.getElementById('state').value);
    const districtCode = parseInt(document.getElementById('district').value);
    const cropCode = parseInt(document.getElementById('crop').value);
    const seasonCode = parseInt(document.getElementById('season').value);
    const cropYear = parseInt(document.getElementById('crop_year').value);
    const area = parseFloat(document.getElementById('area').value);

    const data = {
        State_Code: stateCode,
        District_Code: districtCode,
        Crop_Code: cropCode,
        Season_Code: seasonCode,
        Crop_Year: cropYear,
        Area: area
    };

    try {
        console.log(data)
        const response = await fetch('http://127.0.0.1:8000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        localStorage.setItem('predictedYield', result.predicted_yield_kg_per_hectare);
        localStorage.setItem('shapExplanation', JSON.stringify(result.shap_explanation));
        document.getElementById('result').style.display = 'block';
        document.getElementById('result').textContent = `Predicted Yield: ${result.predicted_yield_kg_per_hectare} kg/hectare`;
    } catch (error) {
        document.getElementById('result').style.display = 'block';
        document.getElementById('result').textContent = 'Error: ' + error;
    }
});
