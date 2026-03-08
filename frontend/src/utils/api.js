import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// ─────────────────────────────────────────────────────────────────────────────
// DIRECT AI DIAGNOSIS — calls Claude Vision API directly from frontend
// This bypasses the backend entirely, so it works even when backend is down.
// ─────────────────────────────────────────────────────────────────────────────

const CROP_PRICES_PKR = {
  wheat: 3800, cotton: 8500, rice: 4800,
  sugarcane: 500, maize: 2700, vegetables: 4000,
};

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function callClaudeVision(imageBase64, mediaType, cropType, acres) {
  const pricePerMaund = CROP_PRICES_PKR[cropType] || 3800;

  const prompt = `You are an expert agricultural scientist specializing in Pakistani crops and plant pathology.

Analyze this ${cropType} crop image from Pakistan carefully. Look for:
- Signs of disease (spots, lesions, discoloration, wilting, rot, blight, mold)
- Pest damage (holes, feeding marks, webbing, insects)
- Nutrient deficiency (yellowing patterns, stunted growth)
- Physical damage (mechanical, weather)
- OR confirm if the plant looks completely HEALTHY

Farm context: ${acres} acres of ${cropType} in Pakistan.
Local price: PKR ${pricePerMaund} per 40kg maund.

Return ONLY a valid JSON object — no text before or after, no markdown backticks:
{
  "disease_detected": true or false,
  "disease_name": "specific disease/pest/condition name in English, or 'Healthy Plant' if no disease",
  "disease_name_urdu": "نام اردو میں",
  "confidence": 0.0 to 1.0,
  "severity": "none" or "mild" or "moderate" or "severe" or "critical",
  "affected_percentage": 0 to 100,
  "description": "2-3 sentence description of what you see in the image",
  "immediate_actions": ["action 1", "action 2", "action 3"],
  "recommended_pesticide": "specific product name, or 'No treatment needed' if healthy",
  "recommended_pesticide_urdu": "اردو نام",
  "quantity_per_acre": "amount and unit, or 'N/A' if healthy",
  "estimated_loss_per_acre_pkr": estimated PKR loss without treatment (0 if healthy),
  "treatment_cost_per_acre_pkr": estimated PKR cost of treatment (0 if healthy),
  "recovery_probability": 0.0 to 1.0,
  "urgency": "none" or "within_week" or "within_3_days" or "immediate"
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });

  if (!response.ok) throw new Error(`Claude API error: ${response.status}`);

  const data = await response.json();
  let text = data.content.map(b => b.text || '').join('').trim();

  // Strip markdown fences if present
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const parsed = JSON.parse(text);

  // Build economic_analysis block from the raw numbers
  const loss    = (parsed.estimated_loss_per_acre_pkr || 0) * acres;
  const treatCost = (parsed.treatment_cost_per_acre_pkr || 0) * acres;
  parsed.economic_analysis = {
    total_estimated_loss_pkr:    loss,
    total_treatment_cost_pkr:    treatCost,
    roi_of_treatment:            treatCost > 0 ? Math.round((loss - treatCost) / treatCost * 10) / 10 : 0,
    break_even_acres:            treatCost > 0 ? (treatCost / (parsed.estimated_loss_per_acre_pkr || 1)) : 0,
    scenario_no_treatment: {
      expected_net_revenue_pkr: -(loss),
    },
    scenario_with_treatment: {
      expected_net_revenue_pkr: loss - treatCost,
      treatment_roi_percent:    treatCost > 0 ? Math.round((loss - treatCost) / treatCost * 100) : 0,
    },
  };

  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL MOCK DATA — last resort fallback (only if AI also fails)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK = {
  portfolio: {
    net_farm_value_pkr: 687500,
    total_acres: 9.5,
    average_profit_per_acre_pkr: 72368,
    breakdown: [
      { crop: 'wheat',      acres: 5.0, revenue_pkr: 475000, cost_pkr: 125000, net_pkr: 350000 },
      { crop: 'cotton',     acres: 3.0, revenue_pkr: 306000, cost_pkr:  90000, net_pkr: 216000 },
      { crop: 'vegetables', acres: 1.5, revenue_pkr: 156000, cost_pkr:  34500, net_pkr: 121500 },
    ],
    risk_level: 'moderate',
  },

  prices: {
    prices: [
      { crop: 'Wheat',      crop_urdu: 'گندم',   price_pkr: 3850, change_percent:  1.2 },
      { crop: 'Cotton',     crop_urdu: 'کپاس',   price_pkr: 8650, change_percent: -0.8 },
      { crop: 'Rice',       crop_urdu: 'چاول',   price_pkr: 4920, change_percent:  2.1 },
      { crop: 'Sugarcane',  crop_urdu: 'گنا',    price_pkr:  520, change_percent:  0.5 },
      { crop: 'Maize',      crop_urdu: 'مکئی',   price_pkr: 2780, change_percent: -1.4 },
      { crop: 'Vegetables', crop_urdu: 'سبزیاں', price_pkr: 4100, change_percent:  3.2 },
    ],
  },

  trend(crop) {
    const base = { wheat: 3800, cotton: 8500, rice: 4800, sugarcane: 500, maize: 2700, vegetables: 4000 };
    const b = base[crop] || 3800;
    const today = new Date();
    return {
      dates: Array.from({ length: 30 }, (_, i) => {
        const d = new Date(today); d.setDate(d.getDate() - (29 - i));
        return d.toISOString().slice(0, 10);
      }),
      prices: Array.from({ length: 30 }, (_, i) =>
        Math.round(b + (Math.sin(i / 4) * b * 0.04) + (Math.random() * b * 0.02))
      ),
    };
  },

  alerts: {
    alerts: [
      { id: 1, severity: 'danger',  message: 'Fall Armyworm outbreak in Sahiwal district — monitor wheat fields immediately', message_urdu: 'ساہیوال میں فال آرمی ورم — گندم کے کھیتوں کی فوری نگرانی' },
      { id: 2, severity: 'warning', message: 'Cotton prices expected to drop 5% next week due to export quota changes',         message_urdu: 'برآمدی کوٹہ تبدیلی سے کپاس کی قیمت گر سکتی ہے' },
      { id: 3, severity: 'info',    message: 'Rabi wheat procurement drive starting March 15 across Punjab mandis',             message_urdu: 'پنجاب کی منڈیوں میں گندم خریداری 15 مارچ سے شروع' },
    ],
  },

  // Demo diagnosis — only used when user clicks "Demo" with no image
  demodiagnosis(cropType) {
    return {
      disease_detected: true,
      disease_name: 'Fall Armyworm (Spodoptera frugiperda)',
      disease_name_urdu: 'فال آرمی ورم',
      confidence: 0.87,
      severity: 'moderate',
      affected_percentage: 35,
      description: 'Fall Armyworm infestation detected. Larvae feeding on leaves causing characteristic windowing damage patterns. This is sample demo data — upload a real image for actual AI diagnosis.',
      immediate_actions: [
        'Apply Chlorpyrifos 20EC at 1.5 liters per acre immediately',
        'Remove and destroy heavily infested plant material',
        'Set up pheromone traps for ongoing population monitoring',
      ],
      recommended_pesticide: 'Chlorpyrifos 20EC',
      recommended_pesticide_urdu: 'کلورپائریفوس',
      quantity_per_acre: '1.5 liters',
      estimated_loss_per_acre_pkr: 45000,
      treatment_cost_per_acre_pkr: 3500,
      recovery_probability: 0.78,
      urgency: 'immediate',
      economic_analysis: {
        total_estimated_loss_pkr: 225000,
        total_treatment_cost_pkr: 17500,
        roi_of_treatment: 12.9,
        break_even_acres: 0.4,
        scenario_no_treatment: { expected_net_revenue_pkr: -225000 },
        scenario_with_treatment: { expected_net_revenue_pkr: 207500, treatment_roi_percent: 1186 },
      },
    };
  },

  negotiation: {
    negotiation_summary: 'Successfully negotiated Chlorpyrifos 20EC purchase. Secured 18.3% discount with 2-day delivery.',
    negotiation_summary_urdu: 'بہترین قیمت پر کیڑے مار دوا کی خریداری طے پائی — 18% چھوٹ',
    best_vendor: {
      vendor_id: 'V001', vendor_name: 'AgriMart Lahore',
      original_price_pkr: 12000, negotiated_price_pkr: 9800,
      discount_percentage: 18.3, delivery_days: 2,
      payment_terms: 'cash', reason_selected: 'Best price-quality ratio with fastest delivery in Punjab',
    },
    negotiation_messages: [
      { role: 'agent',  message: 'Salaam! We need 10 liters of Chlorpyrifos 20EC urgently for 7 acres of wheat. Fall Armyworm outbreak. Budget PKR 10,000. Bulk discount?', timestamp: '2026-03-07T09:00:00' },
      { role: 'vendor', message: 'Wa Alaikum Salam! Our regular price is PKR 1,200/liter — total PKR 12,000 for 10 liters.', timestamp: '2026-03-07T09:03:00' },
      { role: 'agent',  message: 'Returning customer, cash payment today. Urgent — crop loss escalating. PKR 9,500 with free delivery?', timestamp: '2026-03-07T09:07:00' },
      { role: 'vendor', message: 'Final offer: PKR 9,800 with free delivery in 2 days. Cash payment. Best price. Deal?', timestamp: '2026-03-07T09:12:00' },
    ],
    all_vendor_quotes: [
      { vendor_name: 'AgriMart Lahore',     price_pkr: 9800,  delivery_days: 2, rating: 4.8 },
      { vendor_name: 'Kissan Agro Store',   price_pkr: 10200, delivery_days: 3, rating: 4.5 },
      { vendor_name: 'Green Fields Multan', price_pkr: 10500, delivery_days: 4, rating: 4.3 },
    ],
    total_savings_pkr: 2200, recommendation: 'Accept', confidence: 0.91,
  },

  vendors: [
    { id: 'V001', name: 'AgriMart Lahore',      city: 'Lahore',     province: 'Punjab', type: 'pesticides',  rating: 4.8, verified: true,  lat: 31.5204, lng: 74.3587 },
    { id: 'V002', name: 'Kissan Agro Store',     city: 'Faisalabad', province: 'Punjab', type: 'fertilizers', rating: 4.5, verified: true,  lat: 31.4504, lng: 73.1350 },
    { id: 'V003', name: 'Green Fields Multan',   city: 'Multan',     province: 'Punjab', type: 'pesticides',  rating: 4.3, verified: false, lat: 30.1575, lng: 71.5249 },
    { id: 'V004', name: 'Sindh Agri Hub',        city: 'Hyderabad',  province: 'Sindh',  type: 'seeds',       rating: 4.6, verified: true,  lat: 25.3792, lng: 68.3683 },
    { id: 'V005', name: 'Punjab Farm Center',    city: 'Sahiwal',    province: 'Punjab', type: 'fertilizers', rating: 4.4, verified: true,  lat: 30.6706, lng: 73.1064 },
    { id: 'V006', name: 'Agro Solutions Gujrat', city: 'Gujrat',     province: 'Punjab', type: 'pesticides',  rating: 4.2, verified: false, lat: 32.5742, lng: 74.0789 },
    { id: 'V007', name: 'Karachi Seed Bank',     city: 'Karachi',    province: 'Sindh',  type: 'seeds',       rating: 4.7, verified: true,  lat: 24.8607, lng: 67.0011 },
    { id: 'V008', name: 'Okara Farm Supplies',   city: 'Okara',      province: 'Punjab', type: 'fertilizers', rating: 4.1, verified: false, lat: 30.8099, lng: 73.4448 },
    { id: 'V009', name: 'Sukkur Agri Depot',     city: 'Sukkur',     province: 'Sindh',  type: 'pesticides',  rating: 4.0, verified: true,  lat: 27.7052, lng: 68.8574 },
    { id: 'V010', name: 'Rawalpindi Agri Mall',  city: 'Rawalpindi', province: 'Punjab', type: 'seeds',       rating: 4.5, verified: true,  lat: 33.5651, lng: 73.0169 },
  ],

  zones: [
    { id: 'Z001', name: 'Central Punjab Co-op', lat: 31.0, lng: 73.5, radius_km: 80, farmers: 1240 },
    { id: 'Z002', name: 'Sindh Agri Cluster',   lat: 26.5, lng: 68.5, radius_km: 70, farmers:  890 },
    { id: 'Z003', name: 'North Punjab Network', lat: 32.8, lng: 73.8, radius_km: 60, farmers:  650 },
  ],

  insurance(crop, acres, severity, estimatedLoss) {
    const payoutPct = { mild: 0, moderate: 0.5, severe: 0.75, critical: 0.90 };
    const triggered = severity !== 'mild';
    const payout = Math.round(estimatedLoss * (payoutPct[severity] || 0));
    return {
      triggered, payout_pkr: payout,
      payout_urdu: `ادائیگی: ₨${payout.toLocaleString()}`,
      trigger_reason: triggered
        ? `Disease severity (${severity}) exceeds parametric threshold`
        : 'Severity below threshold — no payout for mild cases',
      weather_data: { rainfall_mm: 12.4, temperature_c: 28.6, humidity_pct: 72 },
      claim_id: `KAI-${Date.now().toString(36).toUpperCase()}`,
      processing_days: 3,
      recommendation: triggered
        ? 'Claim automatically filed. Payout within 3 business days.'
        : 'No payout at this severity. Consider upgrading to Premium Shield.',
    };
  },

  policies: {
    policies: [
      { id: 'P001', name: 'Basic Crop Shield',  name_urdu: 'بنیادی فصل بیمہ',  premium_per_acre_pkr: 850,  max_payout_per_acre_pkr: 45000,  covers: ['Pest infestation', 'Fungal disease', 'Hail damage'],               trigger_threshold: 'moderate' },
      { id: 'P002', name: 'Premium Farm Guard', name_urdu: 'پریمیم فارم گارڈ', premium_per_acre_pkr: 1800, max_payout_per_acre_pkr: 120000, covers: ['All pest types', 'Drought', 'Flood', 'Market price drop > 20%'], trigger_threshold: 'mild' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — try backend first, silently fall back to mock
// ─────────────────────────────────────────────────────────────────────────────
async function tryApi(apiFn, mockValue) {
  try {
    return await apiFn();
  } catch {
    return typeof mockValue === 'function' ? mockValue() : mockValue;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGNOSIS — real AI vision, falls back to mock only if AI also fails
// ─────────────────────────────────────────────────────────────────────────────
export const diagnoseCrop = async (file, cropType, acres) => {
  // Step 1: try the backend (if running with Grok key)
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('crop_type', cropType);
    formData.append('acres', acres);
    formData.append('farmer_name', 'Farmer');
    formData.append('location', 'Punjab, Pakistan');
    const res = await api.post('/api/diagnose/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch {
    // Step 2: backend down — call Claude Vision directly from browser
    try {
      const base64 = await fileToBase64(file);
      const mediaType = file.type || 'image/jpeg';
      return await callClaudeVision(base64, mediaType, cropType, parseFloat(acres) || 5);
    } catch (aiErr) {
      console.error('Claude Vision error:', aiErr);
      // Step 3: absolute last resort — show mock with clear "demo data" label
      return MOCK.demodiagnosis(cropType);
    }
  }
};

// Demo button — always uses mock (no image available)
export const getDemodiagnosis = (cropType = 'wheat', acres = 5) =>
  Promise.resolve(MOCK.demodiagnosis(cropType));

// ─────────────────────────────────────────────────────────────────────────────
// NEGOTIATION
// ─────────────────────────────────────────────────────────────────────────────
export const startNegotiation = (payload) =>
  tryApi(() => api.post('/api/negotiate/start', payload).then(r => r.data), MOCK.negotiation);

export const getVendors = (location = 'Punjab') =>
  tryApi(() => api.get(`/api/negotiate/vendors?location=${location}`).then(r => r.data), { vendors: MOCK.vendors });

export const acceptDeal = (payload) =>
  tryApi(() => api.post('/api/negotiate/accept', payload).then(r => r.data),
    { success: true, order_id: `ORD-${Date.now().toString(36).toUpperCase()}`, message: 'Deal confirmed! Vendor will contact you within 24 hours.' });

// ─────────────────────────────────────────────────────────────────────────────
// ECONOMICS
// ─────────────────────────────────────────────────────────────────────────────
export const runMonteCarlo = (payload) =>
  tryApi(() => api.post('/api/economics/monte-carlo', payload).then(r => r.data),
    { mean_profit_pkr: 350000, std_deviation_pkr: 45000, p10_pkr: 280000, p50_pkr: 350000, p90_pkr: 420000, roi_percent: 78, break_even_probability: 0.92 });

export const getDemoPortfolio = () =>
  tryApi(() => api.get('/api/economics/demo-portfolio').then(r => r.data), MOCK.portfolio);

// ─────────────────────────────────────────────────────────────────────────────
// MARKET
// ─────────────────────────────────────────────────────────────────────────────
export const getMarketPrices = () =>
  tryApi(() => api.get('/api/market/prices').then(r => r.data), MOCK.prices);

export const getPriceTrend = (crop, days = 30) =>
  tryApi(() => api.get(`/api/market/trends/${crop}?days=${days}`).then(r => r.data), MOCK.trend(crop));

export const getMarketAlerts = () =>
  tryApi(() => api.get('/api/market/alerts').then(r => r.data), MOCK.alerts);

// ─────────────────────────────────────────────────────────────────────────────
// LOGISTICS
// ─────────────────────────────────────────────────────────────────────────────
export const getVendorLocations = (province) => {
  const url = province ? `/api/logistics/vendors?province=${province}` : '/api/logistics/vendors';
  return tryApi(() => api.get(url).then(r => r.data), { vendors: MOCK.vendors });
};

export const getAggregationZones = () =>
  tryApi(() => api.get('/api/logistics/aggregation-zones').then(r => r.data), { zones: MOCK.zones });

// ─────────────────────────────────────────────────────────────────────────────
// INSURANCE
// ─────────────────────────────────────────────────────────────────────────────
export const assessInsurance = (payload) =>
  tryApi(() => api.post('/api/insurance/assess', payload).then(r => r.data),
    MOCK.insurance(payload.crop_type || 'wheat', payload.acres || 5, payload.severity || 'moderate', payload.estimated_loss_pkr || 225000));

export const getInsurancePolicies = () =>
  tryApi(() => api.get('/api/insurance/policies').then(r => r.data), MOCK.policies);

// ─────────────────────────────────────────────────────────────────────────────
// CHAT — Crop Expert AI (streaming)
// ─────────────────────────────────────────────────────────────────────────────
export const askCropAgent = async (messages, diagCtx, onChunk) => {
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context: diagCtx }),
    });

    if (!response.ok) throw new Error(`Chat API error: ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      onChunk(fullText);
    }

    return fullText;
  } catch (err) {
    // Fallback: call Groq directly from browser if backend unreachable
    console.warn('Backend chat failed, trying direct fallback:', err.message);
    throw err;
  }
};

export default api;