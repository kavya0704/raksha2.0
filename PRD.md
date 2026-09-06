# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Project: RAKSHA AI 2.0 (रड् आउ AI)
### AI-Based Intelligent Video Analytics Platform for Border Surveillance using Existing CCTV Infrastructure
**Smart India Hackathon 2026 | Problem Statement: SIH26187**  
**Ministry of Home Affairs (MHA) | Theme: Smart Automation | Track: Software**

---

## 1. Executive Summary & Problem Context

### 1.1 The Operational Challenge
Border Outposts (BOPs) manned by India's Border Guarding Forces (BSF, ITBP, SSB, Assam Rifles) have widespread CCTV infrastructure deployed under modern border initiatives (e.g., Comprehensive Integrated Border Management System - CIBMS, BOLD-QIT). However, these cameras currently function primarily as **passive recording devices** rather than active early-warning systems. 

Key operational bottlenecks include:
1. **Operator Fatigue & Attention Deficit**: Military and psychological studies confirm human visual vigilance drops by over 70% after 20 minutes of continuous multi-screen monitoring.
2. **False Alarm Saturation (Alert Fatigue)**: Conventional motion-based or legacy pixel-change analytics trigger relentless false alarms from wind-blown vegetation, dust storms, stray wildlife (cattle, dogs, nilgai), and lighting fluctuations, leading operators to ignore or mute alarms.
3. **Severe Network Constraints**: Forward BOPs operate in high-altitude, dense jungle, desert, or riverine terrains with volatile, intermittent, or zero satellite/cellular connectivity. Centralized cloud-reliant video analytics completely fail under border operational realities.
4. **Harsh Atmospheric Conditions**: Heavy fog, dust storms, snow glare, and nocturnal haze blind standard computer vision models.
5. **Capital Infeasibility**: Replacing tens of thousands of deployed analog/IP cameras with proprietary 'smart cameras' would cost thousands of crores and years of deployment delays.
### 1.2 The Solution: RAKSHA AI 2.0
**RAKSHA AI 2.0** is a **100% software-only, camera-agnostic, edge-first AI retrofit platform**. It converts legacy and existing CCTV infrastructure into intelligent tactical early-warning sentinels without requiring hardware replacement or constant cloud/HQ connectivity.

---

## 2. Target Users & Personas

|| Persona || Role || Primary Goal || Pain Point Addressed ||
----------------------------------------------------------------------------
|| BOP Duty Officer / Sentry || Sentry monitoring local perimeter screens || Immediate audible/visual alarm on human/vehicle breach without false alarms || Prevents alert fatigue; highlights real threats even during heavy fog ||
|| Command IQ Operations Officer || Monitoring multi-sector border line from HQ || Real-time tactical situational awareness across all BOPs || Aggregates alerts, shows chronological timeline even for queued alerts ||
|| Quick Reaction Team (QRT) / Patrol || Field patrol deployed on border track || Mobile glanceable alerts with coordinates & snapshot || High-contrast sunlight-viewable alerts with 1-tap acknowledgment ||
---

## 3. Detailed Functional Requirements

1. **Module 1: Ingestion & CLAHE fog-clearing enhancement** (OpenCV CLA Contrast Limited Adaptive Histogram Equalization)
2. **Module 2: AI Vision & Tracking Engine** (YOLOv8 + ByteTrack + Virtual Tripwires/Zones + Animal Suppression Filtered)
3. **Module 3: Edge Unit Architecture & Offline-Resilient Sync** (Local encrypted SQLite DB, paho-mqtt background queue & burst sync)
4. **Module 4: Command Center Backend** (FastAPI, MQTT <-> WebSocket, Delayed-sync detector, Footage Fetch API, Audit Trail Logging)
5. **Module 5: Tactical React Dashboard** (Dark theme, Leaflet GIS map, Live Camera grid, Fog Clearer toggle, Live Alert feed, Alert Detail Modal, Zine Config, Analytics, Mobile Patrol View)
6. **Module 6: Security & Compliance** (NO Facial Recognition, Air-Gapped design, Encrypted local DB, Immutable Audit Trail)
---

## 4. Hackathon Demo Scenios
1. **Live Webcam + CCTV File Ingestion**
2. **All-Weather Fog Clearing Toggle Demonstration**
3. **Animal False-Alarm Suppression (visually green 'Safe - Animal' vs. red 'ALERT - Person')**
4. **"Zero Internet / Atmanirbhar Edge Mode" Outage & Burst Sync Hero Moment**
