"""
Multi-Sector Border Surveillance Video Generator for Raksha AI 2.0.
Generates distinct realistic operational feeds for:
1. CAM-01: border_patrol.mp4 (Sikkim Nathu La Pass - Human Infiltration)
2. CAM-02: border_desert_wildlife.mp4 (Thar Desert Sector - Grazing Camels & Cattle)
3. CAM-03: border_fog.mp4 (Ladakh Mountain Defile - Low Visibility & Heavy Fog)
4. CAM-04: border_doklam_sterile.mp4 (Doklam Buffer Zone - Barbed Wire Perimeter & Sterile Corridor)
"""
import cv2
import numpy as np
import os

def create_synthetic_border_video(output_path: str, scenario: str = "human", duration_sec: int = 12, fps: int = 25):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    width, height = 640, 360
    total_frames = duration_sec * fps
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    for frame_idx in range(total_frames):
        t = frame_idx / total_frames # 0.0 to 1.0
        img = np.zeros((height, width, 3), dtype=np.uint8)

        # -------------------------------------------------------------
        # SCENARIO 1: SIKKIM NATHU LA (Mountain Pass with Patrol Infiltration)
        # -------------------------------------------------------------
        if scenario == "human":
            for y in range(160):
                val = int(25 + (y / 160.0) * 35)
                img[y, :] = (val + 10, val + 15, val + 25)

            pts_mountain = np.array([
                [0, 140], [120, 80], [260, 120], [420, 60], [540, 110], [640, 75],
                [640, 180], [0, 180]
            ], np.int32)
            cv2.fillPoly(img, [pts_mountain], (45, 55, 65))
            img[160:, :] = (55, 65, 75)

            for fx in range(30, 640, 90):
                cv2.line(img, (fx, 150), (fx, 300), (35, 40, 45), 3)
            cv2.line(img, (0, 180), (640, 180), (80, 85, 90), 1)
            cv2.line(img, (0, 240), (640, 240), (80, 85, 90), 1)

            px = int(120 + t * 400)
            py = int(170 + t * 90)
            cv2.circle(img, (px, py - 35), 8, (20, 20, 25), -1)
            cv2.rectangle(img, (px - 9, py - 27), (px + 9, py), (30, 35, 40), -1)
            cv2.line(img, (px - 5, py), (px - 8 + int(np.sin(frame_idx*0.5)*6), py + 25), (20, 20, 25), 3)
            cv2.line(img, (px + 5, py), (px + 8 - int(np.sin(frame_idx*0.5)*6), py + 25), (20, 20, 25), 3)

        # -------------------------------------------------------------
        # SCENARIO 2: THAR DESERT (Golden Sand Dunes & Camels / Cows)
        # -------------------------------------------------------------
        elif scenario == "desert":
            for y in range(150):
                r = int(140 - (y / 150.0) * 60)
                g = int(90 - (y / 150.0) * 40)
                b = int(30 - (y / 150.0) * 15)
                img[y, :] = (b, g, r)

            dune_pts1 = np.array([[0, 140], [180, 110], [380, 160], [540, 120], [640, 150], [640, 360], [0, 360]], np.int32)
            cv2.fillPoly(img, [dune_pts1], (40, 120, 180))
            dune_pts2 = np.array([[0, 180], [220, 150], [450, 210], [640, 170], [640, 360], [0, 360]], np.int32)
            cv2.fillPoly(img, [dune_pts2], (30, 95, 150))
            
            img[220:, :] = (25, 80, 135)

            for fx in range(50, 640, 120):
                cv2.line(img, (fx, 170), (fx, 280), (20, 40, 60), 2)
            cv2.line(img, (0, 200), (640, 200), (40, 70, 100), 1)

            # Camel silhouette wandering across dunes
            cx1 = int(160 + np.sin(t * 3.14) * 100)
            cy1 = int(220 + np.cos(t * 3.14) * 15)
            cv2.ellipse(img, (cx1, cy1), (32, 18), 0, 0, 360, (20, 35, 55), -1)
            cv2.circle(img, (cx1, cy1 - 18), 12, (20, 35, 55), -1)
            cv2.line(img, (cx1 + 25, cy1 - 8), (cx1 + 42, cy1 - 32), (20, 35, 55), 6)
            cv2.circle(img, (cx1 + 44, cy1 - 34), 8, (20, 35, 55), -1)
            for lx in [-20, -8, 10, 22]:
                cv2.line(img, (cx1 + lx, cy1 + 10), (cx1 + lx + int(np.sin(frame_idx*0.4)*4), cy1 + 38), (20, 35, 55), 3)

            # Grazing cow / cattle near border fence
            cx2 = int(440 + np.cos(t * 4.0) * 35)
            cy2 = int(270 + np.sin(t * 4.0) * 10)
            cv2.ellipse(img, (cx2, cy2), (28, 16), 0, 0, 360, (15, 30, 45), -1)
            cv2.circle(img, (cx2 - 22, cy2 - 6), 9, (15, 30, 45), -1)
            for lx in [-16, -6, 8, 18]:
                cv2.line(img, (cx2 + lx, cy2 + 8), (cx2 + lx, cy2 + 28), (15, 30, 45), 3)

        # -------------------------------------------------------------
        # SCENARIO 3: LADAKH MOUNTAIN PASS (Dense Atmospheric Fog)
        # -------------------------------------------------------------
        elif scenario == "fog":
            for y in range(160):
                val = int(20 + (y / 160.0) * 30)
                img[y, :] = (val + 10, val + 10, val + 15)
            pts_mountain = np.array([[0, 130], [150, 70], [320, 110], [480, 50], [640, 90], [640, 180], [0, 180]], np.int32)
            cv2.fillPoly(img, [pts_mountain], (35, 40, 50))
            img[160:, :] = (45, 50, 60)

            px = int(150 + t * 340)
            py = int(210 + t * 50)
            cv2.circle(img, (px, py - 20), 7, (75, 80, 85), -1)
            cv2.rectangle(img, (px - 14, py - 13), (px + 14, py + 8), (70, 75, 80), -1)
            
            fog = np.full((height, width, 3), 190, dtype=np.uint8)
            noise = np.random.normal(0, 8, (height, width, 3)).astype(np.uint8)
            fog = cv2.add(fog, noise)
            img = cv2.addWeighted(img, 0.28, fog, 0.72, 0)

        # -------------------------------------------------------------
        # SCENARIO 4: DOKLAM BUFFER ZONE (Sterile Forest Corridor)
        # -------------------------------------------------------------
        elif scenario == "doklam":
            for y in range(140):
                img[y, :] = (20, 25, 20)
            img[140:, :] = (30, 45, 35)

            for tx in range(20, 640, 70):
                cv2.fillPoly(img, [np.array([[tx, 140], [tx - 25, 190], [tx + 25, 190]], np.int32)], (15, 35, 20))
                cv2.fillPoly(img, [np.array([[tx, 160], [tx - 35, 220], [tx + 35, 220]], np.int32)], (12, 30, 18))

            cv2.line(img, (0, 250), (640, 250), (0, 0, 220), 2)
            cv2.putText(img, "STERILE ZONE BOUNDARY - NO CROSSING", (140, 245), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 220), 1)

            if 0.3 < t < 0.8:
                tx = int(280 + (t - 0.3) * 160)
                ty = 235
                cv2.circle(img, (tx, ty - 25), 6, (15, 15, 15), -1)
                cv2.rectangle(img, (tx - 7, ty - 19), (tx + 7, ty), (20, 20, 25), -1)
                cv2.line(img, (tx - 3, ty), (tx - 4, ty + 18), (15, 15, 15), 2)
                cv2.line(img, (tx + 3, ty), (tx + 4, ty + 18), (15, 15, 15), 2)

        writer.write(img)

    writer.release()
    print(f"Generated scenario video: {output_path} ({duration_sec}s, {scenario})")

if __name__ == "__main__":
    assets_dir = os.path.join(os.path.dirname(__file__))
    create_synthetic_border_video(os.path.join(assets_dir, "border_patrol.mp4"), scenario="human", duration_sec=12)
    create_synthetic_border_video(os.path.join(assets_dir, "border_desert_wildlife.mp4"), scenario="desert", duration_sec=12)
    create_synthetic_border_video(os.path.join(assets_dir, "border_fog.mp4"), scenario="fog", duration_sec=12)
    create_synthetic_border_video(os.path.join(assets_dir, "border_doklam_sterile.mp4"), scenario="doklam", duration_sec=12)

