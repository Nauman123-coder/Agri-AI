"""
Diagnosis Router - Crop Disease Detection via Grok Vision
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import base64
import logging

from services.grok_service import grok_client
from services.economic_engine import economic_engine

router = APIRouter()
logger = logging.getLogger(__name__)


class DiagnosisResult(BaseModel):
    disease_detected: bool
    disease_name: str
    disease_name_urdu: str
    confidence: float
    severity: str
    affected_percentage: float
    description: str
    immediate_actions: list
    recommended_pesticide: str
    recommended_pesticide_urdu: str
    quantity_per_acre: str
    estimated_loss_per_acre_pkr: float
    treatment_cost_per_acre_pkr: float
    recovery_probability: float
    urgency: str
    economic_analysis: dict


@router.post("/upload")
async def diagnose_crop(
    file: UploadFile = File(...),
    crop_type: str = Form(...),
    acres: float = Form(...),
    farmer_name: str = Form(default="Farmer"),
    location: str = Form(default="Punjab, Pakistan")
):
    """
    Upload crop photo for AI-powered disease diagnosis
    Powered by Grok Vision API
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files accepted")

    # Read and encode image
    image_data = await file.read()
    if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    image_base64 = base64.b64encode(image_data).decode("utf-8")

    logger.info(f"🔍 Diagnosing {crop_type} crop for {farmer_name} ({acres} acres) in {location}")

    # Call Grok Vision
    diagnosis = await grok_client.diagnose_crop_image(image_base64, crop_type, acres)

    # Run economic analysis based on diagnosis
    economic_analysis = {}
    if diagnosis.get("disease_detected"):
        economic_analysis = economic_engine.run_monte_carlo(
            crop_type=crop_type,
            acres=acres,
            disease_severity=diagnosis.get("severity", "moderate"),
            treatment_cost_per_acre=diagnosis.get("treatment_cost_per_acre_pkr", 3500),
        )

    diagnosis["economic_analysis"] = economic_analysis
    diagnosis["farmer_name"] = farmer_name
    diagnosis["location"] = location
    diagnosis["crop_type"] = crop_type
    diagnosis["acres"] = acres

    logger.info(f"✅ Diagnosis complete: {diagnosis.get('disease_name', 'No disease')}")
    return diagnosis


@router.post("/demo")
async def demo_diagnosis(crop_type: str = "wheat", acres: float = 5.0):
    """
    Demo diagnosis without image upload (uses mock data)
    """
    diagnosis = grok_client._mock_diagnosis(crop_type, acres)
    economic_analysis = economic_engine.run_monte_carlo(
        crop_type=crop_type,
        acres=acres,
        disease_severity=diagnosis.get("severity", "moderate"),
        treatment_cost_per_acre=diagnosis.get("treatment_cost_per_acre_pkr", 3500),
    )
    diagnosis["economic_analysis"] = economic_analysis
    diagnosis["crop_type"] = crop_type
    diagnosis["acres"] = acres
    return diagnosis
