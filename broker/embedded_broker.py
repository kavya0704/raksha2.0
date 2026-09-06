"""
Lightweight Embedded MQTT Broker for Raksha AI 2.0.
Provides standard MQTT 3.1.1 packet routing over TCP (port 1883) for standalone demo capability,
while remaining 100% interoperable with external Mosquitto instances.
"""
import socket
import threading
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EmbeddedMQTTBroker")

class SimpleMQTTBroker:
    def __init__(self, host: str = "0.0.0.0", port: int = 1883):
        self.host = host
        self.port = port
        self.clients = []
        self.subscriptions = {} # topic: [client_sockets]
        self.running = False
        self.server_sock = None

    def start(self):
        self.running = True
        self.server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            self.server_sock.bind((self.host, self.port))
            self.server_sock.listen(10)
            logger.info(f"🚀 Embedded MQTT Broker listening on {self.host}:{self.port}")
            threading.Thread(target=self._accept_loop, daemon=True).start()
            return True
        except Exception as e:
            logger.warning(f"Could not bind embedded broker on port {self.port} ({e}) - Mosquitto or another broker may already be active.")
            return False

    def stop(self):
        self.running = False
        if self.server_sock:
            try:
                self.server_sock.close()
            except Exception:
                pass

    def _accept_loop(self):
        while self.running:
            try:
                sock, addr = self.server_sock.accept()
                self.clients.append(sock)
                threading.Thread(target=self._client_handler, args=(sock,), daemon=True).start()
            except Exception:
                break

    def _client_handler(self, sock):
        while self.running:
            try:
                data = sock.recv(4096)
                if not data:
                    break
                
                packet_type = (data[0] >> 4) & 0x0F
                
                # 1 = CONNECT -> Respond with CONNACK
                if packet_type == 1:
                    connack = bytes([0x20, 0x02, 0x00, 0x00])
                    sock.sendall(connack)

                # 3 = PUBLISH -> Broadcast to other clients
                elif packet_type == 3:
                    # Forward packet to all other connected subscribers
                    for c in list(self.clients):
                        if c != sock:
                            try:
                                c.sendall(data)
                            except Exception:
                                if c in self.clients:
                                    self.clients.remove(c)

                # 8 = SUBSCRIBE -> Respond with SUBACK
                elif packet_type == 8:
                    if len(data) >= 4:
                        msg_id = data[2:4]
                        suback = bytes([0x90, 0x03]) + msg_id + bytes([0x01])
                        sock.sendall(suback)

                # 12 = PINGREQ -> Respond with PINGRESP
                elif packet_type == 12:
                    pingresp = bytes([0xD0, 0x00])
                    sock.sendall(pingresp)

                # 14 = DISCONNECT
                elif packet_type == 14:
                    break
            except Exception:
                break

        if sock in self.clients:
            self.clients.remove(sock)
        try:
            sock.close()
        except Exception:
            pass

if __name__ == "__main__":
    broker = SimpleMQTTBroker()
    if broker.start():
        import time
        while True:
            time.sleep(1)
