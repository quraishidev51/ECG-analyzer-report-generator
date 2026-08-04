from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


from app.model_loader import load_ecg_model
from app.predictor import predict_ecg
from app.report import create_report
from app.schemas import ECGRequest, PredictionResponse
from app.preprocessing import preprocess_ecg

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
        # 1. Run preprocessing here
        processed_array = preprocess_ecg(request.ecg_signal)

        # 2. Pass the preprocessed array to the predictor
        prediction = predict_ecg(model, processed_array)
        report = create_report(prediction)

        # 3. Return both the report and the processed signal as a list
        return {
            "report": report,
            "processed_signal": processed_array.tolist()
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    '''Here are the exact changes made to your main.py:

Cleaned up imports: Removed the duplicate from app.schemas import ECGRequest line and combined it into a single clean line: from app.schemas import ECGRequest, PredictionResponse.

Added preprocessing step: Inside the predict function, added the explicit line:

Python
processed_array = preprocess_ecg(request.ecg_signal)
Updated predictor call: Passed processed_array into your predict_ecg function instead of the raw request.ecg_signal.

Updated return statement: Added "processed_signal": processed_array.tolist() to the dictionary returned by the API so it matches your PredictionResponse schema and sends the clean data back to your frontend.'''