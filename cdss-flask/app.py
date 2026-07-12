from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)  # izinkan request dari Next.js

# Load model saat server start
MODEL_PATH = os.path.join('model', 'rf_diabetes.pkl')
FEATURES_PATH = os.path.join('model', 'feature_cols.pkl')

model = joblib.load(MODEL_PATH)
feature_cols = joblib.load(FEATURES_PATH)

print("Model loaded successfully.")
print(f"Features: {feature_cols}")

# Fungsi preprocessing — sama persis dengan training
def discretize_glucose(val):
    if val < 140: return 0
    elif val < 200: return 1
    else: return 2

def discretize_bmi(val):
    if val < 18.5: return 0
    elif val < 23:  return 1
    elif val < 25:  return 2
    elif val < 30:  return 3
    else:           return 4

def discretize_bp(val):
    if val < 80:    return 0
    elif val < 90:  return 1
    elif val < 100: return 2
    else:           return 3

def discretize_age(val):
    if val < 25:   return 0
    elif val < 35: return 1
    elif val < 45: return 2
    elif val < 60: return 3
    else:          return 4

def get_glucose_label(val):
    if val < 140: return "Normal"
    elif val < 200: return "Prediabetes"
    else: return "Diabetes Melitus"

def get_bmi_label(val):
    if val < 18.5: return "Kurus"
    elif val < 23:  return "Normal"
    elif val < 25:  return "Overweight"
    elif val < 30:  return "Obesitas I"
    else:           return "Obesitas II"

def get_bp_label(val):
    if val < 80:    return "Normal"
    elif val < 90:  return "Pre-Hipertensi"
    elif val < 100: return "Hipertensi Derajat I"
    else:           return "Hipertensi Derajat II"

def get_age_label(val):
    if val < 25:   return "Remaja"
    elif val < 35: return "Dewasa Awal"
    elif val < 45: return "Dewasa"
    elif val < 60: return "Lansia Awal"
    else:          return "Lansia"

def preprocess(data):
    pregnancies = float(data['pregnancies'])
    glucose     = float(data['glucose'])
    bp          = float(data['blood_pressure'])
    skin        = float(data['skin_thickness'])
    insulin     = float(data['insulin'])
    bmi         = float(data['bmi'])
    dpf         = float(data['diabetes_pedigree_function'])
    age         = float(data['age'])

    g_disc   = discretize_glucose(glucose)
    bmi_disc = discretize_bmi(bmi)
    bp_disc  = discretize_bp(bp)
    age_disc = discretize_age(age)
    gbr      = g_disc * bmi_disc  # glucose_bmi_risk

    features = [
        pregnancies,
        g_disc,
        bp_disc,
        skin,
        insulin,
        bmi_disc,
        dpf,
        age_disc,
        gbr
    ]

    clinical_summary = {
        "glucose":        f"{glucose} mg/dL — {get_glucose_label(glucose)}",
        "bmi":            f"{bmi} kg/m² — {get_bmi_label(bmi)}",
        "blood_pressure": f"{bp} mmHg — {get_bp_label(bp)}",
        "age":            f"{int(age)} tahun — {get_age_label(age)}"
    }

    return features, clinical_summary

# Routes
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "ok",
        "message": "CDSS Diabetes Flask API is running",
        "endpoints": {
            "predict": "POST /predict",
            "health":  "GET /health"
        }
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        # Validasi field yang wajib ada
        required = [
            'pregnancies', 'glucose', 'blood_pressure',
            'skin_thickness', 'insulin', 'bmi',
            'diabetes_pedigree_function', 'age'
        ]
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({
                "error": f"Missing fields: {', '.join(missing)}"
            }), 400

        # Preprocessing
        features, clinical_summary = preprocess(data)
        X = np.array(features).reshape(1, -1)

        # Prediksi
        result      = int(model.predict(X)[0])
        probability = float(model.predict_proba(X)[0][1])

        # Label hasil
        if result == 1:
            risk_label      = "Berisiko Diabetes"
            recommendation  = (
                "Segera lakukan pemeriksaan HbA1c dan konsultasi "
                "dengan dokter spesialis penyakit dalam untuk "
                "konfirmasi diagnosis lebih lanjut."
            )
        else:
            risk_label      = "Tidak Berisiko Diabetes"
            recommendation  = (
                "Hasil skrining menunjukkan risiko rendah. "
                "Tetap anjurkan gaya hidup sehat dan lakukan "
                "skrining ulang secara berkala."
            )

        return jsonify({
            "result":           result,
            "probability":      round(probability * 100, 2),
            "risk_label":       risk_label,
            "recommendation":   recommendation,
            "clinical_summary": clinical_summary
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Run
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
