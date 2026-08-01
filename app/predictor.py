import numpy as np
import tensorflow as tf
from app.config import CLASS_NAMES, DEFAULT_THRESHOLD
def predict_ecg(model, ecg_signal, threshold = DEFAULT_THRESHOLD):
      # Add batch dimension, example: X[0]5
    ecg_signal = np.expand_dims(ecg_signal, axis=0)

    probs = model.predict(ecg_signal, verbose=0)[0]

    probabilities = {
        cls: float(prob)
        for cls, prob in zip(CLASS_NAMES, probs)
    }

    predictions = [
        {
            "label": cls,
            "confidence" : float(prob)
        }
        for cls, prob in probabilities.items()
        if prob >= threshold
    ]

    return {
    "probabilities": probabilities,
    "predictions": predictions
}
