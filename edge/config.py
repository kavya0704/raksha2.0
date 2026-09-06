"""
Edge Unit Configuration.
"""
import os

BOP_ID = os.getenv("BOP_ID", "BOP-01-NATHULA")
MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "127.0.0.1")
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", 1883))

# Default surveillance zones (Coordinates in standard 640x360 normalized/pixel scale)
DEFAULT_ZONES = [
    {
        "id": "zone-perimeter-sterile",
        "name": "Sterile Perimeter Zone (Zero-Tolerance)",
        "type": "polygon",
        "severity": "CRITICAL",
        "coordinates": [(100, 180), (540, 180), (620, 340), (20, 340)]
    },
    {
        "id": "tripwire-alpha",
        "name": "Line of Control Tripwire Alpha",
        "type": "tripwire",
        "severity": "HIGH",
        "coordinates": [(50, 240), (590, 240)],
        "direction": "inbound"
    }
]
