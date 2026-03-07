"""
Negotiation Router - Autonomous Vendor Negotiation Agent
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging

from services.grok_service import grok_client

router = APIRouter()
logger = logging.getLogger(__name__)

# Mock vendor database (Pakistan-based agri vendors)
MOCK_VENDORS = [
    {
        "id": "V001",
        "name": "AgriMart Lahore",
        "location": "Lahore, Punjab",
        "rating": 4.7,
        "price_multiplier": 1.0,
        "delivery_days": 2,
        "specialties": ["pesticides", "fertilizers", "seeds"],
        "phone": "+92-42-1234567",
        "verified": True,
    },
    {
        "id": "V002",
        "name": "Kissan Agro Store",
        "location": "Faisalabad, Punjab",
        "rating": 4.5,
        "price_multiplier": 0.92,
        "delivery_days": 3,
        "specialties": ["pesticides", "seeds"],
        "phone": "+92-41-9876543",
        "verified": True,
    },
    {
        "id": "V003",
        "name": "Green Fields Supplies",
        "location": "Multan, Punjab",
        "rating": 4.3,
        "price_multiplier": 0.88,
        "delivery_days": 4,
        "specialties": ["fertilizers", "pesticides", "equipment"],
        "phone": "+92-61-5551234",
        "verified": False,
    },
    {
        "id": "V004",
        "name": "Sindh Agri Hub",
        "location": "Hyderabad, Sindh",
        "rating": 4.6,
        "price_multiplier": 0.95,
        "delivery_days": 2,
        "specialties": ["pesticides", "irrigation"],
        "phone": "+92-22-3334567",
        "verified": True,
    },
    {
        "id": "V005",
        "name": "Punjab Farm Center",
        "location": "Gujranwala, Punjab",
        "rating": 4.8,
        "price_multiplier": 1.05,
        "delivery_days": 1,
        "specialties": ["premium pesticides", "seeds", "advisory"],
        "phone": "+92-55-7778901",
        "verified": True,
    },
]

# Pesticide base prices (PKR)
PESTICIDE_PRICES = {
    "Chlorpyrifos 20EC": 1200,
    "Imidacloprid 70WS": 1800,
    "Lambda-cyhalothrin": 2200,
    "Cypermethrin 10EC": 900,
    "Profenofos 40EC": 1500,
    "Emamectin Benzoate": 2800,
    "Thiamethoxam 25WG": 3200,
    "Deltamethrin 2.5EC": 1100,
}


class NegotiationRequest(BaseModel):
    disease_name: str
    crop_type: str
    recommended_pesticide: str
    quantity_per_acre: str
    acres: float
    budget_pkr: Optional[float] = None
    farmer_location: str = "Punjab, Pakistan"


class AcceptDealRequest(BaseModel):
    negotiation_id: str
    vendor_id: str
    agreed_price_pkr: float
    farmer_name: str


@router.post("/start")
async def start_negotiation(request: NegotiationRequest):
    """
    Start autonomous negotiation with vendors
    AI agent negotiates best price for required pesticide
    """
    # Calculate quantities needed
    quantity_str = request.quantity_per_acre  # e.g. "1.5 liters"
    try:
        qty_value = float(quantity_str.split()[0])
        qty_unit = quantity_str.split()[1] if len(quantity_str.split()) > 1 else "liters"
        total_qty = qty_value * request.acres
    except:
        total_qty = request.acres * 1.5
        qty_unit = "liters"

    # Get base price for pesticide
    base_price = PESTICIDE_PRICES.get(
        request.recommended_pesticide,
        1500  # default
    )

    # Set budget if not provided (15% above minimum viable)
    if not request.budget_pkr:
        request.budget_pkr = base_price * total_qty * 1.15

    # Build vendor offers with their pricing
    vendor_offers = []
    for vendor in MOCK_VENDORS:
        vendor_price = base_price * vendor["price_multiplier"]
        total_cost = vendor_price * total_qty
        vendor_offers.append({
            **vendor,
            "price_per_unit_pkr": round(vendor_price),
            "total_cost_pkr": round(total_cost),
            "quantity": f"{total_qty:.1f} {qty_unit}",
        })

    logger.info(f"🤝 Starting negotiation for {request.recommended_pesticide} - {total_qty:.1f} {qty_unit}")

    # AI negotiation agent
    result = await grok_client.negotiate_with_vendors(
        disease_name=request.disease_name,
        crop_type=request.crop_type,
        recommended_pesticide=request.recommended_pesticide,
        quantity_needed=f"{total_qty:.1f} {qty_unit}",
        acres=request.acres,
        budget_pkr=request.budget_pkr,
        vendors=vendor_offers[:3]  # Top 3 vendors
    )

    result["all_vendors"] = vendor_offers
    result["product_needed"] = request.recommended_pesticide
    result["total_quantity"] = f"{total_qty:.1f} {qty_unit}"
    result["farmer_budget_pkr"] = request.budget_pkr
    result["negotiation_id"] = f"NEG-{hash(request.disease_name + request.crop_type) % 100000:05d}"

    return result


@router.get("/vendors")
async def get_vendors(location: str = "Punjab"):
    """Get list of available vendors"""
    filtered = [v for v in MOCK_VENDORS if location.lower() in v["location"].lower()]
    return {"vendors": filtered if filtered else MOCK_VENDORS, "total": len(MOCK_VENDORS)}


@router.post("/accept")
async def accept_deal(request: AcceptDealRequest):
    """Accept negotiated deal and trigger logistics"""
    vendor = next((v for v in MOCK_VENDORS if v["id"] == request.vendor_id), None)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    return {
        "status": "confirmed",
        "order_id": f"ORD-{hash(request.negotiation_id) % 100000:05d}",
        "message": "Order confirmed! Vendor notified.",
        "message_urdu": "آرڈر کی تصدیق ہو گئی! دکاندار کو اطلاع دے دی گئی۔",
        "vendor_name": vendor["name"],
        "agreed_price_pkr": request.agreed_price_pkr,
        "estimated_delivery": f"{vendor['delivery_days']} business days",
        "next_steps": [
            "Payment confirmation required",
            "Vendor will dispatch within 24 hours",
            "Track delivery in Logistics tab"
        ]
    }
