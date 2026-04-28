import pybullet as p
import pybullet_data
import time

# ==========================================
# 1. SETUP
# ==========================================
physicsClient = p.connect(p.GUI)
p.setAdditionalSearchPath(pybullet_data.getDataPath())
p.setGravity(0, 0, -10)

planeId = p.loadURDF("plane.urdf")

# ==========================================
# 2. LOAD TWO RACECARS -- very close together
# ==========================================
car1Id = p.loadURDF("racecar/racecar.urdf", [0, 0, 0.5],
                     p.getQuaternionFromEuler([0, 0, 0]))

car2Id = p.loadURDF("racecar/racecar.urdf", [0.1, 0, 0.5],
                     p.getQuaternionFromEuler([0, 0, 0]))

print("==========================================")
print(" Phase 3: Model-Based Collision Detection")
print("==========================================")
print(f"Plane  ID : {planeId}")
print(f"Car 1  ID : {car1Id}")
print(f"Car 2  ID : {car2Id}")
print(f"Car 1 joints : {p.getNumJoints(car1Id)}")
print(f"Car 2 joints : {p.getNumJoints(car2Id)}")
print()

# ==========================================
# 3. WARM UP -- run 10 steps before checking
# ==========================================
print("Running 10 warm-up steps...")
for _ in range(10):
    p.stepSimulation()

# Print positions to confirm where cars actually are
pos1, _ = p.getBasePositionAndOrientation(car1Id)
pos2, _ = p.getBasePositionAndOrientation(car2Id)
print(f"Car 1 position after warm-up : {[round(v,3) for v in pos1]}")
print(f"Car 2 position after warm-up : {[round(v,3) for v in pos2]}")

# Check ALL contacts in scene after warm-up
all_contacts = p.getContactPoints()
print(f"\nTotal contacts in scene after warm-up : {len(all_contacts) if all_contacts else 0}")
if all_contacts:
    for c in all_contacts:
        print(f"  Body {c[1]} (link {c[3]}) vs Body {c[2]} (link {c[4]})"
              f"  force={round(c[9],2)} N")
else:
    print("  No contacts found yet -- continuing simulation...")

print()
print("==========================================")
print("Main simulation loop starting...")
print("==========================================")

# ==========================================
# 4. MAIN LOOP
# ==========================================
collision_count = 0
first_collision = True

for i in range(1000):
    p.stepSimulation()
    time.sleep(1. / 240.)

    all_contacts = p.getContactPoints()
    if not all_contacts:
        continue

    # Print ALL contacts at steps 1, 50, and 100 for diagnosis
    if i in [1, 50, 100]:
        print(f"\nStep {i} -- all contacts ({len(all_contacts)} total):")
        for c in all_contacts:
            print(f"  Body {c[1]} (link {c[3]}) vs Body {c[2]} (link {c[4]})"
                  f"  force={round(c[9],2)} N")

    # Check car vs car -- try all link combinations
    car_contacts = []
    for c in all_contacts:
        a, b = c[1], c[2]
        if (a == car1Id or a == car2Id) and (b == car1Id or b == car2Id):
            if a != b:  # exclude self-contact
                car_contacts.append(c)

    if car_contacts:
        collision_count += 1
        if first_collision:
            first_collision = False
            print(f"\n*** COLLISION DETECTED at step {i} ***")
            print(f"    Contact points : {len(car_contacts)}")
            for idx, c in enumerate(car_contacts):
                pos   = [round(v, 3) for v in c[5]]
                force = round(c[9], 4)
                print(f"    Contact {idx+1}: pos={pos}, force={force} N")

        elif collision_count % 200 == 0:
            print(f"    Still colliding -- step {i}, "
                  f"total collision steps: {collision_count}")

# ==========================================
# 5. SUMMARY
# ==========================================
print()
print("==========================================")
print(" Simulation Complete                      ")
print("==========================================")
print(f"Total steps               : 1000")
print(f"Steps with car collision  : {collision_count}")
print(f"Collision rate            : {round(collision_count / 10, 1)}%")
if collision_count > 0:
    print("Result: COLLISION DETECTED")
else:
    print("Result: No car vs car collision detected")
    print()
    print("Diagnosis: Check the contact body IDs printed above.")
    print("The car IDs are printed at the top. If the contacts show")
    print("different IDs, PyBullet is splitting the car into sub-bodies.")
print("==========================================")

p.disconnect()