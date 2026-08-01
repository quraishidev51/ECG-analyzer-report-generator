#loading model from a given path
from tensorflow.keras.models import load_model

def load_ecg_model(model_path):
    model = load_model(model_path)
    return model
