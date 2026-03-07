"""
Logistics Router - Vendor locations and delivery tracking
"""

from fastapi import APIRouter
from typing import List

router = APIRouter()

# Mock vendor map locations in Punjab/Sindh Pakistan
VENDOR_LOCATIONS = [
    {"id": "V001", "name": "AgriMart Lahore", "lat": 31.5204, "lng": 74.3587, "city": "Lahore", "province": "Punjab", "rating": 4.7, "verified": True, "type": "pesticides"},
    {"id": "V002", "name": "Kissan Agro Store", "lat": 31.4181, "lng": 73.0794, "city": "Faisalabad", "province": "Punjab", "rating": 4.5, "verified": True, "type": "pesticides"},
    {"id": "V003", "name": "Green Fields Supplies", "lat": 30.1798, "lng": 71.4714, "city": "Multan", "province": "Punjab", "rating": 4.3, "verified": False, "type": "fertilizers"},
    {"id": "V004", "name": "Sindh Agri Hub", "lat": 25.3792, "lng": 68.3683, "city": "Hyderabad", "province": "Sindh", "rating": 4.6, "verified": True, "type": "pesticides"},
    {"id": "V005", "name": "Punjab Farm Center", "lat": 32.1877, "lng": 74.1945, "city": "Gujranwala", "province": "Punjab", "rating": 4.8, "verified": True, "type": "premium"},
    {"id": "V006", "name": "Sargodha Agri Mall", "lat": 32.0836, "lng": 72.6711, "city": "Sargodha", "province": "Punjab", "rating": 4.4, "verified": True, "type": "seeds"},
    {"id": "V007", "name": "Bahawalpur Farm Hub", "lat": 29.3961, "lng": 71.6836, "city": "Bahawalpur", "province": "Punjab", "rating": 4.2, "verified": True, "type": "fertilizers"},
    {"id": "V008", "name": "Karachi Agro Center", "lat": 24.8607, "lng": 67.0011, "city": "Karachi", "province": "Sindh", "rating": 4.5, "verified": True, "type": "pesticides"},
    {"id": "V009", "name": "Rawalpindi Seed Store", "lat": 33.5651, "lng": 73.0169, "city": "Rawalpindi", "province": "Punjab", "rating": 4.1, "verified": False, "type": "seeds"},
    {"id": "V010", "name": "Sahiwal Kisan Center", "lat": 30.6706, "lng": 73.1064, "city": "Sahiwal", "province": "Punjab", "rating": 4.6, "verified": True, "type": "pesticides"},
]

ACTIVE_DELIVERIES = [
    {"order_id": "ORD-00123", "vendor": "AgriMart Lahore", "product": "Chlorpyrifos 20EC", "status": "in_transit", "eta": "2 days", "lat": 31.45, "lng": 74.20},
    {"order_id": "ORD-00089", "vendor": "Kissan Agro Store", "product": "Urea Fertilizer", "status": "dispatched", "eta": "1 day", "lat": 31.38, "lng": 73.15},
]


@router.get("/vendors")
async def get_vendor_locations(province: str = None):
    """Get all vendor locations for map display"""
    vendors = VENDOR_LOCATIONS
    if province:
        vendors = [v for v in vendors if province.lower() in v["province"].lower()]
    return {"vendors": vendors, "total": len(vendors)}


@router.get("/deliveries")
async def get_active_deliveries():
    """Get active delivery tracking"""
    return {"deliveries": ACTIVE_DELIVERIES}


@router.get("/aggregation-zones")
async def get_aggregation_zones():
    """Farmer cooperative aggregation zones"""
    return {
        "zones": [
            {"id": "Z001", "name": "Central Punjab Zone", "lat": 31.0, "lng": 73.5, "farmers": 47, "radius_km": 50},
            {"id": "Z002", "name": "Southern Punjab Zone", "lat": 29.8, "lng": 71.8, "farmers": 32, "radius_km": 60},
            {"id": "Z003", "name": "Sindh Delta Zone", "lat": 25.5, "lng": 68.5, "farmers": 28, "radius_km": 45},
        ]
    }
