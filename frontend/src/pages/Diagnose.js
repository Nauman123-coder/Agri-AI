import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Camera, Microscope, Volume2, VolumeX, ChevronRight,
  Loader2, X, TrendingDown, Zap, FlaskConical,
  Brain, Cpu, MessageCircle, Send, Bot, User,
  Sprout, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as tf from '@tensorflow/tfjs';
import { speakDiagnosis, stopSpeech } from '../utils/voice';

// ─────────────────────────────────────────────────────────────────────────────
// DISEASE DATABASE — treatment info for all 38 PlantVillage classes
// ─────────────────────────────────────────────────────────────────────────────
const DISEASE_DB = {
  'Apple___Apple_scab':           { urdu: 'سیب کا خارش',           pesticide: 'Mancozeb 80WP',                          qty: '2.5g/L water',  severity: 'moderate' },
  'Apple___Black_rot':            { urdu: 'سیب کی سیاہ گلن',        pesticide: 'Captan 50WP',                            qty: '2g/L water',    severity: 'severe'   },
  'Apple___Cedar_apple_rust':     { urdu: 'سیب کا زنگ',             pesticide: 'Myclobutanil 40WP',                      qty: '1g/L water',    severity: 'moderate' },
  'Apple___healthy':              { urdu: 'صحت مند',                 pesticide: 'No treatment needed',                    qty: 'N/A',           severity: 'none'     },
  'Blueberry___healthy':          { urdu: 'صحت مند',                 pesticide: 'No treatment needed',                    qty: 'N/A',           severity: 'none'     },
  'Cherry_(including_sour)___Powdery_mildew': { urdu: 'چیری کی سفید پھپھوندی', pesticide: 'Sulfur 80WP',               qty: '3g/L water',    severity: 'moderate' },
  'Cherry_(including_sour)___healthy':        { urdu: 'صحت مند',    pesticide: 'No treatment needed',                    qty: 'N/A',           severity: 'none'     },
  'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': { urdu: 'مکئی کا سرمئی دھبہ', pesticide: 'Azoxystrobin 25SC', qty: '1ml/L water',   severity: 'moderate' },
  'Corn_(maize)___Common_rust_':  { urdu: 'مکئی کا عام زنگ',        pesticide: 'Propiconazole 25EC',                     qty: '1ml/L water',   severity: 'moderate' },
  'Corn_(maize)___Northern_Leaf_Blight': { urdu: 'مکئی کی شمالی جھلسن', pesticide: 'Mancozeb 75WP',                   qty: '2.5g/L water',  severity: 'severe'   },
  'Corn_(maize)___healthy':       { urdu: 'صحت مند',                 pesticide: 'No treatment needed',                    qty: 'N/A',           severity: 'none'     },
  'Grape___Black_rot':            { urdu: 'انگور کی سیاہ گلن',       pesticide: 'Myclobutanil 40WP',                      qty: '1g/L water',    severity: 'severe'   },
  'Grape___Esca_(Black_Measles)': { urdu: 'انگور کا کالا خسرہ',      pesticide: 'Fosetyl-Al 80WP',                        qty: '2.5g/L water',  severity: 'critical' },
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': { urdu: 'انگور کی پتی جھلسن', pesticide: 'Copper Oxychloride 50WP',    qty: '3g/L water',    severity: 'moderate' },
  'Grape___healthy':              { urdu: 'صحت مند',                 pesticide: 'No treatment needed',                    qty: 'N/A',           severity: 'none'     },
  'Orange___Haunglongbing_(Citrus_greening)': { urdu: 'مالٹے کی سبزی بیماری', pesticide: 'Imidacloprid 200SL',         qty: '0.5ml/L water', severity: 'critical' },
  'Peach___Bacterial_spot':       { urdu: 'آڑو کا بیکٹیریل دھبہ',   pesticide: 'Copper Hydroxide 77WP',                  qty: '2g/L water',    severity: 'moderate' },
  'Peach___healthy':              { urdu: 'صحت مند',                 pesticide: 'No treatment needed',                    qty: 'N/A',           severity: 'none'     },
  'Pepper,_bell___Bacterial_spot':{ urdu: 'مرچ کا بیکٹیریل دھبہ',   pesticide: 'Copper Oxychloride 50WP',                qty: '3g/L water',    severity: 'moderate' },
  'Pepper,_bell___healthy':       { urdu: 'صحت مند',                 pesticide: 'No treatment needed',                    qty: 'N/A',           severity: 'none'     },
  'Potato___Early_blight':        { urdu: 'آلو کی ابتدائی جھلسن',   pesticide: 'Mancozeb 75WP',                          qty: '2.5g/L water',  severity: 'moderate' },
  'Potato___Late_blight':         { urdu: 'آلو کی دیر سے جھلسن',    pesticide: 'Metalaxyl+Mancozeb',                     qty: '2.5g/L water',  severity: 'severe'   },
  'Potato___healthy':             { urdu: 'صحت مند',                 pesticide: 'No treatment needed',                    qty: 'N/A',           severity: 'none'     },
  'Raspberry___healthy':          { urdu: 'صحت مند',                 pesticide: 'No treatment needed',                    qty: 'N/A',           severity: 'none'     },
  'Soybean___healthy':            { urdu: 'صحت مند',                 pesticide: 'No treatment needed',                    qty: 'N/A',           severity: 'none'     },
  'Squash___Powdery_mildew':      { urdu: 'کدو کی سفید پھپھوندی',    pesticide: 'Sulfur 80WP',                            qty: '3g/L water',    severity: 'moderate' },
  'Strawberry___Leaf_scorch':     { urdu: 'اسٹرابیری کی پتی جلن',   pesticide: 'Captan 50WP',                            qty: '2g/L water',    severity: 'moderate' },
  'Strawberry___healthy':         { urdu: 'صحت مند',                 pesticide: 'No treatment needed',                    qty: 'N/A',           severity: 'none'     },
  'Tomato___Bacterial_spot':      { urdu: 'ٹماٹر کا بیکٹیریل دھبہ', pesticide: 'Copper Hydroxide 77WP',                  qty: '2g/L water',    severity: 'moderate' },
  'Tomato___Early_blight':        { urdu: 'ٹماٹر کی ابتدائی جھلسن', pesticide: 'Chlorothalonil 75WP',                    qty: '2g/L water',    severity: 'moderate' },
  'Tomato___Late_blight':         { urdu: 'ٹماٹر کی دیر سے جھلسن',  pesticide: 'Metalaxyl+Mancozeb',                     qty: '2.5g/L water',  severity: 'severe'   },
  'Tomato___Leaf_Mold':           { urdu: 'ٹماٹر کی پتی پر پھپھوندی', pesticide: 'Mancozeb 75WP',                       qty: '2.5g/L water',  severity: 'moderate' },
  'Tomato___Septoria_leaf_spot':  { urdu: 'ٹماٹر کا سیپٹوریا دھبہ', pesticide: 'Chlorothalonil 75WP',                    qty: '2g/L water',    severity: 'moderate' },
  'Tomato___Spider_mites Two-spotted_spider_mite': { urdu: 'ٹماٹر کی مکڑی', pesticide: 'Abamectin 1.8EC',               qty: '1ml/L water',   severity: 'moderate' },
  'Tomato___Target_Spot':         { urdu: 'ٹماٹر کا ہدف دھبہ',      pesticide: 'Azoxystrobin 25SC',                      qty: '1ml/L water',   severity: 'moderate' },
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus': { urdu: 'ٹماٹر زرد پتی وائرس', pesticide: 'Imidacloprid 200SL',             qty: '0.5ml/L water', severity: 'severe'   },
  'Tomato___Tomato_mosaic_virus': { urdu: 'ٹماٹر موزیک وائرس',      pesticide: 'Remove infected plants + Imidacloprid', qty: '0.5ml/L water', severity: 'severe'   },
  'Tomato___healthy':             { urdu: 'صحت مند',                 pesticide: 'No treatment needed',                    qty: 'N/A',           severity: 'none'     },
  'Wheat___Brown_rust':           { urdu: 'گندم کا بھورا زنگ',       pesticide: 'Propiconazole 25EC',                     qty: '1ml/L water',   severity: 'severe'   },
  'Wheat___Yellow_rust':          { urdu: 'گندم کا پیلا زنگ',        pesticide: 'Tebuconazole 25EC',                      qty: '1ml/L water',   severity: 'severe'   },
  'Wheat___healthy':              { urdu: 'صحت مند',                 pesticide: 'No treatment needed',                    qty: 'N/A',           severity: 'none'     },
};

const SEVERITY_LOSS    = { none: 0, mild: 0.10, moderate: 0.30, severe: 0.55, critical: 0.75 };
const CROP_PRICE_PKR   = { wheat: 3800, cotton: 8500, rice: 4800, sugarcane: 500, maize: 2700, vegetables: 4000 };
const TREAT_COST_ACRE  = { none: 0, mild: 1500, moderate: 3500, severe: 6000, critical: 10000 };

function buildActions(label, isHealthy) {
  if (isHealthy) return [
    'Continue regular monitoring every 7 days',
    'Maintain proper irrigation and soil nutrition',
    'Keep field clean — remove dead plant matter',
  ];
  return [
    `Apply ${DISEASE_DB[label]?.pesticide || 'recommended fungicide'} immediately`,
    'Remove and destroy heavily infected plant material',
    'Re-inspect field after 5 days to monitor recovery',
    'Record affected area for insurance claim if needed',
  ];
}

function buildResult(label, confidence, cropType, acres) {
  const info       = DISEASE_DB[label] || { urdu: 'نامعلوم بیماری', pesticide: 'Consult agri officer', qty: 'As directed', severity: 'moderate' };
  const isHealthy  = label.includes('healthy');
  const severity   = isHealthy ? 'none' : info.severity;
  const lossFactor = SEVERITY_LOSS[severity] || 0;
  const pricePerMaund = CROP_PRICE_PKR[cropType] || 3800;
  const revenue    = pricePerMaund * acres * 25;
  const lossAcre   = (revenue / acres) * lossFactor;
  const treatAcre  = TREAT_COST_ACRE[severity] || 0;
  const totalLoss  = lossAcre * acres;
  const totalTreat = treatAcre * acres;
  const [plant, disease] = label.split('___');
  const diseaseName = isHealthy ? `Healthy ${plant}` : (disease || '').replace(/_/g, ' ').trim();

  return {
    disease_detected:            !isHealthy,
    disease_name:                diseaseName,
    disease_name_urdu:           info.urdu,
    confidence,
    severity,
    affected_percentage:         isHealthy ? 0 : Math.round(lossFactor * 100 * 0.8),
    description:                 isHealthy
      ? `Your ${plant} crop appears healthy with no visible disease signs. Continue regular monitoring.`
      : `${diseaseName} detected on your ${cropType} crop. ${severity.charAt(0).toUpperCase() + severity.slice(1)} severity — ${Math.round(lossFactor * 100)}% yield loss expected without treatment.`,
    immediate_actions:           buildActions(label, isHealthy),
    recommended_pesticide:       info.pesticide,
    recommended_pesticide_urdu:  info.urdu,
    quantity_per_acre:           info.qty,
    estimated_loss_per_acre_pkr: Math.round(lossAcre),
    treatment_cost_per_acre_pkr: treatAcre,
    recovery_probability:        isHealthy ? 1.0 : (severity === 'critical' ? 0.55 : severity === 'severe' ? 0.72 : 0.85),
    urgency:                     isHealthy ? 'none' : (severity === 'critical' || severity === 'severe' ? 'immediate' : 'within_3_days'),
    economic_analysis: {
      total_estimated_loss_pkr:  Math.round(totalLoss),
      total_treatment_cost_pkr:  Math.round(totalTreat),
      roi_of_treatment:          totalTreat > 0 ? Math.round((totalLoss - totalTreat) / totalTreat * 10) / 10 : 0,
      scenario_no_treatment:     { expected_net_revenue_pkr: -Math.round(totalLoss) },
      scenario_with_treatment:   { expected_net_revenue_pkr: Math.round(totalLoss - totalTreat), treatment_roi_percent: totalTreat > 0 ? Math.round((totalLoss - totalTreat) / totalTreat * 100) : 0 },
    },
    raw_label: label,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODEL SINGLETON
// ─────────────────────────────────────────────────────────────────────────────
let _model = null;
let _labels = null;

async function loadModel() {
  if (_model && _labels) return { model: _model, labels: _labels };
  const labelsRes = await fetch('/class_labels.json');
  if (!labelsRes.ok) throw new Error('class_labels.json not found in public/');
  _labels = await labelsRes.json();
  _model  = await tf.loadGraphModel('/tfjs_model/model.json');
  return { model: _model, labels: _labels };
}

async function runInference(imageElement, cropType, acres) {
  const { model, labels } = await loadModel();
  const tensor = tf.browser.fromPixels(imageElement)
    .resizeNearestNeighbor([224, 224])
    .toFloat().div(255.0).expandDims(0);
  const predTensor = model.execute(tensor);
  const probs      = await predTensor.data();
  tensor.dispose();
  predTensor.dispose();
  const indexed = Array.from(probs).map((p, i) => ({ prob: p, idx: i })).sort((a, b) => b.prob - a.prob);
  const top3 = indexed.slice(0, 3).map(({ prob, idx }) => ({ label: labels[String(idx)], confidence: prob }));
  return { result: buildResult(top3[0].label, top3[0].confidence, cropType, parseFloat(acres) || 5), top3 };
}

// ─────────────────────────────────────────────────────────────────────────────
// CROPS
// ─────────────────────────────────────────────────────────────────────────────
const CROPS = [
  { value: 'wheat',      label: 'Wheat',      urdu: 'گندم',   emoji: '🌾' },
  { value: 'cotton',     label: 'Cotton',     urdu: 'کپاس',   emoji: '🌿' },
  { value: 'rice',       label: 'Rice',       urdu: 'چاول',   emoji: '🌾' },
  { value: 'sugarcane',  label: 'Sugarcane',  urdu: 'گنا',    emoji: '🎋' },
  { value: 'maize',      label: 'Maize',      urdu: 'مکئی',   emoji: '🌽' },
  { value: 'vegetables', label: 'Vegetables', urdu: 'سبزیاں', emoji: '🥬' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function SeverityBar({ value, max = 100 }) {
  const pct   = (value / max) * 100;
  const color = pct < 25 ? '#00FF7F' : pct < 55 ? '#FF8C00' : '#FF3B30';
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
        className="h-full rounded-full" style={{ background: color }} />
    </div>
  );
}

function Top3Card({ top3 }) {
  if (!top3 || top3.length < 2) return null;
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain size={14} className="text-khet-500" />
        <h4 className="section-title text-sm">Model Confidence Breakdown</h4>
      </div>
      <div className="space-y-2.5">
        {top3.map((item, i) => {
          const [plant, disease] = (item.label || '').split('___');
          const pct = Math.round(item.confidence * 100);
          const isH = (disease || '').includes('healthy');
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/60 truncate max-w-[200px]">
                  {i === 0 && <span className="text-khet-500 font-bold mr-1">✓</span>}
                  {plant} — {(disease || '').replace(/_/g, ' ')}
                </span>
                <span className={`text-xs font-bold ml-2 flex-shrink-0 ${isH ? 'text-khet-500' : 'text-orange-400'}`}>{pct}%</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.15 }}
                  className="h-full rounded-full" style={{ background: i === 0 ? '#00FF7F' : '#ffffff30' }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-white/20 mt-3 font-mono">MobileNetV2 · PlantVillage 38-class · 97.66% val accuracy</p>
    </div>
  );
}

function DiagnosisResult({ result, top3, onNegotiate }) {
  const [speaking, setSpeaking] = useState(false);
  const handleVoice = () => {
    if (speaking) { stopSpeech(); setSpeaking(false); return; }
    setSpeaking(true);
    speakDiagnosis(result, 'en');
    setTimeout(() => setSpeaking(false), 10000);
  };
  const sevColors = { none: '#00FF7F', mild: '#007AFF', moderate: '#FF8C00', severe: '#FF6B35', critical: '#FF3B30' };
  const severity  = result.severity || 'moderate';
  const sevColor  = sevColors[severity] || '#FF8C00';
  const isHealthy = !result.disease_detected;
  const confidence = Math.round((result.confidence || 0) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Disease card */}
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: `${sevColor}44`, background: `${sevColor}08` }}>
        <div className="p-4 border-b" style={{ borderColor: `${sevColor}22` }}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 mr-3">
              <div className="data-label mb-1">{isHealthy ? '✅ No Disease Detected' : '🔴 Disease Detected'}</div>
              <h3 className="section-title text-lg text-white leading-tight">{result.disease_name}</h3>
              <p className="urdu-text text-sm mt-0.5" style={{ color: sevColor }}>{result.disease_name_urdu}</p>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span className={`severity-badge severity-${severity}`}>{severity}</span>
              <motion.button onClick={handleVoice} whileTap={{ scale: 0.9 }}
                className="p-2 rounded-lg text-white/40 hover:text-white border border-white/10 transition-all">
                {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </motion.button>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="data-label mb-1.5">AI Confidence</div>
              <div className="text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{confidence}%</div>
              <SeverityBar value={confidence} />
            </div>
            <div>
              <div className="data-label mb-1.5">Area Affected</div>
              <div className="text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif", color: sevColor }}>{result.affected_percentage}%</div>
              <SeverityBar value={result.affected_percentage} />
            </div>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">{result.description}</p>
          {result.urgency === 'immediate' && (
            <motion.div animate={{ opacity: [1, 0.65, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-2 p-2.5 rounded-lg"
              style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)' }}>
              <Zap size={14} className="text-red-400" />
              <span className="text-xs text-red-400 font-semibold">IMMEDIATE ACTION REQUIRED — فوری اقدام ضروری</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="glass-card p-4">
        <h4 className="section-title text-sm mb-3">{isHealthy ? '✅ Maintenance Tips' : '⚡ Immediate Actions'}</h4>
        <div className="space-y-2">
          {(result.immediate_actions || []).map((action, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-start gap-2.5 text-sm text-white/70">
              <div className="w-5 h-5 rounded-full bg-khet-500/20 text-khet-500 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
              {action}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Treatment */}
      {!isHealthy && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical size={16} className="text-khet-500" />
            <h4 className="section-title text-sm">Recommended Treatment</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><div className="data-label mb-1">Pesticide</div><div className="text-sm text-white font-semibold">{result.recommended_pesticide}</div></div>
            <div><div className="data-label mb-1">Quantity</div><div className="text-sm text-white font-semibold">{result.quantity_per_acre}</div></div>
            <div><div className="data-label mb-1">Recovery Chance</div><div className="text-sm font-bold text-khet-500">{Math.round((result.recovery_probability || 0) * 100)}%</div></div>
            <div><div className="data-label mb-1">Cost/Acre</div><div className="text-sm font-bold text-white">₨{(result.treatment_cost_per_acre_pkr || 0).toLocaleString()}</div></div>
          </div>
        </div>
      )}

      {/* Economic impact */}
      {!isHealthy && result.economic_analysis && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={16} className="text-red-400" />
            <h4 className="section-title text-sm">Economic Impact</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="data-label mb-1">Loss Without Treatment</div>
              <div className="text-lg font-bold text-red-400" style={{ fontFamily: "'Syne', sans-serif" }}>
                ₨{Math.abs(result.economic_analysis.scenario_no_treatment?.expected_net_revenue_pkr || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="data-label mb-1">Saving With Treatment</div>
              <div className="text-lg font-bold text-khet-500" style={{ fontFamily: "'Syne', sans-serif" }}>
                ₨{(result.economic_analysis.scenario_with_treatment?.expected_net_revenue_pkr || 0).toLocaleString()}
              </div>
            </div>
            <div><div className="data-label mb-1">Treatment ROI</div><div className="text-sm font-bold text-white">{result.economic_analysis.scenario_with_treatment?.treatment_roi_percent}%</div></div>
            <div><div className="data-label mb-1">Total Treatment Cost</div><div className="text-sm font-bold text-white">₨{(result.economic_analysis.total_treatment_cost_pkr || 0).toLocaleString()}</div></div>
          </div>
        </div>
      )}

      <Top3Card top3={top3} />

      {!isHealthy && (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onNegotiate}
          className="w-full khet-button flex items-center justify-center gap-2 py-4"
          style={{ boxShadow: '0 0 30px rgba(0,255,127,0.4)' }}>
          <span>Find Best Deal — بہترین سودا ڈھونڈیں</span>
          <ChevronRight size={18} />
        </motion.button>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CROP CHATBOT — AI conversation agent about the diagnosed disease
// ─────────────────────────────────────────────────────────────────────────────

const QUICK_QUESTIONS = [
  { label: 'Why did this happen?',        urdu: 'یہ کیوں ہوا؟'              },
  { label: 'How to prevent it?',          urdu: 'روک تھام کیسے کریں؟'      },
  { label: 'Is it contagious?',           urdu: 'کیا یہ پھیل سکتا ہے؟'     },
  { label: 'Make crop more resistant',    urdu: 'فصل کو مضبوط کیسے بنائیں؟' },
  { label: 'Best spray timing?',          urdu: 'سپرے کا بہترین وقت؟'       },
  { label: 'Organic alternatives?',       urdu: 'قدرتی علاج؟'               },
];

async function askCropAgent(messages, diagnosisContext, onChunk) {
  const response = await fetch('http://127.0.0.1:8000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      disease_name:          diagnosisContext.disease_name,
      disease_name_urdu:     diagnosisContext.disease_name_urdu,
      crop_type:             diagnosisContext.cropType,
      severity:              diagnosisContext.severity,
      recommended_pesticide: diagnosisContext.recommended_pesticide,
      acres:                 diagnosisContext.acres,
    }),
  });
  if (!response.ok) throw new Error('Chat API error');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onChunk(full);
  }
  return full;
}

function CropChatbot({ result, cropType, acres }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [typing, setTyping]     = useState(false);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  const diagCtx = {
    disease_name:          result.disease_name,
    disease_name_urdu:     result.disease_name_urdu,
    cropType,
    severity:              result.severity,
    recommended_pesticide: result.recommended_pesticide,
    acres,
  };

  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = result.disease_detected
        ? `Salaam! 👋 I've analyzed your **${cropType}** crop and detected **${result.disease_name}**. I'm here to help you understand this disease, why it happened, and how to protect your fasal. What would you like to know?`
        : `Salaam! 👋 Great news — your **${cropType}** crop looks **healthy**! Prevention is always better than cure. Ask me anything about keeping your crop strong and disease-free. مبارک ہو!`;
      setMessages([{ role: 'assistant', content: greeting, id: Date.now() }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg, id: Date.now() }];
    setMessages(newMessages);
    setTyping(true);
    const assistantId = Date.now() + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId, streaming: true }]);
    try {
      await askCropAgent(newMessages.map(m => ({ role: m.role, content: m.content })), diagCtx, (partial) => {
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: partial } : m));
      });
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === assistantId
        ? { ...m, content: 'Sorry, connection issue. Please try again.', streaming: false } : m));
    } finally {
      setTyping(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const renderInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
        : part
    );
  };

  const formatText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, li) => {
      if (line.match(/^[-*•]\s/)) {
        return (
          <div key={li} className="flex items-start gap-2.5 my-1">
            <span className="text-khet-500 flex-shrink-0 mt-1.5" style={{ fontSize: 6 }}>●</span>
            <span className="text-white/80 leading-relaxed">{renderInline(line.replace(/^[-*•]\s/, ''))}</span>
          </div>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        const num = line.match(/^(\d+)\./)[1];
        return (
          <div key={li} className="flex items-start gap-2.5 my-1">
            <span className="text-khet-500 font-bold text-xs flex-shrink-0 w-4">{num}.</span>
            <span className="text-white/80 leading-relaxed">{renderInline(line.replace(/^\d+\.\s/, ''))}</span>
          </div>
        );
      }
      if (line.match(/^#{1,3}\s/)) {
        return <p key={li} className="text-white font-bold text-sm mt-3 mb-1.5">{renderInline(line.replace(/^#{1,3}\s/, ''))}</p>;
      }
      if (line.trim() === '') return <div key={li} className="h-2" />;
      return <p key={li} className="text-white/80 leading-relaxed my-0.5">{renderInline(line)}</p>;
    });
  };

  const sevColor = { none: '#4ade80', mild: '#60a5fa', moderate: '#fb923c', severe: '#f97316', critical: '#ef4444' }[result.severity] || '#4ade80';
  const unread = messages.filter(m => m.role === 'assistant' && m.content).length;

  // Agri color palette
  const soil   = '#1a0f00';
  const earth  = '#2d1a0a';
  const leaf   = '#166534';
  const wheat  = '#d97706';
  const sky    = '#0c1a0f';

  return (
    <>
      {/* ── Floating Action Button ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.92 }}
            className="fixed z-40 flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-2xl"
            style={{
              bottom: '88px', right: '12px',
              background: `linear-gradient(135deg, #16a34a, #15803d)`,
              boxShadow: '0 4px 20px rgba(22,163,74,0.5), 0 0 0 1px rgba(74,222,128,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center relative">
              <Sprout size={16} className="text-white" />
              {unread > 1 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-black text-[8px] font-black flex items-center justify-center">
                  {unread - 1}
                </span>
              )}
            </div>
            <div>
              <p className="text-white font-bold text-xs leading-none">Crop Expert</p>
              <p className="text-green-200/70 text-[9px] mt-0.5 leading-none urdu-text">ماہر سے پوچھیں</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Full Drawer ── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            />

            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="fixed inset-x-0 z-50 flex flex-col overflow-hidden"
              style={{
                bottom: '64px',
                height: 'calc(100vh - 64px)',
                borderRadius: '28px 28px 0 0',
                background: `linear-gradient(180deg, ${sky} 0%, #060d07 100%)`,
                boxShadow: '0 -20px 60px rgba(0,0,0,0.8)',
                border: '1px solid rgba(74,222,128,0.12)',
                borderBottom: 'none',
              }}
            >
              {/* Agricultural texture bg */}
              <div style={{ position:'absolute', inset:0, opacity:0.035, pointerEvents:'none', overflow:'hidden' }}>
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="agri" x="0" y="0" width="50" height="70" patternUnits="userSpaceOnUse">
                      <line x1="25" y1="70" x2="25" y2="20" stroke="#4ade80" strokeWidth="1.5"/>
                      <ellipse cx="17" cy="30" rx="6" ry="10" fill="#4ade80" transform="rotate(-25,17,30)"/>
                      <ellipse cx="33" cy="25" rx="6" ry="10" fill="#4ade80" transform="rotate(25,33,25)"/>
                      <ellipse cx="25" cy="20" rx="5" ry="9" fill="#4ade80"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#agri)"/>
                </svg>
              </div>

              {/* Drag pill */}
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                <div className="w-9 h-1 rounded-full bg-white/15" />
              </div>

              {/* ── Header ── */}
              <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(74,222,128,0.1)' }}>
                <div className="flex items-center gap-3">
                  {/* Avatar with animated ring */}
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 rounded-2xl"
                      style={{ background: 'conic-gradient(from 0deg, #16a34a, #4ade80, #16a34a)', padding: 1.5 }}
                    />
                    <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #14532d, #166534)', border: '1.5px solid #16a34a50' }}>
                      <Sprout size={20} className="text-green-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-bold text-base" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>
                      Kisaan Expert 🌾
                    </p>
                    <div className="flex items-center gap-1.5">
                      <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-[10px] text-green-400/60 font-mono">
                        {typing ? '🌱 thinking...' : 'online · agri-llm'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-xl text-[10px] font-semibold"
                    style={{ background: `${sevColor}18`, color: sevColor, border: `1px solid ${sevColor}30` }}>
                    {result.disease_detected ? `⚠️ ${result.severity}` : '✅ healthy'}
                  </div>
                  <button onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <X size={15} className="text-white/50" />
                  </button>
                </div>
              </div>

              {/* ── Context strip ── */}
              <div className="flex gap-2 px-4 py-2 flex-shrink-0 overflow-x-auto"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {[
                  { icon: '🌾', label: cropType },
                  { icon: '📐', label: `${acres} acres` },
                  { icon: '🦠', label: result.disease_name },
                  { icon: '💊', label: result.recommended_pesticide },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg flex-shrink-0 text-[10px]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                    <span>{item.icon}</span>
                    <span className="font-medium truncate max-w-[80px]">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* ── Quick questions ── */}
              {messages.length <= 1 && (
                <div className="px-4 pt-3 pb-2 flex-shrink-0">
                  <p className="text-[9px] text-white/25 font-mono tracking-widest mb-2">ASK ME ABOUT</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_QUESTIONS.map((q) => (
                      <motion.button key={q.label} whileTap={{ scale: 0.95 }}
                        onClick={() => sendMessage(q.label)}
                        className="text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all"
                        style={{
                          background: 'rgba(22,163,74,0.08)',
                          border: '1px solid rgba(74,222,128,0.15)',
                          color: 'rgba(74,222,128,0.8)',
                        }}
                      >
                        {q.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
                style={{ scrollbarWidth: 'none' }}>
                {messages.map((msg) => (
                  <motion.div key={msg.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ background: 'linear-gradient(135deg,#14532d,#166534)', border: '1px solid #16a34a40' }}>
                        <Sprout size={13} className="text-green-400" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`max-w-[86%] rounded-2xl text-sm ${msg.role === 'assistant' ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
                      style={msg.role === 'user' ? {
                        background: 'linear-gradient(135deg, #14532d, #166534)',
                        border: '1px solid rgba(74,222,128,0.25)',
                        padding: '10px 14px',
                        color: '#dcfce7',
                        boxShadow: '0 2px 12px rgba(22,163,74,0.2)',
                      } : {
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '12px 14px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="text-white/85 leading-relaxed">
                          {formatText(msg.content)}
                          {msg.streaming && msg.content && (
                            <motion.span animate={{ opacity: [1,0] }} transition={{ duration: 0.5, repeat: Infinity }}
                              className="inline-block w-0.5 h-3.5 rounded-full ml-0.5 align-middle bg-green-400" />
                          )}
                          {msg.streaming && !msg.content && (
                            <div className="flex gap-1.5 py-1">
                              {[0,1,2].map(i => (
                                <motion.div key={i} className="w-2 h-2 rounded-full bg-green-500/60"
                                  animate={{ y: [0,-5,0] }} transition={{ duration: 0.7, repeat: Infinity, delay: i*0.15 }} />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span>{msg.content}</span>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                        <User size={13} className="text-white/50" />
                      </div>
                    )}
                  </motion.div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* ── Input ── */}
              <div className="px-4 pt-3 pb-4 flex-shrink-0"
                style={{ borderTop: '1px solid rgba(74,222,128,0.08)', background: 'rgba(0,0,0,0.4)' }}>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 flex items-center rounded-2xl px-4 gap-2"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: `1.5px solid ${input.trim() ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.1)'}`,
                      transition: 'border-color 0.2s',
                    }}>
                    <Sprout size={14} className="text-green-500/50 flex-shrink-0" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Ask your question here..."
                      disabled={typing}
                      className="flex-1 bg-transparent py-3.5 text-white text-sm outline-none"
                      style={{ caretColor: '#4ade80' }}
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => sendMessage()}
                    disabled={typing || !input.trim()}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all"
                    style={{
                      background: input.trim()
                        ? 'linear-gradient(135deg, #16a34a, #15803d)'
                        : 'rgba(255,255,255,0.06)',
                      border: input.trim() ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: input.trim() ? '0 4px 16px rgba(22,163,74,0.4)' : 'none',
                    }}
                  >
                    {typing
                      ? <Loader2 size={16} className="animate-spin text-green-400" />
                      : <Send size={16} style={{ color: input.trim() ? '#fff' : 'rgba(255,255,255,0.3)' }} />
                    }
                  </motion.button>
                </div>
                <p className="text-center text-[9px] mt-2 font-mono"
                  style={{ color: 'rgba(255,255,255,0.15)' }}>
                  🌾 KhetAI · AI advice — verify with local agri officer
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Diagnose() {
  const [cropType, setCropType]       = useState('wheat');
  const [acres, setAcres]             = useState('5');

  const [preview, setPreview]         = useState(null);
  const [file, setFile]               = useState(null);
  const [imgEl, setImgEl]             = useState(null);
  const [loading, setLoading]         = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult]           = useState(null);
  const [top3, setTop3]               = useState(null);
  const [modelReady, setModelReady]   = useState(false);

  useEffect(() => {
    loadModel().then(() => setModelReady(true)).catch(() => {});
  }, []);

  const onDrop = useCallback((accepted) => {
    if (!accepted[0]) return;
    setFile(accepted[0]);
    setResult(null);
    setTop3(null);
    const url = URL.createObjectURL(accepted[0]);
    setPreview(url);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => setImgEl(img);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }, maxFiles: 1,
  });

  const handleDiagnose = async () => {
    if (!file) {
      setLoading(true);
      setLoadingStep('Loading demo...');
      await new Promise(r => setTimeout(r, 600));
      const demo = buildResult('Tomato___Late_blight', 0.87, cropType, parseFloat(acres) || 5);
      setResult(demo);
      setTop3([
        { label: 'Tomato___Late_blight', confidence: 0.87 },
        { label: 'Tomato___Early_blight', confidence: 0.09 },
        { label: 'Potato___Late_blight', confidence: 0.03 },
      ]);
      setLoading(false);
      toast.success('Demo loaded');
      return;
    }
    if (!imgEl) { toast.error('Image still loading, wait a moment'); return; }
    setLoading(true);
    setResult(null);
    setTop3(null);
    try {
      setLoadingStep('Loading AI model...');
      await new Promise(r => setTimeout(r, 50));
      setLoadingStep('Analyzing image...');
      const { result: res, top3: t3 } = await runInference(imgEl, cropType, parseFloat(acres) || 5);
      setResult(res);
      setTop3(t3);
      toast.success(res.disease_detected ? '🔴 Disease detected!' : '✅ Crop looks healthy!');
    } catch (err) {
      console.error(err);
      if (err.message?.includes('class_labels.json')) {
        toast.error('Model files missing in public/ folder');
      } else {
        toast.error('Diagnosis failed: ' + err.message);
      }
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleNegotiate = () => {
    if (result) {
      sessionStorage.setItem('khetai_diagnosis', JSON.stringify(result));
      window.location.href = '/negotiate';
    }
  };

  const reset = () => { setFile(null); setPreview(null); setImgEl(null); setResult(null); setTop3(null); };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="section-title text-2xl">Crop Diagnosis</h2>
        <p className="text-white/40 text-sm mt-0.5 urdu-text">فصل کی تشخیص</p>
      </div>

      {/* Model status */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
          modelReady ? 'bg-khet-500/10 text-khet-500 border-khet-500/30' : 'bg-white/5 text-white/30 border-white/10'}`}>
          <Cpu size={10} />
          {modelReady ? 'AI Model Ready' : 'Loading Model...'}
        </div>
        <span className="text-[10px] text-white/20 font-mono">MobileNetV2 · 38 classes · runs in browser</span>
      </div>

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title text-sm text-khet-500">AI Analysis Result</h3>
              <button onClick={reset} className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors">
                <X size={12} /> New Diagnosis
              </button>
            </div>
            {preview && <img src={preview} alt="Crop" className="w-full h-44 object-cover rounded-xl mb-4 border border-white/10" />}
            <DiagnosisResult result={result} top3={top3} onNegotiate={handleNegotiate} />
            <CropChatbot result={result} cropType={cropType} acres={parseFloat(acres) || 5} />
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Crop selector */}
            <div>
              <label className="data-label block mb-2">Select Crop — فصل منتخب کریں</label>
              <div className="grid grid-cols-3 gap-2">
                {CROPS.map(crop => (
                  <motion.button key={crop.value} whileTap={{ scale: 0.95 }} onClick={() => setCropType(crop.value)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      cropType === crop.value ? 'border-khet-500/60 bg-khet-500/10 text-khet-500' : 'border-white/10 text-white/50 hover:border-white/20'}`}>
                    <div className="text-xl mb-1">{crop.emoji}</div>
                    <div className="text-xs font-semibold" style={{ fontFamily: "'Syne', sans-serif" }}>{crop.label}</div>
                    <div className="text-xs urdu-text text-white/30">{crop.urdu}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Acres */}
            <div>
              <label className="data-label block mb-1.5">Acres — ایکڑ</label>
              <input type="number" value={acres} onChange={e => setAcres(e.target.value)} placeholder="5.0" min="0.1" step="0.5"
                className="w-full bg-soil-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-khet-500/40 transition-colors" />
            </div>

            {/* Upload */}
            <div>
              <label className="data-label block mb-2">Upload Crop Photo — فصل کی تصویر</label>
              <motion.div {...getRootProps()} whileHover={{ borderColor: 'rgba(0,255,127,0.4)' }}
                className="relative border-2 border-dashed border-white/15 rounded-2xl p-6 text-center cursor-pointer transition-all"
                style={{ background: isDragActive ? 'rgba(0,255,127,0.05)' : 'rgba(255,255,255,0.02)' }}>
                <input {...getInputProps()} />
                {preview ? (
                  <div>
                    <img src={preview} alt="Preview" className="w-full h-44 object-cover rounded-xl" />
                    <p className="text-xs text-white/40 mt-2">Tap to change — تبدیل کرنے کے لیے دبائیں</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-khet-500/10 border border-khet-500/20 flex items-center justify-center mx-auto mb-3">
                      <Camera size={24} className="text-khet-500" />
                    </div>
                    <p className="text-sm text-white/60 font-medium">{isDragActive ? 'Drop here' : 'Tap to upload crop photo'}</p>
                    <p className="text-xs text-white/30 mt-1 urdu-text">فصل کی تصویر یہاں ڈالیں</p>
                    <p className="text-xs text-white/20 mt-2">JPG, PNG, WebP · Max 10MB</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Button */}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleDiagnose} disabled={loading}
              className="w-full khet-button flex items-center justify-center gap-2.5 py-4">
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /><span>{loadingStep || 'Analyzing...'}</span></>
              ) : (
                <><Microscope size={18} /><span>{file ? 'Diagnose Crop — تشخیص کریں' : 'Load Demo — ڈیمو دیکھیں'}</span></>
              )}
            </motion.button>

            {loading && (
              <div className="glass-card p-4 space-y-3">
                <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-y-0 w-1/3 rounded-full"
                    style={{ background: 'linear-gradient(90deg,transparent,#00FF7F,transparent)' }} />
                </div>
                <p className="text-xs text-white/40 text-center">🤖 {loadingStep} — running locally in your browser</p>
              </div>
            )}

            {!file && <p className="text-center text-xs text-white/25">No image? Try the demo · براہ کرم تصویر اپلوڈ کریں</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}