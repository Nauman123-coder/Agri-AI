"""
Economics Router - Farm profitability analysis
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from services.economic_engine import economic_engine

router = APIRouter()


class FarmData(BaseModel):
    crop_type: str
    acres: float
    health_factor: float = 0.85


class MonteCarloRequest(BaseModel):
    crop_type: str
    acres: float
    disease_severity: str = "moderate"
    treatment_cost_per_acre: float = 3500


class PortfolioRequest(BaseModel):
    farms: List[FarmData]


@router.post("/monte-carlo")
async def run_monte_carlo(request: MonteCarloRequest):
    """Run Monte Carlo simulation for crop ROI"""
    result = economic_engine.run_monte_carlo(
        crop_type=request.crop_type,
        acres=request.acres,
        disease_severity=request.disease_severity,
        treatment_cost_per_acre=request.treatment_cost_per_acre,
    )
    return result


@router.post("/portfolio")
async def calculate_portfolio(request: PortfolioRequest):
    """Calculate net farm value across all crops"""
    farms_dict = [f.dict() for f in request.farms]
    result = economic_engine.calculate_net_farm_value(farms_dict)
    return result


@router.get("/demo-portfolio")
async def demo_portfolio():
    """Demo farm portfolio for dashboard"""
    demo_farms = [
        {"crop_type": "wheat", "acres": 5.0, "health_factor": 0.75},
        {"crop_type": "cotton", "acres": 3.0, "health_factor": 0.90},
        {"crop_type": "vegetables", "acres": 1.5, "health_factor": 0.85},
    ]
    return economic_engine.calculate_net_farm_value(demo_farms)
