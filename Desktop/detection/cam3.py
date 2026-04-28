import pybullet as p
import pybullet_data
import time
import numpy as np
import cv2
import traceback  # This is the trap that prints the exact error

try:
    print("Starting simulation...")
    # 1. Connect and Load
    p.connect(p.GUI)
    p.setAdditionalSearchPath(pybullet_data.getDataPath())
    p.setGravity(0, 0, -10)
    p.loadURDF("plane.urdf")

    # Zoom in and drop the giant duck
    p.resetDebugVisualizerCamera(cameraDistance=4, cameraYaw=45, cameraPitch=-30, cameraTargetPosition=[0, 0, 0])
    meshId = p.loadURDF("duck_vhacd.urdf", [0, 0, 5], globalScaling=5)
    p.changeVisualShape(meshId, -1, rgbaColor=[0.9, 0.8, 0.1, 1]) 

    print("Letting the duck fall...")
    for _ in range(250):
        p.stepSimulation()
        time.sleep(1./240.)

    print("Snapping OpenCV photo now...")
    
    # 2. Camera Setup
    width = 640
    height = 480
    # Change this line in your Camera Setup:
    view_matrix = p.computeViewMatrix([0, -2, 1.5], [0, 0, 0], [0, 0, 1])
    proj_matrix = p.computeProjectionMatrixFOV(60, float(width)/height, 0.1, 100.0)
    
    images = p.getCameraImage(width, height, view_matrix, proj_matrix)

    print("Converting image data...")
    # 3. Bulletproof Image Conversion
    # We force it into a uint8 numpy array to prevent data-type crashes
    rgb_pixels = np.array(images[2], dtype=np.uint8)
    rgba_array = np.reshape(rgb_pixels, (height, width, 4))
    bgr_image = cv2.cvtColor(rgba_array, cv2.COLOR_RGBA2BGR)
    
    print("Saving to disk...")
    cv2.imwrite("synthetic_crash_data.png", bgr_image)
    
    print("\nSUCCESS: Photo saved! Entering infinite physics loop...")
    while p.isConnected():
        p.stepSimulation()
        time.sleep(1./240.)

# THE TRAP: If anything breaks above, it jumps down here instead of closing.
except Exception as e:
    print("\n" + "="*40)
    print("!!! THE SCRIPT CRASHED !!!")
    print("="*40)
    traceback.print_exc()  # Prints the exact line that failed
    print("="*40)
    
    # This prevents the terminal from auto-closing so you can actually read the error
    input("\nPress ENTER to close the window...")