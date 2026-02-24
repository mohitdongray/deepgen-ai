import cv2
import os
import numpy as np
from ai.local_model import predict_frame, get_model_info

def test_local_model():
    """Test the local model with a sample image"""
    
    print("🧪 Testing Local AI Model...")
    
    # Check model info
    info = get_model_info()
    print(f"📊 Model Info: {info}")
    
    # Try to find a test image
    test_image_paths = [
        "test.jpg",
        "test.png", 
        "sample.jpg",
        "sample.png"
    ]
    
    test_image = None
    for path in test_image_paths:
        if os.path.exists(path):
            test_image = path
            break
    
    if test_image:
        print(f"🖼️ Using test image: {test_image}")
        
        # Load and test image
        img = cv2.imread(test_image)
        if img is not None:
            result = predict_frame(img)
            print(f"✅ Detected: {result}")
        else:
            print(f"❌ Failed to load image: {test_image}")
    else:
        print("⚠️ No test image found. Creating synthetic test...")
        
        # Create a synthetic test image
        synthetic_img = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        result = predict_frame(synthetic_img)
        print(f"✅ Synthetic test result: {result}")

if __name__ == "__main__":
    test_local_model()
