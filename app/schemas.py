from pydantic import BaseModel
from typing import List
class ECGRequest(BaseModel):
    ecg_signal : list[list[float]]


class Prediction(BaseModel):
    label: str
    confidence: float


class PredictionResponse(BaseModel):
    report: str
    processed_signal: List[List[float]]#frontend will send the ecg signal and backend will return the processed signal along with the report