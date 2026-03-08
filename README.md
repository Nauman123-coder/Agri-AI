<div align="center">

# 🌾 KhetAI — کھیت اے آئی
### *Farm-to-Fork Autonomous Negotiator for Pakistani Farmers*

<br/>

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-Visit%20App-16a34a?style=for-the-badge)](https://agri-ai-ruby.vercel.app/landing.html)
[![Backend](https://img.shields.io/badge/⚙️%20API-Render-46e3b7?style=for-the-badge)](https://agri-ai-au37.onrender.com/docs)
[![GitHub](https://img.shields.io/badge/📁%20Source-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/Nauman123-coder/Agri-AI)

<br/>

*Empowering 8.3 million small-scale Pakistani farmers with AI-driven crop diagnosis, autonomous vendor negotiation, logistics mapping, and parametric insurance — all in one mobile-first app.*

<br/>

---

### 🌍 Built for Pakistan · اردو Support · Works in Rural Areas

---

</div>

<br/>

## ✨ What is KhetAI?

Pakistan's agricultural sector contributes **~21% of GDP** yet most small-scale farmers lack access to expert agronomic advice, fair market pricing, and timely crop protection. They lose thousands of rupees every season to preventable diseases, unfair vendor deals, and delayed treatments.

**KhetAI bridges that gap.** Take a photo of your crop → get an AI diagnosis in seconds → negotiate the best pesticide price autonomously → check insurance payout eligibility → find vendors on the map. All in Urdu and English, optimized for low-end Android devices.

<br/>

## 🚀 Live Demo

> **👉 [Try KhetAI Live →](https://agri-ai-ruby.vercel.app/landing.html)**

Upload any crop leaf photo and watch the AI detect disease, calculate economic loss, and recommend treatment — all within 3 seconds.

<br/>

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|-------|-----------|
| ![React](https://img.shields.io/badge/React_18-20232A?style=flat&logo=react&logoColor=61DAFB) | Component-based UI with hooks |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white) | Utility-first styling |
| ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat&logo=framer&logoColor=white) | Fluid animations & spring physics |
| ![TensorFlow](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=flat&logo=tensorflow&logoColor=white) | In-browser crop disease inference |
| ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white) | High-performance async Python API |
| ![Groq](https://img.shields.io/badge/Groq_LLM-F55036?style=flat&logo=groq&logoColor=white) | llama-3.3-70b streaming chat |
| ![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat&logo=sqlite&logoColor=white) | Lightweight farmer data storage |
| ![Leaflet](https://img.shields.io/badge/Leaflet.js-199900?style=flat&logo=leaflet&logoColor=white) | Interactive OSM vendor maps |
| ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white) | Frontend deployment |
| ![Render](https://img.shields.io/badge/Render-46E3B7?style=flat&logo=render&logoColor=white) | Backend deployment |

</div>

<br/>

## 🌟 Features

### 🔬 1. AI Crop Disease Detection
> *Powered by MobileNetV2 + PlantVillage dataset — runs 100% in your browser*

- **38 disease classes** across wheat, cotton, rice, vegetables, and more
- **97.66% validation accuracy** on PlantVillage benchmark
- Upload a photo → get diagnosis in **< 3 seconds** on any device
- Displays disease name in **English + Urdu** (e.g., "Late Blight / لیٹ بلائٹ")
- Full treatment protocol: pesticide name, quantity per acre, urgency level
- **No internet required for inference** — TF.js runs entirely in-browser

```
📸 Upload Photo → 🧠 TF.js Inference → 🦠 Disease Identified → 💊 Treatment Plan
```

---

### 🤖 2. Kisaan Expert AI Chatbot
> *Real-time streaming chat powered by Groq's llama-3.3-70b*

- Ask anything about your detected disease — in plain Urdu or English
- **Streaming responses** with live typing cursor
- Context-aware: knows your crop type, severity, field size, and pesticide
- Pakistan-specific advice: Punjab/Sindh climate patterns, local brands, mandi pricing
- Quick-tap questions: *"Why did this happen?" · "Is it contagious?" · "Organic alternatives?"*
- Agricultural-themed UI with wheat texture patterns and deep forest green palette

---

### 💰 3. Autonomous Vendor Negotiation
> *AI agent negotiates pesticide prices on your behalf*

- Scans multiple vendors across Punjab, Sindh, and KPK
- Runs multi-round negotiation — leveraging bulk discounts, urgency, and loyalty
- Shows full negotiation transcript (just like WhatsApp messages)
- **Average savings: 15–22%** vs. walk-in retail price
- Accepts deals with one tap — vendor contacts you within 24 hours

---

### 📊 4. Economic Analysis Engine
> *Monte Carlo simulation with 10,000 iterations*

- Calculates **Net Farm Value** across your entire crop portfolio
- Disease loss estimation: how much you lose without treatment
- ROI of treatment: is it worth spraying?
- P10/P50/P90 profit scenarios with probability distributions
- Recharts-powered visualizations with animated bar and line charts

---

### 🗺️ 5. Logistics & Vendor Map
> *Real OpenStreetMap data via Overpass API*

- Shows agri shops, pesticide vendors, and seed stores near you
- **16 major Pakistani cities** supported: Lahore, Karachi, Faisalabad, Multan, and more
- GPS-based "near me" detection
- Adjustable search radius (1km – 50km)
- Verified vendor badges, ratings, and distance markers

---

### 🛡️ 6. Parametric Crop Insurance
> *Automated payout based on disease severity threshold*

- **Parametric model**: no claim filing needed — triggers automatically
- Payout tiers: Mild (0%) · Moderate (50%) · Severe (75%) · Critical (90%)
- Policies: Basic Crop Shield (₨850/acre) · Premium Farm Guard (₨1800/acre)
- Instant claim ID generation and 3-day processing
- Weather data integration: rainfall, temperature, humidity

<br/>

## 🏗️ Project Structure

```
khetai/
├── 🖥️  frontend/                    # React 18 App
│   ├── public/
│   │   ├── tfjs_model/             # TensorFlow.js model (MobileNetV2)
│   │   │   ├── model.json
│   │   │   ├── group1-shard1of2.bin  (4.0 MB)
│   │   │   └── group1-shard2of2.bin  (1.7 MB)
│   │   ├── class_labels.json       # 38 PlantVillage disease classes
│   │   └── landing.html            # Marketing landing page
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.js        # Portfolio & market prices
│       │   ├── Diagnose.js         # Disease detection + chatbot
│       │   ├── Negotiate.js        # Vendor negotiation
│       │   ├── LogisticsMap.js     # OSM vendor map
│       │   └── Insurance.js        # Parametric insurance
│       └── utils/
│           ├── api.js              # API calls + mock fallbacks
│           └── voice.js            # Web Speech API (Urdu + English)
│
├── ⚙️  backend/                     # FastAPI Python App
│   ├── main.py                     # App entry point + CORS
│   ├── requirements.txt
│   ├── .python-version             # Python 3.11.9
│   ├── core/
│   │   ├── config.py               # Environment settings
│   │   └── database.py             # SQLAlchemy + SQLite
│   ├── routers/
│   │   ├── chat.py                 # 🤖 Groq streaming chat
│   │   ├── diagnose.py             # Disease diagnosis endpoint
│   │   ├── negotiate.py            # Vendor negotiation
│   │   ├── economics.py            # Monte Carlo simulation
│   │   ├── logistics.py            # Vendor location data
│   │   ├── insurance.py            # Parametric insurance
│   │   └── market.py               # Crop price feeds
│   └── services/
│       ├── grok_service.py         # Groq LLM client
│       └── economic_engine.py      # NumPy Monte Carlo
│
└── 📖  README.md
```

<br/>

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Groq API key — free at [console.groq.com](https://console.groq.com)

### 1. Clone the repo
```bash
git clone https://github.com/Nauman123-coder/Agri-AI.git
cd Agri-AI
```

### 2. Start the Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows Git Bash

pip install -r requirements.txt

# Create .env file
echo "GROQ_API_KEY=your_groq_key_here" > .env
echo "SECRET_KEY=any_random_string" >> .env
echo "DATABASE_URL=sqlite:///./khetai.db" >> .env

uvicorn main:app --reload --port 8000
```

### 3. Start the Frontend
```bash
cd frontend
npm install

echo "REACT_APP_API_URL=http://localhost:8000" > .env

npm start
```

### 4. Open in browser
```
http://localhost:3000
```

<br/>

## 🌐 Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | [agri-ai-ruby.vercel.app](https://agri-ai-ruby.vercel.app) |
| Backend API | Render | [agri-ai-au37.onrender.com](https://agri-ai-au37.onrender.com) |
| API Docs | Swagger UI | [/docs](https://agri-ai-au37.onrender.com/docs) |

### Environment Variables

**Vercel (Frontend):**
```
REACT_APP_API_URL = https://agri-ai-au37.onrender.com
```

**Render (Backend):**
```
GROQ_API_KEY     = your_groq_api_key
SECRET_KEY       = your_secret_key
DATABASE_URL     = sqlite:///./khetai.db
PYTHON_VERSION   = 3.11.9
```

<br/>

## 🧠 AI Model Details

| Property | Value |
|----------|-------|
| Architecture | MobileNetV2 (transfer learning) |
| Dataset | PlantVillage (54,306 images) |
| Classes | 38 disease categories |
| Validation Accuracy | **97.66%** |
| Input Size | 224 × 224 × 3 |
| Inference Engine | TensorFlow.js (in-browser) |
| Model Size | ~5.7 MB (2 shards) |
| Chat LLM | llama-3.3-70b-versatile via Groq |

**Pakistan-specific additions beyond PlantVillage:**
- Wheat Brown Rust (پتی کا زنگ)
- Wheat Yellow Rust (پیلا زنگ)
- Cotton Leaf Curl Virus (پتوں کا مڑنا)

<br/>

## 🗺️ Supported Cities

```
Punjab      →  Lahore · Faisalabad · Multan · Rawalpindi · Gujranwala · Sahiwal · Gujrat · Okara · Bahawalpur · Sargodha
Sindh       →  Karachi · Hyderabad · Sukkur · Larkana
KPK         →  Peshawar
Balochistan →  Quetta
```

<br/>

## 🤝 Contributing

Contributions are very welcome! Especially:

- 🌾 Adding more Pakistani crop diseases to the training dataset
- 🗣️ Improving Urdu NLP support and translations
- 📱 Offline PWA mode for areas with no internet connectivity
- 🏦 Integration with Kissan Package and government subsidy APIs
- 🌦️ Live weather API integration for disease risk forecasting

```bash
# Fork → Clone → Branch → PR
git checkout -b feature/your-feature-name
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
```

<br/>

## 📜 License

MIT License — free to use, modify, and distribute with attribution.

<br/>

## 👨‍💻 Author

Built with ❤️ for Pakistani farmers by **[Nauman](https://github.com/Nauman123-coder)**

> *"A healthy khet is a healthy economy — صحت مند کھیت، صحت مند معاشی"* 🌱

<br/>

---

<div align="center">

**⭐ Star this repo if KhetAI helped or inspired you!**

[![GitHub stars](https://img.shields.io/github/stars/Nauman123-coder/Agri-AI?style=social)](https://github.com/Nauman123-coder/Agri-AI)

*Made in 🇵🇰 Pakistan · Powered by AI · Built for Kisaans*

</div>
