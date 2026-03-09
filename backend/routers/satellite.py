"""
satellite.py — Real Sentinel-2 NDVI via Copernicus Data Space Ecosystem
- GET  /api/satellite/token    → returns fresh WMS access token
- POST /api/satellite/ndvi     → real mean NDVI for a bounding box (Statistical API)
- GET  /api/satellite/history  → NDVI time series for a bbox (last 90 days)

Setup: add to Render env vars:
  COPERNICUS_CLIENT_ID     = your OAuth client_id
  COPERNICUS_CLIENT_SECRET = your OAuth client_secret
  COPERNICUS_INSTANCE_ID   = your WMS instance ID (from Configuration Utility)

Free account at: https://dataspace.copernicus.eu/
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os, time, httpx, logging

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Token cache ───────────────────────────────────────────────────────────────
_token_cache = {"token": None, "expires_at": 0}

COPERNICUS_TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
COPERNICUS_PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process"


async def get_access_token() -> Optional[str]:
    """Get cached or fresh OAuth2 token from Copernicus."""
    client_id     = os.getenv("COPERNICUS_CLIENT_ID")
    client_secret = os.getenv("COPERNICUS_CLIENT_SECRET")

    if not client_id or not client_secret:
        return None  # Keys not configured — frontend will use fallback

    # Return cached token if still valid (with 60s buffer)
    if _token_cache["token"] and time.time() < _token_cache["expires_at"] - 60:
        return _token_cache["token"]

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(COPERNICUS_TOKEN_URL, data={
                "grant_type":    "client_credentials",
                "client_id":     client_id,
                "client_secret": client_secret,
            })
            resp.raise_for_status()
            data = resp.json()
            _token_cache["token"]      = data["access_token"]
            _token_cache["expires_at"] = time.time() + data.get("expires_in", 3600)
            logger.info("✅ Copernicus token refreshed")
            return _token_cache["token"]
    except Exception as e:
        logger.error(f"Copernicus token error: {e}")
        return None


@router.get("/token")
async def get_wms_token():
    """Return WMS access token + instance ID for frontend map tiles."""
    token       = await get_access_token()
    instance_id = os.getenv("COPERNICUS_INSTANCE_ID", "")

    return {
        "configured": bool(token),
        "token":       token,
        "instance_id": instance_id,
        "wms_base":    f"https://sh.dataspace.copernicus.eu/ogc/wms/{instance_id}" if instance_id else None,
    }


# ── NDVI request models ───────────────────────────────────────────────────────
class NdviBboxRequest(BaseModel):
    min_lat: float
    min_lng: float
    max_lat: float
    max_lng: float
    date_from: Optional[str] = None   # ISO date, defaults to 30 days ago
    date_to:   Optional[str] = None   # ISO date, defaults to today


class NdviHistoryRequest(BaseModel):
    min_lat: float
    min_lng: float
    max_lat: float
    max_lng: float
    days: Optional[int] = 90


@router.post("/ndvi")
async def get_ndvi(req: NdviBboxRequest):
    """
    Fetch real mean NDVI for a bounding box using Sentinel Hub Statistical API.
    Returns mean NDVI and date of most recent cloud-free acquisition.
    """
    token = await get_access_token()
    if not token:
        raise HTTPException(503, "Copernicus API not configured. Add COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET to environment variables.")

    # Default date range: last 30 days
    import datetime
    today = datetime.date.today()
    date_to   = req.date_to   or today.isoformat()
    date_from = req.date_from or (today - datetime.timedelta(days=30)).isoformat()

    evalscript = """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "dataMask"] }],
    output: [
      { id: "ndvi", bands: 1 },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(samples) {
  return {
    ndvi: [index(samples.B08, samples.B04)],
    dataMask: [samples.dataMask]
  };
}
"""

    payload = {
        "input": {
            "bounds": {
                "bbox": [req.min_lng, req.min_lat, req.max_lng, req.max_lat],
                "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
            },
            "data": [{
                "dataFilter": {
                    "timeRange": {
                        "from": f"{date_from}T00:00:00Z",
                        "to":   f"{date_to}T23:59:59Z",
                    },
                    "maxCloudCoverage": 30,
                    "mosaickingOrder": "leastCC",
                },
                "type": "S2L2A"
            }]
        },
        "aggregation": {
            "timeRange": {
                "from": f"{date_from}T00:00:00Z",
                "to":   f"{date_to}T23:59:59Z",
            },
            "aggregationInterval": {"of": "P10D"},
            "evalscript": evalscript,
            "resx": 10,
            "resy": 10,
        },
        "calculations": {
            "ndvi": {
                "statistics": {
                    "default": {
                        "percentiles": {"k": [25, 50, 75]}
                    }
                }
            }
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://sh.dataspace.copernicus.eu/api/v1/statistics",
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        # Parse response — find most recent interval with valid data
        intervals = data.get("data", [])
        valid = [
            iv for iv in intervals
            if iv.get("outputs", {}).get("ndvi", {}).get("bands", {}).get("B0", {}).get("stats", {}).get("mean") is not None
            and iv["outputs"]["ndvi"]["bands"]["B0"]["stats"]["mean"] > -1
        ]

        if not valid:
            raise HTTPException(404, "No cloud-free Sentinel-2 images found for this area in the date range.")

        # Most recent valid interval
        latest = valid[-1]
        stats  = latest["outputs"]["ndvi"]["bands"]["B0"]["stats"]
        percs  = latest["outputs"]["ndvi"]["bands"]["B0"].get("percentiles", {})

        return {
            "ndvi_mean":   round(stats["mean"], 4),
            "ndvi_min":    round(stats["min"], 4),
            "ndvi_max":    round(stats["max"], 4),
            "ndvi_std":    round(stats.get("stDev", 0), 4),
            "ndvi_p25":    round(percs.get("25.0", stats["mean"] - 0.05), 4),
            "ndvi_p50":    round(percs.get("50.0", stats["mean"]), 4),
            "ndvi_p75":    round(percs.get("75.0", stats["mean"] + 0.05), 4),
            "date":        latest["interval"]["from"][:10],
            "pixel_count": stats.get("sampleCount", 0),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"NDVI fetch error: {e}")
        raise HTTPException(500, f"Failed to fetch NDVI data: {str(e)}")


@router.post("/ndvi-history")
async def get_ndvi_history(req: NdviHistoryRequest):
    """
    Fetch NDVI time series for a field (last N days, every 10 days).
    Returns list of {date, ndvi} for trend charts.
    """
    token = await get_access_token()
    if not token:
        raise HTTPException(503, "Copernicus API not configured.")

    import datetime
    today     = datetime.date.today()
    date_to   = today.isoformat()
    date_from = (today - datetime.timedelta(days=req.days)).isoformat()

    evalscript = """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "dataMask"] }],
    output: [{ id: "ndvi", bands: 1 }, { id: "dataMask", bands: 1 }]
  };
}
function evaluatePixel(samples) {
  return { ndvi: [index(samples.B08, samples.B04)], dataMask: [samples.dataMask] };
}
"""

    payload = {
        "input": {
            "bounds": {
                "bbox": [req.min_lng, req.min_lat, req.max_lng, req.max_lat],
                "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
            },
            "data": [{
                "dataFilter": {
                    "timeRange": {"from": f"{date_from}T00:00:00Z", "to": f"{date_to}T23:59:59Z"},
                    "maxCloudCoverage": 40,
                },
                "type": "S2L2A"
            }]
        },
        "aggregation": {
            "timeRange": {"from": f"{date_from}T00:00:00Z", "to": f"{date_to}T23:59:59Z"},
            "aggregationInterval": {"of": "P10D"},
            "evalscript": evalscript,
            "resx": 20, "resy": 20,
        },
        "calculations": {"ndvi": {"statistics": {"default": {}}}}
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://sh.dataspace.copernicus.eu/api/v1/statistics",
                json=payload,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()

        history = []
        for iv in data.get("data", []):
            mean = iv.get("outputs", {}).get("ndvi", {}).get("bands", {}).get("B0", {}).get("stats", {}).get("mean")
            if mean is not None and mean > -1:
                history.append({
                    "date": iv["interval"]["from"][:10],
                    "ndvi": round(mean, 4),
                })

        return {"history": history}

    except Exception as e:
        logger.error(f"NDVI history error: {e}")
        raise HTTPException(500, f"Failed to fetch NDVI history: {str(e)}")