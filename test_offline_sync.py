"""
Offline-Sync Resilience & Zero-Internet Outage Simulation Suite.
"""
import time
import os
import sys
import json
import logging

from edge.storage import EdgeStorage
from backend.database import HQDatabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OfflineSyncVerification")

def run_simulation():
    print("\n=======================================================")
    print("  RAKSHA AI 2.0: ZERO-INTERNET OFFLINE-SYNC TEST SUITE")
    print("=======================================================\n")

    test_edge_db = os.path.join(os.path.dirname(__file__), "edge_storage", "test_edge.db")
    test_hq_db = os.path.join(os.path.dirname(__file__), "hq_storage", "test_hq.db")
    
    if os.path.exists(test_edge_db):
        os.remove(test_edge_db)
    if os.path.exists(test_hq_db):
        os.remove(test_hq_db)

    edge_storage = EdgeStorage()
    edge_storage.db_path = test_edge_db
    edge_storage.init_db()

    hq_db = HQDatabase(db_path=test_hq_db)

    print("Step 1: Simulating Normal Real-Time Connected Alert...")
    live_id = f"ALT-LIVE-{int(time.time()*1000)%100000}"
    normal_alert = {
        "id": live_id,
        "camera_id": "CAM-01",
        "bop_id": "BOP-01-NATHULA",
        "object_type": "person",
        "confidence": 0.94,
        "incursion_type": "TRIPWIRE_CROSSING",
        "zone_name": "Perimeter Line Alpha",
        "severity": "CRITICAL",
        "timestamp": time.time()
    }
    edge_storage.record_alert(normal_alert)
    edge_storage.mark_alerts_synced([live_id])
    
    hq_received = hq_db.insert_or_update_alert(normal_alert)
    print(f"Recorded & Synced live alert: {normal_alert['id']}")
    print(f"HQ Status: {hq_received['delayed_sync_label']} (Latency: {hq_received['latency_seconds']:.2f}s)")
    assert hq_received['is_delayed_sync'] == 0, "Normal alert should not be marked delayed"

    print("\nStep 2: Simulating Communications Blackout (Network Down for 3 Minutes)...")
    simulated_past_time = time.time() - 185 # 3 minutes and 5 seconds ago
    
    queued_alerts = [
        {
            "id": f"ALT-QUEUE-01-{int(time.time()*1000)%100000}",
            "camera_id": "CAM-01",
            "bop_id": "BOP-01-NATHULA",
            "object_type": "person",
            "confidence": 0.91,
            "incursion_type": "STERILE_ZONE_BREACH",
            "zone_name": "Ridge Sterile Zone",
            "severity": "CRITICAL",
            "timestamp": simulated_past_time
        },
        {
            "id": f"ALT-QUEUE-02-{int(time.time()*1000)%100000}",
            "camera_id": "CAM-01",
            "bop_id": "BOP-01-NATHULA",
            "object_type": "car",
            "confidence": 0.88,
            "incursion_type": "TRIPWIRE_CROSSING",
            "zone_name": "Track Road Tripwire",
            "severity": "HIGH",
            "timestamp": simulated_past_time + 40
        }
    ]

    for alert in queued_alerts:
        edge_storage.record_alert(alert)
        print(f"Logged to Edge Local SQLite: {alert['id']}")

    unsynced_count = edge_storage.get_unsynced_count()
    print(f"\n[EDGE QUEUE STATUS] Unsynced Alerts Backlog: {unsynced_count}")
    assert unsynced_count == 2, f"Expected 2 unsynced alerts, got {unsynced_count}"

    print("\nStep 3: Simulating Tactical Link Restored -> Incremental Burst Sync...")
    unsynced_records = edge_storage.get_unsynced_alerts(limit=10)
    synced_ids = []

    for alert in unsynced_records:
        hq_record = hq_db.insert_or_update_alert(alert)
        synced_ids.append(alert["id"])
        print(f"Delivered to HQ: {alert['id']} -> Tagged as: [{hq_record['delayed_sync_label']}] (Latency: {hq_record['latency_seconds']:.1f}s)")
        assert hq_record['is_delayed_sync'] == 1, "Queued alert must be flagged as Delayed Sync"

    edge_storage.mark_alerts_synced(synced_ids)
    remaining_unsynced = edge_storage.get_unsynced_count()
    print(f"\n[EDGE RECOVERY COMPLETE] Remaining Backlog: {remaining_unsynced}")
    assert remaining_unsynced == 0, "All alerts must be marked synced after burst transmission"

    print("\n=======================================================")
    print("  PASSED ALL OFFLINE RESILIENCE VERIFICATIONS! (100%)")
    print("=======================================================\n")

if __name__ == "__main__":
    run_simulation()
