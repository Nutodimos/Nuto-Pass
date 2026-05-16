"""
NutoPass Biometric Matching Microservice
FastAPI service that performs fingerprint minutiae extraction and matching.
Receives two Base64-encoded R307 raw images and returns a match score.
"""

import base64
import io
import numpy as np
import cv2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="NutoPass Biometric Matcher", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Configuration ──
MATCH_THRESHOLD = 35.0   # Minimum score to consider a match
R307_WIDTH = 256
R307_HEIGHT = 288
R307_RAW_SIZE = (R307_WIDTH * R307_HEIGHT) // 2  # 36864 bytes (4-bit packed)


class MatchRequest(BaseModel):
    probe_base64: str       # Base64 of the live scan from ESP32
    candidate_base64: str   # Base64 of the stored enrollment image


class MatchResponse(BaseModel):
    match: bool
    score: float
    threshold: float


# ══════════ Image Processing ══════════

def decode_r307_image(base64_str: str) -> np.ndarray:
    """
    Decode a Base64-encoded R307 raw image into a 256x288 grayscale numpy array.
    The R307 sends 4-bit packed pixels: two pixels per byte (upper nibble = first pixel).
    We expand each 4-bit value to 8-bit (multiply by 17 to map 0-15 → 0-255).
    """
    raw_bytes = base64.b64decode(base64_str)

    if len(raw_bytes) < R307_RAW_SIZE // 2:
        raise ValueError(f"Image data too small: {len(raw_bytes)} bytes (expected ~{R307_RAW_SIZE})")

    # Unpack 4-bit pixels
    pixels = []
    for byte in raw_bytes[:R307_RAW_SIZE]:
        high = (byte >> 4) & 0x0F  # First pixel
        low = byte & 0x0F          # Second pixel
        pixels.append(high * 17)   # Scale 0-15 → 0-255
        pixels.append(low * 17)

    # Trim or pad to exact size
    expected_pixels = R307_WIDTH * R307_HEIGHT
    if len(pixels) > expected_pixels:
        pixels = pixels[:expected_pixels]
    elif len(pixels) < expected_pixels:
        pixels.extend([0] * (expected_pixels - len(pixels)))

    img = np.array(pixels, dtype=np.uint8).reshape((R307_HEIGHT, R307_WIDTH))
    return img


def enhance_fingerprint(img: np.ndarray) -> np.ndarray:
    """
    Enhance fingerprint image for better minutiae extraction.
    Uses CLAHE for contrast, Gaussian blur for noise, and Gabor filtering.
    """
    # CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(img)

    # Light Gaussian blur to reduce sensor noise
    enhanced = cv2.GaussianBlur(enhanced, (3, 3), 0)

    # Gabor filter bank for ridge enhancement
    gabor_sum = np.zeros_like(enhanced, dtype=np.float64)
    for theta in np.arange(0, np.pi, np.pi / 8):  # 8 orientations
        kernel = cv2.getGaborKernel(
            (21, 21), sigma=4.0, theta=theta,
            lambd=8.0, gamma=0.5, psi=0
        )
        filtered = cv2.filter2D(enhanced, cv2.CV_64F, kernel)
        gabor_sum = np.maximum(gabor_sum, filtered)

    # Normalize back to uint8
    gabor_norm = cv2.normalize(gabor_sum, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    return gabor_norm


def extract_minutiae(img: np.ndarray) -> list:
    """
    Extract minutiae-like keypoints from a fingerprint image.
    Uses ORB (Oriented FAST and Rotated BRIEF) as a robust feature detector.
    This is more reliable than manual thinning+bifurcation on low-quality R307 images.
    """
    enhanced = enhance_fingerprint(img)

    # Binarize
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # ORB detector — tuned for fingerprint ridges
    orb = cv2.ORB_create(
        nfeatures=500,
        scaleFactor=1.2,
        nlevels=8,
        edgeThreshold=15,
        patchSize=31
    )

    keypoints, descriptors = orb.detectAndCompute(enhanced, None)
    return keypoints, descriptors


def match_minutiae(kp1, desc1, kp2, desc2) -> float:
    """
    Match two sets of ORB descriptors using Brute-Force Hamming distance.
    Returns a score from 0-100 based on the ratio of good matches.
    """
    if desc1 is None or desc2 is None:
        return 0.0
    if len(desc1) < 5 or len(desc2) < 5:
        return 0.0

    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    try:
        matches = bf.knnMatch(desc1, desc2, k=2)
    except cv2.error:
        return 0.0

    # Lowe's ratio test
    good_matches = []
    for match_pair in matches:
        if len(match_pair) == 2:
            m, n = match_pair
            if m.distance < 0.75 * n.distance:
                good_matches.append(m)

    if len(good_matches) == 0:
        return 0.0

    # Score: percentage of good matches relative to the smaller descriptor set
    total = min(len(desc1), len(desc2))
    score = (len(good_matches) / total) * 100.0
    return round(score, 2)


# ══════════ API Endpoints ══════════

@app.get("/health")
def health():
    return {"status": "ok", "service": "NutoPass Biometric Matcher v1.0"}


@app.post("/match", response_model=MatchResponse)
def match_fingerprints(req: MatchRequest):
    """
    Compare two fingerprint images and return whether they match.
    """
    try:
        probe_img = decode_r307_image(req.probe_base64)
        candidate_img = decode_r307_image(req.candidate_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image decode error: {str(e)}")

    try:
        kp1, desc1 = extract_minutiae(probe_img)
        kp2, desc2 = extract_minutiae(candidate_img)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature extraction error: {str(e)}")

    score = match_minutiae(kp1, desc1, kp2, desc2)
    is_match = score >= MATCH_THRESHOLD

    return MatchResponse(match=is_match, score=score, threshold=MATCH_THRESHOLD)


if __name__ == "__main__":
    import uvicorn
    print("Starting NutoPass Biometric Matcher on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
