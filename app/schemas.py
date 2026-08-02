from pydantic import BaseModel
class ECGRequest(BaseModel):
    ecg_signal : list[list[float]]