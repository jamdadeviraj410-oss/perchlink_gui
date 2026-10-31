# PerchLink Backend – Architectural & Functional Overview

**Module:** Survivor SOS Relay Backend  
**Framework:** Python FastAPI + SQLAlchemy + SQLite  
**Target Hardware:** Raspberry Pi 4 Model B (Offline / Local Wi-Fi Access Point)  
**Authoritative Plan Reference:** [plan.md](file:///c:/Users/Devang/OneDrive/Desktop/perchlink/plan.md)

---

## 1. What Problem Does the Backend Solve?

During disaster scenarios (earthquakes, floods, structural collapses), conventional cellular towers and internet backbones fail. 

The PerchLink backend runs **locally on the drone's onboard Raspberry Pi 4B**. It acts as an autonomous, self-contained communication relay bridge between trapped survivors and distant rescue ground stations.

```
[Survivor Smartphone]
       │  (Local Wi-Fi: PERCHLINK_SOS)
       ▼
[FastAPI Backend on Raspberry Pi 4B]
       │
       ├─► [Persistent SQLite Storage] (Guarantees no data loss if power flickers)
       ├─► [Transmission Queue Worker] (Coordinates FIFO radio dispatch)
       ├─► [WebSocket Manager] (Real-time status updates back to survivor)
       ▼
[LILYGO T3-S3 SX1262 LoRa Radio]
       │  (Long-Range Radio Link: 868 / 915 MHz)
       ▼
[Ground Rescue Station]
```

---

## 2. Directory Structure & Component Breakdown

```
backend/
├── perchlink.db              # Persistent SQLite database file
├── requirements.txt          # Python dependencies
├── venv/                     # Dedicated virtual environment
└── app/
    ├── main.py               # Application lifecycle, WebSocket router, static frontend host
    ├── core/
    │   └── config.py         # App configuration & hardware ports
    ├── database/
    │   ├── database.py       # SQLAlchemy engine & SQLite session provider
    │   └── models.py         # SOSRecord and SOSUpdateMessage database models
    ├── schemas/
    │   ├── sos.py            # Pydantic input validation & response models
    │   └── status.py         # Drone telemetry schemas
    ├── routes/
    │   ├── sos.py            # REST endpoints: POST /api/sos, GET /api/sos/{id}, POST update
    │   ├── status.py         # REST endpoint: GET /api/drone/status
    │   └── health.py         # REST endpoint: GET /api/health
    ├── services/
    │   ├── sos_manager.py    # Case generator, persistence, and state transitions
    │   ├── transmission_queue.py # Asynchronous FIFO queue & crash recovery
    │   ├── lora_service.py   # Hardware PySerial bridge & Phase 2 Mock Radio
    │   └── drone_status.py   # Drone telemetry service (truthful hardware state)
    └── websocket/
        └── manager.py        # Isolated real-time WebSocket connection manager
```

---

## 3. Detailed Component Responsibilities

### A. Core API & Routing (`app/routes/`)

| Route | Method | Purpose |
|---|---|---|
| [`/api/sos`](file:///c:/Users/Devang/OneDrive/Desktop/perchlink/backend/app/routes/sos.py#L12) | `POST` | Validates emergency distress payloads, generates unique ID (`SOS-XXXX`), writes to SQLite, enqueues for LoRa transmission, and returns confirmation. |
| [`/api/sos/{sos_id}`](file:///c:/Users/Devang/OneDrive/Desktop/perchlink/backend/app/routes/sos.py#L22) | `GET` | Fetches complete emergency record, GPS coordinates, supplemental notes, and current delivery state. |
| [`/api/sos/{sos_id}/update`](file:///c:/Users/Devang/OneDrive/Desktop/perchlink/backend/app/routes/sos.py#L35) | `POST` | Appends supplemental details (e.g., "water level rising", "moved to roof") to an ongoing emergency case without creating duplicate incidents. |
| [`/api/drone/status`](file:///c:/Users/Devang/OneDrive/Desktop/perchlink/backend/app/routes/status.py#L10) | `GET` | Reports drone telemetry (battery percentage, perching state, Wi-Fi link status, LoRa link status). |
| [`/api/health`](file:///c:/Users/Devang/OneDrive/Desktop/perchlink/backend/app/routes/health.py#L14) | `GET` | Reports system health, backend uptime, and verifies SQLite database read/write readiness. |

---

### B. Real-Time Status via WebSockets (`app/websocket/manager.py`)

- **Endpoint:** `/ws/sos/{sos_id}`
- **Survivor Isolation:** Each survivor smartphone subscribes only to updates regarding their specific `sos_id`.
- **Event Flow:**
  1. `sos_received_by_drone`: Immediately notifies the phone that the distress record is safely written to offline disk.
  2. `sos_transmission_started`: Indicates the SX1262 LoRa radio has started broadcasting the distress packet.
  3. `sos_received_by_ground_station`: Confirms that the ground base station antenna sent a radio ACK packet back to the drone.
  4. `rescue_team_acknowledged`: Confirms that a human rescue operator has reviewed and registered the distress case.

---

### C. Persistent Database Layer (`app/database/`)

Using SQLite ensures zero configuration overhead and exceptional durability on Raspberry Pi SD cards:

- **`SOSRecord` Table:**
  - `id`: Unique identifier (e.g. `SOS-2222`)
  - `emergency_type`: Category (TRAPPED, MEDICAL, INJURED, WATER, FOOD, FIRE, COLLAPSE, OTHER)
  - `people_count`: Number of survivors
  - `latitude`, `longitude`, `accuracy`: GPS satellite coordinates (nullable if indoors)
  - `landmark`: Manual location / room / building description
  - `message`: Specific situation details
  - `drone_received`, `ground_station_acknowledged`, `rescue_team_acknowledged`: Truthful boolean flags with exact UTC timestamps
  - `transmission_status`: State tracker (`PENDING`, `TRANSMITTING`, `STATION_ACKNOWLEDGED`, `COMPLETED`)

- **`SOSUpdateMessage` Table:**
  - Preserves time-stamped chronological history of all supplemental survivor notes.

---

### D. Transmission Queue & Crash Resilience (`app/services/transmission_queue.py`)

- **FIFO Radio Dispatch:** Drone radio operates asynchronously in the background so HTTP request handlers remain instantaneous (<15ms response).
- **Power Loss Recovery:** If the Raspberry Pi reboots mid-operation (battery swap or power dip), the queue worker automatically queries SQLite on startup for any cases where `rescue_team_acknowledged == False` and re-queues them for transmission.

---

### E. LoRa Radio Communication (`app/services/lora_service.py`)

- **Simulation Mode (Phase 2):** When physical radio hardware is not yet attached, it executes truthful mock delays (4s for radio ACK, 8s for human operator confirmation) and explicitly logs `[LORA MOCK]` so developers and survivors are never misled.
- **Hardware Mode (Phase 5):** Establishes a PySerial connection to the onboard LILYGO T3-S3 SX1262 microcontroller (`COMx` or `/dev/ttyUSB0` at 115200 baud).

---

## 4. Summary of Guiding Principles

1. **Zero External Internet Required:** Everything (FastAPI, SQLite, React SPA static files) runs 100% locally on the Raspberry Pi (`http://192.168.4.1`).
2. **Truth in Reporting:** HTTP `200 OK` means the drone received the packet, **not** that rescuers have arrived. The 5-stage timeline truthfully distinguishes drone receipt from ground station ACK.
3. **No Duplicate Cases:** Retries and supplemental messages are appended to existing SOS IDs rather than flooding the radio queue with duplicate incidents.
