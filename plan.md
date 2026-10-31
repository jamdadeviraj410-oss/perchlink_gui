# PerchLink – Survivor SOS Interface
## Development Plan & Technical Implementation Specification

**Project:** PerchLink – Disaster-Zone SOS Relay Drone  
**Module:** Survivor / Person-in-Distress Interface  
**Version:** 2.0  
**Target Hardware:** Raspberry Pi 4 Model B – 4 GB RAM

---

# 1. Project Overview

PerchLink is an AI-powered disaster-response drone designed to provide emergency communication in areas where conventional mobile network infrastructure has failed.

The Survivor Interface is the primary communication interface between a person in distress and the PerchLink drone.

It allows survivors to send emergency SOS messages using only a smartphone connected to the drone's local Wi-Fi network.

The Raspberry Pi 4B onboard the drone will host the complete application locally.

A survivor will:

1. Connect to the drone's Wi-Fi hotspot.
2. Open the locally hosted PerchLink webpage.
3. Submit an emergency request.
4. Receive updates about the message delivery status.
5. Receive confirmation when the rescue ground station acknowledges the SOS.

**Core principle: No SIM card, mobile network, internet connection or external cloud service should be required.**

# 2. Project Objectives

Build a simple, accessible and reliable emergency communication interface.

The application must:

- Allow survivors to submit SOS messages without internet.
- Collect essential emergency information.
- Obtain GPS coordinates when permitted by the smartphone.
- Allow manual location entry.
- Display drone connection status.
- Display LoRa communication status.
- Show whether the drone has received the SOS.
- Show whether the ground station has acknowledged it.
- Allow additional information to be submitted.
- Work on Android and iOS browsers.
- Support multiple connected survivors.
- Preserve SOS records if communication temporarily fails.

# 3. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React + Vite |
| Language | JavaScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend | Python FastAPI |
| API server | Uvicorn |
| Real-time communication | FastAPI WebSockets |
| Database | SQLite |
| Database integration | SQLAlchemy |
| Data validation | Pydantic |
| Serial communication | PySerial |
| AI inference | Existing YOLO11n pipeline |
| Radio communication | LILYGO T3-S3 SX1262 |
| Hosting | Raspberry Pi 4B (4 GB) |
| Local networking | Wi-Fi Access Point |

Do not introduce unnecessary frameworks, cloud services or complex infrastructure.

# 4. Design Direction

The application must be designed for people experiencing stressful emergency situations.

Prioritize accessibility, simplicity and reliability over visual complexity.

## Visual style

Use a professional emergency-response design.

- Clean, light background.
- High-contrast text.
- Red for emergency actions.
- Green for successful communication.
- Amber for pending or warning states.
- Large touch-friendly buttons.
- Clearly separated information cards.
- Mobile-first responsive layout.
- Readable typography.
- Minimal navigation.

Avoid:
- Excessive animations.
- Technical terminology.
- Small buttons.
- Dense dashboards.
- Unnecessary charts.
- Complicated forms.
- Distracting decorative elements.

The interface should look like an emergency service, not a drone control application.

# 5. Application Screens

## Screen 1: Emergency Home

Purpose: Allow survivors to initiate an emergency request immediately.

Required elements:

- PerchLink logo and name.
- Wi-Fi connection indicator.
- Drone availability indicator.
- Message explaining that the user is connected to the local emergency network.
- Large SEND SOS button.
- Secondary assistance option.
- Emergency category shortcuts.
- Language selection placeholder for future multilingual support.

## Screen 2: SOS Form

When the user initiates an SOS request, display an emergency form.

### A. Emergency category

Selectable categories:

- Trapped / Cannot Escape
- Medical Emergency
- Injured Person
- Food Required
- Drinking Water Required
- Fire / Smoke
- Structural Collapse
- Other Emergency

### B. Number of people

Allow users to specify the number of people requiring assistance.

### C. Location

Provide:

- Share Current GPS Location button.
- Latitude and longitude display.
- Manual landmark/location entry.
- Location unavailable warning.

Use the smartphone browser Geolocation API.

GPS positioning can work without mobile internet, but requires location permission and an available GNSS fix.

Do not assume GPS will always be available indoors.

### D. Additional information

Provide an optional text field.

Example:

"Three people trapped on the second floor. One person injured."

### E. Submission

Provide a prominent SEND EMERGENCY REQUEST button.

Avoid unnecessary confirmation steps that delay urgent communication.

## Screen 3: SOS Submission Status

Display actual message delivery progress.

Implement these states:

1. SUBMITTING
   - Request being sent to the FastAPI backend.

2. RECEIVED BY DRONE
   - Backend has received and persistently stored the request.

3. TRANSMITTING TO RESCUE STATION
   - LoRa transmission has started.

4. RECEIVED BY RESCUE STATION
   - Ground station has acknowledged the message.

5. RESCUE TEAM ACKNOWLEDGED
   - Operator has explicitly acknowledged the emergency.

6. PENDING / TRANSMISSION FAILED
   - Ground station acknowledgement has not arrived.
   - Request remains stored and eligible for retry.

IMPORTANT:

An HTTP success response must never be interpreted as confirmation that the rescue station received the message.

Each delivery state must correspond to a real backend or hardware event.

Simulated events must be clearly labelled during development.

## Screen 4: Emergency Details

Display:

- Unique SOS ID.
- Emergency category.
- Number of people.
- Submitted location.
- Submission timestamp.
- Current delivery status.
- Ground station acknowledgement.
- Rescue team acknowledgement.
- Latest status update.

Allow additional information to be submitted against the existing SOS ID.

## Screen 5: Help / Instructions

Provide simple instructions explaining:

- How to connect to PERCHLINK_SOS Wi-Fi.
- How to open the local application.
- How to submit an SOS.
- How to share GPS coordinates.
- What to do if the Wi-Fi connection is interrupted.
- How to check message delivery status.

# 6. Local Network Architecture

The Raspberry Pi 4B acts as:

- Local Wi-Fi access point.
- Frontend web server.
- Backend API server.
- SOS storage system.
- LoRa communication bridge.

Proposed configuration:

| Setting | Value |
|---|---|
| Wi-Fi SSID | PERCHLINK_SOS |
| Raspberry Pi IP | 192.168.4.1 |
| Local website | http://192.168.4.1 |
| Backend | FastAPI |
| API prefix | /api |
| WebSocket | /ws |
| Database | SQLite |

The React application will be compiled into static files and served locally by FastAPI.

All frontend assets must be stored locally.

Do not depend on:
- Vercel
- Netlify
- Firebase hosting
- Supabase
- External CDNs
- External fonts
- Cloud APIs

The operational application must remain accessible without internet.

# 7. System Architecture

The application follows this communication architecture:

SMARTPHONE
↓
PERCHLINK_SOS WI-FI
↓
REACT SURVIVOR INTERFACE
↓
FASTAPI BACKEND
↓
SQLITE SOS STORAGE
↓
SOS TRANSMISSION QUEUE
↓
PYTHON LORA SERVICE
↓
USB SERIAL
↓
LILYGO T3-S3 SX1262
↓
LORA WIRELESS LINK
↓
GROUND STATION LILYGO
↓
RESCUE OPERATOR DASHBOARD

For drone-to-survivor updates:

GROUND STATION ACKNOWLEDGEMENT
↓
LORA RADIO
↓
DRONE LILYGO BOARD
↓
USB SERIAL
↓
FASTAPI BACKEND
↓
WEBSOCKET
↓
SURVIVOR SMARTPHONE

FastAPI is the central application backend.

# 8. FastAPI Backend Structure

Use a modular FastAPI architecture.

Suggested structure:

backend/
  app/
    main.py

    routes/
      sos.py
      status.py
      health.py

    services/
      sos_manager.py
      lora_service.py
      drone_status.py
      transmission_queue.py

    database/
      database.py
      models.py

    schemas/
      sos.py
      status.py

    websocket/
      manager.py

    core/
      config.py

  requirements.txt

Responsibilities:

### main.py

- Initialize FastAPI.
- Register API routes.
- Configure WebSocket endpoints.
- Initialize database.
- Start and stop background services.
- Serve the React production build.

### sos_manager.py

- Validate emergency requests.
- Generate unique SOS identifiers.
- Store SOS requests.
- Manage delivery states.
- Handle duplicate submissions.

### lora_service.py

- Establish USB serial communication.
- Receive LoRa acknowledgements.
- Forward SOS packets.
- Handle serial disconnections.
- Report communication status.

### transmission_queue.py

- Queue emergency messages.
- Manage retries.
- Avoid duplicate transmissions.
- Preserve pending requests.
- Handle acknowledgement timeouts.

### drone_status.py

Maintain:

- Drone operational status.
- Battery information when available.
- Perching state.
- Wi-Fi service status.
- LoRa connectivity.
- Ground station connectivity.

### websocket/manager.py

Manage connected survivor browsers and broadcast relevant status updates.

# 9. REST API Requirements

Create the following endpoints.

## POST /api/sos

Accepts a new emergency request.

Example request:

{
  "emergencyType": "TRAPPED",
  "peopleCount": 3,
  "location": {
    "latitude": 19.0000,
    "longitude": 72.0000
  },
  "landmark": "Near damaged building",
  "message": "Three people need immediate rescue"
}

Backend responsibilities:

1. Validate the request using Pydantic.
2. Generate a unique SOS ID.
3. Store the request in SQLite.
4. Create a transmission queue entry.
5. Return the generated SOS ID.
6. Return the actual backend receipt status.

## GET /api/sos/{sos_id}

Return emergency details and current delivery status.

## POST /api/sos/{sos_id}/update

Allow additional information to be attached to an existing emergency request.

## GET /api/drone/status

Return available drone information.

Example:

{
  "wifiAvailable": true,
  "droneStatus": "PERCHED",
  "loraStatus": "CONNECTED",
  "batteryPercentage": null,
  "groundStationConnected": true
}

Values must reflect actual available hardware data.

Unknown values should remain null or be reported as unavailable. Never invent telemetry.

## GET /api/health

Return backend health information.

# 10. WebSocket Communication

Use FastAPI WebSockets for real-time status updates.

Suggested endpoint:

`/ws/sos/{sos_id}`

Events:

- drone_status_update
- sos_received_by_drone
- sos_transmission_started
- sos_received_by_ground_station
- rescue_team_acknowledged
- sos_transmission_failed

Example event:

{
  "event": "sos_received_by_ground_station",
  "sosId": "SOS-0001",
  "timestamp": "ISO-8601 timestamp"
}

The React application must update the status without requiring a page refresh.

If WebSocket disconnects:

- Automatically attempt reconnection.
- Fetch current SOS status through the REST API.
- Display the last known status.
- Do not assume the message failed merely because the browser disconnected.

The backend must support multiple connected survivors.

Do not use a single global status variable for all SOS requests.

# 11. Database Design

Use SQLite with SQLAlchemy.

Create an SOS table containing:

- id
- emergency_type
- people_count
- latitude
- longitude
- landmark
- additional_message
- created_at
- updated_at
- drone_received
- transmission_status
- ground_station_acknowledged
- rescue_team_acknowledged

Create additional tables if necessary for:

- Transmission attempts.
- Acknowledgement history.
- Additional SOS messages.
- Event timestamps.

Requirements:

- Persist emergency records.
- Prevent duplicate submissions.
- Maintain message history.
- Preserve pending SOS messages after application restart.
- Use unique message identifiers.
- Ensure retries do not create duplicate emergency cases.

SQLite is sufficient for the initial prototype.

# 12. LoRa Integration

Actual LoRa hardware integration will be implemented after the initial UI and backend work.

The LILYGO T3-S3 SX1262 will connect to the Raspberry Pi using USB serial.

The ESP32-S3 firmware will handle radio-level operations.

FastAPI will communicate with the ESP32 through Python PySerial.

Suggested architecture:

FastAPI
  |
  v
LoRa Service
  |
  v
PySerial
  |
  v
LILYGO T3-S3
  |
  v
SX1262

The LoRa service must:

- Monitor serial communication.
- Send queued SOS packets.
- Receive ground station acknowledgements.
- Validate incoming packets.
- Handle serial disconnections.
- Report radio status.
- Notify SOS manager of transmission results.

Implement a mock LoRa service initially.

Clearly separate simulated and actual hardware states.

Do not claim real transmission or rescue acknowledgement during simulation.

# 13. YOLO Integration

PerchLink already has a trained YOLO11n-based computer vision pipeline.

The existing oblique-POV model must be preserved and inspected.

Do not overwrite existing checkpoints or retrain the model unnecessarily.

The computer vision pipeline should operate independently of the survivor interface.

Suggested architecture:

YOLO Python Process
  |
  v
Internal status/data interface
  |
  v
FastAPI backend
  |
  v
WebSocket updates

Do not execute lengthy YOLO inference inside API request handlers.

Do not allow camera processing to block SOS submission or LoRa communication.

For Raspberry Pi 4B:

- Benchmark the existing model before deployment.
- Evaluate NCNN or another ARM-compatible optimized runtime.
- Test reduced input resolution.
- Measure sustained FPS and memory use.
- Monitor CPU temperature and throttling.
- Keep the original checkpoint unchanged.
- Prioritize communication reliability over camera frame rate.

# 14. Offline-First Requirements

The application must operate without internet access.

Requirements:

- All frontend assets hosted locally.
- No external API dependencies for basic operation.
- No remote font dependencies.
- No external image dependencies.
- Local API requests.
- Local WebSocket connection.
- Local SQLite database.
- Graceful Wi-Fi reconnection.
- SOS status retrieval after browser reconnection.

A PWA can be implemented after the basic web application works.

The Raspberry Pi backend remains the authoritative SOS record.

If a user loses connectivity before the backend receives their SOS, clearly indicate that the request has not yet reached the drone.

# 15. Security and Reliability

Implement:

- Pydantic input validation.
- Request size limits.
- Basic rate limiting.
- Unique SOS IDs.
- Duplicate submission protection.
- Safe GPS permission handling.
- Restricted local network access.
- No unnecessary personal information collection.
- Persistent emergency storage.
- Accurate acknowledgement reporting.

Do not expose the backend to the public internet by default.

Do not falsely promise rescue or guaranteed message delivery.

# 16. Frontend Folder Structure

frontend/
  public/
  src/
    assets/

    components/
      Header.jsx
      ConnectionStatus.jsx
      SOSButton.jsx
      EmergencyCard.jsx
      DeliveryTimeline.jsx

    pages/
      Home.jsx
      SOSForm.jsx
      SOSStatus.jsx
      EmergencyDetails.jsx
      Help.jsx

    services/
      api.js
      socket.js

    hooks/
      useDroneStatus.js
      useSOSStatus.js

    App.jsx
    main.jsx

# 17. Raspberry Pi Deployment

Target device:

Raspberry Pi 4 Model B – 4 GB RAM.

Recommended operating system:

Raspberry Pi OS Lite 64-bit.

Deployment responsibilities:

1. Install Python and required dependencies.
2. Install Node.js only on the development machine for building the React frontend; it is not required on the Pi for serving static files.
3. Install FastAPI and Uvicorn on the Pi.
4. Configure SQLite.
5. Build React production files.
6. Serve frontend files through FastAPI.
7. Configure hostapd and dnsmasq for the local Wi-Fi hotspot.
8. Configure automatic startup using systemd.
9. Configure application logs.
10. Test all essential functionality without internet.

Use one main local address:

`http://192.168.4.1`

FastAPI should serve both the React application and its API from the same origin.

This avoids unnecessary cross-origin configuration.

# 18. Development Phases

## Phase 1 – Survivor Frontend

Build the complete React interface using simulated backend data.

Deliverables:

- Mobile-first responsive UI.
- Emergency home screen.
- SOS form.
- GPS sharing.
- Manual location entry.
- SOS status timeline.
- Emergency details.
- Help screen.
- Simulated drone status.

## Phase 2 – FastAPI Backend

Deliverables:

- FastAPI application.
- REST endpoints.
- SQLite integration.
- Pydantic validation.
- WebSocket manager.
- SOS manager.
- Mock LoRa service.
- Transmission queue.

## Phase 3 – Frontend and Backend Integration

Deliverables:

- Real HTTP API requests.
- WebSocket updates.
- Persistent SOS records.
- Reconnection support.
- Multiple smartphone connections.
- Accurate delivery status.

## Phase 4 – Raspberry Pi Deployment

Deliverables:

- Raspberry Pi OS Lite 64-bit.
- FastAPI hosting.
- Local Wi-Fi access point.
- Local website.
- Automatic startup.
- Offline testing.
- Resource monitoring.

## Phase 5 – LoRa Integration

Deliverables:

- USB serial connection.
- LILYGO firmware integration.
- Real LoRa packet transmission.
- Ground station acknowledgement.
- Retry mechanism.
- Real-time survivor updates.

## Phase 6 – YOLO and Full-System Integration

Deliverables:

- Existing YOLO model deployment.
- Drone status integration.
- Computer vision status reporting.
- Resource optimization.
- Full operational testing.

# 19. Acceptance Testing

| Test | Expected result |
|---|---|
| Open website without internet | Pass |
| Android smartphone connects | Pass |
| iPhone connects | Pass |
| Submit emergency request | Stored on Pi |
| GPS sharing | Coordinates received |
| GPS unavailable | Manual location accepted |
| Multiple survivors connect | Independent SOS records |
| LoRa unavailable | SOS remains pending |
| Ground station acknowledges | Status updates |
| WebSocket disconnects | Reconnect and recover status |
| Raspberry Pi restarts | SOS records preserved |
| No internet | Essential functionality works |
| Simulated LoRa mode | Clearly labelled as simulation |

# 20. Instructions to the Coding Agent

Before implementation:

1. Read this entire PLAN.md.
2. Inspect the existing PerchLink repository and avoid overwriting existing project files.
3. Confirm the development environment.
4. Create a clean React + Vite frontend.
5. Create a Python FastAPI backend.
6. Implement Phase 1 before proceeding to Phase 2.
7. Keep LoRa and YOLO integration modular.
8. Use simulated data only where hardware is unavailable.
9. Clearly label simulated events.
10. Test all interfaces on mobile screen sizes.
11. Keep the application lightweight for Raspberry Pi 4B.
12. Document setup and execution commands in README.md.

Do not implement all phases in one unverified operation.

Prioritize working functionality, offline reliability, truthful SOS acknowledgements and a simple user experience.

---

# FINAL PROJECT OBJECTIVE

A person trapped in a disaster zone should be able to connect their smartphone to the PerchLink drone's local Wi-Fi network, open the emergency interface, submit an SOS request and receive truthful confirmation when the message reaches the rescue station.

The entire process must work without relying on conventional mobile networks or internet infrastructure.

**PerchLink creates its own emergency communication infrastructure when existing infrastructure fails.**