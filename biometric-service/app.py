"""
NutoPass Biometric Matching Microservice v2.0
FastAPI service that performs fingerprint matching using multiple methods:
  1. ORB feature matching (minutiae-like)
  2. SSIM (Structural Similarity Index)
  3. Histogram correlation
The final score is a weighted combination for maximum reliability.
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

app = FastAPI(title="NutoPass Biometric Matcher", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Configuration ──
MATCH_THRESHOLD = 40.0   # Combined score threshold (0-100)
R307_WIDTH = 256
R307_HEIGHT = 288
R307_RAW_SIZE = (R307_WIDTH * R307_HEIGHT) // 2  # 36864 bytes (4-bit packed)


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


# ══════════ Image Processing ══════════

def decode_r307_image(base64_str: str) -> np.ndarray:
    """Decode Base64-encoded R307 4-bit packed image to 256x288 grayscale."""
    raw_bytes = base64.b64decode(base64_str)
    logger.info(f"Decoded {len(raw_bytes)} raw bytes from Base64")

    if len(raw_bytes) < R307_RAW_SIZE // 2:
        raise ValueError(f"Image too small: {len(raw_bytes)} bytes (need >= {R307_RAW_SIZE // 2})")

    # Fast numpy-based 4-bit unpacking
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
    logger.info(f"Image decoded: {img.shape}, range [{img.min()}-{img.max()}]")
    return img


def enhance_fingerprint(img: np.ndarray) -> np.ndarray:
    """Enhance fingerprint using CLAHE + Gabor filter bank."""
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(img)
    enhanced = cv2.GaussianBlur(enhanced, (3, 3), 0)

    # Gabor filter bank — 8 orientations
    gabor_sum = np.zeros_like(enhanced, dtype=np.float64)
    for theta in np.arange(0, np.pi, np.pi / 8):
        kernel = cv2.getGaborKernel(
            (21, 21), sigma=4.0, theta=theta,
            lambd=8.0, gamma=0.5, psi=0
        )
        filtered = cv2.filter2D(enhanced, cv2.CV_64F, kernel)
        gabor_sum = np.maximum(gabor_sum, filtered)

    result = cv2.normalize(gabor_sum, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    return result


# ══════════ Matching Methods ══════════

def orb_match_score(img1: np.ndarray, img2: np.ndarray) -> float:
    """ORB feature-based matching. Returns 0-100."""
    enh1 = enhance_fingerprint(img1)
    enh2 = enhance_fingerprint(img2)

    orb = cv2.ORB_create(nfeatures=500, scaleFactor=1.2, nlevels=8,
                         edgeThreshold=10, patchSize=31)
    kp1, desc1 = orb.detectAndCompute(enh1, None)
    kp2, desc2 = orb.detectAndCompute(enh2, None)

    logger.info(f"ORB keypoints: {len(kp1) if kp1 else 0} vs {len(kp2) if kp2 else 0}")

    if desc1 is None or desc2 is None or len(desc1) < 5 or len(desc2) < 5:
        return 0.0

    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    try:
        matches = bf.knnMatch(desc1, desc2, k=2)
    except cv2.error:
        return 0.0

    good = [m for m, n in matches if len([m, n]) == 2 and m.distance < 0.8 * n.distance]
    # Also count all matches for secondary reference
    good2 = [pair for pair in matches if len(pair) == 2]
    good = [pair[0] for pair in good2 if pair[0].distance < 0.8 * pair[1].distance]

    total = min(len(desc1), len(desc2))
    score = (len(good) / total) * 100.0 if total > 0 else 0.0
    logger.info(f"ORB score: {score:.2f} ({len(good)} good matches / {total} total)")
    return round(score, 2)


def ssim_score(img1: np.ndarray, img2: np.ndarray) -> float:
    """Structural Similarity Index. Returns 0-100."""
    enh1 = enhance_fingerprint(img1)
    enh2 = enhance_fingerprint(img2)

    # Compute SSIM manually using OpenCV (no skimage dependency)
    C1 = (0.01 * 255) ** 2
    C2 = (0.03 * 255) ** 2

    img1f = enh1.astype(np.float64)
    img2f = enh2.astype(np.float64)

    mu1 = cv2.GaussianBlur(img1f, (11, 11), 1.5)
    mu2 = cv2.GaussianBlur(img2f, (11, 11), 1.5)
    mu1_sq = mu1 ** 2
    mu2_sq = mu2 ** 2
    mu1_mu2 = mu1 * mu2

    sigma1_sq = cv2.GaussianBlur(img1f ** 2, (11, 11), 1.5) - mu1_sq
    sigma2_sq = cv2.GaussianBlur(img2f ** 2, (11, 11), 1.5) - mu2_sq
    sigma12 = cv2.GaussianBlur(img1f * img2f, (11, 11), 1.5) - mu1_mu2

    ssim_map = ((2 * mu1_mu2 + C1) * (2 * sigma12 + C2)) / \
               ((mu1_sq + mu2_sq + C1) * (sigma1_sq + sigma2_sq + C2))

    raw_ssim = float(ssim_map.mean())  # -1 to 1
    # Map to 0-100 scale (SSIM of 0.3+ is very similar for fingerprints)
    score = max(0.0, raw_ssim) * 100.0
    logger.info(f"SSIM raw: {raw_ssim:.4f}, score: {score:.2f}")
    return round(score, 2)


def histogram_score(img1: np.ndarray, img2: np.ndarray) -> float:
    """Histogram correlation matching. Returns 0-100."""
    enh1 = enhance_fingerprint(img1)
    enh2 = enhance_fingerprint(img2)

    # Divide image into a 4x4 grid and compare local histograms
    rows, cols = 4, 4
    h, w = enh1.shape
    bh, bw = h // rows, w // cols
    scores = []

    for r in range(rows):
        for c in range(cols):
            block1 = enh1[r*bh:(r+1)*bh, c*bw:(c+1)*bw]
            block2 = enh2[r*bh:(r+1)*bh, c*bw:(c+1)*bw]
            hist1 = cv2.calcHist([block1], [0], None, [32], [0, 256])
            hist2 = cv2.calcHist([block2], [0], None, [32], [0, 256])
            cv2.normalize(hist1, hist1)
            cv2.normalize(hist2, hist2)
            corr = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
            scores.append(max(0.0, corr))

    avg = np.mean(scores) * 100.0
    logger.info(f"Histogram score: {avg:.2f}")
    return round(avg, 2)


# ══════════ API Endpoints ══════════

@app.get("/health")
def health():
    return {"status": "ok", "service": "NutoPass Biometric Matcher v2.0", "threshold": MATCH_THRESHOLD}


@app.post("/match", response_model=MatchResponse)
def match_fingerprints(req: MatchRequest):
    """Compare two fingerprint images using multi-method matching."""
    try:
        probe_img = decode_r307_image(req.probe_base64)
        candidate_img = decode_r307_image(req.candidate_base64)
    except Exception as e:
        logger.error(f"Image decode error: {e}")
        raise HTTPException(status_code=400, detail=f"Image decode error: {str(e)}")

    try:
        orb = orb_match_score(probe_img, candidate_img)
        ssim = ssim_score(probe_img, candidate_img)
        hist = histogram_score(probe_img, candidate_img)
    except Exception as e:
        logger.error(f"Matching error: {e}")
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")

    # Weighted combination: SSIM is most reliable for same-sensor images
    combined = (orb * 0.3) + (ssim * 0.4) + (hist * 0.3)
    is_match = combined >= MATCH_THRESHOLD

    logger.info(f"MATCH RESULT: ORB={orb:.1f} SSIM={ssim:.1f} HIST={hist:.1f} "
                f"COMBINED={combined:.1f} threshold={MATCH_THRESHOLD} → {'MATCH' if is_match else 'NO MATCH'}")

    return MatchResponse(
        match=is_match, score=round(combined, 2), threshold=MATCH_THRESHOLD,
        orb_score=orb, ssim_score=ssim, hist_score=hist
    )


if __name__ == "__main__":
    import uvicorn
    print("Starting NutoPass Biometric Matcher v2.0 on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
