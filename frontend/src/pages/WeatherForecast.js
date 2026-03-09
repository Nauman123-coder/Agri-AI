/**
 * WeatherForecast.js — Scientifically Accurate Crop Disease Forecaster
 * - Every disease has accurate Pakistani agricultural thresholds
 * - Multi-factor scoring: temperature window + humidity + rain combined
 * - Always shows ALL diseases for selected crop with real reasons
 * - Clear "Why?" explanation for every risk level
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud, Droplets, Thermometer, Wind,
  ChevronDown, MapPin, ChevronLeft, Shield,
  AlertTriangle, Info, ChevronRight,
  MessageCircle, Sparkles, Send, Leaf,
  Droplet, Sun, Wind as WindIcon, CheckCircle2,
  RefreshCw, Copy, Check
} from 'lucide-react';

// ── Cities with realistic seasonal base weather ───────────────────────────────
const CITIES = [
  { name: 'Lahore',       temp: 26, humidity: 52, wind: 12, rain: 2  },
  { name: 'Karachi',      temp: 31, humidity: 68, wind: 18, rain: 1  },
  { name: 'Faisalabad',   temp: 27, humidity: 55, wind: 10, rain: 2  },
  { name: 'Multan',       temp: 30, humidity: 48, wind: 14, rain: 1  },
  { name: 'Rawalpindi',   temp: 22, humidity: 60, wind: 15, rain: 5  },
  { name: 'Peshawar',     temp: 24, humidity: 50, wind: 16, rain: 3  },
  { name: 'Gujranwala',   temp: 26, humidity: 58, wind: 11, rain: 3  },
  { name: 'Sahiwal',      temp: 28, humidity: 50, wind: 12, rain: 2  },
  { name: 'Hyderabad',    temp: 31, humidity: 65, wind: 20, rain: 1  },
  { name: 'Sukkur',       temp: 33, humidity: 42, wind: 15, rain: 0  },
  { name: 'Bahawalpur',   temp: 30, humidity: 44, wind: 13, rain: 1  },
  { name: 'Sialkot',      temp: 25, humidity: 65, wind: 10, rain: 4  },
  { name: 'Quetta',       temp: 18, humidity: 45, wind: 20, rain: 6  },
  { name: 'Muzaffarabad', temp: 20, humidity: 72, wind: 10, rain: 8  },
  { name: 'Mardan',       temp: 25, humidity: 55, wind: 14, rain: 4  },
];

// ── All crops ────────────────────────────────────────────────────────────────
const CROP_CATEGORIES = [
  { label: 'Grain Crops', icon: '🌾', crops: [
    { id: 'wheat',       name: 'Wheat',        urdu: 'گندم',        emoji: '🌾' },
    { id: 'rice',        name: 'Rice',          urdu: 'چاول',        emoji: '🍚' },
    { id: 'maize',       name: 'Maize / Corn',  urdu: 'مکئی',        emoji: '🌽' },
    { id: 'barley',      name: 'Barley',        urdu: 'جَو',         emoji: '🌿' },
    { id: 'sorghum',     name: 'Sorghum',       urdu: 'جوار',        emoji: '🌾' },
    { id: 'millet',      name: 'Pearl Millet',  urdu: 'باجرہ',       emoji: '🌱' },
  ]},
  { label: 'Cash Crops', icon: '💰', crops: [
    { id: 'cotton',      name: 'Cotton',        urdu: 'کپاس',        emoji: '🌿' },
    { id: 'sugarcane',   name: 'Sugarcane',     urdu: 'گنا',         emoji: '🎋' },
    { id: 'tobacco',     name: 'Tobacco',       urdu: 'تمباکو',      emoji: '🍃' },
    { id: 'sunflower',   name: 'Sunflower',     urdu: 'سورج مکھی',   emoji: '🌻' },
    { id: 'mustard',     name: 'Mustard',       urdu: 'سرسوں',       emoji: '🌼' },
    { id: 'canola',      name: 'Canola',        urdu: 'کینولا',      emoji: '🌼' },
  ]},
  { label: 'Vegetables', icon: '🥬', crops: [
    { id: 'potato',      name: 'Potato',        urdu: 'آلو',         emoji: '🥔' },
    { id: 'tomato',      name: 'Tomato',        urdu: 'ٹماٹر',       emoji: '🍅' },
    { id: 'onion',       name: 'Onion',         urdu: 'پیاز',        emoji: '🧅' },
    { id: 'chilli',      name: 'Chilli',        urdu: 'مرچ',         emoji: '🌶️' },
    { id: 'garlic',      name: 'Garlic',        urdu: 'لہسن',        emoji: '🧄' },
    { id: 'brinjal',     name: 'Brinjal',       urdu: 'بینگن',       emoji: '🍆' },
    { id: 'okra',        name: 'Okra',          urdu: 'بھنڈی',       emoji: '🌿' },
    { id: 'spinach',     name: 'Spinach',       urdu: 'پالک',        emoji: '🥬' },
    { id: 'cauliflower', name: 'Cauliflower',   urdu: 'گوبھی',       emoji: '🥦' },
    { id: 'pea',         name: 'Peas',          urdu: 'مٹر',         emoji: '🫛' },
    { id: 'cucumber',    name: 'Cucumber',      urdu: 'کھیرا',       emoji: '🥒' },
    { id: 'pumpkin',     name: 'Pumpkin',       urdu: 'کدو',         emoji: '🎃' },
  ]},
  { label: 'Fruits', icon: '🍎', crops: [
    { id: 'mango',       name: 'Mango',         urdu: 'آم',          emoji: '🥭' },
    { id: 'citrus',      name: 'Citrus',        urdu: 'لیموں/مالٹا', emoji: '🍊' },
    { id: 'banana',      name: 'Banana',        urdu: 'کیلا',        emoji: '🍌' },
    { id: 'guava',       name: 'Guava',         urdu: 'امرود',       emoji: '🍐' },
    { id: 'apple',       name: 'Apple',         urdu: 'سیب',         emoji: '🍎' },
    { id: 'grapes',      name: 'Grapes',        urdu: 'انگور',       emoji: '🍇' },
    { id: 'peach',       name: 'Peach',         urdu: 'آڑو',         emoji: '🍑' },
    { id: 'watermelon',  name: 'Watermelon',    urdu: 'تربوز',       emoji: '🍉' },
    { id: 'strawberry',  name: 'Strawberry',    urdu: 'اسٹرابیری',   emoji: '🍓' },
  ]},
  { label: 'Pulses & Legumes', icon: '🫘', crops: [
    { id: 'chickpea',    name: 'Chickpea',      urdu: 'چنے',         emoji: '🫘' },
    { id: 'lentil',      name: 'Lentil',        urdu: 'مسور',        emoji: '🫘' },
    { id: 'mungbean',    name: 'Mung Bean',     urdu: 'ماش',         emoji: '🌿' },
    { id: 'blackgram',   name: 'Black Gram',    urdu: 'ماش کی دال',  emoji: '🫘' },
    { id: 'cowpea',      name: 'Cowpea',        urdu: 'لوبیا',       emoji: '🫘' },
    { id: 'soybean',     name: 'Soybean',       urdu: 'سویا بین',    emoji: '🌱' },
  ]},
  { label: 'Fodder & Spices', icon: '🌱', crops: [
    { id: 'berseem',     name: 'Berseem',       urdu: 'برسیم',       emoji: '🌿' },
    { id: 'lucerne',     name: 'Lucerne',       urdu: 'لوسرن',       emoji: '🌿' },
    { id: 'ginger',      name: 'Ginger',        urdu: 'ادرک',        emoji: '🫚' },
    { id: 'turmeric',    name: 'Turmeric',      urdu: 'ہلدی',        emoji: '🟡' },
  ]},
];

const ALL_CROPS = CROP_CATEGORIES.flatMap(c => c.crops);

// ─────────────────────────────────────────────────────────────────────────────
// DISEASE DATABASE
// Each disease has:
//   optimalTemp: [min, max] — the sweet spot range for infection
//   humidityThreshold: minimum humidity needed
//   rainBoost: whether rain significantly increases risk
//   score(t, h, w, r): returns 0–100 risk score based on real agri science
//   why(t, h, w, r): returns human-readable reason string
// Risk levels: score >= 75 = critical, >= 55 = high, >= 35 = moderate, >= 15 = low, else safe
// ─────────────────────────────────────────────────────────────────────────────
const DISEASE_DB = {

  // ── WHEAT ──────────────────────────────────────────────────────────────────
  wheat: [
    {
      name: 'Yellow Rust', urdu: 'پیلا زنگ',
      score(t, h, w, r) {
        // Optimal: 8–15°C, humidity ≥ 70%, wind spreads spores
        let s = 0;
        if (t >= 5 && t <= 20) s += 30 * (1 - Math.abs(t - 11) / 11);
        if (h >= 70) s += Math.min(35, (h - 70) * 1.8);
        if (w > 15) s += 15; // wind spreads spores
        if (r > 0) s += Math.min(10, r * 0.8);
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 5 && t <= 20) parts.push(`temperature ${t}°C is in the ideal range (5–20°C) for Yellow Rust spore germination`);
        else if (t > 20) parts.push(`temperature ${t}°C is too warm for Yellow Rust (needs < 20°C)`);
        else parts.push(`temperature ${t}°C is too cold for Yellow Rust`);
        if (h >= 70) parts.push(`humidity ${h}% provides enough moisture for infection`);
        if (w > 15) parts.push(`wind ${w}km/h is spreading spores between fields`);
        if (r > 0) parts.push(`rain ${r}mm keeps leaves wet — extending infection window`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Propiconazole or Tebuconazole. Scout fields weekly. Use resistant varieties like Pakistan 2013.',
      treatmentUrdu: 'پروپیکونازول یا ٹیبوکونازول اسپرے کریں۔ ہر ہفتے کھیت دیکھیں۔',
    },
    {
      name: 'Brown Rust', urdu: 'بھورا زنگ',
      score(t, h, w, r) {
        // Optimal: 15–25°C, humidity ≥ 65%
        let s = 0;
        if (t >= 10 && t <= 30) s += 30 * (1 - Math.abs(t - 20) / 15);
        if (h >= 65) s += Math.min(35, (h - 65) * 1.5);
        if (w > 10) s += 10;
        if (r > 0) s += Math.min(10, r * 0.7);
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 15 && t <= 25) parts.push(`temperature ${t}°C is perfect for Brown Rust (optimal: 15–25°C)`);
        else parts.push(`temperature ${t}°C is ${t < 15 ? 'below' : 'above'} optimal range for Brown Rust`);
        if (h >= 65) parts.push(`humidity ${h}% allows spore germination (needs ≥ 65%)`);
        else parts.push(`humidity ${h}% is too dry for Brown Rust infection`);
        if (r > 0) parts.push(`rainfall ${r}mm creates leaf wetness period`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Mancozeb + Propiconazole at flag leaf stage. Avoid excess nitrogen.',
      treatmentUrdu: 'مینکوزیب + پروپیکونازول پرچم پتے پر اسپرے کریں۔',
    },
    {
      name: 'Loose Smut', urdu: 'کھلی کانگیاری',
      score(t, h, w, r) {
        // Flower infection: 16–22°C, humidity ≥ 60%
        let s = 0;
        if (t >= 14 && t <= 24) s += 25 * (1 - Math.abs(t - 19) / 10);
        if (h >= 60) s += Math.min(30, (h - 60) * 1.2);
        if (r > 2) s += 15;
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 14 && t <= 24) parts.push(`temperature ${t}°C during flowering time allows smut spore infection`);
        else parts.push(`temperature ${t}°C limits Loose Smut infection risk`);
        if (h >= 60) parts.push(`humidity ${h}% supports smut germination`);
        if (r > 2) parts.push(`rain ${r}mm washes spores into florets during flowering`);
        return parts.join('; ') + '.';
      },
      treatment: 'Use Carboxin-treated certified seed. Seed treatment is the only effective control.',
      treatmentUrdu: 'کارباکسن سے علاج شدہ سرٹیفائیڈ بیج استعمال کریں۔',
    },
    {
      name: 'Powdery Mildew', urdu: 'سفید بیماری',
      score(t, h, w, r) {
        // Optimal: 15–22°C, relative humidity 55–75% (NOT wet — dry surface preferred)
        let s = 0;
        if (t >= 12 && t <= 25) s += 25 * (1 - Math.abs(t - 18) / 12);
        if (h >= 55 && h <= 80) s += 20;
        if (h > 80) s -= 10; // too wet actually inhibits
        return Math.min(100, Math.round(Math.max(0, s)));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 12 && t <= 25) parts.push(`temperature ${t}°C is in the ideal range for Powdery Mildew (12–25°C)`);
        if (h >= 55 && h <= 80) parts.push(`humidity ${h}% — moderate moisture allows mildew without washing spores away`);
        else if (h > 80) parts.push(`humidity ${h}% is actually too wet — rain suppresses Powdery Mildew spores`);
        else parts.push(`humidity ${h}% is too dry for significant Powdery Mildew infection`);
        return parts.join('; ') + '.';
      },
      treatment: 'Spray sulfur-based fungicide or Triadimefon. Avoid dense planting.',
      treatmentUrdu: 'گندھک والی دوائی یا ٹرائیاڈیمفون اسپرے کریں۔',
    },
  ],

  // ── RICE ───────────────────────────────────────────────────────────────────
  rice: [
    {
      name: 'Blast Disease', urdu: 'بلاسٹ بیماری',
      score(t, h, w, r) {
        // Optimal: 24–28°C, humidity ≥ 85%, free moisture critical
        let s = 0;
        if (t >= 20 && t <= 32) s += 35 * (1 - Math.abs(t - 26) / 10);
        if (h >= 80) s += Math.min(40, (h - 80) * 2.5);
        if (r > 5) s += Math.min(15, r * 0.7);
        if (w > 20) s += 10; // wind disperses conidia
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 24 && t <= 28) parts.push(`temperature ${t}°C is ideal for Blast fungus sporulation (optimal: 24–28°C)`);
        else if (t >= 20 && t <= 32) parts.push(`temperature ${t}°C allows Blast infection, though not optimal`);
        else parts.push(`temperature ${t}°C is outside Blast infection range`);
        if (h >= 80) parts.push(`humidity ${h}% is high — spores need ≥ 80% RH for germination`);
        else parts.push(`humidity ${h}% is below 80% threshold needed for Blast`);
        if (r > 5) parts.push(`rain ${r}mm keeps leaf surfaces wet, extending infection window`);
        if (w > 20) parts.push(`wind ${w}km/h disperses fungal spores across the field`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Tricyclazole or Isoprothiolane. Avoid excess nitrogen. Drain fields at night.',
      treatmentUrdu: 'ٹرائیسائیکلازول اسپرے کریں۔ نائٹروجن کم کریں۔',
    },
    {
      name: 'Bacterial Leaf Blight', urdu: 'بیکٹیریل پتہ جھلساؤ',
      score(t, h, w, r) {
        // Optimal: 25–35°C, humidity ≥ 70%, wind + rain splash spread bacteria
        let s = 0;
        if (t >= 22 && t <= 35) s += 30 * (1 - Math.abs(t - 28) / 12);
        if (h >= 70) s += Math.min(30, (h - 70) * 1.5);
        if (w > 20) s += 20; // strong wind is the primary driver
        if (r > 10) s += 15;
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 25 && t <= 35) parts.push(`temperature ${t}°C is optimal for Xanthomonas bacteria multiplication`);
        else parts.push(`temperature ${t}°C partially supports bacterial growth`);
        if (w > 20) parts.push(`strong wind ${w}km/h creates wounds on leaves and splashes bacteria between plants`);
        else parts.push(`wind speed ${w}km/h — high winds (>20km/h) are the main bacterial spread mechanism`);
        if (r > 10) parts.push(`heavy rain ${r}mm washes bacteria into wounds`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Copper oxychloride. Avoid flooding. Plant resistant varieties (IRRI lines).',
      treatmentUrdu: 'کاپر آکسی کلورائیڈ اسپرے کریں۔ کھیت میں پانی کم کریں۔',
    },
    {
      name: 'Sheath Blight', urdu: 'پتہ غلاف بیماری',
      score(t, h, w, r) {
        // Optimal: 28–32°C, humidity ≥ 85%, standing water
        let s = 0;
        if (t >= 25 && t <= 35) s += 30 * (1 - Math.abs(t - 30) / 10);
        if (h >= 85) s += Math.min(40, (h - 85) * 3);
        if (r > 5) s += 10;
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 28 && t <= 32) parts.push(`temperature ${t}°C is optimal for Rhizoctonia fungus growth in rice`);
        else parts.push(`temperature ${t}°C allows some Sheath Blight — optimal is 28–32°C`);
        if (h >= 85) parts.push(`very high humidity ${h}% — Sheath Blight thrives above 85% RH`);
        else parts.push(`humidity ${h}% — Sheath Blight risk rises sharply above 85% RH`);
        if (r > 5) parts.push(`rain ${r}mm maintains waterlogged conditions that favor this disease`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Validamycin or Hexaconazole. Reduce plant density. Reduce nitrogen at tillering.',
      treatmentUrdu: 'والیڈامائسن یا ہیکساکونازول اسپرے کریں۔ کھاد کم کریں۔',
    },
    {
      name: 'Brown Spot', urdu: 'بھورا دھبہ',
      score(t, h, w, r) {
        // Optimal: 25–30°C, humidity ≥ 80% with wet periods
        let s = 0;
        if (t >= 20 && t <= 35) s += 25 * (1 - Math.abs(t - 27) / 12);
        if (h >= 75) s += Math.min(30, (h - 75) * 1.5);
        if (r > 3) s += Math.min(15, r * 0.6);
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 25 && t <= 30) parts.push(`temperature ${t}°C favors Helminthosporium oryzae (Brown Spot fungus)`);
        if (h >= 75) parts.push(`humidity ${h}% — spores germinate well above 75% RH`);
        else parts.push(`humidity ${h}% — moderate dryness reduces Brown Spot pressure`);
        if (r > 3) parts.push(`rain ${r}mm maintains leaf wetness for infection`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Mancozeb or Iprodione. Improve soil nutrition — nutrient-deficient plants are more susceptible.',
      treatmentUrdu: 'مینکوزیب اسپرے کریں اور کھاد بہتر کریں۔',
    },
  ],

  // ── COTTON ─────────────────────────────────────────────────────────────────
  cotton: [
    {
      name: 'Cotton Leaf Curl Virus', urdu: 'پتوں کا مڑنا',
      score(t, h, w, r) {
        // Whitefly vector thrives: temp 28–40°C, dry conditions (humidity < 60%)
        let s = 0;
        if (t >= 25 && t <= 42) s += 30 * (1 - Math.abs(t - 33) / 15);
        if (h < 55) s += Math.min(35, (55 - h) * 1.5); // drier = more whitefly
        if (t > 35) s += 15; // extreme heat = more whitefly reproduction
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 28 && t <= 40) parts.push(`temperature ${t}°C is ideal for whitefly reproduction — the insect that spreads CLCuV virus`);
        else if (t > 40) parts.push(`extreme temperature ${t}°C stresses cotton and reduces plant immunity`);
        if (h < 55) parts.push(`low humidity ${h}% dries out natural whitefly predators, allowing whitefly populations to explode`);
        else parts.push(`humidity ${h}% — drier conditions (< 55%) would increase whitefly pressure more`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Imidacloprid or Thiamethoxam for whitefly. Remove infected plants immediately. Use CLCuV-resistant varieties.',
      treatmentUrdu: 'امیڈاکلوپریڈ سے سفید مکھی کنٹرول کریں۔ بیمار پودے فوری ہٹائیں۔',
    },
    {
      name: 'Bacterial Blight', urdu: 'بیکٹیریل جھلساؤ',
      score(t, h, w, r) {
        // Xanthomonas: temp 25–35°C, humidity ≥ 70%, rain splash
        let s = 0;
        if (t >= 22 && t <= 35) s += 28 * (1 - Math.abs(t - 28) / 12);
        if (h >= 65) s += Math.min(30, (h - 65) * 1.5);
        if (r > 5) s += Math.min(20, r * 1.2);
        if (w > 20) s += 12;
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 25 && t <= 35) parts.push(`temperature ${t}°C is optimal for Xanthomonas bacteria in cotton`);
        if (h >= 65) parts.push(`humidity ${h}% allows bacterial survival on leaf surfaces`);
        if (r > 5) parts.push(`rain splash ${r}mm is the primary bacteria spread mechanism`);
        if (w > 20) parts.push(`wind ${w}km/h creates leaf wounds that bacteria enter through`);
        return parts.join('; ') + '.';
      },
      treatment: 'Spray Copper hydroxide (3g/L). Do not work in fields when wet. Remove infected leaves.',
      treatmentUrdu: 'کاپر ہائیڈرو آکسائیڈ اسپرے کریں۔ گیلے کھیت میں کام نہ کریں۔',
    },
    {
      name: 'Fusarium Wilt', urdu: 'جڑ سڑن',
      score(t, h, w, r) {
        // Fusarium: soil temp 25–30°C, soil moisture + warm air
        let s = 0;
        if (t >= 22 && t <= 32) s += 28 * (1 - Math.abs(t - 27) / 10);
        if (h >= 55) s += Math.min(25, (h - 55) * 1.2);
        if (r > 8) s += 15; // wet soil = more root rot
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 25 && t <= 30) parts.push(`soil temperature (air: ${t}°C) is optimal for Fusarium root infection`);
        if (h >= 55) parts.push(`humidity ${h}% keeps soil moist — Fusarium spreads in wet root zones`);
        if (r > 8) parts.push(`heavy rain ${r}mm waterlogging promotes Fusarium spread in soil`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Trichoderma harzianum to soil. Use resistant varieties. Ensure proper drainage.',
      treatmentUrdu: 'ٹرائیکوڈرما مٹی میں ڈالیں۔ پانی نکاس ٹھیک رکھیں۔',
    },
    {
      name: 'Boll Rot', urdu: 'ٹینڈے کی سڑن',
      score(t, h, w, r) {
        // Occurs when hot + humid + rainy during boll formation
        let s = 0;
        if (t >= 28) s += Math.min(25, (t - 28) * 3);
        if (h >= 70) s += Math.min(30, (h - 70) * 1.5);
        if (r > 10) s += Math.min(25, r * 1.2);
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 28) parts.push(`high temperature ${t}°C stresses bolls and reduces their disease resistance`);
        if (h >= 70) parts.push(`humidity ${h}% creates humid microclimate inside the boll canopy`);
        if (r > 10) parts.push(`heavy rainfall ${r}mm — wet bolls are very susceptible to fungal and bacterial rot`);
        else parts.push(`rainfall ${r}mm — heavier rain (>10mm) significantly increases Boll Rot`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Mancozeb after rains. Improve field drainage. Avoid excess irrigation during boll filling.',
      treatmentUrdu: 'بارش کے بعد مینکوزیب اسپرے کریں۔ اضافی پانی سے بچیں۔',
    },
  ],

  // ── POTATO ─────────────────────────────────────────────────────────────────
  potato: [
    {
      name: 'Late Blight', urdu: 'لیٹ بلائٹ',
      score(t, h, w, r) {
        // Phytophthora infestans: 10–24°C, humidity ≥ 80%, wet leaves ≥ 10 hours
        let s = 0;
        if (t >= 8 && t <= 26) s += 40 * (1 - Math.abs(t - 17) / 12);
        if (h >= 78) s += Math.min(40, (h - 78) * 2.5);
        if (r > 3) s += Math.min(20, r * 1.0);
        if (t > 26 || t < 5) s = Math.max(0, s - 20); // out of range kills it
        return Math.min(100, Math.round(Math.max(0, s)));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 10 && t <= 24) parts.push(`temperature ${t}°C is in the critical danger zone for Late Blight (Phytophthora infestans) — optimal infection is 10–24°C`);
        else if (t > 24) parts.push(`temperature ${t}°C is above Late Blight optimal range — risk reduces above 26°C`);
        else parts.push(`temperature ${t}°C is below Late Blight optimal range`);
        if (h >= 78) parts.push(`high humidity ${h}% — spores need ≥ 80% RH for 10+ hours to cause infection`);
        else parts.push(`humidity ${h}% is below the 80% threshold needed for Late Blight`);
        if (r > 3) parts.push(`rainfall ${r}mm keeps leaves continuously wet, providing ideal infection conditions`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Metalaxyl + Mancozeb every 7 days preventively. Remove infected foliage. Stop overhead irrigation.',
      treatmentUrdu: 'میٹالاکسل + مینکوزیب ہر 7 دن میں اسپرے کریں۔ اوپر سے پانی بند کریں۔',
    },
    {
      name: 'Early Blight', urdu: 'ارلی بلائٹ',
      score(t, h, w, r) {
        // Alternaria solani: 24–30°C, humidity cycles wet+dry
        let s = 0;
        if (t >= 20 && t <= 32) s += 28 * (1 - Math.abs(t - 26) / 12);
        if (h >= 60) s += Math.min(28, (h - 60) * 1.2);
        if (r > 0 && r < 10) s += 12; // intermittent rain is worst
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 24 && t <= 30) parts.push(`temperature ${t}°C is optimal for Alternaria solani — the Early Blight fungus`);
        if (h >= 60) parts.push(`humidity ${h}% supports spore germination`);
        if (r > 0 && r < 10) parts.push(`light rainfall ${r}mm creates wet-dry cycles that trigger spore release`);
        return parts.join('; ') + '.';
      },
      treatment: 'Spray Chlorothalonil or Mancozeb every 10 days. Remove lower infected leaves.',
      treatmentUrdu: 'کلوروتھالونیل ہر 10 دن میں اسپرے کریں۔',
    },
    {
      name: 'Viral Mosaic', urdu: 'وائرل موزیک',
      score(t, h, w, r) {
        // Aphid-transmitted — hot+dry = more aphids
        let s = 0;
        if (t >= 22) s += Math.min(30, (t - 22) * 3.5);
        if (h < 55) s += Math.min(30, (55 - h) * 1.5);
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 22) parts.push(`temperature ${t}°C accelerates aphid reproduction — aphids spread the mosaic virus`);
        if (h < 55) parts.push(`low humidity ${h}% favors aphid populations (they thrive in dry conditions)`);
        else parts.push(`humidity ${h}% — lower humidity below 55% would increase aphid pressure`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Imidacloprid to control aphid vectors. Use certified virus-free seed tubers.',
      treatmentUrdu: 'امیڈاکلوپریڈ سے ایفیڈ کنٹرول کریں۔ سرٹیفائیڈ بیج استعمال کریں۔',
    },
  ],

  // ── TOMATO ─────────────────────────────────────────────────────────────────
  tomato: [
    {
      name: 'Late Blight', urdu: 'لیٹ بلائٹ',
      score(t, h, w, r) {
        let s = 0;
        if (t >= 8 && t <= 26) s += 40 * (1 - Math.abs(t - 17) / 12);
        if (h >= 78) s += Math.min(40, (h - 78) * 2.5);
        if (r > 3) s += Math.min(20, r);
        return Math.min(100, Math.round(Math.max(0, s)));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 10 && t <= 24) parts.push(`temperature ${t}°C is in the prime Late Blight infection range — same pathogen as potato`);
        else parts.push(`temperature ${t}°C is outside optimal range — Late Blight needs 10–24°C`);
        if (h >= 78) parts.push(`humidity ${h}% provides the moisture Late Blight spores need to germinate`);
        else parts.push(`humidity ${h}% is below 80% — Late Blight needs high humidity`);
        if (r > 3) parts.push(`rain ${r}mm gives continuous leaf wetness for infection`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Metalaxyl + Mancozeb. Remove infected leaves. Stake plants for air circulation.',
      treatmentUrdu: 'میٹالاکسل + مینکوزیب اسپرے کریں۔ پودوں کو سہارا دیں۔',
    },
    {
      name: 'Fusarium Wilt', urdu: 'جڑ سڑن',
      score(t, h, w, r) {
        let s = 0;
        if (t >= 24 && t <= 32) s += 35 * (1 - Math.abs(t - 28) / 10);
        if (h >= 60) s += Math.min(20, (h - 60) * 1.0);
        if (r > 8) s += 15;
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 24 && t <= 32) parts.push(`soil temperature (air: ${t}°C) is optimal for Fusarium oxysporum root infection in tomato`);
        if (r > 8) parts.push(`heavy rain ${r}mm creates waterlogging that helps Fusarium spread through soil`);
        return parts.join('; ') + '.';
      },
      treatment: 'Use Fusarium-resistant varieties (F1 hybrids). Crop rotation for 3 years. Trichoderma soil application.',
      treatmentUrdu: 'فیوزاریم مزاحم قسم استعمال کریں۔ 3 سال فصل بدلاؤ کریں۔',
    },
    {
      name: 'Bacterial Spot', urdu: 'بیکٹیریل دھبے',
      score(t, h, w, r) {
        let s = 0;
        if (t >= 24 && t <= 30) s += 30 * (1 - Math.abs(t - 27) / 8);
        if (h >= 72) s += Math.min(30, (h - 72) * 1.5);
        if (r > 5) s += Math.min(20, r * 0.8);
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 24 && t <= 30) parts.push(`temperature ${t}°C is ideal for Xanthomonas bacteria in tomato`);
        if (h >= 72) parts.push(`humidity ${h}% allows bacteria to survive on leaf surfaces`);
        if (r > 5) parts.push(`rain splash ${r}mm is the primary spread mechanism for bacterial spot`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Copper bactericide. Avoid working in wet conditions. Remove infected leaves.',
      treatmentUrdu: 'تانبے کی دوائی لگائیں۔ گیلے کھیت میں کام نہ کریں۔',
    },
  ],

  // ── MAIZE ──────────────────────────────────────────────────────────────────
  maize: [
    {
      name: 'Northern Corn Blight', urdu: 'مکئی کا جھلساؤ',
      score(t, h, w, r) {
        // Exserohilum turcicum: 18–27°C, humidity ≥ 75%
        let s = 0;
        if (t >= 15 && t <= 30) s += 32 * (1 - Math.abs(t - 22) / 12);
        if (h >= 72) s += Math.min(35, (h - 72) * 1.8);
        if (r > 5) s += 12;
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 18 && t <= 27) parts.push(`temperature ${t}°C is optimal for Northern Corn Blight fungus`);
        if (h >= 72) parts.push(`humidity ${h}% allows spore germination on leaves`);
        if (r > 5) parts.push(`rainfall ${r}mm creates continuous leaf wetness for infection`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Propiconazole or Azoxystrobin. Use resistant hybrids. Remove crop debris after harvest.',
      treatmentUrdu: 'پروپیکونازول اسپرے کریں۔ مزاحم ہائبرڈ استعمال کریں۔',
    },
    {
      name: 'Maize Rust', urdu: 'مکئی کا زنگ',
      score(t, h, w, r) {
        let s = 0;
        if (t >= 16 && t <= 28) s += 30 * (1 - Math.abs(t - 22) / 12);
        if (h >= 68) s += Math.min(32, (h - 68) * 1.6);
        if (w > 12) s += 12;
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 16 && t <= 28) parts.push(`temperature ${t}°C suits Puccinia polysora rust fungi`);
        if (h >= 68) parts.push(`humidity ${h}% enables rust spore germination`);
        if (w > 12) parts.push(`wind ${w}km/h disperses rust spores between fields`);
        return parts.join('; ') + '.';
      },
      treatment: 'Spray Mancozeb or Chlorothalonil at first pustule signs. Use resistant varieties.',
      treatmentUrdu: 'پہلی علامت پر مینکوزیب اسپرے کریں۔',
    },
    {
      name: 'Stalk Rot', urdu: 'تنے کی سڑن',
      score(t, h, w, r) {
        let s = 0;
        if (t >= 27) s += Math.min(30, (t - 27) * 4);
        if (h >= 70) s += Math.min(28, (h - 70) * 1.5);
        if (r > 8) s += 15;
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 27) parts.push(`heat stress at ${t}°C weakens maize stalks, increasing Fusarium entry`);
        if (h >= 70 && r > 8) parts.push(`wet conditions (${h}% RH, ${r}mm rain) promote root and stalk rot fungi`);
        return parts.join('; ') + '.';
      },
      treatment: 'Ensure potassium fertilization. Scout fields at milk stage. Harvest early if stalks are weakening.',
      treatmentUrdu: 'پوٹاشیم کھاد استعمال کریں۔ جلد کٹائی کریں اگر تنا کمزور ہو۔',
    },
  ],

  // ── SUGARCANE ───────────────────────────────────────────────────────────────
  sugarcane: [
    {
      name: 'Red Rot', urdu: 'سرخ سڑن',
      score(t, h, w, r) {
        let s = 0;
        if (t >= 25 && t <= 35) s += 30 * (1 - Math.abs(t - 30) / 10);
        if (h >= 65) s += Math.min(35, (h - 65) * 1.8);
        if (r > 10) s += 18;
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 25 && t <= 35) parts.push(`temperature ${t}°C is in the optimal range for Colletotrichum falcatum (Red Rot)`);
        if (h >= 65) parts.push(`humidity ${h}% — the fungus spreads in humid conditions inside cane internodes`);
        if (r > 10) parts.push(`heavy rain ${r}mm causes waterlogging, prime condition for stalk infection`);
        return parts.join('; ') + '.';
      },
      treatment: 'Use disease-free setts. Treat with Carbendazim (0.1%) sett soak. Avoid waterlogging.',
      treatmentUrdu: 'صحتمند بیج لگائیں۔ کاربینڈازم محلول میں بیج ڈبوئیں۔',
    },
    {
      name: 'Smut', urdu: 'کانگیاری',
      score(t, h, w, r) {
        let s = 0;
        if (t >= 24 && t <= 35) s += 28 * (1 - Math.abs(t - 29) / 10);
        if (h >= 60) s += Math.min(25, (h - 60) * 1.3);
        if (w > 15) s += 15; // wind spreads smut whips
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 24 && t <= 35) parts.push(`temperature ${t}°C promotes Ustilago scitaminea spore germination`);
        if (w > 15) parts.push(`wind ${w}km/h disperses smut spores from infected whips to healthy plants`);
        return parts.join('; ') + '.';
      },
      treatment: 'Hot water treatment of setts (52°C for 30 min). Rogue infected stools. Use resistant varieties.',
      treatmentUrdu: '52°C گرم پانی میں 30 منٹ بیج ڈبوئیں۔ مزاحم قسم لگائیں۔',
    },
  ],

  // ── CHICKPEA ────────────────────────────────────────────────────────────────
  chickpea: [
    {
      name: 'Ascochyta Blight', urdu: 'اسکوکائٹا جھلساؤ',
      score(t, h, w, r) {
        // Critical: 15–20°C, humidity ≥ 75%, rain
        let s = 0;
        if (t >= 10 && t <= 25) s += 35 * (1 - Math.abs(t - 17) / 12);
        if (h >= 72) s += Math.min(35, (h - 72) * 2.0);
        if (r > 3) s += Math.min(20, r * 0.9);
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 15 && t <= 20) parts.push(`temperature ${t}°C is in the ideal range for Ascochyta — Pakistan's most destructive chickpea disease`);
        else parts.push(`temperature ${t}°C — Ascochyta Blight peaks at 15–20°C`);
        if (h >= 72) parts.push(`humidity ${h}% allows rapid spore germination and spread`);
        if (r > 3) parts.push(`rain splash ${r}mm is the primary spread mechanism between plants`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Carbendazim or Mancozeb. Avoid foliar irrigation. Use resistant varieties (CM-98).',
      treatmentUrdu: 'کاربینڈازم اسپرے کریں۔ اوپر سے پانی نہ دیں۔',
    },
    {
      name: 'Fusarium Wilt', urdu: 'جڑ سڑن',
      score(t, h, w, r) {
        let s = 0;
        if (t >= 22 && t <= 32) s += 32 * (1 - Math.abs(t - 27) / 10);
        if (h >= 60) s += Math.min(20, (h - 60) * 1.0);
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 25 && t <= 30) parts.push(`temperature ${t}°C is ideal for Fusarium oxysporum soil infection`);
        else parts.push(`soil temperature around ${t}°C partially supports Fusarium`);
        return parts.join('; ') + '.';
      },
      treatment: 'Use resistant varieties. Treat seed with Carbendazim. Crop rotation essential.',
      treatmentUrdu: 'مزاحم قسم اور بیج علاج ضروری ہے۔ فصل بدلاؤ کریں۔',
    },
  ],

  // ── MUSTARD ─────────────────────────────────────────────────────────────────
  mustard: [
    {
      name: 'Alternaria Blight', urdu: 'الٹرنیریا جھلساؤ',
      score(t, h, w, r) {
        let s = 0;
        if (t >= 18 && t <= 30) s += 32 * (1 - Math.abs(t - 24) / 12);
        if (h >= 68) s += Math.min(35, (h - 68) * 1.8);
        if (r > 3) s += Math.min(15, r * 0.7);
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 20 && t <= 28) parts.push(`temperature ${t}°C is perfect for Alternaria brassicicola (Alternaria Blight)`);
        if (h >= 68) parts.push(`humidity ${h}% enables spore germination`);
        if (r > 3) parts.push(`rainfall ${r}mm promotes spore release and spread`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Iprodione or Mancozeb at flower initiation, repeat every 10 days.',
      treatmentUrdu: 'پھول آنے پر ایپروڈیون اسپرے کریں۔ 10 دن بعد دہرائیں۔',
    },
    {
      name: 'White Rust', urdu: 'سفید زنگ',
      score(t, h, w, r) {
        let s = 0;
        if (t >= 8 && t <= 22) s += 33 * (1 - Math.abs(t - 15) / 10);
        if (h >= 75) s += Math.min(35, (h - 75) * 2.0);
        if (r > 2) s += 15;
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 10 && t <= 20) parts.push(`cool temperature ${t}°C is optimal for Albugo candida (White Rust) — a major mustard disease in Pakistan`);
        if (h >= 75) parts.push(`humidity ${h}% allows zoospore formation and spread`);
        if (r > 2) parts.push(`rain ${r}mm spreads zoospores between leaves`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Metalaxyl + Mancozeb. Plant resistant varieties (Raya varieties).',
      treatmentUrdu: 'میٹالاکسل + مینکوزیب اسپرے کریں۔ مزاحم قسم لگائیں۔',
    },
  ],

  // ── ONION ───────────────────────────────────────────────────────────────────
  onion: [
    {
      name: 'Purple Blotch', urdu: 'جامنی دھبہ',
      score(t, h, w, r) {
        let s = 0;
        if (t >= 20 && t <= 32) s += 30 * (1 - Math.abs(t - 26) / 12);
        if (h >= 68) s += Math.min(35, (h - 68) * 1.8);
        if (r > 5) s += 15;
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 21 && t <= 30) parts.push(`temperature ${t}°C is optimal for Alternaria porri (Purple Blotch) infection`);
        if (h >= 68) parts.push(`humidity ${h}% enables spore germination on onion leaves`);
        if (r > 5) parts.push(`rainfall ${r}mm splashes spores onto healthy leaves`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Iprodione or Mancozeb. Ensure air circulation. Avoid dense planting.',
      treatmentUrdu: 'ایپروڈیون یا مینکوزیب اسپرے کریں۔ ہوا کی گردش بہتر کریں۔',
    },
    {
      name: 'Downy Mildew', urdu: 'نیچے کی پھپھوندی',
      score(t, h, w, r) {
        let s = 0;
        if (t >= 8 && t <= 22) s += 35 * (1 - Math.abs(t - 15) / 10);
        if (h >= 80) s += Math.min(38, (h - 80) * 2.5);
        if (r > 3) s += 15;
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 10 && t <= 20) parts.push(`cool temperature ${t}°C is ideal for Peronospora destructor (Downy Mildew) on onion`);
        if (h >= 80) parts.push(`very high humidity ${h}% — the pathogen needs ≥ 80% RH to sporulate`);
        if (r > 3) parts.push(`rain ${r}mm keeps foliage wet, extending infection hours`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Metalaxyl + Mancozeb. Avoid overhead irrigation. Remove infected plants.',
      treatmentUrdu: 'میٹالاکسل + مینکوزیب اسپرے کریں۔ اوپر سے پانی بند کریں۔',
    },
  ],

  // ── MANGO ───────────────────────────────────────────────────────────────────
  mango: [
    {
      name: 'Anthracnose', urdu: 'انتھراکنوز',
      score(t, h, w, r) {
        let s = 0;
        if (t >= 22 && t <= 32) s += 30 * (1 - Math.abs(t - 27) / 10);
        if (h >= 78) s += Math.min(38, (h - 78) * 2.2);
        if (r > 3) s += Math.min(22, r * 0.9);
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 25 && t <= 30) parts.push(`temperature ${t}°C is ideal for Colletotrichum gloeosporioides (Anthracnose) — the #1 mango disease in Pakistan`);
        if (h >= 78) parts.push(`high humidity ${h}% — the fungus needs wet conditions to sporulate`);
        if (r > 3) parts.push(`rainfall ${r}mm is critical for Anthracnose spread — rain washes spores onto fruit and flowers`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Carbendazim or Copper oxychloride before and during flowering. Post-harvest hot water dip.',
      treatmentUrdu: 'پھول آنے سے پہلے کاربینڈازم اسپرے کریں۔',
    },
    {
      name: 'Powdery Mildew', urdu: 'سفید پھپھوندی',
      score(t, h, w, r) {
        // Oidium mangiferae: 20–28°C, moderate humidity
        let s = 0;
        if (t >= 18 && t <= 32) s += 28 * (1 - Math.abs(t - 25) / 12);
        if (h >= 50 && h <= 75) s += 28; // moderate humidity ideal
        if (h > 80) s -= 10; // rain washes it off
        return Math.min(100, Math.round(Math.max(0, s)));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 20 && t <= 28) parts.push(`temperature ${t}°C is optimal for Oidium mangiferae Powdery Mildew on mango flowers`);
        if (h >= 50 && h <= 75) parts.push(`moderate humidity ${h}% — Powdery Mildew unlike other fungi thrives in moderate (not high) humidity`);
        else if (h > 80) parts.push(`high humidity ${h}% actually suppresses Powdery Mildew — it prefers drier air`);
        return parts.join('; ') + '.';
      },
      treatment: 'Spray Sulfur or Hexaconazole at panicle emergence and 15 days later.',
      treatmentUrdu: 'گندھک یا ہیکساکونازول پھول نکلتے وقت اور 15 دن بعد اسپرے کریں۔',
    },
  ],

  // ── CITRUS ─────────────────────────────────────────────────────────────────
  citrus: [
    {
      name: 'Citrus Canker', urdu: 'لیموں کا کینکر',
      score(t, h, w, r) {
        let s = 0;
        if (t >= 22 && t <= 35) s += 28 * (1 - Math.abs(t - 28) / 12);
        if (h >= 70) s += Math.min(30, (h - 70) * 1.5);
        if (w > 20) s += 20; // wind + rain spread
        if (r > 5) s += 15;
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 25 && t <= 35) parts.push(`temperature ${t}°C is optimal for Xanthomonas axonopodis (Citrus Canker) bacteria`);
        if (w > 20) parts.push(`strong wind ${w}km/h plus rain splashes bacteria from lesions to healthy leaves`);
        if (r > 5) parts.push(`rain ${r}mm washes bacteria into leaf wounds and stomata`);
        return parts.join('; ') + '.';
      },
      treatment: 'Apply Copper oxychloride 3g/L. Prune infected branches. Quarantine infected trees.',
      treatmentUrdu: 'کاپر آکسی کلورائیڈ اسپرے کریں۔ متاثرہ شاخیں کاٹیں۔',
    },
    {
      name: 'Greening (HLB)', urdu: 'سبز بیماری',
      score(t, h, w, r) {
        // Psyllid vector: 25–35°C, dry conditions
        let s = 0;
        if (t >= 23 && t <= 38) s += 32 * (1 - Math.abs(t - 30) / 12);
        if (h < 65) s += Math.min(25, (65 - h) * 1.2);
        return Math.min(100, Math.round(s));
      },
      why(t, h, w, r) {
        const parts = [];
        if (t >= 25 && t <= 35) parts.push(`temperature ${t}°C is ideal for Asian Citrus Psyllid reproduction — the insect that spreads HLB (the most devastating citrus disease)`);
        if (h < 65) parts.push(`dry conditions (${h}% RH) favor psyllid populations`);
        return parts.join('; ') + '.';
      },
      treatment: 'Control psyllid with Imidacloprid. Remove infected trees immediately — no cure exists. Plant certified disease-free budwood.',
      treatmentUrdu: 'سیلا کیڑا کنٹرول کریں۔ متاثرہ درخت فوری کاٹیں — علاج نہیں ہے۔',
    },
  ],

  // Generic fallbacks for remaining crops using simplified but still accurate models
};

// ── Generic disease model factory ────────────────────────────────────────────
function makeGeneric(diseases) {
  return diseases.map(d => ({
    ...d,
    score(t, h, w, r) {
      const tOk = t >= d.tMin && t <= d.tMax;
      const tScore = tOk ? 30 * (1 - Math.abs(t - (d.tMin + d.tMax) / 2) / ((d.tMax - d.tMin) / 2)) : 0;
      const hScore = h >= d.hMin ? Math.min(35, (h - d.hMin) * 1.5) : 0;
      const rScore = d.needsRain && r > 3 ? Math.min(20, r * 0.8) : 0;
      return Math.min(100, Math.round(tScore + hScore + rScore));
    },
    why(t, h, w, r) {
      const parts = [];
      if (t >= d.tMin && t <= d.tMax) parts.push(`temperature ${t}°C is in the infection range for ${d.name} (${d.tMin}–${d.tMax}°C)`);
      else parts.push(`temperature ${t}°C is outside the ${d.tMin}–${d.tMax}°C range needed for ${d.name}`);
      if (h >= d.hMin) parts.push(`humidity ${h}% supports disease spread (needs ≥ ${d.hMin}%)`);
      else parts.push(`humidity ${h}% is below the ${d.hMin}% needed for significant ${d.name} risk`);
      if (d.needsRain && r > 3) parts.push(`rain ${r}mm provides necessary moisture for infection`);
      return parts.join('; ') + '.';
    },
  }));
}

const GENERIC = {
  barley:      makeGeneric([{ name:'Net Blotch', urdu:'نیٹ بلاچ', tMin:15, tMax:25, hMin:68, needsRain:true, treatment:'Apply Propiconazole.', treatmentUrdu:'پروپیکونازول اسپرے کریں۔' }, { name:'Powdery Mildew', urdu:'سفید بیماری', tMin:12, tMax:22, hMin:55, needsRain:false, treatment:'Sulfur spray.', treatmentUrdu:'گندھک اسپرے کریں۔' }]),
  sorghum:     makeGeneric([{ name:'Grain Mold', urdu:'دانے کی پھپھوندی', tMin:24, tMax:35, hMin:70, needsRain:true, treatment:'Mancozeb at grain fill.', treatmentUrdu:'مینکوزیب اسپرے کریں۔' }, { name:'Leaf Blight', urdu:'پتہ جھلساؤ', tMin:25, tMax:35, hMin:72, needsRain:true, treatment:'Carbendazim spray.', treatmentUrdu:'کاربینڈازم اسپرے کریں۔' }]),
  millet:      makeGeneric([{ name:'Downy Mildew', urdu:'نیچے کی پھپھوندی', tMin:24, tMax:32, hMin:78, needsRain:true, treatment:'Metalaxyl seed treatment.', treatmentUrdu:'میٹالاکسل بیج علاج۔' }, { name:'Ergot', urdu:'ایرگٹ', tMin:20, tMax:30, hMin:72, needsRain:true, treatment:'Propiconazole spray.', treatmentUrdu:'پروپیکونازول اسپرے کریں۔' }]),
  tobacco:     makeGeneric([{ name:'Tobacco Mosaic', urdu:'تمباکو موزیک', tMin:20, tMax:32, hMin:50, needsRain:false, treatment:'Remove infected plants. Wash hands.', treatmentUrdu:'متاثرہ پودے ہٹائیں۔' }, { name:'Black Shank', urdu:'کالی ٹانگ', tMin:20, tMax:30, hMin:75, needsRain:true, treatment:'Metalaxyl soil drench.', treatmentUrdu:'میٹالاکسل مٹی علاج۔' }]),
  sunflower:   makeGeneric([{ name:'Downy Mildew', urdu:'نیچے کی پھپھوندی', tMin:15, tMax:25, hMin:78, needsRain:true, treatment:'Metalaxyl seed treatment.', treatmentUrdu:'میٹالاکسل بیج علاج۔' }, { name:'Sclerotinia Rot', urdu:'اسکلیروٹینیا', tMin:14, tMax:22, hMin:75, needsRain:true, treatment:'Iprodione at flowering.', treatmentUrdu:'ایپروڈیون اسپرے کریں۔' }]),
  canola:      makeGeneric([{ name:'Sclerotinia Rot', urdu:'اسکلیروٹینیا', tMin:14, tMax:22, hMin:75, needsRain:true, treatment:'Iprodione at flowering.', treatmentUrdu:'ایپروڈیون اسپرے کریں۔' }, { name:'Alternaria Blight', urdu:'الٹرنیریا', tMin:18, tMax:28, hMin:68, needsRain:false, treatment:'Mancozeb spray.', treatmentUrdu:'مینکوزیب اسپرے کریں۔' }]),
  chilli:      makeGeneric([{ name:'Chilli Mosaic (Thrips)', urdu:'مرچ موزیک', tMin:25, tMax:38, hMin:40, needsRain:false, treatment:'Imidacloprid for thrips control.', treatmentUrdu:'امیڈاکلوپریڈ اسپرے کریں۔' }, { name:'Phytophthora Blight', urdu:'فائٹوفتھورا', tMin:24, tMax:32, hMin:83, needsRain:true, treatment:'Metalaxyl + Mancozeb.', treatmentUrdu:'میٹالاکسل اسپرے کریں۔' }]),
  brinjal:     makeGeneric([{ name:'Little Leaf (Phytoplasma)', urdu:'چھوٹا پتہ', tMin:27, tMax:38, hMin:45, needsRain:false, treatment:'Control leafhopper insects.', treatmentUrdu:'لیف ہاپر کنٹرول کریں۔' }, { name:'Fruit Borer', urdu:'پھل سوراخ', tMin:25, tMax:35, hMin:60, needsRain:false, treatment:'Spinosad or Chlorpyrifos spray.', treatmentUrdu:'اسپنوسیڈ اسپرے کریں۔' }]),
  okra:        makeGeneric([{ name:'Yellow Mosaic Virus', urdu:'پیلا موزیک', tMin:28, tMax:40, hMin:40, needsRain:false, treatment:'Control whitefly with Imidacloprid.', treatmentUrdu:'سفید مکھی فوری کنٹرول کریں۔' }, { name:'Powdery Mildew', urdu:'سفید بیماری', tMin:22, tMax:30, hMin:55, needsRain:false, treatment:'Sulfur fungicide spray.', treatmentUrdu:'گندھک اسپرے کریں۔' }]),
  spinach:     makeGeneric([{ name:'Downy Mildew', urdu:'نیچے کی پھپھوندی', tMin:10, tMax:20, hMin:78, needsRain:true, treatment:'Metalaxyl + Mancozeb.', treatmentUrdu:'میٹالاکسل اسپرے کریں۔' }, { name:'Leaf Spot', urdu:'پتہ دھبہ', tMin:18, tMax:28, hMin:68, needsRain:true, treatment:'Mancozeb spray.', treatmentUrdu:'مینکوزیب اسپرے کریں۔' }]),
  cauliflower: makeGeneric([{ name:'Black Rot', urdu:'کالی سڑن', tMin:22, tMax:30, hMin:72, needsRain:true, treatment:'Copper bactericide spray.', treatmentUrdu:'تانبے کی دوائی لگائیں۔' }, { name:'Downy Mildew', urdu:'نیچے کی پھپھوندی', tMin:10, tMax:20, hMin:78, needsRain:true, treatment:'Metalaxyl + Mancozeb.', treatmentUrdu:'میٹالاکسل اسپرے کریں۔' }]),
  pea:         makeGeneric([{ name:'Powdery Mildew', urdu:'سفید بیماری', tMin:18, tMax:25, hMin:55, needsRain:false, treatment:'Sulfur spray.', treatmentUrdu:'گندھک اسپرے کریں۔' }, { name:'Rust', urdu:'زنگ', tMin:15, tMax:25, hMin:65, needsRain:false, treatment:'Propiconazole spray.', treatmentUrdu:'پروپیکونازول اسپرے کریں۔' }]),
  cucumber:    makeGeneric([{ name:'Downy Mildew', urdu:'نیچے کی پھپھوندی', tMin:15, tMax:23, hMin:80, needsRain:true, treatment:'Metalaxyl + Mancozeb.', treatmentUrdu:'میٹالاکسل اسپرے کریں۔' }, { name:'Powdery Mildew', urdu:'سفید بیماری', tMin:20, tMax:30, hMin:52, needsRain:false, treatment:'Sulfur spray.', treatmentUrdu:'گندھک اسپرے کریں۔' }]),
  pumpkin:     makeGeneric([{ name:'Powdery Mildew', urdu:'سفید بیماری', tMin:20, tMax:30, hMin:52, needsRain:false, treatment:'Sulfur spray.', treatmentUrdu:'گندھک اسپرے کریں۔' }, { name:'Downy Mildew', urdu:'نیچے کی پھپھوندی', tMin:15, tMax:23, hMin:78, needsRain:true, treatment:'Metalaxyl + Mancozeb.', treatmentUrdu:'میٹالاکسل اسپرے کریں۔' }]),
  garlic:      makeGeneric([{ name:'White Rot', urdu:'سفید سڑن', tMin:10, tMax:20, hMin:80, needsRain:true, treatment:'Iprodione soil drench.', treatmentUrdu:'ایپروڈیون مٹی علاج کریں۔' }, { name:'Purple Blotch', urdu:'جامنی دھبہ', tMin:20, tMax:30, hMin:68, needsRain:true, treatment:'Mancozeb spray.', treatmentUrdu:'مینکوزیب اسپرے کریں۔' }]),
  banana:      makeGeneric([{ name:'Panama Wilt (Fusarium)', urdu:'پانامہ مرجھاؤ', tMin:22, tMax:34, hMin:60, needsRain:false, treatment:'No cure — remove infected plants. Use Cavendish varieties.', treatmentUrdu:'متاثرہ پودے فوری ہٹائیں۔' }, { name:'Black Sigatoka', urdu:'کالا سیگاٹوکا', tMin:24, tMax:32, hMin:78, needsRain:true, treatment:'Propiconazole spray.', treatmentUrdu:'پروپیکونازول اسپرے کریں۔' }]),
  guava:       makeGeneric([{ name:'Anthracnose', urdu:'انتھراکنوز', tMin:24, tMax:32, hMin:75, needsRain:true, treatment:'Carbendazim spray.', treatmentUrdu:'کاربینڈازم اسپرے کریں۔' }, { name:'Fruit Fly', urdu:'پھل مکھی', tMin:24, tMax:36, hMin:55, needsRain:false, treatment:'Protein bait traps. Malathion spray.', treatmentUrdu:'پروٹین جال استعمال کریں۔' }]),
  apple:       makeGeneric([{ name:'Apple Scab', urdu:'سیب سکیب', tMin:10, tMax:24, hMin:78, needsRain:true, treatment:'Mancozeb at bud burst. Captan spray.', treatmentUrdu:'کلی نکلتے وقت مینکوزیب اسپرے کریں۔' }, { name:'Fire Blight', urdu:'آگ جھلساؤ', tMin:18, tMax:28, hMin:68, needsRain:true, treatment:'Copper bactericide. Prune infected branches.', treatmentUrdu:'تانبے کی دوائی اور کٹائی کریں۔' }]),
  grapes:      makeGeneric([{ name:'Downy Mildew', urdu:'نیچے کی پھپھوندی', tMin:18, tMax:28, hMin:78, needsRain:true, treatment:'Metalaxyl + Mancozeb.', treatmentUrdu:'میٹالاکسل + مینکوزیب اسپرے کریں۔' }, { name:'Powdery Mildew', urdu:'سفید پھپھوندی', tMin:20, tMax:30, hMin:52, needsRain:false, treatment:'Sulfur or Myclobutanil spray.', treatmentUrdu:'گندھک یا مائیکلوبٹانیل اسپرے کریں۔' }]),
  peach:       makeGeneric([{ name:'Brown Rot', urdu:'بھوری سڑن', tMin:20, tMax:30, hMin:78, needsRain:true, treatment:'Iprodione at flowering.', treatmentUrdu:'پھول آنے پر ایپروڈیون اسپرے کریں۔' }, { name:'Leaf Curl', urdu:'پتہ مڑنا', tMin:10, tMax:20, hMin:68, needsRain:true, treatment:'Copper fungicide at bud swell.', treatmentUrdu:'کلی پھولنے پر تانبے کی دوائی لگائیں۔' }]),
  watermelon:  makeGeneric([{ name:'Fusarium Wilt', urdu:'جڑ سڑن', tMin:24, tMax:32, hMin:60, needsRain:false, treatment:'Trichoderma soil application.', treatmentUrdu:'ٹرائیکوڈرما مٹی علاج۔' }, { name:'Downy Mildew', urdu:'نیچے کی پھپھوندی', tMin:18, tMax:26, hMin:78, needsRain:true, treatment:'Metalaxyl + Mancozeb.', treatmentUrdu:'میٹالاکسل اسپرے کریں۔' }]),
  strawberry:  makeGeneric([{ name:'Gray Mold (Botrytis)', urdu:'بوٹرائٹس', tMin:15, tMax:22, hMin:80, needsRain:true, treatment:'Iprodione spray. Remove infected fruit.', treatmentUrdu:'ایپروڈیون اسپرے اور پھل ہٹائیں۔' }, { name:'Powdery Mildew', urdu:'سفید پھپھوندی', tMin:18, tMax:26, hMin:52, needsRain:false, treatment:'Myclobutanil spray.', treatmentUrdu:'مائیکلوبٹانیل اسپرے کریں۔' }]),
  lentil:      makeGeneric([{ name:'Ascochyta Blight', urdu:'اسکوکائٹا', tMin:12, tMax:22, hMin:72, needsRain:true, treatment:'Mancozeb spray.', treatmentUrdu:'مینکوزیب اسپرے کریں۔' }, { name:'Rust', urdu:'زنگ', tMin:15, tMax:25, hMin:65, needsRain:false, treatment:'Propiconazole spray.', treatmentUrdu:'پروپیکونازول اسپرے کریں۔' }]),
  mungbean:    makeGeneric([{ name:'Yellow Mosaic (Whitefly)', urdu:'پیلا موزیک', tMin:27, tMax:40, hMin:40, needsRain:false, treatment:'Control whitefly urgently.', treatmentUrdu:'سفید مکھی فوری کنٹرول کریں۔' }, { name:'Cercospora Leaf Spot', urdu:'سرکوسپورا', tMin:24, tMax:32, hMin:68, needsRain:true, treatment:'Mancozeb spray.', treatmentUrdu:'مینکوزیب اسپرے کریں۔' }]),
  blackgram:   makeGeneric([{ name:'Yellow Mosaic (Whitefly)', urdu:'پیلا موزیک', tMin:27, tMax:40, hMin:40, needsRain:false, treatment:'Control whitefly vectors.', treatmentUrdu:'سفید مکھی کنٹرول کریں۔' }, { name:'Anthracnose', urdu:'انتھراکنوز', tMin:24, tMax:32, hMin:70, needsRain:true, treatment:'Carbendazim spray.', treatmentUrdu:'کاربینڈازم اسپرے کریں۔' }]),
  cowpea:      makeGeneric([{ name:'Cowpea Mosaic (Aphid)', urdu:'موزیک وائرس', tMin:24, tMax:35, hMin:45, needsRain:false, treatment:'Control aphids and thrips.', treatmentUrdu:'ایفیڈ اور تھرپس کنٹرول کریں۔' }, { name:'Root Rot', urdu:'جڑ سڑن', tMin:25, tMax:33, hMin:78, needsRain:true, treatment:'Seed treatment with Carbendazim.', treatmentUrdu:'کاربینڈازم سے بیج علاج کریں۔' }]),
  soybean:     makeGeneric([{ name:'Soybean Rust', urdu:'سویا زنگ', tMin:18, tMax:28, hMin:75, needsRain:true, treatment:'Triazole fungicide spray.', treatmentUrdu:'ٹرائیازول اسپرے کریں۔' }, { name:'Sudden Death Syndrome', urdu:'اچانک موت', tMin:15, tMax:25, hMin:80, needsRain:true, treatment:'Avoid early planting in wet soils.', treatmentUrdu:'گیلی مٹی میں جلد نہ لگائیں۔' }]),
  berseem:     makeGeneric([{ name:'Stem Rot (Sclerotinia)', urdu:'تنے کی سڑن', tMin:10, tMax:20, hMin:78, needsRain:true, treatment:'Reduce irrigation. Carbendazim spray.', treatmentUrdu:'پانی کم کریں۔ کاربینڈازم اسپرے کریں۔' }, { name:'Powdery Mildew', urdu:'سفید بیماری', tMin:14, tMax:22, hMin:52, needsRain:false, treatment:'Sulfur spray.', treatmentUrdu:'گندھک اسپرے کریں۔' }]),
  lucerne:     makeGeneric([{ name:'Leaf Spot', urdu:'پتہ دھبہ', tMin:18, tMax:28, hMin:68, needsRain:true, treatment:'Mancozeb spray.', treatmentUrdu:'مینکوزیب اسپرے کریں۔' }, { name:'Fusarium Root Rot', urdu:'جڑ سڑن', tMin:24, tMax:32, hMin:72, needsRain:true, treatment:'Carbendazim seed treatment.', treatmentUrdu:'بیج علاج کریں۔' }]),
  ginger:      makeGeneric([{ name:'Soft Rot (Pythium)', urdu:'نرم سڑن', tMin:24, tMax:32, hMin:82, needsRain:true, treatment:'Metalaxyl + Mancozeb drench. Improve drainage.', treatmentUrdu:'میٹالاکسل اسپرے اور پانی نکاس بہتر کریں۔' }, { name:'Leaf Spot', urdu:'پتہ دھبہ', tMin:24, tMax:32, hMin:70, needsRain:true, treatment:'Mancozeb spray.', treatmentUrdu:'مینکوزیب اسپرے کریں۔' }]),
  turmeric:    makeGeneric([{ name:'Rhizome Rot (Pythium)', urdu:'ریزوم سڑن', tMin:24, tMax:32, hMin:82, needsRain:true, treatment:'Metalaxyl + Mancozeb. Improve drainage.', treatmentUrdu:'میٹالاکسل اسپرے اور پانی نکاس بہتر کریں۔' }, { name:'Leaf Blight', urdu:'پتہ جھلساؤ', tMin:24, tMax:32, hMin:68, needsRain:true, treatment:'Mancozeb spray.', treatmentUrdu:'مینکوزیب اسپرے کریں۔' }]),
};

// Merge DISEASE_DB with GENERIC
const FULL_DISEASE_DB = { ...DISEASE_DB, ...GENERIC };

// ── Risk level from score ────────────────────────────────────────────────────
function getRiskLevel(score) {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 35) return 'moderate';
  if (score >= 15) return 'low';
  return 'safe';
}

const RISK_CFG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'CRITICAL', emoji: '🚨', desc: 'Act immediately' },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'HIGH',     emoji: '⚠️', desc: 'Spray within 2–3 days' },
  moderate: { color: '#eab308', bg: 'rgba(234,179,8,0.12)',  label: 'MODERATE', emoji: '🟡', desc: 'Monitor closely' },
  low:      { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'LOW',      emoji: '🔵', desc: 'Low concern' },
  safe:     { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', label: 'SAFE',     emoji: '✅', desc: 'Conditions unfavorable for disease' },
};

// ── Seeded pseudo-random — same city+day always gives same weather ────────────
// This ensures wheat and rice in Lahore show identical temperatures
function seededRand(seed) {
  // Mulberry32 hash — deterministic, fast
  let s = seed >>> 0;
  s = Math.imul(s ^ (s >>> 15), s | 1);
  s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
  return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
}
function cityDaySeed(cityName, dayIdx) {
  // Hash city name into a number, combine with day and today's date (so it
  // rotates daily but stays consistent across crop switches on the same day)
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  let hash = dateSeed + dayIdx * 1000;
  for (let c = 0; c < cityName.length; c++) hash = Math.imul(hash ^ cityName.charCodeAt(c), 2654435761);
  return hash >>> 0;
}

// ── Forecast generator ────────────────────────────────────────────────────────
function genForecast(city, cropId) {
  const DAYS = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5'];
  const ICONS = ['☀️', '⛅', '🌦️', '☀️', '⛅'];
  const diseases = FULL_DISEASE_DB[cropId] || [];

  return DAYS.map((day, i) => {
    // Deterministic variance — same city+day always gives same weather
    const seed = cityDaySeed(city.name, i);
    const r1 = seededRand(seed);
    const r2 = seededRand(seed + 1);
    const r3 = seededRand(seed + 2);
    const r4 = seededRand(seed + 3);
    const r5 = seededRand(seed + 4);

    const temp     = city.temp + (r1 - 0.5) * 7;
    const humidity = Math.max(25, Math.min(98, city.humidity + (r2 - 0.5) * 18));
    const wind     = Math.max(2, city.wind + (r3 - 0.5) * 10);
    const rain     = (i === 2 || r4 > 0.72) ? r5 * 18 : 0;

    const evaluated = diseases.map(d => {
      const score = d.score(temp, humidity, wind, rain);
      const level = getRiskLevel(score);
      return { ...d, score, level, reason: d.why(temp, humidity, wind, rain) };
    }).sort((a, b) => b.score - a.score);

    const topScore = evaluated.length > 0 ? evaluated[0].score : 0;
    const topLevel = getRiskLevel(topScore);

    return {
      day, icon: ICONS[i],
      temp: Math.round(temp),
      humidity: Math.round(humidity),
      wind: Math.round(wind),
      rain: Math.round(rain * 10) / 10,
      diseases: evaluated,
      topScore, topLevel,
    };
  });
}

// ── UI components ─────────────────────────────────────────────────────────────
function Pill({ Icon, value, label, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
      <Icon size={15} style={{ color, margin: '0 auto 3px' }} />
      <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0 }}>{value}</p>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: 0 }}>{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CROP KNOWLEDGE BASE — Ideal growing conditions for every crop
// Used to compare against actual forecast and generate action plans
// ─────────────────────────────────────────────────────────────────────────────
const CROP_KNOWLEDGE = {
  wheat:       { tempMin:12, tempMax:22, humidMin:50, humidMax:70, rainMin:3,  rainMax:10, season:'Rabi (Oct–Mar)', waterNeed:'Low-Medium', soilPH:'6.0–7.5', keyNutrients:'Nitrogen (tillering), Phosphorus (root), Potassium (grain fill)' },
  rice:        { tempMin:22, tempMax:35, humidMin:70, humidMax:90, rainMin:10, rainMax:25, season:'Kharif (Jun–Oct)', waterNeed:'Very High', soilPH:'5.5–6.5', keyNutrients:'Nitrogen (split doses), Zinc, Silica' },
  maize:       { tempMin:18, tempMax:32, humidMin:50, humidMax:75, rainMin:5,  rainMax:15, season:'Kharif (Apr–Aug)', waterNeed:'Medium', soilPH:'5.8–7.0', keyNutrients:'Nitrogen (heavy feeder), Phosphorus, Potassium' },
  cotton:      { tempMin:25, tempMax:38, humidMin:40, humidMax:65, rainMin:0,  rainMax:8,  season:'Kharif (Apr–Oct)', waterNeed:'Medium', soilPH:'6.0–8.0', keyNutrients:'Nitrogen, Potassium (boll fill), Boron' },
  sugarcane:   { tempMin:24, tempMax:38, humidMin:60, humidMax:80, rainMin:8,  rainMax:20, season:'Year-round (15 months)', waterNeed:'Very High', soilPH:'6.0–7.5', keyNutrients:'Nitrogen, Phosphorus, Potassium, Silicon' },
  potato:      { tempMin:15, tempMax:22, humidMin:60, humidMax:80, rainMin:5,  rainMax:12, season:'Rabi (Oct–Jan)', waterNeed:'Medium', soilPH:'5.0–6.5', keyNutrients:'Potassium (tuber), Phosphorus, Calcium' },
  tomato:      { tempMin:18, tempMax:28, humidMin:55, humidMax:75, rainMin:3,  rainMax:10, season:'Spring/Autumn', waterNeed:'Medium-High', soilPH:'6.0–6.8', keyNutrients:'Calcium (prevents BER), Magnesium, Potassium' },
  onion:       { tempMin:13, tempMax:24, humidMin:50, humidMax:70, rainMin:2,  rainMax:8,  season:'Rabi (Oct–Mar)', waterNeed:'Low-Medium', soilPH:'6.0–7.0', keyNutrients:'Sulfur (flavor/size), Phosphorus, Nitrogen' },
  chilli:      { tempMin:22, tempMax:32, humidMin:50, humidMax:70, rainMin:3,  rainMax:10, season:'Kharif (Apr–Sep)', waterNeed:'Medium', soilPH:'6.0–7.0', keyNutrients:'Potassium, Calcium, Magnesium' },
  mango:       { tempMin:24, tempMax:38, humidMin:40, humidMax:65, rainMin:0,  rainMax:5,  season:'Flowering: Jan–Mar; Harvest: May–Jul', waterNeed:'Low (drought tolerant)', soilPH:'5.5–7.5', keyNutrients:'Potassium (fruit quality), Boron (flowering), Zinc' },
  citrus:      { tempMin:15, tempMax:30, humidMin:45, humidMax:70, rainMin:2,  rainMax:10, season:'Harvest: Nov–Feb', waterNeed:'Medium', soilPH:'5.5–6.5', keyNutrients:'Zinc, Iron, Boron (micronutrients critical)' },
  mustard:     { tempMin:10, tempMax:22, humidMin:45, humidMax:65, rainMin:2,  rainMax:8,  season:'Rabi (Oct–Feb)', waterNeed:'Low', soilPH:'6.0–7.5', keyNutrients:'Sulfur (oil content), Nitrogen, Phosphorus' },
  chickpea:    { tempMin:15, tempMax:28, humidMin:45, humidMax:65, rainMin:2,  rainMax:8,  season:'Rabi (Oct–Mar)', waterNeed:'Low', soilPH:'6.0–8.0', keyNutrients:'Rhizobium inoculation, Phosphorus, Zinc' },
  rice_default:{ tempMin:22, tempMax:35, humidMin:70, humidMax:90, rainMin:10, rainMax:25, season:'Kharif', waterNeed:'High', soilPH:'5.5–7.0', keyNutrients:'Nitrogen, Phosphorus, Potassium' },
};
const DEFAULT_CROP_KNOWLEDGE = { tempMin:18, tempMax:30, humidMin:50, humidMax:75, rainMin:3, rainMax:12, season:'Seasonal', waterNeed:'Medium', soilPH:'6.0–7.5', keyNutrients:'NPK balanced, micronutrients as needed' };

function getCropKnowledge(cropId) {
  return CROP_KNOWLEDGE[cropId] || DEFAULT_CROP_KNOWLEDGE;
}

// ── Generate weather-based action plan via backend ───────────────────────────
async function generateActionPlan(crop, city, forecast, knowledge) {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const weatherSummary = forecast.map((d, i) =>
    `${d.day}: ${d.temp}°C, humidity ${d.humidity}%, wind ${d.wind}km/h, rain ${d.rain}mm — top disease risk: ${d.diseases[0]?.name || 'none'} (${d.topScore}%)`
  ).join('\n');

  const topDiseases = forecast[0]?.diseases.slice(0, 3).map(d => `${d.name} (${d.score}% risk)`).join(', ') || 'none';

  const prompt = `You are an expert Pakistani agricultural advisor. A farmer is growing ${crop.name} (${crop.urdu}) in ${city.name}.

IDEAL CONDITIONS FOR ${crop.name.toUpperCase()}:
- Temperature: ${knowledge.tempMin}–${knowledge.tempMax}°C
- Humidity: ${knowledge.humidMin}–${knowledge.humidMax}%
- Rain: ${knowledge.rainMin}–${knowledge.rainMax}mm/day
- Season: ${knowledge.season}
- Water needs: ${knowledge.waterNeed}
- Soil pH: ${knowledge.soilPH}
- Key nutrients: ${knowledge.keyNutrients}

5-DAY WEATHER FORECAST FOR ${city.name}:
${weatherSummary}

TOP DISEASE RISKS TODAY: ${topDiseases}

Based on this specific forecast vs ideal conditions, generate a structured 5-day action plan. For each day mention:
1. Whether conditions are ideal, stressful, or dangerous for the crop
2. What the farmer MUST DO that day (irrigation, spraying, fertilizing, scouting, harvesting prep)
3. What to AVOID
4. Any urgent warnings

Format as JSON with this exact structure (no markdown, pure JSON):
{
  "overallAssessment": "2-3 sentence overall summary of the forecast for this crop",
  "urgentAlert": "null or a single urgent warning string if any critical risk exists",
  "days": [
    {
      "day": "Today",
      "status": "ideal|good|caution|stress|danger",
      "statusReason": "Why (1 sentence based on temp/humidity vs ideal)",
      "actions": ["action 1", "action 2", "action 3"],
      "avoid": "What to avoid today (1 sentence)",
      "irrigate": "none|light|normal|heavy|skip",
      "irrigateReason": "Why this irrigation level"
    }
  ],
  "weeklyTips": ["tip 1", "tip 2", "tip 3"],
  "fertilizerAdvice": "Specific fertilizer advice for this week based on conditions",
  "harvestNote": "Any harvest timing note if relevant, else null"
}`;

  const body = JSON.stringify({
    messages: [{ role: 'user', content: prompt }],
    context: { cropName: crop.name, cityName: city.name, mode: 'action_plan' },
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 30000);
      const response = await fetch(`${API_BASE}/api/weather-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch (e) {
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }
      throw e;
    }
  }
}

// ── Chat with AI about crop + weather ────────────────────────────────────────
async function chatWithAI(messages, crop, city, forecast, knowledge) {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const weatherCtx =
    `Weather context for ${city.name}: Today ${forecast[0]?.temp}°C, ${forecast[0]?.humidity}% humidity, ${forecast[0]?.rain}mm rain. ` +
    `5-day: ${forecast.map(d => `${d.day}: ${d.temp}°C/${d.humidity}%RH/${d.rain}mm`).join(', ')}. ` +
    `Top disease risk: ${forecast[0]?.diseases[0]?.name || 'none'} (${forecast[0]?.topScore || 0}%). ` +
    `Ideal for ${crop.name}: ${knowledge.tempMin}–${knowledge.tempMax}°C, ${knowledge.humidMin}–${knowledge.humidMax}% RH.`;

  const apiMessages = [
    { role: 'user',      content: `[CONTEXT] ${weatherCtx}` },
    { role: 'assistant', content: `Understood. I have the full weather forecast for ${crop.name} in ${city.name}.` },
    ...messages.filter(m => !m.content?.startsWith('[CONTEXT]')),
  ];

  const body = JSON.stringify({
    messages: apiMessages,
    context: { cropName: crop.name, cropUrdu: crop.urdu, cityName: city.name, weatherSummary: weatherCtx, knowledge },
  });

  // Retry once — Render free tier needs ~10s cold start
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 28000);
      const response = await fetch(`${API_BASE}/api/weather-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
      }
      return full || 'No response received.';
    } catch (e) {
      if (attempt === 0) {
        // Cold start — wait 4s then retry
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }
      throw e;
    }
  }
}

// ── STATUS color map ──────────────────────────────────────────────────────────
const STATUS_CFG = {
  ideal:   { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  emoji: '✅', label: 'Ideal' },
  good:    { color: '#86efac', bg: 'rgba(134,239,172,0.1)', emoji: '🌱', label: 'Good' },
  caution: { color: '#eab308', bg: 'rgba(234,179,8,0.1)',   emoji: '⚡', label: 'Caution' },
  stress:  { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  emoji: '⚠️', label: 'Stress' },
  danger:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   emoji: '🚨', label: 'Danger' },
};

const IRRIGATE_CFG = {
  none:   { color: '#94a3b8', emoji: '🚫', label: 'No irrigation' },
  skip:   { color: '#94a3b8', emoji: '⏭️', label: 'Skip today' },
  light:  { color: '#60a5fa', emoji: '💧', label: 'Light irrigation' },
  normal: { color: '#60a5fa', emoji: '💧💧', label: 'Normal irrigation' },
  heavy:  { color: '#818cf8', emoji: '💧💧💧', label: 'Heavy irrigation' },
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function WeatherForecast() {
  const [step, setStep]             = useState('pick_crop');
  const [cropId, setCropId]         = useState(null);
  const [city, setCity]             = useState(CITIES[0]);
  const [forecast, setForecast]     = useState([]);
  const [dayIdx, setDayIdx]         = useState(0);
  const [loading, setLoading]       = useState(false);
  const [showCity, setShowCity]     = useState(false);
  const [search, setSearch]         = useState('');
  const [expandedDisease, setExpandedDisease] = useState(null);
  const [activeTab, setActiveTab]   = useState('disease'); // 'disease' | 'actions' | 'chat'

  // Action plan state
  const [actionPlan, setActionPlan]         = useState(null);
  const [actionLoading, setActionLoading]   = useState(false);
  const [actionError, setActionError]       = useState(null);
  const [expandedDay, setExpandedDay]       = useState(0);

  // Chat state
  const [chatMessages, setChatMessages]     = useState([]);
  const [chatInput, setChatInput]           = useState('');
  const [chatLoading, setChatLoading]       = useState(false);
  const chatEndRef = useRef(null);

  const crop = ALL_CROPS.find(c => c.id === cropId);

  const loadForecast = (cid, c) => {
    setLoading(true);
    setExpandedDisease(null);
    setActionPlan(null);
    setActionError(null);
    setChatMessages([]);
    setTimeout(() => { setForecast(genForecast(c, cid)); setLoading(false); }, 500);
  };

  const selectCrop = (id) => { setCropId(id); setStep('forecast'); setActiveTab('disease'); loadForecast(id, city); };
  const changeCity = (c) => { setCity(c); setShowCity(false); if (cropId) loadForecast(cropId, c); };

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // Load action plan when tab is switched to actions
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'actions' && !actionPlan && !actionLoading && forecast.length > 0 && crop) {
      fetchActionPlan();
    }
    if (tab === 'chat' && chatMessages.length === 0 && crop) {
      // Seed with a welcome message
      setChatMessages([{
        role: 'assistant',
        content: `Hello! 👋 I'm your KhetAI advisor for **${crop.name}** in **${city.name}**.\n\nToday's conditions: **${forecast[0]?.temp}°C**, **${forecast[0]?.humidity}%** humidity, **${forecast[0]?.rain}mm** rain.\n\nAsk me anything about growing ${crop.name} — irrigation, fertilizer, disease control, or what to do based on this week's weather!`,
      }]);
    }
  };

  const fetchActionPlan = async () => {
    if (!crop || forecast.length === 0) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const knowledge = getCropKnowledge(cropId);
      const plan = await generateActionPlan(crop, city, forecast, knowledge);
      setActionPlan(plan);
    } catch (e) {
      setActionError('Could not load action plan. Please check your connection.');
    } finally {
      setActionLoading(false);
    }
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const userMsg = { role: 'user', content: text };
    const newMsgs = [...chatMessages, userMsg];
    setChatMessages(newMsgs);
    setChatInput('');
    setChatLoading(true);
    // Show "waking up server" hint after 4s if still loading
    let wakeHint = null;
    const wakeTimer = setTimeout(() => {
      wakeHint = { role: 'assistant', content: '⏳ Waking up the AI server (first message can take ~10s)…', isHint: true };
      setChatMessages(prev => [...prev, wakeHint]);
    }, 4000);
    try {
      const knowledge = getCropKnowledge(cropId);
      const apiMsgs = newMsgs.filter(m => !(m.role === 'assistant' && m.content.startsWith('Hello! 👋')));
      const reply = await chatWithAI(apiMsgs.length > 0 ? apiMsgs : [userMsg], crop, city, forecast, knowledge);
      clearTimeout(wakeTimer);
      // Remove hint if it was shown, then add real reply
      setChatMessages(prev => [...prev.filter(m => !m.isHint), { role: 'assistant', content: reply }]);
    } catch (e) {
      clearTimeout(wakeTimer);
      setChatMessages(prev => [...prev.filter(m => !m.isHint), {
        role: 'assistant',
        content: '⚠️ Could not reach the AI server. The server may be starting up — please wait 15 seconds and try again.',
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const filteredCats = CROP_CATEGORIES.map(cat => ({
    ...cat,
    crops: cat.crops.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.urdu.includes(search)),
  })).filter(c => c.crops.length > 0);

  const day = forecast[dayIdx];
  const rc  = day ? (RISK_CFG[day.topLevel] || RISK_CFG.safe) : RISK_CFG.safe;

  // Tab definitions
  const TABS = [
    { id: 'disease', label: 'Disease Risk', emoji: '🦠' },
    { id: 'actions', label: 'Crop Actions', emoji: '🌱' },
    { id: 'chat',    label: 'AI Advisor',   emoji: '💬' },
  ];

  // ── CROP PICKER ────────────────────────────────────────────────────────────
  if (step === 'pick_crop') return (
    <div style={{ paddingBottom: 8 }}>
      <div className="mb-5">
        <h1 style={{ color: 'white', fontWeight: 900, fontSize: 22, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}>
          Disease Forecast 🌦️
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
          Select your crop → see 5-day weather-based disease risk with explanations
        </p>
      </div>
      <div className="relative mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search crop... فصل تلاش کریں"
          className="w-full pl-4 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', caretColor: '#4ade80' }}
        />
      </div>
      {filteredCats.map(cat => (
        <div key={cat.label} className="mb-5">
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 10, letterSpacing: '0.1em' }}>
            {cat.icon}  {cat.label.toUpperCase()}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {cat.crops.map(c => (
              <motion.button key={c.id} whileTap={{ scale: 0.93 }} onClick={() => selectCrop(c.id)}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                <span style={{ fontSize: 26 }}>{c.emoji}</span>
                <p style={{ color: 'white', fontSize: 11, fontWeight: 700, textAlign: 'center', margin: 0, fontFamily: "'Syne', sans-serif" }}>{c.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textAlign: 'center', margin: 0, fontFamily: "'Noto Nastaliq Urdu', serif" }}>{c.urdu}</p>
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // ── FORECAST ────────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 8 }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setStep('pick_crop'); setSearch(''); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ChevronLeft size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </motion.button>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 22 }}>{crop?.emoji}</span>
            <div>
              <h1 style={{ color: 'white', fontWeight: 900, fontSize: 18, fontFamily: "'Syne', sans-serif", margin: 0 }}>{crop?.name}</h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>Disease risk forecast · {crop?.urdu}</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowCity(!showCity)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
            <MapPin size={12} style={{ color: '#4ade80' }} />
            <span style={{ fontWeight: 600, fontSize: 12 }}>{city.name}</span>
            <ChevronDown size={12} />
          </button>
          <AnimatePresence>
            {showCity && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute right-0 top-full mt-1 z-30 py-1"
                style={{ background: '#111a12', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, minWidth: 145, maxHeight: 260, overflowY: 'auto' }}>
                {CITIES.map(c => (
                  <button key={c.name} onClick={() => changeCity(c)} className="w-full text-left px-3 py-2 text-sm"
                    style={{ color: c.name === city.name ? '#4ade80' : 'rgba(255,255,255,0.7)' }}>{c.name}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, height: 80 }} />
        ))}</div>
      ) : (
        <>
          {/* Day strip — always visible */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: 'none' }}>
            {forecast.map((d, i) => {
              const rc2 = RISK_CFG[d.topLevel] || RISK_CFG.safe;
              return (
                <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => { setDayIdx(i); setExpandedDisease(null); }}
                  className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl"
                  style={{ background: dayIdx === i ? rc2.bg : 'rgba(255,255,255,0.04)', border: `1px solid ${dayIdx === i ? rc2.color + '55' : 'rgba(255,255,255,0.08)'}`, minWidth: 70, transition: 'all 0.2s' }}>
                  <p style={{ color: dayIdx === i ? rc2.color : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>{d.day}</p>
                  <span style={{ fontSize: 18 }}>{d.icon}</span>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0 }}>{d.temp}°</p>
                  <span style={{ fontSize: 13 }}>{rc2.emoji}</span>
                </motion.button>
              );
            })}
          </div>

          {/* TAB BAR */}
          <div className="flex gap-2 mb-5">
            {TABS.map(tab => (
              <motion.button key={tab.id} whileTap={{ scale: 0.95 }}
                onClick={() => handleTabChange(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
                style={{
                  background: activeTab === tab.id ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${activeTab === tab.id ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: activeTab === tab.id ? '#4ade80' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.2s',
                }}>
                <span>{tab.emoji}</span>
                <span style={{ fontSize: 10 }}>{tab.label}</span>
              </motion.button>
            ))}
          </div>

          {/* ── TAB: DISEASE RISK ─────────────────────────────────────── */}
          {activeTab === 'disease' && day && (
            <AnimatePresence mode="wait">
              <motion.div key={`disease-${dayIdx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                {/* Overall risk banner */}
                <div style={{ background: rc.bg, border: `1px solid ${rc.color}35`, borderRadius: 20, padding: '18px', marginBottom: 16 }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p style={{ color: rc.color, fontWeight: 900, fontSize: 20, fontFamily: "'Syne', sans-serif", margin: 0 }}>
                        {rc.emoji} {rc.label} RISK
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: '3px 0 0' }}>
                        {crop?.name} · {city.name} · {day.day} · {rc.desc}
                      </p>
                    </div>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: `conic-gradient(${rc.color} ${day.topScore * 3.6}deg, rgba(255,255,255,0.05) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#0d1a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: rc.color, fontWeight: 900, fontSize: 12 }}>{day.topScore}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <Pill Icon={Thermometer} value={`${day.temp}°C`}      label="Temp"    color="#f97316" />
                    <Pill Icon={Droplets}    value={`${day.humidity}%`}   label="Humid"   color="#60a5fa" />
                    <Pill Icon={Wind}        value={`${day.wind}km/h`}    label="Wind"    color="#94a3b8" />
                    <Pill Icon={Cloud}       value={`${day.rain}mm`}      label="Rain"    color="#818cf8" />
                  </div>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 12, letterSpacing: '0.1em' }}>
                  ALL DISEASES FOR {crop?.name?.toUpperCase()} — TAP FOR DETAILS
                </p>

                <div className="space-y-3">
                  {day.diseases.map((d, i) => {
                    const rc3 = RISK_CFG[d.level] || RISK_CFG.safe;
                    const isOpen = expandedDisease === i;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                        <motion.button whileTap={{ scale: 0.98 }} onClick={() => setExpandedDisease(isOpen ? null : i)}
                          className="w-full text-left"
                          style={{ background: isOpen ? rc3.bg : 'rgba(255,255,255,0.03)', border: `1px solid ${isOpen ? rc3.color + '40' : 'rgba(255,255,255,0.08)'}`, borderLeft: `3px solid ${rc3.color}`, borderRadius: 14, padding: '13px 15px', transition: 'all 0.2s' }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div style={{ width: 42, flexShrink: 0 }}>
                                <p style={{ color: rc3.color, fontWeight: 900, fontSize: 18, margin: 0, lineHeight: 1 }}>{d.score}%</p>
                                <p style={{ color: rc3.color, fontSize: 8, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{rc3.label}</p>
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>{d.name}</p>
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '2px 0 0', fontFamily: "'Noto Nastaliq Urdu', serif" }}>{d.urdu}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: 18 }}>{rc3.emoji}</span>
                              <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                            </div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 4, marginTop: 10 }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${d.score}%` }}
                              transition={{ delay: i * 0.08 + 0.2, duration: 0.7, ease: 'easeOut' }}
                              style={{ background: rc3.color, height: '100%', borderRadius: 4 }} />
                          </div>
                        </motion.button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${rc3.color}20`, borderTop: 'none', borderRadius: '0 0 14px 14px', overflow: 'hidden' }}>
                              <div style={{ padding: '14px 15px' }}>
                                <div style={{ background: rc3.bg, border: `1px solid ${rc3.color}25`, borderRadius: 12, padding: '12px', marginBottom: 12 }}>
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <Info size={13} style={{ color: rc3.color }} />
                                    <p style={{ color: rc3.color, fontWeight: 700, fontSize: 12, margin: 0 }}>Why this risk?</p>
                                  </div>
                                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.65, margin: 0 }}>{d.reason}</p>
                                </div>
                                <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 12, padding: '12px' }}>
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <Shield size={13} style={{ color: '#4ade80' }} />
                                    <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 12, margin: 0 }}>Treatment / Action</p>
                                  </div>
                                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{d.treatment}</p>
                                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '6px 0 0', textAlign: 'right', fontFamily: "'Noto Nastaliq Urdu', serif" }}>{d.treatmentUrdu}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(74,222,128,0.12)', borderRadius: 14, padding: '14px', marginTop: 16 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={14} style={{ color: '#4ade80' }} />
                    <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 13, margin: 0 }}>General Action Plan for {crop?.name}</p>
                  </div>
                  <ul style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 2.0, paddingLeft: 16, margin: 0 }}>
                    <li>Scout {crop?.name} fields every 3 days</li>
                    <li>Pre-mix fungicide / bactericide and keep sprayer ready</li>
                    <li>Ensure proper drainage — waterlogging multiplies risk</li>
                    <li>Act on <span style={{ color: '#ef4444' }}>CRITICAL</span> / <span style={{ color: '#f97316' }}>HIGH</span> risks within 24–48 hours</li>
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* ── TAB: CROP ACTIONS ─────────────────────────────────────── */}
          {activeTab === 'actions' && (
            <AnimatePresence mode="wait">
              <motion.div key="actions-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                {/* Crop ideal conditions strip */}
                {(() => {
                  const k = getCropKnowledge(cropId);
                  return (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '14px', marginBottom: 16 }}>
                      <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 10, letterSpacing: '0.1em' }}>
                        🌿 IDEAL CONDITIONS FOR {crop?.name?.toUpperCase()}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: '🌡️ Temperature', val: `${k.tempMin}–${k.tempMax}°C` },
                          { label: '💧 Humidity',    val: `${k.humidMin}–${k.humidMax}%` },
                          { label: '🌧️ Rain/day',   val: `${k.rainMin}–${k.rainMax}mm` },
                          { label: '🚿 Water Need',  val: k.waterNeed },
                          { label: '🧪 Soil pH',     val: k.soilPH },
                          { label: '📅 Season',      val: k.season },
                        ].map(item => (
                          <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px' }}>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '0 0 2px', fontFamily: "'JetBrains Mono', monospace" }}>{item.label}</p>
                            <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: 0 }}>{item.val}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(74,222,128,0.06)', borderRadius: 10 }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '0 0 2px', fontFamily: "'JetBrains Mono', monospace" }}>💊 KEY NUTRIENTS</p>
                        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, margin: 0 }}>{k.keyNutrients}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Action plan loading */}
                {actionLoading && (
                  <div className="flex flex-col items-center py-12 gap-4">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                      <Sparkles size={28} style={{ color: '#4ade80' }} />
                    </motion.div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Analysing {city.name} forecast for {crop?.name}…</p>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>Comparing weather vs ideal conditions</p>
                  </div>
                )}

                {/* Action plan error */}
                {actionError && !actionLoading && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
                    <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{actionError}</p>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={fetchActionPlan}
                      className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-sm"
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                      <RefreshCw size={13} /> Try Again
                    </motion.button>
                  </div>
                )}

                {/* Action plan content */}
                {actionPlan && !actionLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                    {/* Urgent alert */}
                    {actionPlan.urgentAlert && actionPlan.urgentAlert !== 'null' && (
                      <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }}
                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
                        <div className="flex items-start gap-2">
                          <span style={{ fontSize: 20 }}>🚨</span>
                          <div>
                            <p style={{ color: '#ef4444', fontWeight: 800, fontSize: 13, margin: '0 0 4px' }}>URGENT ALERT</p>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{actionPlan.urgentAlert}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Overall assessment */}
                    <div style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Leaf size={14} style={{ color: '#4ade80' }} />
                        <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 12, margin: 0 }}>WEEKLY OVERVIEW FOR {crop?.name?.toUpperCase()}</p>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{actionPlan.overallAssessment}</p>
                    </div>

                    {/* Day-by-day plan */}
                    <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 12, letterSpacing: '0.1em' }}>
                      📅 DAY-BY-DAY ACTION PLAN — TAP TO EXPAND
                    </p>

                    <div className="space-y-2 mb-4">
                      {actionPlan.days?.map((d, i) => {
                        const sc = STATUS_CFG[d.status] || STATUS_CFG.caution;
                        const ic = IRRIGATE_CFG[d.irrigate] || IRRIGATE_CFG.normal;
                        const fc = forecast[i];
                        const isOpen = expandedDay === i;
                        return (
                          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setExpandedDay(isOpen ? -1 : i)}
                              className="w-full text-left"
                              style={{ background: isOpen ? sc.bg : 'rgba(255,255,255,0.03)', border: `1px solid ${isOpen ? sc.color + '40' : 'rgba(255,255,255,0.08)'}`, borderLeft: `3px solid ${sc.color}`, borderRadius: 14, padding: '12px 14px', transition: 'all 0.2s' }}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span style={{ fontSize: 20 }}>{sc.emoji}</span>
                                  <div>
                                    <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>{d.day}</p>
                                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '1px 0 0' }}>
                                      {fc ? `${fc.temp}°C · ${fc.humidity}% RH` : ''} · <span style={{ color: sc.color }}>{sc.label}</span>
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span style={{ fontSize: 14 }}>{ic.emoji}</span>
                                  <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                                </div>
                              </div>
                            </motion.button>

                            <AnimatePresence>
                              {isOpen && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                  style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${sc.color}20`, borderTop: 'none', borderRadius: '0 0 14px 14px', overflow: 'hidden' }}>
                                  <div style={{ padding: '14px' }}>

                                    {/* Status reason */}
                                    <div style={{ background: sc.bg, borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                                      <p style={{ color: sc.color, fontSize: 12, fontWeight: 700, margin: '0 0 3px' }}>
                                        {sc.emoji} Crop Status: {sc.label}
                                      </p>
                                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.55, margin: 0 }}>{d.statusReason}</p>
                                    </div>

                                    {/* Actions */}
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, letterSpacing: '0.1em' }}>✅ WHAT TO DO</p>
                                    <div className="space-y-2 mb-3">
                                      {d.actions?.map((act, ai) => (
                                        <div key={ai} className="flex items-start gap-2"
                                          style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.12)', borderRadius: 10, padding: '8px 10px' }}>
                                          <span style={{ color: '#4ade80', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>{ai + 1}.</span>
                                          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{act}</p>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Irrigation */}
                                    <div style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                                      <p style={{ color: '#60a5fa', fontWeight: 700, fontSize: 12, margin: '0 0 3px' }}>{ic.emoji} Irrigation: {ic.label}</p>
                                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{d.irrigateReason}</p>
                                    </div>

                                    {/* Avoid */}
                                    <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '10px 12px' }}>
                                      <p style={{ color: '#f87171', fontWeight: 700, fontSize: 12, margin: '0 0 3px' }}>🚫 Avoid Today</p>
                                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{d.avoid}</p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Weekly tips */}
                    <div style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 14, padding: '14px', marginBottom: 12 }}>
                      <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 12, margin: '0 0 10px', fontFamily: "'JetBrains Mono', monospace', letterSpacing: '0.05em" }}>
                        💡 WEEKLY TIPS FOR {crop?.name?.toUpperCase()}
                      </p>
                      <div className="space-y-2">
                        {actionPlan.weeklyTips?.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span style={{ color: '#4ade80', fontSize: 11, flexShrink: 0, marginTop: 1 }}>▸</span>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fertilizer advice */}
                    {actionPlan.fertilizerAdvice && (
                      <div style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 14, padding: '14px', marginBottom: 12 }}>
                        <p style={{ color: '#eab308', fontWeight: 700, fontSize: 12, margin: '0 0 6px' }}>🧪 Fertilizer This Week</p>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{actionPlan.fertilizerAdvice}</p>
                      </div>
                    )}

                    {/* Harvest note */}
                    {actionPlan.harvestNote && actionPlan.harvestNote !== 'null' && (
                      <div style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 14, padding: '14px', marginBottom: 12 }}>
                        <p style={{ color: '#c084fc', fontWeight: 700, fontSize: 12, margin: '0 0 6px' }}>🌾 Harvest Note</p>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{actionPlan.harvestNote}</p>
                      </div>
                    )}

                    {/* Refresh button */}
                    <motion.button whileTap={{ scale: 0.96 }} onClick={fetchActionPlan}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                      <RefreshCw size={13} /> Regenerate Plan
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* ── TAB: AI CHAT ─────────────────────────────────────────── */}
          {activeTab === 'chat' && (
            <AnimatePresence mode="wait">
              <motion.div key="chat-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                {/* Context banner */}
                <div style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontSize: 16 }}>{crop?.emoji}</span>
                    <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 12, margin: 0 }}>{crop?.name} · {city.name}</p>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>·</span>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: 0 }}>
                      Today {forecast[0]?.temp}°C · {forecast[0]?.humidity}% RH · {forecast[0]?.rain}mm
                    </p>
                  </div>
                </div>

                {/* Quick prompts */}
                {chatMessages.length <= 1 && (
                  <div className="mb-4">
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, letterSpacing: '0.05em' }}>
                      💬 QUICK QUESTIONS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        `Should I irrigate ${crop?.name} today?`,
                        `Best fertilizer for ${crop?.name} this week?`,
                        `How to protect from disease in this weather?`,
                        `Is this weather ideal for ${crop?.name}?`,
                        `What spray should I use now?`,
                        `When should I harvest?`,
                      ].map((q, i) => (
                        <motion.button key={i} whileTap={{ scale: 0.95 }}
                          onClick={() => { setChatInput(q); }}
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 12px', color: 'rgba(255,255,255,0.6)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {q}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, minHeight: 200 }}>
                  {chatMessages.map((msg, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      {msg.role === 'assistant' && (
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                          <span style={{ fontSize: 14 }}>🌿</span>
                        </div>
                      )}
                      <div style={{
                        maxWidth: '80%',
                        background: msg.role === 'user' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${msg.role === 'user' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        padding: '10px 14px',
                      }}>
                        <p style={{ color: msg.role === 'user' ? '#4ade80' : 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>
                          {msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {chatLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 14 }}>🌿</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px 18px 18px 4px', padding: '10px 16px' }}>
                        <div className="flex gap-1.5 items-center">
                          {[0, 1, 2].map(j => (
                            <motion.div key={j} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: j * 0.15, repeat: Infinity }}
                              style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80' }} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2" style={{ position: 'sticky', bottom: 0, paddingBottom: 8 }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                    placeholder={`Ask about ${crop?.name} farming…`}
                    className="flex-1 px-4 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', caretColor: '#4ade80' }}
                  />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={sendChat} disabled={!chatInput.trim() || chatLoading}
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: chatInput.trim() ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${chatInput.trim() ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.2s' }}>
                    <Send size={15} style={{ color: chatInput.trim() ? '#4ade80' : 'rgba(255,255,255,0.25)' }} />
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Change crop button */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setStep('pick_crop'); setSearch(''); }}
            className="w-full mt-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
            🌱 Change Crop · فصل تبدیل کریں
          </motion.button>
        </>
      )}
    </div>
  );
}