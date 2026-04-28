import cv2
import numpy as np

# ==========================================
# OPTICAL FLOW -- LUCAS-KANADE ALGORITHM
# Tracks moving objects from webcam and
# predicts collision risk from pixel motion
# ==========================================

print("==========================================")
print(" Optical Flow: Lucas-Kanade Tracker       ")
print(" Press Q to quit                          ")
print("==========================================")

# ==========================================
# 1. SETUP
# ==========================================

# Lucas-Kanade optical flow parameters
LK_PARAMS = dict(
    winSize   = (15, 15),   # Size of search window at each pyramid level
    maxLevel  = 2,           # Number of pyramid levels (handles fast motion)
    criteria  = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03)
)

# Shi-Tomasi corner detection parameters (finds good points to track)
FEATURE_PARAMS = dict(
    maxCorners   = 50,       # Maximum number of points to track
    qualityLevel = 0.3,      # Minimum quality of corners (0 to 1)
    minDistance  = 10,       # Minimum distance between detected points
    blockSize    = 7         # Size of averaging block for corner detection
)

# Colours for drawing tracks
TRACK_COLOR   = (0, 255, 0)     # Green tracks
POINT_COLOR   = (0, 0, 255)     # Red dots at feature points
WARNING_COLOR = (0, 0, 255)     # Red warning text
SAFE_COLOR    = (0, 255, 0)     # Green safe text
TEXT_COLOR    = (255, 255, 255) # White text

# Collision risk thresholds (pixels per frame)
RISK_LOW      = 3.0    # Below this -- safe
RISK_MEDIUM   = 6.0    # Below this -- caution
                       # Above this  -- high risk

# ==========================================
# 2. OPEN WEBCAM
# ==========================================
cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print("ERROR: Could not open webcam.")
    print("Make sure your webcam is connected and not used by another app.")
    exit()

# Read first frame
ret, old_frame = cap.read()
if not ret:
    print("ERROR: Could not read from webcam.")
    exit()

old_gray = cv2.cvtColor(old_frame, cv2.COLOR_BGR2GRAY)

# Detect initial feature points to track
p0 = cv2.goodFeaturesToTrack(old_gray, mask=None, **FEATURE_PARAMS)

# Create a blank mask for drawing motion trails
mask = np.zeros_like(old_frame)

# Track history for each point
track_history = {}  # point_id -> list of (x,y) positions

frame_count   = 0
redetect_every = 30  # Re-detect feature points every 30 frames

print("Webcam opened. Move objects in front of the camera.")
print("Green dots = tracked points | Green lines = motion trail")
print("The risk bar at the top shows predicted collision risk.")

# ==========================================
# 3. MAIN LOOP
# ==========================================
while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    frame_gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    display     = frame.copy()
    h, w        = frame.shape[:2]

    # Re-detect feature points periodically or if too few remain
    if p0 is None or len(p0) < 5 or frame_count % redetect_every == 0:
        p0 = cv2.goodFeaturesToTrack(frame_gray, mask=None, **FEATURE_PARAMS)
        mask = np.zeros_like(frame)   # Reset trails
        if p0 is None:
            # No features found -- show message and continue
            cv2.putText(display, "No features detected -- move something in frame",
                        (10, h // 2), cv2.FONT_HERSHEY_SIMPLEX, 0.6, WARNING_COLOR, 2)
            cv2.imshow("Optical Flow -- Lucas-Kanade", display)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
            old_gray = frame_gray.copy()
            continue

    # ==========================================
    # 4. LUCAS-KANADE OPTICAL FLOW
    # ==========================================
    # Calculate optical flow -- find where each point moved to
    p1, status, error = cv2.calcOpticalFlowPyrLK(
        old_gray, frame_gray, p0, None, **LK_PARAMS
    )

    if p1 is None:
        old_gray = frame_gray.copy()
        continue

    # Select only the points that were successfully tracked
    good_new = p1[status == 1]
    good_old = p0[status == 1]

    # ==========================================
    # 5. CALCULATE VELOCITIES AND RISK
    # ==========================================
    velocities  = []
    approaching = []  # points moving toward centre of frame
    cx, cy      = w // 2, h // 2  # frame centre

    for i, (new, old) in enumerate(zip(good_new, good_old)):
        x_new, y_new = new.ravel()
        x_old, y_old = old.ravel()

        # Velocity of this point (pixels per frame)
        vx   = x_new - x_old
        vy   = y_new - y_old
        speed = np.sqrt(vx**2 + vy**2)
        velocities.append(speed)

        # Is this point moving toward the camera centre?
        # If an object moves toward centre it is approaching the vehicle
        to_centre_x = cx - x_old
        to_centre_y = cy - y_old
        dot_product = vx * to_centre_x + vy * to_centre_y
        if dot_product > 0:
            approaching.append(speed)

        # Draw motion trail
        a = (int(x_new), int(y_new))
        b = (int(x_old), int(y_old))
        mask  = cv2.line(mask, a, b, TRACK_COLOR, 2)
        display = cv2.circle(display, a, 4, POINT_COLOR, -1)

    # Overlay the motion trails on the frame
    display = cv2.add(display, mask)

    # ==========================================
    # 6. COLLISION RISK ASSESSMENT
    # ==========================================
    avg_speed       = np.mean(velocities) if velocities else 0
    approach_speed  = np.mean(approaching) if approaching else 0
    num_approaching = len(approaching)

    # Risk score combines average speed and approach motion
    risk_score = avg_speed * 0.4 + approach_speed * 0.6

    if risk_score < RISK_LOW:
        risk_label = "SAFE"
        risk_color = SAFE_COLOR
        risk_level = 0
    elif risk_score < RISK_MEDIUM:
        risk_label = "CAUTION"
        risk_color = (0, 165, 255)   # Orange
        risk_level = 1
    else:
        risk_label = "HIGH RISK"
        risk_color = WARNING_COLOR
        risk_level = 2

    # ==========================================
    # 7. DRAW HUD
    # ==========================================
    # Dark HUD background at top
    cv2.rectangle(display, (0, 0), (w, 110), (20, 20, 40), -1)
    cv2.line(display, (0, 110), (w, 110), (80, 80, 120), 1)

    # Title
    cv2.putText(display, "OPTICAL FLOW -- LUCAS-KANADE",
                (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, TEXT_COLOR, 2)

    # Stats
    cv2.putText(display, f"Tracked points : {len(good_new)}",
                (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5, TEXT_COLOR, 1)
    cv2.putText(display, f"Avg speed      : {round(avg_speed, 2)} px/frame",
                (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.5, TEXT_COLOR, 1)
    cv2.putText(display, f"Approaching    : {num_approaching} points @ {round(approach_speed,2)} px/frame",
                (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.5, TEXT_COLOR, 1)

    # Risk label
    cv2.putText(display, f"RISK: {risk_label}",
                (w - 220, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, risk_color, 2)

    # Risk bar
    bar_x, bar_y, bar_w, bar_h = w - 220, 55, 200, 18
    cv2.rectangle(display, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h), (60, 60, 60), -1)
    fill = min(int((risk_score / 10.0) * bar_w), bar_w)
    cv2.rectangle(display, (bar_x, bar_y), (bar_x + fill, bar_y + bar_h), risk_color, -1)
    cv2.rectangle(display, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h), (150, 150, 150), 1)

    # Frame counter
    cv2.putText(display, f"Frame: {frame_count}",
                (w - 110, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (100, 100, 100), 1)

    # Draw crosshair at frame centre
    cv2.drawMarker(display, (cx, cy), (80, 80, 80),
                   cv2.MARKER_CROSS, 20, 1)

    # ==========================================
    # 8. SHOW FRAME
    # ==========================================
    cv2.imshow("Optical Flow -- Lucas-Kanade", display)

    # Update for next frame
    old_gray = frame_gray.copy()
    p0       = good_new.reshape(-1, 1, 2)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# ==========================================
# 9. CLEANUP
# ==========================================
cap.release()
cv2.destroyAllWindows()
print("\nOptical Flow session ended.")
print(f"Total frames processed: {frame_count}")