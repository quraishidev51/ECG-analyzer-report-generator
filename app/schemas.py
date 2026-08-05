#gradcam check
from pydantic import BaseModel
from typing import List


class ECGRequest(BaseModel):
    ecg_signal: List[List[float]]


class Prediction(BaseModel):
    label: str
    confidence: float


class PredictionResponse(BaseModel):
    report: str

    processed_signal: List[List[float]]

    heatmap: List[float]

    probabilities: List[float]