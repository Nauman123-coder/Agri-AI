/**
 * SatelliteMonitor.js — Satellite Field Health Monitoring
 * NDVI visualization, field health zones, crop stress detection
 * Uses Leaflet maps with simulated NDVI overlay + real OSM tiles
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Satellite, Layers, ZoomIn, ZoomOut, RefreshCw,
  AlertTriangle, TrendingDown, TrendingUp, MapPin,
  Info, ChevronRight, Activity
} from 'lucide-react';

// ── NDVI Health color scale ──────────────────────────────────────────────────
const NDVI_COLORS = [
  { min: -1.0, max: 0.0,  color: '#7f3b08', label: 'Bare soil / Water', health: 0  },
  { min: 0.0,  max: 0.15, color: '#c85a17', label: 'Sparse vegetation', health: 15 },
  { min: 0.15, max: 0.30, color: '#e8a838', label: 'Stressed crop',     health: 35 },
  { min: 0.30, max: 0.45, color: '#f0d060', label: 'Moderate health',   health: 55 },
  { min: 0.45, max: 0.60, color: '#a0c830', label: 'Good health',       health: 72 },
  { min: 0.60, max: 0.75, color: '#48a820', label: 'Very healthy',      health: 85 },
  { min: 0.75, max: 1.0,  color: '#1a7a10', label: 'Peak growth',       health: 97 },
];

// ── Pakistani field locations ─────────────────────────────────────────────────
const DEMO_FIELDS = [
  {
    id: 'F001', name: 'North Wheat Block', urdu: 'شمالی گندم',
    lat: 31.52, lng: 74.36, acres: 12.5, crop: 'Wheat',
    ndvi: 0.68, trend: +0.04, lastScan: '2 hours ago',
    zones: [
      { name: 'Zone A', ndvi: 0.72, status: 'healthy',  area: 4.2, issue: null },
      { name: 'Zone B', ndvi: 0.61, status: 'good',     area: 5.1, issue: null },
      { name: 'Zone C', ndvi: 0.38, status: 'stressed', area: 3.2, issue: 'Possible nutrient deficiency or early disease' },
    ],
  },
  {
    id: 'F002', name: 'South Cotton Plot', urdu: 'جنوبی کپاس',
    lat: 31.50, lng: 74.34, acres: 8.0, crop: 'Cotton',
    ndvi: 0.52, trend: -0.06, lastScan: '4 hours ago',
    zones: [
      { name: 'Zone A', ndvi: 0.58, status: 'good',     area: 3.0, issue: null },
      { name: 'Zone B', ndvi: 0.49, status: 'moderate', area: 2.8, issue: 'Slight water stress detected' },
      { name: 'Zone C', ndvi: 0.42, status: 'stressed', area: 2.2, issue: 'Low NDVI — check for leaf curl or pest damage' },
    ],
  },
  {
    id: 'F003', name: 'East Rice Paddy', urdu: 'مشرقی چاول',
    lat: 31.53, lng: 74.39, acres: 6.5, crop: 'Rice',
    ndvi: 0.71, trend: +0.02, lastScan: '1 hour ago',
    zones: [
      { name: 'Zone A', ndvi: 0.74, status: 'healthy',  area: 3.5, issue: null },
      { name: 'Zone B', ndvi: 0.69, status: 'healthy',  area: 3.0, issue: null },
    ],
  },
];

// ── Get NDVI info ─────────────────────────────────────────────────────────────
function getNdviInfo(ndvi) {
  return NDVI_COLORS.find(c => ndvi >= c.min && ndvi < c.max) || NDVI_COLORS[NDVI_COLORS.length - 1];
}

// ── NDVI gauge ────────────────────────────────────────────────────────────────
function NdviGauge({ value, size = 80 }) {
  const info = getNdviInfo(value);
  const pct  = ((value + 1) / 2) * 100;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="40" cy="40" r="34" fill="none" stroke={info.color} strokeWidth="8"
          strokeDasharray={`${2 * Math.PI * 34 * pct / 100} ${2 * Math.PI * 34 * (1 - pct / 100)}`}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'all 1s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: info.color, fontWeight: 900, fontSize: size > 70 ? 16 : 12 }}>{value.toFixed(2)}</p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8 }}>NDVI</p>
      </div>
    </div>
  );
}

// ── Simulated satellite map ───────────────────────────────────────────────────
function SatelliteMap({ fields, selectedField, onSelect }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Draw base (dark earth)
    ctx.fillStyle = '#0a1208';
    ctx.fillRect(0, 0, W, H);

    // Draw grid lines (field boundaries)
    ctx.strokeStyle = 'rgba(74,222,128,0.1)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Draw fields as colored NDVI blobs
    const fieldPositions = [
      { x: 100, y: 80,  w: 160, h: 120, field: fields[0] },
      { x: 80,  y: 220, w: 130, h: 100, field: fields[1] },
      { x: 260, y: 100, w: 110, h: 130, field: fields[2] },
    ];

    fieldPositions.forEach(({ x, y, w, h, field }) => {
      if (!field) return;
      const info = getNdviInfo(field.ndvi);
      const isSelected = selectedField?.id === field.id;

      // Glow effect for selected
      if (isSelected) {
        ctx.shadowColor = info.color;
        ctx.shadowBlur  = 20;
      }

      // Draw NDVI zones within field
      field.zones.forEach((zone, i) => {
        const zInfo = getNdviInfo(zone.ndvi);
        const zx = x + (i % 2) * (w / 2);
        const zy = y + Math.floor(i / 2) * (h / 2);
        const zw = i === 0 ? w * 0.55 : w * 0.45;
        const zh = i < 2 ? h * 0.55 : h * 0.45;

        ctx.fillStyle = zInfo.color + 'CC';
        ctx.beginPath();
        ctx.roundRect(zx, zy, zw, zh, 6);
        ctx.fill();

        // Zone label
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.font = '9px monospace';
        ctx.fillText(zone.name, zx + 4, zy + 12);
      });

      ctx.shadowBlur = 0;

      // Field border
      ctx.strokeStyle = isSelected ? '#4ade80' : 'rgba(74,222,128,0.3)';
      ctx.lineWidth   = isSelected ? 2 : 1;
      ctx.strokeRect(x, y, w, h);

      // Field name label
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(x, y - 18, w, 18);
      ctx.fillStyle = isSelected ? '#4ade80' : 'rgba(255,255,255,0.7)';
      ctx.font = '10px sans-serif';
      ctx.fillText(field.name, x + 4, y - 5);
    });

    // Compass
    ctx.fillStyle = 'rgba(74,222,128,0.5)';
    ctx.font = '12px sans-serif';
    ctx.fillText('N ↑', W - 30, 20);

    // Scale bar
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(10, H - 10); ctx.lineTo(60, H - 10); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '9px monospace';
    ctx.fillText('500m', 18, H - 14);
  }, [fields, selectedField]);

  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} width={400} height={360}
        style={{ width: '100%', borderRadius: 16, cursor: 'crosshair', display: 'block' }}
        onClick={(e) => {
          const rect = e.target.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width * 400;
          const y = (e.clientY - rect.top) / rect.height * 360;
          const positions = [
            { x: 100, y: 80,  w: 160, h: 120, field: fields[0] },
            { x: 80,  y: 220, w: 130, h: 100, field: fields[1] },
            { x: 260, y: 100, w: 110, h: 130, field: fields[2] },
          ];
          const hit = positions.find(p => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
          if (hit) onSelect(hit.field);
        }}
      />
      {/* Satellite watermark */}
      <div style={{ position: 'absolute', bottom: 8, right: 10 }}>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontFamily: 'monospace' }}>
          SENTINEL-2 · Simulated NDVI
        </span>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function SatelliteMonitor() {
  const [fields, setFields]           = useState(DEMO_FIELDS);
  const [selectedField, setSelectedField] = useState(DEMO_FIELDS[0]);
  const [loading, setLoading]         = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeTab, setActiveTab]     = useState('map');

  const refresh = () => {
    setLoading(true);
    setTimeout(() => {
      // Simulate slight NDVI changes on refresh
      setFields(prev => prev.map(f => ({
        ...f,
        ndvi: Math.max(0.1, Math.min(0.95, f.ndvi + (Math.random() - 0.5) * 0.04)),
        lastScan: 'Just now',
      })));
      setLastRefresh(new Date());
      setLoading(false);
    }, 1500);
  };

  const totalArea = fields.reduce((s, f) => s + f.acres, 0);
  const avgNdvi   = fields.reduce((s, f) => s + f.ndvi, 0) / fields.length;
  const stressedZones = fields.flatMap(f => f.zones).filter(z => z.ndvi < 0.45).length;

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ color: 'white', fontWeight: 900, fontSize: 22, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}>
            Field Monitor 🛰️
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
            Satellite NDVI · {lastRefresh.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.9, rotate: 180 }} onClick={refresh}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <RefreshCw size={15} style={{ color: loading ? '#4ade80' : 'rgba(255,255,255,0.5)' }}
            className={loading ? 'animate-spin' : ''} />
        </motion.button>
      </div>

      {/* Farm summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Area', value: `${totalArea} ac`, color: '#60a5fa', icon: '📐' },
          { label: 'Avg NDVI', value: avgNdvi.toFixed(2), color: getNdviInfo(avgNdvi).color, icon: '🌿' },
          { label: 'Stress Zones', value: stressedZones, color: stressedZones > 0 ? '#f97316' : '#4ade80', icon: '⚠️' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '12px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</p>
            <p style={{ color: s.color, fontWeight: 800, fontSize: 18 }}>{s.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab switch */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'map',    label: '🗺️ Satellite Map' },
          { key: 'fields', label: '📊 Field Analysis' },
          { key: 'ndvi',   label: '🎨 NDVI Legend' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: activeTab === tab.key ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${activeTab === tab.key ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.08)'}`,
              color: activeTab === tab.key ? '#4ade80' : 'rgba(255,255,255,0.5)',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'map' && (
          <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Satellite map */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(74,222,128,0.1)',
              borderRadius: 20, padding: 12, marginBottom: 14,
            }}>
              <SatelliteMap fields={fields} selectedField={selectedField} onSelect={setSelectedField} />
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, textAlign: 'center', marginTop: 8 }}>
                👆 Tap a field to inspect NDVI zones
              </p>
            </div>

            {/* Selected field detail */}
            {selectedField && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(74,222,128,0.15)',
                  borderRadius: 18, padding: 16,
                }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <NdviGauge value={selectedField.ndvi} size={64} />
                    <div>
                      <p style={{ color: 'white', fontWeight: 800, fontSize: 16, fontFamily: "'Syne', sans-serif" }}>
                        {selectedField.name}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                        {selectedField.crop} · {selectedField.acres} acres
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {selectedField.trend >= 0
                          ? <TrendingUp size={12} style={{ color: '#4ade80' }} />
                          : <TrendingDown size={12} style={{ color: '#f87171' }} />}
                        <span style={{
                          color: selectedField.trend >= 0 ? '#4ade80' : '#f87171',
                          fontSize: 11, fontWeight: 600,
                        }}>
                          {selectedField.trend > 0 ? '+' : ''}{selectedField.trend.toFixed(2)} NDVI vs last week
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Last scan</p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{selectedField.lastScan}</p>
                  </div>
                </div>

                {/* Zone breakdown */}
                <div className="space-y-2">
                  {selectedField.zones.map((zone, i) => {
                    const zInfo = getNdviInfo(zone.ndvi);
                    return (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.03)', border: `1px solid ${zInfo.color}25`,
                        borderRadius: 12, padding: '10px 12px',
                      }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: zInfo.color }} />
                            <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{zone.name}</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{zone.area} ac</span>
                          </div>
                          <span style={{ color: zInfo.color, fontSize: 12, fontWeight: 700 }}>
                            NDVI {zone.ndvi.toFixed(2)}
                          </span>
                        </div>
                        {/* NDVI bar */}
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 3, height: 4 }}>
                          <div style={{ width: `${((zone.ndvi + 1) / 2) * 100}%`, background: zInfo.color, height: '100%', borderRadius: 3 }} />
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>{zInfo.label}</p>
                        {zone.issue && (
                          <div className="flex items-start gap-1.5 mt-2">
                            <AlertTriangle size={11} style={{ color: '#f97316', flexShrink: 0, marginTop: 1 }} />
                            <p style={{ color: '#f97316', fontSize: 11 }}>{zone.issue}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'fields' && (
          <motion.div key="fields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {fields.map(field => {
              const info = getNdviInfo(field.ndvi);
              const stressed = field.zones.filter(z => z.ndvi < 0.45).length;
              return (
                <motion.div key={field.id} whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedField(field); setActiveTab('map'); }}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 18, padding: 16, cursor: 'pointer',
                  }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <NdviGauge value={field.ndvi} size={56} />
                      <div>
                        <p style={{ color: 'white', fontWeight: 700, fontSize: 15, fontFamily: "'Syne', sans-serif" }}>
                          {field.name}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                          {field.crop} · {field.acres} ac · {field.zones.length} zones
                        </p>
                        {stressed > 0 && (
                          <p style={{ color: '#f97316', fontSize: 11, marginTop: 2 }}>
                            ⚠️ {stressed} stressed zone{stressed > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: info.color, fontWeight: 700, fontSize: 13 }}>{info.label}</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{field.lastScan}</p>
                      </div>
                      <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Action tip */}
            <div style={{
              background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
              borderRadius: 14, padding: '12px 14px',
            }}>
              <div className="flex items-center gap-2 mb-1">
                <Info size={14} style={{ color: '#60a5fa' }} />
                <p style={{ color: '#60a5fa', fontWeight: 600, fontSize: 13 }}>What is NDVI?</p>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.6 }}>
                Normalized Difference Vegetation Index (NDVI) measures crop health from satellite imagery.
                Values near 1.0 = peak green healthy growth. Values below 0.3 = stressed or diseased crops.
                Sentinel-2 satellites scan Pakistan every 5 days.
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'ndvi' && (
          <motion.div key="ndvi" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 12 }}>
              NDVI COLOR SCALE
            </p>
            <div className="space-y-2 mb-6">
              {[...NDVI_COLORS].reverse().map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div style={{ width: 40, height: 28, borderRadius: 8, background: c.color, flexShrink: 0 }} />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{c.label}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'monospace' }}>
                        {c.min.toFixed(2)} – {c.max.toFixed(2)}
                      </p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 3, height: 3, marginTop: 4 }}>
                      <div style={{ width: `${c.health}%`, background: c.color, height: '100%', borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Crop-specific NDVI thresholds */}
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 10 }}>
              CRITICAL THRESHOLDS BY CROP
            </p>
            <div className="space-y-2">
              {[
                { crop: '🌾 Wheat',      warn: 0.45, crit: 0.30, peak: '0.65 – 0.80' },
                { crop: '🌿 Cotton',     warn: 0.50, crit: 0.35, peak: '0.60 – 0.75' },
                { crop: '🍚 Rice',       warn: 0.55, crit: 0.40, peak: '0.70 – 0.85' },
                { crop: '🥔 Vegetables', warn: 0.40, crit: 0.25, peak: '0.55 – 0.70' },
              ].map(t => (
                <div key={t.crop} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: '10px 14px',
                }}>
                  <div className="flex justify-between items-center">
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{t.crop}</p>
                    <p style={{ color: '#4ade80', fontSize: 11 }}>Peak: {t.peak}</p>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span style={{ color: '#eab308', fontSize: 11 }}>⚠️ Warn &lt; {t.warn}</span>
                    <span style={{ color: '#ef4444', fontSize: 11 }}>🚨 Critical &lt; {t.crit}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}