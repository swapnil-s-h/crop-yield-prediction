# Step 1: Import libraries
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import xgboost as xgb
import shap
import matplotlib.pyplot as plt
import joblib

# Step 2: Load Datasets
crop_df = pd.read_csv('crop_production.csv')
crop_info_df = pd.read_csv('crop_info.csv')

print("✅ Datasets Loaded Successfully!")

# Step 3: Handle Missing Values in Crop Production Data
print(f"Original dataset shape: {crop_df.shape}")
crop_df = crop_df.dropna(subset=['Production'])
print(f"After dropping missing Production: {crop_df.shape}")

# Step 4: Create Yield Feature
crop_df['Yield'] = (crop_df['Production'] * 1000) / crop_df['Area']  # Tons to Kg

# Remove infinite or very high yield values
crop_df = crop_df.replace([np.inf, -np.inf], np.nan).dropna(subset=['Yield'])
crop_df = crop_df[crop_df['Yield'] < 50000]

# Step 5: Label Encoding
le_state = LabelEncoder()
le_district = LabelEncoder()
le_crop = LabelEncoder()
le_season = LabelEncoder()

crop_df['State_Code'] = le_state.fit_transform(crop_df['State_Name'])
crop_df['District_Code'] = le_district.fit_transform(crop_df['District_Name'])
crop_df['Crop_Code'] = le_crop.fit_transform(crop_df['Crop'])
crop_df['Season_Code'] = le_season.fit_transform(crop_df['Season'])

# Step 6: Prepare Features and Target
final_features = ['State_Code', 'District_Code', 'Crop_Code', 'Season_Code', 'Crop_Year', 'Area']
X = crop_df[final_features]
y = crop_df['Yield']

print(f"✅ Data Preprocessing Completed. Final data shape: {X.shape}")

# Step 7: Split Data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Step 8: Train XGBoost Model
xgb_model = xgb.XGBRegressor(
    n_estimators=200,
    learning_rate=0.1,
    max_depth=8,
    random_state=42,
    n_jobs=-1
)

xgb_model.fit(X_train, y_train)
print("✅ Model Training Completed!")

# Step 9: Model Prediction and Evaluation
y_pred = xgb_model.predict(X_test)

mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"Mean Absolute Error (MAE): {mae:.2f}")
print(f"R² Score: {r2:.4f}")

# Step 10: Save Model (Optional - for later use)
joblib.dump(xgb_model, 'crop_yield_xgb_model.pkl')
print("✅ Model Saved as crop_yield_xgb_model.pkl")

# SHAP Explainability using TreeExplainer with Booster

import shap
import matplotlib.pyplot as plt

# Step 1: Initialize SHAP Explainer (Auto detection)
explainer = shap.Explainer(xgb_model)

# Step 2: Calculate SHAP values for a sample
X_sample = X_test.sample(1000, random_state=42)
shap_values = explainer(X_sample)

# Step 3: Summary Plot (Feature Importance)
plt.figure(figsize=(12,8))
shap.plots.bar(shap_values)
plt.show()

# Step 4: Detailed Beeswarm Plot
plt.figure(figsize=(12,8))
shap.plots.beeswarm(shap_values)
plt.show()

# Step 5: (Optional) Explain a single prediction
sample_idx = 0
shap.plots.force(shap_values[sample_idx])
