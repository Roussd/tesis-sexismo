from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    subject: str = Field(default="")
    body: str = Field(default="")
    threshold: float = Field(default=0.5, ge=0.0, le=1.0)

class PredictResponse(BaseModel):
    pred: int
    p_no_sexismo: float
    p_sexismo: float
