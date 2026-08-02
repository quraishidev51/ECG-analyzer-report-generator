from fastapi import FastAPI


from app.model_loader import load_ecg_model
from app.predictor import predict_ecg
from app.report import create_report
from app.schemas import ECGRequest

app = FastAPI(
    title="ECG Analyzer API",
    version="1.0.0"
)
#load the model
model = load_ecg_model()

@app.get("/")
def home():
    return {
        "message": "ECG Analyzer API is running!"
    }
@app.post("/predict")
def predict(request: ECGRequest):

    prediction = predict_ecg(model, request.ecg_signal)
    report = create_report(prediction)
    return {
        "report" : report
    }