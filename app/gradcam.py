#gradcam check
import tensorflow as tf
import numpy as np
from scipy.signal import resample


def create_grad_model(model):
    """
    Creates a Grad-CAM model that returns:
    1. Feature maps from the last convolutional layer
    2. Final predictions
    """

    grad_model = tf.keras.Model(
        inputs=model.inputs,
        outputs=[
            model.get_layer("multiply_1").output,
            model.output
        ]
    )

    return grad_model


def compute_gradcam(grad_model, signal, class_index=None):
    """
    Computes Grad-CAM for a single ECG.

    Parameters
    ----------
    grad_model : tf.keras.Model
        Model returned by create_grad_model()

    signal : np.ndarray
        Shape can be either:
        (1000, 12)
        or
        (1, 1000, 12)

    class_index : int or None
        Disease class to explain.
        If None, explains the highest predicted class.

    Returns
    -------
    cam : np.ndarray
        Shape: (1000,)
        Values normalized to [0,1]

    preds : np.ndarray
        Shape: (5,)
        Prediction probabilities
    """

    # Ensure numpy float32
    signal = np.asarray(signal, dtype=np.float32)

    # Add batch dimension if needed
    if signal.ndim == 2:
        signal = np.expand_dims(signal, axis=0)

    signal = tf.convert_to_tensor(signal)

    with tf.GradientTape() as tape:

        feature_maps, preds = grad_model(signal)

        if class_index is None:
            class_index = tf.argmax(preds[0])

        loss = preds[:, class_index]

    grads = tape.gradient(loss, feature_maps)

    # Global Average Pooling over time
    weights = tf.reduce_mean(grads, axis=1)

    # Weighted combination of feature maps
    cam = tf.reduce_sum(
        feature_maps * weights[:, None, :],
        axis=-1
    )

    cam = tf.nn.relu(cam)

    cam = cam[0].numpy()

    # Normalize
    cam = cam / (cam.max() + 1e-8)

    # Resize from 250 → 1000 samples
    cam = resample(cam, 1000)

    return cam.astype(np.float32), preds[0].numpy()