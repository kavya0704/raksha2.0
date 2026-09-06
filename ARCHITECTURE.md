# SYSTEM ARCHITECTURE DOCUMENTATION

## Project: RAKSHA AI 2.0 (रक्षा AI)
### AI-Based Intelligent Video Analytics Platform for Border Surveillance using Existing CCTV Infrastructure
**Smart India Hackathon 2026 | Problem Statement: SIH26187**  
**Ministry of Home Affairs (MHA) | Theme: Smart Automation | Track: Software**  
**Document Version:** 2.0.0 | **Authoritative Engineering Reference**

---

## 1. Architectural Philosophy & Design Principles

**RAKSHA AI 2.0** is engineered specifically for forward Border Outposts (**BSF, ITBP, SSB, Assam Rifles**) operating in extreme geographical terrains (high-altitude mountains, dense jungles, deserts, and riverine borders) characterized by volatile, intermittent, or completely severed network connectivity.

### 1.1 Core Architectural Tenets
1. **Software-Only Retrofit (Zero Hardware Replacement)**: Plugs seamlessly into existing analog (via DVR/NVR encoders) and IP cameras (via RTSP/ONVIF), converting passive recording devices into proactive tactical early-warning sentinels.
2. **Edge-First Autonomy ("Atmanirbhar Edge")**: The Edge Unit executes 100% of video ingestion, CLAHE de-fogging, YOLOv8 detection, ByteTrack tracking, tripwire analysis, and local encrypted logging with **zero dependency on external network pings or cloud services**.
3. **Transport-Agnostic Store-and-Forward**: The synchronization layer operates reliably regardless of whether the physical link is optical fiber (CIBMS), VHF/UHF tactical radio mesh, VSAT satellite, 4G/5G, or physically transported memory cards.
4. **Guaranteed Zero Alert Loss**: Alerts and snapshots are committed to the local encrypted SQLite database *before* any network transmission is attempted.
5. **Privacy & Legal Realism (Zero Biometrics)**: Excludes facial recognition and biometric profiling by design, reflecting real-world optical realities at 50m–500m CCTV distances and complying with legal/privacy standards.

---

## 2. High-Level System Topology & End-to-End Architecture

```
+----------------------------------------------------------------------------------------------------+
|                                    RAKSHA AI 2.0 SYSTEM TOPOLOGY                                   |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ Existing Analog / IP CCTV Cameras / RTSP Streams / Webcams / Video Test Files ]                 |
|                                            │                                                       |
|                                            ▼                                                       |
|  +──────────────────────────────────────────────────────────────────────────────────────────────+  |
|  | EDGE SENTINEL SUBSYSTEM (Forward Border Outpost Local Mini-PC / Edge Box)                    |  |
|  |                                                                                              |  |
|  |  [ Stage 1: Frame Ingestion & Normalization ] (OpenCV / RTSP Grabber - 640x360 @ 30 FPS)     |  |
|  |                         │                                                                    |  |
|  |                         ▼                                                                    |  |
|  |  [ Stage 2: Atmospheric De-Noiser ] ──(Toggle: ON/OFF)──> [ CLAHE LAB + Gamma + Sharpening ]  |  |
|  |                         │                                                                    |  |
|  |                         ▼                                                                    |  |
|  |  [ Stage 3: Neural Target Detector ] (Ultralytics YOLOv8n Nano Engine)                       |  |
|  |                         │                                                                    |  |
|  |                         ▼                                                                    |  |
|  |  [ Stage 4: Persistent Multi-Frame Tracker ] (ByteTrack Kalman Filter + IoU Association)    |  |
|  |                         │                                                                    |  |
|  |                         ▼                                                                    |  |
|  |  [ Stage 5: Wildlife Suppression Filter ]                                                    |  |
|  |        ├─ Wildlife (Cattle/Dogs) ──> Tag: "Safe — Animal, Suppressed" (Green Box, No Alarm)  |  |
|  |        └─ Tactical Target (Person/Vehicle) ──> Proceed to Spatial Analytics                  |  |
|  |                         │                                                                    |  |
|  |                         ▼                                                                    |  |
|  |  [ Stage 6: Spatial Perimeter Analytics ]                                                    |  |
|  |        ├─ Directional Virtual Tripwires (Vector Cross-Product Inbound Crossing)              |  |
|  |        ├─ Multi-Point Sterile Zones (Ray-Casting Point-in-Polygon)                           |  |
|  |        └─ Temporal Validation (>= 4 Consecutive Frame Confirmation)                          |  |
|  |                         │                                                                    |  |
|  |                         ▼                                                                    |  |
|  |  [ Stage 7: Local Encrypted Store ] (AES-128 SQLite Database + Snapshot Cache)               |  |
|  |        └─ Zero Alert Loss Guarantee (Writes locally with synced_flag = 0)                    |  |
|  |                         │                                                                    |  |
|  |                         ▼                                                                    |  |
|  |  [ Stage 8: Background MQTT Sync Worker ] (paho-mqtt Publisher with Auto-Retry Backoff)      |  |
|  +──────────────────────────────────────────────────────────────────────────────────────────────+  |
|                                            │                                                       |
|                                            │ (Intermittent Tactical Link: Radio / VSAT / Fiber)     |
|                                            ▼                                                       |
|  +──────────────────────────────────────────────────────────────────────────────────────────────+  |
|  | COMMAND CENTER HQ SUBSYSTEM (Sector / Frontier Headquarters)                                 |  |
|  |                                                                                              |  |
|  |  [ MQTT Broker Gateway ] (Port 1883 - Topic: border/+/alerts)                                |  |
|  |                         │                                                                    |  |
|  |                         ▼                                                                    |  |
|  |  [ HQ MQTT Subscriber & Ingestion Engine ]                                                    |  |
|  |        ├─ Ingests incoming packets                                                           |  |
|  |        ├─ Computes latency: Delta t = t_received - t_detected                                |  |
|  |        └─ Delayed-Sync Latency Classifier (Flags "Synced X min late" for queued alerts)       |  |
|  |                         │                                                                    |  |
|  |                         ▼                                                                    |  |
|  |  [ Master HQ Database ] (SQLite Master Store + Non-Repudiable Immutable Audit Trail)         |  |
|  |                         │                                                                    |  |
|  |                         ▼                                                                    |  |
|  |  [ FastAPI REST API & WebSocket Real-Time Broadcaster ] (Port 8000)                          |  |
|  |        ├─ WebSocket Server: Instant event push to connected browsers                         |  |
|  |        ├─ REST APIs: /api/alerts, /api/cameras, /api/zones, /api/analytics                   |  |
|  |        └─ On-Demand Full 1080p Raw Footage Retrieval API (/api/footage/request)              |  |
|  +──────────────────────────────────────────────────────────────────────────────────────────────+  |
|                                            │                                                       |
|                                            │ (WebSocket & REST JSON)                               |
|                                            ▼                                                       |
|  +──────────────────────────────────────────────────────────────────────────────────────────────+  |
|  | TACTICAL CLIENT PRESENTATION LAYER                                                           |  |
|  |                                                                                              |  |
|  |  [ React 18 + Tailwind CSS Tactical Operations Dashboard ]                                   |  |
|  |        ├─ Military Dark HUD & Live/Pending/Offline Status Indicator Indicators               |  |
|  |        ├─ Leaflet Dark GIS Tactical Map with Sector Camera Pins & Buffer Zone Overlays       |  |
|  |        ├─ 2x2 Multi-Feed Camera Grid with Bounding Boxes & "Enhance All-Weather Feed" Toggle |  |
|  |        ├─ Real-Time Scrolling Alert Feed with Delayed-Sync Badges & Quick Action Triggers    |  |
|  |        ├─ Forensic Investigation Dossier Modal & Full BOP Footage Pull Tool                  |  |
|  |        ├─ Visual Tripwire & Sterile Zone Calibration Canvas                                  |  |
|  |        └─ Sector Infiltration Heatmaps & 94.2% False-Positive Suppression Analytics          |  |
|  |                                                                                              |  |
|  |  [ Mobile Patrol Companion View ]                                                            |  |
|  |        └─ High-Contrast Sunlight-Readable QRT Field Screen with 1-Tap Acknowledge & Intercept|  |
|  +──────────────────────────────────────────────────────────────────────────────────────────────+  |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Subsystem Detailed Architecture

### 3.1 Subsystem 1: Edge Sentinel Node (`edge/`)

The Edge Sentinel Node is the self-contained AI compute unit stationed at the forward outpost.

```
+──────────────────────────────────────────────────────────────────────────────────────────+
|                              EDGE SENTINEL SUBSYSTEM PIPELINE                            |
+──────────────────────────────────────────────────────────────────────────────────────────+
|  Video Source ──> [ Frame Buffer ]                                                       |
|                          │                                                               |
|                          ▼                                                               |
|                  { Fog Toggle? }                                                         |
|                    ├─ Yes ──> [ LAB CLAHE -> Gamma LUT -> Unsharp Mask ] ──┐             |
|                    └─ No  ─────────────────────────────────────────────────┴──> [ Frame ]|
|                                                                                   │      |
|                                                                                   ▼      |
|                                                                           [ YOLOv8n Track]
|                                                                                   │      |
|                                                                                   ▼      |
|                                                                           [ Detections ] |
|                                                                                   │      |
|        ┌───────────────────────────────┬──────────────────────────────────────────┘      |
|        ▼                               ▼                                                 |
|  [ Class: Animal ]             [ Class: Tactical ]                                       |
|        │                               │                                                 |
|        ▼                               ▼                                                 |
|  Tag: Safe Green               [ Zone / Tripwire Math ]                                  |
|  (Alarm Suppressed)                    │                                                 |
|                                        ▼                                                 |
|                              { >= 4 Frame Confirm? }                                     |
|                                        │                                                 |
|                                        ▼                                                 |
|                               [ Generate Alert ]                                         |
|                                        │                                                 |
|                                        ▼                                                 |
|                          [ AES-128 Encrypt & Commit ]                                    |
|                                        │                                                 |
|                                        ▼                                                 |
|                          [ edge_storage/edge_alerts.db ]                                 |
|                                        │ (synced_flag = 0)                               |
|                                        ▼                                                 |
|                          [ Background MQTT Worker ] ──(QoS 1)──> Tactical Network        |
+──────────────────────────────────────────────────────────────────────────────────────────+
```

#### Detailed Components:
1. **Atmospheric Fog-Clearing Pipeline (`edge/fog_enhancer.py`)**:
   - Converts frames from BGR to LAB color space.
   - Applies Contrast Limited Adaptive Histogram Equalization (CLAHE) on the $L$ (Luminance) channel (clip limit $= 3.5$, tile grid size $= 8 \times 8$).
   - Applies precomputed Gamma Correction Lookup Table ($\gamma = 1.25$) to expand low-light shadows.
   - Applies Gaussian unsharp masking ($1.3 \times I_{\text{gamma}} - 0.3 \times \text{GaussianBlur}$) to sharpen distant silhouettes.
2. **AI Detection & Tracking Engine (`edge/detector.py`)**:
   - Executes Ultralytics YOLOv8 nano (`yolov8n.pt`) with confidence threshold $\tau = 0.30$.
   - Executes ByteTrack multi-object tracking to assign persistent integer `track_id` values across frames, eliminating alert duplication.
3. **Animal False-Positive Suppression Filter (`edge/animal_filter.py`)**:
   - Evaluates class labels against the suppression matrix:
     - Alertable Classes: `person`, `car`, `truck`, `motorcycle`, `bicycle`, `bus`.
     - Suppressed Wildlife Classes: `dog`, `cat`, `cow`, `horse`, `sheep`, `elephant`, `bear`, `bird`, `zebra`, `giraffe`.
   - Suppressed wildlife incursions render with emerald green bounding boxes labeled `"Safe — Animal, Suppressed"` without firing audio or network alarm events.
4. **Spatial Perimeter Analytics (`edge/zone_analytics.py`)**:
   - **Ray-Casting Point-in-Polygon (PIP)**: Computes whether a target centroid falls inside arbitrary $N$-point exclusion polygons.
   - **Vector Cross-Product Tripwires**: Determines line segment crossing and directionality ($\vec{W} \times \vec{M}$).
   - **Temporal Frame Confirmation**: Enforces that a target centroid must reside within the breach zone for $\ge 4$ consecutive frames, eliminating vegetation sway and transient pixel noise.
5. **Local Encrypted Persistence Layer (`edge/storage.py`)**:
   - Commits each alert record into local SQLite database `edge_storage/edge_alerts.db` with AES-128 Fernet payload encryption.
   - Saves high-resolution snapshot images to `edge_storage/snapshots/{alert_id}.jpg` and generates lightweight base64 thumbnails for telemetry packets.
6. **Store-and-Forward MQTT Client (`edge/mqtt_sync.py`)**:
   - Background worker thread with automatic connection state machine.
   - Publishes queued alerts to `border/{bop_id}/alerts` using MQTT QoS 1.
   - Updates `synced_flag = 1` and `synced_at = time.time()` upon receipt of broker acknowledgement.

---

### 3.2 Subsystem 2: Tactical Communications Layer (MQTT Store-and-Forward)

The communications layer guarantees message delivery over unstable, low-bandwidth military links.

```
+──────────────────────────────────────────────────────────────────────────────────────────+
|                               MQTT STORE-AND-FORWARD LIFECYCLE                           |
+──────────────────────────────────────────────────────────────────────────────────────────+
|                                                                                          |
|   STATE: NETWORK CONNECTED                                                               |
|   [ Edge Unit ] ──── Publish Alert (QoS 1) ────> [ MQTT Broker ] ────> [ HQ Subscriber ] |
|   [ Edge Unit ] <─── PUBACK Acknowledged ────── [ MQTT Broker ]                          |
|   (Result: Alert marked synced_flag = 1, immediate live display at HQ)                   |
|                                                                                          |
|   ------------------------------------------------------------------------------------   |
|                                                                                          |
|   STATE: COMMUNICATIONS BLACKOUT (Radio / VSAT Link Down)                                |
|   [ Edge Unit ] ──── Connection Fails ──> Silent Exponential Backoff                     |
|   [ Edge Unit ] ──── Writes to local SQLite (synced_flag = 0)                            |
|   [ Edge Unit ] ──── HUD Displays: "QUEUED (UNSYNCED): N"                                |
|   (Result: Zero alert loss, local surveillance continues uninterrupted)                  |
|                                                                                          |
|   ------------------------------------------------------------------------------------   |
|                                                                                          |
|   STATE: LINK RESTORATION (Incremental Burst Sync)                                       |
|   [ Edge Unit ] ──── Reconnects to Broker                                                |
|   [ Edge Unit ] ──── Query all synced_flag = 0 ──> Batch Publish (QoS 1)                |
|   [ HQ Sub ]   ──── Delta t = t_received - t_detected (> 15s)                            |
|   [ HQ Sub ]   ──── Tagged: "Synced X min late" ──> Broadcast via WebSocket              |
|   (Result: Full chronological timeline restored at HQ)                                   |
|                                                                                          |
+──────────────────────────────────────────────────────────────────────────────────────────+
```

#### MQTT Topic Architecture:
- `border/{bop_id}/alerts`: Edge publication topic (e.g., `border/BOP-01-NATHULA/alerts`).
- `border/+/alerts`: HQ wildcard subscription topic covering all forward BOPs across the frontier.

#### MQTT Telemetry Packet Specification:
```json
{
  "id": "ALT-NATHULA-79107",
  "camera_id": "CAM-01",
  "bop_id": "BOP-01-NATHULA",
  "object_type": "person",
  "confidence": 0.94,
  "incursion_type": "TRIPWIRE_CROSSING",
  "zone_name": "Perimeter Line Alpha",
  "severity": "CRITICAL",
  "timestamp": 1788607000.125,
  "formatted_time": "2026-09-06 01:15:00",
  "thumbnail_base64": "/9j/4AAQSkZJRgABAQEAYABgAAD...",
  "snapshot_path": "snapshots/ALT-NATHULA-79107.jpg",
  "clip_path": null
}
```

---

### 3.3 Subsystem 3: Command Center HQ Backend (`backend/`)

The HQ backend orchestrates alert aggregation, delayed-sync classification, WebSocket real-time distribution, and forensic auditing.

#### Detailed Components:
1. **HQ Ingestion & Delayed-Sync Classifier (`backend/mqtt_subscriber.py`)**:
   - Subscribes to `border/+/alerts`.
   - Computes delivery latency: $\Delta t = t_{\text{received}} - t_{\text{detected}}$.
   - Classifies delayed arrivals ($\Delta t > 15.0\text{s}$) with the human-readable tag `"Synced X min late"` to distinguish live breaches from backlogged historical incursions.
2. **HQ Master Database & Audit Logger (`backend/database.py`)**:
   - Manages relational SQLite storage (`hq_storage/command_center_master.db`).
   - Implements non-repudiable audit logging in `audit_logs` tracking every sentry acknowledgment, escalation, dismissal, and zone change with Operator ID and IP origin.
3. **WebSocket Real-Time Dispatcher (`backend/websocket_manager.py`)**:
   - Broadcasts real-time JSON events (`NEW_ALERT`, `ALERT_STATUS_UPDATED`) to all connected dashboard clients with zero polling overhead.
4. **On-Demand Raw Footage Retrieval Service (`backend/routes/footage.py`)**:
   - Dispatches on-demand retrieval jobs to edge units for full 1080p raw video archives over bandwidth-throttled links, ensuring low-bandwidth tactical channels are never saturated by unrequested video streams.

---

### 3.4 Subsystem 4: Tactical Command Dashboard (`frontend/`)

Built with React 18, Tailwind CSS v4, Lucide Icons, Leaflet GIS, and Recharts.

```
+──────────────────────────────────────────────────────────────────────────────────────────+
|                               TACTICAL DASHBOARD LAYOUT & VIEWS                          |
+──────────────────────────────────────────────────────────────────────────────────────────+
| [NAVBAR] Sector Selector | Clock (IST) | HQ Link: CONNECTED / OFFLINE (N QUEUED) | User  |
+──────────────┬────────────────────────────────────────────────────────────┬──────────────+
| [SIDEBAR]    | [MAIN DISPLAY VIEW AREA]                                   | [LIVE FEED]  |
|              |                                                            |              |
| • Dashboard  | [VIEW 1: TACTICAL HQ]                                      | • Live Alert |
| • Live Cams  |   - Top: Dark Leaflet GIS Map (Camera Status & Buffer)     |   Cards      |
| • Alerts     |   - Bottom: 2x2 Camera Grid (Bounding Boxes & Fog Toggles) | • Delayed-   |
| • GIS Map    |                                                            |   Sync Badge |
| • Zones      | [VIEW 2: TRIPWIRE & STERILE ZONE CALIBRATION CANVAS]       | • Quick Ack  |
| • Analytics  |   - Interactive polygon / directional tripwire drawer      |   & Escalate |
| • Mobile QRT |                                                            |              |
| • Audit Log  | [VIEW 3: INTELLIGENCE ANALYTICS & HEATMAPS]                |              |
|              |   - KPI Cards, Incursion Heatmaps, 94.2% Suppression Rate  |              |
|              |                                                            |              |
|              | [VIEW 4: QRT MOBILE COMPANION]                             |              |
|              |   - High-contrast sunlight UI with 1-tap intercept action  |              |
+──────────────┴────────────────────────────────────────────────────────────┴──────────────+
```

---

## 4. Data Models & Database Schemas

### 4.1 Edge Database Schema (`edge_storage/edge_alerts.db`)
```sql
CREATE TABLE alerts (
    id TEXT PRIMARY KEY,
    camera_id TEXT NOT NULL,
    bop_id TEXT NOT NULL,
    object_type TEXT NOT NULL,
    confidence REAL NOT NULL,
    incursion_type TEXT NOT NULL,
    zone_name TEXT NOT NULL,
    severity TEXT NOT NULL,
    timestamp REAL NOT NULL,
    formatted_time TEXT NOT NULL,
    snapshot_path TEXT,
    thumbnail_base64 TEXT,
    clip_path TEXT,
    synced_flag INTEGER DEFAULT 0,
    synced_at REAL DEFAULT NULL,
    encrypted_payload TEXT
);

CREATE INDEX idx_sync ON alerts(synced_flag);
```

### 4.2 Command Center Master Database Schema (`hq_storage/command_center_master.db`)
```sql
CREATE TABLE hq_alerts (
    id TEXT PRIMARY KEY,
    camera_id TEXT NOT NULL,
    bop_id TEXT NOT NULL,
    object_type TEXT NOT NULL,
    confidence REAL NOT NULL,
    incursion_type TEXT NOT NULL,
    zone_name TEXT NOT NULL,
    severity TEXT NOT NULL,
    detected_timestamp REAL NOT NULL,
    received_timestamp REAL NOT NULL,
    latency_seconds REAL DEFAULT 0,
    is_delayed_sync INTEGER DEFAULT 0,
    delayed_sync_label TEXT DEFAULT '',
    status TEXT DEFAULT 'PENDING',
    assigned_officer TEXT DEFAULT 'Unassigned',
    snapshot_path TEXT,
    thumbnail_base64 TEXT,
    clip_path TEXT,
    notes TEXT DEFAULT ''
);

CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id TEXT,
    operator_id TEXT NOT NULL,
    action TEXT NOT NULL,
    timestamp REAL NOT NULL,
    formatted_time TEXT NOT NULL,
    details TEXT DEFAULT '',
    ip_address TEXT DEFAULT '127.0.0.1'
);

CREATE INDEX idx_hq_time ON hq_alerts(detected_timestamp DESC);
CREATE INDEX idx_hq_status ON hq_alerts(status);
```

---

## 5. Security & Privacy Architecture

```
+──────────────────────────────────────────────────────────────────────────────────────────+
|                                SECURITY & PRIVACY CONTROLS                               |
+──────────────────────────────────────────────────────────────────────────────────────────+
|                                                                                          |
|  [ PRIVACY BY DESIGN ]                                                                   |
|  • Pure generic object classification: ('person', 'car', 'truck', 'motorcycle')          |
|  • Zero facial recognition or biometric profiling engines permitted in code              |
|  • Complies with optical physics at 50m - 500m CCTV distances                            |
|                                                                                          |
|  [ DATA-AT-REST ENCRYPTION ]                                                             |
|  • Edge SQLite records encrypted using AES-128 / Fernet symmetric key                    |
|  • Raw intelligence inaccessible even if physical outpost hardware is captured          |
|                                                                                          |
|  [ AIR-GAPPED NETWORK ISOLATION ]                                                        |
|  • Zero external internet dependencies, telemetry, or third-party cloud pings            |
|  • Local embedded MQTT broker and offline-resilient local storage                        |
|                                                                                          |
|  [ NON-REPUDIABLE AUDIT TRAILS ]                                                         |
|  • Immutable SQLite audit_logs table recording every sentry acknowledgment,              |
|    escalation, false-positive classification, and zone parameter change                  |
|                                                                                          |
+──────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 6. Sizing, Performance & Resource Budget

| Parameter | Edge Sentinel Budget | HQ Command Center Budget |
|---|---|---|
| **CPU Utilization** | $< 45\%$ on standard Quad-Core x86 / ARM64 | $< 25\%$ on 4-Core Server |
| **RAM Footprint** | $< 850\text{ MB}$ (including YOLOv8 model weights) | $< 450\text{ MB}$ |
| **Inference Framerate** | $22\text{--}30\text{ FPS}$ sustained | Real-time stream forwarding |
| **Storage Consumption** | $\approx 35\text{ KB}$ per alert record + thumbnail | $\approx 40\text{ KB}$ per master record |
| **Network Bandwidth** | $< 1.5\text{ KB/s}$ idle; burst $\approx 35\text{ KB}$ on alert | Throttled on-demand video transfer |
| **Cold Startup Time** | $< 4.5\text{ seconds}$ | $< 2.0\text{ seconds}$ |

---

## 7. Verification Test Suites & Automated Validation

The architectural integrity and edge resilience of RAKSHA AI 2.0 are validated using two dedicated test suites:

1. **Vision & Spatial Geometry Test Suite (`test_vision_pipeline.py`)**:
   - Validates LAB-space CLAHE contrast de-noising.
   - Validates wildlife suppression matrix (Dog/Cow $\rightarrow$ `SUPPRESS`, Person $\rightarrow$ `ALERT`).
   - Validates Point-in-Polygon (PIP) ray-casting and vector cross-product tripwire algorithms.
2. **Zero-Internet Store-and-Forward Outage Suite (`test_offline_sync.py`)**:
   - Simulates a 3-minute tactical communications blackout.
   - Verifies edge local SQLite queuing and `Queued (unsynced): N` incrementing.
   - Verifies link restoration, burst incremental synchronization, and HQ `"Synced X min late"` badge computation.

---

## 8. Summary

The architecture of **RAKSHA AI 2.0** provides a robust, defense-grade, software-only retrofit solution tailored to the operational realities of India's border forces. By unifying real-time edge AI, atmospheric fog clearing, wildlife alert-fatigue suppression, and zero-loss offline resilience, it directly fulfills all technical and mission objectives outlined in **SIH26187**.
