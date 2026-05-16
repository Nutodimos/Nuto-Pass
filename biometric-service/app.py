"""
NutoPass Biometric Matching Microservice v2.1
Multi-method fingerprint matching with translation tolerance.
Handles slight finger placement differences between enrollment and verification.
"""

import base64
import logging
import numpy as np
import cv2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("biometric")

app = FastAPI(title="NutoPass Biometric Matcher", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Configuration ──
MATCH_THRESHOLD = 25.0
R307_WIDTH = 256
R307_HEIGHT = 288
R307_RAW_SIZE = (R307_WIDTH * R307_HEIGHT) // 2


class MatchRequest(BaseModel):
    probe_base64: str
    candidate_base64: str


class MatchResponse(BaseModel):
    match: bool
    score: float
    threshold: float
    orb_score: float = 0.0
    ssim_score: float = 0.0
    hist_score: float = 0.0


# ══════════ Image Decoding ══════════

def decode_r307_image(base64_str: str) -> np.ndarray:
    """Decode Base64-encoded R307 4-bit packed image to 256x288 grayscale."""
    raw_bytes = base64.b64decode(base64_str)
    logger.info(f"Decoded {len(raw_bytes)} raw bytes")

    if len(raw_bytes) < R307_RAW_SIZE // 2:
        raise ValueError(f"Image too small: {len(raw_bytes)} bytes")

    raw_arr = np.frombuffer(raw_bytes[:R307_RAW_SIZE], dtype=np.uint8)
    high = ((raw_arr >> 4) & 0x0F).astype(np.uint8) * 17
    low = (raw_arr & 0x0F).astype(np.uint8) * 17
    pixels = np.column_stack((high, low)).flatten()

    expected = R307_WIDTH * R307_HEIGHT
    if len(pixels) > expected:
        pixels = pixels[:expected]
    elif len(pixels) < expected:
        pixels = np.pad(pixels, (0, expected - len(pixels)))

    img = pixels.reshape((R307_HEIGHT, R307_WIDTH))
    return img


def preprocess(img: np.ndarray) -> np.ndarray:
    """CLAHE enhancement only (no Gabor — keeps pixel alignment for SSIM)."""
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(img)
    enhanced = cv2.GaussianBlur(enhanced, (3, 3), 0)
    return enhanced


def center_crop(img: np.ndarray, ratio: float = 0.65) -> np.ndarray:
    """Crop center portion of image, removing noisy edges."""
    h, w = img.shape
    ch, cw = int(h * ratio), int(w * ratio)
    y0, x0 = (h - ch) // 2, (w - cw) // 2
    return img[y0:y0+ch, x0:x0+cw]


# ══════════ Phase Correlation Alignment ══════════

def find_best_shift(img1: np.ndarray, img2: np.ndarray) -> tuple:
    """Find optimal translation between two images using phase correlation."""
    f1 = np.fft.fft2(img1.astype(np.float64))
    f2 = np.fft.fft2(img2.astype(np.float64))
    cross = (f1 * np.conj(f2)) / (np.abs(f1 * np.conj(f2)) + 1e-10)
    shift_map = np.abs(np.fft.ifft2(cross))
    peak = np.unravel_index(shift_map.argmax(), shift_map.shape)
    dy, dx = peak
    h, w = img1.shape
    if dy > h // 2: dy -= h
    if dx > w // 2: dx -= w
    # Clamp to reasonable shift range (±30 pixels)
    dy = max(-30, min(30, dy))
    dx = max(-30, min(30, dx))
    return dy, dx


def align_images(img1: np.ndarray, img2: np.ndarray) -> tuple:
    """Align img2 to img1 using phase correlation, then center-crop both."""
    dy, dx = find_best_shift(img1, img2)
    logger.info(f"Alignment shift: dy={dy}, dx={dx}")

    M = np.float32([[1, 0, -dx], [0, 1, -dy]])
    aligned = cv2.warpAffine(img2, M, (img2.shape[1], img2.shape[0]))

    # Center crop to remove border artifacts from alignment
    crop1 = center_crop(img1, 0.60)
    crop2 = center_crop(aligned, 0.60)
    return crop1, crop2


# ══════════ Matching Methods ══════════

def compute_ssim(img1: np.ndarray, img2: np.ndarray) -> float:
    """Raw SSIM value (-1 to 1)."""
    C1 = (0.01 * 255) ** 2
    C2 = (0.03 * 255) ** 2
    i1 = img1.astype(np.float64)
    i2 = img2.astype(np.float64)
    mu1 = cv2.GaussianBlur(i1, (11, 11), 1.5)
    mu2 = cv2.GaussianBlur(i2, (11, 11), 1.5)
    sigma1_sq = cv2.GaussianBlur(i1 ** 2, (11, 11), 1.5) - mu1 ** 2
    sigma2_sq = cv2.GaussianBlur(i2 ** 2, (11, 11), 1.5) - mu2 ** 2
    sigma12 = cv2.GaussianBlur(i1 * i2, (11, 11), 1.5) - mu1 * mu2
    ssim_map = ((2*mu1*mu2 + C1)*(2*sigma12 + C2)) / \
               ((mu1**2 + mu2**2 + C1)*(sigma1_sq + sigma2_sq + C2))
    return float(ssim_map.mean())


def ssim_score_aligned(img1: np.ndarray, img2: np.ndarray) -> float:
    """SSIM on aligned, preprocessed, center-cropped images. Returns 0-100."""
    enh1 = preprocess(img1)
    enh2 = preprocess(img2)
    crop1, crop2 = align_images(enh1, enh2)
    raw = compute_ssim(crop1, crop2)
    score = max(0.0, raw) * 100.0
    logger.info(f"SSIM (aligned): raw={raw:.4f}, score={score:.2f}")
    return round(score, 2)


def orb_match_score(img1: np.ndarray, img2: np.ndarray) -> float:
    """ORB feature matching with relaxed ratio test. Returns 0-100."""
    enh1 = preprocess(img1)
    enh2 = preprocess(img2)

    orb = cv2.ORB_create(nfeatures=500, scaleFactor=1.2, nlevels=8,
                         edgeThreshold=10, patchSize=31)
    kp1, desc1 = orb.detectAndCompute(enh1, None)
    kp2, desc2 = orb.detectAndCompute(enh2, None)

    n1 = len(kp1) if kp1 else 0
    n2 = len(kp2) if kp2 else 0
    logger.info(f"ORB keypoints: {n1} vs {n2}")

    if desc1 is None or desc2 is None or n1 < 5 or n2 < 5:
        return 0.0

    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    try:
        matches = bf.knnMatch(desc1, desc2, k=2)
    except cv2.error:
        return 0.0

    # Relaxed ratio test (0.85 instead of 0.75)
    good = [m for pair in matches if len(pair) == 2
            for m in [pair[0]] if m.distance < 0.85 * pair[1].distance]

    total = min(len(desc1), len(desc2))
    score = (len(good) / total) * 100.0 if total > 0 else 0.0
    logger.info(f"ORB: {len(good)} good matches / {total} → {score:.2f}")
    return round(score, 2)


def histogram_score_aligned(img1: np.ndarray, img2: np.ndarray) -> float:
    """Grid-based histogram correlation on aligned images. Returns 0-100."""
    enh1 = preprocess(img1)
    enh2 = preprocess(img2)
    crop1, crop2 = align_images(enh1, enh2)

    rows, cols = 4, 4
    h, w = crop1.shape
    bh, bw = h // rows, w // cols
    scores = []

    for r in range(rows):
        for c in range(cols):
            b1 = crop1[r*bh:(r+1)*bh, c*bw:(c+1)*bw]
            b2 = crop2[r*bh:(r+1)*bh, c*bw:(c+1)*bw]
            h1 = cv2.calcHist([b1], [0], None, [32], [0, 256])
            h2 = cv2.calcHist([b2], [0], None, [32], [0, 256])
            cv2.normalize(h1, h1)
            cv2.normalize(h2, h2)
            corr = cv2.compareHist(h1, h2, cv2.HISTCMP_CORREL)
            scores.append(max(0.0, corr))

    avg = np.mean(scores) * 100.0
    logger.info(f"Histogram (aligned): {avg:.2f}")
    return round(avg, 2)


# ══════════ API Endpoints ══════════

@app.get("/health")
def health():
    return {"status": "ok", "service": "NutoPass Biometric v2.1", "threshold": MATCH_THRESHOLD}


@app.post("/match", response_model=MatchResponse)
def match_fingerprints(req: MatchRequest):
    """Multi-method fingerprint matching with alignment."""
    try:
        probe = decode_r307_image(req.probe_base64)
        candidate = decode_r307_image(req.candidate_base64)
    except Exception as e:
        logger.error(f"Decode error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    try:
        orb = orb_match_score(probe, candidate)
        ssim = ssim_score_aligned(probe, candidate)
        hist = histogram_score_aligned(probe, candidate)
    except Exception as e:
        logger.error(f"Matching error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # Weighted: Histogram is the best discriminator for R307 images
    combined = (orb * 0.15) + (ssim * 0.15) + (hist * 0.70)
    is_match = combined >= MATCH_THRESHOLD

    logger.info(f"RESULT: ORB={orb:.1f} SSIM={ssim:.1f} HIST={hist:.1f} "
                f"COMBINED={combined:.1f} threshold={MATCH_THRESHOLD} → {'MATCH' if is_match else 'NO MATCH'}")

    return MatchResponse(
        match=is_match, score=round(combined, 2), threshold=MATCH_THRESHOLD,
        orb_score=orb, ssim_score=ssim, hist_score=hist
    )


if __name__ == "__main__":
    import uvicorn
    print("Starting NutoPass Biometric Matcher v2.1 on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
