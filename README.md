<<<<<<< HEAD
# PerchLink – Disaster-Zone SOS Relay Drone

Autonomous emergency communication relay system designed to provide life-saving SOS connectivity in disaster areas where cellular towers and internet infrastructure have failed.

---

## 🚀 Quick Start Guide

### 1. Running the FastAPI Backend (Port 8000)

Open a terminal in the project directory:

```powershell
cd backend

# Option A: Using the project's virtual environment (Recommended)
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# Option B: If your activated shell has the packages installed
python -m uvicorn app.main:app --reload --port 8000
```

Once running:
- **Interactive Swagger API Docs:** Open [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)
- **Health Check:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- **Drone Telemetry Status:** [http://127.0.0.1:8000/api/drone/status](http://127.0.0.1:8000/api/drone/status)
- **SQLite Database:** Automatically persisted locally at `backend/perchlink.db`

---

### 2. Running the React + Vite Frontend (Port 5173)

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

- **Survivor Interface:** Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser (use Mobile device emulation for the best smartphone experience).

---

### 3. Testing Backend Endpoints via PowerShell / Terminal

#### Submit a New SOS Case:
```powershell
$body = @{
    emergencyType = "TRAPPED"
    peopleCount = 3
    location = @{
        latitude = 19.0760
        longitude = 72.8777
        accuracy = 10.0
    }
    landmark = "Blue roof building, 2nd floor staircase"
    message = "Water rising, one injured person"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/sos" -Method Post -ContentType "application/json" -Body $body
```

#### Query Case Status:
```powershell
# Replace SOS-XXXX with your actual generated ID
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/sos/SOS-2222"
```

#### Attach Supplemental Note to Active Case:
```powershell
$update = @{ message = "Moved to higher landing on 3rd floor" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/sos/SOS-2222/update" -Method Post -ContentType "application/json" -Body $update
```

---

## 📁 Project Structure

```
perchlink/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application & lifecycle
│   │   ├── routes/
│   │   │   ├── sos.py              # POST /api/sos, GET /api/sos/{id}, POST update
│   │   │   ├── status.py           # GET /api/drone/status
│   │   │   └── health.py           # GET /api/health
│   │   ├── services/
│   │   │   ├── sos_manager.py      # Case generator & persistence
│   │   │   ├── lora_service.py     # SX1262 LoRa serial / simulation
│   │   │   ├── transmission_queue.py # LoRa dispatch & recovery worker
│   │   │   └── drone_status.py     # Hardware telemetry service
│   │   ├── database/
│   │   │   ├── database.py         # SQLAlchemy SQLite engine
│   │   │   └── models.py           # SOSRecord & SOSUpdateMessage tables
│   │   ├── schemas/
│   │   │   ├── sos.py              # Pydantic validation models
│   │   │   └── status.py           # Telemetry schemas
│   │   ├── websocket/
│   │   │   └── manager.py          # /ws/sos/{id} connection manager
│   │   └── core/
│   │       └── config.py           # Settings and port mappings
│   ├── perchlink.db                # SQLite emergency storage
│   ├── requirements.txt
│   └── venv/                       # Isolated Python environment
│
├── frontend/
│   ├── src/
│   │   ├── components/             # Header, ConnectionStatus, SOSButton, EmergencyCard, DeliveryTimeline
│   │   ├── pages/                  # Home, SOSForm, SOSStatus, EmergencyDetails, Help
│   │   ├── services/               # api.js, socket.js
│   │   └── hooks/                  # useDroneStatus, useSOSStatus
│   └── dist/                       # Production bundle (served directly on RPi)
│
└── plan.md                         # Architecture specification
```
=======
# perchlink_gui
>>>>>>> origin/main
