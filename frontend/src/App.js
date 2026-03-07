import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Microscope, HeartHandshake, Map, Shield, Sprout
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Diagnose from './pages/Diagnose';
import Negotiate from './pages/Negotiate';
import LogisticsMap from './pages/LogisticsMap';
import Insurance from './pages/Insurance';

import './index.css';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', labelUrdu: 'ڈیش بورڈ', icon: LayoutDashboard },
  { path: '/diagnose', label: 'Diagnose', labelUrdu: 'تشخیص', icon: Microscope },
  { path: '/negotiate', label: 'Negotiate', labelUrdu: 'سودا', icon: HeartHandshake },
  { path: '/logistics', label: 'Map', labelUrdu: 'نقشہ', icon: Map },
  { path: '/insurance', label: 'Insurance', labelUrdu: 'بیمہ', icon: Shield },
];

function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5"
      style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ path, label, labelUrdu, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              className={`nav-link ${active ? 'active' : ''}`}
              whileTap={{ scale: 0.9 }}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium" style={{ fontFamily: "'Syne', sans-serif" }}>
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5"
      style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sprout size={24} className="text-khet-500" />
          </motion.div>
          <div>
            <h1 className="section-title text-lg leading-none">KhetAI</h1>
            <p className="urdu-text text-khet-500/70 text-xs leading-none mt-0.5">کھیت اے آئی</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/landing.html"
            className="text-xs text-white/40 hover:text-khet-500 transition-colors border border-white/10 hover:border-khet-500/30 px-2.5 py-1 rounded-lg"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            About
          </a>
          <div className="glow-dot animate-pulse" />
          <span className="text-xs text-white/40" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            LIVE
          </span>
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  const location = useLocation();

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A' }}>
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% -20%, rgba(0,255,127,0.08) 0%, transparent 60%)'
      }} />

      <Header />

      <main className="max-w-2xl mx-auto px-4 pb-28 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Routes location={location}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/diagnose" element={<Diagnose />} />
              <Route path="/negotiate" element={<Negotiate />} />
              <Route path="/logistics" element={<LogisticsMap />} />
              <Route path="/insurance" element={<Insurance />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <NavBar />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#fff',
            border: '1px solid rgba(0,255,127,0.2)',
            fontFamily: "'DM Sans', sans-serif",
          },
          success: { iconTheme: { primary: '#00FF7F', secondary: '#0A0A0A' } },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}