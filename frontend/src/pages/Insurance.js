import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import {
  Shield, CloudRain, Thermometer, Droplets, AlertTriangle,
  CheckCircle, XCircle, Loader2, FileText, Zap, ChevronDown,
  TrendingUp, Lock, Clock, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { assessInsurance, getInsurancePolicies } from '../utils/api';

const CROPS = ['wheat', 'cotton', 'rice', 'sugarcane', 'maize', 'vegetables'];
const SEVERITIES = ['mild', 'moderate', 'severe', 'critical'];

const SEVERITY_CONFIG = {
  mild:     { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)',  pct: 0,  label: 'Mild',     urdu: 'ہلکا'    },
  moderate: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)',  pct: 50, label: 'Moderate', urdu: 'اعتدال'  },
  severe:   { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.3)',  pct: 75, label: 'Severe',   urdu: 'شدید'    },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   pct: 90, label: 'Critical', urdu: 'نازک'    },
};

const CROP_ICONS = {
  wheat: '🌾', cotton: '🌿', rice: '🍚', sugarcane: '🎋', maize: '🌽', vegetables: '🥬'
};

// Animated counter
function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1.2 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const start = display;
    const end   = value;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = (now - startTime) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  // eslint-disable-next-line
  }, [value]);

  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

// Shield ring visualization
function ShieldRing({ severity, payout, loss }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.mild;
  const pct = cfg.pct;
  const r = 54, circ = 2 * Math.PI * r;

  return (
    <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        {/* Track */}
        <circle cx={70} cy={70} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={12} />
        {/* Progress */}
        <circle cx={70} cy={70} r={r} fill="none" stroke={cfg.color} strokeWidth={12}
          strokeDasharray={`${circ * pct / 100} ${circ}`}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 1.5s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 8px ${cfg.color}88)` }}
        />
        {/* Inner glow ring */}
        <circle cx={70} cy={70} r={42} fill="none" stroke={cfg.color} strokeWidth={1} strokeOpacity={0.15} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Shield size={18} style={{ color: cfg.color, filter: `drop-shadow(0 0 6px ${cfg.color})` }} />
        <p style={{ color: cfg.color, fontWeight: 900, fontSize: 22, lineHeight: 1, fontFamily: "'Syne', sans-serif" }}>{pct}%</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: '0.08em' }}>COVERAGE</p>
      </div>
    </div>
  );
}

function PolicyCard({ policy, index }) {
  const [expanded, setExpanded] = useState(false);
  const isPremium = policy.premium_per_acre_pkr > 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={() => setExpanded(!expanded)}
      whileTap={{ scale: 0.985 }}
      style={{
        background: isPremium ? 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(10,20,12,0) 100%)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isPremium ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 18, padding: 16, cursor: 'pointer',
      }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: isPremium ? 'rgba(251,191,36,0.12)' : 'rgba(74,222,128,0.08)',
            border: `1px solid ${isPremium ? 'rgba(251,191,36,0.25)' : 'rgba(74,222,128,0.15)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isPremium ? <Star size={18} style={{ color: '#fbbf24' }} /> : <Shield size={18} style={{ color: '#4ade80' }} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p style={{ color: 'white', fontWeight: 700, fontSize: 14, fontFamily: "'Syne', sans-serif" }}>{policy.name}</p>
              {isPremium && (
                <span style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 6, padding: '1px 7px', color: '#fbbf24', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>PREMIUM</span>
              )}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: "'Noto Nastaliq Urdu', serif", marginTop: 2 }}>{policy.name_urdu}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: isPremium ? '#fbbf24' : '#4ade80', fontWeight: 800, fontSize: 15 }}>₨{policy.premium_per_acre_pkr}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>per acre</p>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}>
            <div style={{ paddingTop: 14, marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { label: 'Max Payout', value: `₨${policy.max_payout_per_acre_pkr?.toLocaleString()}/ac`, color: '#4ade80' },
                  { label: 'Min Severity', value: policy.min_severity, color: SEVERITY_CONFIG[policy.min_severity]?.color || '#fff' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 12px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginBottom: 3 }}>{s.label}</p>
                    <p style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginBottom: 6 }}>COVERS</p>
              <div className="flex flex-wrap gap-2">
                {(policy.covers || []).map(c => (
                  <span key={c} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '3px 10px', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'capitalize' }}>
                    {c}
                  </span>
                ))}
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
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [policies, setPolicies] = useState([]);
  const [step, setStep]         = useState(1); // 1=form, 2=result

  useEffect(() => {
    getInsurancePolicies().then(d => setPolicies(d.policies || [])).catch(() => {});
  }, []);

  const sevCfg     = SEVERITY_CONFIG[form.disease_severity] || SEVERITY_CONFIG.mild;
  const lossVal    = parseFloat(form.estimated_loss_pkr) || 0;
  const estPayout  = Math.round(lossVal * sevCfg.pct / 100);

  const handleAssess = async () => {
    setLoading(true);
    try {
      const data = await assessInsurance({
        ...form,
        acres: parseFloat(form.acres) || 5,
        estimated_loss_pkr: lossVal,
      });
      setResult(data);
      setStep(2);
      if (data.eligible) toast.success('✅ Insurance claim triggered!');
      else toast('ℹ️ Below coverage threshold');
    } catch (e) {
      toast.error('Assessment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: 8 }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ color: 'white', fontWeight: 900, fontSize: 22, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}>
              Crop Insurance 🛡️
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: "'Noto Nastaliq Urdu', serif", marginTop: 2 }}>
              فصل بیمہ — خودکار ادائیگی
            </p>
          </div>
          <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 12, padding: '6px 12px', textAlign: 'center' }}>
            <div className="flex items-center gap-1.5">
              <Lock size={11} style={{ color: '#4ade80' }} />
              <p style={{ color: '#4ade80', fontSize: 11, fontWeight: 700 }}>Parametric</p>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>auto-payout</p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: FORM ── */}
        {step === 1 && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Live payout estimator */}
            <motion.div
              style={{
                background: `linear-gradient(135deg, ${sevCfg.bg} 0%, rgba(10,20,12,0.8) 100%)`,
                border: `1px solid ${sevCfg.border}`,
                borderRadius: 20, padding: 20,
              }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: '0.08em', marginBottom: 16 }}>ESTIMATED PAYOUT PREVIEW</p>
              <div className="flex items-center justify-between">
                <ShieldRing severity={form.disease_severity} payout={estPayout} loss={lossVal} />
                <div style={{ flex: 1, paddingLeft: 20 }}>
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>Estimated Loss</p>
                    <p style={{ color: '#f87171', fontWeight: 800, fontSize: 18, fontFamily: "'Syne', sans-serif" }}>
                      ₨{lossVal.toLocaleString()}
                    </p>
                  </div>
                  <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>You'd Receive</p>
                    <p style={{ color: sevCfg.color, fontWeight: 900, fontSize: 22, fontFamily: "'Syne', sans-serif", filter: `drop-shadow(0 0 8px ${sevCfg.color}66)` }}>
                      ₨{estPayout.toLocaleString()}
                    </p>
                  </div>
                  <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>3-day processing</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Crop + Acres */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 16 }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: '0.08em', marginBottom: 12 }}>CROP DETAILS</p>

              {/* Crop pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {CROPS.map(c => (
                  <motion.button key={c} whileTap={{ scale: 0.93 }}
                    onClick={() => setForm(p => ({ ...p, crop_type: c }))}
                    style={{
                      padding: '6px 14px', borderRadius: 20,
                      background: form.crop_type === c ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${form.crop_type === c ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: form.crop_type === c ? '#4ade80' : 'rgba(255,255,255,0.4)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                    <span>{CROP_ICONS[c]}</span> {c.charAt(0).toUpperCase() + c.slice(1)}
                  </motion.button>
                ))}
              </div>

              {/* Acres + Loss */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginBottom: 6 }}>FIELD SIZE</p>
                  <div style={{ position: 'relative' }}>
                    <input type="number" value={form.acres}
                      onChange={e => setForm(p => ({ ...p, acres: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 40px 10px 12px', color: 'white', fontSize: 15, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>ac</span>
                  </div>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginBottom: 6 }}>ESTIMATED LOSS</p>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>₨</span>
                    <input type="number" value={form.estimated_loss_pkr}
                      onChange={e => setForm(p => ({ ...p, estimated_loss_pkr: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 12px 10px 26px', color: 'white', fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Severity selector */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 16 }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: '0.08em', marginBottom: 12 }}>DISEASE SEVERITY</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {SEVERITIES.map(s => {
                  const cfg = SEVERITY_CONFIG[s];
                  const active = form.disease_severity === s;
                  return (
                    <motion.button key={s} whileTap={{ scale: 0.93 }}
                      onClick={() => setForm(p => ({ ...p, disease_severity: s }))}
                      style={{
                        padding: '10px 4px', borderRadius: 14,
                        background: active ? cfg.bg : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${active ? cfg.border : 'rgba(255,255,255,0.07)'}`,
                        cursor: 'pointer', textAlign: 'center',
                        boxShadow: active ? `0 0 16px ${cfg.color}22` : 'none',
                        transition: 'all 0.2s ease',
                      }}>
                      <p style={{ color: active ? cfg.color : 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 12 }}>{cfg.label}</p>
                      <p style={{ color: active ? cfg.color + '99' : 'rgba(255,255,255,0.2)', fontSize: 9, fontFamily: "'Noto Nastaliq Urdu', serif", marginTop: 2 }}>{cfg.urdu}</p>
                      <p style={{ color: active ? cfg.color : 'rgba(255,255,255,0.25)', fontWeight: 800, fontSize: 14, marginTop: 4 }}>{cfg.pct}%</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleAssess} disabled={loading}
              style={{
                width: '100%', padding: '16px', borderRadius: 18,
                background: loading ? 'rgba(74,222,128,0.1)' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                border: '1px solid rgba(74,222,128,0.3)',
                color: 'white', fontWeight: 800, fontSize: 16,
                fontFamily: "'Syne', sans-serif", cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: loading ? 'none' : '0 8px 32px rgba(22,163,74,0.35)',
              }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              {loading ? 'Assessing Claim…' : 'Assess Insurance Claim'}
            </motion.button>

            {/* Info strip */}
            <div style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 14, padding: '10px 14px', display: 'flex', gap: 10 }}>
              <AlertTriangle size={13} style={{ color: '#60a5fa', flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 1.6 }}>
                Parametric insurance pays out automatically based on measured thresholds — no manual inspection required.{' '}
                <span style={{ fontFamily: "'Noto Nastaliq Urdu', serif", color: 'rgba(255,255,255,0.25)' }}>خودکار ادائیگی — بلا معائنہ</span>
              </p>
            </div>

            {/* Policies */}
            {policies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>AVAILABLE POLICIES</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {policies.map((p, i) => <PolicyCard key={p.id} policy={p} index={i} />)}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── STEP 2: RESULT ── */}
        {step === 2 && result && (
          <motion.div key="result" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Big result banner */}
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 18 }}
              style={{
                borderRadius: 24, padding: 24, textAlign: 'center',
                background: result.eligible
                  ? 'linear-gradient(135deg, rgba(22,163,74,0.12) 0%, rgba(10,20,12,0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(10,20,12,0.9) 100%)',
                border: `1px solid ${result.eligible ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
                boxShadow: result.eligible ? '0 0 40px rgba(22,163,74,0.15)' : '0 0 40px rgba(239,68,68,0.1)',
              }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                style={{ marginBottom: 12 }}>
                {result.eligible
                  ? <CheckCircle size={48} style={{ color: '#4ade80', margin: '0 auto', filter: 'drop-shadow(0 0 12px #4ade8088)' }} />
                  : <XCircle size={48} style={{ color: '#f87171', margin: '0 auto' }} />}
              </motion.div>
              <h2 style={{ color: 'white', fontWeight: 900, fontSize: 22, fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>
                {result.eligible ? 'Claim Approved!' : 'Not Eligible'}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: "'Noto Nastaliq Urdu', serif" }}>
                {result.message_urdu}
              </p>
              {result.claim_id && (
                <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 16px', display: 'inline-block' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: '0.1em' }}>CLAIM ID</p>
                  <p style={{ color: '#4ade80', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700 }}>{result.claim_id}</p>
                </div>
              )}
            </motion.div>

            {/* Payout breakdown */}
            {result.eligible && (
              <>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 16 }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: '0.08em', marginBottom: 14 }}>PAYOUT BREAKDOWN</p>
                  <div className="grid grid-cols-3 gap-3 text-center mb-4">
                    {[
                      { label: 'Your Loss',   value: result.estimated_loss_pkr,    color: '#f87171', prefix: '₨' },
                      { label: 'Coverage',    value: result.payout_percent,         color: '#fbbf24', suffix: '%' },
                      { label: 'You Receive', value: result.estimated_payout_pkr,  color: '#4ade80', prefix: '₨' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 6px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, marginBottom: 4 }}>{s.label}</p>
                        <p style={{ color: s.color, fontWeight: 800, fontSize: 15, fontFamily: "'Syne', sans-serif" }}>
                          <AnimatedNumber value={s.value || 0} prefix={s.prefix || ''} suffix={s.suffix || ''} />
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${result.payout_percent}%` }}
                      transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, #16a34a, #4ade80)', borderRadius: 6 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>₨0</p>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>₨{result.estimated_loss_pkr?.toLocaleString()}</p>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{result.processing_days} business days</p>
                    </div>
                    <span style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, padding: '3px 10px', color: '#fbbf24', fontSize: 10, fontWeight: 600 }}>
                      {result.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Weather trigger data */}
                {result.weather_data && (
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: '0.08em', marginBottom: 10 }}>PARAMETRIC TRIGGER DATA</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Rainfall', value: result.weather_data.rainfall_mm, unit: 'mm', icon: CloudRain, color: '#60a5fa' },
                        { label: 'Temperature', value: result.weather_data.temperature_c, unit: '°C', icon: Thermometer, color: '#f97316' },
                        { label: 'Humidity', value: result.weather_data.humidity_percent, unit: '%', icon: Droplets, color: '#38bdf8' },
                      ].map(w => (
                        <div key={w.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                          <w.icon size={16} style={{ color: w.color, margin: '0 auto 6px' }} />
                          <p style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{w.value}<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{w.unit}</span></p>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{w.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Back button */}
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setStep(1); setResult(null); }}
              style={{ width: '100%', padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              ← New Assessment
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}