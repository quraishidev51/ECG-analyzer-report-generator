#loading model from a given path
#gradcam check
from tensorflow.keras.models import load_model
from app.config import MODEL_PATH
from app.gradcam import create_grad_model
def load_ecg_model():
    model = load_model(MODEL_PATH)
    grad_model = create_grad_model(model)
    return model, grad_model