"""
Directional Virtual Tripwires and Multi-Point Sterile Zones.
Features 4-frame consecutive confirmation to eliminate transient false triggers.
"""

def point_in_polygon(pt: tuple, poly: list) -> bool:
    """Ray casting algorithm to determine if a point is inside a polygon."""
    x, y = pt
    n = len(poly)
    if n < 3:
        return False
    inside = False
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def lines_intersect(p1: tuple, p2: tuple, p3: tuple, p4: tuple) -> bool:
    """Checks if line segment p1-p2 intersects line segment p3-p4."""
    def ccw(A, B, C):
        return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])
    return (ccw(p1, p3, p4) != ccw(p2, p3, p4)) and (ccw(p1, p2, p3) != ccw(p1, p2, p4))

class ZoneAnalytics:
    def __init__(self, confirmation_frames: int = 3):
        self.confirmation_frames = confirmation_frames
        # Format: {track_id: {'positions': [(x, y)], 'frames_in_zone': {zone_id: count}, 'alerted': {zone_id: bool}}}
        self.track_history = {}

    def update(self, track_id: int, center_pt: tuple, zones: list) -> list:
        """
        Updates tracking history and checks for tripwire/zone incursions.
        Returns a list of newly triggered alert events.
        """
        if track_id not in self.track_history:
            self.track_history[track_id] = {
                'positions': [center_pt],
                'frames_in_zone': {},
                'alerted': {}
            }
        else:
            self.track_history[track_id]['positions'].append(center_pt)
            if len(self.track_history[track_id]['positions']) > 30:
                self.track_history[track_id]['positions'].pop(0)

        history = self.track_history[track_id]
        positions = history['positions']
        triggered = []

        for zone in zones:
            zid = zone.get('id', 'default_zone')
            ztype = zone.get('type', 'polygon')
            coords = zone.get('coordinates', [])

            if ztype == 'polygon' and len(coords) >= 3:
                in_poly = point_in_polygon(center_pt, coords)
                if in_poly:
                    history['frames_in_zone'][zid] = history['frames_in_zone'].get(zid, 0) + 1
                    if history['frames_in_zone'][zid] >= self.confirmation_frames and not history['alerted'].get(zid, False):
                        history['alerted'][zid] = True
                        triggered.append({
                            'zone_id': zid,
                            'zone_name': zone.get('name', 'Sterile Perimeter Zone'),
                            'incursion_type': 'STERILE_ZONE_BREACH',
                            'severity': zone.get('severity', 'CRITICAL')
                        })
                else:
                    # Decay count if moving out
                    history['frames_in_zone'][zid] = max(0, history['frames_in_zone'].get(zid, 0) - 1)
                    if history['frames_in_zone'][zid] == 0:
                        history['alerted'][zid] = False

            elif ztype == 'tripwire' and len(coords) >= 2 and len(positions) >= 2:
                prev_pt = positions[-2]
                crossed = lines_intersect(prev_pt, center_pt, coords[0], coords[1])
                if crossed and not history['alerted'].get(zid, False):
                    history['alerted'][zid] = True
                    triggered.append({
                        'zone_id': zid,
                        'zone_name': zone.get('name', 'Sector Tripwire'),
                        'incursion_type': 'TRIPWIRE_CROSSING',
                        'severity': zone.get('severity', 'CRITICAL')
                    })

        return triggered

    def cleanup(self, active_tids: set):
        for tid in list(self.track_history.keys()):
            if tid not in active_tids:
                del self.track_history[tid]
