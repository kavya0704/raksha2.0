# PHASE-WISE IMPLEMENTATION PLAN

## Project: RAKSHA AI 2.0 (रक्षा AI)
### AI-Based Intelligent Video Analytics Platform for Border Surveillance using Existing CCTV Infrastructure
**Smart India Hackathon 2026 | Problem Statement: SIH26187**  
**Ministry of Home Affairs (MHA) | Theme: Smart Automation | Track: Software**  
**Reference Document:** IEEE 830 SRS & [`ARCHITECTURE.md`](file:///c:/Users/kavya/raksha_ai_2.0/ARCHITECTURE.md)  
**Document Version:** 2.0.0 | **Authoritative Engineering Roadmap**

---

## 1. Executive Implementation Roadmap & Timeline

The implementation of **RAKSHA AI 2.0** is divided into **7 structured engineering phases**, designed to ensure modularity, complete air-gapped edge autonomy, zero-loss offline resilience, and defense-grade verification:

```
+----------------------------------------------------------------------------------------------------+
|                                    PHASE-WISE IMPLEMENTATION ROADMAP                               |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ PHASE 0: Baseline Setup & Threat Modeling ]                                                     |
|    └─ Hardware sizing, environment validation, air-gapped security boundaries                      |
|                                 │                                                                  |
|                                 ▼                                                                  |
|  [ PHASE 1: Computer Vision & Edge AI Retrofit Core ]                                              |
|    └─ Multi-source ingestion, LAB CLAHE de-fogger, YOLOv8n + ByteTrack, wildlife suppression       |
|                                 │                                                                  |
|                                 ▼                                                                  |
|  [ PHASE 2: Local Encrypted Storage & Store-and-Forward Sync ]                                     |
|    └─ AES-128 SQLite store, zero-loss write pipeline, paho-mqtt worker with retry backoff         |
|                                 │                                                                  |
|                                 ▼                                                                  |
|  [ PHASE 3: Command Center HQ Backend & Telemetry Broker ]                                         |
|    └─ MQTT broker gateway, delayed-sync latency engine, FastAPI WebSockets, immutable audit trail  |
|                                 │                                                                  |
|                                 ▼                                                                  |
|  [ PHASE 4: Tactical Web Dashboard & Mobile QRT Companion ]                                        |
|    └─ Dark military HUD, Leaflet GIS map, 2x2 live grid, alert dossier, zone calibration canvas     |
|                                 │                                                                  |
|                                 ▼                                                                  |
|  [ PHASE 5: Tactical AI Copilot & Military SitRep Generator ]                                      |
|    └─ Groq ultra-low latency LLM, automated SitReps, QRT patrol orders, conversational assistant   |
|                                 │                                                                  |
|                                 ▼                                                                  |
|  [ PHASE 6: Testing, Outage Simulation & Hackathon Demo Hardening ]                                 |
|    └─ Vision accuracy verification, 3-minute blackout burst sync test, 1-click master launcher     |
|                                 │                                                                  |
|                                 ▼                                                                  |
|  [ PHASE 7: Field Deployment, CIBMS Integration & Sizing Blueprint ]                               |
|    └─ Multi-BOP scaling, 30-day ring buffer, bandwidth throttling, failover policies               |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Detailed Phase Specifications

### Phase 0: Baseline Setup, Environment Validation & Security Boundaries

#### 0.1 Objectives
- Establish isolated Python 3.10+ and Node.js 18+ runtime environments.
- Verify hardware acceleration (CPU AVX2/AVX-512, integrated GPU, or discrete GPU).
- Define air-gapped operational boundaries and secret storage rules.

#### 0.2 Implementation Tasks
- **Task 0.1**: Configure project directory tree (`edge/`, `backend/`, `broker/`, `frontend/`, `demo_assets/`).
- **Task 0.2**: Install core dependencies: `ultralytics`, `opencv-python`, `paho-mqtt`, `cryptography`, `fastapi`, `uvicorn`, `groq`, `python-dotenv`.
- **Task 0.3**: Configure [`.gitignore`](file:///c:/Users/kavya/raksha_ai_2.0/.gitignore) to protect local databases (`*.db`), secrets (`.env`), snapshots, and build artifacts.
- **Task 0.4**: Establish security baseline: Strictly **zero cloud dependencies** for core vision and **zero facial recognition/biometrics**.

#### 0.3 Deliverables & Exit Criteria
- Verified clean package environment with 0 version conflicts.
- Secured `.env` template configured with platform branding (`WEBSITE_NAME="Raksha AI"`).

---

### Phase 1: Computer Vision & Edge AI Retrofit Core

#### 1.1 Objectives
- Convert legacy analog/IP CCTV feeds into real-time intelligent vision pipelines.
- Implement real-time atmospheric de-fogging for harsh border weather.
- Deliver multi-object detection, persistent tracking, directional tripwires, and wildlife suppression.

#### 1.2 Implementation Tasks
- **Task 1.1 (Multi-Source Video Ingestion)**:
  - Implement universal capture in [`edge/edge_service.py`](file:///c:/Users/kavya/raksha_ai_2.0/edge/edge_service.py) supporting RTSP streams (`rtsp://`), USB webcam indices (`0`), and video test files (`.mp4`).
  - Normalize frame dimensions to $640 \times 360$ at $\approx 30\text{ FPS}$ to maintain latency under $45\text{ ms}$.
- **Task 1.2 (Atmospheric Fog-Clearing Pipeline)**:
  - Build [`edge/fog_enhancer.py`](file:///c:/Users/kavya/raksha_ai_2.0/edge/fog_enhancer.py) using LAB-space CLAHE (clip limit $= 3.5$, grid $= 8 \times 8$).
  - Integrate fast Gamma Lookup Table ($\gamma = 1.25$) and Gaussian unsharp masking ($1.3 \times I_{\text{gamma}} - 0.3 \times \text{GaussianBlur}$).
  - Connect dynamic on/off toggle to allow live comparison during dense fog/dust.
- **Task 1.3 (YOLOv8 Detection & ByteTrack Persistent Tracking)**:
  - Implement [`edge/detector.py`](file:///c:/Users/kavya/raksha_ai_2.0/edge/detector.py) using `yolov8n.pt` with confidence threshold $\tau = 0.30$.
  - Bind ByteTrack Kalman-filter association to maintain constant `track_id` values across frames, eliminating alert spam.
- **Task 1.4 (Wildlife False-Positive Suppression Matrix)**:
  - Implement [`edge/animal_filter.py`](file:///c:/Users/kavya/raksha_ai_2.0/edge/animal_filter.py).
  - Alertable Classes: `person`, `car`, `truck`, `motorcycle`, `bicycle`, `bus`.
  - Suppressed Wildlife Classes: `dog`, `cat`, `cow`, `horse`, `sheep`, `elephant`, `bear`, `bird`, `zebra`, `giraffe`.
  - Suppressed targets render with emerald green bounding boxes labeled `"Safe — Animal, Suppressed"` without firing audio/network alarms.
- **Task 1.5 (Spatial Perimeter Analytics & Temporal Confirmation)**:
  - Implement [`edge/zone_analytics.py`](file:///c:/Users/kavya/raksha_ai_2.0/edge/zone_analytics.py) with Ray-Casting Point-in-Polygon (PIP) and vector cross-product directional tripwires ($\vec{W} \times \vec{M}$).
  - Enforce $\ge 4$ consecutive confirmed frames before dispatching alerts to discard transient vegetation jitter.

#### 1.3 Deliverables & Exit Criteria
- Unit test suite [`test_vision_pipeline.py`](file:///c:/Users/kavya/raksha_ai_2.0/test_vision_pipeline.py) passes 100%.
- Verified CLAHE enhancement visibly clears fog and reveals hidden crawling silhouettes.

---

### Phase 2: Local Edge Encrypted Storage & Store-and-Forward Sync

#### 2.1 Objectives
- Guarantee **zero alert loss** during complete communications blackouts.
- Protect data-at-rest with military-grade symmetric encryption.
- Implement autonomous background synchronization over MQTT with live queue monitoring.

#### 2.2 Implementation Tasks
- **Task 2.1 (Encrypted SQLite Persistence Layer)**:
  - Build [`edge/storage.py`](file:///c:/Users/kavya/raksha_ai_2.0/edge/storage.py) managing `edge_storage/edge_alerts.db`.
  - Schema: `id`, `camera_id`, `bop_id`, `object_type`, `confidence`, `incursion_type`, `zone_name`, `severity`, `timestamp`, `snapshot_path`, `thumbnail_base64`, `synced_flag`.
  - Encrypt payload records using AES-128 / Fernet symmetric key (`LOCAL_STORAGE_KEY`).
  - Cache high-resolution snapshots to `edge_storage/snapshots/` and compress $320 \times 240$ base64 thumbnails for low-bandwidth telemetry packets.
- **Task 2.2 (MQTT Store-and-Forward Client)**:
  - Build [`edge/mqtt_sync.py`](file:///c:/Users/kavya/raksha_ai_2.0/edge/mqtt_sync.py) using `paho-mqtt` v2.
  - Dedicated background worker querying `synced_flag = 0` at $2.0\text{s}$ intervals.
  - Publish to `border/{bop_id}/alerts` using **MQTT QoS 1** (At least once delivery).
  - On broker acknowledgment, execute batch atomic update: `synced_flag = 1, synced_at = time.time()`.
- **Task 2.3 (HUD Telemetry & Outage Counter)**:
  - Overlay real-time HUD status bar on the video feed in [`edge/edge_service.py`](file:///c:/Users/kavya/raksha_ai_2.0/edge/edge_service.py):
    - `ALL-WEATHER ENHANCE: ON/OFF`
    - `QUEUED (UNSYNCED): N` (increments during outages; returns to 0 on sync)
    - `CAM-01 | FPS: 28.5`

#### 2.3 Deliverables & Exit Criteria
- Edge Unit runs continuously and logs 100% of alerts locally when disconnected from network.
- `Queued: N` counter visibly increments during simulated link failure.

---

### Phase 3: Command Center HQ Backend & Telemetry Broker

#### 3.1 Objectives
- Establish the central Tactical Command ingestion server at Sector/Frontier Headquarters.
- Differentiate live incursion alarms from delayed sync recovery batches.
- Provide real-time WebSocket distribution and immutable sentry audit trails.

#### 3.2 Implementation Tasks
- **Task 3.1 (Embedded & External MQTT Broker Gateway)**:
  - Build [`broker/embedded_broker.py`](file:///c:/Users/kavya/raksha_ai_2.0/broker/embedded_broker.py) providing standalone zero-config MQTT routing on port 1883 with 100% Eclipse Mosquitto compatibility.
- **Task 3.2 (HQ Ingestion Engine & Delayed-Sync Latency Classifier)**:
  - Build [`backend/mqtt_subscriber.py`](file:///c:/Users/kavya/raksha_ai_2.0/backend/mqtt_subscriber.py) subscribing to `border/+/alerts`.
  - Calculate latency: $\Delta t = t_{\text{received}} - t_{\text{detected}}$.
  - If $\Delta t > 15.0\text{ seconds}$, assign flag `is_delayed_sync = 1` and label `"Synced X min late"`.
- **Task 3.3 (Master HQ Database & Audit Logging)**:
  - Build [`backend/database.py`](file:///c:/Users/kavya/raksha_ai_2.0/backend/database.py) managing `hq_storage/command_center_master.db`.
  - Master tables: `hq_alerts` and `audit_logs`.
  - Record all sentry actions (`ACKNOWLEDGE`, `ESCALATE`, `MARK_FALSE_POSITIVE`, `RESOLVE`) with Operator ID, timestamp, and client IP.
- **Task 3.4 (FastAPI Core & WebSocket Hub)**:
  - Implement [`backend/main.py`](file:///c:/Users/kavya/raksha_ai_2.0/backend/main.py) and [`backend/websocket_manager.py`](file:///c:/Users/kavya/raksha_ai_2.0/backend/websocket_manager.py).
  - Mount REST routers: `/api/alerts`, `/api/cameras`, `/api/zones`, `/api/analytics`, `/api/footage`.
  - Real-time WebSocket endpoint `/ws` pushing instant alerts to connected browsers.
- **Task 3.5 (On-Demand Raw Footage Retrieval Service)**:
  - Implement [`backend/routes/footage.py`](file:///c:/Users/kavya/raksha_ai_2.0/backend/routes/footage.py) to simulate throttled background extraction of full 1080p raw outpost video segments.

#### 3.3 Deliverables & Exit Criteria
- HQ server ingests edge alerts via MQTT, records them to master DB, and pushes to WebSockets in $< 50\text{ ms}$.

---

### Phase 4: Tactical Web Dashboard & Mobile QRT Companion

#### 4.1 Objectives
- Build an intuitive, military-grade operational command interface in React 18 + Tailwind CSS v4.
- Provide GIS tactical mapping, live camera grid, incident feeds, and zone calibration.
- Deliver a sunlight-readable QRT companion screen for mobile patrol units.

#### 4.2 Implementation Tasks
- **Task 4.1 (Tactical Design System & Navbar)**:
  - Configure Tailwind CSS v4 variables in [`frontend/src/index.css`](file:///c:/Users/kavya/raksha_ai_2.0/frontend/src/index.css) (slate backgrounds, cyan accents, crimson alarms).
  - Build [`frontend/src/components/Navbar.jsx`](file:///c:/Users/kavya/raksha_ai_2.0/frontend/src/components/Navbar.jsx) with sector selector, IST clock, and HQ link indicator (`HQ LINK: CONNECTED` vs `HQ LINK: OFFLINE (N QUEUED)`).
- **Task 4.2 (Navigation Sidebar & Outpost Telemetry)**:
  - Build [`frontend/src/components/Sidebar.jsx`](file:///c:/Users/kavya/raksha_ai_2.0/frontend/src/components/Sidebar.jsx) with navigation modes and edge telemetry panel.
- **Task 4.3 (Tactical GIS Leaflet Map)**:
  - Build [`frontend/src/components/TacticalMap.jsx`](file:///c:/Users/kavya/raksha_ai_2.0/frontend/src/components/TacticalMap.jsx) with dark CartoDB tiles, active camera pins with pulsing alarm states, and sterile buffer zone polygons.
- **Task 4.4 (2x2 Multi-Feed Camera Grid)**:
  - Build [`frontend/src/components/CameraGrid.jsx`](file:///c:/Users/kavya/raksha_ai_2.0/frontend/src/components/CameraGrid.jsx) displaying live MJPEG streams, bounding boxes, FPS counters, and the per-camera **"Enhance All-Weather Feed"** toggle button.
- **Task 4.5 (Live Incident Feed & Delayed-Sync Badges)**:
  - Build [`frontend/src/components/LiveAlertFeed.jsx`](file:///c:/Users/kavya/raksha_ai_2.0/frontend/src/components/LiveAlertFeed.jsx) rendering chronological alert cards with snapshot thumbnails, confidence %, and amber `"Synced X min late"` badges.
- **Task 4.6 (Forensic Investigation Dossier)**:
  - Build [`frontend/src/components/AlertDetailModal.jsx`](file:///c:/Users/kavya/raksha_ai_2.0/frontend/src/components/AlertDetailModal.jsx) with evidence snapshot, GPS coordinates, tracking history, full footage fetch button, and tactical disposition actions (`[Dispatch QRT]`, `[Escalate]`, `[Mark False Positive]`, `[Resolve]`).
- **Task 4.7 (Visual Zone Calibration Canvas)**:
  - Build [`frontend/src/components/ZoneConfigView.jsx`](file:///c:/Users/kavya/raksha_ai_2.0/frontend/src/components/ZoneConfigView.jsx) allowing sentries to define polygon sterile zones and directional tripwires over live camera feeds.
- **Task 4.8 (Intelligence Analytics & Incursion Heatmaps)**:
  - Build [`frontend/src/components/AnalyticsView.jsx`](file:///c:/Users/kavya/raksha_ai_2.0/frontend/src/components/AnalyticsView.jsx) with KPI stat cards (Total Alerts, 94.2% False-Positive Reduction, MTTA), 24-hour threat volume charts, and Sector Incursion Heat Matrix.
- **Task 4.9 (High-Contrast QRT Mobile Companion)**:
  - Build [`frontend/src/components/MobilePatrolView.jsx`](file:///c:/Users/kavya/raksha_ai_2.0/frontend/src/components/MobilePatrolView.jsx) with high-contrast yellow/black sunlight-readable UI and 1-tap `"Acknowledge & Intercept"` button.
- **Task 4.10 (Immutable Audit Trail View)**:
  - Build [`frontend/src/components/AuditTrailView.jsx`](file:///c:/Users/kavya/raksha_ai_2.0/frontend/src/components/AuditTrailView.jsx) displaying non-repudiable logs of sentry actions.

#### 4.3 Deliverables & Exit Criteria
- `npm run build` compiles cleanly into `frontend/dist/` with 0 errors.
- Real-time WebSocket audio ping triggers immediately upon new breach.

---

### Phase 5: Tactical AI Copilot & Automated Military SitRep Generation

#### 5.1 Objectives
- Integrate Groq ultra-low latency LLM inference for automated tactical briefing.
- Auto-generate structured military Situation Reports (SitReps) and QRT dispatch orders in $< 400\text{ ms}$.
- Provide natural language situational intelligence querying for commanders.

#### 5.2 Implementation Tasks
- **Task 5.1 (Groq LLM Engine Setup)**:
  - Build [`backend/ai_copilot.py`](file:///c:/Users/kavya/raksha_ai_2.0/backend/ai_copilot.py) with Groq client (`GROQ_MODEL=qwen/qwen3.8-27b`).
  - Configure automatic local rule-based fallback if offline.
- **Task 5.2 (Automated Military SitRep Generator)**:
  - Implement structured SitRep generation:
    - Executive Threat Level (`CRITICAL` / `HIGH` / `MEDIUM`)
    - Tactical Synopsis
    - Incursion Vector & Intent Assessment
    - Terrain & Weather Impact (Fog factor)
    - Recommended Response Directive
    - Rules of Engagement (ROE) Guidance
- **Task 5.3 (QRT Patrol Dispatch Order Formulation)**:
  - Auto-generate QRT dispatch orders containing target profile, interception cordon GPS coordinates, and VHF radio frequencies.
- **Task 5.4 (Commander's Tactical AI Copilot View)**:
  - Build [`frontend/src/components/AICopilotView.jsx`](file:///c:/Users/kavya/raksha_ai_2.0/frontend/src/components/AICopilotView.jsx) and wire `/api/ai/chat` for conversational querying with real-time awareness of active cameras and recent incursions.

#### 5.3 Deliverables & Exit Criteria
- Verified SitRep generation in $< 400\text{ ms}$ via Groq API.
- Verified air-gapped fallback operates without crashing when offline.

---

### Phase 6: Testing, Outage Simulation & Hackathon Demo Hardening

#### 6.1 Objectives
- Rigorously test and validate all functional pillars and hero moments.
- Deliver automated test suites and 1-click execution for hackathon judges.

#### 6.2 Implementation Tasks
- **Task 6.1 (Synthetic Border Surveillance Video Generator)**:
  - Execute [`demo_assets/generate_sample_videos.py`](file:///c:/Users/kavya/raksha_ai_2.0/demo_assets/generate_sample_videos.py):
    - `border_patrol.mp4`: Human infiltration crossing perimeter tripwire.
    - `border_fog.mp4`: Dense fog incursion testing CLAHE de-noising.
    - `border_wildlife.mp4`: Grazing cattle testing wildlife suppression.
- **Task 6.2 (Vision Pipeline Verification Suite)**:
  - Execute [`test_vision_pipeline.py`](file:///c:/Users/kavya/raksha_ai_2.0/test_vision_pipeline.py):
    - Test 1: CLAHE Atmospheric Fog Clearing ($\text{PASS}$).
    - Test 2: Wildlife Suppression Filter ($\text{PASS}$ - Dog/Cow $\rightarrow$ `SUPPRESS`, Person $\rightarrow$ `ALERT`).
    - Test 3: Spatial Geometry & Intersection Math ($\text{PASS}$).
- **Task 6.3 (Zero-Internet Store-and-Forward Outage Suite)**:
  - Execute [`test_offline_sync.py`](file:///c:/Users/kavya/raksha_ai_2.0/test_offline_sync.py):
    - Simulates 3-minute network blackout.
    - Verifies local encrypted SQLite write and `Queued: N` incrementing.
    - Restores network and verifies burst incremental synchronization.
    - Verifies HQ tagging delayed alerts as `"Synced 3 min late"` ($\text{PASS}$).
- **Task 6.4 (1-Click Master Application Launcher)**:
  - Build [`run_all.py`](file:///c:/Users/kavya/raksha_ai_2.0/run_all.py) which initializes the broker, starts the backend, starts the edge sentinel, serves the React production bundle, and launches the browser at `http://127.0.0.1:8000`.

#### 6.3 Deliverables & Exit Criteria
- Both automated test suites pass with **100% success rate**.
- Full system launches in $< 5\text{ seconds}$ via `python run_all.py`.

---

### Phase 7: Field Deployment, CIBMS Integration & Sizing Blueprint

#### 7.1 Objectives
- Outline multi-BOP horizontal scaling and CIBMS grid integration.
- Establish hardware sizing, bandwidth throttling, and storage retention policies.

#### 7.2 Specifications & Guidelines
- **Multi-BOP Scaling**:
  - Each forward outpost runs an independent Edge Sentinel Node assigned a unique `BOP_ID` (e.g., `BOP-01-NATHULA`, `BOP-02-DOKLAM`, `BOP-03-CHUSHUL`).
  - Sector HQ subscribes to wildcard topic `border/+/alerts` to aggregate 50+ outposts onto a unified tactical GIS map.
- **Bandwidth Consumption Budget**:
  - Idle state: $< 1.5\text{ KB/s}$ per camera (heartbeat only).
  - Alert burst: $\approx 35\text{ KB}$ per alert (JSON metadata + base64 thumbnail).
  - Raw 1080p footage remains stored at the outpost; transmitted *only* upon explicit HQ operator request over throttled links.
- **Storage Retention & Ring Buffer Policy**:
  - Snapshots & alert metadata: Retained for 180 days in SQLite.
  - Raw footage buffer: 30-day FIFO ring buffer on local NVMe/SSD storage.
- **Hardware Sizing Recommendations**:
  - **Edge Sentinel**: Intel Core i3/i5 11th Gen+ or NVIDIA Jetson Orin Nano, 8GB RAM, 256GB NVMe SSD.
  - **Sector HQ Server**: Quad-Core Xeon / Ryzen 5, 16GB RAM, 1TB NVMe SSD.

---

## 3. Implementation Verification & Traceability Matrix

| Phase | Milestone / Component | Verification Command | Success Criteria | Status |
|---|---|---|---|---|
| **Phase 1** | Vision, CLAHE & Wildlife Suppression | `python test_vision_pipeline.py` | All 3 test modules pass (100%) | ✅ **VERIFIED** |
| **Phase 2** | Edge Storage & Offline Queueing | `python test_offline_sync.py` | Alerts persist during blackout | ✅ **VERIFIED** |
| **Phase 3** | MQTT Broker & Delayed-Sync Latency | `python test_offline_sync.py` | Backlog flagged "Synced X min late" | ✅ **VERIFIED** |
| **Phase 4** | Tactical React Operations Dashboard | `npm run build` (in `frontend/`) | Bundle compiles cleanly in $< 3\text{s}$ | ✅ **VERIFIED** |
| **Phase 5** | Groq AI SitRep & QRT Orders | `python backend/ai_copilot.py` | Instant SitRep generation $< 400\text{ms}$ | ✅ **VERIFIED** |
| **Phase 6** | 1-Click Master Launcher & Demo | `python run_all.py` | Complete stack operational on :8000 | ✅ **VERIFIED** |

---

## 4. Conclusion

This Phase-Wise Implementation Plan provides a comprehensive, defense-grade blueprint that ensures **RAKSHA AI 2.0** meets all technical, operational, and presentation requirements for **Smart India Hackathon 2026 (SIH26187)**.
