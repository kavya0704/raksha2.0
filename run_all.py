"""
RAKSHA AI 2.0 (रक्षा AI) - Master Application Launcher.
Starts:
1. Eclipse Mosquitto compatible Embedded MQTT Broker (Port 1883)
2. FastAPI Tactical Command Center HQ Backend (Port 8000)
3. Edge Sentinel AI Processing Unit (CAM-01 / BOP Nathu La)
4. React Production Web Dashboard (Accessible at http://127.0.0.1:8000)
"""
import sys
import os
import time
import webbrowser
import uvicorn

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("""
========================================================================
   ____      _    _  ______  _   _    _       _    ___   ____     ___  
  |  _ \    / \  | |/ / ___|| | | |  / \     / \  |_ _| |___ \   / _ \ 
  | |_) |  / _ \ | ' /\___ \| |_| | / _ \   / _ \  | |    __) | | | | |
  |  _ <  / ___ \| . \ ___) |  _  |/ ___ \ / ___ \ | |   / __/  | |_| |
  |_| \_\/_/   \_\_|\_\____/|_| |_/_/   \_/_/   \_|___| |_____|  \___/ 
                                                                        
  AI-Based Intelligent Video Analytics Platform for Border Surveillance
  Smart India Hackathon 2026 | Problem Statement: SIH26187 | MHA
========================================================================
""")
    print("[1/3] Initializing Edge Unit & Command Center HQ Services...")
    print("[2/3] Connecting to Tactical MQTT Broker on port 1883...")
    print("[3/3] Serving Tactical Command Center Dashboard on http://127.0.0.1:8000 ...\n")
    print("------------------------------------------------------------------------")
    print(">>> ACCESS THE DASHBOARD IN YOUR BROWSER AT: http://127.0.0.1:8000")
    print(">>> (Or run 'npm run dev' in frontend/ for live hot-reloading on :5173)")
    print("------------------------------------------------------------------------\n")

    # Automatically launch browser after 1.5s
    def open_browser():
        time.sleep(1.5)
        webbrowser.open("http://127.0.0.1:8000")

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    # Start FastAPI Application (handles broker, subscriber, and edge unit in its lifespan)
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, log_level="info")

if __name__ == "__main__":
    main()
