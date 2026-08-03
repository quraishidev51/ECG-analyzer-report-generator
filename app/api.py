from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


from app.model_loader import load_ecg_model
from app.predictor import predict_ecg
from app.report import create_report
from app.schemas import ECGRequest
from app.schemas import ECGRequest, PredictionResponse

app = FastAPI(
    title="ECG Analyzer API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

#load the model
model = load_ecg_model()

@app.get("/")
def home():
    return {
        "message": "ECG Analyzer API is running!"
    }
@app.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Analyze ECG",
    description="Runs ECG classification and generates an AI report."
)
def predict(request: ECGRequest):

    try:
        prediction = predict_ecg(model, request.ecg_signal)
        report = create_report(prediction)

        return {
            "report": report
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))