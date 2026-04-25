// ═══════════════════════════════════════════════════════════════════════
//  data.js — все константы, темы, базовые helpers
//  Загружается ПЕРВЫМ.
// ═══════════════════════════════════════════════════════════════════════

// ── Save / Game tuning ──────────────────────────────────────────────────
const SAVE_KEY        = 'pechenko_v6';
const SAVE_KEY_OLD    = 'pechenko_v5';
const PRESTIGE_THRESHOLD = 1_000_000;
const PRESTIGE_ADD    = 0.5;
const BRICK_UNLOCK_AT = 50_000;
const CRIT_CHANCE     = 0.05;
const CRIT_MUL        = 7;
const COMBO_WINDOW_MS = 550;
const COMBO_DECAY_MS  = 1500;
const COMBO_PER_CLICK = 0.05;
const COMBO_MAX       = 3.0;
const CHEST_COOLDOWN  = 30 * 60 * 1000;       // 30 min
const SPIN_COOLDOWN   = 24 * 60 * 60 * 1000;  // 24 h
const RAIN_MIN        = 90 * 60 * 1000;
const RAIN_MAX        = 180 * 60 * 1000;
const PET_MAX         = 10;
const CRUMB_MAX       = 180;
const CANVAS_DPR      = Math.min(devicePixelRatio || 1, 2);

// ── THEMES ──────────────────────────────────────────────────────────────
const THEMES = {
  classic:   { name:'Классика',  icon:'🍪', autoMonths:null,        emojis:['🍪','🍫','🥛','⭐','✨','🍬','🥐','🧁','🍩','🌟','🍯','🥨','🎂','🍰'] },
  halloween: { name:'Хеллоуин',  icon:'🎃', autoMonths:[9],         emojis:['🎃','👻','🦇','🕷️','🧙','🍬','🦴','🕸️','🧛','🧟','🍪','✨','🌙','🍫'] },
  newyear:   { name:'Новый год', icon:'🎄', autoMonths:[11,0,1],    emojis:['🎄','❄️','☃️','🎁','🍪','🌟','✨','⛄','🦌','🛷','🎅','🍰','🔔','🥂'] },
  spring:    { name:'Весна',     icon:'🌸', autoMonths:[2,3,4],     emojis:['🌸','🌷','🌼','🌻','🌿','🐝','🦋','🍪','🥐','🧁','🌱','🌺','🌹','🍯'] },
  summer:    { name:'Лето',      icon:'☀️', autoMonths:[5,6,7],     emojis:['☀️','🌊','🍦','🏖️','🌴','🌺','🦩','🍪','🍉','🥥','🐚','✨','🍓','🍋'] },
};
function getAutoTheme(){
  const m = new Date().getMonth();
  for (const k in THEMES) { if (THEMES[k].autoMonths && THEMES[k].autoMonths.includes(m)) return k; }
  return 'classic';
}
function effectiveTheme(){ return (typeof G!=='undefined' && G.theme && G.theme!=='auto') ? G.theme : getAutoTheme(); }
let currentBgEmojis = THEMES.classic.emojis.slice();
let _appliedThemeName = '';
function applyTheme(){
  const t = effectiveTheme();
  if (t === _appliedThemeName) return;
  _appliedThemeName = t;
  document.body.classList.remove('t-classic','t-halloween','t-newyear','t-spring','t-summer');
  document.body.classList.add('t-' + t);
  currentBgEmojis = THEMES[t].emojis.slice();
}

// ── SKINS ───────────────────────────────────────────────────────────────
const SKINS = [
  { id:'classic',     name:'Классика',  cost:0, icon:'🍪' },
  { id:'golden',      name:'Золотая',   cost:1, icon:'⭐' },
  { id:'gingerbread', name:'Имбирная',  cost:2, icon:'🫚' },
  { id:'pumpkin',     name:'Тыквенная', cost:2, icon:'🎃' },
  { id:'snow',        name:'Снежная',   cost:2, icon:'❄️' },
  { id:'diamond',     name:'Алмазная',  cost:5, icon:'💎' },
  { id:'rainbow',     name:'Радужная',  cost:8, icon:'🌈' },
];

// ── COOKIE EVOLUTION ────────────────────────────────────────────────────
const STAGE_THRESHOLDS = [0, 1e6, 5e6, 25e6, 100e6, 1e9];
const STAGE_LABELS     = ['', '★ I','★ II','★ III','★ IV','★ V'];

// ── UPGRADES (clicks) ───────────────────────────────────────────────────
const UPGRADES = [
  { id:'u1', name:'Крепкий палец',   icon:'💪',     desc:'+1 печенька за клик',   cost:10,      costMul:2.5, maxLvl:10, add:1 },
  { id:'u2', name:'Двойной удар',    icon:'✌️',     desc:'+3 печеньки за клик',   cost:80,      costMul:2.8, maxLvl:8,  add:3 },
  { id:'u3', name:'Щедрая рука',     icon:'🖐️',     desc:'+8 печенек за клик',    cost:500,     costMul:3.0, maxLvl:6,  add:8 },
  { id:'u4', name:'Мастер-пекарь',   icon:'👨‍🍳',     desc:'+20 печенек за клик',   cost:3000,    costMul:3.2, maxLvl:5,  add:20 },
  { id:'u5', name:'Золотые руки',    icon:'✨',      desc:'+50 печенек за клик',   cost:15000,   costMul:3.5, maxLvl:4,  add:50 },
  { id:'u6', name:'Алмазные пальцы', icon:'💎',     desc:'+100 печенек за клик',  cost:80000,   costMul:3.8, maxLvl:5,  add:100 },
  { id:'u7', name:'Космо-кулак',     icon:'🚀',     desc:'+250 печенек за клик',  cost:400000,  costMul:4.0, maxLvl:5,  add:250 },
  { id:'u8', name:'Печенье-бог',     icon:'👑',     desc:'+800 печенек за клик',  cost:2500000, costMul:4.2, maxLvl:5,  add:800 },
];

// ── SHOP (passive) ──────────────────────────────────────────────────────
const SHOP = [
  { id:'s1', name:'Малая печь',         icon:'🔥',  desc:'+0.5 печ/сек',     cost:50,      costMul:1.15, cps:.5 },
  { id:'s2', name:'Бабушка',            icon:'👵',  desc:'+2 печ/сек',       cost:250,     costMul:1.15, cps:2 },
  { id:'s3', name:'Пекарня',            icon:'🥖',  desc:'+8 печ/сек',       cost:1200,    costMul:1.15, cps:8 },
  { id:'s4', name:'Фабрика',            icon:'🏭',  desc:'+30 печ/сек',      cost:6000,    costMul:1.15, cps:30 },
  { id:'s5', name:'Волшебный котёл',    icon:'🪄',  desc:'+100 печ/сек',     cost:30000,   costMul:1.15, cps:100 },
  { id:'s6', name:'Печеньковый бог',    icon:'😇',  desc:'+500 печ/сек',     cost:150000,  costMul:1.15, cps:500 },
  { id:'s7', name:'Космо-пекарня',      icon:'🌌',  desc:'+2 000 печ/сек',   cost:800000,  costMul:1.16, cps:2000 },
  { id:'s8', name:'Вселенская печь',    icon:'🌠',  desc:'+10 000 печ/сек',  cost:5000000, costMul:1.17, cps:10000 },
];

// ── BRICKS ──────────────────────────────────────────────────────────────
const BRICK_UPGRADES = [
  { id:'b1', name:'Кирпичный микшер',   icon:'🧱',   desc:'+5 печ/сек пассивно',    costBrick:50,    costMulB:2.2, maxLvl:20, cpsBonus:5 },
  { id:'b2', name:'Кирпичная печь',     icon:'🏗️',  desc:'+20 печ/сек пассивно',   costBrick:200,   costMulB:2.3, maxLvl:15, cpsBonus:20 },
  { id:'b3', name:'Кирпичный завод',    icon:'🏭',   desc:'+80 печ/сек пассивно',   costBrick:800,   costMulB:2.4, maxLvl:10, cpsBonus:80 },
  { id:'b4', name:'Кирпичный дворец',   icon:'🏰',   desc:'+300 печ/сек пассивно',  costBrick:3000,  costMulB:2.5, maxLvl:8,  cpsBonus:300 },
  { id:'b5', name:'Кирпичная империя',  icon:'🌆',   desc:'+1000 печ/сек пассивно', costBrick:10000, costMulB:2.6, maxLvl:5,  cpsBonus:1000 },
];
const BRICK_PRODUCTION = [
  { id:'bp1', name:'Кирпичник',  icon:'👷',    desc:'+1 кирпич/сек',     cost:5000,   costMul:3.0, maxLvl:10, bps:1 },
  { id:'bp2', name:'Прораб',     icon:'👨‍💼',    desc:'+3 кирпича/сек',    cost:25000,  costMul:3.2, maxLvl:8,  bps:3 },
  { id:'bp3', name:'Архитектор', icon:'🏗️',  desc:'+10 кирпичей/сек',   cost:100000, costMul:3.5, maxLvl:5,  bps:10 },
];

// ── ACHIEVEMENTS ────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  {id:'a1',  icon:'🍪', name:'Первая печенька',   req:'Нажмите 1 раз',                check:g=>g.totalClicks>=1},
  {id:'a2',  icon:'🖱️', name:'100 кликов',        req:'Нажмите 100 раз',              check:g=>g.totalClicks>=100},
  {id:'a3',  icon:'🔥', name:'1 000 кликов',      req:'Нажмите 1 000 раз',            check:g=>g.totalClicks>=1000},
  {id:'a4',  icon:'🎯', name:'10 000 кликов',     req:'Нажмите 10 000 раз',           check:g=>g.totalClicks>=10000},
  {id:'a5',  icon:'🍫', name:'Шоколадная гора',   req:'100 печенек (всего)',          check:g=>g.totalCookies>=100},
  {id:'a6',  icon:'🥇', name:'Тысячник',          req:'1 000 печенек (всего)',        check:g=>g.totalCookies>=1000},
  {id:'a7',  icon:'💰', name:'Богатый пекарь',    req:'100 000 печенек (всего)',      check:g=>g.totalCookies>=100000},
  {id:'a8',  icon:'💎', name:'Миллионер',         req:'1 000 000 печенек (всего)',    check:g=>g.totalCookies>=1000000},
  {id:'a9',  icon:'⚡', name:'Улучшатель',        req:'Купите 3 улучшения',           check:g=>Object.values(g.upgrades).reduce((s,v)=>s+v,0)>=3},
  {id:'a10', icon:'🪄', name:'Первый помощник',   req:'Купите 1 авто-пекаря',         check:g=>Object.values(g.shop).reduce((s,v)=>s+v,0)>=1},
  {id:'a11', icon:'🏭', name:'Мини-империя',      req:'10 авто-пекарей',              check:g=>Object.values(g.shop).reduce((s,v)=>s+v,0)>=10},
  {id:'a12', icon:'🧱', name:'Первый кирпич',     req:'Откройте кирпичи',             check:g=>g.bricksUnlocked},
  {id:'a13', icon:'🏗️', name:'Строитель',        req:'1 000 кирпичей всего',         check:g=>g.totalBricks>=1000},
  {id:'a14', icon:'🌟', name:'Перерождённый',     req:'Переродитесь 1 раз',           check:g=>g.prestigeCount>=1},
  {id:'a15', icon:'🌟', name:'Ветеран пекарни',   req:'Переродитесь 5 раз',           check:g=>g.prestigeCount>=5},
  {id:'a16', icon:'👑', name:'Легенда печений',   req:'Переродитесь 10 раз',          check:g=>g.prestigeCount>=10},
  {id:'a17', icon:'🔥', name:'Огонь!',            req:'Достигнуть комбо ×2',          check:g=>g.maxCombo>=2.0},
  {id:'a18', icon:'💥', name:'Безумец',           req:'Достигнуть комбо ×3',          check:g=>g.maxCombo>=2.99},
  {id:'a19', icon:'⭐', name:'Золотой тапер',     req:'Поймать 10 золотых',           check:g=>g.goldenCaught>=10},
  {id:'a20', icon:'🎰', name:'Везунчик',          req:'10 крит-ударов',               check:g=>g.crits>=10},
  {id:'a21', icon:'👹', name:'Победитель боссов', req:'Победить 1 босса',             check:g=>g.bossesDefeated>=1},
  {id:'a22', icon:'🏆', name:'Охотник',           req:'Победить 5 боссов',            check:g=>g.bossesDefeated>=5},
  {id:'a23', icon:'🎁', name:'Сундукоман',        req:'Открыть 10 сундуков',          check:g=>g.chestsOpened>=10},
  {id:'a24', icon:'🎰', name:'Колесо удачи',      req:'Крутить спин 5 раз',           check:g=>g.spinsCompleted>=5},
  {id:'a25', icon:'🌧️', name:'Ловец дождя',      req:'Собрать 30 печенек с дождя',   check:g=>g.rainCookiesCollected>=30},
  {id:'a26', icon:'📅', name:'Стабильность',      req:'Серия 7 дней подряд',          check:g=>g.bestStreak>=7},
  {id:'a27', icon:'🐱', name:'Зверолюб',          req:'Прокачать питомца до 5',       check:g=>g.petLevel>=5},
  {id:'a28', icon:'🎨', name:'Стилист',           req:'Купить 3 скина',               check:g=>(g.skinsOwned||[]).length>=4},
  {id:'a29', icon:'📋', name:'Целеустремлённый',  req:'Выполнить 10 заданий',         check:g=>g.missionsClaimed>=10},
  {id:'a30', icon:'🏅', name:'Мастер',            req:'Получить 5 знаков мастерства (25 ачивок)', check:g=>{const c=ACHIEVEMENTS.filter(a=>a.id!=='a30'&&a.check(g)).length;return Math.floor(c/5)>=5}},
];

// ── POWERUPS (buyable for bricks) ───────────────────────────────────────
const POWERUPS = [
  { id:'turbo',     name:'Турбо-клик',   icon:'⚡',  desc:'×10 клик на 30 сек',      cost:80,  type:'click', mul:10, duration:30000 },
  { id:'autofeast', name:'Печенькопад',  icon:'🌧️', desc:'×20 пассив на 30 сек',    cost:150, type:'cps',   mul:20, duration:30000 },
  { id:'feast',     name:'Большой пир',  icon:'🎉',  desc:'×5 ВСЁ на 60 сек',        cost:300, type:'all',   mul:5,  duration:60000 },
  { id:'critrush',  name:'Крит-шторм',   icon:'💥',  desc:'×3 клик на 90 сек',       cost:200, type:'click', mul:3,  duration:90000 },
];

// ── CHEST / SPIN rewards ────────────────────────────────────────────────
const CHEST_REWARDS = [
  { key:'cookies',     weight:3, roll:()=>({ type:'cookies_pct', val:1+Math.random()*2.5,  icon:'🍪', label:'' }) },
  { key:'cookies_big', weight:1, roll:()=>({ type:'cookies_pct', val:5,                    icon:'🍪', label:'+5% печенек' }) },
  { key:'click',       weight:2, roll:()=>({ type:'boost', boost:{id:'chestclick',name:'Сундук-клик', icon:'⚡', type:'click', mul:3, duration:60000}, icon:'⚡', label:'×3 клик на 60 сек' }) },
  { key:'cps',         weight:2, roll:()=>({ type:'boost', boost:{id:'chestcps',  name:'Сундук-пассив',icon:'🌊', type:'cps',   mul:5, duration:60000}, icon:'🌊', label:'×5 пассив на 60 сек' }) },
  { key:'bricks',      weight:2, roll:()=>({ type:'bricks', val:30+Math.random()*70|0, icon:'🧱', label:'' }) },
];
const SPIN_REWARDS = [
  { type:'cookies_pct', val:8,  icon:'🍪', label:'+8% печенек' },
  { type:'boost', boost:{id:'spinall',  name:'Спин-пир',   icon:'🎉', type:'all',   mul:3,  duration:300000}, icon:'🎉', label:'×3 ВСЁ на 5 мин' },
  { type:'bricks', val:200, icon:'🧱', label:'+200 кирпичей' },
  { type:'cookies_pct', val:15, icon:'💎', label:'+15% печенек' },
  { type:'boost', boost:{id:'spinclick',name:'Спин-турбо', icon:'⚡', type:'click', mul:10, duration:60000},  icon:'⚡', label:'×10 клик на 60 сек' },
  { type:'cookies_pct', val:3,  icon:'🍪', label:'+3% печенек' },
];

// ── DAILY MISSIONS ──────────────────────────────────────────────────────
const MISSION_TEMPLATES = [
  { id:'clicks',      label:'Сделай {t} кликов',    icon:'👆', baseTarget:300,    reward:{ type:'bricks', val:50 } },
  { id:'click_burst', label:'Натапай {t} кликов',   icon:'💥', baseTarget:1000,   reward:{ type:'boost', boost:{id:'mclick',name:'Миссия-клик',icon:'⚡',type:'click',mul:5,duration:120000} } },
  { id:'earn',        label:'Заработай {t} печенек',icon:'🍪', baseTarget:50000,  reward:{ type:'bricks', val:80 } },
  { id:'earn_big',    label:'Заработай {t} печенек',icon:'💰', baseTarget:200000, reward:{ type:'cookies_pct', val:5 } },
  { id:'crit',        label:'Сделай {t} крит-ударов',icon:'💢',baseTarget:5,      reward:{ type:'boost', boost:{id:'mcrit',name:'Крит-награда',icon:'💥',type:'click',mul:3,duration:180000} } },
  { id:'shop',        label:'Купи {t} автопекарей', icon:'🏪', baseTarget:3,      reward:{ type:'cookies_pct', val:3 } },
  { id:'upgrade',     label:'Купи {t} улучшений',   icon:'⚡', baseTarget:2,      reward:{ type:'bricks', val:40 } },
  { id:'chest',       label:'Открой {t} сундука',   icon:'🎁', baseTarget:1,      reward:{ type:'cookies_pct', val:4 } },
  { id:'golden',      label:'Поймай {t} золотых',   icon:'⭐', baseTarget:1,      reward:{ type:'boost', boost:{id:'mall',name:'Миссия-всё',icon:'🎉',type:'all',mul:3,duration:120000} } },
  { id:'combo',       label:'Достигни комбо ×{t}',  icon:'🔥', baseTarget:2,      reward:{ type:'bricks', val:60 } },
];

// ── DAILY STREAK rewards (apply functions нуждаются в G и addBoost — определены в main.js) ──
// Здесь только декларация формы; реальный массив создаётся в main.js где доступны зависимости.

// ── MUSIC PER THEME ─────────────────────────────────────────────────────
const MUSIC_PATTERNS = {
  classic:{
    scale:[261.63,293.66,329.63,349.23,392.00,440.00,493.88,523.25,587.33,659.25,698.46,783.99],
    melody:[0,2,4,7,4,2,0,4,5,4,2,4,7,5,4,2, 0,2,4,7,9,7,5,4,2,4,5,4,2,0,2,-1],
    bass:[0,-99,4,-99,5,-99,4,-99,0,-99,4,-99,5,-99,7,-99,0,-99,4,-99,7,-99,9,-99,5,-99,4,-99,2,-99,0,-99],
    bpm:110,wave:'triangle'
  },
  halloween:{
    scale:[220.00,233.08,261.63,293.66,311.13,349.23,415.30,440.00,466.16,523.25,587.33,622.25],
    melody:[0,2,4,5,4,2,0,-1,2,4,7,5,4,2,0,-1, 5,4,2,0,2,4,2,-1,0,-1,4,2,0,-1,-1,-1],
    bass:[0,-99,-99,-99,5,-99,-99,-99,0,-99,-99,-99,5,-99,-99,-99,3,-99,-99,-99,5,-99,-99,-99,0,-99,-99,-99,-99,-99,-99,-99],
    bpm:84,wave:'sawtooth'
  },
  newyear:{
    scale:[261.63,293.66,329.63,349.23,392.00,440.00,493.88,523.25,587.33,659.25,783.99,880.00],
    melody:[7,4,7,9,7,4,2,4,7,9,11,9,7,4,2,0, 4,7,11,9,7,9,7,4,7,9,7,4,2,0,2,-1],
    bass:[0,-99,4,-99,7,-99,4,-99,0,-99,5,-99,7,-99,4,-99,0,-99,4,-99,7,-99,9,-99,5,-99,4,-99,0,-99,-99,-99],
    bpm:120,wave:'sine'
  },
  spring:{
    scale:[261.63,293.66,329.63,349.23,392.00,440.00,493.88,523.25,587.33,659.25,698.46,783.99],
    melody:[0,4,7,4,2,4,5,2,0,4,7,9,5,4,2,4, 7,4,5,9,7,5,4,2,0,4,2,4,5,4,2,-1],
    bass:[0,-99,4,-99,5,-99,2,-99,0,-99,4,-99,5,-99,4,-99,0,-99,4,-99,7,-99,5,-99,2,-99,0,-99,-99,-99,-99,-99],
    bpm:104,wave:'triangle'
  },
  summer:{
    scale:[293.66,329.63,369.99,392.00,440.00,493.88,554.37,587.33,659.25,739.99,783.99,880.00],
    melody:[0,2,4,7,9,7,4,2,0,4,7,9,11,9,7,4, 7,11,9,7,9,11,9,7,4,7,9,4,7,9,2,-1],
    bass:[0,-99,5,-99,7,-99,4,-99,0,-99,5,-99,7,-99,9,-99,0,-99,5,-99,9,-99,7,-99,4,-99,5,-99,0,-99,-99,-99],
    bpm:124,wave:'square'
  },
};

// ── helpers формата ─────────────────────────────────────────────────────
function fmt(n){
  n = Math.floor(n);
  if (n >= 1e15) return (n/1e15).toFixed(1) + ' квадр';
  if (n >= 1e12) return (n/1e12).toFixed(1) + ' трлн';
  if (n >= 1e9)  return (n/1e9).toFixed(1)  + ' млрд';
  if (n >= 1e6)  return (n/1e6).toFixed(1)  + ' млн';
  if (n >= 1e3)  return (n/1e3).toFixed(1)  + ' к';
  return n.toString();
}
function fmtCooldown(ms){
  if (ms <= 0) return 'Готов!';
  const s = Math.ceil(ms/1000);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  if (h > 0) return h + 'ч ' + m + 'м';
  if (m > 0) return m + ':' + String(sec).padStart(2,'0');
  return sec + ' сек';
}
function pickWeighted(arr){
  const total = arr.reduce((s,x)=>s+x.weight, 0);
  let r = Math.random() * total;
  for (const x of arr) { if ((r -= x.weight) <= 0) return x; }
  return arr[0];
}
function todayStr(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
