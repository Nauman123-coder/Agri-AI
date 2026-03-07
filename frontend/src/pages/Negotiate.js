import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartHandshake, Bot, Store, CheckCircle, XCircle, Loader2,
  Volume2, VolumeX, ChevronRight, Star, Truck, Clock,
  BadgeCheck, TrendingDown, Zap, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { startNegotiation, acceptDeal } from '../utils/api';
import { speakNegotiation, stopSpeech } from '../utils/voice';

const CROPS = ['wheat', 'cotton', 'rice', 'sugarcane', 'maize', 'vegetables'];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 rounded-2xl rounded-bl-sm glass-card w-fit">
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          className="w-1.5 h-1.5 rounded-full bg-khet-500/60"
        />
      ))}
    </div>
  );
}

function ChatMessage({ msg, index }) {
  const isAgent = msg.role === 'agent';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.15 }}
      className={`flex ${isAgent ? 'justify-start' : 'justify-end'} mb-3`}
    >
      <div className="flex items-end gap-2 max-w-xs">
        {isAgent && (
          <div className="w-6 h-6 rounded-full bg-khet-500/20 border border-khet-500/30 flex items-center justify-center flex-shrink-0">
            <Bot size={12} className="text-khet-500" />
          </div>
        )}
        <div>
          <div className={isAgent ? 'chat-bubble-agent' : 'chat-bubble-vendor'}>
            <p className="text-sm leading-relaxed">{msg.message}</p>
          </div>
          <p className="text-[10px] text-white/20 mt-1 px-1 font-mono">
            {isAgent ? '🤖 KhetAI Agent' : '🏪 Vendor'} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {!isAgent && (
          <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Store size={12} className="text-white/60" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function VendorCard({ vendor, isSelected, onSelect }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(vendor)}
      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'border-khet-500/60 bg-khet-500/08'
          : 'border-white/10 hover:border-white/20'
      }`}
      style={isSelected ? { background: 'rgba(0,255,127,0.06)' } : {}}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              {vendor.vendor_name}
            </span>
            {vendor.verified !== false && <BadgeCheck size={12} className="text-blue-400" />}
          </div>
          <p className="text-xs text-white/40">{vendor.location || vendor.city}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-yellow-400">
          <Star size={10} fill="currentColor" />
          <span>{vendor.rating || '4.5'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="data-label">Original</div>
          <div className="text-white/50 line-through">₨{(vendor.original_price_pkr || 12000).toLocaleString()}</div>
        </div>
        <div>
          <div className="data-label">Negotiated</div>
          <div className="text-khet-500 font-bold">₨{(vendor.negotiated_price_pkr || 9800).toLocaleString()}</div>
        </div>
        <div>
          <div className="data-label">Delivery</div>
          <div className="text-white flex items-center gap-0.5">
            <Truck size={10} />
            {vendor.delivery_days || 2}d
          </div>
        </div>
      </div>

      {vendor.discount_percentage > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          <TrendingDown size={11} className="text-khet-500" />
          <span className="text-xs text-khet-500 font-semibold">
            {vendor.discount_percentage?.toFixed(1)}% savings
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function Negotiate() {
  const [formData, setFormData] = useState({
    disease_name: '',
    crop_type: 'wheat',
    recommended_pesticide: '',
    quantity_per_acre: '1.5 liters',
    acres: '5',
    farmer_location: 'Punjab, Pakistan',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showTyping, setShowTyping] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const messagesEndRef = useRef(null);

  // Load diagnosis from previous page if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('khetai_diagnosis');
      if (saved) {
        const diag = JSON.parse(saved);
        setFormData(prev => ({
          ...prev,
          disease_name: diag.disease_name || '',
          crop_type: diag.crop_type || 'wheat',
          recommended_pesticide: diag.recommended_pesticide || '',
          quantity_per_acre: diag.quantity_per_acre || '1.5 liters',
          acres: String(diag.acres || 5),
        }));
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping]);

  // Animate messages one by one
  useEffect(() => {
    if (!result || messageIndex >= (result.negotiation_messages?.length || 0)) return;
    const timer = setTimeout(() => {
      setShowTyping(true);
      setTimeout(() => {
        setShowTyping(false);
        setMessages(prev => [...prev, result.negotiation_messages[messageIndex]]);
        setMessageIndex(prev => prev + 1);
      }, 1200);
    }, messageIndex === 0 ? 500 : 800);
    return () => clearTimeout(timer);
  }, [result, messageIndex]);

  const handleNegotiate = async () => {
    if (!formData.disease_name || !formData.recommended_pesticide) {
      toast.error('Please fill in disease name and pesticide');
      return;
    }
    setLoading(true);
    setResult(null);
    setMessages([]);
    setMessageIndex(0);
    setSelectedVendor(null);
    setAccepted(false);

    try {
      const data = await startNegotiation({
        ...formData,
        acres: parseFloat(formData.acres) || 5,
      });
      setResult(data);
      if (data.best_vendor) setSelectedVendor(data.best_vendor);
      toast.success('Negotiation complete!');
    } catch (e) {
      toast.error('Negotiation failed. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoNegotiate = async () => {
    setFormData({
      disease_name: 'Fall Armyworm (Spodoptera frugiperda)',
      crop_type: 'wheat',
      recommended_pesticide: 'Chlorpyrifos 20EC',
      quantity_per_acre: '1.5 liters',
      acres: '5',
      farmer_location: 'Punjab, Pakistan',
    });
    setTimeout(handleNegotiate, 100);
  };

  const handleAccept = async () => {
    if (!selectedVendor || !result) return;
    try {
      await acceptDeal({
        negotiation_id: result.negotiation_id || 'NEG-00001',
        vendor_id: selectedVendor.vendor_id || 'V001',
        agreed_price_pkr: selectedVendor.negotiated_price_pkr || 9800,
        farmer_name: 'Farmer',
      });
      setAccepted(true);
      toast.success('✅ Deal confirmed! Vendor notified.');
    } catch (e) {
      toast.error('Could not confirm deal. Try again.');
    }
  };

  const handleVoice = () => {
    if (speaking) { stopSpeech(); setSpeaking(false); return; }
    if (!result) return;
    setSpeaking(true);
    speakNegotiation(result, 'en');
    setTimeout(() => setSpeaking(false), 12000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="section-title text-2xl">Negotiate</h2>
        <p className="text-white/40 text-sm mt-0.5 urdu-text">خودکار بھاؤ تاؤ</p>
      </div>

      {/* Form */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Bot size={16} className="text-khet-500" />
          <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Negotiation Details
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="data-label block mb-1">Crop Type</label>
            <select value={formData.crop_type} onChange={e => setFormData(p => ({ ...p, crop_type: e.target.value }))}
              className="w-full bg-soil-700 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none">
              {CROPS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="data-label block mb-1">Acres</label>
            <input type="number" value={formData.acres}
              onChange={e => setFormData(p => ({ ...p, acres: e.target.value }))}
              className="w-full bg-soil-700 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none"
              placeholder="5" />
          </div>
        </div>

        <div>
          <label className="data-label block mb-1">Disease / Problem</label>
          <input type="text" value={formData.disease_name}
            onChange={e => setFormData(p => ({ ...p, disease_name: e.target.value }))}
            className="w-full bg-soil-700 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none"
            placeholder="e.g. Fall Armyworm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="data-label block mb-1">Pesticide Needed</label>
            <input type="text" value={formData.recommended_pesticide}
              onChange={e => setFormData(p => ({ ...p, recommended_pesticide: e.target.value }))}
              className="w-full bg-soil-700 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none"
              placeholder="Chlorpyrifos 20EC" />
          </div>
          <div>
            <label className="data-label block mb-1">Qty/Acre</label>
            <input type="text" value={formData.quantity_per_acre}
              onChange={e => setFormData(p => ({ ...p, quantity_per_acre: e.target.value }))}
              className="w-full bg-soil-700 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none"
              placeholder="1.5 liters" />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNegotiate}
            disabled={loading}
            className="flex-1 khet-button flex items-center justify-center gap-2 py-3 text-sm"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <HeartHandshake size={16} />}
            {loading ? 'Negotiating...' : 'Start Negotiation'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleDemoNegotiate}
            disabled={loading}
            className="px-4 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white text-xs transition-all"
          >
            Demo
          </motion.button>
        </div>
      </div>

      {/* Chat Interface */}
      <AnimatePresence>
        {(messages.length > 0 || showTyping || loading) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-khet-500" />
                <span className="section-title text-sm text-khet-500">Live Negotiation Chat</span>
              </div>
              {result && (
                <motion.button onClick={handleVoice} whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white border border-white/10 transition-all">
                  {speaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </motion.button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
              {messages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} index={i} />
              ))}
              {showTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-2">
                  <div className="flex items-end gap-2">
                    <div className="w-6 h-6 rounded-full bg-khet-500/20 border border-khet-500/30 flex items-center justify-center">
                      <Bot size={12} className="text-khet-500" />
                    </div>
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Negotiation Summary */}
            <div className="glass-card p-4">
              <div className="data-label mb-2">Negotiation Summary</div>
              <p className="text-sm text-white/70">{result.negotiation_summary}</p>
              <p className="urdu-text text-sm text-white/40 mt-1">{result.negotiation_summary_urdu}</p>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                <div>
                  <div className="data-label">Total Savings</div>
                  <div className="text-khet-500 font-bold text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>
                    ₨{(result.total_savings_pkr || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="data-label">Recommendation</div>
                  <div className={`flex items-center gap-1 text-sm font-semibold ${
                    result.recommendation === 'Accept' ? 'text-khet-500' : 'text-yellow-400'
                  }`}>
                    {result.recommendation === 'Accept' ? <CheckCircle size={14} /> : <Clock size={14} />}
                    {result.recommendation}
                  </div>
                </div>
                <div>
                  <div className="data-label">Confidence</div>
                  <div className="text-white font-semibold text-sm">
                    {Math.round((result.confidence || 0.9) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Vendor Options */}
            <div>
              <h3 className="section-title text-sm text-white/60 mb-3">Vendor Offers</h3>
              <div className="space-y-2">
                {(result.all_vendors || []).slice(0, 4).map(vendor => {
                  const displayVendor = {
                    ...vendor,
                    vendor_id: vendor.id,
                    vendor_name: vendor.name,
                    original_price_pkr: vendor.total_cost_pkr,
                    negotiated_price_pkr: Math.round(vendor.total_cost_pkr * 0.88),
                    discount_percentage: 12,
                  };
                  return (
                    <VendorCard
                      key={vendor.id}
                      vendor={vendor.id === result.best_vendor?.vendor_id
                        ? { ...result.best_vendor, location: vendor.location }
                        : displayVendor}
                      isSelected={selectedVendor?.vendor_id === vendor.id || selectedVendor?.vendor_id === result.best_vendor?.vendor_id && vendor.id === result.best_vendor?.vendor_id}
                      onSelect={(v) => setSelectedVendor(v)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Accept CTA */}
            {!accepted ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAccept}
                className="w-full py-4 rounded-2xl font-bold text-soil-950 flex items-center justify-center gap-2"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  background: 'linear-gradient(135deg, #00FF7F, #00cc66)',
                  boxShadow: '0 0 30px rgba(0,255,127,0.5)',
                  fontSize: '1rem',
                }}
              >
                <CheckCircle size={20} />
                <span>Confirm Deal — سودا قبول کریں</span>
                <ChevronRight size={18} />
              </motion.button>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-khet-500"
                style={{ background: 'rgba(0,255,127,0.1)', border: '1px solid rgba(0,255,127,0.3)' }}
              >
                <CheckCircle size={20} />
                <div>
                  <div className="font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Deal Confirmed!</div>
                  <div className="text-xs urdu-text text-khet-500/70">سودا طے ہو گیا!</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
