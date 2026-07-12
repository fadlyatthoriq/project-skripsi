# CONTEXT PROMPT — CDSS DIABETES (Skripsi)

Kamu adalah AI assistant yang membantu saya mengerjakan project skripsi. Berikut adalah **konteks lengkap** project ini dari awal sampai akhir. Baca dan pahami semua bagian ini sebelum membantu saya.

---

## 📌 GAMBARAN UMUM PROJECT

**Nama Sistem:** CDSS Diabetes — Clinical Decision Support System untuk Deteksi Dini Risiko Diabetes Mellitus Tipe 2 (DMT2)

**Tujuan:** Membantu tenaga kesehatan (dokter, perawat, admin) dalam mendeteksi risiko diabetes mellitus tipe 2 pada pasien menggunakan Machine Learning (Random Forest), berdasarkan parameter klinis pasien.

**Institusi:** Universitas Global Jakarta, Teknik Informatika (2025)

**Arsitektur Sistem:** Dua service terpisah yang saling terhubung:
1. **Backend ML:** Python Flask (port 5000) — menjalankan model Random Forest
2. **Frontend + API:** Next.js 16 (port 3000) — antarmuka pengguna + REST API + database

**Database:** MySQL via XAMPP (`cdss_diabetes`), diakses melalui Prisma ORM

---

## 🏗️ STRUKTUR DIREKTORI

```
Project/
├── cdss-flask/              ← Backend Machine Learning
│   ├── app.py               ← Flask API server (port 5000)
│   ├── train_model.py       ← Script training model Random Forest
│   ├── diabetes.csv         ← Dataset PIMA Indians Diabetes
│   ├── requirements.txt     ← Dependensi Python
│   └── model/
│       ├── rf_diabetes.pkl  ← Model Random Forest tersimpan
│       └── feature_cols.pkl ← Daftar feature columns
│
└── cdss-nextjs/             ← Frontend + API Gateway
    ├── app/
    │   ├── login/page.tsx           ← Halaman login
    │   ├── (dashboard)/             ← Route group dashboard (protected)
    │   │   ├── layout.tsx           ← Sidebar layout (role-based nav)
    │   │   ├── screening/page.tsx   ← Halaman skrining utama
    │   │   ├── screening/result/page.tsx ← Halaman hasil skrining
    │   │   ├── history/page.tsx     ← Riwayat skrining pasien
    │   │   ├── patients/page.tsx    ← Manajemen pasien (ADMIN only)
    │   │   └── profile/page.tsx     ← Profil user yang login
    │   └── api/
    │       ├── auth/[...nextauth]/route.ts ← NextAuth credentials
    │       ├── predict/route.ts            ← Bridge ke Flask ML
    │       ├── patients/route.ts           ← GET + POST pasien
    │       ├── patients/[id]/route.ts      ← PUT + DELETE pasien
    │       ├── patients/[id]/history/route.ts ← Riwayat per pasien
    │       └── history/route.ts            ← Daftar riwayat semua pasien
    ├── prisma/
    │   ├── schema.prisma    ← Skema database MySQL
    │   └── seed.ts          ← Data awal (admin, dokter, perawat, pasien contoh)
    ├── lib/prisma.ts        ← Prisma client singleton
    ├── middleware.ts         ← Route protection (NextAuth + role check)
    ├── types/next-auth.d.ts ← TypeScript extension untuk session
    └── .env                 ← Environment variables
```

---

## 🧠 BAGIAN 1: FLASK (Machine Learning Backend)

### Teknologi
- **Python Flask 3.0.3** + Flask-CORS
- **Scikit-learn 1.5.2** — Random Forest Classifier
- **Imbalanced-learn 0.12.4** — SMOTE oversampling
- **Joblib** — serialisasi model
- **Dataset:** PIMA Indians Diabetes (`diabetes.csv`)

### Proses Training (`train_model.py`)

**Dataset:** PIMA Indians Diabetes — 768 sampel, 9 kolom (8 fitur + 1 label `Outcome`)

**Langkah Training:**
1. **Load dataset** dari `diabetes.csv`
2. **Diskretisasi fitur** (mengubah nilai kontinu ke kategori ordinal):
   - `Glucose` → 0 (Normal <140), 1 (Prediabetes 140-199), 2 (DM ≥200)
   - `BMI` → 0 (Kurus <18.5), 1 (Normal 18.5-22), 2 (Overweight 23-24), 3 (Obesitas I 25-29), 4 (Obesitas II ≥30)
   - `BloodPressure` → 0 (Normal <80), 1 (Pre-HT 80-89), 2 (HT-I 90-99), 3 (HT-II ≥100)
   - `Age` → 0 (<25), 1 (25-34), 2 (35-44), 3 (45-59), 4 (≥60)
3. **Feature Engineering:** `glucose_bmi_risk = Glucose_disc × BMI_disc` (interaction feature)
4. **Feature list (9 fitur):**
   ```
   Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI,
   DiabetesPedigreeFunction, Age, glucose_bmi_risk
   ```
5. **Cross Validation:** 10-fold Stratified K-Fold + SMOTE (k_neighbors=3) dalam setiap fold training
6. **Model:** `RandomForestClassifier(n_estimators=150, criterion='entropy', max_depth=12, random_state=1992)`
7. **Hasil evaluasi (rata-rata 10-fold):**
   - Accuracy: ~86.07%
   - AUC: ~0.9375
8. **Final model** ditraining ulang dengan seluruh dataset (setelah SMOTE)
9. **Disimpan** sebagai `model/rf_diabetes.pkl` dan `model/feature_cols.pkl`

### Flask API (`app.py`)

**Server:** `http://localhost:5000`

**Endpoints:**
| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/` | Info endpoint |
| GET | `/health` | Health check |
| POST | `/predict` | Prediksi risiko diabetes |

**Flow `/predict`:**
1. Terima JSON body dengan 8 field klinis dari Next.js
2. Jalankan preprocessing (diskretisasi + buat `glucose_bmi_risk`)
3. Buat vector fitur: `[pregnancies, glucose_disc, bp_disc, skin, insulin, bmi_disc, dpf, age_disc, gbr]`
4. Prediksi dengan model: `model.predict(X)` dan `model.predict_proba(X)`
5. Generate label, rekomendasi, dan clinical summary
6. Return JSON

**Input yang diterima Flask:**
```json
{
  "pregnancies": 2,
  "glucose": 148,
  "blood_pressure": 72,
  "skin_thickness": 35,
  "insulin": 0,
  "bmi": 33.6,
  "diabetes_pedigree_function": 0.627,
  "age": 50
}
```

**Output yang dikembalikan Flask:**
```json
{
  "result": 1,
  "probability": 78.5,
  "risk_label": "Berisiko Diabetes",
  "recommendation": "Segera lakukan pemeriksaan HbA1c dan konsultasi dengan dokter spesialis penyakit dalam...",
  "clinical_summary": {
    "glucose": "148 mg/dL — Prediabetes",
    "bmi": "33.6 kg/m² — Obesitas I",
    "blood_pressure": "72 mmHg — Normal",
    "age": "50 tahun — Lansia Awal"
  }
}
```

**Fungsi Labeling:**
- `result == 1` → "Berisiko Diabetes" → rekomendasi HbA1c + spesialis
- `result == 0` → "Tidak Berisiko Diabetes" → rekomendasi gaya hidup sehat

---

## 💻 BAGIAN 2: NEXT.JS (Frontend + API Gateway)

### Teknologi
- **Next.js 16.2.9** (App Router)
- **React 19.2.4**
- **TypeScript**
- **Tailwind CSS v4**
- **NextAuth.js v4** — authentication (JWT strategy, Credentials provider)
- **Prisma v5** — ORM untuk MySQL
- **Axios** — HTTP client
- **Bcryptjs** — password hashing
- **React Icons** — icon library

### Database Schema (Prisma MySQL)

**Tabel `users`:**
```
id          Int        (PK, auto-increment)
name        String
email       String     (unique)
password    String     (bcrypt hashed)
role        Role       (NURSE | DOCTOR | ADMIN | PATIENT)
createdAt   DateTime
predictions Prediction[] (relasi)
```

**Tabel `predictions`:**
```
id                       Int        (PK)
userId                   Int        (FK → users.id)
pregnancies              Float
glucose                  Float
bloodPressure            Float
skinThickness            Float
insulin                  Float
bmi                      Float
diabetesPedigreeFunction Float
age                      Int
result                   Int        (0 = tidak berisiko, 1 = berisiko)
probability              Float
riskLabel                String
recommendation           String     (Text)
glucoseSummary           String     (contoh: "148 mg/dL — Prediabetes")
bmiSummary               String
bloodPressureSummary     String
ageSummary               String
createdAt                DateTime
```

**Role Enum:** `NURSE`, `DOCTOR`, `ADMIN`, `PATIENT`

**PENTING:** Role `PATIENT` **tidak bisa login**. Mereka hanya sebagai entitas data yang diskrining oleh tenaga kesehatan.

### Data Seed (Default Akun)
```
[ADMIN]   admin@cdss.com    / admin123
[DOCTOR]  dokter@cdss.com   / admin123
[NURSE]   perawat@cdss.com  / admin123
[PATIENT] Siti Rahayu, Ahmad Fauzi (tidak bisa login)
```

### Environment Variables (`.env`)
```
DATABASE_URL="mysql://root:@localhost:3306/cdss_diabetes"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
FLASK_API_URL="http://localhost:5000"
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### NextAuth Configuration (`app/api/auth/[...nextauth]/route.ts`)
- **Strategy:** JWT session
- **Provider:** Credentials (email + password)
- **Logic authorize:**
  1. Cari user di database berdasarkan email
  2. Jika role = PATIENT → tolak login (return null)
  3. Validasi password dengan bcrypt
  4. Jika valid → return `{ id, name, email, role }` ke token JWT
- **JWT Callback:** Tambahkan `id` dan `role` ke token
- **Session Callback:** Expose `id` dan `role` di `session.user`

### Middleware (`middleware.ts`)
Melindungi semua route dashboard:
```
/screening/*   → harus login (semua role kecuali PATIENT)
/history/*     → harus login
/profile/*     → harus login
/patients/*    → harus login + role ADMIN (jika bukan ADMIN → redirect ke /screening)
```

### Akses Berbasis Role

| Fitur | ADMIN | DOCTOR | NURSE |
|-------|-------|--------|-------|
| Skrining | ✅ | ✅ | ✅ |
| Riwayat | ✅ | ✅ | ✅ |
| Profil | ✅ | ✅ | ✅ |
| Manajemen Pasien | ✅ | ❌ | ❌ |

---

## 🔗 API ROUTES (Next.js)

### POST `/api/predict` — Bridge ML
- Cek session NextAuth (wajib login)
- Terima 8 parameter klinis + `patientId`
- Forward ke Flask `POST /predict` via Axios
- Simpan hasil ke tabel `predictions` di MySQL
- Return hasil prediksi ke frontend

### GET `/api/patients` — List pasien
- Return semua user dengan `role: 'PATIENT'`
- Include `_count.predictions` (jumlah skrining)

### POST `/api/patients` — Tambah pasien baru
- Buat user baru dengan `role: 'PATIENT'`
- Hash password dengan bcrypt

### PUT `/api/patients/[id]` — Edit pasien (ADMIN only)
- Update `name` dan `email`

### DELETE `/api/patients/[id]` — Hapus pasien (ADMIN only)
- Hapus semua `predictions` milik pasien dulu (cascade manual)
- Lalu hapus user

### GET `/api/patients/[id]/history` — Riwayat satu pasien
- Return semua `predictions` untuk userId tertentu
- Urut dari terbaru ke terlama

### GET `/api/history?search=&page=1&limit=10` — Riwayat semua pasien
- Return daftar PATIENT yang punya minimal 1 skrining
- Support search (by name), pagination
- Include `lastScreening` (prediksi terakhir) dan `totalScreenings`

---

## 📱 HALAMAN (Pages)

### `/login` — Halaman Login
- Form email + password
- Panggil `signIn('credentials', ...)` dari NextAuth
- Redirect ke `/screening` jika berhasil

### `/screening` — Skrining Diabetes
**Flow 2 langkah:**
1. **Pilih Pasien:** Searchable dropdown (GET `/api/patients`)
   - Bisa tambah pasien baru dari modal inline
2. **Input Parameter Klinis:** 8 field:
   - Jumlah Kehamilan (kali)
   - Kadar Glukosa (mg/dL)
   - Tekanan Darah Diastolik (mmHg)
   - Ketebalan Lipatan Kulit (mm)
   - Kadar Insulin (µU/mL)
   - BMI (kg/m²)
   - Diabetes Pedigree Function (skor)
   - Usia (tahun)
3. **Submit** → POST ke `/api/predict`
4. Simpan hasil ke `sessionStorage` sebagai `predictionResult`
5. Redirect ke `/screening/result`

### `/screening/result` — Hasil Skrining
- Baca data dari `sessionStorage`
- Tampilkan:
  - Badge risiko (Berisiko / Tidak Berisiko)
  - Probabilitas (%) + animated progress bar (hijau/kuning/merah)
  - Clinical Summary (glucose, BMI, tekanan darah, usia)
  - Rekomendasi tindak lanjut
  - Data input skrining (semua 8 parameter)
  - Disclaimer ML

### `/history` — Riwayat Skrining
- Tabel paginated (10 per halaman)
- Tampilkan: nama pasien, jumlah skrining, tanggal terakhir, hasil terakhir
- Search by nama
- Modal Detail: klik pasien → tampil tabel semua riwayat skrining (GET `/api/patients/[id]/history`)

### `/patients` — Manajemen Pasien (ADMIN only)
- Tabel semua pasien terdaftar
- Search by nama/email
- Tambah pasien (modal)
- Edit pasien (modal, ADMIN only)
- Hapus pasien + konfirmasi dialog (ADMIN only)

### `/profile` — Profil User
- Tampilkan nama, email, role, ID user
- Info sistem (versi, model ML, institusi)
- Tombol logout

---

## 🔄 ALUR LENGKAP SISTEM (End-to-End)

```
[Tenaga Kesehatan]
      |
      ↓ Buka http://localhost:3000
[Login Page /login]
      |
      ↓ POST signIn(credentials) → NextAuth
[NextAuth] → cek DB MySQL via Prisma
      |
      ↓ JWT token dengan {id, name, email, role}
[Dashboard Layout] ← sidebar role-based
      |
      ↓ Pilih menu "Skrining"
[/screening]
      |
      ├─ GET /api/patients → list semua PATIENT dari MySQL
      |
      ↓ Pilih pasien + isi 8 parameter klinis
      |
      ↓ Submit form
[POST /api/predict] (Next.js API Route)
      |
      ├─ Validasi session (harus login)
      |
      ├─ Forward ke [Flask POST /predict] via Axios
      |       |
      |       ↓ Preprocessing: diskretisasi + glucose_bmi_risk
      |       ↓ model.predict() + model.predict_proba()
      |       ↓ Return: result, probability, risk_label, recommendation, clinical_summary
      |
      ├─ Simpan hasil ke tabel predictions (MySQL via Prisma)
      |
      ↓ Return hasil ke frontend
[sessionStorage.setItem('predictionResult', ...)]
      |
      ↓ router.push('/screening/result')
[/screening/result]
      |
      ↓ Tampilkan hasil (badge risiko, probabilitas bar, summary, rekomendasi)
```

---

## ⚙️ CARA MENJALANKAN

**Flask:**
```bash
cd cdss-flask
venv/Scripts/activate    # Windows
python app.py            # Jalankan di port 5000
```

**Next.js:**
```bash
cd cdss-nextjs
npm run dev              # Jalankan di port 3000
```

**Database:** XAMPP MySQL harus running, database `cdss_diabetes` sudah dibuat dan di-migrate dengan Prisma.

---

## 📝 CATATAN PENTING

1. **PATIENT tidak bisa login** — mereka hanya diregistrasi oleh tenaga kesehatan sebagai subjek skrining
2. **Flask harus running** saat melakukan skrining — Next.js hanya bridge ke Flask untuk ML inference
3. **Hasil prediksi disimpan permanen di MySQL** — bisa dilihat di menu Riwayat
4. **Hasil skrining di halaman result** dibaca dari `sessionStorage` (tidak persistent) — jika user refresh akan redirect ke /screening
5. **Menu /patients** hanya muncul dan bisa diakses oleh role ADMIN
6. **Diskretisasi fitur di Flask harus IDENTIK** dengan yang digunakan saat training — ini sudah dijaga konsistensinya
7. **Model:** Random Forest 150 trees, criterion entropy, max_depth 12, SMOTE k_neighbors=3
8. **Threshold klasifikasi:** Default 0.5 dari sklearn (result 0 atau 1)
9. **Probabilitas yang ditampilkan** adalah `predict_proba[:, 1]` × 100 (probabilitas kelas positif/berisiko)

---

## 🗂️ FILE-FILE KUNCI

| File | Fungsi |
|------|--------|
| `cdss-flask/app.py` | Server Flask, preprocessing, endpoint /predict |
| `cdss-flask/train_model.py` | Training Random Forest + evaluasi 10-fold CV |
| `cdss-nextjs/prisma/schema.prisma` | Skema DB MySQL (User + Prediction) |
| `cdss-nextjs/app/api/predict/route.ts` | Bridge Flask ↔ MySQL |
| `cdss-nextjs/app/api/auth/[...nextauth]/route.ts` | Login logic + JWT |
| `cdss-nextjs/middleware.ts` | Route protection + role check |
| `cdss-nextjs/app/(dashboard)/screening/page.tsx` | UI skrining utama |
| `cdss-nextjs/app/(dashboard)/screening/result/page.tsx` | UI hasil skrining |
| `cdss-nextjs/app/(dashboard)/history/page.tsx` | UI riwayat pasien |
| `cdss-nextjs/app/(dashboard)/patients/page.tsx` | UI manajemen pasien |
| `cdss-nextjs/app/(dashboard)/layout.tsx` | Sidebar + navigasi |
