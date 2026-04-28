import pygame
import sys

# ==========================================
# 1. SETUP AND CONFIGURATION
# ==========================================
pygame.init()
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Phase 1 + 2: Merged Collision Pipeline")

BACKGROUND_COLOR = (30, 30, 30)
PLAYER_COLOR     = (0, 200, 255)    # Light blue
WALL_NORMAL      = (150, 150, 150)  # Grey
WALL_HIT         = (255, 50, 50)    # Red when AABB contact
LASER_COLOR      = (255, 200, 0)    # Yellow laser
LASER_HIT_COLOR  = (255, 50, 50)    # Red laser when it hits

clock = pygame.time.Clock()
FPS = 60

# ==========================================
# 2. PHASE 1 -- AABB COLLISION (CPU, runs every frame)
# ==========================================
def check_aabb_collision(box1, box2):
    """
    Checks if two Axis-Aligned Bounding Boxes overlap.
    Each box is [x, y, width, height].
    Returns True if they are overlapping, False otherwise.
    """
    b1_x, b1_y, b1_w, b1_h = box1
    b2_x, b2_y, b2_w, b2_h = box2

    # Check overlap on the X axis
    overlap_x = (b1_x < b2_x + b2_w) and (b1_x + b1_w > b2_x)

    # Check overlap on the Y axis
    overlap_y = (b1_y < b2_y + b2_h) and (b1_y + b1_h > b2_y)

    # Collision only if BOTH axes overlap (Separating Axis Theorem)
    return overlap_x and overlap_y

# ==========================================
# 3. PHASE 2 -- RAYCAST (Event-Based, runs on SPACE)
# ==========================================
def ray_vs_aabb(ray_origin, ray_direction, target_box):
    """
    Calculates EXACTLY WHEN (and if) a ray hits a box.
    Returns (hit: bool, t: float) where t is the fraction
    of ray_direction travelled before impact (0.0 to 1.0).
    """
    bx, by, bw, bh = target_box
    ox, oy = ray_origin
    dx, dy = ray_direction

    # Avoid division by zero for perfectly horizontal or vertical rays
    if dx == 0: dx = 0.00001
    if dy == 0: dy = 0.00001

    # Calculate intersection times on each axis
    t_near_x = (bx - ox) / dx
    t_far_x  = (bx + bw - ox) / dx
    if t_near_x > t_far_x: t_near_x, t_far_x = t_far_x, t_near_x

    t_near_y = (by - oy) / dy
    t_far_y  = (by + bh - oy) / dy
    if t_near_y > t_far_y: t_near_y, t_far_y = t_far_y, t_near_y

    # The ray hits the box between t_hit_near and t_hit_far
    t_hit_near = max(t_near_x, t_near_y)
    t_hit_far  = min(t_far_x,  t_far_y)

    # Reject: missed, behind us, started inside box, or too far
    if t_hit_near > t_hit_far or t_hit_far < 0 or t_hit_near < 0 or t_hit_near > 1.0:
        return False, 0.0

    return True, t_hit_near

# ==========================================
# 4. INITIALISE OBJECTS
# ==========================================
player_box   = [100, 250, 50, 50]   # [x, y, width, height]
player_speed = 4
wall_box     = [500, 100, 50, 400]  # Tall wall on the right

# ==========================================
# 5. HUD FONT
# ==========================================
font       = pygame.font.SysFont("monospace", 16)
font_large = pygame.font.SysFont("monospace", 20, bold=True)

# ==========================================
# 6. MAIN GAME LOOP
# ==========================================
running = True
while running:

    # --- A. EVENT HANDLING ---
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # --- B. PLAYER MOVEMENT ---
    keys = pygame.key.get_pressed()
    if keys[pygame.K_UP]:    player_box[1] -= player_speed
    if keys[pygame.K_DOWN]:  player_box[1] += player_speed
    if keys[pygame.K_LEFT]:  player_box[0] -= player_speed
    if keys[pygame.K_RIGHT]: player_box[0] += player_speed

    # Keep player inside screen bounds
    player_box[0] = max(0, min(WIDTH  - player_box[2], player_box[0]))
    player_box[1] = max(0, min(HEIGHT - player_box[3], player_box[1]))

    # --- C. PHASE 1: AABB (runs every single frame) ---
    touching = check_aabb_collision(player_box, wall_box)

    # --- D. RENDER ---
    screen.fill(BACKGROUND_COLOR)

    # Draw wall -- red if AABB contact, grey otherwise
    wall_color = WALL_HIT if touching else WALL_NORMAL
    pygame.draw.rect(screen, wall_color, wall_box)

    # Draw player
    pygame.draw.rect(screen, PLAYER_COLOR, player_box)

    # --- E. PHASE 2: RAYCAST (runs only when SPACE is held) ---
    ray_status = "LASER: off  (hold SPACE)"
    if keys[pygame.K_SPACE]:
        # Fire from the centre of the player box
        ray_origin    = [player_box[0] + 25, player_box[1] + 25]
        ray_direction = [1000, 0]   # Shoots to the right

        is_hit, t = ray_vs_aabb(ray_origin, ray_direction, wall_box)

        if is_hit:
            hit_x = ray_origin[0] + ray_direction[0] * t
            hit_y = ray_origin[1] + ray_direction[1] * t
            # Red laser stops exactly at wall edge
            pygame.draw.line(screen, LASER_HIT_COLOR, ray_origin, (hit_x, hit_y), 4)
            # White impact dot
            pygame.draw.circle(screen, (255, 255, 255), (int(hit_x), int(hit_y)), 6)
            ray_status = f"LASER: HIT  (t = {round(t, 3)}, x = {int(hit_x)})"
        else:
            # Yellow laser goes off screen -- no hit
            miss_end = (ray_origin[0] + ray_direction[0], ray_origin[1])
            pygame.draw.line(screen, LASER_COLOR, ray_origin, miss_end, 2)
            ray_status = "LASER: MISS (move level with wall)"

    # --- F. HUD ---
    # AABB status
    aabb_text  = f"PHASE 1 AABB  : {'COLLISION DETECTED' if touching else 'No contact'}"
    aabb_color = (255, 80, 80) if touching else (180, 180, 180)
    screen.blit(font_large.render(aabb_text,  True, aabb_color),       (10, 10))
    screen.blit(font.render(ray_status,        True, (200, 200, 200)), (10, 38))
    screen.blit(font.render("Move: Arrow keys  |  Fire laser: SPACE", True, (100, 100, 100)), (10, HEIGHT - 25))

    pygame.display.flip()
    clock.tick(FPS)

pygame.quit()
sys.exit()