import numpy as np
import pandas as pd

# ==========================================
# PHASE 4 -- STEP 1: GENERATE TRAINING DATA
# ==========================================
# We simulate thousands of random car pairs.
# For each pair we record 8 features and label
# whether they will collide within 3 seconds.

np.random.seed(42)
NUM_SAMPLES = 20000
LOOKAHEAD   = 3.0   # seconds to look ahead
CAR_SIZE    = 2.5   # metres (width of a car)

records = []

for _ in range(NUM_SAMPLES):

    # Random position of car 1 (x, y in metres)
    x1 = np.random.uniform(0, 100)
    y1 = np.random.uniform(0, 100)

    # Random position of car 2
    x2 = np.random.uniform(0, 100)
    y2 = np.random.uniform(0, 100)

    # Random speeds (0 to 30 m/s = 0 to 108 km/h)
    speed1 = np.random.uniform(0, 30)
    speed2 = np.random.uniform(0, 30)

    # Random headings (0 to 360 degrees)
    heading1 = np.random.uniform(0, 360)
    heading2 = np.random.uniform(0, 360)

    # Convert heading to velocity components
    vx1 = speed1 * np.cos(np.radians(heading1))
    vy1 = speed1 * np.sin(np.radians(heading1))
    vx2 = speed2 * np.cos(np.radians(heading2))
    vy2 = speed2 * np.sin(np.radians(heading2))

    # ==========================================
    # LABEL: will they collide within LOOKAHEAD?
    # Use CCD quadratic formula from Phase 2
    # ==========================================
    dp = np.array([x1 - x2, y1 - y2])
    dv = np.array([vx1 - vx2, vy1 - vy2])
    d  = CAR_SIZE * 2  # collision distance

    a = np.dot(dv, dv)
    b = 2 * np.dot(dp, dv)
    c = np.dot(dp, dp) - d ** 2

    label = 0  # default: no collision

    if abs(a) > 1e-9:
        discriminant = b ** 2 - 4 * a * c
        if discriminant >= 0:
            t = (-b - np.sqrt(discriminant)) / (2 * a)
            if 0 <= t <= LOOKAHEAD:
                label = 1  # collision predicted

    # ==========================================
    # FEATURES: what the neural network sees
    # ==========================================
    dx           = x2 - x1
    dy           = y2 - y1
    distance     = np.sqrt(dx**2 + dy**2)
    dvx          = vx2 - vx1
    dvy          = vy2 - vy1
    heading_diff = abs(heading1 - heading2) % 360

    records.append({
        "dx":           round(dx, 4),
        "dy":           round(dy, 4),
        "distance":     round(distance, 4),
        "dvx":          round(dvx, 4),
        "dvy":          round(dvy, 4),
        "speed1":       round(speed1, 4),
        "speed2":       round(speed2, 4),
        "heading_diff": round(heading_diff, 4),
        "label":        label
    })

# Save to CSV
df = pd.DataFrame(records)
df.to_csv("collision_data.csv", index=False)

# ==========================================
# SUMMARY
# ==========================================
print("==========================================")
print(" Phase 4: Training Data Generated         ")
print("==========================================")
print(f"Total samples     : {len(df)}")
print(f"Collision cases   : {df['label'].sum()} "
      f"({round(df['label'].mean()*100, 1)}%)")
print(f"No collision      : {(df['label']==0).sum()} "
      f"({round((df['label']==0).mean()*100, 1)}%)")
print()
print("Feature summary:")
print(df.drop(columns='label').describe().round(2).to_string())
print()
print("Saved to: collision_data.csv")
print("==========================================")