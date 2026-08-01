#loading model from a given path
from tensorflow.keras.models import load_model
from app.config import MODEL_PATH
def load_ecg_model():
    model = load_model(MODEL_PATH)
    return model
