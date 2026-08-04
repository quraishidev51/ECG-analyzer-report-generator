import numpy as np
from scipy.signal import butter, filtfilt


def highpass_filter(ecg, cutoff=0.5, fs=100, order=4):
    """
    Remove baseline wander from ECG.
    
    ecg shape:
    (1000, 12)
    """

    nyquist = 0.5 * fs
    normal_cutoff = cutoff / nyquist

    b, a = butter(
        order,
        normal_cutoff,
        btype="high",
        analog=False
    )

    filtered = filtfilt(
        b,
        a,
        ecg,
        axis=0
    )

    return filtered


def normalize_ecg(ecg):
    """
    Per-lead z-score normalization
    """

    mean = np.mean(
        ecg,
        axis=0,
        keepdims=True
    )

    std = np.std(
        ecg,
        axis=0,
        keepdims=True
    )

    return (ecg - mean) / (std + 1e-8)


def preprocess_ecg(ecg):
    ecg = np.array(ecg, dtype=np.float32)

    ecg = highpass_filter(ecg)

    ecg = normalize_ecg(ecg)

    return ecg