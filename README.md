# H-DOC 🏥

**Medical Record & Patient Management System**

This project includes:
- **Backend:** Spring Boot (Dockerized)
- **Database:** Supabase PostgreSQL (Pre-configured)
- **Frontend:** React + TypeScript (Vite) (runs locally in dev mode)

---

## 🎯 Purpose of This Project

H-DOC (Healthcare Document & Patient Management System) is a **complete solution for managing patients, doctors, medical forms, appointments, prescriptions, and more** within a healthcare environment.

### Key Features:
- 📋 Patient Registration & Profile Management  
- 📅 Appointment Scheduling & Tracking  
- 💊 Prescription & Medication Records  
- 📝 Dynamic Medical Form Handling  
- 👨‍⚕️ Doctor Assignments & Specialties  
- 📈 Dashboard for Monitoring Patient Visits & Metrics

This app is designed for healthcare centers, clinics, and hospitals that need a **centralized system** to streamline patient records, reduce paperwork, and improve service delivery.

---

**⚠️ Note:**  
This project is for **development/demo purposes** and not certified for production healthcare use.

## ⚙️ Full Setup Instructions (Local Development)

### ✅ 1. Clone this Repository

```bash
git clone https://github.com/SaadKiker/H-DOC.git
cd H-DOC
```

### ✅ 2. Configure Environment (Supabase DB URL & Secrets)

All Supabase connection settings are already pre-configured in the backend's `application.properties`. No additional DB setup is required.

### ✅ 3. Build Backend Package

Navigate to the backend directory and build the project:

```bash
cd backend
./mvnw clean package -DskipTests
cd ..
```

### ✅ 4. Start Backend & DB (Dockerized)

This command will:
- Build backend Docker image
- Connect automatically to Supabase
- Expose backend at http://localhost:8080

```bash
docker-compose up --build
```

### ✅ 5. Run Frontend (Locally in Dev Mode)

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

- Frontend runs at: http://localhost:5173

### ✅ 6. Usage

- **Access full app:** http://localhost:5173
- **Backend API:** http://localhost:8080

---

## 🔐 Login Credentials

All users have the password: **123**

| Role | Username | Password |
|------|----------|----------|
| Agent | agent.asalma | 123 |
| Admin | admin.bkarim | 123 |
| Doctor | doctor.[first last name initial][firstname] | 123 |

**Example Doctor Username:** `doctor.ajohn` (for Dr. John Anderson)

---

## ⚡️ Quick Summary

| Component | How It Runs | URL |
|-----------|-------------|-----|
| Backend | Docker | http://localhost:8080 |
| Frontend | Dev Mode (npm run dev) | http://localhost:5173 |
| Database | Supabase Cloud | (pre-configured) |


## 📂 Project Structure

```
H-DOC/
│
├── backend/              # Spring Boot backend (Dockerized)
│   └── Dockerfile
│
├── frontend/             # React frontend (Vite + TypeScript)
│   └── Dockerfile        # (optional for production builds)
│
├── docker-compose.yml    # Docker Compose for backend + db
│
└── README.md             # You're here!
```

---


## 🙌 Contribution

Pull requests are welcome!
Feel free to fork and submit improvements or fixes.

---

## 💻 Author

**Saad Kiker**  
GitHub: https://github.com/SaadKiker
