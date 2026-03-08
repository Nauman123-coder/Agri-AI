/**
 * VoiceAssistant.js — Urdu + English Voice Interface for KhetAI
 * Uses Web Speech API for STT + TTS with Groq backend for AI responses
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Languages, Sprout, Trash2 } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ── Language config ──────────────────────────────────────────────────────────
const LANGS = {
  urdu:    { code: 'ur-PK', label: 'اردو', flag: '🇵🇰', hint: 'اپنا سوال بولیں...' },
  english: { code: 'en-US', label: 'English', flag: '🇬🇧', hint: 'Ask your question...' },
};

// ── Quick voice prompts ──────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { urdu: 'گندم کی بیماریاں کون سی ہیں؟', english: 'What diseases affect wheat?',        icon: '🌾' },
  { urdu: 'کپاس کی فصل کب لگائیں؟',         english: 'When to plant cotton in Pakistan?', icon: '🌿' },
  { urdu: 'زنگ بیماری کا علاج کیا ہے؟',     english: 'How to treat wheat rust disease?',  icon: '🦠' },
  { urdu: 'پانی کتنا دینا چاہیے؟',           english: 'How much water does wheat need?',   icon: '💧' },
  { urdu: 'کھاد کب ڈالنی چاہیے؟',            english: 'When to apply fertilizer?',         icon: '🌱' },
  { urdu: 'منڈی قیمت کیا ہے؟',               english: 'What is the mandi price today?',    icon: '💰' },
];

// ── Animated waveform bars ───────────────────────────────────────────────────
function Waveform({ active, color = '#4ade80' }) {
  return (
    <div className="flex items-center justify-center gap-1" style={{ height: 40 }}>
      {[...Array(12)].map((_, i) => (
        <motion.div key={i}
          animate={active ? {
            height: [8, Math.random() * 30 + 10, 8],
            opacity: [0.5, 1, 0.5],
          } : { height: 4, opacity: 0.2 }}
          transition={active ? {
            duration: 0.5 + Math.random() * 0.4,
            repeat: Infinity,
            delay: i * 0.07,
            ease: 'easeInOut',
          } : { duration: 0.3 }}
          style={{ width: 3, borderRadius: 2, background: color }}
        />
      ))}
    </div>
  );
}

// ── Conversation bubble ──────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 12, flexShrink: 0,
        background: isUser ? 'rgba(255,255,255,0.08)' : 'rgba(22,163,74,0.15)',
        border: isUser ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(74,222,128,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
      }}>
        {isUser ? '👤' : <Sprout size={14} style={{ color: '#4ade80' }} />}
      </div>
      <div style={{
        maxWidth: '82%',
        background: isUser
          ? 'linear-gradient(135deg, rgba(22,163,74,0.2), rgba(22,163,74,0.1))'
          : 'rgba(255,255,255,0.04)',
        border: isUser ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        padding: '10px 14px',
      }}>
        {msg.lang === 'urdu' && (
          <p style={{ color: 'rgba(74,222,128,0.6)', fontSize: 9, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>
            🎤 URDU
          </p>
        )}
        <p style={{
          color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.6,
          fontFamily: msg.lang === 'urdu' ? "'Noto Nastaliq Urdu', serif" : 'inherit',
          direction: msg.lang === 'urdu' ? 'rtl' : 'ltr',
          textAlign: msg.lang === 'urdu' ? 'right' : 'left',
        }}>
          {msg.content}
          {msg.streaming && (
            <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}
              style={{ display: 'inline-block', width: 2, height: 13, background: '#4ade80', borderRadius: 1, marginLeft: 3, verticalAlign: 'middle' }} />
          )}
        </p>
        {msg.audio && (
          <button onClick={() => speakText(msg.content, msg.lang)}
            className="flex items-center gap-1 mt-2"
            style={{ color: 'rgba(74,222,128,0.6)', fontSize: 10 }}>
            <Volume2 size={11} /> Play again
          </button>
        )}
      </div>
    </motion.div>
  );
}

function speakText(text, lang) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang === 'urdu' ? 'ur-PK' : 'en-US';
  utt.rate = 0.9;
  utt.pitch = 1.0;
  window.speechSynthesis.speak(utt);
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function VoiceAssistant() {
  const [lang, setLang]           = useState('urdu');
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking]   = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages]   = useState([]);
  const [muted, setMuted]         = useState(false);
  const [supported, setSupported] = useState(true);
  const [processing, setProcessing] = useState(false);
  const bottomRef                 = useRef(null);
  const recognitionRef            = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSupported(false);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Start listening ──────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = LANGS[lang].code;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart  = () => setListening(true);
    recognition.onend    = () => setListening(false);
    recognition.onerror  = () => setListening(false);

    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(t);
      if (e.results[0].isFinal) {
        setListening(false);
        sendMessage(t);
      }
    };

    recognition.start();
  }, [lang]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  // ── Send to AI ──────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setTranscript('');

    const userMsg = { role: 'user', content: text, lang, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setProcessing(true);

    const assistantId = Date.now() + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '', lang: 'english', id: assistantId, streaming: true, audio: false }]);

    try {
      const systemPrompt = lang === 'urdu'
        ? `آپ KhetAI کے ماہر زرعی مشیر ہیں۔ پاکستانی کسانوں کی مدد کریں۔ ہمیشہ اردو میں جواب دیں۔ مختصر اور عملی مشورہ دیں۔ پنجاب اور سندھ کے موسم کو مدنظر رکھیں۔`
        : `You are KhetAI's expert agricultural advisor for Pakistani farmers. Give practical, concise advice in English. Reference Pakistani context: Punjab/Sindh climate, local crop varieties, PKR prices, mandi markets.`;

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          context: {
            disease_name: 'General Query',
            cropType: 'general',
            severity: 'none',
            recommended_pesticide: 'N/A',
            acres: 5,
            system_override: systemPrompt,
          },
        }),
      });

      if (!response.ok) throw new Error('API error');

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: full } : m));
      }

      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, streaming: false, audio: true } : m));

      // Auto-speak response
      if (!muted) {
        setSpeaking(true);
        speakText(full, lang === 'urdu' ? 'urdu' : 'english');
        setTimeout(() => setSpeaking(false), full.length * 60);
      }

    } catch {
      // Fallback response
      const fallback = lang === 'urdu'
        ? 'معافی کریں، ابھی کنکشن نہیں ہے۔ دوبارہ کوشش کریں۔'
        : 'Sorry, connection issue. Please try again.';
      setMessages(prev => prev.map(m => m.id === assistantId
        ? { ...m, content: fallback, streaming: false }
        : m));
    } finally {
      setProcessing(false);
    }
  };

  const clearChat = () => setMessages([]);
  const currentLang = LANGS[lang];

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 180px)', minHeight: 500 }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 style={{ color: 'white', fontWeight: 900, fontSize: 22, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}>
            Voice Assistant 🎙️
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
            بولیں · Speak · AI responds
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mute toggle */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMuted(!muted)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {muted ? <VolumeX size={16} style={{ color: '#f87171' }} /> : <Volume2 size={16} style={{ color: '#4ade80' }} />}
          </motion.button>
          {/* Clear */}
          {messages.length > 0 && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={clearChat}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Trash2 size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Language toggle */}
      <div className="flex gap-2 mb-4 flex-shrink-0">
        {Object.entries(LANGS).map(([key, l]) => (
          <button key={key} onClick={() => setLang(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: lang === key ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${lang === key ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.08)'}`,
              color: lang === key ? '#4ade80' : 'rgba(255,255,255,0.5)',
            }}>
            <span>{l.flag}</span> <span>{l.label}</span>
          </button>
        ))}
        <div className="flex-1 flex items-center justify-end">
          <Languages size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4" style={{ scrollbarWidth: 'none' }}>
        {messages.length === 0 ? (
          <div>
            {/* Quick prompts */}
            <div style={{
              background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(74,222,128,0.12)',
              borderRadius: 20, padding: '20px', marginBottom: 16, textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎙️</div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 16, fontFamily: "'Syne', sans-serif" }}>
                {lang === 'urdu' ? 'مائیک دبائیں اور بولیں' : 'Press the mic and speak'}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
                {currentLang.hint}
              </p>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 10 }}>
              QUICK QUESTIONS
            </p>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((p, i) => (
                <motion.button key={i} whileTap={{ scale: 0.97 }}
                  onClick={() => sendMessage(lang === 'urdu' ? p.urdu : p.english)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <span style={{
                    color: 'rgba(255,255,255,0.7)', fontSize: 13,
                    fontFamily: lang === 'urdu' ? "'Noto Nastaliq Urdu', serif" : 'inherit',
                    direction: lang === 'urdu' ? 'rtl' : 'ltr',
                  }}>
                    {lang === 'urdu' ? p.urdu : p.english}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => <Bubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Mic area */}
      {!supported ? (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
          <p style={{ color: '#f87171', fontSize: 13 }}>
            ⚠️ Voice recognition not supported in this browser. Use Chrome or Edge.
          </p>
        </div>
      ) : (
        <div className="flex-shrink-0">
          {/* Live transcript */}
          <AnimatePresence>
            {(listening || transcript) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{
                  background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(74,222,128,0.2)',
                  borderRadius: 14, padding: '10px 14px', marginBottom: 12,
                }}>
                <Waveform active={listening} />
                {transcript && (
                  <p style={{
                    color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', marginTop: 8,
                    fontFamily: lang === 'urdu' ? "'Noto Nastaliq Urdu', serif" : 'inherit',
                    direction: lang === 'urdu' ? 'rtl' : 'ltr',
                  }}>
                    {transcript}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Big mic button */}
          <div className="flex flex-col items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onMouseDown={startListening}
              onMouseUp={stopListening}
              onTouchStart={startListening}
              onTouchEnd={stopListening}
              disabled={processing}
              className="relative flex items-center justify-center rounded-full"
              style={{
                width: 80, height: 80,
                background: listening
                  ? 'linear-gradient(135deg, #dc2626, #ef4444)'
                  : 'linear-gradient(135deg, #16a34a, #15803d)',
                boxShadow: listening
                  ? '0 0 0 12px rgba(239,68,68,0.15), 0 0 40px rgba(239,68,68,0.3)'
                  : '0 0 0 8px rgba(22,163,74,0.1), 0 4px 20px rgba(22,163,74,0.3)',
                border: 'none',
                transition: 'all 0.2s',
                cursor: processing ? 'not-allowed' : 'pointer',
                opacity: processing ? 0.6 : 1,
              }}
            >
              {listening
                ? <MicOff size={32} className="text-white" />
                : <Mic size={32} className="text-white" />
              }
              {listening && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{
                    position: 'absolute', inset: -12, borderRadius: '50%',
                    border: '2px solid rgba(239,68,68,0.4)',
                  }}
                />
              )}
            </motion.button>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center' }}>
              {listening ? '🔴 Listening... release to send' : processing ? '⏳ Processing...' : '⬆️ Hold to speak · press quick questions above'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}