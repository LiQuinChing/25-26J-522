from pydantic import BaseModel, Field
from typing import List, Optional

class ECGSignal(BaseModel):
    signal: List[float] = Field(..., description="ECG signal values")
    description: Optional[str] = Field(default="ECG signal")

class PredictionResponse(BaseModel):
    NSR: float
    Arrhythmia: float
    predicted_class: str
    confidence: float
    is_uncertain: Optional[bool] = False
    threshold: Optional[float] = 0.6
    signal_raw: Optional[List[float]] = None
    signal_normalized: Optional[List[float]] = None

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool