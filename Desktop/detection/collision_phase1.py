import pygame
import sys

pygame.init()
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Phase 2: Event-Based Raycasting")

BACKGROUND_COLOR = (30, 30, 30)
NORMAL_COLOR = (0, 200, 255)
TARGET_COLOR = (150, 150, 150)
LASER_COLOR = (255, 50, 50)

clock = pygame.time.Clock()

def ray_vs_aabb(ray_origin, ray_direction, target_box):
    bx, by, bw, bh = target_box
    ox, oy = ray_origin
    dx, dy = ray_direction

    if dx == 0: dx = 0.00001
    if dy == 0: dy = 0.00001

    t_near_x = (bx - ox) / dx
    t_far_x = (bx + bw - ox) / dx
    if t_near_x > t_far_x: t_near_x, t_far_x = t_far_x, t_near_x

    t_near_y = (by - oy) / dy
    t_far_y = (by + bh - oy) / dy
    if t_near_y > t_far_y: t_near_y, t_far_y = t_far_y, t_near_y

    t_hit_near = max(t_near_x, t_near_y)
    t_hit_far = min(t_far_x, t_far_y)

    # Missed, behind us, started inside, or too far away this frame
    if t_hit_near > t_hit_far or t_hit_far < 0 or t_hit_near < 0 or t_hit_near > 1.0:
        return False, 0.0

    return True, t_hit_near

player_box = [100, 250, 50, 50]
player_speed = 5
target_box = [500, 150, 50, 300] 

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    keys = pygame.key.get_pressed()
    if keys[pygame.K_UP]: player_box[1] -= player_speed
    if keys[pygame.K_DOWN]: player_box[1] += player_speed
    if keys[pygame.K_LEFT]: player_box[0] -= player_speed
    if keys[pygame.K_RIGHT]: player_box[0] += player_speed

    screen.fill(BACKGROUND_COLOR)
    pygame.draw.rect(screen, NORMAL_COLOR, player_box)
    pygame.draw.rect(screen, TARGET_COLOR, target_box)

    if keys[pygame.K_SPACE]:
        ray_origin = [player_box[0] + 25, player_box[1] + 25]
        ray_direction = [1000, 0] 
        
        is_hit, hit_time = ray_vs_aabb(ray_origin, ray_direction, target_box)
        #player_speed = 0
        
        if is_hit:
            hit_x = ray_origin[0] + (ray_direction[0] * hit_time)
            hit_y = ray_origin[1] + (ray_direction[1] * hit_time)
            pygame.draw.line(screen, LASER_COLOR, ray_origin, (hit_x, hit_y), 4)
            pygame.draw.circle(screen, (255, 255, 255), (int(hit_x), int(hit_y)), 5)
        else:
            miss_x = ray_origin[0] + ray_direction[0]
            miss_y = ray_origin[1] + ray_direction[1]
            pygame.draw.line(screen, NORMAL_COLOR, ray_origin, (miss_x, miss_y), 2)

    pygame.display.flip()
    clock.tick(60)

pygame.quit()
sys.exit()