CLASS_NAMES = ["Conduction Disturbance","Hypertrophy","Myocardial Infarction","Normal","ST/T Change"]
def predict_ecg(model, ecg_signal, threshold = 0.5):
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
