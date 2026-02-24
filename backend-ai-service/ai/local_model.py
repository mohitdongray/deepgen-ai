from tensorflow.keras.models import load_model
import numpy as np
import cv2
import os

# Load the model (will be created when file is placed)
model_path = "models/video_brain.keras"

if os.path.exists(model_path):
    model = load_model(model_path)
    print(f"✅ Local model loaded: {model_path}")
else:
    print(f"⚠️ Model file not found: {model_path}")
    model = None

classes = [
    "ApplyLipstick",
    "HammerThrow", 
    "HorseRace",
    "StillRings",
    "VolleyballSpiking"
]

def predict_frame(frame):
    """
    Predict action/class from video frame using local Keras model
    
    Args:
        frame: OpenCV image (numpy array)
    
    Returns:
        str: Predicted class name
    """
    if model is None:
        return "model-not-loaded"
    
    try:
        # Model expects (20, 64, 64, 3) - sequence of 20 frames
        # For single frame, duplicate it 20 times
        frame = cv2.resize(frame, (64, 64))
        frame = frame / 255.0
        
        # Create sequence of 20 identical frames
        sequence = np.array([frame] * 20)  # Shape: (20, 64, 64, 3)
        sequence = np.expand_dims(sequence, axis=0)  # Shape: (1, 20, 64, 64, 3)
        
        # Make prediction
        prediction = model.predict(sequence)
        class_index = np.argmax(prediction)
        
        return classes[class_index]
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return "prediction-error"

def get_model_info():
    """Get information about the loaded model"""
    if model is None:
        return {"status": "not_loaded", "classes": classes}
    
    return {
        "status": "loaded",
        "classes": classes,
        "input_shape": model.input_shape,
        "output_shape": model.output_shape
    }
