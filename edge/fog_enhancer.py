"""
Atmospheric De-Noising & Fog-Clearing Pipeline for Raksha AI 2.0.
Uses CLAHE (Contrast Limited Adaptive Histogram Equalization) in LAB color space
combined with dynamic contrast stretching to clear heavy fog, haze, dust storms,
and low-light nocturnal conditions before feeding into the YOLO detection engine.
"""

import cv2
import numpy as np

class FogEnhancer:
    def __init__(self, clip_limit: float = 3.5, tile_grid_size: tuple = (8, 8), gamma: float = 1.25):
        self.clip_limit = clip_limit
        self.tile_grid_size = tile_grid_size
        self.gamma = gamma
        self.clahe = cv2.createCLAHE(clipLimit=self.clip_limit, tileGridSize=self.tile_grid_size)
        
        # Precompute gamma correction lookup table for speed
        inv_gamma = 1.0 / self.gamma
        self.gamma_lut = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype("uint8")

    def enhance(self, frame: np.ndarray) -> np.ndarray:
        """
        Applies multi-stage atmospheric enhancement:
        1. Converts BGR to LAB color space.
        2. Applies CLAHE to the L (Luminance) channel to balance local contrast without color distortion.
        3. Converts back to BGR.
        4. Applies gamma correction & mild sharpening to restore edge definition of distant figures.
        """
        if frame is None or frame.size == 0:
            return frame
        try:
            lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            l_enhanced = self.clahe.apply(l)
            lab_enhanced = cv2.merge((l_enhanced, a, b))
            enhanced_bgr = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
            
            gamma_corrected = cv2.LUT(enhanced_bgr, self.gamma_lut)
            
            gaussian = cv2.GaussianBlur(gamma_corrected, (0, 0), 2.0)
            sharpened = cv2.addWeighted(gamma_corrected, 1.3, gaussian, -0.3, 0)
            return sharpened
        except Exception:
            return frame
