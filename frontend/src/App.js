import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Microscope, HeartHandshake, Map, Shield,
  Sprout, TrendingUp, CloudRain, Mic, Satellite, MoreHorizontal, X
} from 'lucide-react';

import Dashboard        from './pages/Dashboard';
import Diagnose         from './pages/Diagnose';
import Negotiate        from './pages/Negotiate';
import LogisticsMap     from './pages/LogisticsMap';
import Insurance        from './pages/Insurance';
import MandiPrices      from './pages/MandiPrices';
import WeatherForecast  from './pages/WeatherForecast';
import VoiceAssistant   from './pages/VoiceAssistant';
import SatelliteMonitor from './pages/SatelliteMonitor';

import './index.css';

const PRIMARY_NAV = [
  { path: '/',         label: 'Home',    icon: LayoutDashboard },
  { path: '/diagnose', label: 'Diagnose',icon: Microscope      },
  { path: '/mandi',    label: 'Mandi',   icon: TrendingUp      },
  { path: '/voice',    label: 'Voice',   icon: Mic             },
  { path: '/more',     label: 'More',    icon: MoreHorizontal  },
];

const MORE_NAV = [
  { path: '/negotiate', label: 'Negotiate', labelUrdu: 'سودا',    emoji: '🤝', desc: 'AI vendor negotiation'        },
  { path: '/logistics', label: 'Logistics', labelUrdu: 'نقشہ',    emoji: '🗺️', desc: 'Find agri shops near you'     },
  { path: '/insurance', label: 'Insurance', labelUrdu: 'بیمہ',    emoji: '🛡️', desc: 'Parametric crop insurance'    },
  { path: '/weather',   label: 'Forecast',  labelUrdu: 'موسم',    emoji: '🌦️', desc: 'Disease risk by weather'      },
  { path: '/satellite', label: 'Satellite', labelUrdu: 'سیٹلائٹ', emoji: '🛰️', desc: 'NDVI field health monitoring' },
  { path: '/about',     label: 'About',     labelUrdu: 'ہمارے بارے میں', emoji: 'ℹ️', desc: 'About KhetAI · technology · team' },
];

function MoreSheet({ onClose }) {
  const navigate = useNavigate();
  const go = (path) => { if (path === '/about') { window.location.href = '/landing.html'; onClose(); return; } navigate(path); onClose(); };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'linear-gradient(180deg, #0d150e 0%, #060d07 100%)',
          border: '1px solid rgba(74,222,128,0.12)',
          borderBottom: 'none',
          borderRadius: '24px 24px 0 0',
          padding: '20px 20px 40px',
        }}
      >
        <div className="flex justify-center mb-5">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
        </div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 style={{ color: 'white', fontWeight: 800, fontSize: 18, fontFamily: "'Syne', sans-serif" }}>All Features</h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>تمام خصوصیات</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </motion.button>
        </div>
        <div className="space-y-2">
          {MORE_NAV.map(item => (
            <motion.button key={item.path} whileTap={{ scale: 0.97 }} onClick={() => go(item.path)}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(74,222,128,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>{item.emoji}</div>
              <div className="flex-1">
                <p style={{ color: 'white', fontWeight: 700, fontSize: 15, fontFamily: "'Syne', sans-serif" }}>
                  {item.label}
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, marginLeft: 8, fontSize: 12, fontFamily: "'Noto Nastaliq Urdu', serif" }}>
                    {item.labelUrdu}
                  </span>
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{item.desc}</p>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 18 }}>›</div>
            </motion.button>
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.12)', fontSize: 10, textAlign: 'center', marginTop: 20, fontFamily: 'monospace' }}>
          KhetAI v2.0 · کھیت اے آئی
        </p>
      </motion.div>
    </motion.div>
  );
}

function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const moreActive = MORE_NAV.some(n => location.pathname === n.path);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5"
        style={{ background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
          {PRIMARY_NAV.map(({ path, label, icon: Icon }) => {
            const isMore = path === '/more';
            const active = isMore ? (showMore || moreActive) : location.pathname === path;
            return (
              <motion.button key={path} whileTap={{ scale: 0.9 }}
                onClick={() => isMore ? setShowMore(true) : navigate(path)}
                className={`nav-link ${active ? 'active' : ''}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium" style={{ fontFamily: "'Syne', sans-serif" }}>{label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>
      <AnimatePresence>
        {showMore && <MoreSheet onClose={() => setShowMore(false)} />}
      </AnimatePresence>
    </>
  );
}

function Header() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5"
      style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
            <Sprout size={24} className="text-khet-500" />
          </motion.div>
          <div>
            <h1 className="section-title text-lg leading-none">KhetAI</h1>
            <p className="urdu-text text-khet-500/70 text-xs leading-none mt-0.5">کھیت اے آئی</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { window.location.href = '/landing.html'; }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: 'rgba(74,222,128,0.8)', fontFamily: "'Syne', sans-serif" }}>
            ℹ️ About
          </motion.button>
          <div className="flex items-center gap-2">
            <div className="glow-dot animate-pulse" />
            <span className="text-xs text-white/40" style={{ fontFamily: "'JetBrains Mono', monospace" }}>LIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  const location = useLocation();
  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A' }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% -20%, rgba(0,255,127,0.08) 0%, transparent 60%)'
      }} />
      <Header />
      <main className="max-w-2xl mx-auto px-4 pb-28 pt-4">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
            <Routes location={location}>
              <Route path="/"          element={<Dashboard />}        />
              <Route path="/diagnose"  element={<Diagnose />}         />
              <Route path="/negotiate" element={<Negotiate />}        />
              <Route path="/logistics" element={<LogisticsMap />}     />
              <Route path="/insurance" element={<Insurance />}        />
              <Route path="/mandi"     element={<MandiPrices />}      />
              <Route path="/weather"   element={<WeatherForecast />}  />
              <Route path="/voice"     element={<VoiceAssistant />}   />
              <Route path="/satellite" element={<SatelliteMonitor />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <NavBar />
      <Toaster position="top-center" toastOptions={{
        style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(0,255,127,0.2)', fontFamily: "'DM Sans', sans-serif" },
        success: { iconTheme: { primary: '#00FF7F', secondary: '#0A0A0A' } },
      }} />
    </div>
  );
}

export default function App() {
  return <Router><AppContent /></Router>;
}