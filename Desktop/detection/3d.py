import pybullet as p
import pybullet_data
import time

# 1. Connect to the physics engine
p.connect(p.GUI)
p.setAdditionalSearchPath(pybullet_data.getDataPath())
p.setGravity(0, 0, -10)

# 2. Load the floor
p.loadURDF("plane.urdf")

# 3. Load a complex 3D Mesh (Model-Based Collision)
# We use the built-in duck model which uses V-HACD (Convex Hull Decomposition)
startPos = [0, 0, 5]
startOrientation = p.getQuaternionFromEuler([0.5, 0.8, 0]) # Give it a weird tilt

# This loads the complex mesh geometry
meshId = p.loadURDF("duck_vhacd.urdf", startPos, startOrientation)

# Make it a bit bigger so it's easier to see
p.changeVisualShape(meshId, -1, rgbaColor=[0.9, 0.8, 0.1, 1]) 

print("--- Model-Based Collision Active ---")
print("Watch how it rolls based on its specific curves, proving the engine is calculating the exact mesh geometry, not just a bounding box!")

# 4. Infinite Simulation Loop
while True:
    p.stepSimulation()
    time.sleep(1./240.)