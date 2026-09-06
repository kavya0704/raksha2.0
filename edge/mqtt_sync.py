"""
Edge Unit Background MQTT Store-and-Forward Synchronization Engine.
Publishes alerts to topic 'border/{bop_id}/alerts' with QoS 1.
Handles network disconnects silently, maintains live unsynced counter,
and performs incremental burst synchronization immediately upon reconnect.
"""
import threading
import time
import json
import logging
import paho.mqtt.client as mqtt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EdgeMQTTSync")

class EdgeMQTTSync:
    def __init__(self, storage, bop_id: str = "BOP-01-NATHULA", broker_host: str = "127.0.0.1", broker_port: int = 1883, sync_interval: float = 2.0):
        self.storage = storage
        self.bop_id = bop_id
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.sync_interval = sync_interval
        
        self.client = mqtt.Client(client_id=f"edge-{bop_id}", callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
        self.is_connected = False
        self.running = False
        self.worker_thread = None

        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            self.is_connected = True
            logger.info(f"Edge connected to MQTT Broker ({self.broker_host}:{self.broker_port})")
            # Immediately trigger burst sync
            self._sync_batch()
        else:
            self.is_connected = False
            logger.warning(f"Edge connection to MQTT Broker failed with code: {rc}")

    def _on_disconnect(self, client, userdata, disconnect_flags, rc, properties=None):
        self.is_connected = False
        logger.warning("Edge disconnected from MQTT Broker — entering offline queueing mode.")

    def start(self):
        self.running = True
        self.worker_thread = threading.Thread(target=self._sync_loop, daemon=True)
        self.worker_thread.start()

    def stop(self):
        self.running = False
        try:
            self.client.disconnect()
            self.client.loop_stop()
        except Exception:
            pass

    def _sync_loop(self):
        # Start MQTT loop in background
        while self.running:
            if not self.is_connected:
                try:
                    self.client.connect(self.broker_host, self.broker_port, keepalive=10)
                    self.client.loop_start()
                except Exception as e:
                    self.is_connected = False
                    # Silent retry for offline mode
                    pass

            if self.is_connected:
                self._sync_batch()

            time.sleep(self.sync_interval)

    def _sync_batch(self):
        try:
            unsynced = self.storage.get_unsynced_alerts(limit=50)
            if not unsynced:
                return

            topic = f"border/{self.bop_id}/alerts"
            synced_ids = []

            for alert in unsynced:
                payload = {
                    "id": alert["id"],
                    "camera_id": alert["camera_id"],
                    "bop_id": alert["bop_id"],
                    "object_type": alert["object_type"],
                    "confidence": alert["confidence"],
                    "incursion_type": alert["incursion_type"],
                    "zone_name": alert["zone_name"],
                    "severity": alert["severity"],
                    "timestamp": alert["timestamp"],
                    "formatted_time": alert["formatted_time"],
                    "thumbnail_base64": alert.get("thumbnail_base64", ""),
                    "snapshot_path": alert.get("snapshot_path", ""),
                    "clip_path": alert.get("clip_path", "")
                }
                msg_info = self.client.publish(topic, json.dumps(payload), qos=1)
                msg_info.wait_for_publish(timeout=2.0)
                if msg_info.is_published():
                    synced_ids.append(alert["id"])
                else:
                    break

            if synced_ids:
                self.storage.mark_alerts_synced(synced_ids)
                logger.info(f"Successfully synced batch of {len(synced_ids)} alerts to HQ.")
        except Exception as e:
            logger.error(f"Error during alert sync batch: {e}")
