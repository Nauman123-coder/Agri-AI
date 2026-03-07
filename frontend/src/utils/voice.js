// KhetAI Voice Utility - Web Speech API
// Supports English and Urdu readout

export const speak = (text, lang = 'en-PK', rate = 0.9) => {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel(); // Stop any ongoing speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Try to find an appropriate voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.lang === lang || v.lang.startsWith(lang.split('-')[0])
  );
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
};

export const speakDiagnosis = (diagnosis, language = 'en') => {
  if (language === 'ur') {
    const urduText = `
      ${diagnosis.disease_name_urdu || 'بیماری'}۔
      شدت: ${diagnosis.severity}۔
      فوری اقدام: ${diagnosis.immediate_actions?.[0] || 'علاج کریں'}۔
      متوقع نقصان: ${diagnosis.estimated_loss_per_acre_pkr?.toLocaleString()} روپے فی ایکڑ۔
    `;
    speak(urduText, 'ur-PK', 0.8);
  } else {
    const engText = `
      Disease detected: ${diagnosis.disease_name}.
      Severity: ${diagnosis.severity}.
      Confidence: ${Math.round((diagnosis.confidence || 0) * 100)} percent.
      Immediate action: ${diagnosis.immediate_actions?.[0] || 'Apply treatment'}.
      Estimated loss: ${diagnosis.estimated_loss_per_acre_pkr?.toLocaleString()} Pakistani Rupees per acre.
    `;
    speak(engText, 'en-PK', 0.9);
  }
};

export const speakNegotiation = (result, language = 'en') => {
  if (language === 'ur') {
    const text = result.negotiation_summary_urdu || 'بہترین قیمت طے پائی';
    speak(text, 'ur-PK', 0.8);
  } else {
    const vendor = result.best_vendor;
    const text = `
      Negotiation complete. Best offer from ${vendor?.vendor_name}.
      Negotiated price: ${vendor?.negotiated_price_pkr?.toLocaleString()} Pakistani Rupees.
      You save ${vendor?.discount_percentage?.toFixed(1)} percent.
      Delivery in ${vendor?.delivery_days} days.
      Recommendation: ${result.recommendation}.
    `;
    speak(text, 'en-PK', 0.9);
  }
};

export const stopSpeech = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};
