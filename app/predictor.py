import numpy as np
from app.config import CLASS_NAMES, DEFAULT_THRESHOLD


def predict_ecg(model, ecg_signal, threshold=DEFAULT_THRESHOLD):

    # Validate input shape
    if len(ecg_signal) != 1000:
        raise ValueError("ECG signal must have exactly 1000 samples.")

    if any(len(sample) != 12 for sample in ecg_signal):
        raise ValueError("Each ECG sample must have exactly 12 leads.")

    # Add batch dimension
    ecg_signal = np.expand_dims(ecg_signal, axis=0)

    # Run model prediction
    probs = model.predict(ecg_signal, verbose=0)[0]

    probabilities = {
        cls: float(prob)
        for cls, prob in zip(CLASS_NAMES, probs)
    }

    predictions = [
        {
            "label": cls,
            "confidence": float(prob)
        }
        for cls, prob in probabilities.items()
        if prob >= threshold
    ]

    return {
        "probabilities": probabilities,
        "predictions": predictions
    }