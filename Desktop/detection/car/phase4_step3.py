import pygame
import sys
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler


class CollisionClassifier(nn.Module):
    def __init__(self, input_dim=8):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        return self.network(x)

# ==========================================
# 2. LOAD MODEL AND SCALER
# ==========================================
print("Loading trained model...")
model = CollisionClassifier(input_dim=8)
model.load_state_dict(torch.load("best_model.pth"))
model.eval()

# Refit scaler on training data so normalisation matches
df      = pd.read_csv("collision_data.csv")
X_all   = df.drop(columns="label").values.astype(np.float32)
scaler  = StandardScaler()
scaler.fit(X_all)
print("Model and scaler ready.")

# ==========================================
# 3. COLLISION ALGORITHMS
# ==========================================
def check_aabb_collision(box1, box2):
    """Phase 1 -- AABB contact check."""
    b1_x, b1_y, b1_w, b1_h = box1
    b2_x, b2_y, b2_w, b2_h = box2
    overlap_x = (b1_x < b2_x + b2_w) and (b1_x + b1_w > b2_x)
    overlap_y = (b1_y < b2_y + b2_h) and (b1_y + b1_h > b2_y)
    return overlap_x and overlap_y

def predict_collision_prob(car1, car2, model, scaler):
    """Phase 4 -- Deep learning collision probability."""
    x1, y1, w1, h1, vx1, vy1 = car1
    x2, y2, w2, h2, vx2, vy2 = car2

    cx1, cy1 = x1 + w1 / 2, y1 + h1 / 2
    cx2, cy2 = x2 + w2 / 2, y2 + h2 / 2

    dx           = cx2 - cx1
    dy           = cy2 - cy1
    distance     = np.sqrt(dx**2 + dy**2)
    dvx          = vx2 - vx1
    dvy          = vy2 - vy1
    speed1       = np.sqrt(vx1**2 + vy1**2)
    speed2       = np.sqrt(vx2**2 + vy2**2)
    h1_deg       = np.degrees(np.arctan2(vy1, vx1)) % 360
    h2_deg       = np.degrees(np.arctan2(vy2, vx2)) % 360
    heading_diff = abs(h1_deg - h2_deg) % 360

    features = np.array([[dx, dy, distance, dvx, dvy,
                          speed1, speed2, heading_diff]], dtype=np.float32)
    features_norm = scaler.transform(features)
    x_t = torch.tensor(features_norm, dtype=torch.float32)

    with torch.no_grad():
        prob = model(x_t).item()
    return prob

# ==========================================
# 4. PYGAME SETUP
# ==========================================
pygame.init()
WIDTH, HEIGHT = 900, 650
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("All Phases: CPU + Raycast + Deep Learning")

BACKGROUND  = (20, 20, 30)
PLAYER_COL  = (0, 200, 255)
CAR_COL     = (100, 200, 100)
COLLIDE_COL = (255, 50,  50)
LASER_COL   = (255, 200, 0)
HUD_COL     = (220, 220, 220)
DIM_COL     = (100, 100, 100)

font_sm  = pygame.font.SysFont("monospace", 15)
font_md  = pygame.font.SysFont("monospace", 17, bold=True)
font_lg  = pygame.font.SysFont("monospace", 20, bold=True)

clock = pygame.time.Clock()
FPS   = 60

# ==========================================
# 5. CARS
# [x, y, width, height, vx, vy]
# ==========================================
player = [80,  300, 50, 30,  0,   0  ]
car2   = [500, 200, 50, 30, -1.5, 0.4]
car3   = [600, 400, 50, 30, -1.0,-0.6]
cars   = [car2, car3]

PLAYER_SPEED = 4

# ==========================================
# 6. HELPER -- draw probability bar
# ==========================================
def draw_prob_bar(surface, x, y, width, height, prob, label):
    # Background bar
    pygame.draw.rect(surface, (60, 60, 60), (x, y, width, height))
    # Filled portion
    fill_w = int(width * prob)
    if prob < 0.4:
        bar_color = (50, 200, 50)    # green
    elif prob < 0.7:
        bar_color = (255, 180, 0)    # orange
    else:
        bar_color = (255, 50, 50)    # red
    pygame.draw.rect(surface, bar_color, (x, y, fill_w, height))
    pygame.draw.rect(surface, (150, 150, 150), (x, y, width, height), 1)
    # Label
    txt = font_sm.render(f"{label}: {round(prob*100, 1)}%", True, HUD_COL)
    surface.blit(txt, (x + width + 8, y))

# ==========================================
# 7. MAIN LOOP
# ==========================================
running = True
while running:

    # --- Events ---
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # --- Player movement ---
    keys = pygame.key.get_pressed()
    player[4] = 0
    player[5] = 0
    if keys[pygame.K_LEFT]:  player[4] = -PLAYER_SPEED
    if keys[pygame.K_RIGHT]: player[4] =  PLAYER_SPEED
    if keys[pygame.K_UP]:    player[5] = -PLAYER_SPEED
    if keys[pygame.K_DOWN]:  player[5] =  PLAYER_SPEED

    player[0] += player[4]
    player[1] += player[5]

    # Keep player on screen
    player[0] = max(0, min(WIDTH  - player[2], player[0]))
    player[1] = max(0, min(HEIGHT - player[3] - 120, player[1]))

    # --- Move other cars and bounce off walls ---
    for car in cars:
        car[0] += car[4]
        car[1] += car[5]
        if car[0] <= 0 or car[0] + car[2] >= WIDTH:
            car[4] *= -1
        if car[1] <= 0 or car[1] + car[3] >= HEIGHT - 120:
            car[5] *= -1

    # --- PHASE 1: AABB check (player vs all cars) ---
    aabb_hits = []
    all_cars  = [player] + cars
    for i in range(len(all_cars)):
        for j in range(i + 1, len(all_cars)):
            box_i = all_cars[i][:4]
            box_j = all_cars[j][:4]
            if check_aabb_collision(box_i, box_j):
                aabb_hits.append((i, j))

    colliding_indices = set()
    for i, j in aabb_hits:
        colliding_indices.add(i)
        colliding_indices.add(j)

    # --- PHASE 4: DL probability (player vs each car) ---
    probs = []
    for car in cars:
        prob = predict_collision_prob(player, car, model, scaler)
        probs.append(prob)

    # --- RENDER ---
    screen.fill(BACKGROUND)

    # Draw road markings
    for x in range(0, WIDTH, 60):
        pygame.draw.line(screen, (50, 50, 50), (x, 0), (x, HEIGHT - 120), 1)

    # Draw cars
    for idx, car in enumerate(all_cars):
        box   = car[:4]
        color = COLLIDE_COL if idx in colliding_indices else (PLAYER_COL if idx == 0 else CAR_COL)
        pygame.draw.rect(screen, color, box)
        pygame.draw.rect(screen, (255, 255, 255), box, 1)

        # Label
        label = "YOU" if idx == 0 else f"C{idx}"
        lbl   = font_sm.render(label, True, (255, 255, 255))
        screen.blit(lbl, (box[0] + 5, box[1] + 8))

        # Velocity arrow
        cx = box[0] + box[2] // 2
        cy = box[1] + box[3] // 2
        pygame.draw.line(screen, (255, 255, 0),
                         (cx, cy),
                         (cx + int(car[4] * 8), cy + int(car[5] * 8)), 2)

    # --- PHASE 2: RAYCAST on SPACE ---
    ray_info = "LASER: hold SPACE to fire"
    if keys[pygame.K_SPACE]:
        ray_ox = player[0] + player[2]
        ray_oy = player[1] + player[3] // 2
        ray_dx, ray_dy = 800, 0

        hit_any = False
        for car in cars:
            bx, by, bw, bh = car[:4]
            ox, oy = ray_ox, ray_oy
            dx, dy = ray_dx, ray_dy
            if dx == 0: dx = 0.00001
            if dy == 0: dy = 0.00001
            t_nx = (bx - ox) / dx;        t_fx = (bx + bw - ox) / dx
            if t_nx > t_fx: t_nx, t_fx = t_fx, t_nx
            t_ny = (by - oy) / dy;        t_fy = (by + bh - oy) / dy
            if t_ny > t_fy: t_ny, t_fy = t_fy, t_ny
            t_near = max(t_nx, t_ny);     t_far = min(t_fx, t_fy)
            if t_near <= t_far and t_far >= 0 and 0 <= t_near <= 1.0:
                hx = int(ox + dx * t_near)
                hy = int(oy + dy * t_near)
                pygame.draw.line(screen, LASER_COL, (ray_ox, ray_oy), (hx, hy), 3)
                pygame.draw.circle(screen, (255, 255, 255), (hx, hy), 5)
                ray_info = f"LASER: HIT at t={round(t_near, 3)}"
                hit_any = True
                break

        if not hit_any:
            pygame.draw.line(screen, DIM_COL,
                             (ray_ox, ray_oy), (ray_ox + ray_dx, ray_oy), 2)
            ray_info = "LASER: MISS"

    # --- HUD PANEL ---
    hud_y = HEIGHT - 118
    pygame.draw.rect(screen, (30, 30, 45), (0, hud_y, WIDTH, 118))
    pygame.draw.line(screen, (80, 80, 120), (0, hud_y), (WIDTH, hud_y), 1)

    # Phase labels
    screen.blit(font_lg.render("COLLISION DETECTION PIPELINE", True, (180, 180, 255)),
                (10, hud_y + 6))

    # Phase 1 AABB status
    aabb_text  = "PHASE 1 AABB: COLLISION" if colliding_indices else "PHASE 1 AABB: Safe"
    aabb_color = COLLIDE_COL if colliding_indices else (50, 200, 50)
    screen.blit(font_md.render(aabb_text, True, aabb_color), (10, hud_y + 30))

    # Phase 2 raycast status
    screen.blit(font_sm.render(f"PHASE 2 RAYCAST: {ray_info}", True, HUD_COL),
                (10, hud_y + 52))

    # Phase 4 probability bars
    screen.blit(font_sm.render("PHASE 4 DL RISK:", True, HUD_COL), (10, hud_y + 72))
    for i, prob in enumerate(probs):
        draw_prob_bar(screen, 140 + i * 280, hud_y + 72, 200, 14, prob, f"Car {i+1}")

    # Controls
    screen.blit(font_sm.render("Arrow keys: move   SPACE: fire laser   ESC: quit",
                True, DIM_COL), (10, hud_y + 98))

    # FPS
    fps_txt = font_sm.render(f"FPS: {int(clock.get_fps())}", True, DIM_COL)
    screen.blit(fps_txt, (WIDTH - 80, hud_y + 6))

    if keys[pygame.K_ESCAPE]:
        running = False

    pygame.display.flip()
    clock.tick(FPS)

pygame.quit()
sys.exit()