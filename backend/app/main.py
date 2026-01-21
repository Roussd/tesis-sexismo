
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.inference import SexismClassifier, InferenceConfig
from app.schemas import PredictRequest, PredictResponse

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = str(BASE_DIR / "exp_12_roberta_573" / "checkpoint-406")

app = FastAPI(title="Inferencia Sexismo (RoBERTa)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = SexismClassifier(
    InferenceConfig(model_dir=MODEL_DIR, modo_texto="both", max_length=512)
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/predict", response_model=PredictResponse)
def predict(payload: PredictRequest):
    pred, p0, p1 = classifier.predict(
        subject=payload.subject,
        body=payload.body,
        threshold=payload.threshold,
    )
    return PredictResponse(pred=pred, p_no_sexismo=p0, p_sexismo=p1)
