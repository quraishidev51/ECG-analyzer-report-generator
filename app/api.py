from fastapi import FastAPI

app = FastAPI(
    title="ECG Analyzer API",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "message": "ECG Analyzer API is running!"
    }
