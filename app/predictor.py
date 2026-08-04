import numpy as np
from app.config import CLASS_NAMES, DEFAULT_THRESHOLD

def predict_ecg(model, ecg_signal, threshold=DEFAULT_THRESHOLD):

    # Validate input shape
    if not isinstance(ecg_signal, np.ndarray):
        ecg_signal = np.array(ecg_signal)

    # If it's 1D, make it 2D (1000, 1)
    if ecg_signal.ndim == 1:
        ecg_signal = ecg_signal.reshape(-1, 1)

    # Add batch dimension
    ecg_signal = np.expand_dims(ecg_signal, axis=0)

    # Run model prediction
    probs = model.predict(ecg_signal, verbose=0)[0]

    probabilities = {
        cls: float(prob)
        for cls, prob in zip(CLASS_NAMES, probs)
    }

    predictions = [
        {"label": cls, "confidence": float(probs[i])}
        for i, cls in enumerate(CLASS_NAMES)
        if probs[i] >= threshold[i]
    ]

    return {
        "probabilities": probabilities,
        "predictions": predictions
    }