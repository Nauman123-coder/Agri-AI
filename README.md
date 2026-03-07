# 🌾 KhetAI — Farm-to-Fork Autonomous Negotiator
### کھیت اے آئی — خودکار زرعی نظام

> AI-powered crop diagnosis, autonomous vendor negotiation, and parametric insurance for Pakistani farmers.

---

## ✅ What This System Does

1. **Farmer uploads crop photo** → Grok Vision AI detects disease/pest
2. **Economic engine** → Monte Carlo simulation calculates loss in PKR
3. **Negotiation agent** → AI autonomously negotiates best pesticide deal
4. **Logistics map** → Shows vendors across Punjab & Sindh
5. **Insurance** → Parametric triggers based on severity thresholds

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Framer Motion, Recharts, Leaflet |
| Backend | Python FastAPI, SQLAlchemy, SQLite (dev) / PostgreSQL (prod) |
| AI | Grok API (vision + negotiation agent) |
| Economic Engine | NumPy Monte Carlo simulations |
| Auth | JWT tokens |
| Maps | Leaflet.js with dark CartoDB tiles |
| Voice | Web Speech API (English + Urdu) |

---

## ⚡ Quick Start (Local Development)

### 1. Clone and Setup Backend

```bash
cd khetai/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GROK_API_KEY

# Start backend
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### 2. Setup Frontend

```bash
cd khetai/frontend

# Install dependencies
npm install

# Start frontend
npm start
```

Frontend runs at: http://localhost:3000

---

## 🔑 Environment Variables

Create `backend/.env`:
```env
GROK_API_KEY=your_grok_api_key_here
DATABASE_URL=sqlite:///./khetai.db
SECRET_KEY=your-secret-key-here
DEBUG=true
```

Get your Grok API key at: https://console.x.ai/

---

## 🚀 Free Deployment

### Frontend → Vercel
```bash
cd frontend
npm install -g vercel
vercel deploy
# Set REACT_APP_API_URL=https://your-backend.railway.app in Vercel dashboard
```

### Backend → Railway
```bash
cd backend
# Install Railway CLI: https://docs.railway.app/develop/cli
railway login
railway init
railway up
# Add environment variables in Railway dashboard
```

### Database → Supabase (PostgreSQL)
1. Create project at supabase.com
2. Copy connection string
3. Set DATABASE_URL in Railway dashboard

---

## 📱 Key Features

### 🔬 Crop Diagnosis
- Upload any crop photo
- Grok Vision AI identifies disease/pest
- Confidence score + severity rating
- Economic impact calculation (PKR)
- Immediate action recommendations

### 🤝 Vendor Negotiation
- AI agent contacts mock vendors
- Animated real-time negotiation chat
- Bulk discount negotiation
- One-tap deal confirmation
- Savings calculator

### 🗺️ Logistics Map
- 10 vendor locations (Punjab & Sindh)
- Dark map with colored markers by type
- Cooperative aggregation zones overlay
- Click vendors for details

### 🛡️ Insurance
- Parametric triggers (no manual inspection)
- Automatic based on disease severity
- Two policy tiers (Basic / Premium)
- Weather data integration
- Payout calculation

### 🔊 Voice / Urdu Support
- Web Speech API integration
- Diagnosis read-aloud (English + Urdu)
- Negotiation summary voice
- Urdu text labels throughout

---

## 📁 Project Structure

```
khetai/
├── backend/
│   ├── main.py              # FastAPI app entry
│   ├── requirements.txt
│   ├── .env.example
│   ├── core/
│   │   ├── config.py        # Settings & env vars
│   │   └── database.py      # SQLAlchemy setup
│   ├── routers/
│   │   ├── diagnose.py      # Crop diagnosis endpoint
│   │   ├── negotiate.py     # Vendor negotiation
│   │   ├── economics.py     # Monte Carlo engine
│   │   ├── logistics.py     # Map & delivery data
│   │   ├── insurance.py     # Parametric triggers
│   │   └── market.py        # Market prices
│   └── services/
│       ├── grok_service.py  # Grok AI client
│       └── economic_engine.py # NumPy simulations
│
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js            # Router + layout
        ├── index.css         # Tailwind + custom styles
        ├── pages/
        │   ├── Dashboard.js  # Farm overview
        │   ├── Diagnose.js   # AI diagnosis
        │   ├── Negotiate.js  # Chat negotiation
        │   ├── LogisticsMap.js # Leaflet map
        │   └── Insurance.js  # Parametric insurance
        └── utils/
            ├── api.js        # Axios API client
            └── voice.js      # Web Speech API
```

---

## 🧪 Test the System (No API Key Needed)

All features have demo modes that work without the Grok API:

1. **Dashboard** → Loads automatically with mock portfolio data
2. **Diagnose** → Click "Demo Diagnosis" without uploading any image
3. **Negotiate** → Click "Demo" button for pre-filled negotiation
4. **Map** → Always loads with mock vendor data
5. **Insurance** → Fill form and click "Assess" (uses mock triggers)

---

## 🌾 Crops Supported

| Crop | اردو | Price Reference |
|------|------|-----------------|
| Wheat | گندم | ₨3,800/maund |
| Cotton | کپاس | ₨8,500/maund |
| Rice | چاول | ₨4,800/maund |
| Sugarcane | گنا | ₨500/maund |
| Maize | مکئی | ₨2,700/maund |
| Vegetables | سبزیاں | ₨4,000/maund |

---

Built with ❤️ for Pakistan's small-scale farmers
کسانوں کی خوشحالی کے لیے
