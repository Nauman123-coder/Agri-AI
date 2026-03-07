"""
Market Router - Live market prices and trends
"""

from fastapi import APIRouter
from services.economic_engine import economic_engine
import random
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/prices")
async def get_market_prices():
    """Get current crop market prices in PKR"""
    return {"prices": economic_engine.get_market_prices(), "updated_at": datetime.now().isoformat()}


@router.get("/trends/{crop}")
async def get_price_trends(crop: str, days: int = 30):
    """Get historical price trend data for charts"""
    base_prices = {
        "wheat": 3800, "cotton": 8500, "rice": 4800,
        "sugarcane": 500, "maize": 2700, "vegetables": 4000
    }
    base = base_prices.get(crop.lower(), 3000)

    # Generate mock historical data
    dates = []
    prices = []
    current = base
    for i in range(days, 0, -1):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        change = random.uniform(-0.03, 0.03)
        current = current * (1 + change)
        current = max(base * 0.8, min(base * 1.2, current))
        dates.append(date)
        prices.append(round(current))

    return {
        "crop": crop,
        "currency": "PKR",
        "unit": "per 40kg (maund)",
        "dates": dates,
        "prices": prices,
        "current_price": prices[-1] if prices else base,
        "change_30d": round((prices[-1] - prices[0]) / prices[0] * 100, 2) if prices else 0
    }


@router.get("/alerts")
async def get_market_alerts():
    """Market alerts and advisories"""
    return {
        "alerts": [
            {
                "id": "A001",
                "type": "price_spike",
                "crop": "Cotton",
                "message": "Cotton prices up 8% this week due to export demand",
                "message_urdu": "برآمدی مانگ کی وجہ سے کپاس کی قیمتیں 8 فیصد بڑھ گئیں",
                "severity": "info",
                "date": datetime.now().isoformat()
            },
            {
                "id": "A002",
                "type": "weather",
                "crop": "Wheat",
                "message": "Fog advisory: Delay wheat harvesting by 3-4 days in Central Punjab",
                "message_urdu": "دھند کا انتباہ: وسطی پنجاب میں گندم کی کٹائی 3-4 دن مؤخر کریں",
                "severity": "warning",
                "date": datetime.now().isoformat()
            },
            {
                "id": "A003",
                "type": "disease",
                "crop": "Rice",
                "message": "Blast disease reported in Sheikhupura region - monitor crops",
                "message_urdu": "شیخوپورہ علاقے میں بلاسٹ بیماری رپورٹ - فصلوں کی نگرانی کریں",
                "severity": "danger",
                "date": datetime.now().isoformat()
            }
        ]
    }
