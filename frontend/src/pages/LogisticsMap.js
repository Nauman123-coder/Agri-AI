import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin, Navigation, Package, Star, Truck,
  BadgeCheck, Search, AlertCircle, Loader2,
  Phone, Clock, ChevronDown, ChevronUp, LocateFixed
} from 'lucide-react';

// ── Fix Leaflet default icon ─────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Icons ────────────────────────────────────────────────────────────────────
const farmerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:36px;height:36px;
    background:linear-gradient(135deg,#00FF7F,#00cc66);
    border:3px solid white;
    border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-size:16px;
    box-shadow:0 0 0 4px rgba(0,255,127,0.3),0 4px 12px rgba(0,0,0,0.5);
  ">👨‍🌾</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

const makeShopIcon = (color, emoji) => L.divIcon({
  className: '',
  html: `<div style="
    width:32px;height:36px;
    background:${color};
    border:2px solid rgba(255,255,255,0.85);
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 3px 10px rgba(0,0,0,0.5);
    display:flex;align-items:center;justify-content:center;
  "><div style="transform:rotate(45deg);font-size:13px;margin-top:2px;margin-right:2px;">${emoji}</div></div>`,
  iconSize: [32, 36],
  iconAnchor: [16, 36],
  popupAnchor: [0, -38],
});

const SHOP_ICONS = {
  agri_store:    makeShopIcon('#00FF7F', '🌿'),
  pesticide:     makeShopIcon('#FF6B35', '🧪'),
  fertilizer:    makeShopIcon('#FFD700', '⚗️'),
  seed:          makeShopIcon('#007AFF', '🌱'),
  hardware:      makeShopIcon('#AA77FF', '🔧'),
  general:       makeShopIcon('#888',    '🏪'),
};

// ── Haversine distance (km) ──────────────────────────────────────────────────
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Query OpenStreetMap Overpass API for real agri shops ─────────────────────
async function fetchNearbyShops(lat, lng, radiusKm = 20) {
  const r = radiusKm * 1000; // metres

  // Search for agriculture shops, garden centres, farm supply stores
  const query = `
    [out:json][timeout:25];
    (
      node["shop"="agrarian"](around:${r},${lat},${lng});
      node["shop"="garden_centre"](around:${r},${lat},${lng});
      node["shop"="farm"](around:${r},${lat},${lng});
      node["shop"="hardware"](around:${r},${lat},${lng});
      node["amenity"="marketplace"](around:${r},${lat},${lng});
      node["landuse"="farm_auxiliary"](around:${r},${lat},${lng});
      node["name"~"agri|kissan|kisan|khet|farm|nursery|beejan|seeds|khad|fertilizer|pesticide",i](around:${r},${lat},${lng});
      way["name"~"agri|kissan|kisan|khet|farm|nursery|beejan|seeds|khad|fertilizer|pesticide",i](around:${r},${lat},${lng});
    );
    out body center;
  `;

  const url = 'https://overpass-api.de/api/interpreter';
  const res = await fetch(url, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!res.ok) throw new Error('Overpass API error');
  const data = await res.json();

  return data.elements
    .filter(el => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      return elLat && elLng;
    })
    .map(el => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      const tags = el.tags || {};
      const name = tags.name || tags['name:en'] || tags['name:ur'] || 'Agri Shop';
      const shop = tags.shop || '';
      const type =
        shop === 'agrarian'       ? 'agri_store' :
        shop === 'garden_centre'  ? 'seed'        :
        shop === 'hardware'       ? 'hardware'    :
        name.match(/pesticide|spray|dawai/i) ? 'pesticide'  :
        name.match(/fertilizer|khad|urea/i)  ? 'fertilizer' :
        name.match(/seed|beejan|nursery/i)   ? 'seed'        :
        'agri_store';

      return {
        id:       String(el.id),
        name,
        type,
        lat:      elLat,
        lng:      elLng,
        phone:    tags.phone || tags['contact:phone'] || null,
        opening:  tags.opening_hours || null,
        distance: getDistanceKm(lat, lng, elLat, elLng),
        address:  [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ') || null,
      };
    })
    .sort((a, b) => a.distance - b.distance); // nearest first
}

// ── Component: recenter map when location changes ────────────────────────────
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 13); }, [center]);
  return null;
}

// ── Pakistani cities for manual fallback ─────────────────────────────────────
const PAKISTAN_CITIES = [
  { name: 'Lahore',      lat: 31.5204, lng: 74.3587 },
  { name: 'Faisalabad',  lat: 31.4504, lng: 73.1350 },
  { name: 'Multan',      lat: 30.1575, lng: 71.5249 },
  { name: 'Sahiwal',     lat: 30.6706, lng: 73.1064 },
  { name: 'Gujranwala',  lat: 32.1877, lng: 74.1945 },
  { name: 'Sialkot',     lat: 32.4945, lng: 74.5229 },
  { name: 'Bahawalpur',  lat: 29.3956, lng: 71.6722 },
  { name: 'Sargodha',    lat: 32.0836, lng: 72.6711 },
  { name: 'Hyderabad',   lat: 25.3960, lng: 68.3578 },
  { name: 'Karachi',     lat: 24.8607, lng: 67.0011 },
  { name: 'Sukkur',      lat: 27.7052, lng: 68.8574 },
  { name: 'Larkana',     lat: 27.5570, lng: 68.2247 },
  { name: 'Peshawar',    lat: 34.0151, lng: 71.5249 },
  { name: 'Rawalpindi',  lat: 33.5651, lng: 73.0169 },
  { name: 'Okara',       lat: 30.8099, lng: 73.4448 },
  { name: 'Rahim Yar Khan', lat: 28.4212, lng: 70.2957 },
];

const RADIUS_OPTIONS = [5, 10, 20, 50];

const TYPE_LABELS = {
  agri_store:  { label: 'Agri Store',  color: '#00FF7F', emoji: '🌿' },
  pesticide:   { label: 'Pesticides',  color: '#FF6B35', emoji: '🧪' },
  fertilizer:  { label: 'Fertilizers', color: '#FFD700', emoji: '⚗️' },
  seed:        { label: 'Seeds',       color: '#007AFF', emoji: '🌱' },
  hardware:    { label: 'Hardware',    color: '#AA77FF', emoji: '🔧' },
  general:     { label: 'General',     color: '#888',    emoji: '🏪' },
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function LogisticsMap() {
  const [location, setLocation]         = useState(null);   // { lat, lng, name }
  const [shops, setShops]               = useState([]);
  const [filter, setFilter]             = useState('all');
  const [radius, setRadius]             = useState(20);
  const [selectedShop, setSelectedShop] = useState(null);
  const [expandedShop, setExpandedShop] = useState(null);
  const [gpsStatus, setGpsStatus]       = useState('idle'); // idle|loading|success|denied
  const [searchStatus, setSearchStatus] = useState('idle'); // idle|loading|done|error
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [citySearch, setCitySearch]     = useState('');

  // ── Get GPS location ────────────────────────────────────────────────────────
  const getGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }
    setGpsStatus('loading');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: 'Your Location' };
        setLocation(loc);
        setGpsStatus('success');
        loadShops(loc);
      },
      () => setGpsStatus('denied'),
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // ── Load shops from Overpass ─────────────────────────────────────────────────
  const loadShops = async (loc, r = radius) => {
    setSearchStatus('loading');
    setShops([]);
    setSelectedShop(null);
    try {
      const results = await fetchNearbyShops(loc.lat, loc.lng, r);
      setShops(results);
      setSearchStatus(results.length === 0 ? 'empty' : 'done');
    } catch {
      setSearchStatus('error');
    }
  };

  const selectCity = (city) => {
    const loc = { lat: city.lat, lng: city.lng, name: city.name };
    setLocation(loc);
    setShowCityPicker(false);
    setCitySearch('');
    loadShops(loc);
  };

  const handleRadiusChange = (r) => {
    setRadius(r);
    if (location) loadShops(location, r);
  };

  const filteredShops = filter === 'all' ? shops : shops.filter(s => s.type === filter);

  const filteredCities = PAKISTAN_CITIES.filter(c =>
    c.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  const mapCenter = location ? [location.lat, location.lng] : [30.5, 72.0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="section-title text-2xl">Nearby Agri Shops</h2>
        <p className="text-white/40 text-sm mt-0.5 urdu-text">قریبی زرعی دکانیں</p>
      </div>

      {/* Location Bar */}
      <div className="glass-card p-3 space-y-3">
        <div className="flex items-center gap-2">
          {/* GPS Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={getGPS}
            disabled={gpsStatus === 'loading'}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0 ${
              gpsStatus === 'success'
                ? 'bg-khet-500/20 text-khet-500 border border-khet-500/40'
                : gpsStatus === 'denied'
                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
            }`}
          >
            {gpsStatus === 'loading'
              ? <Loader2 size={13} className="animate-spin" />
              : <LocateFixed size={13} />
            }
            {gpsStatus === 'success' ? 'GPS Active' : gpsStatus === 'denied' ? 'GPS Denied' : 'Use GPS'}
          </motion.button>

          {/* City Picker Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCityPicker(!showCityPicker)}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-left"
          >
            <MapPin size={13} className="text-khet-500 flex-shrink-0" />
            <span className="truncate">{location ? location.name : 'Select your city / شہر منتخب کریں'}</span>
            <ChevronDown size={13} className="ml-auto flex-shrink-0" />
          </motion.button>
        </div>

        {/* City Picker Dropdown */}
        <AnimatePresence>
          {showCityPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <input
                type="text"
                placeholder="Search city..."
                value={citySearch}
                onChange={e => setCitySearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-khet-500/40 mb-2"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                {filteredCities.map(city => (
                  <motion.button
                    key={city.name}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => selectCity(city)}
                    className={`text-left px-3 py-2 rounded-lg text-xs transition-all ${
                      location?.name === city.name
                        ? 'bg-khet-500/20 text-khet-500 border border-khet-500/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    📍 {city.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Radius Selector */}
        {location && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 flex-shrink-0">Search radius:</span>
            <div className="flex gap-1.5">
              {RADIUS_OPTIONS.map(r => (
                <motion.button
                  key={r}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRadiusChange(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    radius === r
                      ? 'bg-khet-500/20 text-khet-500 border border-khet-500/40'
                      : 'text-white/40 border border-white/10 hover:text-white'
                  }`}
                >
                  {r}km
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Chips — only show after search */}
      {shops.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', ...Object.keys(TYPE_LABELS)].map(t => {
            const count = t === 'all' ? shops.length : shops.filter(s => s.type === t).length;
            if (count === 0 && t !== 'all') return null;
            const info = TYPE_LABELS[t];
            return (
              <motion.button
                key={t}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(t)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filter === t
                    ? 'bg-khet-500/20 text-khet-500 border border-khet-500/40'
                    : 'border border-white/10 text-white/50 hover:text-white'
                }`}
              >
                {t !== 'all' && <span>{info.emoji}</span>}
                {t === 'all' ? 'All' : info.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter === t ? 'bg-khet-500/30' : 'bg-white/10'}`}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Status Messages */}
      {!location && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-khet-500/10 border border-khet-500/20 flex items-center justify-center">
            <Navigation size={28} className="text-khet-500" />
          </div>
          <div className="text-center">
            <p className="text-white/70 text-sm font-semibold">Find agri shops near you</p>
            <p className="text-white/30 text-xs mt-1 urdu-text">اپنے قریبی زرعی دکانیں تلاش کریں</p>
          </div>
          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={getGPS}
              className="khet-button text-sm px-4 py-2 flex items-center gap-2">
              <LocateFixed size={14} /> Use My GPS
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowCityPicker(true)}
              className="px-4 py-2 rounded-xl border border-white/20 text-white/60 text-sm hover:text-white transition-colors">
              Pick City
            </motion.button>
          </div>
        </motion.div>
      )}

      {searchStatus === 'loading' && (
        <div className="flex items-center justify-center gap-3 py-8 text-white/40">
          <Loader2 size={18} className="animate-spin text-khet-500" />
          <div>
            <p className="text-sm">Searching OpenStreetMap...</p>
            <p className="text-xs urdu-text">نقشے پر تلاش جاری ہے</p>
          </div>
        </div>
      )}

      {searchStatus === 'empty' && (
        <div className="glass-card p-5 text-center space-y-2">
          <p className="text-white/50 text-sm">No agri shops found within {radius}km</p>
          <p className="text-white/30 text-xs">Try increasing the search radius to 50km</p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleRadiusChange(50)}
            className="mt-2 px-4 py-1.5 rounded-xl border border-white/20 text-white/60 text-xs hover:text-white transition-colors">
            Search 50km radius
          </motion.button>
        </div>
      )}

      {searchStatus === 'error' && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl"
          style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)' }}>
          <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-red-400 font-semibold">Map search failed</p>
            <p className="text-xs text-white/40">OpenStreetMap may be slow. Try again in a moment.</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => loadShops(location)}
            className="ml-auto px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 text-xs">
            Retry
          </motion.button>
        </div>
      )}

      {/* MAP */}
      {location && searchStatus !== 'loading' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl overflow-hidden border border-white/10"
          style={{ height: '360px' }}
        >
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <MapRecenter center={mapCenter} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> &copy; <a href="https://carto.com">CARTO</a>'
              maxZoom={19}
            />

            {/* Search radius circle */}
            <Circle
              center={[location.lat, location.lng]}
              radius={radius * 1000}
              pathOptions={{ color: '#00FF7F', fillColor: '#00FF7F', fillOpacity: 0.04, weight: 1, dashArray: '6 4' }}
            />

            {/* Farmer location marker */}
            <Marker position={[location.lat, location.lng]} icon={farmerIcon}>
              <Popup>
                <div style={{ fontFamily: 'DM Sans,sans-serif', background: '#1a1a1a', color: '#fff', padding: '8px 10px', borderRadius: 8, minWidth: 130 }}>
                  <p style={{ fontWeight: 700, margin: '0 0 2px', fontSize: 13 }}>📍 {location.name}</p>
                  <p style={{ color: '#00FF7F', fontSize: 11, margin: 0 }}>Your location</p>
                </div>
              </Popup>
            </Marker>

            {/* Shop markers */}
            {filteredShops.map(shop => (
              <Marker
                key={shop.id}
                position={[shop.lat, shop.lng]}
                icon={SHOP_ICONS[shop.type] || SHOP_ICONS.general}
                eventHandlers={{ click: () => setSelectedShop(shop) }}
              >
                <Popup>
                  <div style={{ fontFamily: 'DM Sans,sans-serif', background: '#1a1a1a', color: '#fff', padding: '8px 10px', borderRadius: 8, minWidth: 160 }}>
                    <p style={{ fontWeight: 700, margin: '0 0 2px', fontSize: 13 }}>{shop.name}</p>
                    <p style={{ color: '#aaa', fontSize: 11, margin: '0 0 4px' }}>{shop.address || 'Address not listed'}</p>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                      <span style={{ color: '#00FF7F' }}>📍 {shop.distance.toFixed(1)}km away</span>
                      {shop.phone && <span style={{ color: '#aaa' }}>📞</span>}
                    </div>
                    <p style={{ color: TYPE_LABELS[shop.type]?.color || '#888', fontSize: 11, margin: '4px 0 0', textTransform: 'capitalize' }}>
                      {TYPE_LABELS[shop.type]?.emoji} {TYPE_LABELS[shop.type]?.label || 'Agri Shop'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </motion.div>
      )}

      {/* Results count */}
      {searchStatus === 'done' && (
        <div className="flex items-center justify-between text-xs text-white/30">
          <span className="font-mono">{filteredShops.length} shops found within {radius}km</span>
          <span>Sorted by distance · OpenStreetMap</span>
        </div>
      )}

      {/* Shops List — sorted nearest first */}
      {filteredShops.length > 0 && (
        <div className="space-y-2">
          <h3 className="section-title text-sm text-white/60">
            Nearest Shops — <span className="urdu-text">قریبی دکانیں</span>
          </h3>
          {filteredShops.slice(0, 15).map((shop, i) => {
            const typeInfo = TYPE_LABELS[shop.type] || TYPE_LABELS.general;
            const isExpanded = expandedShop === shop.id;

            return (
              <motion.div
                key={shop.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card overflow-hidden cursor-pointer"
                onClick={() => setExpandedShop(isExpanded ? null : shop.id)}
              >
                <div className="p-3.5 flex items-center gap-3">
                  {/* Rank badge */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ background: i === 0 ? 'rgba(0,255,127,0.2)' : 'rgba(255,255,255,0.05)',
                             color: i === 0 ? '#00FF7F' : '#ffffff60',
                             border: i === 0 ? '1px solid rgba(0,255,127,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white truncate"
                        style={{ fontFamily: "'Syne', sans-serif" }}>
                        {shop.name}
                      </span>
                      {i === 0 && (
                        <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-khet-500/20 text-khet-500 border border-khet-500/30">
                          NEAREST
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-white/40 truncate">
                        {shop.address || 'Address not listed'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs font-bold" style={{ color: typeInfo.color }}>
                      {shop.distance.toFixed(1)} km
                    </span>
                    <span className="text-[10px] text-white/30">{typeInfo.emoji} {typeInfo.label}</span>
                  </div>

                  <div className="text-white/20 ml-1">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3.5 pb-3.5 pt-0 border-t border-white/5 space-y-2.5 mt-1">
                        {shop.phone && (
                          <a href={`tel:${shop.phone}`}
                            className="flex items-center gap-2 text-xs text-white/60 hover:text-khet-500 transition-colors"
                            onClick={e => e.stopPropagation()}>
                            <Phone size={11} className="text-khet-500" />
                            {shop.phone}
                          </a>
                        )}
                        {shop.opening && (
                          <div className="flex items-center gap-2 text-xs text-white/50">
                            <Clock size={11} className="text-khet-500" />
                            {shop.opening}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <MapPin size={11} className="text-khet-500" />
                          {shop.distance.toFixed(2)} km from your location
                        </div>

                        {/* Get Directions button */}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-khet-500/30 text-khet-500 text-xs font-semibold hover:bg-khet-500/10 transition-all"
                        >
                          <Navigation size={12} />
                          Get Directions — گوگل میپس
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {shops.length > 0 && (
        <div className="glass-card p-3">
          <p className="text-xs text-white/30 mb-2 font-mono">SHOP TYPES</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5 text-xs text-white/40">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: v.color }} />
                {v.emoji} {v.label}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-white/20 mt-2">
            Data from OpenStreetMap contributors · Sorted nearest first
          </p>
        </div>
      )}
    </div>
  );
}