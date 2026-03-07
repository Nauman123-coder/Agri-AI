"""
KhetAI Economic Reasoning Engine
Monte Carlo simulations for ROI/NPV analysis in PKR
"""

import numpy as np
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Pakistani crop market prices (PKR per 40kg maund - 2024)
CROP_PRICES_PKR = {
    "wheat": {"min": 3200, "max": 4200, "mean": 3800, "unit": "40kg"},
    "cotton": {"min": 7000, "max": 10000, "mean": 8500, "unit": "40kg"},
    "rice": {"min": 4000, "max": 6000, "mean": 4800, "unit": "40kg"},
    "sugarcane": {"min": 400, "max": 600, "mean": 500, "unit": "40kg"},
    "maize": {"min": 2200, "max": 3200, "mean": 2700, "unit": "40kg"},
    "vegetables": {"min": 2000, "max": 8000, "mean": 4000, "unit": "40kg"},
}

# Average yield per acre (maunds/acre)
YIELD_PER_ACRE = {
    "wheat": {"min": 25, "max": 45, "mean": 35},
    "cotton": {"min": 20, "max": 40, "mean": 30},
    "rice": {"min": 30, "max": 60, "mean": 45},
    "sugarcane": {"min": 600, "max": 900, "mean": 750},
    "maize": {"min": 40, "max": 70, "mean": 55},
    "vegetables": {"min": 80, "max": 150, "mean": 110},
}

# Input costs per acre (PKR)
INPUT_COSTS_PKR = {
    "wheat": {"seed": 2500, "fertilizer": 8000, "pesticide": 3000, "labor": 5000, "irrigation": 4000},
    "cotton": {"seed": 3500, "fertilizer": 12000, "pesticide": 8000, "labor": 10000, "irrigation": 6000},
    "rice": {"seed": 2000, "fertilizer": 10000, "pesticide": 5000, "labor": 8000, "irrigation": 8000},
    "sugarcane": {"seed": 5000, "fertilizer": 15000, "pesticide": 4000, "labor": 12000, "irrigation": 10000},
    "maize": {"seed": 3000, "fertilizer": 9000, "pesticide": 3500, "labor": 6000, "irrigation": 5000},
    "vegetables": {"seed": 4000, "fertilizer": 8000, "pesticide": 5000, "labor": 15000, "irrigation": 7000},
}


class EconomicEngine:

    def run_monte_carlo(
        self,
        crop_type: str,
        acres: float,
        disease_severity: str,
        treatment_cost_per_acre: float,
        simulations: int = 10000
    ) -> dict:
        """
        Monte Carlo simulation for farm profitability
        Returns NPV, ROI, and risk metrics in PKR
        """
        crop = crop_type.lower()
        if crop not in CROP_PRICES_PKR:
            crop = "wheat"

        prices = CROP_PRICES_PKR[crop]
        yields = YIELD_PER_ACRE[crop]
        costs = INPUT_COSTS_PKR[crop]

        # Severity multipliers for yield loss
        severity_loss = {
            "mild": 0.10,
            "moderate": 0.30,
            "severe": 0.55,
            "critical": 0.75
        }
        loss_factor = severity_loss.get(disease_severity, 0.30)

        np.random.seed(42)

        # Simulate price variability (normal distribution)
        sim_prices = np.random.normal(prices["mean"], (prices["max"] - prices["min"]) / 6, simulations)
        sim_prices = np.clip(sim_prices, prices["min"], prices["max"])

        # Simulate yield variability
        sim_yields = np.random.normal(yields["mean"], (yields["max"] - yields["min"]) / 6, simulations)
        sim_yields = np.clip(sim_yields, yields["min"], yields["max"])

        # WITHOUT treatment scenario
        loss_variability = np.random.uniform(loss_factor * 0.7, loss_factor * 1.3, simulations)
        affected_yields = sim_yields * (1 - loss_variability)
        gross_revenue_no_treat = affected_yields * sim_prices * acres
        total_input_cost = sum(costs.values()) * acres
        net_revenue_no_treat = gross_revenue_no_treat - total_input_cost

        # WITH treatment scenario
        recovery_factor = 1 - (loss_factor * 0.2)  # 80% recovery with treatment
        treated_yields = sim_yields * recovery_factor
        treatment_total = treatment_cost_per_acre * acres
        gross_revenue_treat = treated_yields * sim_prices * acres
        net_revenue_treat = gross_revenue_treat - total_input_cost - treatment_total

        # Key metrics
        expected_loss_no_treat = float(np.mean(net_revenue_no_treat))
        expected_profit_treat = float(np.mean(net_revenue_treat))
        treatment_roi = ((expected_profit_treat - expected_loss_no_treat) / treatment_total * 100) if treatment_total > 0 else 0

        # Value at Risk (5th percentile)
        var_95_no_treat = float(np.percentile(net_revenue_no_treat, 5))
        var_95_treat = float(np.percentile(net_revenue_treat, 5))

        # Probability of profit
        prob_profit_treat = float(np.mean(net_revenue_treat > 0))
        prob_profit_no_treat = float(np.mean(net_revenue_no_treat > 0))

        return {
            "crop_type": crop_type,
            "acres": acres,
            "simulations_run": simulations,
            "currency": "PKR",

            # Without treatment
            "scenario_no_treatment": {
                "expected_net_revenue_pkr": round(expected_loss_no_treat),
                "best_case_pkr": round(float(np.percentile(net_revenue_no_treat, 95))),
                "worst_case_pkr": round(var_95_no_treat),
                "probability_of_profit": round(prob_profit_no_treat * 100, 1),
                "estimated_yield_loss_maunds": round(float(np.mean(sim_yields * loss_factor)) * acres, 1),
            },

            # With treatment
            "scenario_with_treatment": {
                "treatment_cost_pkr": round(treatment_total),
                "expected_net_revenue_pkr": round(expected_profit_treat),
                "best_case_pkr": round(float(np.percentile(net_revenue_treat, 95))),
                "worst_case_pkr": round(var_95_treat),
                "probability_of_profit": round(prob_profit_treat * 100, 1),
                "treatment_roi_percent": round(treatment_roi, 1),
            },

            # Decision
            "net_benefit_of_treatment_pkr": round(expected_profit_treat - expected_loss_no_treat),
            "treat_recommended": expected_profit_treat > expected_loss_no_treat,
            "decision_confidence": round(prob_profit_treat * 100, 1),

            # Market context
            "market_price_pkr_per_maund": round(prices["mean"]),
            "expected_yield_per_acre_maunds": round(yields["mean"], 1),
            "total_input_cost_pkr": round(total_input_cost),
        }

    def calculate_net_farm_value(self, farms: list) -> dict:
        """
        Calculate total portfolio value across all farms
        """
        total_gross = 0
        total_cost = 0
        total_acres = 0
        breakdown = []

        for farm in farms:
            crop = farm.get("crop_type", "wheat").lower()
            acres = farm.get("acres", 1)
            health_factor = farm.get("health_factor", 0.85)

            if crop not in CROP_PRICES_PKR:
                crop = "wheat"

            prices = CROP_PRICES_PKR[crop]
            yields = YIELD_PER_ACRE[crop]
            costs = INPUT_COSTS_PKR[crop]

            gross = prices["mean"] * yields["mean"] * acres * health_factor
            cost = sum(costs.values()) * acres
            net = gross - cost

            total_gross += gross
            total_cost += cost
            total_acres += acres

            breakdown.append({
                "crop": crop,
                "acres": acres,
                "gross_revenue_pkr": round(gross),
                "costs_pkr": round(cost),
                "net_pkr": round(net),
                "health_factor": health_factor
            })

        return {
            "total_acres": total_acres,
            "total_gross_revenue_pkr": round(total_gross),
            "total_costs_pkr": round(total_cost),
            "net_farm_value_pkr": round(total_gross - total_cost),
            "average_profit_per_acre_pkr": round((total_gross - total_cost) / total_acres) if total_acres > 0 else 0,
            "breakdown": breakdown,
            "currency": "PKR"
        }

    def get_market_prices(self) -> list:
        """Return current market prices for dashboard"""
        import random
        prices = []
        for crop, data in CROP_PRICES_PKR.items():
            # Add slight random variation to simulate live prices
            variation = random.uniform(-0.05, 0.05)
            current = data["mean"] * (1 + variation)
            change_pct = variation * 100
            prices.append({
                "crop": crop.capitalize(),
                "crop_urdu": self._crop_urdu(crop),
                "price_pkr": round(current),
                "unit": data["unit"],
                "change_percent": round(change_pct, 2),
                "trend": "up" if change_pct > 0 else "down"
            })
        return prices

    def _crop_urdu(self, crop: str) -> str:
        names = {
            "wheat": "گندم",
            "cotton": "کپاس",
            "rice": "چاول",
            "sugarcane": "گنا",
            "maize": "مکئی",
            "vegetables": "سبزیاں"
        }
        return names.get(crop, crop)


# Singleton
economic_engine = EconomicEngine()
