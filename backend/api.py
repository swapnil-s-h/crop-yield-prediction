from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import joblib
import numpy as np
import shap
from fastapi import FastAPI
import pandas as pd
import random
import requests

crop_data = pd.read_csv('crop_production.csv')
crop_info = pd.read_csv('crop_info.csv')
soil_data = pd.read_csv('soil.csv')
rainfall_data = pd.read_csv("rainfall.csv")

# Load model
model = joblib.load('crop_yield_xgb_model.pkl')

# Initialize SHAP Explainer
booster = model.get_booster()
explainer = shap.TreeExplainer(booster)

# Initialize FastAPI app
app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define input format using Pydantic
class CropInput(BaseModel):
    State_Code: int
    District_Code: int
    Crop_Code: int
    Season_Code: int
    Crop_Year: int
    Area: float

# Define home route
@app.get("/")
def read_root():
    return {"message": "Crop Yield Prediction API is running!"}

@app.post("/predict")
def predict_yield(input: CropInput):
    input_array = np.array([[ 
        input.State_Code, 
        input.District_Code, 
        input.Crop_Code, 
        input.Season_Code, 
        input.Crop_Year, 
        input.Area 
    ]])

    prediction = model.predict(input_array)

    # SHAP values for explanation
    shap_values = explainer.shap_values(input_array)
    feature_names = ['State_Code', 'District_Code', 'Crop_Code', 'Season_Code', 'Crop_Year', 'Area']

    # Make SHAP explanation in readable form
    explanation = {}
    for i, name in enumerate(feature_names):
        explanation[name] = round(float(shap_values[0][i]), 2)

    return {
        "predicted_yield_kg_per_hectare": round(float(prediction[0]), 2),
        "shap_explanation": explanation
    }

class LocationInput(BaseModel):
    latitude: float
    longitude: float

# Updated get_weather_soil function
@app.post("/get_weather_soil")
def get_weather_soil(location: LocationInput):
    try:
        # Step 1: Reverse Geocode to get District
        url = f"https://nominatim.openstreetmap.org/reverse?lat={location.latitude}&lon={location.longitude}&format=json"
        response = requests.get(url, headers={'User-Agent': 'CropYieldApp'})
        data = response.json()

        address = data.get("address", {})
        district = address.get("county", "Unknown District")

        # Step 2: Search soil data by District
        if 'District' not in soil_data.columns:
            return {"error": "CSV does not contain 'District' column."}

        soil_row = soil_data[
            soil_data['District'].apply(lambda x: x.strip().lower() in district.strip().lower())
        ]

        if not soil_row.empty:
            soil_info = soil_row.iloc[0]
            zn_percent = soil_info.get('Zn')
            fe_percent = soil_info.get('Fe')
            cu_percent = soil_info.get('Cu')
            mn_percent = soil_info.get('Mn')
            b_percent = soil_info.get('B')
            s_percent = soil_info.get('S')
        else:
            zn_percent = 83.1
            fe_percent = 87.06
            cu_percent = 94.84
            mn_percent = 85.05
            b_percent = 4.08
            s_percent = 5.63

        # Step 3: Random Weather Simulation
        temperature = round(random.uniform(20, 35), 1)
        rainfall = round(random.uniform(500, 1500), 1)

        return {
            "district_detected": district,
            "soil_data": {
                "zn_percent": zn_percent,
                "fe_percent": fe_percent,
                "cu_percent": cu_percent,
                "mn_percent": mn_percent,
                "b_percent": b_percent,
                "s_percent": s_percent
            },
            "weather_data": {
                "temperature_celsius": temperature,
                "rainfall_mm": rainfall
            }
        }

    except Exception as e:
        return {"error": str(e)}


# New model to accept inputs for suggestion
class SuggestInput(BaseModel):
    season_code: int
    rainfall_mm: float
    temperature_celsius: float
    zn_percent: float
    fe_percent: float
    cu_percent: float
    mn_percent: float
    b_percent: float
    s_percent: float

@app.post("/suggest_crops")
def suggest_crops(data: SuggestInput):
    crop_info = pd.read_csv('crop_info.csv')

    season_mapping = {
        0: "Kharif",
        1: "Rabi",
        2: "Zaid"
    }
    season_now = season_mapping.get(data.season_code, "Kharif")

    crop_scores = {}

    for index, row in crop_info.iterrows():
        crop = row['Crop']

        score = 0
        reason = []

        # Season match
        if season_now.lower() in row['Best_Season'].lower():
            score += 20
            reason.append("Best season match")

        # Rainfall match
        rainfall_range = row['Rainfall_Requirement (mm)']
        if "-" in rainfall_range:
            low, high = map(int, rainfall_range.split('-'))
            if low <= data.rainfall_mm <= high:
                score += 25
                reason.append("Ideal rainfall available")

        # Temperature match
        temp_opt = row['Optimal_Temperature (°C)']
        if "-" in temp_opt:
            low, high = map(int, temp_opt.split('-'))
            if low <= data.temperature_celsius <= high:
                score += 25
                reason.append("Ideal temperature available")

        # (Optional bonus: later we can also match based on Zn, Fe, Cu if you want)

        if score > 0:
            crop_scores[crop] = {
                "score": score,
                "reasons": reason
            }

    sorted_crops = sorted(crop_scores.items(), key=lambda x: x[1]['score'], reverse=True)
    top_crops = sorted_crops[:3]

    suggestions = []
    for crop, details in top_crops:
        suggestions.append({
            "crop": crop,
            "score": details['score'],
            "reasons": details['reasons']
        })

    return {
        "suggested_crops": suggestions
    }

class LocationInput(BaseModel):
    latitude: float
    longitude: float

STATE_TO_REGION = {
    "MAHARASHTRA": ["VIDARBHA", "KONKAN & GOA", "MADHYA MAHARASHTRA", "MATATHWADA"],
    "KARNATAKA": ["COASTAL KARNATAKA", "NORTH INTERIOR KARNATAKA", "SOUTH INTERIOR KARNATAKA"],
    "UTTAR PRADESH": ["EAST UTTAR PRADESH", "WEST UTTAR PRADESH"],
    "WEST BENGAL": ["SUB HIMALAYAN WEST BENGAL & SIKKIM", "GANGETIC WEST BENGAL"],
    "ANDHRA PRADESH": ["COASTAL ANDHRA PRADESH", "RAYALSEEMA"],
    "TELANGANA": ["TELANGANA"],
    "GUJARAT": ["GUJARAT REGION", "SAURASHTRA & KUTCH"],
    "CHHATTISGARH": ["CHHATTISGARH"],
    "KERALA": ["KERALA"],
    "TAMIL NADU": ["TAMIL NADU"],
    "ORISSA": ["ORISSA"],
    "BIHAR": ["BIHAR"],
    "JHARKHAND": ["JHARKHAND"],
    "PUNJAB": ["PUNJAB"],
    "DELHI": ["HARYANA DELHI & CHANDIGARH"],
    "HARYANA": ["HARYANA DELHI & CHANDIGARH"],
    "CHANDIGARH": ["HARYANA DELHI & CHANDIGARH"],
    "LAKSHADWEEP": ["LAKSHADWEEP"],
    "JAMMU AND KASHMIR": ["JAMMU & KASHMIR"],
    "HIMACHAL PRADESH": ["HIMACHAL PRADESH"],
    "UTTARAKHAND": ["UTTARAKHAND"],
    "RAJASTHAN": ["EAST RAJASTHAN", "WEST RAJASTHAN"],
    "MADHYA PRADESH": ["EAST MADHYA PRADESH", "WEST MADHYA PRADESH"],
    "ARUNACHAL PRADESH": ["ARUNACHAL PRADESH"],
    "ASSAM": ["ASSAM & MEGHALAYA"],
    "MEGHALAYA": ["ASSAM & MEGHALAYA"],
    "NAGALAND": ["NAGA MANI MIZO TRIPURA"],
    "MANIPUR": ["NAGA MANI MIZO TRIPURA"],
    "MIZORAM": ["NAGA MANI MIZO TRIPURA"],
    "TRIPURA": ["NAGA MANI MIZO TRIPURA"],
    "ANDAMAN AND NICOBAR ISLANDS": ["ANDAMAN & NICOBAR ISLANDS"]
}

@app.post("/get_rainfall")
def get_rainfall(location: LocationInput):
    try:
        # Reverse geocode
        url = f"https://nominatim.openstreetmap.org/reverse?lat={location.latitude}&lon={location.longitude}&format=json"
        response = requests.get(url, headers={'User-Agent': 'RainfallChecker'})
        data = response.json()

        address = data.get("address", {})
        state = address.get("state", "").strip().upper()

        if not state:
            return {"error": "Unable to detect state from location."}

        # Get region names mapped to this state
        regions = STATE_TO_REGION.get(state, [])

        if not regions:
            return {"error": f"No region mapping found for state: {state}"}

        matched_row = rainfall_data[rainfall_data["States"].str.upper().isin(regions)]

        if matched_row.empty:
            return {"error": f"No rainfall data found for {state}"}

        # Return average rainfall for all matched regions
        monthly_cols = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
        monthly_avg = matched_row[monthly_cols].mean().to_dict()
        annual_avg = matched_row["ANNUAL"].mean()

        return {
            "state_detected": state,
            "region_used": ", ".join(regions),
            "rainfall_mm": round(annual_avg, 2),
            "monthly_rainfall": {k: round(v, 2) for k, v in monthly_avg.items()},
            "source": "rainfall.csv"
        }

    except Exception as e:
        return {"error": str(e)}


# @app.post("/get_rainfall")
# def get_rainfall(location: LocationInput):
#     try:
#         # Reverse geocode to get state
#         url = f"https://nominatim.openstreetmap.org/reverse?lat={location.latitude}&lon={location.longitude}&format=json"
#         response = requests.get(url, headers={'User-Agent': 'RainfallChecker'})
#         data = response.json()

#         address = data.get("address", {})
#         state = address.get("state", "").strip().upper()

#         if not state:
#             return {"error": "Unable to detect state from location."}

#         # Match state in rainfall dataset
#         matched_row = rainfall_data[
#             rainfall_data["States"].str.strip().str.upper() == state
#         ]

#         if matched_row.empty:
#             return {"error": f"No rainfall data found for {state}"}

#         row = matched_row.iloc[0]
#         result = {
#             "state_detected": state,
#             "rainfall_mm": row["ANNUAL"],
#             "monthly_rainfall": {
#                 "JAN": row["JAN"],
#                 "FEB": row["FEB"],
#                 "MAR": row["MAR"],
#                 "APR": row["APR"],
#                 "MAY": row["MAY"],
#                 "JUN": row["JUN"],
#                 "JUL": row["JUL"],
#                 "AUG": row["AUG"],
#                 "SEP": row["SEP"],
#                 "OCT": row["OCT"],
#                 "NOV": row["NOV"],
#                 "DEC": row["DEC"]
#             },
#             "source": "rainfall.csv"
#         }

#         return result

#     except Exception as e:
#         return {"error": str(e)}

class RainfallStatsRequest(BaseModel):
    mode: str  # "month" or "year"
    state: Optional[str] = None  # For year-wise
    year: Optional[int] = None   # For month-wise


@app.post("/get_rainfall_stats")
def get_rainfall_stats(req: RainfallStatsRequest):
    if req.mode == "month":
        year = req.year or rainfall_data["YEAR_MODIFIED"].max()
        subset = rainfall_data[rainfall_data["YEAR_MODIFIED"] == year]

        if subset.empty:
            return {"error": "No data for selected year."}

        month_cols = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
        avg_monthly = subset[month_cols].mean().to_dict()

        return {
            "mode": "month",
            "year": year,
            "monthly_avg": avg_monthly
        }

    elif req.mode == "year":
        if not req.state:
            return {"error": "State is required for year-wise mode."}

        state = req.state.strip().upper()
        subset = rainfall_data[rainfall_data["States"].str.strip().str.upper() == state]

        if subset.empty:
            return {"error": "No data for selected state."}

        stats = subset[["YEAR_MODIFIED", "ANNUAL"]].dropna()
        year_data = stats.groupby("YEAR_MODIFIED")["ANNUAL"].mean().to_dict()

        return {
            "mode": "year",
            "state": state,
            "yearly_rainfall": year_data
        }

    return {"error": "Invalid mode"}
