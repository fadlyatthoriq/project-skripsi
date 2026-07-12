import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import (accuracy_score, roc_auc_score,
                             precision_score, recall_score,
                             f1_score, confusion_matrix)
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
import joblib
import os

# 1. LOAD DATASET
df = pd.read_csv('diabetes.csv')

print("=" * 55)
print("PIMA INDIANS DIABETES — MODEL TRAINING")
print("=" * 55)
print(f"Dataset shape  : {df.shape}")
print(f"Label distribusi:")
print(df['Outcome'].value_counts().to_string())
print()

# 2. DISCRETIZE
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
    if val < 80:   return 0   
    elif val < 90: return 1  
    elif val < 100: return 2 
    else:          return 3   

def discretize_age(val):
    if val < 25:   return 0   
    elif val < 35: return 1   
    elif val < 45: return 2  
    elif val < 60: return 3   
    else:          return 4   

df_proc = df.copy()
df_proc['Glucose']       = df_proc['Glucose'].apply(discretize_glucose)
df_proc['BMI']           = df_proc['BMI'].apply(discretize_bmi)
df_proc['BloodPressure'] = df_proc['BloodPressure'].apply(discretize_bp)
df_proc['Age']           = df_proc['Age'].apply(discretize_age)

# Generate Attributes
df_proc['glucose_bmi_risk'] = df_proc['Glucose'] * df_proc['BMI']

# 3. FEATURES & LABEL
feature_cols = [
    'Pregnancies', 'Glucose', 'BloodPressure',
    'SkinThickness', 'Insulin', 'BMI',
    'DiabetesPedigreeFunction', 'Age', 'glucose_bmi_risk'
]

X = df_proc[feature_cols]
y = df['Outcome']

# 4. CROSS VALIDATION — 10-fold stratified + SMOTE dalam fold
print("Menjalankan 10-fold Stratified Cross Validation...")
print("(SMOTE diterapkan di dalam setiap fold training)\n")

rf = RandomForestClassifier(
    n_estimators=150,
    criterion='entropy', 
    max_depth=12,
    random_state=1992
)
smote = SMOTE(k_neighbors=3, random_state=1992)

skf = StratifiedKFold(n_splits=10, shuffle=True, random_state=1992)

accs, aucs, precs, recs, f1s = [], [], [], [], []
all_true, all_pred = [], []

for fold, (train_idx, test_idx) in enumerate(skf.split(X, y), 1):
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

    X_res, y_res = smote.fit_resample(X_train, y_train)
    rf.fit(X_res, y_res)

    y_pred = rf.predict(X_test)
    y_prob = rf.predict_proba(X_test)[:, 1]

    accs.append(accuracy_score(y_test, y_pred))
    aucs.append(roc_auc_score(y_test, y_prob))
    precs.append(precision_score(y_test, y_pred, zero_division=0))
    recs.append(recall_score(y_test, y_pred))
    f1s.append(f1_score(y_test, y_pred))
    all_true.extend(y_test)
    all_pred.extend(y_pred)

    print(f"  Fold {fold:2d} | Acc: {accs[-1]*100:.2f}% | "
          f"AUC: {aucs[-1]:.4f} | Recall: {recs[-1]*100:.2f}%")

print()
print("=" * 55)
print("HASIL EVALUASI (rata-rata 10-fold)")
print("=" * 55)
print(f"Accuracy  : {np.mean(accs)*100:.2f}% ± {np.std(accs)*100:.2f}%")
print(f"AUC       : {np.mean(aucs):.4f}")
print(f"Precision : {np.mean(precs)*100:.2f}%")
print(f"Recall    : {np.mean(recs)*100:.2f}%")
print(f"F1-Score  : {np.mean(f1s)*100:.2f}%")
print()

cm = confusion_matrix(all_true, all_pred)
print("Confusion Matrix (aggregate 10-fold):")
print(f"  TP={cm[1,1]}  FN={cm[1,0]}  FP={cm[0,1]}  TN={cm[0,0]}")
print(f"  Recall Diabetes     : {cm[1,1]/(cm[1,1]+cm[1,0])*100:.2f}%")
print(f"  Recall Non-Diabetes : {cm[0,0]/(cm[0,0]+cm[0,1])*100:.2f}%")

# 5. TRAIN FINAL MODEL
print()
print("Training final model menggunakan seluruh dataset...")

X_final, y_final = smote.fit_resample(X, y)

final_model = RandomForestClassifier(
    n_estimators=150,
    criterion='entropy',
    max_depth=12,
    random_state=1992
)
final_model.fit(X_final, y_final)

print("Final model berhasil ditraining.")

# 6. SIMPAN PREPROCESSING CONFIG + MODEL
os.makedirs('model', exist_ok=True)

# Simpan model
joblib.dump(final_model, 'model/rf_diabetes.pkl')

# Simpan feature columns
joblib.dump(feature_cols, 'model/feature_cols.pkl')

print()
print("=" * 55)
print("FILE TERSIMPAN:")
print("  model/rf_diabetes.pkl   — model Random Forest")
print("  model/feature_cols.pkl  — feature")
print("=" * 55)
print()
