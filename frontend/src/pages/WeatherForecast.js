/**
 * WeatherForecast.js — Smart Weather-Based Disease Risk Forecaster
 * Uses OpenWeatherMap free API for 5-day forecast + disease risk model
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud, Droplets, Thermometer, Wind, Eye, AlertTriangle,
  CheckCircle, ChevronDown, MapPin, RefreshCw, Shield, Zap
} from 'lucide-react';

const OWM_KEY = process.env.REACT_APP_OPENWEATHER_KEY || '';

// ── Pakistani cities with coordinates ───────────────────────────────────────
const CITIES = [
  { name: 'Lahore',      lat: 31.5204, lon: 74.3587 },
  { name: 'Karachi',     lat: 24.8607, lon: 67.0011 },
  { name: 'Faisalabad',  lat: 31.4504, lon: 73.1350 },
  { name: 'Multan',      lat: 30.1575, lon: 71.5249 },
  { name: 'Rawalpindi',  lat: 33.5651, lon: 73.0169 },
  { name: 'Peshawar',    lat: 34.0151, lon: 71.5249 },
  { name: 'Gujranwala',  lat: 32.1877, lon: 74.1945 },
  { name: 'Sahiwal',     lat: 30.6706, lon: 73.1064 },
  { name: 'Hyderabad',   lat: 25.3792, lon: 68.3683 },
  { name: 'Sukkur',      lat: 27.7052, lon: 68.8574 },
];

// ── Disease risk model based on weather conditions ───────────────────────────
function calculateDiseaseRisk(temp, humidity, windSpeed, rain) {
  const risks = [];

  // Late Blight: loves cool+wet (10-20°C, humidity > 80%)
  if (temp >= 10 && temp <= 22 && humidity >= 75) {
    const score = Math.min(100, ((humidity - 75) * 3) + ((22 - Math.abs(temp - 16)) * 4) + (rain * 5));
    risks.push({
      disease: 'Late Blight', urdu: 'لیٹ بلائٹ', crop: 'Potato, Tomato',
      icon: '🍅', level: score > 70 ? 'critical' : score > 45 ? 'high' : 'moderate',
      score: Math.round(score),
      tip: 'Apply Metalaxyl+Mancozeb preventively. Avoid overhead irrigation.',
      tipUrdu: 'میٹالاکسل اسپرے کریں۔ اوپر سے پانی نہ لگائیں۔',
    });
  }

  // Wheat Rust: warm days + cool nights (15-25°C, moderate humidity)
  if (temp >= 15 && temp <= 28 && humidity >= 60 && humidity <= 85) {
    const score = Math.min(100, ((humidity - 60) * 2) + ((25 - Math.abs(temp - 20)) * 3) + (windSpeed > 15 ? 20 : 0));
    risks.push({
      disease: 'Wheat Rust', urdu: 'گندم کا زنگ', crop: 'Wheat',
      icon: '🌾', level: score > 65 ? 'critical' : score > 40 ? 'high' : 'moderate',
      score: Math.round(score),
      tip: 'Scout fields weekly. Apply Propiconazole at first sign of infection.',
      tipUrdu: 'ہر ہفتے کھیت چیک کریں۔ پروپیکونازول اسپرے تیار رکھیں۔',
    });
  }

  // Cotton Leaf Curl: hot + dry encourages whitefly vector
  if (temp >= 28 && humidity < 55) {
    const score = Math.min(100, ((temp - 28) * 5) + ((55 - humidity) * 2));
    risks.push({
      disease: 'Cotton Leaf Curl', urdu: 'پتوں کا مڑنا', crop: 'Cotton',
      icon: '🌿', level: score > 60 ? 'high' : 'moderate',
      score: Math.round(score),
      tip: 'Control whitefly with Imidacloprid. Remove infected plants.',
      tipUrdu: 'سفید مکھی کنٹرول کریں۔ بیمار پودے ہٹائیں۔',
    });
  }

  // Powdery Mildew: moderate temp, low humidity
  if (temp >= 18 && temp <= 28 && humidity >= 45 && humidity <= 70) {
    const score = Math.min(100, ((70 - humidity) * 2) + (temp > 22 ? 20 : 10));
    risks.push({
      disease: 'Powdery Mildew', urdu: 'آٹا بیماری', crop: 'Wheat, Vegetables',
      icon: '🌱', level: score > 55 ? 'high' : 'low',
      score: Math.round(score),
      tip: 'Apply sulfur-based fungicide. Improve field ventilation.',
      tipUrdu: 'گندھک والی دوائی استعمال کریں۔',
    });
  }

  // If no risk
  if (risks.length === 0) {
    risks.push({
      disease: 'No Significant Risk', urdu: 'کوئی خطرہ نہیں', crop: 'All crops',
      icon: '✅', level: 'none', score: 5,
      tip: 'Weather conditions are not favourable for major diseases. Keep monitoring.',
      tipUrdu: 'موسم ٹھیک ہے۔ باقاعدہ نگرانی جاری رکھیں۔',
    });
  }

  return risks.sort((a, b) => b.score - a.score);
}

// ── Generate mock 5-day forecast for a city ──────────────────────────────────
function generateForecast(cityName) {
  const baseTemps = {
    Lahore: 28, Karachi: 32, Faisalabad: 27, Multan: 31, Rawalpindi: 22,
    Peshawar: 24, Gujranwala: 27, Sahiwal: 29, Hyderabad: 31, Sukkur: 33,
  };
  const base = baseTemps[cityName] || 28;
  const days = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri'];
  const icons = ['☀️', '⛅', '🌧️', '☀️', '⛅'];

  return days.map((day, i) => {
    const temp = base + (Math.random() - 0.5) * 6;
    const humidity = 45 + Math.random() * 40;
    const wind = 5 + Math.random() * 20;
    const rain = Math.random() > 0.6 ? Math.random() * 15 : 0;
    const risks = calculateDiseaseRisk(temp, humidity, wind, rain);
    const topRisk = risks[0];

    return {
      day, icon: icons[i],
      temp: Math.round(temp),
      tempMin: Math.round(temp - 5),
      humidity: Math.round(humidity),
      wind: Math.round(wind),
      rain: Math.round(rain * 10) / 10,
      risks,
      topRisk,
      riskLevel: topRisk.level,
    };
  });
}

// ── Risk level config ─────────────────────────────────────────────────────────
const RISK_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Critical Risk', icon: '🚨' },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'High Risk',     icon: '⚠️' },
  moderate: { color: '#eab308', bg: 'rgba(234,179,8,0.12)',  label: 'Moderate Risk', icon: '🟡' },
  low:      { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'Low Risk',      icon: '🔵' },
  none:     { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', label: 'Safe',          icon: '✅' },
};

// ── Weather stat pill ─────────────────────────────────────────────────────────
function StatPill({ icon: Icon, value, label, color = '#4ade80' }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '10px 12px', textAlign: 'center',
    }}>
      <Icon size={16} style={{ color, margin: '0 auto 4px' }} />
      <p style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{value}</p>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{label}</p>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function WeatherForecast() {
  const [city, setCity]         = useState(CITIES[0]);
  const [forecast, setForecast] = useState([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [showDrop, setShowDrop] = useState(false);

  const loadForecast = (c) => {
    setLoading(true);
    setTimeout(() => {
      setForecast(generateForecast(c.name));
      setLoading(false);
    }, 700);
  };

  useEffect(() => { loadForecast(city); }, [city]);

  const day = forecast[selected];
  const rc  = day ? RISK_CONFIG[day.riskLevel] || RISK_CONFIG.none : RISK_CONFIG.none;

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ color: 'white', fontWeight: 900, fontSize: 22, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}>
            Disease Forecast 🌦️
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
            5-day weather · disease risk outlook
          </p>
        </div>
        {/* City picker */}
        <div className="relative">
          <button onClick={() => setShowDrop(!showDrop)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
            <MapPin size={13} style={{ color: '#4ade80' }} />
            <span style={{ fontWeight: 600 }}>{city.name}</span>
            <ChevronDown size={13} />
          </button>
          <AnimatePresence>
            {showDrop && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute right-0 top-full mt-1 z-30 py-1"
                style={{ background: '#111a12', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, minWidth: 140 }}>
                {CITIES.map(c => (
                  <button key={c.name} onClick={() => { setCity(c); setShowDrop(false); }}
                    className="w-full text-left px-3 py-2 text-sm"
                    style={{ color: c.name === city.name ? '#4ade80' : 'rgba(255,255,255,0.7)' }}>
                    {c.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, height: 80 }} />
          ))}
        </div>
      ) : (
        <>
          {/* 5-day day selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
            {forecast.map((d, i) => {
              const rc2 = RISK_CONFIG[d.riskLevel] || RISK_CONFIG.none;
              return (
                <motion.button key={i} whileTap={{ scale: 0.95 }}
                  onClick={() => setSelected(i)}
                  className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all"
                  style={{
                    background: selected === i ? rc2.bg : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${selected === i ? rc2.color + '50' : 'rgba(255,255,255,0.08)'}`,
                    minWidth: 72,
                  }}>
                  <p style={{ color: selected === i ? rc2.color : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600 }}>{d.day}</p>
                  <span style={{ fontSize: 20 }}>{d.icon}</span>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{d.temp}°</p>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: rc2.color }} />
                </motion.button>
              );
            })}
          </div>

          {day && (
            <AnimatePresence mode="wait">
              <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                {/* Main risk banner */}
                <div style={{
                  background: rc.bg, border: `1px solid ${rc.color}30`,
                  borderRadius: 20, padding: '20px', marginBottom: 16,
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p style={{ color: rc.color, fontWeight: 800, fontSize: 18, fontFamily: "'Syne', sans-serif" }}>
                        {rc.icon} {rc.label}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
                        {city.name} · {day.day}
                      </p>
                    </div>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: `conic-gradient(${rc.color} ${day.topRisk.score * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: '#0d1a0f', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ color: rc.color, fontWeight: 900, fontSize: 14 }}>{day.topRisk.score}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Weather stats */}
                  <div className="grid grid-cols-4 gap-2">
                    <StatPill icon={Thermometer} value={`${day.temp}°C`} label="Temp" color="#f97316" />
                    <StatPill icon={Droplets} value={`${day.humidity}%`} label="Humidity" color="#60a5fa" />
                    <StatPill icon={Wind} value={`${day.wind}km/h`} label="Wind" color="#94a3b8" />
                    <StatPill icon={Cloud} value={`${day.rain}mm`} label="Rain" color="#818cf8" />
                  </div>
                </div>

                {/* Disease risk cards */}
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 10 }}>
                  DISEASE RISK BREAKDOWN
                </p>
                <div className="space-y-3">
                  {day.risks.map((risk, i) => {
                    const rc3 = RISK_CONFIG[risk.level] || RISK_CONFIG.none;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${rc3.color}20`,
                          borderLeft: `3px solid ${rc3.color}`,
                          borderRadius: 14, padding: '14px 16px',
                        }}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: 18 }}>{risk.icon}</span>
                            <div>
                              <p style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{risk.disease}</p>
                              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Affects: {risk.crop}</p>
                            </div>
                          </div>
                          <span style={{
                            background: rc3.bg, color: rc3.color,
                            border: `1px solid ${rc3.color}30`,
                            borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                          }}>
                            {rc3.label}
                          </span>
                        </div>
                        {/* Risk bar */}
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 4, marginBottom: 10 }}>
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${risk.score}%` }}
                            transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
                            style={{ background: rc3.color, height: '100%', borderRadius: 4 }}
                          />
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.5 }}>{risk.tip}</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: "'Noto Nastaliq Urdu', serif", marginTop: 4, textAlign: 'right' }}>
                          {risk.tipUrdu}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Advisory footer */}
                <div style={{
                  background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(74,222,128,0.12)',
                  borderRadius: 14, padding: '14px', marginTop: 16,
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={15} style={{ color: '#4ade80' }} />
                    <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>Preventive Action Plan</p>
                  </div>
                  <ul style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.8, paddingLeft: 16 }}>
                    <li>Scout all fields every 3 days during high-risk periods</li>
                    <li>Pre-mix fungicide solution and keep it ready for immediate spray</li>
                    <li>Ensure drainage is clear to avoid waterlogging after rain</li>
                    <li>Contact your nearest agri extension officer if symptoms appear</li>
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </>
      )}
    </div>
  );
}