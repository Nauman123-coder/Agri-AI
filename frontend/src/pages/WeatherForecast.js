/**
 * WeatherForecast.js — Crop-First Disease Risk Forecaster
 * User picks their crop → system shows 5-day weather risk for that specific crop
 * Covers every major Pakistani crop with crop-specific disease models
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud, Droplets, Thermometer, Wind,
  ChevronDown, MapPin, RefreshCw, Shield,
  AlertTriangle, CheckCircle, Info, ChevronLeft
} from 'lucide-react';

// ── Pakistani cities ─────────────────────────────────────────────────────────
const CITIES = [
  { name: 'Lahore',      base: 28 },
  { name: 'Karachi',     base: 32 },
  { name: 'Faisalabad',  base: 27 },
  { name: 'Multan',      base: 31 },
  { name: 'Rawalpindi',  base: 22 },
  { name: 'Peshawar',    base: 24 },
  { name: 'Gujranwala',  base: 27 },
  { name: 'Sahiwal',     base: 29 },
  { name: 'Hyderabad',   base: 31 },
  { name: 'Sukkur',      base: 33 },
  { name: 'Bahawalpur',  base: 30 },
  { name: 'Sialkot',     base: 26 },
  { name: 'Quetta',      base: 18 },
  { name: 'Muzaffarabad',base: 20 },
  { name: 'Mardan',      base: 25 },
];

// ── All Pakistani crops with categories ──────────────────────────────────────
const CROP_CATEGORIES = [
  {
    label: 'Grain Crops', icon: '🌾',
    crops: [
      { id: 'wheat',      name: 'Wheat',       urdu: 'گندم',         emoji: '🌾' },
      { id: 'rice',       name: 'Rice',         urdu: 'چاول',         emoji: '🍚' },
      { id: 'maize',      name: 'Maize / Corn', urdu: 'مکئی',         emoji: '🌽' },
      { id: 'barley',     name: 'Barley',       urdu: 'جَو',          emoji: '🌿' },
      { id: 'sorghum',    name: 'Sorghum',      urdu: 'جوار',         emoji: '🌾' },
      { id: 'millet',     name: 'Pearl Millet', urdu: 'باجرہ',        emoji: '🌱' },
    ],
  },
  {
    label: 'Cash Crops', icon: '💰',
    crops: [
      { id: 'cotton',     name: 'Cotton',       urdu: 'کپاس',         emoji: '🌿' },
      { id: 'sugarcane',  name: 'Sugarcane',    urdu: 'گنا',          emoji: '🎋' },
      { id: 'tobacco',    name: 'Tobacco',      urdu: 'تمباکو',       emoji: '🍃' },
      { id: 'sunflower',  name: 'Sunflower',    urdu: 'سورج مکھی',    emoji: '🌻' },
      { id: 'mustard',    name: 'Mustard',      urdu: 'سرسوں',        emoji: '🌼' },
      { id: 'canola',     name: 'Canola',       urdu: 'کینولا',       emoji: '🌼' },
    ],
  },
  {
    label: 'Vegetables', icon: '🥬',
    crops: [
      { id: 'potato',     name: 'Potato',       urdu: 'آلو',          emoji: '🥔' },
      { id: 'tomato',     name: 'Tomato',       urdu: 'ٹماٹر',        emoji: '🍅' },
      { id: 'onion',      name: 'Onion',        urdu: 'پیاز',         emoji: '🧅' },
      { id: 'chilli',     name: 'Chilli',       urdu: 'مرچ',          emoji: '🌶️' },
      { id: 'garlic',     name: 'Garlic',       urdu: 'لہسن',         emoji: '🧄' },
      { id: 'brinjal',    name: 'Brinjal',      urdu: 'بینگن',        emoji: '🍆' },
      { id: 'okra',       name: 'Okra',         urdu: 'بھنڈی',        emoji: '🌿' },
      { id: 'spinach',    name: 'Spinach',      urdu: 'پالک',         emoji: '🥬' },
      { id: 'cauliflower',name: 'Cauliflower',  urdu: 'گوبھی',        emoji: '🥦' },
      { id: 'pea',        name: 'Peas',         urdu: 'مٹر',          emoji: '🫛' },
      { id: 'cucumber',   name: 'Cucumber',     urdu: 'کھیرا',        emoji: '🥒' },
      { id: 'pumpkin',    name: 'Pumpkin',      urdu: 'کدو',          emoji: '🎃' },
    ],
  },
  {
    label: 'Fruits', icon: '🍎',
    crops: [
      { id: 'mango',      name: 'Mango',        urdu: 'آم',           emoji: '🥭' },
      { id: 'citrus',     name: 'Citrus',       urdu: 'لیموں/مالٹا',  emoji: '🍊' },
      { id: 'banana',     name: 'Banana',       urdu: 'کیلا',         emoji: '🍌' },
      { id: 'guava',      name: 'Guava',        urdu: 'امرود',        emoji: '🍐' },
      { id: 'apple',      name: 'Apple',        urdu: 'سیب',          emoji: '🍎' },
      { id: 'grapes',     name: 'Grapes',       urdu: 'انگور',        emoji: '🍇' },
      { id: 'peach',      name: 'Peach',        urdu: 'آڑو',          emoji: '🍑' },
      { id: 'watermelon', name: 'Watermelon',   urdu: 'تربوز',        emoji: '🍉' },
      { id: 'strawberry', name: 'Strawberry',   urdu: 'اسٹرابیری',    emoji: '🍓' },
    ],
  },
  {
    label: 'Pulses & Legumes', icon: '🫘',
    crops: [
      { id: 'chickpea',   name: 'Chickpea',     urdu: 'چنے',          emoji: '🫘' },
      { id: 'lentil',     name: 'Lentil',       urdu: 'مسور',         emoji: '🫘' },
      { id: 'mungbean',   name: 'Mung Bean',    urdu: 'ماش',          emoji: '🌿' },
      { id: 'blackgram',  name: 'Black Gram',   urdu: 'ماش کی دال',   emoji: '🫘' },
      { id: 'cowpea',     name: 'Cowpea',       urdu: 'لوبیا',        emoji: '🫘' },
      { id: 'soybean',    name: 'Soybean',      urdu: 'سویا بین',     emoji: '🌱' },
    ],
  },
  {
    label: 'Fodder & Others', icon: '🌱',
    crops: [
      { id: 'berseem',    name: 'Berseem',      urdu: 'برسیم',        emoji: '🌿' },
      { id: 'lucerne',    name: 'Lucerne',      urdu: 'لوسرن',        emoji: '🌿' },
      { id: 'ginger',     name: 'Ginger',       urdu: 'ادرک',         emoji: '🫚' },
      { id: 'turmeric',   name: 'Turmeric',     urdu: 'ہلدی',         emoji: '🟡' },
    ],
  },
];

// Flatten for easy lookup
const ALL_CROPS = CROP_CATEGORIES.flatMap(c => c.crops);

// ── Crop-specific disease risk models ────────────────────────────────────────
// Each crop has an array of diseases with scoring functions
const CROP_DISEASE_MODELS = {

  wheat: [
    {
      disease: 'Yellow Rust', urdu: 'پیلا زنگ', severity: 'critical',
      check: (t, h, w, r) => t >= 10 && t <= 18 && h >= 70,
      score: (t, h, w, r) => Math.min(100, (h - 70) * 3 + (18 - Math.abs(t - 12)) * 4 + (w > 15 ? 20 : 0)),
      tip: 'Apply Propiconazole or Tebuconazole immediately. Scout weekly.',
      tipUrdu: 'پروپیکونازول فوری اسپرے کریں۔',
    },
    {
      disease: 'Brown Rust', urdu: 'بھورا زنگ', severity: 'high',
      check: (t, h, w, r) => t >= 15 && t <= 25 && h >= 65,
      score: (t, h, w, r) => Math.min(100, (h - 65) * 2.5 + (25 - Math.abs(t - 20)) * 3),
      tip: 'Use Mancozeb + Propiconazole at flag leaf stage.',
      tipUrdu: 'بھورا زنگ: مینکوزیب اسپرے کریں۔',
    },
    {
      disease: 'Powdery Mildew', urdu: 'سفید بیماری', severity: 'moderate',
      check: (t, h, w, r) => t >= 15 && t <= 22 && h >= 55 && h <= 75,
      score: (t, h, w, r) => Math.min(100, (h - 55) * 2 + (22 - Math.abs(t - 18)) * 3),
      tip: 'Apply sulfur-based fungicide. Avoid dense planting.',
      tipUrdu: 'گندھک والی دوائی استعمال کریں۔',
    },
    {
      disease: 'Loose Smut', urdu: 'کھلی کانگیاری', severity: 'moderate',
      check: (t, h, w, r) => t >= 16 && t <= 22 && h >= 60,
      score: (t, h, w, r) => Math.min(100, (h - 60) * 2 + 20),
      tip: 'Use treated certified seed. Apply Carboxin seed treatment.',
      tipUrdu: 'سرٹیفائیڈ بیج استعمال کریں۔',
    },
  ],

  rice: [
    {
      disease: 'Blast Disease', urdu: 'دھماکہ بیماری', severity: 'critical',
      check: (t, h, w, r) => t >= 24 && t <= 28 && h >= 80,
      score: (t, h, w, r) => Math.min(100, (h - 80) * 4 + (28 - Math.abs(t - 26)) * 5),
      tip: 'Apply Tricyclazole immediately. Avoid excessive nitrogen.',
      tipUrdu: 'ٹرائیسائیکلازول فوری اسپرے کریں۔',
    },
    {
      disease: 'Bacterial Blight', urdu: 'بیکٹیریل جھلساؤ', severity: 'high',
      check: (t, h, w, r) => t >= 25 && h >= 75 && w > 20,
      score: (t, h, w, r) => Math.min(100, (h - 75) * 3 + (w - 20) * 2 + 15),
      tip: 'Avoid field flooding. Use resistant varieties. Apply Copper oxychloride.',
      tipUrdu: 'کھیت میں پانی کم کریں۔ تانبے کی دوائی لگائیں۔',
    },
    {
      disease: 'Sheath Blight', urdu: 'تنے کی بیماری', severity: 'high',
      check: (t, h, w, r) => t >= 28 && h >= 85,
      score: (t, h, w, r) => Math.min(100, (h - 85) * 4 + (t - 28) * 3),
      tip: 'Apply Validamycin or Hexaconazole. Reduce nitrogen fertilizer.',
      tipUrdu: 'والیڈامائسن اسپرے کریں۔ نائٹروجن کم کریں۔',
    },
    {
      disease: 'False Smut', urdu: 'جھوٹی کانگیاری', severity: 'moderate',
      check: (t, h, w, r) => t >= 25 && t <= 30 && h >= 80 && r > 0,
      score: (t, h, w, r) => Math.min(100, (h - 80) * 2 + r * 3 + 20),
      tip: 'Apply Propiconazole at panicle emergence stage.',
      tipUrdu: 'بالی نکلتے وقت پروپیکونازول اسپرے کریں۔',
    },
  ],

  cotton: [
    {
      disease: 'Cotton Leaf Curl Virus', urdu: 'پتوں کا مڑنا', severity: 'critical',
      check: (t, h, w, r) => t >= 28 && h < 55,
      score: (t, h, w, r) => Math.min(100, (t - 28) * 6 + (55 - h) * 2),
      tip: 'Control whitefly with Imidacloprid. Remove infected plants. Use CLCuV-resistant varieties.',
      tipUrdu: 'سفید مکھی کنٹرول کریں۔ بیمار پودے فوری ہٹائیں۔',
    },
    {
      disease: 'Bacterial Blight', urdu: 'بیکٹیریل جھلساؤ', severity: 'high',
      check: (t, h, w, r) => t >= 25 && h >= 70 && r > 5,
      score: (t, h, w, r) => Math.min(100, (h - 70) * 3 + r * 2 + 15),
      tip: 'Spray Copper hydroxide. Avoid working in wet fields to prevent spread.',
      tipUrdu: 'تانبے کی دوائی اسپرے کریں۔',
    },
    {
      disease: 'Fusarium Wilt', urdu: 'جڑ سڑن', severity: 'high',
      check: (t, h, w, r) => t >= 25 && t <= 32 && h >= 60,
      score: (t, h, w, r) => Math.min(100, (t - 25) * 3 + (h - 60) * 2),
      tip: 'Use resistant varieties. Apply Trichoderma as soil treatment.',
      tipUrdu: 'ٹرائیکوڈرما سے مٹی کا علاج کریں۔',
    },
    {
      disease: 'Boll Rot', urdu: 'ٹینڈے کی سڑن', severity: 'moderate',
      check: (t, h, w, r) => t >= 30 && h >= 75 && r > 0,
      score: (t, h, w, r) => Math.min(100, (h - 75) * 3 + r * 2 + 10),
      tip: 'Improve field drainage. Spray Mancozeb after heavy rains.',
      tipUrdu: 'بارش کے بعد مینکوزیب اسپرے کریں۔',
    },
  ],

  potato: [
    {
      disease: 'Late Blight', urdu: 'لیٹ بلائٹ', severity: 'critical',
      check: (t, h, w, r) => t >= 10 && t <= 22 && h >= 75,
      score: (t, h, w, r) => Math.min(100, (h - 75) * 4 + (22 - Math.abs(t - 16)) * 5 + r * 4),
      tip: 'Apply Metalaxyl + Mancozeb immediately. Avoid overhead irrigation.',
      tipUrdu: 'میٹالاکسل + مینکوزیب فوری لگائیں۔',
    },
    {
      disease: 'Early Blight', urdu: 'ارلی بلائٹ', severity: 'high',
      check: (t, h, w, r) => t >= 24 && t <= 30 && h >= 60,
      score: (t, h, w, r) => Math.min(100, (h - 60) * 2.5 + (t - 24) * 3),
      tip: 'Spray Chlorothalonil or Mancozeb every 7-10 days.',
      tipUrdu: 'کلوروتھالونیل ہر 7-10 دن میں اسپرے کریں۔',
    },
    {
      disease: 'Black Scurf', urdu: 'کالی کھرنڈ', severity: 'moderate',
      check: (t, h, w, r) => t >= 10 && t <= 18 && h >= 80,
      score: (t, h, w, r) => Math.min(100, (h - 80) * 3 + 20),
      tip: 'Treat seed with Thiabendazole. Avoid planting in cold wet soils.',
      tipUrdu: 'بیج کا علاج کریں۔ ٹھنڈی گیلی مٹی میں نہ لگائیں۔',
    },
    {
      disease: 'Viral Mosaic', urdu: 'وائرل موزیک', severity: 'moderate',
      check: (t, h, w, r) => t >= 20 && h < 50,
      score: (t, h, w, r) => Math.min(100, (t - 20) * 3 + (50 - h) * 1.5),
      tip: 'Control aphids with Imidacloprid. Use certified virus-free seed tubers.',
      tipUrdu: 'ایفیڈ کنٹرول کریں۔ سرٹیفائیڈ بیج استعمال کریں۔',
    },
  ],

  tomato: [
    {
      disease: 'Late Blight', urdu: 'لیٹ بلائٹ', severity: 'critical',
      check: (t, h, w, r) => t >= 10 && t <= 22 && h >= 75,
      score: (t, h, w, r) => Math.min(100, (h - 75) * 4 + r * 4 + 15),
      tip: 'Apply Metalaxyl + Mancozeb. Remove infected foliage.',
      tipUrdu: 'میٹالاکسل اسپرے کریں۔ بیمار پتے ہٹائیں۔',
    },
    {
      disease: 'Tomato Mosaic Virus', urdu: 'ٹماٹر موزیک', severity: 'high',
      check: (t, h, w, r) => t >= 25 && h < 55,
      score: (t, h, w, r) => Math.min(100, (t - 25) * 4 + (55 - h) * 2),
      tip: 'Control insect vectors. Remove infected plants. Wash hands between plants.',
      tipUrdu: 'حشرات کنٹرول کریں۔ بیمار پودے ہٹائیں۔',
    },
    {
      disease: 'Fusarium Wilt', urdu: 'جڑ سڑن', severity: 'high',
      check: (t, h, w, r) => t >= 25 && t <= 32,
      score: (t, h, w, r) => Math.min(100, (t - 25) * 5 + 20),
      tip: 'Use Fusarium-resistant varieties. Crop rotation mandatory.',
      tipUrdu: 'مزاحم قسم استعمال کریں۔ فصل بدلاؤ ضروری ہے۔',
    },
    {
      disease: 'Bacterial Spot', urdu: 'بیکٹیریل دھبے', severity: 'moderate',
      check: (t, h, w, r) => t >= 24 && h >= 75 && r > 0,
      score: (t, h, w, r) => Math.min(100, (h - 75) * 3 + r * 2),
      tip: 'Apply Copper bactericide. Avoid working in wet conditions.',
      tipUrdu: 'تانبے کی دوائی لگائیں۔ گیلے میں کام نہ کریں۔',
    },
  ],

  maize: [
    {
      disease: 'Northern Corn Blight', urdu: 'مکئی کا جھلساؤ', severity: 'critical',
      check: (t, h, w, r) => t >= 18 && t <= 27 && h >= 75,
      score: (t, h, w, r) => Math.min(100, (h - 75) * 3 + (27 - Math.abs(t - 22)) * 4),
      tip: 'Apply Propiconazole or Azoxystrobin. Use resistant hybrids.',
      tipUrdu: 'پروپیکونازول اسپرے کریں۔ مزاحم ہائبرڈ استعمال کریں۔',
    },
    {
      disease: 'Maize Rust', urdu: 'مکئی کا زنگ', severity: 'high',
      check: (t, h, w, r) => t >= 16 && t <= 26 && h >= 70,
      score: (t, h, w, r) => Math.min(100, (h - 70) * 2.5 + (26 - Math.abs(t - 21)) * 3),
      tip: 'Spray Mancozeb or Chlorothalonil at first sign of rust pustules.',
      tipUrdu: 'پہلی علامت پر مینکوزیب اسپرے کریں۔',
    },
    {
      disease: 'Stalk Rot', urdu: 'تنے کی سڑن', severity: 'high',
      check: (t, h, w, r) => t >= 28 && h >= 70,
      score: (t, h, w, r) => Math.min(100, (t - 28) * 4 + (h - 70) * 2),
      tip: 'Ensure proper drainage. Balanced potassium fertilization reduces stalk rot.',
      tipUrdu: 'پانی نکاس ٹھیک رکھیں۔ پوٹاشیم کھاد استعمال کریں۔',
    },
    {
      disease: 'Downy Mildew', urdu: 'نیچے کی پھپھوندی', severity: 'moderate',
      check: (t, h, w, r) => t >= 20 && t <= 30 && h >= 80 && r > 0,
      score: (t, h, w, r) => Math.min(100, (h - 80) * 3 + r * 2 + 15),
      tip: 'Apply Metalaxyl seed treatment. Avoid waterlogging.',
      tipUrdu: 'میٹالاکسل بیج علاج کریں۔ پانی جمع نہ ہونے دیں۔',
    },
  ],

  sugarcane: [
    {
      disease: 'Red Rot', urdu: 'سرخ سڑن', severity: 'critical',
      check: (t, h, w, r) => t >= 25 && h >= 70,
      score: (t, h, w, r) => Math.min(100, (h - 70) * 3 + (t - 25) * 4),
      tip: 'Use disease-free setts. Apply Carbendazim as sett treatment. Avoid waterlogging.',
      tipUrdu: 'بیماری سے پاک بیج استعمال کریں۔ کاربینڈازم سے علاج کریں۔',
    },
    {
      disease: 'Smut', urdu: 'کانگیاری', severity: 'high',
      check: (t, h, w, r) => t >= 25 && t <= 35 && h >= 60,
      score: (t, h, w, r) => Math.min(100, (t - 25) * 3 + (h - 60) * 2),
      tip: 'Treat setts with hot water (52°C / 30 min). Use resistant varieties.',
      tipUrdu: 'گرم پانی سے بیج علاج کریں۔ مزاحم قسم لگائیں۔',
    },
    {
      disease: 'Wilt', urdu: 'مرجھاؤ', severity: 'moderate',
      check: (t, h, w, r) => t >= 30 && h < 50,
      score: (t, h, w, r) => Math.min(100, (t - 30) * 4 + (50 - h) * 2),
      tip: 'Adequate irrigation is critical. Apply Trichoderma as biocontrol.',
      tipUrdu: 'آبپاشی ضروری ہے۔ ٹرائیکوڈرما استعمال کریں۔',
    },
  ],

  onion: [
    {
      disease: 'Purple Blotch', urdu: 'جامنی دھبہ', severity: 'critical',
      check: (t, h, w, r) => t >= 21 && t <= 30 && h >= 70,
      score: (t, h, w, r) => Math.min(100, (h - 70) * 4 + (30 - Math.abs(t - 25)) * 3),
      tip: 'Apply Iprodione or Mancozeb. Ensure good air circulation in field.',
      tipUrdu: 'ایپروڈیون یا مینکوزیب اسپرے کریں۔',
    },
    {
      disease: 'Downy Mildew', urdu: 'نیچے کی پھپھوندی', severity: 'high',
      check: (t, h, w, r) => t >= 10 && t <= 20 && h >= 80,
      score: (t, h, w, r) => Math.min(100, (h - 80) * 4 + 15),
      tip: 'Apply Metalaxyl + Mancozeb. Avoid dense planting.',
      tipUrdu: 'میٹالاکسل + مینکوزیب اسپرے کریں۔',
    },
    {
      disease: 'Neck Rot', urdu: 'گردن سڑن', severity: 'moderate',
      check: (t, h, w, r) => t >= 15 && t <= 25 && h >= 75,
      score: (t, h, w, r) => Math.min(100, (h - 75) * 3 + 20),
      tip: 'Apply Iprodione at bulbing stage. Cure harvested bulbs properly.',
      tipUrdu: 'کٹائی کے بعد پیاز کو اچھی طرح سکھائیں۔',
    },
  ],

  chilli: [
    {
      disease: 'Chilli Mosaic Virus', urdu: 'مرچ موزیک', severity: 'critical',
      check: (t, h, w, r) => t >= 25 && h < 55,
      score: (t, h, w, r) => Math.min(100, (t - 25) * 5 + (55 - h) * 2),
      tip: 'Control thrips and aphids. Use virus-free transplants. Remove infected plants.',
      tipUrdu: 'تھرپس اور ایفیڈ کنٹرول کریں۔ بیمار پودے ہٹائیں۔',
    },
    {
      disease: 'Fruit Rot / Anthracnose', urdu: 'پھل سڑن', severity: 'high',
      check: (t, h, w, r) => t >= 25 && h >= 75 && r > 0,
      score: (t, h, w, r) => Math.min(100, (h - 75) * 3 + r * 3 + 10),
      tip: 'Apply Carbendazim or Mancozeb. Avoid fruit injuries during harvest.',
      tipUrdu: 'کاربینڈازم یا مینکوزیب اسپرے کریں۔',
    },
    {
      disease: 'Phytophthora Blight', urdu: 'فائٹوفتھورا', severity: 'high',
      check: (t, h, w, r) => t >= 25 && t <= 30 && h >= 85,
      score: (t, h, w, r) => Math.min(100, (h - 85) * 5 + r * 3),
      tip: 'Improve drainage. Apply Metalaxyl. Remove and destroy infected plants.',
      tipUrdu: 'پانی نکاس بہتر کریں۔ میٹالاکسل اسپرے کریں۔',
    },
  ],

  mango: [
    {
      disease: 'Anthracnose', urdu: 'انتھراکنوز', severity: 'critical',
      check: (t, h, w, r) => t >= 25 && h >= 80 && r > 0,
      score: (t, h, w, r) => Math.min(100, (h - 80) * 4 + r * 3 + 10),
      tip: 'Apply Carbendazim or Copper oxychloride before and during flowering.',
      tipUrdu: 'پھول آنے سے پہلے کاربینڈازم اسپرے کریں۔',
    },
    {
      disease: 'Powdery Mildew', urdu: 'سفید پھپھوندی', severity: 'high',
      check: (t, h, w, r) => t >= 20 && t <= 30 && h >= 50 && h <= 70,
      score: (t, h, w, r) => Math.min(100, (70 - h) * 2 + (30 - Math.abs(t - 25)) * 3),
      tip: 'Spray Sulfur or Hexaconazole at panicle emergence.',
      tipUrdu: 'گندھک یا ہیکساکونازول اسپرے کریں۔',
    },
    {
      disease: 'Mango Malformation', urdu: 'آم کی بدشکلی', severity: 'moderate',
      check: (t, h, w, r) => t >= 15 && t <= 25,
      score: (t, h, w, r) => Math.min(100, (25 - Math.abs(t - 20)) * 3 + 20),
      tip: 'Prune affected panicles. Apply NAA spray. Good orchard hygiene.',
      tipUrdu: 'متاثرہ بالیاں کاٹیں۔ این اے اے اسپرے کریں۔',
    },
  ],

  citrus: [
    {
      disease: 'Citrus Canker', urdu: 'لیموں کا کینکر', severity: 'critical',
      check: (t, h, w, r) => t >= 25 && h >= 75 && (w > 20 || r > 5),
      score: (t, h, w, r) => Math.min(100, (h - 75) * 3 + (w > 20 ? 25 : 0) + r * 2),
      tip: 'Apply Copper oxychloride. Avoid working in wet conditions. Quarantine infected trees.',
      tipUrdu: 'کاپر آکسی کلورائیڈ اسپرے کریں۔ متاثرہ درخت الگ کریں۔',
    },
    {
      disease: 'Greening (HLB)', urdu: 'سبز بیماری', severity: 'critical',
      check: (t, h, w, r) => t >= 25 && t <= 35,
      score: (t, h, w, r) => Math.min(100, (t - 25) * 5 + 30),
      tip: 'Control psyllid insects. Remove infected trees immediately. No cure available.',
      tipUrdu: 'سیلا کیڑا کنٹرول کریں۔ متاثرہ درخت فوری کاٹیں۔',
    },
    {
      disease: 'Phytophthora Root Rot', urdu: 'جڑ سڑن', severity: 'high',
      check: (t, h, w, r) => t >= 20 && h >= 80 && r > 10,
      score: (t, h, w, r) => Math.min(100, r * 4 + (h - 80) * 3),
      tip: 'Improve drainage. Treat with Metalaxyl. Avoid waterlogging at all costs.',
      tipUrdu: 'پانی نکاس بہتر کریں۔ میٹالاکسل سے علاج کریں۔',
    },
  ],

  chickpea: [
    {
      disease: 'Ascochyta Blight', urdu: 'اسکوکائٹا جھلساؤ', severity: 'critical',
      check: (t, h, w, r) => t >= 15 && t <= 25 && h >= 75 && r > 0,
      score: (t, h, w, r) => Math.min(100, (h - 75) * 4 + r * 3 + 10),
      tip: 'Apply Carbendazim or Mancozeb. Use resistant varieties. Avoid foliar irrigation.',
      tipUrdu: 'کاربینڈازم اسپرے کریں۔ مزاحم قسم لگائیں۔',
    },
    {
      disease: 'Fusarium Wilt', urdu: 'جڑ سڑن', severity: 'high',
      check: (t, h, w, r) => t >= 25 && t <= 32,
      score: (t, h, w, r) => Math.min(100, (t - 25) * 5 + 20),
      tip: 'Use resistant varieties. Treat seed with Carbendazim before planting.',
      tipUrdu: 'مزاحم قسم اور بیج علاج ضروری ہے۔',
    },
    {
      disease: 'Botrytis Grey Mold', urdu: 'بوٹرائٹس', severity: 'moderate',
      check: (t, h, w, r) => t >= 10 && t <= 20 && h >= 80,
      score: (t, h, w, r) => Math.min(100, (h - 80) * 4 + 15),
      tip: 'Spray Iprodione. Improve air circulation. Remove infected plant debris.',
      tipUrdu: 'ایپروڈیون اسپرے کریں۔ ہوا کی گردش بہتر کریں۔',
    },
  ],

  mustard: [
    {
      disease: 'Alternaria Blight', urdu: 'الٹرنیریا جھلساؤ', severity: 'critical',
      check: (t, h, w, r) => t >= 20 && t <= 30 && h >= 70,
      score: (t, h, w, r) => Math.min(100, (h - 70) * 3 + (30 - Math.abs(t - 25)) * 4),
      tip: 'Apply Iprodione or Mancozeb at flower initiation. Repeat every 10 days.',
      tipUrdu: 'پھول آنے پر ایپروڈیون اسپرے کریں۔',
    },
    {
      disease: 'White Rust', urdu: 'سفید زنگ', severity: 'high',
      check: (t, h, w, r) => t >= 10 && t <= 20 && h >= 75,
      score: (t, h, w, r) => Math.min(100, (h - 75) * 3 + 20),
      tip: 'Apply Metalaxyl + Mancozeb. Use resistant varieties.',
      tipUrdu: 'میٹالاکسل + مینکوزیب اسپرے کریں۔',
    },
    {
      disease: 'Powdery Mildew', urdu: 'سفید بیماری', severity: 'moderate',
      check: (t, h, w, r) => t >= 18 && t <= 28 && h >= 50 && h <= 70,
      score: (t, h, w, r) => Math.min(100, (70 - h) * 2 + 20),
      tip: 'Spray sulfur fungicide. Good spacing helps reduce humidity.',
      tipUrdu: 'گندھک والی دوائی اسپرے کریں۔',
    },
  ],

  sunflower: [
    {
      disease: 'Downy Mildew', urdu: 'نیچے کی پھپھوندی', severity: 'critical',
      check: (t, h, w, r) => t >= 15 && t <= 25 && h >= 80,
      score: (t, h, w, r) => Math.min(100, (h - 80) * 5 + 15),
      tip: 'Treat seed with Metalaxyl. Avoid planting in waterlogged areas.',
      tipUrdu: 'میٹالاکسل سے بیج علاج کریں۔',
    },
    {
      disease: 'Sclerotinia Rot', urdu: 'اسکلیروٹینیا سڑن', severity: 'high',
      check: (t, h, w, r) => t >= 15 && t <= 22 && h >= 75,
      score: (t, h, w, r) => Math.min(100, (h - 75) * 3 + r * 2 + 15),
      tip: 'Apply Iprodione at early flowering. Crop rotation essential.',
      tipUrdu: 'پھول آنے پر ایپروڈیون اسپرے کریں۔',
    },
    {
      disease: 'Rust', urdu: 'زنگ', severity: 'moderate',
      check: (t, h, w, r) => t >= 20 && t <= 30 && h >= 65,
      score: (t, h, w, r) => Math.min(100, (h - 65) * 2 + 20),
      tip: 'Spray Propiconazole or Tebuconazole at early rust signs.',
      tipUrdu: 'پروپیکونازول اسپرے کریں۔',
    },
  ],

  // Generic fallback for remaining crops
  barley:      [ { disease: 'Net Blotch',   urdu: 'نیٹ بلاچ',    severity: 'high',     check: (t,h,w,r) => t>=15&&t<=25&&h>=70, score:(t,h,w,r)=>Math.min(100,(h-70)*3+20), tip:'Apply Propiconazole.',         tipUrdu:'پروپیکونازول اسپرے کریں۔' }, { disease: 'Loose Smut', urdu: 'کانگیاری', severity: 'moderate', check: (t,h,w,r) => t>=16&&h>=60,        score:(t,h,w,r)=>Math.min(100,(h-60)*2+15), tip:'Use treated seed.',            tipUrdu:'علاج شدہ بیج استعمال کریں۔' } ],
  sorghum:     [ { disease: 'Grain Mold',    urdu: 'دانے کی پھپھوندی', severity: 'high', check: (t,h,w,r) => t>=25&&h>=70&&r>0, score:(t,h,w,r)=>Math.min(100,(h-70)*3+r*2+10), tip:'Spray Mancozeb at grain fill.', tipUrdu:'دانہ بنتے وقت مینکوزیب اسپرے کریں۔' }, { disease: 'Leaf Blight', urdu: 'پتہ جھلساؤ', severity: 'moderate', check: (t,h,w,r)=>t>=25&&h>=75, score:(t,h,w,r)=>Math.min(100,(h-75)*2+15), tip:'Use resistant varieties.', tipUrdu:'مزاحم قسم استعمال کریں۔' } ],
  millet:      [ { disease: 'Downy Mildew', urdu: 'نیچے کی پھپھوندی', severity: 'critical', check:(t,h,w,r)=>t>=25&&h>=80&&r>0, score:(t,h,w,r)=>Math.min(100,(h-80)*4+r*2+15), tip:'Metalaxyl seed treatment.',   tipUrdu:'میٹالاکسل بیج علاج۔' }, { disease: 'Ergot',       urdu: 'ایرگٹ',       severity: 'high',    check:(t,h,w,r)=>t>=20&&h>=75, score:(t,h,w,r)=>Math.min(100,(h-75)*3+15), tip:'Spray Propiconazole.',         tipUrdu:'پروپیکونازول اسپرے کریں۔' } ],
  brinjal:     [ { disease: 'Little Leaf',  urdu: 'چھوٹا پتہ',   severity: 'critical', check:(t,h,w,r)=>t>=28&&h<55, score:(t,h,w,r)=>Math.min(100,(t-28)*5+(55-h)*2), tip:'Control leafhopper insects.', tipUrdu:'لیف ہاپر کیڑا کنٹرول کریں۔' }, { disease: 'Fruit Borer', urdu: 'پھل سوراخ',  severity: 'high',    check:(t,h,w,r)=>t>=25&&h>=60, score:(t,h,w,r)=>Math.min(100,(t-25)*3+20), tip:'Apply Spinosad or Chlorpyrifos.', tipUrdu:'اسپنوسیڈ اسپرے کریں۔' } ],
  okra:        [ { disease: 'Yellow Mosaic', urdu: 'پیلا موزیک',   severity: 'critical', check:(t,h,w,r)=>t>=28&&h<55, score:(t,h,w,r)=>Math.min(100,(t-28)*6+(55-h)*2), tip:'Control whitefly immediately.',tipUrdu:'سفید مکھی فوری کنٹرول کریں۔' }, { disease: 'Powdery Mildew',urdu:'سفید بیماری', severity:'moderate', check:(t,h,w,r)=>t>=25&&h>=55&&h<=70, score:(t,h,w,r)=>Math.min(100,(70-h)*2+20), tip:'Spray sulfur fungicide.', tipUrdu:'گندھک والی دوائی اسپرے کریں۔' } ],
  cauliflower: [ { disease: 'Black Rot',    urdu: 'کالی سڑن',    severity: 'critical', check:(t,h,w,r)=>t>=25&&h>=75&&r>0, score:(t,h,w,r)=>Math.min(100,(h-75)*4+r*2+10), tip:'Apply Copper bactericide.',   tipUrdu:'تانبے کی دوائی لگائیں۔' }, { disease: 'Downy Mildew',urdu:'نیچے کی پھپھوندی',severity:'high',check:(t,h,w,r)=>t>=10&&t<=20&&h>=80,score:(t,h,w,r)=>Math.min(100,(h-80)*4+15),tip:'Apply Metalaxyl+Mancozeb.',tipUrdu:'میٹالاکسل + مینکوزیب اسپرے کریں۔'} ],
  spinach:     [ { disease: 'Downy Mildew', urdu: 'نیچے کی پھپھوندی',severity:'high', check:(t,h,w,r)=>t>=10&&t<=20&&h>=80, score:(t,h,w,r)=>Math.min(100,(h-80)*4+15), tip:'Metalaxyl + Mancozeb.',      tipUrdu:'میٹالاکسل + مینکوزیب اسپرے کریں۔' }, { disease: 'Leaf Spot',   urdu: 'پتہ دھبہ',    severity: 'moderate', check:(t,h,w,r)=>t>=20&&h>=70&&r>0, score:(t,h,w,r)=>Math.min(100,(h-70)*2+r*2+10), tip:'Spray Mancozeb.',             tipUrdu:'مینکوزیب اسپرے کریں۔' } ],
  pea:         [ { disease: 'Powdery Mildew',urdu:'سفید بیماری', severity:'high',    check:(t,h,w,r)=>t>=18&&t<=25&&h>=55&&h<=70, score:(t,h,w,r)=>Math.min(100,(70-h)*2+(25-Math.abs(t-21))*3+15), tip:'Spray sulfur.',              tipUrdu:'گندھک اسپرے کریں۔' }, { disease: 'Rust',        urdu: 'زنگ',          severity: 'moderate', check:(t,h,w,r)=>t>=15&&h>=65, score:(t,h,w,r)=>Math.min(100,(h-65)*2+20), tip:'Propiconazole spray.',        tipUrdu:'پروپیکونازول اسپرے کریں۔' } ],
  cucumber:    [ { disease: 'Downy Mildew', urdu: 'نیچے کی پھپھوندی',severity:'critical',check:(t,h,w,r)=>t>=15&&t<=25&&h>=80, score:(t,h,w,r)=>Math.min(100,(h-80)*5+15), tip:'Metalaxyl+Mancozeb spray.',  tipUrdu:'میٹالاکسل + مینکوزیب اسپرے کریں۔' }, { disease: 'Powdery Mildew',urdu:'سفید بیماری',severity:'high',check:(t,h,w,r)=>t>=20&&h>=50&&h<=70,score:(t,h,w,r)=>Math.min(100,(70-h)*2+(t-20)*2+15),tip:'Sulfur spray.',tipUrdu:'گندھک اسپرے کریں۔'} ],
  pumpkin:     [ { disease: 'Powdery Mildew',urdu:'سفید بیماری',severity:'high',check:(t,h,w,r)=>t>=20&&h>=50&&h<=70,score:(t,h,w,r)=>Math.min(100,(70-h)*2+20),tip:'Sulfur spray.',tipUrdu:'گندھک اسپرے کریں۔'}, {disease:'Downy Mildew',urdu:'نیچے کی پھپھوندی',severity:'high',check:(t,h,w,r)=>t>=15&&h>=80,score:(t,h,w,r)=>Math.min(100,(h-80)*4+15),tip:'Metalaxyl+Mancozeb.',tipUrdu:'میٹالاکسل اسپرے کریں۔'} ],
  banana:      [ { disease: 'Panama Wilt',  urdu: 'پانامہ مرجھاؤ',severity:'critical',check:(t,h,w,r)=>t>=24&&t<=32,score:(t,h,w,r)=>Math.min(100,(t-24)*6+25),tip:'No cure. Remove infected plants. Use resistant Cavendish varieties.',tipUrdu:'متاثرہ پودے فوری ہٹائیں۔'}, {disease:'Black Sigatoka',urdu:'کالا سیگاٹوکا',severity:'high',check:(t,h,w,r)=>t>=25&&h>=80&&r>0,score:(t,h,w,r)=>Math.min(100,(h-80)*4+r*2+10),tip:'Spray Propiconazole.',tipUrdu:'پروپیکونازول اسپرے کریں۔'} ],
  guava:       [ { disease: 'Anthracnose',  urdu: 'انتھراکنوز',  severity:'high',check:(t,h,w,r)=>t>=25&&h>=75&&r>0,score:(t,h,w,r)=>Math.min(100,(h-75)*3+r*2+10),tip:'Carbendazim spray.',tipUrdu:'کاربینڈازم اسپرے کریں۔'}, {disease:'Fruit Fly',urdu:'پھل مکھی',severity:'moderate',check:(t,h,w,r)=>t>=25&&h>=55,score:(t,h,w,r)=>Math.min(100,(t-25)*4+20),tip:'Protein bait traps. Malathion spray.',tipUrdu:'پروٹین جال استعمال کریں۔'} ],
  apple:       [ { disease: 'Scab',         urdu: 'سیب سکیب',    severity:'critical',check:(t,h,w,r)=>t>=10&&t<=24&&h>=80&&r>0,score:(t,h,w,r)=>Math.min(100,(h-80)*4+r*3+10),tip:'Mancozeb or Captan spray at bud burst.',tipUrdu:'کلی نکلتے وقت مینکوزیب اسپرے کریں۔'}, {disease:'Fire Blight',urdu:'آگ جھلساؤ',severity:'high',check:(t,h,w,r)=>t>=18&&t<=28&&h>=70&&r>0,score:(t,h,w,r)=>Math.min(100,(h-70)*3+r*2+15),tip:'Copper bactericide. Prune infected branches.',tipUrdu:'تانبے کی دوائی اور کٹائی کریں۔'} ],
  grapes:      [ { disease: 'Downy Mildew', urdu: 'نیچے کی پھپھوندی',severity:'critical',check:(t,h,w,r)=>t>=18&&t<=28&&h>=80&&r>0,score:(t,h,w,r)=>Math.min(100,(h-80)*5+r*3+10),tip:'Metalaxyl+Mancozeb spray.',tipUrdu:'میٹالاکسل + مینکوزیب اسپرے کریں۔'}, {disease:'Powdery Mildew',urdu:'سفید پھپھوندی',severity:'high',check:(t,h,w,r)=>t>=20&&h>=50&&h<=70,score:(t,h,w,r)=>Math.min(100,(70-h)*2+20),tip:'Sulfur or Myclobutanil spray.',tipUrdu:'گندھک یا مائیکلوبٹانیل اسپرے کریں۔'} ],
  peach:       [ { disease: 'Brown Rot',    urdu: 'بھوری سڑن',   severity:'critical',check:(t,h,w,r)=>t>=20&&h>=80&&r>0,score:(t,h,w,r)=>Math.min(100,(h-80)*4+r*3+10),tip:'Iprodione or Myclobutanil spray at flowering.',tipUrdu:'پھول آنے پر ایپروڈیون اسپرے کریں۔'}, {disease:'Leaf Curl',urdu:'پتہ مڑنا',severity:'high',check:(t,h,w,r)=>t>=10&&t<=20&&h>=70&&r>0,score:(t,h,w,r)=>Math.min(100,(h-70)*3+r*2+15),tip:'Apply copper fungicide at bud swell.',tipUrdu:'کلی پھولنے پر تانبے کی دوائی لگائیں۔'} ],
  watermelon:  [ { disease: 'Fusarium Wilt',urdu:'جڑ سڑن',       severity:'critical',check:(t,h,w,r)=>t>=25&&t<=32,score:(t,h,w,r)=>Math.min(100,(t-25)*5+20),tip:'Resistant varieties. Soil treatment with Trichoderma.',tipUrdu:'مزاحم قسم اور ٹرائیکوڈرما مٹی علاج۔'}, {disease:'Downy Mildew',urdu:'نیچے کی پھپھوندی',severity:'high',check:(t,h,w,r)=>t>=20&&h>=80,score:(t,h,w,r)=>Math.min(100,(h-80)*4+15),tip:'Metalaxyl+Mancozeb spray.',tipUrdu:'میٹالاکسل اسپرے کریں۔'} ],
  strawberry:  [ { disease: 'Gray Mold',    urdu: 'بھوری پھپھوندی',severity:'critical',check:(t,h,w,r)=>t>=15&&t<=22&&h>=80,score:(t,h,w,r)=>Math.min(100,(h-80)*5+r*3+10),tip:'Iprodione spray. Remove infected fruit.',tipUrdu:'ایپروڈیون اسپرے اور متاثرہ پھل ہٹائیں۔'}, {disease:'Powdery Mildew',urdu:'سفید پھپھوندی',severity:'high',check:(t,h,w,r)=>t>=20&&h>=55&&h<=70,score:(t,h,w,r)=>Math.min(100,(70-h)*2+20),tip:'Myclobutanil spray.',tipUrdu:'مائیکلوبٹانیل اسپرے کریں۔'} ],
  lentil:      [ { disease: 'Ascochyta Blight',urdu:'اسکوکائٹا',severity:'high',check:(t,h,w,r)=>t>=15&&t<=25&&h>=75&&r>0,score:(t,h,w,r)=>Math.min(100,(h-75)*4+r*2+10),tip:'Mancozeb spray.',tipUrdu:'مینکوزیب اسپرے کریں۔'}, {disease:'Rust',urdu:'زنگ',severity:'moderate',check:(t,h,w,r)=>t>=15&&h>=65,score:(t,h,w,r)=>Math.min(100,(h-65)*2+20),tip:'Propiconazole spray.',tipUrdu:'پروپیکونازول اسپرے کریں۔'} ],
  mungbean:    [ { disease: 'Yellow Mosaic', urdu:'پیلا موزیک',  severity:'critical',check:(t,h,w,r)=>t>=28&&h<55,score:(t,h,w,r)=>Math.min(100,(t-28)*5+(55-h)*2),tip:'Control whitefly immediately.',tipUrdu:'سفید مکھی فوری کنٹرول کریں۔'}, {disease:'Cercospora Leaf Spot',urdu:'سرکوسپورا',severity:'moderate',check:(t,h,w,r)=>t>=25&&h>=70,score:(t,h,w,r)=>Math.min(100,(h-70)*2+20),tip:'Mancozeb spray.',tipUrdu:'مینکوزیب اسپرے کریں۔'} ],
  blackgram:   [ { disease: 'Yellow Mosaic', urdu:'پیلا موزیک',  severity:'critical',check:(t,h,w,r)=>t>=28&&h<55,score:(t,h,w,r)=>Math.min(100,(t-28)*5+(55-h)*2),tip:'Control whitefly vectors.',tipUrdu:'سفید مکھی کنٹرول کریں۔'}, {disease:'Anthracnose',urdu:'انتھراکنوز',severity:'high',check:(t,h,w,r)=>t>=25&&h>=70&&r>0,score:(t,h,w,r)=>Math.min(100,(h-70)*3+r*2+10),tip:'Carbendazim spray.',tipUrdu:'کاربینڈازم اسپرے کریں۔'} ],
  cowpea:      [ { disease: 'Cowpea Mosaic', urdu:'موزیک وائرس', severity:'high',check:(t,h,w,r)=>t>=25&&h<60,score:(t,h,w,r)=>Math.min(100,(t-25)*4+25),tip:'Control aphids and thrips.',tipUrdu:'ایفیڈ اور تھرپس کنٹرول کریں۔'}, {disease:'Root Rot',urdu:'جڑ سڑن',severity:'moderate',check:(t,h,w,r)=>t>=25&&h>=80&&r>5,score:(t,h,w,r)=>Math.min(100,(h-80)*3+r*2+10),tip:'Seed treatment with Carbendazim.',tipUrdu:'کاربینڈازم سے بیج علاج کریں۔'} ],
  soybean:     [ { disease: 'Soybean Rust',  urdu:'سویا زنگ',    severity:'critical',check:(t,h,w,r)=>t>=18&&t<=28&&h>=75,score:(t,h,w,r)=>Math.min(100,(h-75)*4+(28-Math.abs(t-23))*4),tip:'Triazole fungicide spray.',tipUrdu:'ٹرائیازول اسپرے کریں۔'}, {disease:'Sudden Death Syndrome',urdu:'اچانک موت',severity:'high',check:(t,h,w,r)=>t>=15&&t<=25&&h>=80&&r>0,score:(t,h,w,r)=>Math.min(100,(h-80)*4+r*2+15),tip:'Seed treatment. Avoid early planting in wet soils.',tipUrdu:'بیج علاج ضروری ہے۔'} ],
  tobacco:     [ { disease: 'Tobacco Mosaic',urdu:'تمباکو موزیک',severity:'critical',check:(t,h,w,r)=>t>=20&&h<60,score:(t,h,w,r)=>Math.min(100,(t-20)*4+(60-h)*2+20),tip:'Wash hands, tools. Remove infected plants.',tipUrdu:'ہاتھ اور اوزار دھوئیں۔ متاثرہ پودے ہٹائیں۔'}, {disease:'Black Shank',urdu:'کالی ٹانگ',severity:'high',check:(t,h,w,r)=>t>=20&&h>=75&&r>5,score:(t,h,w,r)=>Math.min(100,(h-75)*3+r*2+15),tip:'Metalaxyl soil treatment.',tipUrdu:'میٹالاکسل مٹی علاج کریں۔'} ],
  canola:      [ { disease: 'Sclerotinia Rot',urdu:'اسکلیروٹینیا',severity:'critical',check:(t,h,w,r)=>t>=15&&t<=22&&h>=75,score:(t,h,w,r)=>Math.min(100,(h-75)*4+r*2+15),tip:'Iprodione spray at early flowering.',tipUrdu:'پھول آنے پر ایپروڈیون اسپرے کریں۔'}, {disease:'Alternaria Blight',urdu:'الٹرنیریا',severity:'high',check:(t,h,w,r)=>t>=20&&h>=70,score:(t,h,w,r)=>Math.min(100,(h-70)*3+20),tip:'Mancozeb spray.',tipUrdu:'مینکوزیب اسپرے کریں۔'} ],
  garlic:      [ { disease: 'White Rot',     urdu:'سفید سڑن',    severity:'critical',check:(t,h,w,r)=>t>=10&&t<=20&&h>=80,score:(t,h,w,r)=>Math.min(100,(h-80)*5+15),tip:'Iprodione soil drench. Long crop rotation.',tipUrdu:'ایپروڈیون سے مٹی علاج کریں۔'}, {disease:'Purple Blotch',urdu:'جامنی دھبہ',severity:'high',check:(t,h,w,r)=>t>=20&&h>=70,score:(t,h,w,r)=>Math.min(100,(h-70)*3+20),tip:'Mancozeb or Iprodione spray.',tipUrdu:'مینکوزیب اسپرے کریں۔'} ],
  berseem:     [ { disease: 'Stem Rot',       urdu:'تنے کی سڑن',  severity:'moderate',check:(t,h,w,r)=>t>=10&&t<=20&&h>=80&&r>5,score:(t,h,w,r)=>Math.min(100,(h-80)*3+r*2+15),tip:'Reduce irrigation. Apply Carbendazim.',tipUrdu:'پانی کم کریں۔ کاربینڈازم اسپرے کریں۔'}, {disease:'Powdery Mildew',urdu:'سفید بیماری',severity:'low',check:(t,h,w,r)=>t>=15&&h>=55&&h<=70,score:(t,h,w,r)=>Math.min(100,20),tip:'Sulfur spray.',tipUrdu:'گندھک اسپرے کریں۔'} ],
  lucerne:     [ { disease: 'Leaf Spot',      urdu:'پتہ دھبہ',    severity:'moderate',check:(t,h,w,r)=>t>=20&&h>=70&&r>0,score:(t,h,w,r)=>Math.min(100,(h-70)*2+r*2+15),tip:'Mancozeb spray.',tipUrdu:'مینکوزیب اسپرے کریں۔'}, {disease:'Fusarium Root Rot',urdu:'جڑ سڑن',severity:'high',check:(t,h,w,r)=>t>=25&&h>=75,score:(t,h,w,r)=>Math.min(100,(h-75)*3+20),tip:'Carbendazim seed treatment.',tipUrdu:'بیج علاج کریں۔'} ],
  ginger:      [ { disease: 'Soft Rot',       urdu:'نرم سڑن',     severity:'critical',check:(t,h,w,r)=>t>=25&&h>=80&&r>5,score:(t,h,w,r)=>Math.min(100,(h-80)*5+r*3+10),tip:'Metalaxyl + Mancozeb drenching. Improve drainage.',tipUrdu:'پانی نکاس بہتر کریں۔ میٹالاکسل اسپرے کریں۔'}, {disease:'Leaf Spot',urdu:'پتہ دھبہ',severity:'moderate',check:(t,h,w,r)=>t>=25&&h>=70,score:(t,h,w,r)=>Math.min(100,(h-70)*2+20),tip:'Mancozeb spray.',tipUrdu:'مینکوزیب اسپرے کریں۔'} ],
  turmeric:    [ { disease: 'Rhizome Rot',    urdu:'ریزوم سڑن',   severity:'critical',check:(t,h,w,r)=>t>=25&&h>=80&&r>5,score:(t,h,w,r)=>Math.min(100,(h-80)*5+r*3+10),tip:'Metalaxyl + Mancozeb. Ensure good drainage.',tipUrdu:'میٹالاکسل اسپرے کریں اور پانی نکاس بہتر کریں۔'}, {disease:'Leaf Blight',urdu:'پتہ جھلساؤ',severity:'moderate',check:(t,h,w,r)=>t>=25&&h>=70,score:(t,h,w,r)=>Math.min(100,(h-70)*2+20),tip:'Mancozeb spray.',tipUrdu:'مینکوزیب اسپرے کریں۔'} ],
};

// ── Risk config ───────────────────────────────────────────────────────────────
const RISK_CFG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'CRITICAL', emoji: '🚨' },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'HIGH',     emoji: '⚠️' },
  moderate: { color: '#eab308', bg: 'rgba(234,179,8,0.12)',  label: 'MODERATE', emoji: '🟡' },
  low:      { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'LOW',      emoji: '🔵' },
  none:     { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', label: 'SAFE',     emoji: '✅' },
};

// ── Calculate risk for a specific crop ───────────────────────────────────────
function calcCropRisk(cropId, temp, humidity, wind, rain) {
  const model = CROP_DISEASE_MODELS[cropId];
  if (!model) return [{ disease: 'No data', urdu: '', severity: 'none', score: 0, tip: 'No disease model for this crop yet.', tipUrdu: '' }];

  const results = model
    .filter(d => d.check(temp, humidity, wind, rain))
    .map(d => ({ ...d, score: Math.round(d.score(temp, humidity, wind, rain)) }))
    .sort((a, b) => b.score - a.score);

  if (results.length === 0) {
    return [{ disease: 'No Risk Detected', urdu: 'کوئی خطرہ نہیں', severity: 'none', score: 5, tip: 'Current weather conditions are not favourable for major diseases. Keep regular monitoring.', tipUrdu: 'موسم ٹھیک ہے۔ باقاعدہ نگرانی جاری رکھیں۔' }];
  }
  return results;
}

// ── Weather generator ─────────────────────────────────────────────────────────
function genForecast(cityBase, cropId) {
  const DAYS = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5'];
  const ICONS = ['☀️', '⛅', '🌦️', '☀️', '⛅'];
  return DAYS.map((day, i) => {
    const temp     = cityBase + (Math.random() - 0.5) * 8;
    const humidity = 45 + Math.random() * 42;
    const wind     = 5 + Math.random() * 22;
    const rain     = Math.random() > 0.6 ? Math.random() * 18 : 0;
    const risks    = calcCropRisk(cropId, temp, humidity, wind, rain);
    const topRisk  = risks[0];
    const topLevel = topRisk.severity || 'none';
    return { day, icon: ICONS[i], temp: Math.round(temp), humidity: Math.round(humidity), wind: Math.round(wind), rain: Math.round(rain * 10) / 10, risks, topRisk, topLevel };
  });
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function Pill({ Icon, value, label, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
      <Icon size={15} style={{ color, margin: '0 auto 3px' }} />
      <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0 }}>{value}</p>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: 0 }}>{label}</p>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function WeatherForecast() {
  const [step, setStep]           = useState('pick_crop'); // 'pick_crop' | 'forecast'
  const [cropId, setCropId]       = useState(null);
  const [city, setCity]           = useState(CITIES[0]);
  const [forecast, setForecast]   = useState([]);
  const [dayIdx, setDayIdx]       = useState(0);
  const [loading, setLoading]     = useState(false);
  const [showCityDrop, setShowCityDrop] = useState(false);
  const [search, setSearch]       = useState('');

  const crop = ALL_CROPS.find(c => c.id === cropId);

  const loadForecast = (cid, cityObj) => {
    setLoading(true);
    setTimeout(() => {
      setForecast(genForecast(cityObj.base, cid));
      setLoading(false);
    }, 600);
  };

  const handleCropSelect = (id) => {
    setCropId(id);
    setStep('forecast');
    loadForecast(id, city);
  };

  const handleCityChange = (c) => {
    setCity(c);
    setShowCityDrop(false);
    if (cropId) loadForecast(cropId, c);
  };

  const day = forecast[dayIdx];
  const rc  = day ? (RISK_CFG[day.topLevel] || RISK_CFG.none) : RISK_CFG.none;

  // ── Search filter ─────────────────────────────────────────────────────
  const filteredCategories = CROP_CATEGORIES.map(cat => ({
    ...cat,
    crops: cat.crops.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.urdu.includes(search)
    ),
  })).filter(cat => cat.crops.length > 0);

  // ─────────────────────────────────────────────────────────────────────
  // STEP 1: Crop picker
  // ─────────────────────────────────────────────────────────────────────
  if (step === 'pick_crop') {
    return (
      <div style={{ paddingBottom: 8 }}>
        <div className="mb-5">
          <h1 style={{ color: 'white', fontWeight: 900, fontSize: 22, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}>
            Disease Forecast 🌦️
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>
            Select your crop to see the 5-day weather risk forecast
          </p>
          <p style={{ color: 'rgba(74,222,128,0.6)', fontSize: 12, marginTop: 2, fontFamily: "'Noto Nastaliq Urdu', serif", textAlign: 'right' }}>
            اپنی فصل منتخب کریں
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search crop... فصل تلاش کریں"
            className="w-full pl-4 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', caretColor: '#4ade80' }}
          />
        </div>

        {/* Crop categories */}
        {filteredCategories.map(cat => (
          <div key={cat.label} className="mb-5">
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 10, letterSpacing: '0.1em' }}>
              {cat.icon} {cat.label.toUpperCase()}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {cat.crops.map(c => (
                <motion.button key={c.id} whileTap={{ scale: 0.94 }}
                  onClick={() => handleCropSelect(c.id)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14, padding: '12px 8px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    cursor: 'pointer',
                  }}>
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
  }

  // ─────────────────────────────────────────────────────────────────────
  // STEP 2: Forecast for selected crop
  // ─────────────────────────────────────────────────────────────────────
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
          <div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 22 }}>{crop?.emoji}</span>
              <h1 style={{ color: 'white', fontWeight: 900, fontSize: 20, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em', margin: 0 }}>
                {crop?.name}
              </h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>
              5-day disease risk · {crop?.urdu}
            </p>
          </div>
        </div>

        {/* City selector */}
        <div className="relative">
          <button onClick={() => setShowCityDrop(!showCityDrop)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
            <MapPin size={12} style={{ color: '#4ade80' }} />
            <span style={{ fontWeight: 600, fontSize: 12 }}>{city.name}</span>
            <ChevronDown size={12} />
          </button>
          <AnimatePresence>
            {showCityDrop && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute right-0 top-full mt-1 z-30 py-1"
                style={{ background: '#111a12', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, minWidth: 140, maxHeight: 240, overflowY: 'auto' }}>
                {CITIES.map(c => (
                  <button key={c.name} onClick={() => handleCityChange(c)}
                    className="w-full text-left px-3 py-2 text-sm"
                    style={{ color: c.name === city.name ? '#4ade80' : 'rgba(255,255,255,0.7)' }}>
                    {c.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, height: 80 }} />
          ))}
        </div>
      ) : (
        <>
          {/* 5-day strip */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
            {forecast.map((d, i) => {
              const rc2 = RISK_CFG[d.topLevel] || RISK_CFG.none;
              return (
                <motion.button key={i} whileTap={{ scale: 0.95 }}
                  onClick={() => setDayIdx(i)}
                  className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl"
                  style={{
                    background: dayIdx === i ? rc2.bg : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${dayIdx === i ? rc2.color + '55' : 'rgba(255,255,255,0.08)'}`,
                    minWidth: 72, transition: 'all 0.2s',
                  }}>
                  <p style={{ color: dayIdx === i ? rc2.color : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>{d.day}</p>
                  <span style={{ fontSize: 20 }}>{d.icon}</span>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>{d.temp}°</p>
                  <span style={{ fontSize: 12 }}>{rc2.emoji}</span>
                </motion.button>
              );
            })}
          </div>

          {day && (
            <AnimatePresence mode="wait">
              <motion.div key={dayIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                {/* Overall risk banner */}
                <div style={{ background: rc.bg, border: `1px solid ${rc.color}35`, borderRadius: 20, padding: '18px', marginBottom: 16 }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p style={{ color: rc.color, fontWeight: 900, fontSize: 20, fontFamily: "'Syne', sans-serif", margin: 0 }}>
                        {rc.emoji} {rc.label} RISK
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '4px 0 0' }}>
                        {crop?.name} · {city.name} · {day.day}
                      </p>
                    </div>
                    {/* Score ring */}
                    <div style={{ width: 58, height: 58, borderRadius: '50%', background: `conic-gradient(${rc.color} ${day.topRisk.score * 3.6}deg, rgba(255,255,255,0.05) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0d1a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: rc.color, fontWeight: 900, fontSize: 13 }}>{day.topRisk.score}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <Pill Icon={Thermometer} value={`${day.temp}°C`} label="Temp"     color="#f97316" />
                    <Pill Icon={Droplets}    value={`${day.humidity}%`} label="Humid" color="#60a5fa" />
                    <Pill Icon={Wind}        value={`${day.wind}km/h`} label="Wind"   color="#94a3b8" />
                    <Pill Icon={Cloud}       value={`${day.rain}mm`}   label="Rain"   color="#818cf8" />
                  </div>
                </div>

                {/* Disease breakdown */}
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", marginBottom: 10, letterSpacing: '0.1em' }}>
                  DISEASE BREAKDOWN FOR {crop?.name?.toUpperCase()}
                </p>

                <div className="space-y-3">
                  {day.risks.map((risk, i) => {
                    const rc3 = RISK_CFG[risk.severity] || RISK_CFG.none;
                    return (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${rc3.color}25`,
                          borderLeft: `3px solid ${rc3.color}`,
                          borderRadius: 14, padding: '14px 16px',
                        }}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>{risk.disease}</p>
                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '2px 0 0', fontFamily: "'Noto Nastaliq Urdu', serif" }}>{risk.urdu}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: rc3.color, fontWeight: 800, fontSize: 18 }}>{risk.score}%</span>
                            <span style={{ background: rc3.bg, color: rc3.color, border: `1px solid ${rc3.color}30`, borderRadius: 8, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                              {rc3.emoji} {rc3.label}
                            </span>
                          </div>
                        </div>
                        {/* Risk bar */}
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 5, marginBottom: 10 }}>
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${risk.score}%` }}
                            transition={{ delay: i * 0.1 + 0.3, duration: 0.7, ease: 'easeOut' }}
                            style={{ background: rc3.color, height: '100%', borderRadius: 4 }}
                          />
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.55, margin: 0 }}>{risk.tip}</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 6, textAlign: 'right', fontFamily: "'Noto Nastaliq Urdu', serif" }}>{risk.tipUrdu}</p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Prevention footer */}
                <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(74,222,128,0.12)', borderRadius: 14, padding: '14px', marginTop: 16 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={14} style={{ color: '#4ade80' }} />
                    <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 13, margin: 0 }}>Preventive Action Plan</p>
                  </div>
                  <ul style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.9, paddingLeft: 16, margin: 0 }}>
                    <li>Scout {crop?.name} fields every 3 days during risk periods</li>
                    <li>Pre-mix recommended fungicides and keep sprayer ready</li>
                    <li>Ensure proper drainage to avoid waterlogging after rain</li>
                    <li>Contact your agri extension officer if symptoms appear</li>
                  </ul>
                </div>

                {/* Change crop shortcut */}
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { setStep('pick_crop'); setSearch(''); }}
                  className="w-full mt-4 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  🌱 Change Crop · فصل تبدیل کریں
                </motion.button>
              </motion.div>
            </AnimatePresence>
          )}
        </>
      )}
    </div>
  );
}