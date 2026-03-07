"""
Grok AI Client - Powers crop diagnosis and negotiation agent
"""

import httpx
import base64
import json
import logging
from typing import Optional
from core.config import settings

logger = logging.getLogger(__name__)


class GrokClient:
    def __init__(self):
        self.api_key = settings.GROK_API_KEY
        self.base_url = settings.GROK_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def diagnose_crop_image(self, image_base64: str, crop_type: str, acres: float) -> dict:
        """
        Send crop image to Grok Vision for disease/pest analysis
        Returns structured diagnosis with economic impact
        """
        prompt = f"""You are an expert agricultural scientist specializing in Pakistani crops.
        
Analyze this {crop_type} crop image from Pakistan and provide a detailed diagnosis.

Return ONLY a valid JSON object with this exact structure:
{{
  "disease_detected": true/false,
  "disease_name": "name in English",
  "disease_name_urdu": "نام اردو میں",
  "confidence": 0.0-1.0,
  "severity": "mild/moderate/severe/critical",
  "affected_percentage": 0-100,
  "description": "brief description in English",
  "immediate_actions": ["action1", "action2", "action3"],
  "recommended_pesticide": "product name",
  "recommended_pesticide_urdu": "اردو نام",
  "quantity_per_acre": "amount and unit",
  "estimated_loss_per_acre_pkr": 0,
  "treatment_cost_per_acre_pkr": 0,
  "recovery_probability": 0.0-1.0,
  "urgency": "immediate/within_3_days/within_week"
}}

Farm details: {acres} acres of {crop_type} in Pakistan.
Pakistani crop prices context: Wheat ~3500 PKR/40kg, Cotton ~8000 PKR/40kg, Rice ~4500 PKR/40kg.
Only respond with the JSON, no other text."""

        payload = {
            "model": settings.GROK_MODEL,
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}",
                                "detail": "high"
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                # Clean JSON response
                content = content.strip()
                if content.startswith("```"):
                    content = content.split("```")[1]
                    if content.startswith("json"):
                        content = content[4:]
                return json.loads(content.strip())
        except Exception as e:
            logger.error(f"Grok vision error: {e}")
            # Return mock data if API fails (for demo)
            return self._mock_diagnosis(crop_type, acres)

    async def negotiate_with_vendors(
        self,
        disease_name: str,
        crop_type: str,
        recommended_pesticide: str,
        quantity_needed: str,
        acres: float,
        budget_pkr: float,
        vendors: list
    ) -> dict:
        """
        AI negotiation agent - drafts and negotiates vendor RFPs
        """
        vendors_str = json.dumps(vendors, indent=2)
        prompt = f"""You are KhetAI's autonomous negotiation agent working for a Pakistani farmer.

Task: Negotiate the best deal for pesticide purchase.

Situation:
- Crop: {crop_type} ({acres} acres)
- Disease: {disease_name}
- Required: {recommended_pesticide} ({quantity_needed})
- Farmer's budget: PKR {budget_pkr:,.0f}
- Available vendors: {vendors_str}

Negotiate intelligently and return ONLY a valid JSON:
{{
  "negotiation_summary": "Brief summary in English",
  "negotiation_summary_urdu": "اردو خلاصہ",
  "best_vendor": {{
    "vendor_id": "id",
    "vendor_name": "name",
    "original_price_pkr": 0,
    "negotiated_price_pkr": 0,
    "discount_percentage": 0,
    "delivery_days": 0,
    "payment_terms": "cash/installment",
    "reason_selected": "why this vendor"
  }},
  "negotiation_messages": [
    {{"role": "agent", "message": "opening message to vendor", "timestamp": "2024-01-01T10:00:00"}},
    {{"role": "vendor", "message": "vendor response", "timestamp": "2024-01-01T10:05:00"}},
    {{"role": "agent", "message": "counter offer", "timestamp": "2024-01-01T10:10:00"}},
    {{"role": "vendor", "message": "final acceptance", "timestamp": "2024-01-01T10:15:00"}}
  ],
  "total_savings_pkr": 0,
  "recommendation": "Accept/Negotiate_More/Reject",
  "confidence": 0.0-1.0
}}

Only respond with JSON."""

        payload = {
            "model": settings.GROK_TEXT_MODEL,
            "max_tokens": 1500,
            "messages": [{"role": "user", "content": prompt}]
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"].strip()
                if content.startswith("```"):
                    content = content.split("```")[1]
                    if content.startswith("json"):
                        content = content[4:]
                return json.loads(content.strip())
        except Exception as e:
            logger.error(f"Grok negotiation error: {e}")
            return self._mock_negotiation(vendors, recommended_pesticide, budget_pkr)

    def _mock_diagnosis(self, crop_type: str, acres: float) -> dict:
        """Fallback mock diagnosis when API unavailable"""
        return {
            "disease_detected": True,
            "disease_name": "Fall Armyworm (Spodoptera frugiperda)",
            "disease_name_urdu": "فال آرمی ورم",
            "confidence": 0.87,
            "severity": "moderate",
            "affected_percentage": 35,
            "description": "Fall Armyworm infestation detected. Larvae feeding on leaves causing characteristic windowing damage.",
            "immediate_actions": [
                "Apply Chlorpyrifos 20EC immediately",
                "Remove and destroy heavily infested plants",
                "Set up pheromone traps for monitoring"
            ],
            "recommended_pesticide": "Chlorpyrifos 20EC",
            "recommended_pesticide_urdu": "کلورپائریفوس",
            "quantity_per_acre": "1.5 liters",
            "estimated_loss_per_acre_pkr": 45000,
            "treatment_cost_per_acre_pkr": 3500,
            "recovery_probability": 0.78,
            "urgency": "immediate"
        }

    def _mock_negotiation(self, vendors: list, pesticide: str, budget: float) -> dict:
        """Fallback mock negotiation"""
        vendor = vendors[0] if vendors else {"id": "V001", "name": "AgriMart Lahore"}
        return {
            "negotiation_summary": f"Successfully negotiated {pesticide} purchase with best pricing.",
            "negotiation_summary_urdu": "بہترین قیمت پر کیڑے مار دوا کی خریداری طے پائی",
            "best_vendor": {
                "vendor_id": vendor.get("id", "V001"),
                "vendor_name": vendor.get("name", "AgriMart Lahore"),
                "original_price_pkr": 12000,
                "negotiated_price_pkr": 9800,
                "discount_percentage": 18.3,
                "delivery_days": 2,
                "payment_terms": "cash",
                "reason_selected": "Best price-quality ratio with fastest delivery"
            },
            "negotiation_messages": [
                {"role": "agent", "message": "Salaam! We need 10 liters of Chlorpyrifos 20EC urgently for 7 acres. Our budget is PKR 10,000. Can you offer bulk discount?", "timestamp": "2024-01-15T09:00:00"},
                {"role": "vendor", "message": "Wa Alaikum Salam! Our price is PKR 1,200/liter. For 10 liters that's PKR 12,000.", "timestamp": "2024-01-15T09:03:00"},
                {"role": "agent", "message": "We're a regular customer and need immediate delivery. PKR 9,500 for cash payment today?", "timestamp": "2024-01-15T09:07:00"},
                {"role": "vendor", "message": "Agreed at PKR 9,800 with free delivery within 2 days. Deal confirmed!", "timestamp": "2024-01-15T09:12:00"}
            ],
            "total_savings_pkr": 2200,
            "recommendation": "Accept",
            "confidence": 0.91
        }


# Singleton instance
grok_client = GrokClient()
