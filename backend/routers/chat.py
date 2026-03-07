

# main.py - add these lines right at the beginning
from dotenv import load_dotenv
import os

# Load .env from the same directory as main.py (backend folder)
load_dotenv()  # defaults to looking for .env in current working dir

# Optional debug print - keep this temporarily to confirm
print("Loaded GROQ_API_KEY:", os.getenv("GROQ_API_KEY") is not None)
print("Current working dir:", os.getcwd())

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    disease_name: str
    disease_name_urdu: str
    crop_type: str
    severity: str
    recommended_pesticide: str
    acres: float

@router.post("/chat")
async def crop_chat(req: ChatRequest):
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    system = f"""You are KhetAI's expert crop disease advisor helping Pakistani farmers. You are knowledgeable, warm, and practical.

Current Diagnosis:
- Disease: {req.disease_name} ({req.disease_name_urdu})
- Crop: {req.crop_type}
- Severity: {req.severity}
- Recommended Treatment: {req.recommended_pesticide}
- Field Size: {req.acres} acres

RESPONSE STYLE RULES:
- Use markdown formatting: **bold** for key terms, bullet points for lists
- Structure longer answers with clear sections
- Use emoji occasionally to make responses friendly (🌱 🌾 💧 ⚠️ ✅)
- Occasionally use Urdu farming words naturally (kisaan, khet, fasal, mitti, pani)
- Mention Pakistan-specific context: Punjab/Sindh climate, local brands, mandi prices

CONTENT RULES:
1. For "why" questions: Explain the biological/environmental cause clearly, mention Pakistan-specific triggers (humidity, irrigation practices, season)
2. For "prevention" questions: Give 4-5 concrete, actionable steps with timing
3. For "resistance" questions: Cover soil health, variety selection, crop rotation specific to Pakistani farming
4. For "organic" questions: Mention locally available organic options (neem, garlic spray, compost)
5. Always end with an encouraging note for the kisaan

Give thorough, expert answers. Farmers depend on this advice for their livelihood — be comprehensive."""

    def stream_response():
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=800,
            stream=True,
            messages=[
                {"role": "system", "content": system},
                *[{"role": m.role, "content": m.content} for m in req.messages],
            ],
        )
        for chunk in completion:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    return StreamingResponse(stream_response(), media_type="text/plain")