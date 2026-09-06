"""
Vision & Computer Vision Pipeline Verification Suite.
"""
import cv2
import numpy as np
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from edge.fog_enhancer import FogEnhancer
from edge.animal_filter import ClassificationFilter
from edge.zone_analytics import ZoneAnalytics, point_in_polygon, lines_intersect

def test_vision():
    print("\n=======================================================")
    print("  RAKSHA AI 2.0: VISION & ANOMALY FILTER TEST SUITE")
    print("=======================================================\n")

    # Test 1: Fog Enhancer
    print("Test 1: Testing CLAHE Atmospheric Fog-Clearing Enhancement...")
    enhancer = FogEnhancer()
    foggy_frame = np.full((360, 640, 3), 200, dtype=np.uint8)
    cv2.circle(foggy_frame, (320, 180), 30, (140, 140, 140), -1)
    
    enhanced = enhancer.enhance(foggy_frame)
    assert enhanced is not None and enhanced.shape == foggy_frame.shape, "Enhancement output must preserve shape"
    print("[PASS] CLAHE & Gamma De-noising completed successfully.")

    # Test 2: Animal Suppression Filter
    print("\nTest 2: Testing Wildlife / Animal False-Positive Suppression...")
    classifier = ClassificationFilter(confidence_threshold=0.40)
    
    dog_eval = classifier.evaluate('dog', 0.85)
    print(f"Dog Detection (85% Conf): Action={dog_eval['action']}, Label='{dog_eval['label']}'")
    assert dog_eval['action'] == 'SUPPRESS' and dog_eval['is_alert'] is False, "Wildlife must be suppressed"
    
    cow_eval = classifier.evaluate('cow', 0.90)
    print(f"Cow Detection (90% Conf): Action={cow_eval['action']}, Label='{cow_eval['label']}'")
    assert cow_eval['action'] == 'SUPPRESS' and cow_eval['is_alert'] is False, "Livestock must be suppressed"

    person_eval = classifier.evaluate('person', 0.88)
    print(f"Person Detection (88% Conf): Action={person_eval['action']}, Severity={person_eval['severity']}")
    assert person_eval['action'] == 'ALERT' and person_eval['is_alert'] is True, "Person must trigger ALERT"

    # Test 3: Tripwire & Zone Incursion Geometry
    print("\nTest 3: Testing Directional Tripwires & Sterile Polygon Zones...")
    poly_coords = [(100, 100), (400, 100), (400, 300), (100, 300)]
    assert point_in_polygon((200, 200), poly_coords) is True, "Point inside polygon should return True"
    assert point_in_polygon((50, 50), poly_coords) is False, "Point outside polygon should return False"

    wire_p1 = (50, 200)
    wire_p2 = (400, 200)
    move_prev = (150, 180)
    move_curr = (150, 230)
    assert lines_intersect(move_prev, move_curr, wire_p1, wire_p2) is True, "Trajectory must intersect tripwire"
    print("[PASS] Spatial geometry algorithms verified.")

    print("\n=======================================================")
    print("  ALL COMPUTER VISION TESTS PASSED (100%)")
    print("=======================================================\n")

if __name__ == "__main__":
    test_vision()
