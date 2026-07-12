# CDSS Diabetes 🩺🩸

**Clinical Decision Support System (CDSS) untuk Deteksi Dini Risiko Diabetes Mellitus Tipe 2 (DMT2)**

Proyek ini adalah prototipe sistem cerdas yang dirancang untuk membantu tenaga kesehatan (dokter, perawat, admin) dalam melakukan deteksi dini risiko diabetes pada pasien. Sistem ini menggunakan model Machine Learning (Random Forest) yang memproses parameter klinis pasien untuk memberikan prediksi risiko.

Proyek ini dikembangkan sebagai bagian dari tugas akhir/skripsi di Program Studi Teknik Informatika, Universitas Global Jakarta.

---

## 🏗️ Arsitektur Sistem

Sistem ini terdiri dari dua *service* utama yang saling terhubung:
1. **Backend Machine Learning (Python/Flask)**: Menjalankan model prediksi Random Forest.
2. **Frontend & API Gateway (Next.js)**: Menyediakan antarmuka pengguna (UI), REST API, autentikasi, dan koneksi ke database.

---

## 🛠️ Stack Teknologi

**Machine Learning (Backend)**
* **Python 3** + Flask API
* **Scikit-learn** (Random Forest Classifier)
* **Imbalanced-learn** (SMOTE untuk *oversampling*)
* **Joblib** (Serialisasi model)
* **Dataset**: PIMA Indians Diabetes

**Web Application (Frontend + API)**
* **Next.js 16** (React 19)
* **Tailwind CSS v4** (via `@tailwindcss/postcss`)
* **Prisma ORM** + MySQL (Database)
* **NextAuth** (Autentikasi role-based)
* **Axios** (HTTP Client)

---

## 📁 Struktur Direktori

```text
Project/
├── cdss-flask/              # Backend Machine Learning (Port 5000)
│   ├── app.py               # Flask API server
│   ├── train_model.py       # Script training model Random Forest
│   └── model/               # Model (.pkl) hasil training
│
└── cdss-nextjs/             # Frontend & API Gateway (Port 3000)
    ├── app/                 # Next.js App Router (Pages & API Routes)
    ├── prisma/              # Prisma schema & seeders
    ├── lib/                 # Utility functions (Prisma client)
    └── middleware.ts        # Route protection & role checks
```

---

## 🚀 Cara Menjalankan Proyek (Local Development)

### Prasyarat
- **Node.js** (v18 atau lebih baru)
- **Python** (v3.9 atau lebih baru)
- **XAMPP** atau server MySQL lokal lainnya.
- Git

### 1. Setup Database MySQL
1. Buka XAMPP, jalankan modul **MySQL**.
2. Buat database baru bernama `cdss_diabetes`.

### 2. Setup Backend Flask (Machine Learning)
Buka terminal baru, lalu jalankan perintah berikut:
```bash
cd cdss-flask

# Buat virtual environment (opsional tapi disarankan)
python -m venv venv
venv\Scripts\activate  # Untuk Windows
# source venv/bin/activate # Untuk Linux/Mac

# Install dependensi
pip install -r requirements.txt

# (Opsional) Jika ingin melatih ulang model:
# python train_model.py

# Jalankan server Flask
python app.py
```
> Flask API akan berjalan di `http://localhost:5000`

### 3. Setup Frontend Next.js
Buka terminal baru lagi, lalu jalankan perintah berikut:
```bash
cd cdss-nextjs

# Install dependensi
npm install

# Setup Environment Variables
# Buat file .env di dalam folder cdss-nextjs dan isi dengan:
# DATABASE_URL="mysql://root:@localhost:3306/cdss_diabetes"
# NEXTAUTH_SECRET="secret-key-yang-sangat-aman-123"
# NEXTAUTH_URL="http://localhost:3000"
# FLASK_API_URL="http://localhost:5000"

# Migrasi database dan jalankan seeder
npx prisma migrate dev
npx prisma db seed

# Jalankan development server Next.js
npm run dev
```
> Aplikasi web akan berjalan di `http://localhost:3000`

---

## 🔐 Akun Default (Hasil Seeder)
Gunakan akun berikut untuk login ke dalam sistem:
- **Admin**: `admin@cdss.com` | Pass: `password123`
- **Dokter**: `dokter@cdss.com` | Pass: `password123`
- **Perawat**: `perawat@cdss.com` | Pass: `password123`

---

## 🧑‍💻 Author
**Fadly Atthoriq**  
Teknik Informatika - Universitas Global Jakarta
