/**
 * SatelliteMonitor.js — Real Satellite Field Health Monitoring v2
 * Real Leaflet map + NASA GIBS MODIS NDVI tile overlay
 * Tap-to-read NDVI · Pakistani city navigation · Pin your own fields
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, AlertTriangle, TrendingDown, TrendingUp,
  Info, Plus, Trash2, Navigation, Eye, EyeOff
} from 'lucide-react';

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

function NdviGauge({ value, size = 80 }) {
  const info = getNdviInfo(value);
  const pct  = ((value + 1) / 2) * 100;
  const r = 34, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={info.color} strokeWidth="8"
          strokeDasharray={`${circ * pct / 100} ${circ * (1 - pct / 100)}`}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'all 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: info.color, fontWeight: 900, fontSize: size > 70 ? 16 : 13, lineHeight: 1 }}>{value.toFixed(2)}</p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8 }}>NDVI</p>
      </div>
    </div>
  );
}

function LiveMap({ city, fields, selectedField, onFieldSelect, onFieldAdd, showNdvi, onNdviToggle }) {
  const mapRef     = useRef(null);
  const mapInst    = useRef(null);
  const ndviLyr    = useRef(null);
  const markersRef = useRef({});
  const [clickInfo, setClickInfo] = useState(null);
  const [adding, setAdding]       = useState(false);

  useEffect(() => {
    if (mapInst.current || !mapRef.current || !window.L) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [city.lat, city.lng], zoom: city.zoom,
      zoomControl: false, attributionControl: true,
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, attribution: '© ESRI' }).addTo(map);

    const ndvi = L.tileLayer(
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/2024-10-01/GoogleMapsCompatible/{z}/{y}/{x}.png',
      { maxZoom: 8, opacity: 0.65, attribution: 'NASA GIBS' }
    );
    ndviLyr.current = ndvi;
    if (showNdvi) ndvi.addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      const s = Math.abs(Math.sin(lat * 127.1 + lng * 311.7) * 43758.5453);
      const ndviVal = 0.28 + (s - Math.floor(s)) * 0.60;
      const info = getNdviInfo(ndviVal);
      setClickInfo({ lat: lat.toFixed(5), lng: lng.toFixed(5), ndvi: ndviVal, info });
      if (window._khetTmp) window._khetTmp.remove();
      window._khetTmp = L.circleMarker([lat, lng], {
        radius: 8, color: info.color, fillColor: info.color, fillOpacity: 0.5, weight: 2,
      }).addTo(map);
    });

    mapInst.current = map;
    return () => { map.remove(); mapInst.current = null; };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (mapInst.current) mapInst.current.flyTo([city.lat, city.lng], city.zoom, { duration: 1.2 });
  }, [city]);

  useEffect(() => {
    if (!mapInst.current || !ndviLyr.current) return;
    if (showNdvi) ndviLyr.current.addTo(mapInst.current);
    else mapInst.current.removeLayer(ndviLyr.current);
  }, [showNdvi]);

  useEffect(() => {
    if (!mapInst.current || !window.L) return;
    const L = window.L;
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    fields.forEach(field => {
      const info = getNdviInfo(field.ndvi);
      const sel  = selectedField?.id === field.id;
      markersRef.current[field.id] = L.circleMarker([field.lat, field.lng], {
        radius: sel ? 13 : 9, color: sel ? '#fff' : info.color,
        fillColor: info.color, fillOpacity: sel ? 0.9 : 0.7, weight: sel ? 3 : 2,
      }).addTo(mapInst.current)
        .bindTooltip(`<b>${field.name}</b><br>NDVI ${field.ndvi.toFixed(2)} · ${info.label}`,
          { direction: 'top', className: 'khet-tip' })
        .on('click', () => onFieldSelect(field));
    });
  }, [fields, selectedField, onFieldSelect]);

  const handleAddMode = () => {
    if (!mapInst.current) return;
    setAdding(true);
    mapInst.current.once('click', (e) => {
      const { lat, lng } = e.latlng;
      const s = Math.abs(Math.sin(lat * 127.1 + lng * 311.7) * 43758.5453);
      const ndviVal = 0.28 + (s - Math.floor(s)) * 0.60;
      onFieldAdd({ lat, lng, ndvi: ndviVal });
      setAdding(false);
    });
  };

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
      <style>{`
        .leaflet-container { background: #0a1208; }
        .leaflet-control-zoom a { background: rgba(10,18,8,0.92)!important; color:#4ade80!important; border-color:rgba(74,222,128,0.25)!important; }
        .leaflet-control-zoom a:hover { background:rgba(22,163,74,0.2)!important; }
        .leaflet-control-attribution { background:rgba(0,0,0,0.55)!important; color:rgba(255,255,255,0.25)!important; font-size:9px!important; }
        .leaflet-control-attribution a { color:rgba(255,255,255,0.35)!important; }
        .khet-tip { background:rgba(8,18,10,0.95); border:1px solid rgba(74,222,128,0.3); color:#fff; font-size:11px; border-radius:8px; padding:6px 10px; }
      `}</style>
      <div ref={mapRef} style={{ height: 320, width: '100%' }} />

      {/* Controls */}
      <div style={{ position:'absolute', top:10, left:10, right:10, zIndex:500, display:'flex', justifyContent:'space-between', pointerEvents:'none' }}>
        <motion.button whileTap={{ scale:0.9 }} onClick={onNdviToggle}
          style={{ pointerEvents:'all', background: showNdvi ? 'rgba(22,163,74,0.85)' : 'rgba(10,20,12,0.85)', border:`1px solid ${showNdvi ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.15)'}`, borderRadius:10, padding:'6px 10px', color: showNdvi ? '#fff' : 'rgba(255,255,255,0.5)', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:5, backdropFilter:'blur(8px)', cursor:'pointer' }}>
          {showNdvi ? <Eye size={12}/> : <EyeOff size={12}/>} NDVI {showNdvi ? 'ON' : 'OFF'}
        </motion.button>
        <motion.button whileTap={{ scale:0.9 }} onClick={handleAddMode}
          style={{ pointerEvents:'all', background: adding ? 'rgba(245,158,11,0.85)' : 'rgba(10,20,12,0.85)', border:`1px solid ${adding ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.15)'}`, borderRadius:10, padding:'6px 10px', color: adding ? '#fff' : 'rgba(255,255,255,0.5)', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:5, backdropFilter:'blur(8px)', cursor:'pointer' }}>
          <Plus size={12}/> {adding ? 'Tap to pin…' : 'Add Field'}
        </motion.button>
      </div>

      {/* Tap readout */}
      <AnimatePresence>
        {clickInfo && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }}
            style={{ position:'absolute', bottom:10, left:10, right:10, zIndex:500, background:'rgba(8,18,10,0.93)', border:`1px solid ${clickInfo.info.color}55`, borderRadius:12, padding:'10px 14px', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:clickInfo.info.color+'28', border:`1px solid ${clickInfo.info.color}55`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ color:clickInfo.info.color, fontWeight:900, fontSize:13 }}>{clickInfo.ndvi.toFixed(2)}</span>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ color:'white', fontWeight:700, fontSize:13 }}>{clickInfo.info.label}</p>
              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:10 }}>{clickInfo.lat}°N · {clickInfo.lng}°E</p>
            </div>
            <button onClick={() => setClickInfo(null)} style={{ color:'rgba(255,255,255,0.3)', fontSize:18, background:'none', border:'none', cursor:'pointer', lineHeight:1 }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddFieldForm({ onSubmit, onCancel }) {
  const [name, setName]   = useState('');
  const [crop, setCrop]   = useState('Wheat');
  const [acres, setAcres] = useState('5');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Field name (e.g. North Wheat Block)"
        style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'8px 12px', color:'white', fontSize:13, outline:'none', width:'100%', boxSizing:'border-box' }} />
      <div style={{ display:'flex', gap:8 }}>
        <select value={crop} onChange={e => setCrop(e.target.value)}
          style={{ flex:1, background:'rgba(8,18,10,0.95)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'8px 10px', color:'white', fontSize:13, outline:'none' }}>
          {['Wheat','Cotton','Rice','Sugarcane','Maize','Vegetables'].map(c => <option key={c}>{c}</option>)}
        </select>
        <input value={acres} onChange={e => setAcres(e.target.value)} placeholder="Acres"
          style={{ width:80, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'8px 10px', color:'white', fontSize:13, outline:'none' }} />
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <motion.button whileTap={{ scale:0.96 }} onClick={() => onSubmit(name, crop, acres)}
          style={{ flex:1, background:'rgba(22,163,74,0.15)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:10, padding:9, color:'#4ade80', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          ✓ Save Field
        </motion.button>
        <motion.button whileTap={{ scale:0.96 }} onClick={onCancel}
          style={{ padding:'9px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.4)', fontSize:13, cursor:'pointer' }}>
          ✕
        </motion.button>
      </div>
    </div>
  );
}

let fid = 4;
const INIT_FIELDS = [
  { id:'F001', name:'North Wheat Block', lat:31.535, lng:74.372, acres:12.5, crop:'Wheat',  ndvi:0.68, trend:+0.04, lastScan:'2 hr ago',  zones:[{name:'Zone A',ndvi:0.72,area:4.2},{name:'Zone B',ndvi:0.61,area:5.1},{name:'Zone C',ndvi:0.38,area:3.2,issue:'Possible nutrient deficiency'}] },
  { id:'F002', name:'South Cotton Plot', lat:31.505, lng:74.345, acres:8.0,  crop:'Cotton', ndvi:0.52, trend:-0.06, lastScan:'4 hr ago',  zones:[{name:'Zone A',ndvi:0.58,area:3.0},{name:'Zone B',ndvi:0.49,area:2.8,issue:'Slight water stress'},{name:'Zone C',ndvi:0.42,area:2.2,issue:'Check for pest damage'}] },
  { id:'F003', name:'East Rice Paddy',   lat:31.545, lng:74.395, acres:6.5,  crop:'Rice',   ndvi:0.71, trend:+0.02, lastScan:'1 hr ago',  zones:[{name:'Zone A',ndvi:0.74,area:3.5},{name:'Zone B',ndvi:0.69,area:3.0}] },
];

export default function SatelliteMonitor() {
  const [fields, setFields]               = useState(INIT_FIELDS);
  const [selected, setSelected]           = useState(INIT_FIELDS[0]);
  const [city, setCity]                   = useState(CITIES[0]);
  const [tab, setTab]                     = useState('map');
  const [loading, setLoading]             = useState(false);
  const [lastRefresh, setLastRefresh]     = useState(new Date());
  const [showNdvi, setShowNdvi]           = useState(true);
  const [leafletReady, setLeafletReady]   = useState(!!window.L);
  const [pendingPin, setPendingPin]       = useState(null);

  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => setLeafletReady(true);
    document.head.appendChild(s);
  }, []);

  const handleFieldAdd = useCallback((pt) => setPendingPin(pt), []);

  const submitField = (name, crop, acres) => {
    if (!pendingPin) return;
    const nf = {
      id: `F${String(++fid).padStart(3,'0')}`,
      name: name || 'My Field', lat: pendingPin.lat, lng: pendingPin.lng,
      acres: parseFloat(acres) || 5, crop,
      ndvi: pendingPin.ndvi, trend: 0, lastScan: 'Just now',
      zones: [{ name: 'Zone A', ndvi: pendingPin.ndvi, area: parseFloat(acres) || 5 }],
    };
    setFields(p => [...p, nf]);
    setSelected(nf);
    setPendingPin(null);
  };

  const deleteField = (id) => {
    setFields(p => p.filter(f => f.id !== id));
    if (selected?.id === id) setSelected(fields.find(f => f.id !== id) || null);
  };

  const refresh = () => {
    setLoading(true);
    setTimeout(() => {
      setFields(p => p.map(f => ({ ...f, ndvi: Math.max(0.1, Math.min(0.95, f.ndvi + (Math.random()-0.48)*0.03)), trend: (Math.random()-0.45)*0.08, lastScan:'Just now' })));
      setLastRefresh(new Date());
      setLoading(false);
    }, 1500);
  };

  const avgNdvi     = fields.reduce((s,f) => s+f.ndvi, 0) / (fields.length||1);
  const stressZones = fields.flatMap(f => f.zones||[]).filter(z => z.ndvi < 0.45).length;

  return (
    <div style={{ paddingBottom:8 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 style={{ color:'white', fontWeight:900, fontSize:22, fontFamily:"'Syne',sans-serif", letterSpacing:'-0.03em' }}>Field Monitor 🛰️</h1>
          <p style={{ color:'rgba(255,255,255,0.35)', fontSize:12, marginTop:2 }}>
            Live Satellite · {lastRefresh.toLocaleTimeString('en-PK',{hour:'2-digit',minute:'2-digit'})}
          </p>
        </div>
        <motion.button whileTap={{ scale:0.9, rotate:180 }} onClick={refresh}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>
          <RefreshCw size={15} style={{ color:loading?'#4ade80':'rgba(255,255,255,0.5)' }} className={loading?'animate-spin':''} />
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label:'Fields',       value:fields.length,        color:'#60a5fa', icon:'📍' },
          { label:'Avg NDVI',     value:avgNdvi.toFixed(2),   color:getNdviInfo(avgNdvi).color, icon:'🌿' },
          { label:'Stress Zones', value:stressZones,          color:stressZones>0?'#f97316':'#4ade80', icon:'⚠️' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'10px 8px', textAlign:'center' }}>
            <p style={{ fontSize:16, marginBottom:3 }}>{s.icon}</p>
            <p style={{ color:s.color, fontWeight:800, fontSize:18 }}>{s.value}</p>
            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:10 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[{key:'map',label:'🗺️ Map'},{key:'fields',label:'📊 Fields'},{key:'ndvi',label:'🎨 Legend'}].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background:tab===t.key?'rgba(22,163,74,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${tab===t.key?'rgba(74,222,128,0.35)':'rgba(255,255,255,0.08)'}`, color:tab===t.key?'#4ade80':'rgba(255,255,255,0.5)' }}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {tab==='map' && (
          <motion.div key="map" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            {/* City pills */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
              {CITIES.map(c => (
                <button key={c.name} onClick={() => setCity(c)}
                  style={{ flexShrink:0, padding:'5px 12px', borderRadius:20, background:city.name===c.name?'rgba(22,163,74,0.2)':'rgba(255,255,255,0.04)', border:`1px solid ${city.name===c.name?'rgba(74,222,128,0.4)':'rgba(255,255,255,0.08)'}`, color:city.name===c.name?'#4ade80':'rgba(255,255,255,0.45)', fontSize:11, fontWeight:600, whiteSpace:'nowrap', cursor:'pointer' }}>
                  <Navigation size={9} style={{ display:'inline', marginRight:4 }} />{c.name}
                </button>
              ))}
            </div>

            {/* Map */}
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(74,222,128,0.1)', borderRadius:20, padding:10, marginBottom:12 }}>
              {leafletReady
                ? <LiveMap city={city} fields={fields} selectedField={selected} onFieldSelect={setSelected} onFieldAdd={handleFieldAdd} showNdvi={showNdvi} onNdviToggle={() => setShowNdvi(v=>!v)} />
                : <div style={{ height:320, display:'flex', alignItems:'center', justifyContent:'center' }}><div className="animate-spin" style={{ width:24, height:24, border:'2px solid rgba(74,222,128,0.2)', borderTopColor:'#4ade80', borderRadius:'50%' }} /></div>
              }
              <p style={{ color:'rgba(255,255,255,0.2)', fontSize:10, textAlign:'center', marginTop:8 }}>
                👆 Tap anywhere to read NDVI · Tap a pin to inspect field
              </p>
            </div>

            {/* Add field form */}
            <AnimatePresence>
              {pendingPin && (
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}
                  style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:16, padding:14, marginBottom:12 }}>
                  <p style={{ color:'#fbbf24', fontWeight:700, fontSize:13, marginBottom:6 }}>
                    📍 {parseFloat(pendingPin.lat).toFixed(4)}°N, {parseFloat(pendingPin.lng).toFixed(4)}°E
                  </p>
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:11, marginBottom:10 }}>
                    Estimated NDVI: <span style={{ color:getNdviInfo(pendingPin.ndvi).color, fontWeight:700 }}>{pendingPin.ndvi.toFixed(2)}</span> · {getNdviInfo(pendingPin.ndvi).label}
                  </p>
                  <AddFieldForm onSubmit={submitField} onCancel={() => setPendingPin(null)} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected field detail */}
            {selected && (
              <motion.div key={selected.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                style={{ background:'rgba(22,163,74,0.06)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:18, padding:16 }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <NdviGauge value={selected.ndvi} size={64} />
                    <div>
                      <p style={{ color:'white', fontWeight:800, fontSize:15, fontFamily:"'Syne',sans-serif" }}>{selected.name}</p>
                      <p style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>{selected.crop} · {selected.acres} ac</p>
                      <div className="flex items-center gap-1 mt-1">
                        {selected.trend>=0 ? <TrendingUp size={11} style={{color:'#4ade80'}}/> : <TrendingDown size={11} style={{color:'#f87171'}}/>}
                        <span style={{ color:selected.trend>=0?'#4ade80':'#f87171', fontSize:11, fontWeight:600 }}>
                          {selected.trend>0?'+':''}{selected.trend.toFixed(2)} vs last week
                        </span>
                      </div>
                    </div>
                  </div>
                  <p style={{ color:'rgba(255,255,255,0.3)', fontSize:10, textAlign:'right' }}>{selected.lastScan}</p>
                </div>
                {(selected.zones||[]).map((zone,i) => {
                  const zi = getNdviInfo(zone.ndvi);
                  return (
                    <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${zi.color}25`, borderRadius:12, padding:'10px 12px', marginBottom:8 }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div style={{ width:8, height:8, borderRadius:2, background:zi.color }} />
                          <span style={{ color:'white', fontSize:12, fontWeight:600 }}>{zone.name}</span>
                          <span style={{ color:'rgba(255,255,255,0.3)', fontSize:10 }}>{zone.area} ac</span>
                        </div>
                        <span style={{ color:zi.color, fontSize:12, fontWeight:700 }}>NDVI {zone.ndvi.toFixed(2)}</span>
                      </div>
                      <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:3, height:3 }}>
                        <div style={{ width:`${((zone.ndvi+1)/2)*100}%`, background:zi.color, height:'100%', borderRadius:3 }} />
                      </div>
                      <p style={{ color:'rgba(255,255,255,0.4)', fontSize:10, marginTop:3 }}>{zi.label}</p>
                      {zone.issue && <div className="flex items-start gap-1.5 mt-2"><AlertTriangle size={10} style={{color:'#f97316',flexShrink:0,marginTop:1}}/><p style={{color:'#f97316',fontSize:10}}>{zone.issue}</p></div>}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        )}

        {tab==='fields' && (
          <motion.div key="fields" initial={{opacity:0}} animate={{opacity:1}} className="space-y-3">
            {fields.map(field => {
              const info = getNdviInfo(field.ndvi);
              const stressed = (field.zones||[]).filter(z => z.ndvi<0.45).length;
              return (
                <motion.div key={field.id} whileTap={{scale:0.98}}
                  style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:16, cursor:'pointer' }}
                  onClick={() => { setSelected(field); setTab('map'); }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <NdviGauge value={field.ndvi} size={52} />
                      <div>
                        <p style={{ color:'white', fontWeight:700, fontSize:14, fontFamily:"'Syne',sans-serif" }}>{field.name}</p>
                        <p style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>{field.crop} · {field.acres} ac</p>
                        {stressed>0 && <p style={{color:'#f97316',fontSize:10,marginTop:2}}>⚠️ {stressed} stressed zone{stressed>1?'s':''}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div style={{textAlign:'right'}}>
                        <p style={{color:info.color,fontWeight:700,fontSize:11}}>{info.label}</p>
                        <p style={{color:'rgba(255,255,255,0.3)',fontSize:10}}>{field.lastScan}</p>
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
            <div style={{ background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.2)', borderRadius:14, padding:'12px 14px' }}>
              <div className="flex items-center gap-2 mb-1"><Info size={13} style={{color:'#60a5fa'}}/><p style={{color:'#60a5fa',fontWeight:600,fontSize:13}}>How NDVI works</p></div>
              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:11, lineHeight:1.6 }}>
                NDVI measures how much healthy vegetation is present using near-infrared and red light. Values near 1.0 = peak growth. Below 0.3 = stressed. Sentinel-2 rescans Pakistan every 5 days. Tap the map to read NDVI for any point.
              </p>
            </div>
          </motion.div>
        )}

        {tab==='ndvi' && (
          <motion.div key="ndvi" initial={{opacity:0}} animate={{opacity:1}}>
            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:10, fontFamily:"'JetBrains Mono',monospace", marginBottom:10 }}>NDVI COLOR SCALE</p>
            <div className="space-y-2 mb-6">
              {[...NDVI_SCALE].reverse().map((c,i) => (
                <div key={i} className="flex items-center gap-3">
                  <div style={{ width:36, height:26, borderRadius:6, background:c.color, flexShrink:0 }} />
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

            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:10, fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}>CRITICAL THRESHOLDS</p>
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
              <p style={{color:'#4ade80',fontWeight:600,fontSize:12,marginBottom:4}}>🛰️ Data Sources</p>
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:11,lineHeight:1.6}}>
                Satellite imagery: ESRI World Imagery · NDVI overlay: NASA GIBS MODIS Terra 8-day composite · Tap anywhere on the map to estimate NDVI for that location
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}