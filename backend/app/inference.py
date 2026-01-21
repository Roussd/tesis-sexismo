# backend/app/inference.py
import os
import warnings
from dataclasses import dataclass
from typing import Tuple

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

warnings.filterwarnings("ignore")

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from transformers import logging as hf_logging

hf_logging.set_verbosity_error()


@dataclass(frozen=True)
class InferenceConfig:
    model_dir: str
    modo_texto: str = "both"   # "both" | "subject" | "body"
    max_length: int = 512


class SexismClassifier:
    def __init__(self, cfg: InferenceConfig):
        self.cfg = cfg
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        self.tokenizer = AutoTokenizer.from_pretrained(cfg.model_dir, use_fast=True)
        self.model = AutoModelForSequenceClassification.from_pretrained(cfg.model_dir).to(self.device)
        self.model.eval()

    def _format_email_text(self, subject: str, body: str) -> str:
        subject = "" if subject is None else str(subject)
        body = "" if body is None else str(body)

        if self.cfg.modo_texto == "both":
            return f"Asunto: {subject} [SEP] Cuerpo: {body}"
        if self.cfg.modo_texto == "subject":
            return f"Asunto: {subject}"
        if self.cfg.modo_texto == "body":
            return f"Cuerpo: {body}"
        raise ValueError("modo_texto debe ser: 'both', 'subject' o 'body'")

    @torch.no_grad()
    def predict(self, subject: str, body: str, threshold: float = 0.5) -> Tuple[int, float, float]:
        text = self._format_email_text(subject, body)

        enc = self.tokenizer(
            text,
            truncation=True,
            padding=True,
            max_length=self.cfg.max_length,
            return_tensors="pt",
        )
        enc = {k: v.to(self.device) for k, v in enc.items()}

        logits = self.model(**enc).logits
        probs = torch.softmax(logits, dim=-1).squeeze(0)

        p0 = float(probs[0].item())  # no sexismo
        p1 = float(probs[1].item())  # sexismo
        pred = 1 if p1 >= float(threshold) else 0

        return pred, p0, p1
