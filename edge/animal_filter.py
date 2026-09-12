"""
Animal False-Positive Suppression & Alert-Fatigue Elimination Filter for Raksha AI 2.0.
Distinguishes between alertable tactical targets (person, car, truck, motorcycle)
and harmless border wildlife (dog, cat, cow, horse, sheep, elephant, bear, bird).
"""

ALERTABLE_CLASSES = {
    'person': {'severity': 'CRITICAL', 'color': (0, 0, 255)}, # Red in BGR
    'car': {'severity': 'HIGH', 'color': (0, 140, 255)},      # Orange
    'truck': {'severity': 'HIGH', 'color': (0, 140, 255)},
    'motorcycle': {'severity': 'HIGH', 'color': (0, 140, 255)},
    'bicycle': {'severity': 'MEDIUM', 'color': (0, 215, 255)},
    'bus': {'severity': 'HIGH', 'color': (0, 140, 255)}
}

SUPPRESSED_ANIMAL_CLASSES = {
    'dog', 'cat', 'cow', 'horse', 'sheep', 'elephant', 'bear', 'bird', 'zebra', 'giraffe',
    'goat', 'camel', 'donkey', 'pig', 'deer', 'cattle', 'bull', 'ox', 'monkey', 'rabbit',
    'duck', 'chicken', 'goose', 'turkey', 'teddy bear', 'animal', 'wildlife', 'livestock', 'canine'
}

class ClassificationFilter:
    def __init__(self, confidence_threshold: float = 0.25):
        self.confidence_threshold = confidence_threshold

    def evaluate(self, class_name: str, confidence: float) -> dict:
        """
        Evaluates a detected object class:
        - If below confidence -> IGNORE
        - If wildlife/animal -> SUPPRESS with Emerald Green bounding tag 'Safe — Animal, Suppressed'
        - If tactical incursion -> ALERT with Crimson Red / Orange tag
        """
        c_name = class_name.lower().strip()
        if confidence < self.confidence_threshold:
            return {'action': 'IGNORE', 'is_alert': False, 'reason': 'Below Confidence Threshold'}

        if c_name in SUPPRESSED_ANIMAL_CLASSES:
            return {
                'action': 'SUPPRESS',
                'is_alert': False,
                'category': 'ANIMAL',
                'label': f'Safe — Animal ({c_name.capitalize()}), Suppressed',
                'color': (0, 255, 0), # Emerald Green (Safe)
                'severity': 'SAFE'
            }

        if c_name in ALERTABLE_CLASSES:
            meta = ALERTABLE_CLASSES[c_name]
            return {
                'action': 'ALERT',
                'is_alert': True,
                'category': 'SECURITY_THREAT',
                'label': f'ALERT: {c_name.upper()} ({int(confidence * 100)}%)',
                'color': meta['color'],
                'severity': meta['severity']
            }

        return {'action': 'IGNORE', 'is_alert': False, 'reason': 'Non-tactical class'}
