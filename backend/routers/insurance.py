"""
Insurance Router - Parametric insurance triggers
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import random
from datetime import datetime, timedelta

router = APIRouter()


class InsuranceRequest(BaseModel):
    crop_type: str
    acres: float
    location: str
    disease_severity: str
    estimated_loss_pkr: float


@router.post("/assess")
async def assess_insurance(request: InsuranceRequest):
    """Assess parametric insurance eligibility and trigger"""
    # Parametric triggers based on severity
    triggers = {
        "mild": {"eligible": False, "reason": "Below minimum loss threshold"},
        "moderate": {"eligible": True, "payout_percent": 30},
        "severe": {"eligible": True, "payout_percent": 60},
        "critical": {"eligible": True, "payout_percent": 85},
    }

    trigger = triggers.get(request.disease_severity, {"eligible": False})
    payout_pkr = 0
    if trigger.get("eligible"):
        payout_pkr = request.estimated_loss_pkr * trigger["payout_percent"] / 100

    return {
        "eligible": trigger.get("eligible", False),
        "severity": request.disease_severity,
        "estimated_loss_pkr": request.estimated_loss_pkr,
        "payout_percent": trigger.get("payout_percent", 0),
        "estimated_payout_pkr": round(payout_pkr),
        "claim_id": f"CLM-{random.randint(10000, 99999)}",
        "processing_days": 3,
        "status": "pending_verification" if trigger.get("eligible") else "not_eligible",
        "message": "Insurance claim triggered automatically" if trigger.get("eligible") else "Loss below coverage threshold",
        "message_urdu": "انشورنس دعوی خودبخود شروع ہو گیا" if trigger.get("eligible") else "نقصان حد سے کم ہے",
        "weather_data": {
            "rainfall_mm": round(random.uniform(20, 80), 1),
            "temperature_c": round(random.uniform(28, 42), 1),
            "humidity_percent": round(random.uniform(40, 85), 1),
        }
    }


@router.get("/policies")
async def get_insurance_policies():
    """Available insurance policies"""
    return {
        "policies": [
            {
                "id": "POL001",
                "name": "Fasal Bima Basic",
                "name_urdu": "فصل بیمہ بیسک",
                "premium_per_acre_pkr": 800,
                "max_payout_per_acre_pkr": 30000,
                "covers": ["pest damage", "drought", "flood"],
                "min_severity": "moderate"
            },
            {
                "id": "POL002",
                "name": "Fasal Bima Premium",
                "name_urdu": "فصل بیمہ پریمیم",
                "premium_per_acre_pkr": 1500,
                "max_payout_per_acre_pkr": 60000,
                "covers": ["pest damage", "drought", "flood", "market price drop", "frost"],
                "min_severity": "mild"
            }
        ]
    }
