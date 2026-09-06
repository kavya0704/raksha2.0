"""
Command Center MQTT Subscriber.
Listens to incoming edge outpost alerts, calculates latency & delayed-sync tags,
commits alerts to HQ Master DB, and triggers live WebSocket push to the React Dashboard.
"""
import json
import logging
import asyncio
import paho.mqtt.client as mqtt
from backend.database import HQDatabase
from backend.websocket_manager import ws_manager

logger = logging.getLogger("HQMQTTSubscriber")

class HQMQTTSubscriber:
    def __init__(self, db: HQDatabase, broker_host: str = "127.0.0.1", broker_port: int = 1883, loop: asyncio.AbstractEventLoop = None):
        self.db = db
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.loop = loop
        self.client = mqtt.Client(client_id="command-center-hq-subscriber", callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            logger.info(f"Command Center HQ connected to MQTT Broker ({self.broker_host}:{self.broker_port})")
            self.client.subscribe("border/+/alerts", qos=1)
            logger.info("Subscribed to tactical stream: border/+/alerts")
        else:
            logger.warning(f"HQ MQTT connection failed with code: {rc}")

    def _on_disconnect(self, client, userdata, disconnect_flags, rc, properties=None):
        logger.warning("Command Center HQ disconnected from MQTT Broker.")

    def _on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode('utf-8'))
            logger.info(f"📥 [HQ RECEIVED ALERT] from {payload.get('bop_id')} | ID: {payload.get('id')}")
            
            # Save to Master HQ Database with latency & delayed sync calculation
            enriched_alert = self.db.insert_or_update_alert(payload)

            # Broadcast to connected WebSocket clients
            if self.loop and self.loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    ws_manager.broadcast({
                        "type": "NEW_ALERT",
                        "data": enriched_alert
                    }),
                    self.loop
                )
        except Exception as e:
            logger.error(f"Error processing received MQTT alert: {e}")

    def start(self):
        try:
            self.client.connect(self.broker_host, self.broker_port, keepalive=15)
            self.client.loop_start()
            logger.info("HQ MQTT Subscriber loop started.")
        except Exception as e:
            logger.warning(f"HQ MQTT Subscriber start failed: {e}")

    def stop(self):
        try:
            self.client.loop_stop()
            self.client.disconnect()
        except Exception:
            pass
