/**
 * VoiceAssistant.js — KhetAI Voice Chatbot (v2)
 * - Press mic → speak → AI answers in voice + text
 * - STOP button always visible while speaking/listening
 * - Voice AUTO-STOPS when leaving the page (cleanup on unmount)
 * - Better TTS quality (rate, pitch, best available voice)
 * - Clean voice chatbot UI
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Square, Volume2, VolumeX, Trash2,
  Sprout, ChevronRight, Loader
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const LANGS = {
  en: { code: 'en-US', label: 'English', flag: '🇬🇧', placeholder: 'Tap mic and speak...' },
  ur: { code: 'ur-PK', label: 'اردو',   flag: '🇵🇰', placeholder: 'مائیک دبائیں اور بولیں...' },
};

const STARTERS = [
  { en: 'What diseases affect wheat this season?',    ur: 'اس موسم میں گندم کی بیماریاں کون سی ہیں؟', icon: '🌾' },
  { en: 'How do I treat cotton leaf curl virus?',     ur: 'کپاس کے پتوں کے مڑنے کا علاج کیا ہے؟',    icon: '🌿' },
  { en: 'Best time to apply fertilizer for wheat?',  ur: 'گندم کو کھاد کب دینی چاہیے؟',              icon: '🌱' },
  { en: 'How much water does rice need per week?',    ur: 'چاول کو ہفتے میں کتنا پانی چاہیے؟',        icon: '💧' },
  { en: 'What pesticide kills aphids on vegetables?', ur: 'سبزیوں پر مکھیوں کے لیے کون سی دوائی ہے؟',icon: '🐛' },
  { en: 'Current wheat price in Lahore mandi?',       ur: 'لاہور منڈی میں گندم کی قیمت کیا ہے؟',      icon: '💰' },
];

// ── Global TTS controller ─────────────────────────────────────────────────
const TTS = {
  speak(text, langCode, onStart, onEnd) {
    if (!window.speechSynthesis) return;
    this.stop();
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === langCode && v.localService)
      || voices.find(v => v.lang === langCode)
      || voices.find(v => v.lang.startsWith(langCode.split('-')[0]))
      || null;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang   = langCode;
    utt.rate   = langCode.startsWith('ur') ? 0.82 : 0.88;
    utt.pitch  = langCode.startsWith('ur') ? 1.1  : 1.0;
    utt.volume = 1.0;
    if (preferred) utt.voice = preferred;
    utt.onstart = () => onStart?.();
    utt.onend   = () => onEnd?.();
    utt.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utt);
  },
  stop() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  },
};

// ── Waveform bars ─────────────────────────────────────────────────────────
const BAR_H = [0.4, 0.7, 1.0, 0.8, 0.6, 0.9, 1.0, 0.7, 0.5, 0.8, 0.6, 0.4];
function Waveform({ active, color }) {
  return (
    <div className="flex items-end justify-center gap-[3px]" style={{ height: 28 }}>
      {BAR_H.map((h, i) => (
        <motion.div key={i}
          animate={active ? { height: [`${h * 8}px`, `${h * 24}px`, `${h * 8}px`] } : { height: '4px' }}
          transition={active
            ? { duration: 0.55, repeat: Infinity, delay: i * 0.06, ease: 'easeInOut' }
            : { duration: 0.25 }}
          style={{ width: 3, borderRadius: 2, background: color, minHeight: 4 }}
        />
      ))}
    </div>
  );
}

// ── Bubble ────────────────────────────────────────────────────────────────
function Bubble({ msg, onReplay, isSpeakingThis, muted }) {
  const isUser = msg.role === 'user';
  const isUrdu = msg.lang === 'ur';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 12, flexShrink: 0, marginTop: 2,
        background: isUser ? 'rgba(255,255,255,0.07)' : 'rgba(22,163,74,0.18)',
        border: isUser ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(74,222,128,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser ? <span style={{ fontSize: 16 }}>👤</span> : <Sprout size={16} style={{ color: '#4ade80' }} />}
      </div>
      <div style={{ maxWidth: '78%' }}>
        {isSpeakingThis && !isUser && (
          <div className="mb-1.5 ml-1"><Waveform active color="#4ade80" /></div>
        )}
        <div style={{
          background: isUser
            ? 'linear-gradient(135deg, rgba(22,163,74,0.22), rgba(22,163,74,0.12))'
            : 'rgba(255,255,255,0.05)',
          border: isUser ? '1px solid rgba(74,222,128,0.28)' : '1px solid rgba(255,255,255,0.09)',
          borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
          padding: '11px 15px',
        }}>
          <p style={{
            color: 'rgba(255,255,255,0.88)', fontSize: 14, lineHeight: 1.65, margin: 0,
            fontFamily: isUrdu ? "'Noto Nastaliq Urdu', serif" : "'DM Sans', sans-serif",
            direction: isUrdu ? 'rtl' : 'ltr', textAlign: isUrdu ? 'right' : 'left',
          }}>
            {msg.content}
            {msg.streaming && (
              <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.7, repeat: Infinity }}
                style={{ display: 'inline-block', width: 2, height: 14, background: '#4ade80', borderRadius: 1, marginLeft: 4, verticalAlign: 'middle' }} />
            )}
          </p>
        </div>
        {!isUser && !msg.streaming && !muted && msg.content && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onReplay(msg)}
            className="flex items-center gap-1.5 mt-1.5 ml-1 px-2.5 py-1 rounded-lg"
            style={{
              background: isSpeakingThis ? 'rgba(239,68,68,0.1)' : 'transparent',
              border: isSpeakingThis ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent',
            }}>
            {isSpeakingThis
              ? <Square size={11} style={{ color: '#f87171' }} />
              : <Volume2 size={11} style={{ color: 'rgba(74,222,128,0.5)' }} />
            }
            <span style={{ fontSize: 10, color: isSpeakingThis ? '#f87171' : 'rgba(74,222,128,0.5)', fontFamily: "'JetBrains Mono', monospace" }}>
              {isSpeakingThis ? 'STOP' : 'REPLAY'}
            </span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function VoiceAssistant() {
  const [lang, setLang]             = useState('en');
  const [messages, setMessages]     = useState([]);
  const [listening, setListening]   = useState(false);
  const [processing, setProcessing] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [muted, setMuted]           = useState(false);
  const [liveText, setLiveText]     = useState('');
  const [supported, setSupported]   = useState(true);

  const recognitionRef = useRef(null);
  const bottomRef      = useRef(null);
  const mutedRef       = useRef(muted);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Check support + preload voices
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) setSupported(false);
    window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', () => window.speechSynthesis.getVoices());
  }, []);

  // *** STOP EVERYTHING when page unmounts (user navigates away) ***
  useEffect(() => {
    return () => {
      TTS.stop();
      recognitionRef.current?.abort();
    };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, liveText]);

  const stopSpeaking = useCallback(() => { TTS.stop(); setSpeakingId(null); }, []);

  const speakMsg = useCallback((msg) => {
    if (mutedRef.current || !msg.content) return;
    const code = msg.lang === 'ur' ? 'ur-PK' : 'en-US';
    setSpeakingId(msg.id);
    TTS.speak(msg.content, code, () => setSpeakingId(msg.id), () => setSpeakingId(null));
  }, []);

  const handleReplay = useCallback((msg) => {
    speakingId === msg.id ? stopSpeaking() : speakMsg(msg);
  }, [speakingId, speakMsg, stopSpeaking]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || processing) return;
    stopSpeaking();
    setLiveText('');
    const uid = Date.now();
    const aid = uid + 1;
    setMessages(prev => [...prev,
      { role: 'user', content: text, lang, id: uid },
      { role: 'assistant', content: '', lang, id: aid, streaming: true },
    ]);
    setProcessing(true);

    const sys = lang === 'ur'
      ? `آپ KhetAI کے ماہر زرعی مشیر ہیں۔ پاکستانی کسانوں کو اردو میں واضح، عملی اور مختصر جواب دیں۔ صرف زراعت کے بارے میں بات کریں۔`
      : `You are KhetAI, an expert agricultural advisor for Pakistani farmers. Give clear, conversational, practical answers in English. Be concise — farmers want quick actionable advice. Reference Pakistani context when relevant (Punjab/Sindh, PKR, local crop varieties).`;

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          context: { disease_name: 'Voice Query', cropType: 'general', severity: 'none', recommended_pesticide: 'N/A', acres: 5, system_override: sys },
        }),
      });
      if (!res.ok) throw new Error();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        setMessages(prev => prev.map(m => m.id === aid ? { ...m, content: full } : m));
      }
      const final = { role: 'assistant', content: full, lang, id: aid, streaming: false };
      setMessages(prev => prev.map(m => m.id === aid ? final : m));
      if (!mutedRef.current && full) {
        const code = lang === 'ur' ? 'ur-PK' : 'en-US';
        setSpeakingId(aid);
        TTS.speak(full, code, () => setSpeakingId(aid), () => setSpeakingId(null));
      }
    } catch {
      const err = lang === 'ur' ? 'معافی کریں، سرور سے جواب نہیں آیا۔' : 'Sorry, could not reach the server. Please try again.';
      setMessages(prev => prev.map(m => m.id === aid ? { ...m, content: err, streaming: false } : m));
    } finally {
      setProcessing(false);
    }
  }, [lang, processing, stopSpeaking]);

  const startListening = useCallback(() => {
    if (listening || processing) return;
    stopSpeaking();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = LANGS[lang].code;
    rec.continuous = false;
    rec.interimResults = true;
    recognitionRef.current = rec;
    rec.onstart  = () => { setListening(true); setLiveText(''); };
    rec.onend    = () => { setListening(false); };
    rec.onerror  = () => { setListening(false); setLiveText(''); };
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setLiveText(t);
      if (e.results[e.results.length - 1].isFinal) {
        setListening(false);
        if (t.trim()) sendMessage(t.trim());
      }
    };
    rec.start();
  }, [lang, listening, processing, stopSpeaking, sendMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const clearChat = useCallback(() => { stopSpeaking(); setMessages([]); setLiveText(''); }, [stopSpeaking]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', minHeight: 520 }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4" style={{ flexShrink: 0 }}>
        <div>
          <h1 style={{ color: 'white', fontWeight: 900, fontSize: 22, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}>
            Voice Assistant 🎙️
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>Ask anything · بولیں</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => { if (!muted) stopSpeaking(); setMuted(m => !m); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: muted ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)', border: `1px solid ${muted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
            {muted ? <VolumeX size={16} style={{ color: '#f87171' }} /> : <Volume2 size={16} style={{ color: '#4ade80' }} />}
          </motion.button>
          {messages.length > 0 && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={clearChat}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Trash2 size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Lang toggle */}
      <div className="flex gap-2 mb-4" style={{ flexShrink: 0 }}>
        {Object.entries(LANGS).map(([key, l]) => (
          <button key={key} onClick={() => { stopSpeaking(); setLang(key); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: lang === key ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${lang === key ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.08)'}`,
              color: lang === key ? '#4ade80' : 'rgba(255,255,255,0.5)',
            }}>
            <span>{l.flag}</span><span>{l.label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }} className="space-y-4 pr-1 mb-4">
        {messages.length === 0 && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.03))',
              border: '1px solid rgba(74,222,128,0.12)', borderRadius: 20,
              padding: '24px 20px', textAlign: 'center', marginBottom: 20,
            }}>
              <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.5, repeat: Infinity }} style={{ fontSize: 52, marginBottom: 10 }}>🎙️</motion.div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 16, fontFamily: "'Syne', sans-serif" }}>
                {lang === 'ur' ? 'مائیک دبائیں اور بولیں' : 'Hold mic and ask your question'}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 6 }}>{LANGS[lang].placeholder}</p>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 10 }}>TRY ASKING</p>
            <div className="space-y-2">
              {STARTERS.map((s, i) => (
                <motion.button key={i} whileTap={{ scale: 0.97 }} disabled={processing}
                  onClick={() => sendMessage(lang === 'ur' ? s.ur : s.en)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', opacity: processing ? 0.5 : 1 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                  <span style={{
                    color: 'rgba(255,255,255,0.65)', fontSize: 13, flex: 1,
                    fontFamily: lang === 'ur' ? "'Noto Nastaliq Urdu', serif" : "'DM Sans', sans-serif",
                    direction: lang === 'ur' ? 'rtl' : 'ltr',
                  }}>{lang === 'ur' ? s.ur : s.en}</span>
                  <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <Bubble key={msg.id} msg={msg} onReplay={handleReplay} isSpeakingThis={speakingId === msg.id} muted={muted} />
        ))}

        <AnimatePresence>
          {liveText && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-row-reverse gap-3">
              <div style={{ width: 34, height: 34, borderRadius: 12, flexShrink: 0, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
              <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '18px 4px 18px 18px', padding: '11px 15px', maxWidth: '78%' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontStyle: 'italic', margin: 0, direction: lang === 'ur' ? 'rtl' : 'ltr', fontFamily: lang === 'ur' ? "'Noto Nastaliq Urdu', serif" : "'DM Sans', sans-serif" }}>{liveText}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Controls */}
      {!supported ? (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: '14px', textAlign: 'center' }}>
          <p style={{ color: '#f87171', fontSize: 13 }}>⚠️ Voice not supported. Please use Chrome or Edge.</p>
        </div>
      ) : (
        <div style={{ flexShrink: 0 }}>

          {/* Status + STOP strip */}
          <AnimatePresence>
            {(listening || processing || speakingId !== null) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{
                  background: listening ? 'rgba(239,68,68,0.08)' : speakingId ? 'rgba(22,163,74,0.08)' : 'rgba(96,165,250,0.08)',
                  border: `1px solid ${listening ? 'rgba(239,68,68,0.2)' : speakingId ? 'rgba(74,222,128,0.2)' : 'rgba(96,165,250,0.2)'}`,
                  borderRadius: 14, padding: '10px 14px', marginBottom: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div className="flex items-center gap-3">
                  <Waveform active={listening || !!speakingId} color={listening ? '#f87171' : speakingId ? '#4ade80' : '#60a5fa'} />
                  <span style={{ color: listening ? '#f87171' : speakingId ? '#4ade80' : '#60a5fa', fontSize: 12, fontWeight: 600 }}>
                    {listening ? 'Listening...' : processing ? 'Thinking...' : 'Speaking...'}
                  </span>
                </div>
                {/* ★ THE STOP BUTTON ★ */}
                <motion.button whileTap={{ scale: 0.88 }}
                  onClick={() => { stopListening(); stopSpeaking(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)' }}>
                  <Square size={12} style={{ color: '#f87171' }} />
                  <span style={{ color: '#f87171', fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>STOP</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mic button */}
          <div className="flex flex-col items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onPointerDown={startListening}
              onPointerUp={stopListening}
              disabled={processing}
              style={{
                width: 80, height: 80, borderRadius: '50%', border: 'none',
                background: listening ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : processing ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#16a34a,#15803d)',
                boxShadow: listening ? '0 0 0 12px rgba(239,68,68,0.15),0 0 32px rgba(239,68,68,0.3)' : processing ? 'none' : '0 0 0 10px rgba(22,163,74,0.1),0 4px 28px rgba(22,163,74,0.35)',
                cursor: processing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', transition: 'all 0.2s',
              }}
            >
              {processing ? <Loader size={28} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)' }} />
                : listening ? <Square size={26} style={{ color: 'white' }} />
                : <Mic size={30} style={{ color: 'white' }} />}
              {listening && (
                <>
                  <motion.div animate={{ scale: [1, 1.45], opacity: [0.4, 0] }} transition={{ duration: 1, repeat: Infinity }}
                    style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '2px solid rgba(239,68,68,0.5)' }} />
                  <motion.div animate={{ scale: [1, 1.75], opacity: [0.2, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                    style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '2px solid rgba(239,68,68,0.25)' }} />
                </>
              )}
            </motion.button>
            <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>
              {listening ? '● RECORDING — RELEASE TO SEND' : processing ? '◌ PROCESSING...' : speakingId ? '▶ SPEAKING — TAP STOP TO INTERRUPT' : 'HOLD TO SPEAK · OR TAP A QUESTION ABOVE'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}