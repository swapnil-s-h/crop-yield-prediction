# Crop Yield Prediction System

A full-stack machine learning application that predicts crop yields using historical data and environmental factors. The system provides geolocation-based soil and weather analysis, crop recommendations based on seasonal and environmental conditions, and interactive rainfall analytics.

## Features

- **Crop Yield Prediction**: XGBoost-based ML model predicting crop yields (kg/hectare) with SHAP explainability
- **Geolocation Integration**: Automatic detection of district/state using coordinates via Nominatim API
- **Soil Analysis**: Real-time soil composition data retrieval by location
- **Weather Data**: Temperature and rainfall simulation for crop suitability analysis
- **Crop Suggestions**: Intelligent crop recommendations based on season, rainfall, temperature, and soil conditions
- **Rainfall Analytics**: Monthly and yearly rainfall statistics for different states/regions
- **Interactive Maps**: Map visualization for location-based queries
- **Model Interpretability**: SHAP values explain feature contributions to predictions

## Tech Stack

**Backend:**

- FastAPI
- XGBoost (ML Model)
- SHAP (Explainability)
- Pandas, NumPy (Data Processing)
- Scikit-learn (Preprocessing)
- Requests (API Calls)

**Frontend:**

- HTML5, CSS3
- JavaScript (Vanilla)
- Leaflet.js (Maps)

**APIs:**

- Nominatim (Reverse Geolocation)

## Project Structure

```
Crop_Prediction_Modified/
├── backend/
│   ├── api.py                          # FastAPI application with all endpoints
│   ├── main.py                         # Model training and evaluation script
│   ├── crop_yield_xgb_model.pkl        # Pre-trained XGBoost model
│   ├── crop_production.csv             # Training data
│   ├── crop_info.csv                   # Crop metadata (season, rainfall, temp requirements)
│   ├── soil.csv                        # Soil composition by district
│   ├── rainfall.csv                    # Historical rainfall data by state
│   └── requirements.txt                # Python dependencies
├── frontend/
│   ├── index.html                      # Home page
│   ├── predict.html                    # Yield prediction interface
│   ├── suggest.html                    # Crop suggestion interface
│   ├── weather.html                    # Weather data page
│   ├── rainfall.html                   # Rainfall analytics page
│   ├── map.html                        # Interactive map
│   ├── results.html                    # Results display page
│   ├── style.css, predict.css, home.css, rainfall.html  # Styling
│   ├── scripts/
│   │   ├── common.js                   # Shared utilities
│   │   ├── predict.js                  # Prediction logic
│   │   ├── suggest.js                  # Crop suggestion logic
│   │   ├── weather.js                  # Weather data fetching
│   │   ├── rainfall.js                 # Rainfall analytics
│   │   ├── map.js                      # Map interactions
│   │   ├── crops.js                    # Crop data handling
│   │   └── results.js                  # Results rendering
│   └── static/
│       └── images/                     # Project images/assets
└── README.md
```

## Prerequisites

- **Python 3.8+**
- **Node.js** (optional, for local development server)
- **pip** (Python package manager)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/swapnil-s-h/crop-yield-prediction.git
```

### 2. Set Up Backend

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment:

- **Windows:**
  ```bash
  venv\Scripts\activate
  ```
- **Linux/Mac:**
  ```bash
  source venv/bin/activate
  ```

Install dependencies:

```bash
pip install -r requirements.txt
```

## Running the Project

### Start the Backend Server

From the `backend` directory with the virtual environment activated:

```bash
uvicorn api:app --reload
```

The API will start at `http://127.0.0.1:8000`

**API Documentation** (interactive Swagger UI): `http://127.0.0.1:8000/docs`

### Access the Frontend

1. Open `frontend/index.html` in your web browser, or
2. Use a local development server:
   ```bash
   cd frontend
   python -m http.server 8000
   ```
   Then navigate to `http://127.0.0.1:8000`

## API Endpoints

### Prediction

- **POST** `/predict` - Predict crop yield
  - Input: State_Code, District_Code, Crop_Code, Season_Code, Crop_Year, Area
  - Output: Predicted yield (kg/hectare) + SHAP explanations

### Location-Based Data

- **POST** `/get_weather_soil` - Get weather and soil data by coordinates
  - Input: latitude, longitude
  - Output: District, soil composition, simulated weather

### Crop Suggestions

- **POST** `/suggest_crops` - Get crop recommendations
  - Input: season_code, rainfall_mm, temperature_celsius, soil nutrients
  - Output: Top 3 recommended crops with scores

### Rainfall Analytics

- **POST** `/get_rainfall` - Get rainfall data by location
  - Input: latitude, longitude
  - Output: Annual and monthly rainfall for detected state

- **POST** `/get_rainfall_stats` - Get rainfall statistics
  - Mode: "month" (for year) or "year" (for state)
  - Output: Monthly or yearly rainfall data

## Usage Example

### 1. Get Weather & Soil Data

```javascript
const location = { latitude: 19.076, longitude: 72.8777 }; // Mumbai
fetch("http://127.0.0.1:8000/get_weather_soil", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(location),
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

### 2. Get Crop Suggestions

```javascript
const conditions = {
  season_code: 0,
  rainfall_mm: 800,
  temperature_celsius: 28,
  zn_percent: 83.1,
  fe_percent: 87.06,
  cu_percent: 94.84,
  mn_percent: 85.05,
  b_percent: 4.08,
  s_percent: 5.63,
};

fetch("http://127.0.0.1:8000/suggest_crops", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(conditions),
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

### 3. Predict Crop Yield

```javascript
const cropInput = {
  State_Code: 5,
  District_Code: 10,
  Crop_Code: 1,
  Season_Code: 0,
  Crop_Year: 2023,
  Area: 100,
};

fetch("http://127.0.0.1:8000/predict", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(cropInput),
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

## Model Details

- **Algorithm**: XGBoost Regressor
- **Features**: State, District, Crop, Season, Year, Area
- **Target**: Crop Yield (kg/hectare)
- **Explainability**: SHAP (SHapley Additive exPlanations) for feature importance
- **Training**: Historical crop production data with 80/20 train-test split

## Data Files

- **crop_production.csv**: Historical crop production records
- **crop_info.csv**: Crop metadata (optimal temperature, rainfall requirements, best season)
- **soil.csv**: Soil nutrient composition by district
- **rainfall.csv**: Historical rainfall data by state and season

## Development

To retrain the model, run:

```bash
cd backend
python main.py
```

This will:

1. Load and preprocess data
2. Train a new XGBoost model
3. Evaluate performance (MAE, R² score)
4. Save model as `crop_yield_xgb_model.pkl`
5. Generate SHAP visualizations
