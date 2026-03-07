import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CloudRain, Thermometer, Droplets, AlertTriangle,
  CheckCircle, XCircle, Loader2, FileText, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { assessInsurance, getInsurancePolicies } from '../utils/api';

const CROPS = ['wheat', 'cotton', 'rice', 'sugarcane', 'maize', 'vegetables'];
const SEVERITIES = ['mild', 'moderate', 'severe', 'critical'];

function WeatherCard({ label, value, icon: Icon, unit, color = '#00FF7F' }) {
  return (
    <div className="glass-card p-3 text-center">
      <Icon size={16} style={{ color }} className="mx-auto mb-1.5" />
      <div className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
        {value}{unit}
      </div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  );
}

function PolicyCard({ policy }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      className="glass-card p-4 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="section-title text-sm">{policy.name}</h4>
          <p className="urdu-text text-xs text-white/40 mt-0.5">{policy.name_urdu}</p>
        </div>
        <div className="text-right">
          <div className="text-khet-500 font-bold text-sm">₨{policy.premium_per_acre_pkr}/ac</div>
          <div className="data-label">Premium</div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Max Payout</span>
                <span className="text-white font-semibold">₨{policy.max_payout_per_acre_pkr?.toLocaleString()}/acre</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Min Severity</span>
                <span className={`severity-badge severity-${policy.min_severity}`}>{policy.min_severity}</span>
              </div>
              <div>
                <div className="data-label mb-1.5">Covers</div>
                <div className="flex flex-wrap gap-1.5">
                  {(policy.covers || []).map(c => (
                    <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 capitalize">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Insurance() {
  const [form, setForm] = useState({
    crop_type: 'wheat',
    acres: '5',
    location: 'Punjab, Pakistan',
    disease_severity: 'moderate',
    estimated_loss_pkr: '225000',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    getInsurancePolicies().then(d => setPolicies(d.policies || [])).catch(() => {});
  }, []);

  const handleAssess = async () => {
    setLoading(true);
    try {
      const data = await assessInsurance({
        ...form,
        acres: parseFloat(form.acres) || 5,
        estimated_loss_pkr: parseFloat(form.estimated_loss_pkr) || 225000,
      });
      setResult(data);
      if (data.eligible) toast.success('Insurance claim triggered!');
      else toast('Below coverage threshold', { icon: 'ℹ️' });
    } catch (e) {
      toast.error('Assessment failed. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="section-title text-2xl">Insurance</h2>
        <p className="text-white/40 text-sm mt-0.5 urdu-text">فصل بیمہ</p>
      </div>

      {/* Assessment Form */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={16} className="text-khet-500" />
          <span className="section-title text-sm">Parametric Assessment</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="data-label block mb-1">Crop</label>
            <select value={form.crop_type} onChange={e => setForm(p => ({ ...p, crop_type: e.target.value }))}
              className="w-full bg-soil-700 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none">
              {CROPS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="data-label block mb-1">Acres</label>
            <input type="number" value={form.acres} onChange={e => setForm(p => ({ ...p, acres: e.target.value }))}
              className="w-full bg-soil-700 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none"
              placeholder="5" />
          </div>
        </div>

        <div>
          <label className="data-label block mb-1">Disease Severity</label>
          <div className="flex gap-2">
            {SEVERITIES.map(s => (
              <motion.button key={s} whileTap={{ scale: 0.95 }}
                onClick={() => setForm(p => ({ ...p, disease_severity: s }))}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  form.disease_severity === s
                    ? `severity-badge severity-${s} border border-current`
                    : 'border border-white/10 text-white/40'
                }`}>
                {s}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label className="data-label block mb-1">Estimated Loss (PKR)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">₨</span>
            <input type="number" value={form.estimated_loss_pkr}
              onChange={e => setForm(p => ({ ...p, estimated_loss_pkr: e.target.value }))}
              className="w-full bg-soil-700 border border-white/10 rounded-xl pl-7 pr-3 py-2 text-white text-sm outline-none"
              placeholder="225000" />
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleAssess} disabled={loading}
          className="w-full khet-button flex items-center justify-center gap-2 py-3">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          {loading ? 'Assessing...' : 'Assess Insurance Claim'}
        </motion.button>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Status Banner */}
            <div className={`rounded-2xl p-4 border ${
              result.eligible
                ? 'border-khet-500/30 bg-khet-500/08'
                : 'border-red-500/30 bg-red-500/06'
            }`}>
              <div className="flex items-center gap-3">
                {result.eligible
                  ? <CheckCircle size={24} className="text-khet-500 flex-shrink-0" />
                  : <XCircle size={24} className="text-red-400 flex-shrink-0" />}
                <div>
                  <h3 className="section-title text-base">
                    {result.eligible ? 'Claim Eligible!' : 'Not Eligible'}
                  </h3>
                  <p className="urdu-text text-sm text-white/50">{result.message_urdu}</p>
                </div>
                {result.eligible && (
                  <div className="ml-auto text-right">
                    <div className="data-label">Claim ID</div>
                    <div className="text-khet-500 font-mono text-xs">{result.claim_id}</div>
                  </div>
                )}
              </div>
            </div>

            {result.eligible && (
              <>
                {/* Payout Details */}
                <div className="glass-card p-4">
                  <div className="data-label mb-3">Payout Breakdown</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-xs text-white/40 mb-1">Estimated Loss</div>
                      <div className="text-sm font-bold text-red-400">₨{result.estimated_loss_pkr?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40 mb-1">Coverage %</div>
                      <div className="text-sm font-bold text-white">{result.payout_percent}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40 mb-1">Payout</div>
                      <div className="text-sm font-bold text-khet-500">₨{result.estimated_payout_pkr?.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                    <span>Processing: {result.processing_days} business days</span>
                    <span className="text-yellow-400">● {result.status?.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Weather Data */}
                {result.weather_data && (
                  <div>
                    <div className="data-label mb-2">Parametric Trigger Data</div>
                    <div className="grid grid-cols-3 gap-2">
                      <WeatherCard label="Rainfall" value={result.weather_data.rainfall_mm} unit="mm"
                        icon={CloudRain} color="#007AFF" />
                      <WeatherCard label="Temperature" value={result.weather_data.temperature_c} unit="°C"
                        icon={Thermometer} color="#FF8C00" />
                      <WeatherCard label="Humidity" value={result.weather_data.humidity_percent} unit="%"
                        icon={Droplets} color="#00BFFF" />
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Available Policies */}
      {policies.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={14} className="text-white/40" />
            <h3 className="section-title text-sm text-white/60">Available Policies — دستیاب پالیسیاں</h3>
          </div>
          <div className="space-y-3">
            {policies.map(p => <PolicyCard key={p.id} policy={p} />)}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-500/06 border border-blue-500/15">
        <AlertTriangle size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-white/50 leading-relaxed">
          KhetAI uses parametric insurance — payouts are triggered automatically based on measured thresholds (weather, satellite, disease severity) without requiring manual claims inspection.
          <span className="urdu-text block mt-1 text-white/30">خودکار ادائیگی — بلا معائنہ</span>
        </div>
      </div>
    </div>
  );
}
