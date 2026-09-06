"""
Command Center HQ Master Database & Audit Trail.
Stores master alert repository with delayed-sync classification and immutable operator audit logs.
"""
import sqlite3
import os
import time
from datetime import datetime

class HQDatabase:
    def __init__(self, db_path: str = None):
        base = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        storage_dir = os.path.join(base, 'hq_storage')
        os.makedirs(storage_dir, exist_ok=True)
        self.db_path = db_path or os.path.join(storage_dir, 'command_center_master.db')
        self.init_db()

    def init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            # Master alerts table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS hq_alerts (
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
                    status TEXT DEFAULT 'PENDING', -- PENDING, ACKNOWLEDGED, ESCALATED, FALSE_POSITIVE, RESOLVED
                    assigned_officer TEXT DEFAULT 'Unassigned',
                    snapshot_path TEXT,
                    thumbnail_base64 TEXT,
                    clip_path TEXT,
                    notes TEXT DEFAULT ''
                )
            """)
            
            # Non-repudiable audit logs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    alert_id TEXT,
                    operator_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    timestamp REAL NOT NULL,
                    formatted_time TEXT NOT NULL,
                    details TEXT DEFAULT '',
                    ip_address TEXT DEFAULT '127.0.0.1'
                )
            """)
            
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_hq_time ON hq_alerts(detected_timestamp DESC)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_hq_status ON hq_alerts(status)')
            conn.commit()

    def insert_or_update_alert(self, alert_data: dict) -> dict:
        alert_id = alert_data["id"]
        detected_ts = alert_data.get("timestamp", time.time())
        received_ts = time.time()
        latency = max(0.0, received_ts - detected_ts)
        
        # If latency is greater than 15 seconds, flag as delayed sync
        is_delayed = 1 if latency > 15.0 else 0
        if is_delayed:
            minutes_late = int(latency // 60)
            delayed_label = f"Synced {minutes_late} min late" if minutes_late > 0 else f"Synced {int(latency)}s late"
        else:
            delayed_label = "Live Sync"

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO hq_alerts (
                    id, camera_id, bop_id, object_type, confidence, incursion_type,
                    zone_name, severity, detected_timestamp, received_timestamp,
                    latency_seconds, is_delayed_sync, delayed_sync_label, status,
                    snapshot_path, thumbnail_base64, clip_path
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    received_timestamp = excluded.received_timestamp,
                    latency_seconds = excluded.latency_seconds,
                    is_delayed_sync = excluded.is_delayed_sync,
                    delayed_sync_label = excluded.delayed_sync_label
            """, (
                alert_id,
                alert_data.get("camera_id", "CAM-01"),
                alert_data.get("bop_id", "BOP-01-NATHULA"),
                alert_data.get("object_type", "person"),
                alert_data.get("confidence", 0.9),
                alert_data.get("incursion_type", "TRIPWIRE_CROSSING"),
                alert_data.get("zone_name", "Sterile Zone"),
                alert_data.get("severity", "CRITICAL"),
                detected_ts,
                received_ts,
                latency,
                is_delayed,
                delayed_label,
                alert_data.get("snapshot_path", ""),
                alert_data.get("thumbnail_base64", ""),
                alert_data.get("clip_path", "")
            ))
            conn.commit()

        alert_data["received_timestamp"] = received_ts
        alert_data["latency_seconds"] = latency
        alert_data["is_delayed_sync"] = is_delayed
        alert_data["delayed_sync_label"] = delayed_label
        alert_data["status"] = "PENDING"
        return alert_data

    def log_operator_action(self, operator_id: str, action: str, alert_id: str = None, details: str = "", ip: str = "127.0.0.1"):
        now = time.time()
        ft = datetime.fromtimestamp(now).strftime('%Y-%m-%d %H:%M:%S')
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO audit_logs (alert_id, operator_id, action, timestamp, formatted_time, details, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (alert_id, operator_id, action, now, ft, details, ip))
            conn.commit()

    def update_alert_status(self, alert_id: str, status: str, operator_id: str, notes: str = "") -> bool:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE hq_alerts SET status = ?, assigned_officer = ?, notes = ? WHERE id = ?
            """, (status, operator_id, notes, alert_id))
            conn.commit()
            
        self.log_operator_action(operator_id, f"UPDATE_STATUS_{status}", alert_id=alert_id, details=notes)
        return True

    def get_alerts(self, limit: int = 50, status: str = None) -> list:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            if status:
                cursor.execute('SELECT * FROM hq_alerts WHERE status = ? ORDER BY detected_timestamp DESC LIMIT ?', (status, limit))
            else:
                cursor.execute('SELECT * FROM hq_alerts ORDER BY detected_timestamp DESC LIMIT ?', (limit,))
            return [dict(r) for r in cursor.fetchall()]

    def get_audit_trail(self, limit: int = 100) -> list:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?', (limit,))
            return [dict(r) for r in cursor.fetchall()]
