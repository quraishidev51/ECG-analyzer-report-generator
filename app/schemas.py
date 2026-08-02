from pydantic import BaseModel
class ECGRequest(BaseModel):
    ecg_signal : list[list[float]]

    
from typing import List

class Prediction(BaseModel):
    label: str
    confidence: float


class PredictionResponse(BaseModel):
    report: str