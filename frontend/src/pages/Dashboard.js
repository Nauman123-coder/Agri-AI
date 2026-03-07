import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Wheat, Droplets, Bug, Volume2, VolumeX, RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import CountUp from 'react-countup';
import toast from 'react-hot-toast';
import { getDemoPortfolio, getMarketPrices, getPriceTrend, getMarketAlerts } from '../utils/api';
import { speak, stopSpeech } from '../utils/voice';

const TRIAGE_ALERTS = [
  { id: 1, type: 'danger', crop: 'Wheat', field: 'Field A', issue: 'Fall Armyworm detected', issueUrdu: 'فال آرمی ورم', acres: 5, urgency: 'immediate', icon: Bug },
  { id: 2, type: 'warning', crop: 'Cotton', field: 'Field B', issue: 'Low soil moisture', issueUrdu: 'مٹی میں نمی کم', acres: 3, urgency: 'within_3_days', icon: Droplets },
  { id: 3, type: 'success', crop: 'Rice', field: 'Field C', issue: 'Crop healthy', issueUrdu: 'فصل صحت مند', acres: 2, urgency: 'none', icon: CheckCircle },
];

function SkeletonCard({ className = '' }) {
  return <div className={`shimmer rounded-2xl ${className}`} style={{ height: 80 }} />;
}

function TriageCard({ alert, index }) {
  const colors = {
    danger: { bg: 'rgba(255,59,48,0.1)', border: 'rgba(255,59,48,0.25)', text: '#FF3B30', badge: 'severity-critical' },
    warning: { bg: 'rgba(255,140,0,0.1)', border: 'rgba(255,140,0,0.25)', text: '#FF8C00', badge: 'severity-moderate' },
    success: { bg: 'rgba(0,255,127,0.06)', border: 'rgba(0,255,127,0.15)', text: '#00FF7F', badge: 'severity-mild' },
  };
  const c = colors[alert.type];
  const Icon = alert.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-3 p-3.5 rounded-xl border transition-all"
      style={{ background: c.bg, borderColor: c.border }}
    >
      <div className="p-2 rounded-lg" style={{ background: `${c.text}22` }}>
        <Icon size={16} style={{ color: c.text }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white truncate" style={{ fontFamily: "'Syne', sans-serif" }}>
            {alert.crop} — {alert.field}
          </span>
          {alert.urgency === 'immediate' && (
            <span className="severity-badge severity-critical text-[9px]">URGENT</span>
          )}
        </div>
        <p className="text-xs text-white/50 truncate">{alert.issue}</p>
        <p className="text-xs urdu-text text-white/30">{alert.issueUrdu}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-mono text-white/40">{alert.acres}ac</p>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-2.5 text-xs">
        <p className="text-white/50 mb-1">{label}</p>
        <p className="text-khet-500 font-semibold">₨ {payload[0]?.value?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState(null);
  const [prices, setPrices] = useState([]);
  const [trend, setTrend] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('wheat');
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTrend();
  }, [selectedCrop]);

  const loadData = async () => {
    try {
      const [portfolioData, pricesData, alertsData] = await Promise.all([
        getDemoPortfolio(),
        getMarketPrices(),
        getMarketAlerts(),
      ]);
      setPortfolio(portfolioData);
      setPrices(pricesData.prices || []);
      setAlerts(alertsData.alerts || []);
    } catch (e) {
      toast.error('Could not load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadTrend = async () => {
    try {
      const data = await getPriceTrend(selectedCrop, 30);
      const chartData = (data.dates || []).map((d, i) => ({
        date: d.slice(5),
        price: data.prices[i],
      }));
      setTrend(chartData);
    } catch (e) {}
  };

  const handleVoice = () => {
    if (speaking) {
      stopSpeech();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    const text = portfolio
      ? `KhetAI Dashboard. Net Farm Value: ${portfolio.net_farm_value_pkr?.toLocaleString()} Pakistani Rupees across ${portfolio.total_acres} acres. You have ${TRIAGE_ALERTS.filter(a => a.type === 'danger').length} urgent alerts requiring immediate attention.`
      : 'Dashboard loading.';
    speak(text, 'en-PK');
    setTimeout(() => setSpeaking(false), 8000);
  };

  const nfv = portfolio?.net_farm_value_pkr || 0;
  const isProfit = nfv > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="section-title text-2xl">Farm Overview</h2>
          <p className="urdu-text text-white/40 text-sm mt-0.5">زرعی جائزہ</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleVoice}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 rounded-xl border border-white/10 text-white/50 hover:text-khet-500 hover:border-khet-500/30 transition-all"
          >
            {speaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </motion.button>
          <motion.button
            onClick={loadData}
            whileTap={{ scale: 0.9, rotate: 180 }}
            className="p-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white transition-all"
          >
            <RefreshCw size={18} />
          </motion.button>
        </div>
      </div>

      {/* Net Farm Value — Hero Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, #0D1F13 0%, #111 50%, #0A1A0D 100%)',
          border: '1px solid rgba(0,255,127,0.2)',
          boxShadow: '0 0 40px rgba(0,255,127,0.08)',
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #00FF7F 0, #00FF7F 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px'
        }} />

        <div className="relative">
          <div className="data-label mb-2">Net Farm Value</div>
          <div className="flex items-baseline gap-2">
            <span className="text-white/50 text-xl">₨</span>
            {loading ? (
              <div className="shimmer h-12 w-48 rounded-lg" />
            ) : (
              <span className="text-5xl font-bold" style={{
                fontFamily: "'Syne', sans-serif",
                color: isProfit ? '#00FF7F' : '#FF3B30',
              }}>
                <CountUp end={nfv} duration={2} separator="," />
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div>
              <div className="data-label">Total Acres</div>
              <div className="text-white font-semibold">{portfolio?.total_acres || '—'}</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="data-label">Profit/Acre</div>
              <div className="text-white font-semibold">
                ₨ {portfolio?.average_profit_per_acre_pkr?.toLocaleString() || '—'}
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="data-label">Crops</div>
              <div className="text-white font-semibold">{portfolio?.breakdown?.length || '—'}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Crop Breakdown */}
      {portfolio?.breakdown && (
        <div>
          <h3 className="section-title text-sm mb-3 text-white/60">Crop Portfolio</h3>
          <div className="grid grid-cols-3 gap-2">
            {portfolio.breakdown.map((crop, i) => (
              <motion.div
                key={crop.crop}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="stat-card text-center"
              >
                <Wheat size={16} className="text-khet-500 mx-auto mb-1.5" />
                <div className="text-xs font-semibold text-white capitalize truncate"
                  style={{ fontFamily: "'Syne', sans-serif" }}>
                  {crop.crop}
                </div>
                <div className="text-xs text-white/40">{crop.acres}ac</div>
                <div className={`text-xs font-bold mt-1 ${crop.net_pkr > 0 ? 'text-khet-500' : 'text-red-400'}`}>
                  ₨{Math.abs(crop.net_pkr / 1000).toFixed(0)}K
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Triage Alerts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title text-sm text-white/60">Field Alerts</h3>
          <span className="text-xs text-white/30 font-mono">
            {TRIAGE_ALERTS.filter(a => a.type === 'danger').length} urgent
          </span>
        </div>
        <div className="space-y-2">
          {TRIAGE_ALERTS.map((alert, i) => (
            <TriageCard key={alert.id} alert={alert} index={i} />
          ))}
        </div>
      </div>

      {/* Market Price Chart */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title text-sm">Market Prices</h3>
            <p className="text-xs text-white/30 urdu-text">منڈی قیمتیں</p>
          </div>
          <select
            value={selectedCrop}
            onChange={e => setSelectedCrop(e.target.value)}
            className="text-xs bg-soil-700 border border-white/10 rounded-lg px-2 py-1.5 text-white/70 outline-none"
          >
            {['wheat', 'cotton', 'rice', 'sugarcane', 'maize', 'vegetables'].map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={trend} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00FF7F" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00FF7F" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#ffffff30', fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="price" stroke="#00FF7F" strokeWidth={2} fill="url(#priceGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Market Prices Grid */}
      <div>
        <h3 className="section-title text-sm text-white/60 mb-3">Today's Rates — آج کی قیمتیں</h3>
        <div className="grid grid-cols-2 gap-2">
          {loading
            ? [1, 2, 3, 4].map(i => <SkeletonCard key={i} className="h-16" />)
            : prices.slice(0, 6).map((p, i) => (
              <motion.div
                key={p.crop}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {p.crop}
                  </div>
                  <div className="urdu-text text-xs text-white/30">{p.crop_urdu}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">₨{p.price_pkr?.toLocaleString()}</div>
                  <div className={`flex items-center gap-0.5 justify-end text-xs ${p.change_percent >= 0 ? 'text-khet-500' : 'text-red-400'}`}>
                    {p.change_percent >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {Math.abs(p.change_percent).toFixed(1)}%
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Market Alerts */}
      {alerts.length > 0 && (
        <div>
          <h3 className="section-title text-sm text-white/60 mb-3">Advisory Alerts</h3>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-3 p-3.5 rounded-xl border"
                style={{
                  background: alert.severity === 'danger' ? 'rgba(255,59,48,0.06)' : alert.severity === 'warning' ? 'rgba(255,140,0,0.06)' : 'rgba(0,122,255,0.06)',
                  borderColor: alert.severity === 'danger' ? 'rgba(255,59,48,0.2)' : alert.severity === 'warning' ? 'rgba(255,140,0,0.2)' : 'rgba(0,122,255,0.2)',
                }}
              >
                <AlertTriangle size={14} className={
                  alert.severity === 'danger' ? 'text-red-400 mt-0.5 flex-shrink-0' :
                  alert.severity === 'warning' ? 'text-orange-400 mt-0.5 flex-shrink-0' :
                  'text-blue-400 mt-0.5 flex-shrink-0'
                } />
                <div>
                  <p className="text-xs text-white/70">{alert.message}</p>
                  <p className="urdu-text text-xs text-white/30 mt-0.5">{alert.message_urdu}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
