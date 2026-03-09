/**
 * SatelliteMonitor.js — Real Sentinel-2 NDVI Field Monitor v3
 * 
 * ✅ Real satellite imagery (ESRI World Imagery base)
 * ✅ Real Sentinel-2 NDVI WMS tiles (Copernicus Data Space, free account)
 * ✅ Real NDVI values per field (Statistical API, 10m resolution)
 * ✅ Real NDVI weekly trend charts (90-day history)
 * ✅ Add/name/track your own fields
 * ✅ Pakistani city navigation
 * ✅ Graceful fallback when API keys not configured
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, AlertTriangle, TrendingDown, TrendingUp,
  Info, Plus, Trash2, Navigation, Eye, EyeOff,
  Loader, CheckCircle, XCircle, BarChart2,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const API = process.env.REACT_APP_API_URL || 'https://agri-ai-au37.onrender.com';

// ── NDVI color scale ──────────────────────────────────────────────────────────
const NDVI_SCALE = [
  { min: -1.0, max: 0.0,  color: '#7f3b08', label: 'Bare soil / Water',  health: 0  },
  { min: 0.0,  max: 0.15, color: '#c85a17', label: 'Sparse vegetation',  health: 15 },
  { min: 0.15, max: 0.30, color: '#e8a838', label: 'Stressed crop',      health: 35 },
  { min: 0.30, max: 0.45, color: '#f0d060', label: 'Moderate health',    health: 55 },
  { min: 0.45, max: 0.60, color: '#a0c830', label: 'Good health',        health: 72 },
  { min: 0.60, max: 0.75, color: '#48a820', label: 'Very healthy',       health: 85 },
  { min: 0.75, max: 1.0,  color: '#1a7a10', label: 'Peak growth',        health: 97 },
];

function getNdviInfo(ndvi) {
  return NDVI_SCALE.find(c => ndvi >= c.min && ndvi < c.max) || NDVI_SCALE[NDVI_SCALE.length - 1];
}

function fieldBbox(lat, lng, paddingDeg = 0.005) {
  return { min_lat: lat - paddingDeg, min_lng: lng - paddingDeg, max_lat: lat + paddingDeg, max_lng: lng + paddingDeg };
}

// ── Pakistani farming cities ──────────────────────────────────────────────────
const CITIES = [
  { name: 'Lahore',     lat: 31.52,  lng: 74.36,  zoom: 12 },
  { name: 'Faisalabad', lat: 31.42,  lng: 73.08,  zoom: 12 },
  { name: 'Multan',     lat: 30.19,  lng: 71.47,  zoom: 12 },
  { name: 'Sahiwal',    lat: 30.67,  lng: 73.11,  zoom: 12 },
  { name: 'Gujranwala', lat: 32.16,  lng: 74.18,  zoom: 12 },
  { name: 'Bahawalpur', lat: 29.39,  lng: 71.67,  zoom: 12 },
  { name: 'Sargodha',   lat: 32.08,  lng: 72.67,  zoom: 12 },
  { name: 'Peshawar',   lat: 34.01,  lng: 71.57,  zoom: 12 },
  { name: 'Hyderabad',  lat: 25.40,  lng: 68.37,  zoom: 12 },
  { name: 'Sukkur',     lat: 27.70,  lng: 68.86,  zoom: 12 },
];

// ── NDVI Gauge ────────────────────────────────────────────────────────────────
function NdviGauge({ value, size = 80, loading = false }) {
  const info = getNdviInfo(value);
  const pct  = ((value + 1) / 2) * 100;
  const r = 34, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        {!loading && (
          <circle cx="40" cy="40" r={r} fill="none" stroke={info.color} strokeWidth="8"
            strokeDasharray={`${circ * pct / 100} ${circ * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'all 1.2s ease' }} />
        )}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {loading
          ? <Loader size={14} style={{ color: 'rgba(255,255,255,0.3)' }} className="animate-spin" />
          : <>
              <p style={{ color: info.color, fontWeight: 900, fontSize: size > 70 ? 16 : 13, lineHeight: 1 }}>{value.toFixed(2)}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8 }}>NDVI</p>
            </>
        }
      </div>
    </div>
  );
}

// ── NDVI History Chart ────────────────────────────────────────────────────────
function NdviChart({ history, cropWarningThreshold = 0.45 }) {
  if (!history || history.length === 0) return (
    <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>No history data yet</p>
    </div>
  );

  const data = history.map(h => ({
    date: h.date.slice(5),  // MM-DD
    ndvi: parseFloat(h.ndvi.toFixed(3)),
  }));

  const latest = data[data.length - 1];
  const info   = getNdviInfo(latest?.ndvi || 0);

  return (
    <ResponsiveContainer width="100%" height={110}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 1]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: 'rgba(8,18,10,0.95)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
          itemStyle={{ color: info.color }}
          formatter={(v) => [v.toFixed(3), 'NDVI']}
        />
        <ReferenceLine y={cropWarningThreshold} stroke="rgba(249,115,22,0.4)" strokeDasharray="4 4" />
        <Line type="monotone" dataKey="ndvi" stroke={info.color} strokeWidth={2}
          dot={{ fill: info.color, r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Live Leaflet Map ──────────────────────────────────────────────────────────
function LiveMap({ city, fields, selectedField, onFieldSelect, onFieldAdd, wmsConfig, showNdvi, onNdviToggle }) {
  const mapRef     = useRef(null);
  const mapInst    = useRef(null);
  const ndviLyr    = useRef(null);
  const markersRef = useRef({});
  const [clickInfo, setClickInfo] = useState(null);
  const [adding, setAdding]       = useState(false);

  useEffect(() => {
    if (mapInst.current || !mapRef.current || !window.L) return;
    const L   = window.L;
    const map = L.map(mapRef.current, {
      center: [city.lat, city.lng], zoom: city.zoom,
      zoomControl: false, attributionControl: true,
    });

    // Real satellite base layer
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, attribution: '© ESRI' }
    ).addTo(map);

    // NDVI overlay — use real Sentinel-2 WMS if configured, else NASA GIBS MODIS fallback
    const buildNdviLayer = (cfg) => {
      if (cfg?.wms_base && cfg?.token) {
        // Real Sentinel-2 NDVI from Copernicus Data Space (10m resolution)
        return L.tileLayer.wms(cfg.wms_base, {
          layers: 'NDVI',
          format: 'image/png',
          transparent: true,
          opacity: 0.7,
          maxZoom: 16,
          time: new Date().toISOString().split('T')[0],
          attribution: 'Sentinel-2 © ESA',
          headers: { Authorization: `Bearer ${cfg.token}` },
        });
      } else {
        // Free fallback: NASA GIBS MODIS NDVI (250m, no auth)
        return L.tileLayer(
          'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/2024-10-01/GoogleMapsCompatible/{z}/{y}/{x}.png',
          { maxZoom: 8, opacity: 0.65, attribution: 'NASA GIBS MODIS' }
        );
      }
    };

    ndviLyr.current = buildNdviLayer(wmsConfig);
    if (showNdvi) ndviLyr.current.addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Click → show lat/lng
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setClickInfo({ lat: lat.toFixed(5), lng: lng.toFixed(5) });
      if (window._khetTmp) window._khetTmp.remove();
      window._khetTmp = L.circleMarker([lat, lng], {
        radius: 7, color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.4, weight: 2,
      }).addTo(map);
    });

    mapInst.current = map;
    return () => { map.remove(); mapInst.current = null; };
    // eslint-disable-next-line
  }, []);

  // Rebuild NDVI layer when wmsConfig arrives
  useEffect(() => {
    if (!mapInst.current || !window.L) return;
    if (ndviLyr.current) mapInst.current.removeLayer(ndviLyr.current);
    const L = window.L;
    if (wmsConfig?.wms_base && wmsConfig?.token) {
      ndviLyr.current = L.tileLayer.wms(wmsConfig.wms_base, {
        layers: 'NDVI', format: 'image/png', transparent: true,
        opacity: 0.7, maxZoom: 16, attribution: 'Sentinel-2 © ESA',
      });
    } else {
      ndviLyr.current = L.tileLayer(
        'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/2024-10-01/GoogleMapsCompatible/{z}/{y}/{x}.png',
        { maxZoom: 8, opacity: 0.65, attribution: 'NASA GIBS' }
      );
    }
    if (showNdvi) ndviLyr.current.addTo(mapInst.current);
  // eslint-disable-next-line
  }, [wmsConfig]);

  useEffect(() => {
    if (mapInst.current) mapInst.current.flyTo([city.lat, city.lng], city.zoom, { duration: 1.2 });
  }, [city]);

  useEffect(() => {
    if (!mapInst.current || !ndviLyr.current) return;
    if (showNdvi) ndviLyr.current.addTo(mapInst.current);
    else mapInst.current.removeLayer(ndviLyr.current);
  }, [showNdvi]);

  // Sync markers
  useEffect(() => {
    if (!mapInst.current || !window.L) return;
    const L = window.L;
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    fields.forEach(field => {
      const info = getNdviInfo(field.ndvi);
      const sel  = selectedField?.id === field.id;
      markersRef.current[field.id] = L.circleMarker([field.lat, field.lng], {
        radius: sel ? 14 : 10, color: sel ? '#fff' : info.color,
        fillColor: info.color, fillOpacity: sel ? 0.9 : 0.7, weight: sel ? 3 : 2,
      })
        .addTo(mapInst.current)
        .bindTooltip(`<b>${field.name}</b><br>NDVI ${field.ndvi.toFixed(3)}<br>${info.label}`,
          { direction: 'top', className: 'khet-tip' })
        .on('click', () => onFieldSelect(field));
    });
  }, [fields, selectedField, onFieldSelect]);

  const handleAddMode = () => {
    if (!mapInst.current) return;
    setAdding(true);
    mapInst.current.once('click', (e) => {
      onFieldAdd({ lat: e.latlng.lat, lng: e.latlng.lng });
      setAdding(false);
    });
  };

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
      <style>{`
        .leaflet-container { background:#0a1208; }
        .leaflet-control-zoom a { background:rgba(10,18,8,0.92)!important; color:#4ade80!important; border-color:rgba(74,222,128,0.25)!important; }
        .leaflet-control-zoom a:hover { background:rgba(22,163,74,0.2)!important; }
        .leaflet-control-attribution { background:rgba(0,0,0,0.55)!important; color:rgba(255,255,255,0.25)!important; font-size:9px!important; }
        .leaflet-control-attribution a { color:rgba(255,255,255,0.35)!important; }
        .khet-tip { background:rgba(8,18,10,0.95); border:1px solid rgba(74,222,128,0.3); color:#fff; font-size:11px; border-radius:8px; padding:6px 10px; box-shadow:0 4px 20px rgba(0,0,0,0.5); }
      `}</style>

      <div ref={mapRef} style={{ height: 320, width: '100%' }} />

      {/* Controls */}
      <div style={{ position:'absolute', top:10, left:10, right:10, zIndex:500, display:'flex', justifyContent:'space-between', pointerEvents:'none' }}>
        <motion.button whileTap={{scale:0.9}} onClick={onNdviToggle}
          style={{ pointerEvents:'all', background:showNdvi?'rgba(22,163,74,0.88)':'rgba(10,20,12,0.88)', border:`1px solid ${showNdvi?'rgba(74,222,128,0.5)':'rgba(255,255,255,0.15)'}`, borderRadius:10, padding:'6px 10px', color:showNdvi?'#fff':'rgba(255,255,255,0.5)', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:5, backdropFilter:'blur(8px)', cursor:'pointer' }}>
          {showNdvi ? <Eye size={12}/> : <EyeOff size={12}/>} NDVI {showNdvi?'ON':'OFF'}
        </motion.button>
        <motion.button whileTap={{scale:0.9}} onClick={handleAddMode}
          style={{ pointerEvents:'all', background:adding?'rgba(245,158,11,0.88)':'rgba(10,20,12,0.88)', border:`1px solid ${adding?'rgba(245,158,11,0.5)':'rgba(255,255,255,0.15)'}`, borderRadius:10, padding:'6px 10px', color:adding?'#fff':'rgba(255,255,255,0.5)', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:5, backdropFilter:'blur(8px)', cursor:'pointer' }}>
          <Plus size={12}/> {adding?'Tap to pin…':'Add Field'}
        </motion.button>
      </div>

      {/* Click info */}
      <AnimatePresence>
        {clickInfo && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}}
            style={{ position:'absolute', bottom:10, left:10, right:10, zIndex:500, background:'rgba(8,18,10,0.92)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:12, padding:'8px 14px', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <p style={{color:'rgba(255,255,255,0.5)',fontSize:11}}>
              📍 {clickInfo.lat}°N · {clickInfo.lng}°E
            </p>
            <button onClick={() => setClickInfo(null)} style={{color:'rgba(255,255,255,0.3)',background:'none',border:'none',cursor:'pointer',fontSize:16}}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Add Field Form ────────────────────────────────────────────────────────────
function AddFieldForm({ location, onSubmit, onCancel }) {
  const [name, setName]   = useState('');
  const [crop, setCrop]   = useState('Wheat');
  const [acres, setAcres] = useState('5');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <p style={{color:'#fbbf24',fontSize:12,fontWeight:600}}>
        📍 {parseFloat(location.lat).toFixed(4)}°N, {parseFloat(location.lng).toFixed(4)}°E
      </p>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Field name (e.g. West Cotton Block)"
        style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'8px 12px', color:'white', fontSize:13, outline:'none', width:'100%', boxSizing:'border-box' }} />
      <div style={{display:'flex',gap:8}}>
        <select value={crop} onChange={e => setCrop(e.target.value)}
          style={{ flex:1, background:'rgba(8,18,10,0.95)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'8px 10px', color:'white', fontSize:13, outline:'none' }}>
          {['Wheat','Cotton','Rice','Sugarcane','Maize','Vegetables'].map(c => <option key={c}>{c}</option>)}
        </select>
        <input value={acres} onChange={e => setAcres(e.target.value)} placeholder="Acres"
          style={{ width:80, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'8px 10px', color:'white', fontSize:13, outline:'none' }} />
      </div>
      <div style={{display:'flex',gap:8}}>
        <motion.button whileTap={{scale:0.96}} onClick={() => onSubmit(name,crop,parseFloat(acres)||5)}
          style={{ flex:1, background:'rgba(22,163,74,0.15)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:10, padding:9, color:'#4ade80', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          ✓ Save & Fetch NDVI
        </motion.button>
        <motion.button whileTap={{scale:0.96}} onClick={onCancel}
          style={{ padding:'9px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.4)', fontSize:13, cursor:'pointer' }}>✕</motion.button>
      </div>
    </div>
  );
}

// ── Field Detail Card ─────────────────────────────────────────────────────────
function FieldDetail({ field, onRefresh, showHistory }) {
  const info = getNdviInfo(field.ndvi);
  const thresholds = { Wheat:0.45, Cotton:0.50, Rice:0.55, Sugarcane:0.45, Maize:0.45, Vegetables:0.40 };
  const threshold  = thresholds[field.crop] || 0.45;
  const isStressed = field.ndvi < threshold;

  return (
    <motion.div key={field.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
      style={{ background:'rgba(22,163,74,0.06)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:18, padding:16 }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <NdviGauge value={field.ndvi} size={64} loading={field.loading} />
          <div>
            <p style={{color:'white',fontWeight:800,fontSize:15,fontFamily:"'Syne',sans-serif"}}>{field.name}</p>
            <p style={{color:'rgba(255,255,255,0.4)',fontSize:11}}>{field.crop} · {field.acres} ac</p>
            {field.ndviDate && <p style={{color:'rgba(255,255,255,0.25)',fontSize:10,marginTop:2}}>Sentinel-2 · {field.ndviDate}</p>}
            <div className="flex items-center gap-1 mt-1">
              {field.trend >= 0 ? <TrendingUp size={11} style={{color:'#4ade80'}}/> : <TrendingDown size={11} style={{color:'#f87171'}}/>}
              <span style={{color:field.trend>=0?'#4ade80':'#f87171',fontSize:11,fontWeight:600}}>
                {field.trend>0?'+':''}{field.trend.toFixed(3)} NDVI vs prior period
              </span>
            </div>
          </div>
        </div>
        <motion.button whileTap={{scale:0.9}} onClick={onRefresh}
          style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'6px 8px',cursor:'pointer',color:'rgba(255,255,255,0.4)',display:'flex',alignItems:'center',gap:4,fontSize:11}}>
          <RefreshCw size={11} className={field.loading?'animate-spin':''}/> Refresh
        </motion.button>
      </div>

      {/* Health status */}
      <div style={{background:`${info.color}15`,border:`1px solid ${info.color}30`,borderRadius:12,padding:'10px 14px',marginBottom:12}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div style={{width:10,height:10,borderRadius:3,background:info.color,flexShrink:0}}/>
            <p style={{color:info.color,fontWeight:700,fontSize:13}}>{info.label}</p>
          </div>
          <p style={{color:info.color,fontWeight:800,fontSize:16}}>NDVI {field.ndvi.toFixed(3)}</p>
        </div>
        <div style={{background:'rgba(255,255,255,0.06)',borderRadius:3,height:5,marginTop:8}}>
          <div style={{width:`${((field.ndvi+1)/2)*100}%`,background:info.color,height:'100%',borderRadius:3,transition:'width 1s ease'}}/>
        </div>
        {isStressed && (
          <div className="flex items-center gap-1.5 mt-2">
            <AlertTriangle size={11} style={{color:'#f97316',flexShrink:0}}/>
            <p style={{color:'#f97316',fontSize:11}}>NDVI below {threshold} threshold — check for stress, disease, or water deficit</p>
          </div>
        )}
      </div>

      {/* NDVI stats grid */}
      {field.ndviStats && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            {label:'Min',    value:field.ndviStats.ndvi_min?.toFixed(3)},
            {label:'Mean',   value:field.ndviStats.ndvi_mean?.toFixed(3)},
            {label:'Max',    value:field.ndviStats.ndvi_max?.toFixed(3)},
          ].map(s => (
            <div key={s.label} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'8px',textAlign:'center'}}>
              <p style={{color:getNdviInfo(parseFloat(s.value||0)).color,fontWeight:700,fontSize:14}}>{s.value || '—'}</p>
              <p style={{color:'rgba(255,255,255,0.3)',fontSize:10}}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* History chart */}
      {showHistory && field.history && field.history.length > 0 && (
        <div style={{marginTop:8}}>
          <p style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontFamily:"'JetBrains Mono',monospace",marginBottom:6}}>
            90-DAY NDVI TREND
          </p>
          <NdviChart history={field.history} cropWarningThreshold={threshold} />
          <p style={{color:'rgba(255,255,255,0.2)',fontSize:9,marginTop:4}}>Orange dashed line = warning threshold for {field.crop}</p>
        </div>
      )}

      {/* API status badge */}
      {field.realData && (
        <div className="flex items-center gap-1.5 mt-3">
          <CheckCircle size={10} style={{color:'#4ade80'}}/>
          <p style={{color:'#4ade80',fontSize:10}}>Real Sentinel-2 data · 10m resolution</p>
        </div>
      )}
      {field.apiError && (
        <div className="flex items-center gap-1.5 mt-3">
          <XCircle size={10} style={{color:'rgba(255,255,255,0.3)'}}/>
          <p style={{color:'rgba(255,255,255,0.3)',fontSize:10}}>{field.apiError}</p>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
let fieldIdCounter = 4;

const DEMO_FIELDS = [
  { id:'F001', name:'North Wheat Block', lat:31.535, lng:74.372, acres:12.5, crop:'Wheat',  ndvi:0.68, trend:+0.04, lastScan:'Demo', history:[], ndviStats:null, loading:false, realData:false, apiError:null, ndviDate:null },
  { id:'F002', name:'South Cotton Plot', lat:31.505, lng:74.345, acres:8.0,  crop:'Cotton', ndvi:0.52, trend:-0.06, lastScan:'Demo', history:[], ndviStats:null, loading:false, realData:false, apiError:null, ndviDate:null },
  { id:'F003', name:'East Rice Paddy',   lat:31.545, lng:74.395, acres:6.5,  crop:'Rice',   ndvi:0.71, trend:+0.02, lastScan:'Demo', history:[], ndviStats:null, loading:false, realData:false, apiError:null, ndviDate:null },
];

export default function SatelliteMonitor() {
  const [fields, setFields]             = useState(DEMO_FIELDS);
  const [selected, setSelected]         = useState(DEMO_FIELDS[0]);
  const [city, setCity]                 = useState(CITIES[0]);
  const [tab, setTab]                   = useState('map');
  const [showNdvi, setShowNdvi]         = useState(true);
  const [showHistory, setShowHistory]   = useState(false);
  const [leafletReady, setLeafletReady] = useState(!!window.L);
  const [pendingPin, setPendingPin]     = useState(null);
  const [wmsConfig, setWmsConfig]       = useState(null);
  const [apiConfigured, setApiConfigured] = useState(null); // null=unknown, true/false

  // Load Leaflet
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => setLeafletReady(true);
    document.head.appendChild(s);
  }, []);

  // Fetch WMS config from backend
  useEffect(() => {
    fetch(`${API}/api/satellite/token`)
      .then(r => r.json())
      .then(data => {
        setWmsConfig(data);
        setApiConfigured(data.configured);
      })
      .catch(() => setApiConfigured(false));
  }, []);

  // Fetch real NDVI for a field
  const fetchNdvi = useCallback(async (fieldId) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, loading: true, apiError: null } : f));

    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    const bbox = fieldBbox(field.lat, field.lng, 0.008); // ~1km radius

    try {
      // Fetch current NDVI
      const ndviResp = await fetch(`${API}/api/satellite/ndvi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bbox),
      });

      if (!ndviResp.ok) throw new Error(await ndviResp.text());
      const ndviData = await ndviResp.json();

      // Fetch history
      const histResp = await fetch(`${API}/api/satellite/ndvi-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bbox, days: 90 }),
      });
      const histData = histResp.ok ? await histResp.json() : { history: [] };

      // Calculate trend
      const hist    = histData.history || [];
      const prevNdvi = hist.length >= 2 ? hist[hist.length - 2]?.ndvi : null;
      const trend    = prevNdvi != null ? ndviData.ndvi_mean - prevNdvi : 0;

      setFields(prev => prev.map(f => f.id === fieldId ? {
        ...f,
        ndvi:      ndviData.ndvi_mean,
        trend,
        ndviDate:  ndviData.date,
        ndviStats: ndviData,
        history:   hist,
        lastScan:  'Just now',
        loading:   false,
        realData:  true,
        apiError:  null,
      } : f));

      // Update selected if it's this field
      setSelected(prev => prev?.id === fieldId ? {
        ...prev, ndvi: ndviData.ndvi_mean, trend, ndviDate: ndviData.date,
        ndviStats: ndviData, history: hist, lastScan: 'Just now', loading: false, realData: true, apiError: null,
      } : prev);

    } catch (err) {
      const msg = err.message?.includes('503') ? 'Configure API keys to get real data'
                : err.message?.includes('404') ? 'No cloud-free images found'
                : 'API unavailable — showing demo data';
      setFields(prev => prev.map(f => f.id === fieldId ? { ...f, loading: false, apiError: msg } : f));
    }
  }, [fields]);

  const refreshSelected = () => {
    if (selected && apiConfigured) fetchNdvi(selected.id);
  };

  const handleFieldAdd = useCallback((pt) => setPendingPin(pt), []);

  const submitField = (name, crop, acres) => {
    if (!pendingPin) return;
    const nf = {
      id: `F${String(++fieldIdCounter).padStart(3,'0')}`,
      name: name || 'My Field',
      lat: pendingPin.lat, lng: pendingPin.lng,
      acres, crop,
      ndvi: 0.5, trend: 0,
      lastScan: 'Fetching…',
      history: [], ndviStats: null, loading: true, realData: false, apiError: null, ndviDate: null,
    };
    setFields(p => [...p, nf]);
    setSelected(nf);
    setPendingPin(null);
    // Auto-fetch real NDVI after adding
    if (apiConfigured) {
      setTimeout(() => fetchNdvi(nf.id), 500);
    }
  };

  const deleteField = (id) => {
    setFields(p => p.filter(f => f.id !== id));
    if (selected?.id === id) setSelected(fields.find(f => f.id !== id) || null);
  };

  const avgNdvi     = fields.reduce((s,f) => s+f.ndvi, 0) / (fields.length || 1);
  const realCount   = fields.filter(f => f.realData).length;
  const stressZones = fields.filter(f => {
    const t = { Wheat:0.45, Cotton:0.50, Rice:0.55 }[f.crop] || 0.45;
    return f.ndvi < t;
  }).length;

  return (
    <div style={{ paddingBottom: 8 }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{color:'white',fontWeight:900,fontSize:22,fontFamily:"'Syne',sans-serif",letterSpacing:'-0.03em'}}>Field Monitor 🛰️</h1>
          <div className="flex items-center gap-2 mt-1">
            {apiConfigured === true && (
              <span style={{background:'rgba(22,163,74,0.15)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:6,padding:'2px 8px',color:'#4ade80',fontSize:10,fontWeight:600}}>
                ✅ Sentinel-2 Live
              </span>
            )}
            {apiConfigured === false && (
              <span style={{background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:6,padding:'2px 8px',color:'#fbbf24',fontSize:10,fontWeight:600}}>
                ⚡ Demo Mode
              </span>
            )}
            {realCount > 0 && (
              <span style={{color:'rgba(255,255,255,0.3)',fontSize:10}}>{realCount}/{fields.length} real</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{scale:0.9}} onClick={() => setShowHistory(v => !v)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: showHistory?'rgba(22,163,74,0.15)':'rgba(255,255,255,0.06)', border:`1px solid ${showHistory?'rgba(74,222,128,0.3)':'rgba(255,255,255,0.1)'}` }}>
            <BarChart2 size={15} style={{color:showHistory?'#4ade80':'rgba(255,255,255,0.5)'}}/>
          </motion.button>
        </div>
      </div>

      {/* API setup banner */}
      {apiConfigured === false && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}}
          style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:14,padding:'10px 14px',marginBottom:14}}>
          <p style={{color:'#fbbf24',fontWeight:700,fontSize:12,marginBottom:4}}>🔑 Enable Real Sentinel-2 Data</p>
          <p style={{color:'rgba(255,255,255,0.45)',fontSize:11,lineHeight:1.6}}>
            Get a <b style={{color:'rgba(255,255,255,0.7)'}}>free</b> API key at{' '}
            <a href="https://dataspace.copernicus.eu" target="_blank" rel="noreferrer" style={{color:'#60a5fa'}}>dataspace.copernicus.eu</a>
            {' '}→ Dashboard → OAuth Client. Then add to Render env vars:
            <br/><code style={{color:'#4ade80',fontSize:10}}>COPERNICUS_CLIENT_ID · COPERNICUS_CLIENT_SECRET · COPERNICUS_INSTANCE_ID</code>
          </p>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          {label:'Fields',       value:fields.length,        color:'#60a5fa', icon:'📍'},
          {label:'Avg NDVI',     value:avgNdvi.toFixed(3),   color:getNdviInfo(avgNdvi).color, icon:'🌿'},
          {label:'Stressed',     value:stressZones,          color:stressZones>0?'#f97316':'#4ade80', icon:'⚠️'},
        ].map(s => (
          <div key={s.label} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'10px 8px',textAlign:'center'}}>
            <p style={{fontSize:16,marginBottom:3}}>{s.icon}</p>
            <p style={{color:s.color,fontWeight:800,fontSize:18}}>{s.value}</p>
            <p style={{color:'rgba(255,255,255,0.3)',fontSize:10}}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[{key:'map',label:'🗺️ Map'},{key:'fields',label:'📊 Fields'},{key:'ndvi',label:'🎨 Legend'}].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{background:tab===t.key?'rgba(22,163,74,0.15)':'rgba(255,255,255,0.04)',border:`1px solid ${tab===t.key?'rgba(74,222,128,0.35)':'rgba(255,255,255,0.08)'}`,color:tab===t.key?'#4ade80':'rgba(255,255,255,0.5)'}}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── MAP TAB ── */}
        {tab==='map' && (
          <motion.div key="map" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            {/* City pills */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
              {CITIES.map(c => (
                <button key={c.name} onClick={() => setCity(c)}
                  style={{flexShrink:0,padding:'5px 12px',borderRadius:20,background:city.name===c.name?'rgba(22,163,74,0.2)':'rgba(255,255,255,0.04)',border:`1px solid ${city.name===c.name?'rgba(74,222,128,0.4)':'rgba(255,255,255,0.08)'}`,color:city.name===c.name?'#4ade80':'rgba(255,255,255,0.45)',fontSize:11,fontWeight:600,whiteSpace:'nowrap',cursor:'pointer'}}>
                  <Navigation size={9} style={{display:'inline',marginRight:4}}/>{c.name}
                </button>
              ))}
            </div>

            {/* Map */}
            <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(74,222,128,0.1)',borderRadius:20,padding:10,marginBottom:12}}>
              {leafletReady
                ? <LiveMap city={city} fields={fields} selectedField={selected} onFieldSelect={setSelected} onFieldAdd={handleFieldAdd} wmsConfig={wmsConfig} showNdvi={showNdvi} onNdviToggle={() => setShowNdvi(v=>!v)}/>
                : <div style={{height:320,display:'flex',alignItems:'center',justifyContent:'center'}}><div className="animate-spin" style={{width:24,height:24,border:'2px solid rgba(74,222,128,0.2)',borderTopColor:'#4ade80',borderRadius:'50%'}}/></div>
              }
              <p style={{color:'rgba(255,255,255,0.2)',fontSize:10,textAlign:'center',marginTop:8}}>
                {wmsConfig?.configured ? '✅ Real Sentinel-2 NDVI overlay · 10m resolution' : '🛰️ NASA GIBS NDVI overlay · Tap Add Field to pin your khet'}
              </p>
            </div>

            {/* Add field form */}
            <AnimatePresence>
              {pendingPin && (
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}
                  style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:16,padding:14,marginBottom:12}}>
                  <AddFieldForm location={pendingPin} onSubmit={submitField} onCancel={() => setPendingPin(null)}/>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected field */}
            {selected && (
              <FieldDetail
                field={selected}
                onRefresh={refreshSelected}
                showHistory={showHistory}
              />
            )}
          </motion.div>
        )}

        {/* ── FIELDS TAB ── */}
        {tab==='fields' && (
          <motion.div key="fields" initial={{opacity:0}} animate={{opacity:1}} className="space-y-3">
            {fields.map(field => {
              const info = getNdviInfo(field.ndvi);
              const threshold = {Wheat:0.45,Cotton:0.50,Rice:0.55}[field.crop]||0.45;
              const stressed  = field.ndvi < threshold;
              return (
                <motion.div key={field.id} whileTap={{scale:0.98}}
                  style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${stressed?'rgba(249,115,22,0.2)':'rgba(255,255,255,0.08)'}`,borderRadius:18,padding:16,cursor:'pointer'}}
                  onClick={() => { setSelected(field); setTab('map'); }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <NdviGauge value={field.ndvi} size={52} loading={field.loading}/>
                      <div>
                        <div className="flex items-center gap-2">
                          <p style={{color:'white',fontWeight:700,fontSize:14,fontFamily:"'Syne',sans-serif"}}>{field.name}</p>
                          {field.realData && <CheckCircle size={10} style={{color:'#4ade80'}}/>}
                        </div>
                        <p style={{color:'rgba(255,255,255,0.4)',fontSize:11}}>{field.crop} · {field.acres} ac</p>
                        {stressed && <p style={{color:'#f97316',fontSize:10,marginTop:2}}>⚠️ Below {threshold} threshold</p>}
                        {field.ndviDate && <p style={{color:'rgba(255,255,255,0.2)',fontSize:10}}>📡 {field.ndviDate}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div style={{textAlign:'right'}}>
                        <p style={{color:info.color,fontWeight:700,fontSize:11}}>{info.label}</p>
                        {apiConfigured && !field.realData && !field.loading && (
                          <button onClick={(e) => {e.stopPropagation(); fetchNdvi(field.id);}}
                            style={{background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.2)',borderRadius:6,padding:'2px 8px',color:'#4ade80',fontSize:10,cursor:'pointer',marginTop:2}}>
                            Fetch NDVI
                          </button>
                        )}
                      </div>
                      <button onClick={(e)=>{e.stopPropagation();deleteField(field.id);}}
                        style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'4px 6px',cursor:'pointer'}}>
                        <Trash2 size={12} style={{color:'#f87171'}}/>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Fetch all button */}
            {apiConfigured && (
              <motion.button whileTap={{scale:0.97}}
                onClick={() => fields.forEach(f => { if(!f.realData && !f.loading) fetchNdvi(f.id); })}
                style={{width:'100%',background:'rgba(22,163,74,0.1)',border:'1px solid rgba(74,222,128,0.25)',borderRadius:14,padding:'11px',color:'#4ade80',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                🛰️ Fetch Real NDVI for All Fields
              </motion.button>
            )}

            <div style={{background:'rgba(96,165,250,0.08)',border:'1px solid rgba(96,165,250,0.2)',borderRadius:14,padding:'12px 14px'}}>
              <div className="flex items-center gap-2 mb-1"><Info size={13} style={{color:'#60a5fa'}}/><p style={{color:'#60a5fa',fontWeight:600,fontSize:13}}>About the data</p></div>
              <p style={{color:'rgba(255,255,255,0.45)',fontSize:11,lineHeight:1.6}}>
                {apiConfigured
                  ? 'Using real Sentinel-2 satellite data at 10m resolution. NDVI is calculated from Band 4 (Red) and Band 8 (NIR). Max cloud coverage filter: 30%. Data refreshes every 5 days as new Sentinel-2 passes occur over Pakistan.'
                  : 'Currently showing demo data. Add free Copernicus API credentials to your Render backend to enable real Sentinel-2 NDVI at 10m resolution, updated every 5 days.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── LEGEND TAB ── */}
        {tab==='ndvi' && (
          <motion.div key="ndvi" initial={{opacity:0}} animate={{opacity:1}}>
            <p style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>NDVI COLOR SCALE</p>
            <div className="space-y-2 mb-6">
              {[...NDVI_SCALE].reverse().map((c,i) => (
                <div key={i} className="flex items-center gap-3">
                  <div style={{width:36,height:26,borderRadius:6,background:c.color,flexShrink:0}}/>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p style={{color:'white',fontSize:12,fontWeight:600}}>{c.label}</p>
                      <p style={{color:'rgba(255,255,255,0.4)',fontSize:11,fontFamily:'monospace'}}>{c.min.toFixed(2)}–{c.max.toFixed(2)}</p>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.06)',borderRadius:3,height:3,marginTop:3}}>
                      <div style={{width:`${c.health}%`,background:c.color,height:'100%',borderRadius:3}}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>CROP WARNING THRESHOLDS</p>
            <div className="space-y-2 mb-4">
              {[
                {crop:'🌾 Wheat',warn:0.45,crit:0.30,peak:'0.65–0.80'},
                {crop:'🌿 Cotton',warn:0.50,crit:0.35,peak:'0.60–0.75'},
                {crop:'🍚 Rice',warn:0.55,crit:0.40,peak:'0.70–0.85'},
                {crop:'🥔 Vegetables',warn:0.40,crit:0.25,peak:'0.55–0.70'},
              ].map(t => (
                <div key={t.crop} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'10px 14px'}}>
                  <div className="flex justify-between items-center">
                    <p style={{color:'white',fontSize:13,fontWeight:600}}>{t.crop}</p>
                    <p style={{color:'#4ade80',fontSize:11}}>Peak: {t.peak}</p>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span style={{color:'#eab308',fontSize:11}}>⚠️ Warn &lt; {t.warn}</span>
                    <span style={{color:'#ef4444',fontSize:11}}>🚨 Critical &lt; {t.crit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{background:'rgba(74,222,128,0.05)',border:'1px solid rgba(74,222,128,0.12)',borderRadius:12,padding:'10px 14px'}}>
              <p style={{color:'#4ade80',fontWeight:600,fontSize:12,marginBottom:6}}>🛰️ Data Pipeline</p>
              <div className="space-y-1">
                {[
                  ['Satellite',  'ESA Sentinel-2A/B (free, EU)'],
                  ['Resolution', '10 meters per pixel'],
                  ['Revisit',    'Every 5 days over Pakistan'],
                  ['NDVI bands', 'B08 (NIR) and B04 (Red)'],
                  ['Cloud mask', 'Max 30% cloud coverage'],
                  ['Base map',   'ESRI World Imagery'],
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between">
                    <p style={{color:'rgba(255,255,255,0.35)',fontSize:11}}>{k}</p>
                    <p style={{color:'rgba(255,255,255,0.6)',fontSize:11}}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}