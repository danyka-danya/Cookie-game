// ═══════════════════════════════════════════════════════════════════════
//  main.js — состояние, рендер, click, все системы, init
//  Зависит: data.js, canvas.js, audio.js (загружаются раньше)
// ═══════════════════════════════════════════════════════════════════════

// ── STATE ───────────────────────────────────────────────────────────────
let G = {
  cookies:0, totalCookies:0, totalClicks:0,
  clickPower:1, cps:0,
  sessionStart:Date.now(), totalTime:0,
  upgrades:{}, shop:{},
  bricks:0, totalBricks:0, bps:1, bricksUnlocked:false,
  brickUpgrades:{}, brickProduction:{},
  prestigeCount:0, prestigeMul:1.0, prestigePoints:0,
  maxCombo:1.0, goldenCaught:0, crits:0,
  bossesDefeated:0, bossesFled:0,
  chestsOpened:0, spinsCompleted:0,
  chestReadyAt:0, spinReadyAt:0,
  bossPendingThreshold:0, bossLastSpawnAt:0,
  theme:'auto',
  activeBoosts:[],
  cpsRecord:0,
  skinId:'classic', skinsOwned:['classic'],
  lastLoginDay:'', loginStreak:0, bestStreak:0, streakClaimedDay:'',
  missionDay:'', missions:[], missionsClaimed:0,
  petLevel:0,
  rainsCaught:0, rainCookiesCollected:0, nextRainAt:0,
};

// ── SAVE / LOAD ─────────────────────────────────────────────────────────
function save(){
  G.totalTime += Date.now() - G.sessionStart;
  G.sessionStart = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(G));
}
function load(){
  try{
    let r = localStorage.getItem(SAVE_KEY);
    if (!r) {
      const old = localStorage.getItem(SAVE_KEY_OLD);
      if (old) r = old;
    }
    if (r){
      const parsed = JSON.parse(r);
      Object.assign(G, parsed);
      G.sessionStart = Date.now();
      // Защита от старых сохранений без новых полей
      if (typeof G.maxCombo !== 'number') G.maxCombo = 1.0;
      if (typeof G.goldenCaught !== 'number') G.goldenCaught = 0;
      if (typeof G.crits !== 'number') G.crits = 0;
      if (typeof G.bossesDefeated !== 'number') G.bossesDefeated = 0;
      if (typeof G.bossesFled !== 'number') G.bossesFled = 0;
      if (typeof G.chestsOpened !== 'number') G.chestsOpened = 0;
      if (typeof G.spinsCompleted !== 'number') G.spinsCompleted = 0;
      if (typeof G.chestReadyAt !== 'number') G.chestReadyAt = 0;
      if (typeof G.spinReadyAt !== 'number') G.spinReadyAt = 0;
      if (typeof G.bossPendingThreshold !== 'number') G.bossPendingThreshold = 0;
      if (typeof G.bossLastSpawnAt !== 'number') G.bossLastSpawnAt = 0;
      if (!G.theme) G.theme = 'auto';
      if (!Array.isArray(G.activeBoosts)) G.activeBoosts = [];
      if (typeof G.cpsRecord !== 'number') G.cpsRecord = 0;
      if (!G.skinId) G.skinId = 'classic';
      if (!Array.isArray(G.skinsOwned) || !G.skinsOwned.length) G.skinsOwned = ['classic'];
      if (typeof G.prestigePoints !== 'number') G.prestigePoints = G.prestigeCount || 0;
      if (typeof G.lastLoginDay !== 'string') G.lastLoginDay = '';
      if (typeof G.loginStreak !== 'number') G.loginStreak = 0;
      if (typeof G.bestStreak !== 'number') G.bestStreak = 0;
      if (typeof G.streakClaimedDay !== 'string') G.streakClaimedDay = '';
      if (typeof G.missionDay !== 'string') G.missionDay = '';
      if (!Array.isArray(G.missions)) G.missions = [];
      if (typeof G.missionsClaimed !== 'number') G.missionsClaimed = 0;
      if (typeof G.petLevel !== 'number') G.petLevel = 0;
      if (typeof G.rainsCaught !== 'number') G.rainsCaught = 0;
      if (typeof G.rainCookiesCollected !== 'number') G.rainCookiesCollected = 0;
      if (typeof G.nextRainAt !== 'number') G.nextRainAt = 0;
      // Migrate goldenBoostUntil → activeBoosts
      if (typeof parsed.goldenBoostUntil === 'number' && parsed.goldenBoostUntil > Date.now()){
        G.activeBoosts.push({id:'golden', name:'Золотая печ.', icon:'🌟', type:'click', mul:7, untilTs: parsed.goldenBoostUntil});
      }
      delete G.goldenBoostUntil;
      const now = Date.now();
      G.activeBoosts = G.activeBoosts.filter(b => b.untilTs > now);
    }
  }catch(e){}
}

// ── COST / RECALC ───────────────────────────────────────────────────────
function upgradeCost(u){ return Math.floor(u.cost * Math.pow(u.costMul, G.upgrades[u.id]||0)); }
function shopCost(s){    return Math.floor(s.cost * Math.pow(s.costMul, G.shop[s.id]||0)); }
function bUpgCost(u){    return Math.floor(u.costBrick * Math.pow(u.costMulB, G.brickUpgrades[u.id]||0)); }
function bProdCost(u){   return Math.floor(u.cost * Math.pow(u.costMul, G.brickProduction[u.id]||0)); }

function getMasteryBonus(){
  const ach = ACHIEVEMENTS.filter(a => a.check(G)).length;
  return Math.floor(ach / 5) * 0.1;
}
function getPetCpsBonus(){
  return 1 + (G.petLevel||0) * 0.05;
}
function recalcClickPower(){
  let b = 1;
  UPGRADES.forEach(u => { b += (G.upgrades[u.id]||0) * u.add; });
  const totalMul = G.prestigeMul + getMasteryBonus();
  G.clickPower = Math.round(b * totalMul * 100) / 100;
}
function recalcCPS(){
  let c = 0;
  SHOP.forEach(s => { c += (G.shop[s.id]||0) * s.cps; });
  BRICK_UPGRADES.forEach(u => { c += (G.brickUpgrades[u.id]||0) * u.cpsBonus; });
  G.cps = c;
}
function recalcBPS(){
  let b = 1;
  BRICK_PRODUCTION.forEach(u => { b += (G.brickProduction[u.id]||0) * u.bps; });
  G.bps = b;
}

// ── PANEL ───────────────────────────────────────────────────────────────
let panelOpen = false;
const panelWrap = document.getElementById('panel-wrap');
const mainEl   = document.getElementById('main');
function openPanel(){  panelOpen = true;  panelWrap.classList.add('open');  mainEl.classList.add('panel-open'); }
function closePanel(){ panelOpen = false; panelWrap.classList.remove('open'); mainEl.classList.remove('panel-open'); }

document.getElementById('cookie-btn').addEventListener('touchstart', () => ensureAudio(), {passive:true});
document.getElementById('handle-arrow-wrap').addEventListener('click', () => {
  panelOpen ? closePanel() : openPanel();
  playTab();
});

// ── TABS ────────────────────────────────────────────────────────────────
let activeTab = 'upgrades';
document.querySelectorAll('.htab').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    ensureAudio();
    const t = btn.dataset.tab;
    if (t === activeTab && panelOpen){ closePanel(); playTab(); return; }
    activeTab = t;
    document.querySelectorAll('.htab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + t).classList.add('active');
    if (!panelOpen) openPanel();
    playTab();
    doRender();
  });
});

// ── DOM cache ───────────────────────────────────────────────────────────
const DOM = {
  count:        document.getElementById('count-number'),
  clickPow:     document.getElementById('click-power-disp'),
  cpsBadge:     document.getElementById('cps-badge'),
  cpsVal:       document.getElementById('cps-val'),
  prBadge:      document.getElementById('prestige-badge'),
  prMulBadge:   document.getElementById('prestige-mul-badge'),
  multInfo:     document.getElementById('multiplier-info'),
  mulDisp:      document.getElementById('mul-disp'),
  prRing:       document.getElementById('prestige-ring'),
  cmInfo:       document.getElementById('combo-info'),
  cmBadge:      document.getElementById('combo-badge'),
  cmRing:       document.getElementById('combo-ring'),
  cmMul:        document.getElementById('combo-mul'),
  cmVal:        document.getElementById('combo-val'),
  brickWrap:    document.getElementById('brick-count-wrap'),
  brickNum:     document.getElementById('brick-number'),
  brickHint:    document.getElementById('brick-unlock-hint'),
  brickHintVal: document.getElementById('brick-hint-val'),
};
const _hdrCache = { count:'', cp:'', cps:'', pr:'', cm:'', brick:'', cpsVis:null, prVis:null, cmVis:null, brickVis:null };
let _brickTabsUnlocked = false;

// ── RENDER ──────────────────────────────────────────────────────────────
let renderPending = false;
function scheduleRender(){
  if (renderPending) return;
  renderPending = true;
  requestAnimationFrame(() => { renderPending = false; doRender(); });
}

function doRender(){
  renderHeader();
  updateNotifBadges();
  if      (activeTab === 'upgrades')     renderUpgrades();
  else if (activeTab === 'shop')         renderShop();
  else if (activeTab === 'powerups')     renderPowerups();
  else if (activeTab === 'bricks')       renderBricks();
  else if (activeTab === 'prestige')     renderPrestige();
  else if (activeTab === 'stats')        renderStats();
  else if (activeTab === 'achievements') renderAchievements();
  else if (activeTab === 'settings')   { renderThemeGrid(); renderSkins(); }
}

function renderHeader(){
  const cookies = fmt(G.cookies);
  if (cookies !== _hdrCache.count) { _hdrCache.count = cookies; DOM.count.textContent = cookies; }
  const cp = fmt(G.clickPower * currentClickMul());
  if (cp !== _hdrCache.cp) { _hdrCache.cp = cp; DOM.clickPow.textContent = cp; }

  const cpsVis = G.cps > 0;
  if (cpsVis !== _hdrCache.cpsVis){ _hdrCache.cpsVis = cpsVis; DOM.cpsBadge.classList.toggle('visible', cpsVis); }
  if (cpsVis){ const v = fmt(G.cps); if (v !== _hdrCache.cps){ _hdrCache.cps = v; DOM.cpsVal.textContent = v; } }

  const prVis = G.prestigeCount > 0;
  if (prVis !== _hdrCache.prVis){
    _hdrCache.prVis = prVis;
    DOM.prBadge.classList.toggle('visible', prVis);
    DOM.multInfo.classList.toggle('visible', prVis);
    DOM.prRing.className = prVis ? 'visible' : '';
  }
  if (prVis){ const v = G.prestigeMul.toFixed(1); if (v !== _hdrCache.pr){ _hdrCache.pr = v; DOM.prMulBadge.textContent = v; DOM.mulDisp.textContent = v; } }

  const cmVis = comboMul > 1.05;
  if (cmVis !== _hdrCache.cmVis){
    _hdrCache.cmVis = cmVis;
    DOM.cmInfo.classList.toggle('visible', cmVis);
    DOM.cmBadge.classList.toggle('visible', cmVis);
    DOM.cmRing.classList.toggle('visible', cmVis);
  }
  if (cmVis){ const v = comboMul.toFixed(2); if (v !== _hdrCache.cm){ _hdrCache.cm = v; DOM.cmMul.textContent = v; DOM.cmVal.textContent = '×' + comboMul.toFixed(1); } }

  if (G.bricksUnlocked){
    if (_hdrCache.brickVis !== true){
      _hdrCache.brickVis = true;
      DOM.brickWrap.classList.add('visible');
      DOM.brickHint.classList.remove('visible');
    }
    if (!_brickTabsUnlocked){
      _brickTabsUnlocked = true;
      document.querySelectorAll('.brick-tab').forEach(b => b.classList.add('unlocked'));
    }
    const v = fmt(G.bricks);
    if (v !== _hdrCache.brick){ _hdrCache.brick = v; DOM.brickNum.textContent = v; }
  } else {
    if (_hdrCache.brickVis !== false){
      _hdrCache.brickVis = false;
      DOM.brickWrap.classList.remove('visible');
    }
    const rem = Math.max(0, BRICK_UNLOCK_AT - G.totalCookies);
    if (rem > 0){ DOM.brickHint.classList.add('visible'); DOM.brickHintVal.textContent = fmt(rem); }
    else DOM.brickHint.classList.remove('visible');
  }
}

let prevUpgradeState = '';
let prevShopState   = '';

function renderUpgrades(){
  const state = UPGRADES.map(u => {
    const lvl = G.upgrades[u.id]||0, maxed = lvl >= u.maxLvl, cost = upgradeCost(u), can = !maxed && G.cookies >= cost;
    return `${lvl}:${can?1:0}:${maxed?1:0}`;
  }).join('|') + '|' + Math.floor(G.cookies/100);
  if (state === prevUpgradeState) return;
  prevUpgradeState = state;

  const list = document.getElementById('upgrades-list');
  list.innerHTML = '';
  let aff = false;
  UPGRADES.forEach(u => {
    const lvl = G.upgrades[u.id]||0, maxed = lvl >= u.maxLvl, cost = upgradeCost(u), can = !maxed && G.cookies >= cost;
    if (can) aff = true;
    const div = document.createElement('div');
    div.className = 'item-card' + (can?' affordable':'') + (maxed?' maxed':'');
    div.innerHTML = `<div class="item-icon">${u.icon}</div>
      <div class="item-info">
        <div class="item-name">${u.name}</div>
        <div class="item-desc">${u.desc}</div>
        <div class="item-lvl">Уровень ${lvl}/${u.maxLvl}</div>
      </div>
      <div class="item-right">
        <div class="item-cost ${can?'':'cant'}">${maxed?'★ Макс':'🍪 '+fmt(cost)}</div>
        <button class="buy-btn" ${(!can||maxed)?'disabled':''} data-id="${u.id}">${maxed?'Куплено':'Купить'}</button>
      </div>`;
    list.appendChild(div);
  });
  document.getElementById('hn-upgrades').className = 'hnotif' + (aff?' show':'');
}

function renderShop(){
  const state = SHOP.map(s => {
    const cnt = G.shop[s.id]||0, cost = shopCost(s), can = G.cookies >= cost;
    return `${cnt}:${can?1:0}`;
  }).join('|') + '|' + Math.floor(G.cookies/100);
  if (state === prevShopState) return;
  prevShopState = state;

  const list = document.getElementById('shop-list');
  list.innerHTML = '';
  let aff = false;
  SHOP.forEach(s => {
    const cnt = G.shop[s.id]||0, cost = shopCost(s), can = G.cookies >= cost;
    if (can) aff = true;
    const div = document.createElement('div');
    div.className = 'item-card' + (can?' affordable':'');
    div.innerHTML = `<div class="item-icon">${s.icon}</div>
      <div class="item-info">
        <div class="item-name">${s.name}</div>
        <div class="item-desc">${s.desc}</div>
        <div class="item-lvl">Куплено: ${cnt}</div>
      </div>
      <div class="item-right">
        <div class="item-cost ${can?'':'cant'}">🍪 ${fmt(cost)}</div>
        <button class="buy-btn" ${!can?'disabled':''} data-id="${s.id}">Купить</button>
      </div>`;
    list.appendChild(div);
  });
  document.getElementById('hn-shop').className = 'hnotif' + (aff?' show':'');
}

function renderBricks(){
  const c = document.getElementById('bricks-content');
  if (!G.bricksUnlocked){
    const pct = Math.min(100, Math.floor(G.totalCookies/BRICK_UNLOCK_AT*100));
    c.innerHTML = `<div class="brick-locked-msg">
      <div class="brick-locked-icon">🧱</div>
      <div class="brick-locked-title">Кирпичи заперты</div>
      <div class="brick-locked-sub">Заработай <b>${fmt(BRICK_UNLOCK_AT)}</b> печенек за всё время</div>
      <div class="brick-progress-bar"><div class="brick-progress-fill" style="width:${pct}%"></div></div>
      <div style="font-size:10px;color:var(--mid);margin-top:6px;font-weight:700">${pct}%</div>
    </div>`;
    return;
  }
  let hasBU = false, hasBP = false;
  BRICK_UPGRADES.forEach(u => { const l = G.brickUpgrades[u.id]||0; if (l < u.maxLvl && G.bricks >= bUpgCost(u)) hasBU = true; });
  BRICK_PRODUCTION.forEach(u => { const l = G.brickProduction[u.id]||0; if (l < u.maxLvl && G.cookies >= bProdCost(u)) hasBP = true; });
  document.getElementById('hn-bricks').className = 'hnotif' + ((hasBU||hasBP)?' show':'');

  let h = `<div class="brick-hero"><div class="brick-hero-icon">🧱</div>
    <div class="brick-hero-title">КИРПИЧИ</div>
    <div class="brick-hero-sub">Пассивная валюта. Трать на улучшения.</div></div>
  <div class="brick-stats">
    <div class="brick-stat"><div class="brick-stat-icon">🧱</div><div class="brick-stat-val">${fmt(G.bricks)}</div><div class="brick-stat-lbl">Кирпичей сейчас</div></div>
    <div class="brick-stat"><div class="brick-stat-icon">⏱️</div><div class="brick-stat-val">${fmt(G.bps)}/с</div><div class="brick-stat-lbl">Кирпичей в сек</div></div>
  </div>
  <div class="section-title">Бонусы к печенькам (за кирпичи)</div>`;

  BRICK_UPGRADES.forEach(u => {
    const lvl = G.brickUpgrades[u.id]||0, maxed = lvl >= u.maxLvl, cost = bUpgCost(u), can = !maxed && G.bricks >= cost;
    h += `<div class="item-card brick-card${can?' affordable':''}${maxed?' maxed':''}">
      <div class="item-icon">${u.icon}</div>
      <div class="item-info"><div class="item-name">${u.name}</div><div class="item-desc">${u.desc}</div><div class="item-lvl">Уровень ${lvl}/${u.maxLvl}</div></div>
      <div class="item-right"><div class="item-cost bk ${can?'':'cant'}">${maxed?'★ Макс':'🧱 '+fmt(cost)}</div>
      <button class="buy-btn bk" ${(!can||maxed)?'disabled':''} data-bid="${u.id}">${maxed?'Куплено':'Купить'}</button></div></div>`;
  });
  h += `<div class="section-title" style="margin-top:8px">Производство кирпичей (за печеньки)</div>`;
  BRICK_PRODUCTION.forEach(u => {
    const lvl = G.brickProduction[u.id]||0, maxed = lvl >= u.maxLvl, cost = bProdCost(u), can = !maxed && G.cookies >= cost;
    h += `<div class="item-card${can?' affordable':''}${maxed?' maxed':''}">
      <div class="item-icon">${u.icon}</div>
      <div class="item-info"><div class="item-name">${u.name}</div><div class="item-desc">${u.desc}</div><div class="item-lvl">Уровень ${lvl}/${u.maxLvl}</div></div>
      <div class="item-right"><div class="item-cost ${can?'':'cant'}">🍪 ${fmt(cost)}</div>
      <button class="buy-btn" ${(!can||maxed)?'disabled':''} data-bpid="${u.id}">${maxed?'Куплено':'Купить'}</button></div></div>`;
  });
  c.innerHTML = h;
}

function renderAchievements(){
  const list = document.getElementById('ach-list');
  list.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const ok = a.check(G);
    const d = document.createElement('div');
    d.className = 'ach-card' + (ok?' unlocked':'');
    d.innerHTML = `<div class="ach-icon">${a.icon}</div>
      <div class="ach-info"><div class="ach-name">${a.name}</div><div class="ach-req">${a.req}</div></div>
      ${ok?'<div style="font-size:18px">✅</div>':''}`;
    list.appendChild(d);
  });
}

function renderPrestige(){
  document.getElementById('prestige-count-disp').textContent = G.prestigeCount;
  document.getElementById('prestige-mul-disp').textContent = '×' + G.prestigeMul.toFixed(1);
  const btn = document.getElementById('prestige-btn'), sub = document.getElementById('prestige-btn-sub');
  const can = G.totalCookies >= PRESTIGE_THRESHOLD;
  btn.disabled = !can;
  sub.textContent = can ? 'Получить ×' + (G.prestigeMul + PRESTIGE_ADD).toFixed(1)
                        : 'Нужно ещё ' + fmt(PRESTIGE_THRESHOLD - G.totalCookies);
}

function renderStats(){
  const el = G.totalTime + (Date.now() - G.sessionStart), sec = Math.floor(el/1000);
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60;
  const t = h>0 ? `${h}ч ${m}м` : m>0 ? `${m}м ${s}с` : `${s}с`;
  const data = [
    { icon:'⏱️', value:t,                                   label:'Время в игре' },
    { icon:'👆', value:fmt(G.totalClicks),                  label:'Всего нажатий' },
    { icon:'🍪', value:fmt(G.totalCookies),                 label:'Испечено всего' },
    { icon:'🧱', value:fmt(G.totalBricks),                  label:'Кирпичей добыто' },
    { icon:'🌟', value:G.prestigeCount,                     label:'Перерождений' },
    { icon:'✨', value:'×'+G.prestigeMul.toFixed(1),        label:'Множитель' },
    { icon:'🔥', value:'×'+G.maxCombo.toFixed(2),           label:'Макс. комбо' },
    { icon:'⭐', value:G.goldenCaught,                      label:'Золотых поймано' },
    { icon:'💥', value:G.crits,                             label:'Крит-ударов' },
    { icon:'👹', value:G.bossesDefeated||0,                 label:'Боссов побеждено' },
    { icon:'🎁', value:G.chestsOpened||0,                   label:'Сундуков открыто' },
    { icon:'⚡', value:G.cpsRecord||0,                      label:'Рекорд кликов/сек' },
    { icon:'📅', value:G.bestStreak||0,                     label:'Лучшая серия дней' },
    { icon:'📋', value:G.missionsClaimed||0,                label:'Заданий выполнено' },
    { icon:'🌧️', value:G.rainCookiesCollected||0,          label:'Печенек с дождя' },
    { icon:'🌟', value:G.prestigePoints||0,                 label:'Престиж-очки' },
    { icon:'🏅', value:'+'+getMasteryBonus().toFixed(1),    label:'Знак мастерства' },
    { icon:'🏆', value:ACHIEVEMENTS.filter(a=>a.check(G)).length+'/'+ACHIEVEMENTS.length, label:'Достижений' },
  ];
  const grid = document.getElementById('stats-grid');
  grid.innerHTML = '';
  data.forEach(d => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `<div class="stat-icon">${d.icon}</div><div class="stat-value">${d.value}</div><div class="stat-label">${d.label}</div>`;
    grid.appendChild(card);
  });
}

function updateNotifBadges(){
  const hu = UPGRADES.some(u => { const l = G.upgrades[u.id]||0; return l < u.maxLvl && G.cookies >= upgradeCost(u); });
  const hs = SHOP.some(s => G.cookies >= shopCost(s));
  document.getElementById('hn-upgrades').className = 'hnotif' + (hu?' show':'');
  document.getElementById('hn-shop').className     = 'hnotif' + (hs?' show':'');
  if (G.bricksUnlocked){
    const hbu = BRICK_UPGRADES.some(u => { const l = G.brickUpgrades[u.id]||0; return l < u.maxLvl && G.bricks >= bUpgCost(u); });
    const hbp = BRICK_PRODUCTION.some(u => { const l = G.brickProduction[u.id]||0; return l < u.maxLvl && G.cookies >= bProdCost(u); });
    document.getElementById('hn-bricks').className = 'hnotif' + ((hbu||hbp)?' show':'');
  }
}

// ── BUY HANDLERS ────────────────────────────────────────────────────────
document.getElementById('upgrades-list').addEventListener('click', e => {
  const btn = e.target.closest('.buy-btn'); if (!btn || btn.disabled) return;
  const u = UPGRADES.find(x => x.id === btn.dataset.id); if (!u) return;
  const cost = upgradeCost(u); if (G.cookies < cost) return;
  G.cookies -= cost; G.upgrades[u.id] = (G.upgrades[u.id]||0) + 1;
  recalcClickPower(); prevUpgradeState = '';
  playUpgrade(); scheduleRender();
});
document.getElementById('shop-list').addEventListener('click', e => {
  const btn = e.target.closest('.buy-btn'); if (!btn || btn.disabled) return;
  const s = SHOP.find(x => x.id === btn.dataset.id); if (!s) return;
  const cost = shopCost(s); if (G.cookies < cost) return;
  G.cookies -= cost; G.shop[s.id] = (G.shop[s.id]||0) + 1;
  recalcCPS(); prevShopState = '';
  playCoin(); scheduleRender();
});
document.getElementById('bricks-content').addEventListener('click', e => {
  const btn = e.target.closest('.buy-btn'); if (!btn || btn.disabled) return;
  if (btn.dataset.bid){
    const u = BRICK_UPGRADES.find(x => x.id === btn.dataset.bid); if (!u) return;
    const cost = bUpgCost(u); if (G.bricks < cost) return;
    G.bricks -= cost; G.brickUpgrades[u.id] = (G.brickUpgrades[u.id]||0) + 1;
    recalcCPS(); playUpgrade(); scheduleRender();
  } else if (btn.dataset.bpid){
    const u = BRICK_PRODUCTION.find(x => x.id === btn.dataset.bpid); if (!u) return;
    const cost = bProdCost(u); if (G.cookies < cost) return;
    G.cookies -= cost; G.brickProduction[u.id] = (G.brickProduction[u.id]||0) + 1;
    recalcBPS(); playCoin(); scheduleRender();
  }
});

// ── COMBO + BOOSTS ──────────────────────────────────────────────────────
let comboMul = 1.0;
let lastClickTs = 0;
let comboDecayTimer = null;
function bumpCombo(){
  const now = Date.now();
  if (now - lastClickTs < COMBO_WINDOW_MS){
    comboMul = Math.min(COMBO_MAX, comboMul + COMBO_PER_CLICK);
    if (comboMul > G.maxCombo) G.maxCombo = comboMul;
  } else {
    comboMul = 1.0;
  }
  lastClickTs = now;
  if (comboDecayTimer) clearTimeout(comboDecayTimer);
  comboDecayTimer = setTimeout(() => { comboMul = 1.0; scheduleRender(); }, COMBO_DECAY_MS);
}
function getBoostMuls(){
  const now = Date.now();
  G.activeBoosts = G.activeBoosts.filter(b => b.untilTs > now);
  let click = 1, cps = 1;
  for (const b of G.activeBoosts){
    if (b.type === 'click' || b.type === 'all') click *= b.mul;
    if (b.type === 'cps' || b.type === 'all')   cps *= b.mul;
  }
  return { click, cps };
}
function currentClickMul(){ return comboMul * getBoostMuls().click; }
function addBoost(id, name, icon, type, mul, durationMs){
  const now = Date.now();
  G.activeBoosts = G.activeBoosts.filter(b => b.id !== id && b.untilTs > now);
  G.activeBoosts.push({ id, name, icon, type, mul, untilTs: now + durationMs });
  scheduleRender();
}

// ── GOLDEN COOKIE ───────────────────────────────────────────────────────
const goldenEl = document.getElementById('golden');
let goldenActive = false, goldenAnim = null;
function spawnGolden(){
  if (goldenActive) return;
  if (G.totalCookies < 200) return;
  goldenActive = true;
  const fromLeft = Math.random() < .5;
  const startX = fromLeft ? -60 : innerWidth + 60;
  const endX   = fromLeft ? innerWidth + 60 : -60;
  const yBase = 120 + Math.random() * (innerHeight - 260 - 120);
  const yAmp  = 40 + Math.random() * 60;
  const dur   = 10000 + Math.random() * 4000;
  const t0 = performance.now();
  goldenEl.classList.add('show');
  playGoldenSpawn();
  function frame(t){
    const k = (t - t0) / dur;
    if (k >= 1 || !goldenActive){ despawnGolden(); return; }
    const x = startX + (endX - startX) * k;
    const y = yBase + Math.sin(k * Math.PI * 3) * yAmp;
    goldenEl.style.left = (x - 27) + 'px';
    goldenEl.style.top  = (y - 27) + 'px';
    goldenAnim = requestAnimationFrame(frame);
  }
  goldenAnim = requestAnimationFrame(frame);
}
function despawnGolden(){
  goldenActive = false;
  goldenEl.classList.remove('show');
  if (goldenAnim) { cancelAnimationFrame(goldenAnim); goldenAnim = null; }
}
goldenEl.addEventListener('click', e => {
  e.stopPropagation();
  ensureAudio();
  const r = goldenEl.getBoundingClientRect();
  const cx = r.left + r.width/2, cy = r.top + r.height/2;
  G.goldenCaught = (G.goldenCaught||0) + 1;
  const choice = Math.random();
  if (choice < .5){
    const gain = Math.max(50, Math.floor(G.totalCookies * (0.01 + Math.random()*0.03)));
    G.cookies += gain; G.totalCookies += gain;
    spawnFloat(cx, cy, gain, 'gold', '+');
    showBanner('🌟 +' + fmt(gain) + ' печенек!');
  } else {
    addBoost('golden', 'Золотая печ.', '🌟', 'click', 7, 13000);
    spawnFloat(cx, cy, '×7', 'crit', '');
    showBanner('⭐ ×7 клик на 13 сек!');
  }
  spawnCrumbs(cx, cy, 16, true);
  playGoldenTap();
  despawnGolden();
  scheduleRender();
});

// ── BANNER ──────────────────────────────────────────────────────────────
let bannerTimeout = null;
function showBanner(text){
  const b = document.getElementById('power-banner');
  b.textContent = text;
  b.classList.add('show');
  if (bannerTimeout) clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => b.classList.remove('show'), 2400);
}

function scheduleNextGolden(){
  const delay = 80000 + Math.random() * 70000;
  setTimeout(() => { spawnGolden(); scheduleNextGolden(); }, delay);
}
setTimeout(scheduleNextGolden, 30000);

// ── CLICK ───────────────────────────────────────────────────────────────
const cookieBtn = document.getElementById('cookie-btn');
let lastClick = 0;
let _idleResumeTimer = null;
let clicksThisSecond = 0;

function spawnFloat(x, y, val, cls, prefix){
  const el = document.createElement('div');
  el.className = 'float-num ' + (cls||'c');
  el.textContent = (prefix == null ? '+' : prefix) + (typeof val === 'number' ? fmt(val) : val);
  el.style.cssText = `left:${x-26}px;top:${y-30}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function handleClickAt(cx, cy){
  lastClick = Date.now();
  ensureAudio();
  bumpCombo();
  clicksThisSecond++;
  missionProgress('clicks', 1);

  let isCrit = Math.random() < CRIT_CHANCE;
  let mul = currentClickMul();
  if (isCrit){ mul *= CRIT_MUL; G.crits = (G.crits||0) + 1; }
  const earned = Math.round(G.clickPower * mul);

  G.cookies += earned; G.totalCookies += earned; G.totalClicks++;
  if (!G.bricksUnlocked && G.totalCookies >= BRICK_UNLOCK_AT){
    G.bricksUnlocked = true; recalcBPS(); playUnlock();
    showBanner('🧱 Кирпичи открыты!');
  }

  const r = cookieBtn.getBoundingClientRect();
  const dx = (cx - (r.left + r.width/2)) / r.width;
  const dy = (cy - (r.top + r.height/2)) / r.height;
  cookieBtn.classList.remove('idle');
  cookieBtn.style.transform = `scale(0.92) rotate(${-dx*5}deg) translate(${-dx*4}px,${-dy*4}px)`;
  if (_idleResumeTimer) clearTimeout(_idleResumeTimer);
  _idleResumeTimer = setTimeout(() => {
    cookieBtn.style.transform = '';
    cookieBtn.classList.add('idle');
    _idleResumeTimer = null;
  }, 140);

  if (isCrit){
    cookieBtn.classList.add('crit');
    setTimeout(() => cookieBtn.classList.remove('crit'), 220);
    spawnFloat(cx, cy, 'КРИТ! +' + fmt(earned), 'crit', '');
    spawnCrumbs(cx, cy, 12, true);
    playCrit();
  } else {
    spawnFloat(cx, cy, earned, 'c', '+');
    spawnCrumbs(cx, cy, 4 + Math.random()*3 | 0, false);
    playCrunch();
  }

  const cn = document.getElementById('count-number');
  cn.classList.remove('bump'); void cn.offsetWidth; cn.classList.add('bump');

  scheduleRender();
}
cookieBtn.addEventListener('touchstart', e => {
  if (e.cancelable) e.preventDefault();
  for (const t of e.changedTouches) handleClickAt(t.clientX, t.clientY);
}, {passive:false});
cookieBtn.addEventListener('click', e => {
  if (Date.now() - lastClick < 400) return;
  handleClickAt(e.clientX, e.clientY);
});

// ── GAME TICK ───────────────────────────────────────────────────────────
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now(), dt = (now - lastTick) / 1000;
  lastTick = now;
  let dirty = false;
  const muls = getBoostMuls();
  if (G.cps > 0){
    const earned = G.cps * dt * muls.cps * getPetCpsBonus();
    G.cookies += earned; G.totalCookies += earned; dirty = true;
    if (!G.bricksUnlocked && G.totalCookies >= BRICK_UNLOCK_AT){
      G.bricksUnlocked = true; recalcBPS(); playUnlock();
      showBanner('🧱 Кирпичи открыты!');
    }
  }
  if (G.bricksUnlocked && G.bps > 0){
    const earned = G.bps * dt;
    G.bricks += earned; G.totalBricks += earned;
    dirty = true;
  }
  updateBoostStrip();
  checkBossSpawn();
  if (activeTab === 'powerups') refreshFreebieTimers();
  if (dirty) scheduleRender();
}, 100);

// ── PRESTIGE ────────────────────────────────────────────────────────────
document.getElementById('prestige-btn').addEventListener('click', () => {
  if (G.totalCookies < PRESTIGE_THRESHOLD) return;
  document.getElementById('overlay-new-mul').textContent = '×' + (G.prestigeMul + PRESTIGE_ADD).toFixed(1);
  document.getElementById('prestige-overlay').classList.add('show');
});
document.getElementById('overlay-cancel').addEventListener('click', () => {
  document.getElementById('prestige-overlay').classList.remove('show');
});
document.getElementById('overlay-confirm').addEventListener('click', () => {
  G.prestigeCount++;
  G.prestigeMul = 1.0 + G.prestigeCount * PRESTIGE_ADD;
  G.prestigePoints = (G.prestigePoints||0) + 1;
  G.cookies = 0; G.upgrades = {}; G.shop = {};
  G.activeBoosts = []; G.bossPendingThreshold = 0;
  bossIconEl.classList.remove('show');
  if (bossFight){
    bossOverlay.classList.remove('show');
    bossFight = null;
    if (bossTimerInt){ clearInterval(bossTimerInt); bossTimerInt = null; }
  }
  prevUpgradeState = ''; prevShopState = '';
  recalcClickPower(); recalcCPS(); updateBoostStrip();
  document.getElementById('prestige-overlay').classList.remove('show');
  spawnConfetti(innerWidth/2, innerHeight/3, 80);
  playPrestige();
  activeTab = 'prestige';
  document.querySelectorAll('.htab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelector('.htab[data-tab="prestige"]').classList.add('active');
  document.getElementById('tab-prestige').classList.add('active');
  openPanel(); doRender(); save();
});

// ── RESET ───────────────────────────────────────────────────────────────
const confirmOv = document.getElementById('confirm-overlay');
document.getElementById('reset-btn').addEventListener('click', () => confirmOv.classList.add('show'));
document.getElementById('confirm-cancel').addEventListener('click', () => confirmOv.classList.remove('show'));
document.getElementById('confirm-reset').addEventListener('click', () => {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(SAVE_KEY_OLD);
  const keepTheme = G.theme || 'auto';
  G = {
    cookies:0, totalCookies:0, totalClicks:0, clickPower:1, cps:0,
    sessionStart:Date.now(), totalTime:0, upgrades:{}, shop:{},
    bricks:0, totalBricks:0, bps:1, bricksUnlocked:false,
    brickUpgrades:{}, brickProduction:{},
    prestigeCount:0, prestigeMul:1.0, prestigePoints:0,
    maxCombo:1.0, goldenCaught:0, crits:0,
    bossesDefeated:0, bossesFled:0,
    chestsOpened:0, spinsCompleted:0,
    chestReadyAt:0, spinReadyAt:0,
    bossPendingThreshold:0, bossLastSpawnAt:0,
    theme:keepTheme, activeBoosts:[],
    cpsRecord:0,
    skinId:'classic', skinsOwned:['classic'],
    lastLoginDay:'', loginStreak:0, bestStreak:0, streakClaimedDay:'',
    missionDay:'', missions:[], missionsClaimed:0,
    petLevel:0,
    rainsCaught:0, rainCookiesCollected:0, nextRainAt:0,
  };
  prevUpgradeState = ''; prevShopState = '';
  bossIconEl.classList.remove('show');
  if (bossFight){
    bossOverlay.classList.remove('show');
    bossFight = null;
    if (bossTimerInt){ clearInterval(bossTimerInt); bossTimerInt = null; }
  }
  recalcCPS(); recalcClickPower(); recalcBPS(); updateBoostStrip(); doRender();
  confirmOv.classList.remove('show');
});

// ── SAVE / VISIBILITY ───────────────────────────────────────────────────
setInterval(save, 10000);
window.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('pagehide', save);

// ── AUDIO TOGGLES ───────────────────────────────────────────────────────
document.getElementById('toggle-music').addEventListener('click', function(){
  musicEnabled = !musicEnabled;
  this.textContent = musicEnabled ? 'ВКЛ' : 'ВЫКЛ';
  this.classList.toggle('off', !musicEnabled);
  if (musicGain) musicGain.gain.value = musicEnabled ? .06 : 0;
  if (musicEnabled && !musicStarted){ musicStarted = true; startMusic(); }
});
document.getElementById('toggle-sfx').addEventListener('click', function(){
  sfxEnabled = !sfxEnabled;
  this.textContent = sfxEnabled ? 'ВКЛ' : 'ВЫКЛ';
  this.classList.toggle('off', !sfxEnabled);
});

// ── REWARDS / CHEST / SPIN ──────────────────────────────────────────────
function applyReward(r){
  if (r.type === 'cookies_pct'){
    const gain = Math.max(50, Math.floor(G.totalCookies * r.val / 100));
    G.cookies += gain; G.totalCookies += gain;
    r.label = r.label || '+' + fmt(gain) + ' печенек';
  } else if (r.type === 'bricks'){
    if (G.bricksUnlocked){ G.bricks += r.val; G.totalBricks += r.val; }
    else {
      const gain = Math.max(100, Math.floor(G.totalCookies * 0.02));
      G.cookies += gain; G.totalCookies += gain;
      r.icon = '🍪'; r.label = '+' + fmt(gain) + ' печенек';
    }
    r.label = r.label || '+' + fmt(r.val) + ' кирпичей';
  } else if (r.type === 'boost'){
    addBoost(r.boost.id, r.boost.name, r.boost.icon, r.boost.type, r.boost.mul, r.boost.duration);
  }
}
function chestState(){ return Date.now() >= G.chestReadyAt; }
function spinState(){  return Date.now() >= G.spinReadyAt; }

const chestModal = document.getElementById('chest-modal');
const chestActionBtn = document.getElementById('chest-action');
let chestRolledReward = null;
function openChestModal(){
  if (!chestState()) return;
  chestRolledReward = null;
  document.getElementById('chest-reward-card').style.display = 'none';
  chestActionBtn.textContent = 'ОТКРЫТЬ';
  chestModal.classList.add('show');
}
chestActionBtn.addEventListener('click', () => {
  if (!chestRolledReward){
    if (!chestState()) return;
    const pick = pickWeighted(CHEST_REWARDS).roll();
    applyReward(pick);
    chestRolledReward = pick;
    G.chestReadyAt = Date.now() + CHEST_COOLDOWN;
    G.chestsOpened = (G.chestsOpened||0) + 1;
    document.getElementById('chest-reward-icon').textContent = pick.icon;
    document.getElementById('chest-reward-label').textContent = pick.label;
    document.getElementById('chest-reward-card').style.display = 'block';
    chestActionBtn.textContent = 'ЗАБРАТЬ';
    spawnConfetti(innerWidth/2, innerHeight/2.6, 40);
    playGoldenSpawn();
    scheduleRender();
  } else {
    chestModal.classList.remove('show');
    chestRolledReward = null;
    save(); scheduleRender();
  }
});

const spinModal = document.getElementById('spin-modal');
const spinStrip = document.getElementById('spin-strip');
const spinActionBtn = document.getElementById('spin-action');
function buildSpinStrip(){
  let html = '';
  for (let i = 0; i < 25; i++){
    const r = SPIN_REWARDS[i % SPIN_REWARDS.length];
    html += `<div class="spin-cell"><div class="si">${r.icon}</div><div>${r.label}</div></div>`;
  }
  spinStrip.innerHTML = html;
  spinStrip.style.transition = 'none';
  spinStrip.style.transform = 'translateX(0)';
}
function openSpinModal(){
  if (!spinState()) return;
  buildSpinStrip();
  spinActionBtn.disabled = false;
  spinActionBtn.textContent = 'КРУТИТЬ!';
  spinModal.classList.add('show');
}
let spinning = false;
spinActionBtn.addEventListener('click', () => {
  if (spinning){
    spinModal.classList.remove('show');
    spinning = false;
    save(); scheduleRender();
    return;
  }
  if (!spinState()) return;
  spinning = true;
  spinActionBtn.disabled = true;
  spinActionBtn.textContent = '...';
  const idx = Math.random() * SPIN_REWARDS.length | 0;
  const reward = Object.assign({}, SPIN_REWARDS[idx]);
  if (reward.boost) reward.boost = Object.assign({}, reward.boost);
  const cellW = 90;
  const wrapW = spinStrip.parentElement.clientWidth;
  const targetIdx = idx + SPIN_REWARDS.length * 3;
  const targetX = -(targetIdx * cellW + cellW/2 - wrapW/2);
  spinStrip.style.transition = 'none';
  spinStrip.style.transform = 'translateX(0)';
  void spinStrip.offsetWidth;
  spinStrip.style.transition = 'transform 3.5s cubic-bezier(.15,.7,.25,1)';
  spinStrip.style.transform = 'translateX(' + targetX + 'px)';
  playGoldenSpawn();
  setTimeout(() => {
    applyReward(reward);
    G.spinReadyAt = Date.now() + SPIN_COOLDOWN;
    G.spinsCompleted = (G.spinsCompleted||0) + 1;
    spinActionBtn.disabled = false;
    spinActionBtn.textContent = 'ЗАБРАТЬ';
    showRewardPopup(reward.icon, reward.label);
    spawnConfetti(innerWidth/2, innerHeight/2.6, 70);
    playGoldenTap();
    scheduleRender();
  }, 3700);
});

function showRewardPopup(icon, label){
  const el = document.createElement('div');
  el.className = 'reward-popup';
  el.innerHTML = '<div class="reward-popup-icon">' + icon + '</div><div class="reward-popup-label">' + label + '</div>';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1700);
}

document.getElementById('chest-open-btn').addEventListener('click', openChestModal);
document.getElementById('spin-open-btn').addEventListener('click', openSpinModal);

// ── BOSS ────────────────────────────────────────────────────────────────
function nextBossThreshold(){
  return Math.floor(100000 * Math.pow(2.5, G.bossesDefeated + G.bossesFled));
}
const bossIconEl    = document.getElementById('boss-icon');
const bossOverlay   = document.getElementById('boss-overlay');
const bossCookieBtn = document.getElementById('boss-cookie-btn');
const bossTimerEl   = document.getElementById('boss-timer');
const bossHpFill    = document.getElementById('boss-hp-fill');
const bossHpText    = document.getElementById('boss-hp-text');
const bossRewardLine= document.getElementById('boss-reward-line');
const bossFleeBtn   = document.getElementById('boss-flee');
let bossFight = null;
let bossTimerInt = null;

function checkBossSpawn(){
  if (G.bossPendingThreshold > 0 || bossFight) return;
  const next = nextBossThreshold();
  if (G.totalCookies >= next){
    G.bossPendingThreshold = next;
    G.bossLastSpawnAt = Date.now();
    bossIconEl.classList.add('show');
    showBanner('👹 БОСС появился!');
    playUnlock();
  }
}
bossIconEl.addEventListener('click', () => {
  if (!G.bossPendingThreshold) return;
  startBossFight();
});
function startBossFight(){
  ensureAudio();
  const tier = G.bossesDefeated + G.bossesFled + 1;
  const hp = Math.max(30, Math.floor(G.clickPower * 60 * tier));
  bossFight = {
    hp, maxHp: hp,
    untilTs: Date.now() + 30000,
    rewardBricks: 80 + 50 * tier,
    rewardBoostMul: 3, rewardBoostDur: 60000,
  };
  bossOverlay.classList.add('show');
  bossIconEl.classList.remove('show');
  updateBossUI();
  if (bossTimerInt) clearInterval(bossTimerInt);
  bossTimerInt = setInterval(() => {
    if (!bossFight) return;
    const left = bossFight.untilTs - Date.now();
    if (left <= 0){ endBossFight(false); return; }
    bossTimerEl.textContent = Math.ceil(left/1000) + ' сек';
    if (left <= 10000) bossTimerEl.classList.add('danger');
    else bossTimerEl.classList.remove('danger');
  }, 200);
  bossRewardLine.innerHTML = 'Награда: ' + fmt(bossFight.rewardBricks) + ' 🧱 + ×' + bossFight.rewardBoostMul + ' клик на минуту';
}
function updateBossUI(){
  if (!bossFight) return;
  const pct = Math.max(0, bossFight.hp/bossFight.maxHp*100);
  bossHpFill.style.width = pct + '%';
  bossHpText.textContent = fmt(bossFight.hp) + '/' + fmt(bossFight.maxHp) + ' HP';
}
bossCookieBtn.addEventListener('touchstart', e => {
  e.preventDefault();
  if (!bossFight) return;
  for (const t of e.changedTouches) bossHit(t.clientX, t.clientY);
}, {passive:false});
bossCookieBtn.addEventListener('click', e => {
  if (!bossFight) return;
  if (Date.now() - lastClick < 400) return;
  bossHit(e.clientX, e.clientY);
});
function bossHit(cx, cy){
  if (!bossFight) return;
  const dmg = Math.max(1, Math.round(G.clickPower * comboMul * getBoostMuls().click));
  bossFight.hp -= dmg;
  bumpCombo();
  spawnFloat(cx, cy, dmg, 'crit', '-');
  spawnCrumbs(cx, cy, 5, false);
  playCrunch();
  bossCookieBtn.style.transform = 'scale(.93)';
  setTimeout(() => bossCookieBtn.style.transform = '', 110);
  if (bossFight.hp <= 0) endBossFight(true);
  else updateBossUI();
}
function endBossFight(won){
  if (bossTimerInt){ clearInterval(bossTimerInt); bossTimerInt = null; }
  bossTimerEl.classList.remove('danger');
  bossOverlay.classList.remove('show');
  G.bossPendingThreshold = 0;
  if (won){
    G.bossesDefeated++;
    let rewardLabel;
    if (G.bricksUnlocked){
      G.bricks += bossFight.rewardBricks; G.totalBricks += bossFight.rewardBricks;
      rewardLabel = '+' + fmt(bossFight.rewardBricks) + ' 🧱 · ×' + bossFight.rewardBoostMul + ' клик';
    } else {
      const c = Math.max(500, Math.floor(G.totalCookies * 0.05));
      G.cookies += c; G.totalCookies += c;
      rewardLabel = '+' + fmt(c) + ' 🍪 · ×' + bossFight.rewardBoostMul + ' клик';
    }
    addBoost('boss', 'Босс-бонус', '👹', 'click', bossFight.rewardBoostMul, bossFight.rewardBoostDur);
    showRewardPopup('🏆', rewardLabel);
    spawnConfetti(innerWidth/2, innerHeight/2, 60);
    playPrestige();
  } else {
    G.bossesFled++;
    showBanner('💨 Босс убежал...');
  }
  bossFight = null;
  save(); scheduleRender();
}
bossFleeBtn.addEventListener('click', () => endBossFight(false));

// ── POWERUP BUY ─────────────────────────────────────────────────────────
function buyPowerup(p){
  if (!G.bricksUnlocked || G.bricks < p.cost) return;
  G.bricks -= p.cost;
  addBoost('pu_' + p.id, p.name, p.icon, p.type, p.mul, p.duration);
  playUpgrade(); scheduleRender(); save();
}

// ── COOKIE STAGE ────────────────────────────────────────────────────────
function getCookieStage(){
  let s = 0;
  for (let i = STAGE_THRESHOLDS.length-1; i >= 0; i--){
    if (G.totalCookies >= STAGE_THRESHOLDS[i]){ s = i; break; }
  }
  return s;
}
let _appliedStage = -1;
function applyCookieStage(){
  const s = getCookieStage();
  if (s === _appliedStage) return;
  _appliedStage = s;
  document.body.classList.remove('cookie-stage-1','cookie-stage-2','cookie-stage-3','cookie-stage-4','cookie-stage-5');
  if (s > 0) document.body.classList.add('cookie-stage-' + s);
  const badge = document.getElementById('stage-badge');
  if (s > 0){ badge.style.display = 'block'; badge.textContent = STAGE_LABELS[s]; }
  else badge.style.display = 'none';
}

// ── SKIN ────────────────────────────────────────────────────────────────
let _appliedSkin = '';
function applySkin(){
  const sid = G.skinId || 'classic';
  if (sid === _appliedSkin) return;
  _appliedSkin = sid;
  document.body.classList.remove('skin-classic','skin-golden','skin-gingerbread','skin-pumpkin','skin-snow','skin-diamond','skin-rainbow');
  document.body.classList.add('skin-' + sid);
  const img = document.getElementById('cookie-img');
  const btn = document.getElementById('cookie-btn');
  if (img && btn){
    btn.classList.remove('skin-image');
    img.onload  = () => btn.classList.add('skin-image');
    img.onerror = () => btn.classList.remove('skin-image');
    img.src = 'assets/skins/' + sid + '.webp';
  }
}
function buySkin(s){
  if (G.skinsOwned.includes(s.id)) return;
  if (G.prestigePoints < s.cost) return;
  G.prestigePoints -= s.cost;
  G.skinsOwned.push(s.id);
  G.skinId = s.id;
  applySkin(); playUpgrade(); save(); renderSkins();
  showRewardPopup(s.icon, s.name + ' открыта!');
  spawnConfetti(innerWidth/2, innerHeight/3, 40);
}
function selectSkin(s){
  if (!G.skinsOwned.includes(s.id)) return;
  G.skinId = s.id;
  applySkin(); playTab(); save(); renderSkins();
}
function renderSkins(){
  const grid = document.getElementById('skin-grid');
  if (!grid) return;
  grid.innerHTML = SKINS.map(s => {
    const owned = G.skinsOwned.includes(s.id);
    const active = G.skinId === s.id;
    const canBuy = !owned && G.prestigePoints >= s.cost;
    return `<div class="skin-card${active?' active':''}${!owned?' locked':''}" data-sid="${s.id}">
      <div class="skin-preview ${s.id}"></div>
      <div class="skin-name">${s.icon} ${s.name}</div>
      <div class="skin-cost ${owned?'owned':''}">${owned?(active?'✓ Используется':'Нажми, чтобы выбрать'):('🌟 '+s.cost+(canBuy?' (купить)':''))}</div>
    </div>`;
  }).join('');
}
document.getElementById('skin-grid').addEventListener('click', e => {
  const card = e.target.closest('.skin-card'); if (!card) return;
  const s = SKINS.find(x => x.id === card.dataset.sid); if (!s) return;
  if (G.skinsOwned.includes(s.id)) selectSkin(s);
  else buySkin(s);
});

// ── PET ─────────────────────────────────────────────────────────────────
function petCost(){ return 1 + (G.petLevel||0); }
function buyPet(){
  if (G.petLevel >= PET_MAX) return;
  const cost = petCost();
  if (G.prestigePoints < cost) return;
  G.prestigePoints -= cost;
  G.petLevel++;
  applyPet(); playUpgrade(); save(); renderPet();
  showRewardPopup('🐱', 'Питомец ур. ' + G.petLevel);
}
function applyPet(){
  const el = document.getElementById('pet');
  if (G.petLevel > 0) el.classList.add('show');
  else el.classList.remove('show');
}
function renderPet(){
  const el = document.getElementById('pet-pane');
  if (!el) return;
  if (G.prestigeCount === 0 && G.petLevel === 0){
    el.innerHTML = `<div class="no-boosts">🔒 Питомец откроется после первого перерождения</div>`;
    return;
  }
  const lvl = G.petLevel || 0;
  const pct = Math.round(lvl * 5);
  const cost = petCost();
  const can = lvl < PET_MAX && G.prestigePoints >= cost;
  el.innerHTML = `<div class="pet-card">
    <div class="pet-emoji">🐱</div>
    <div class="pet-info">
      <div class="pet-name">Печенько-кот</div>
      <div class="pet-desc">+${pct}% к пассиву (${lvl}/${PET_MAX})</div>
      <div class="pet-lvl">${lvl<PET_MAX?'🌟 '+cost+' за следующий уровень':'Максимальный уровень'}</div>
    </div>
    <button class="pet-buy-btn" ${can?'':'disabled'} id="pet-buy-btn">${lvl<PET_MAX?'Прокачать':'МАКС'}</button>
  </div>`;
  const b = document.getElementById('pet-buy-btn');
  if (b && can) b.addEventListener('click', buyPet);
}

// ── MISSIONS ────────────────────────────────────────────────────────────
function generateMissions(){
  const pool = MISSION_TEMPLATES.slice();
  const picked = [];
  for (let i = 0; i < 3 && pool.length > 0; i++){
    const idx = Math.random() * pool.length | 0;
    const tpl = pool.splice(idx, 1)[0];
    const scale = Math.max(1, Math.log10(Math.max(100, G.totalCookies)) / 3);
    const target = Math.max(1, Math.round(tpl.baseTarget * scale * (.8 + Math.random()*.4)));
    picked.push({ id: tpl.id, target, progress: 0, claimed: false });
  }
  G.missions = picked;
  G.missionDay = todayStr();
}
function checkDailyMissions(){
  if (G.missionDay !== todayStr()){ generateMissions(); save(); return; }
  if (!Array.isArray(G.missions) || G.missions.length === 0){ generateMissions(); save(); }
}
function missionTpl(id){ return MISSION_TEMPLATES.find(t => t.id === id); }
function missionProgress(kind, inc){
  if (!G.missions || G.missions.length === 0) return;
  let touched = false;
  for (const m of G.missions){
    if (m.claimed) continue;
    if (m.id === kind || (kind === 'clicks' && m.id === 'click_burst')){
      m.progress = Math.min(m.target, (m.progress||0) + inc);
      touched = true;
    }
  }
  if (touched && activeTab === 'powerups' && panelOpen) renderMissions();
}
function setMissionProgress(kind, value){
  if (!G.missions || G.missions.length === 0) return;
  for (const m of G.missions){
    if (m.claimed) continue;
    if (m.id === kind){
      m.progress = Math.min(m.target, Math.max(m.progress||0, value));
    }
  }
  if (activeTab === 'powerups' && panelOpen) renderMissions();
}
function claimMission(idx){
  const m = G.missions[idx]; if (!m || m.claimed || m.progress < m.target) return;
  const tpl = missionTpl(m.id);
  const reward = Object.assign({}, tpl.reward);
  if (reward.boost) reward.boost = Object.assign({}, reward.boost);
  applyReward(reward);
  m.claimed = true;
  G.missionsClaimed = (G.missionsClaimed||0) + 1;
  showRewardPopup(reward.icon || tpl.icon, reward.label || (reward.type === 'bricks' ? '+' + reward.val + ' 🧱' : '+1 буст'));
  spawnConfetti(innerWidth/2, innerHeight/2.6, 30);
  playUpgrade(); save(); renderMissions(); scheduleRender();
}
function renderMissions(){
  const list = document.getElementById('missions-list'); if (!list) return;
  if (!G.missions || G.missions.length === 0){
    list.innerHTML = '<div class="no-boosts">Загрузка заданий...</div>'; return;
  }
  list.innerHTML = G.missions.map((m,i) => {
    const tpl = missionTpl(m.id); if (!tpl) return '';
    const done = m.progress >= m.target && !m.claimed;
    const label = tpl.label.replace('{t}', fmt(m.target));
    const pct = Math.min(100, Math.floor(m.progress/m.target*100));
    const reward = tpl.reward;
    const rIcon = reward.type==='bricks'?'🧱':reward.type==='cookies_pct'?'🍪':(reward.boost&&reward.boost.icon)||'⚡';
    const rVal  = reward.type==='bricks'?fmt(reward.val):reward.type==='cookies_pct'?'+'+reward.val+'%':'×'+reward.boost.mul;
    return `<div class="mission-card${done?' done':''}${m.claimed?' claimed':''}">
      <div class="mission-icon">${tpl.icon}</div>
      <div class="mission-info">
        <div class="mission-name">${label}</div>
        <div class="mission-progress-bar"><div class="mission-progress-fill" style="width:${pct}%"></div></div>
        <div class="mission-progress-text">${fmt(m.progress)}/${fmt(m.target)}</div>
      </div>
      <button class="mission-reward-btn" data-midx="${i}" ${done?'':'disabled'}>
        <span class="mr-icon">${m.claimed?'✓':rIcon}</span>
        <span class="mr-val">${m.claimed?'Забрано':rVal}</span>
      </button>
    </div>`;
  }).join('');
  list.querySelectorAll('.mission-reward-btn').forEach(b => {
    b.addEventListener('click', () => { const i = +b.dataset.midx; claimMission(i); });
  });
}

// ── DAILY STREAK ────────────────────────────────────────────────────────
const STREAK_REWARDS = [
  null,
  { icon:'🍪', label:'+1% печенек',       apply:()=>{ const g=Math.max(50,Math.floor(G.totalCookies*.01)); G.cookies+=g; G.totalCookies+=g; } },
  { icon:'🧱', label:'+25 кирпичей',      apply:()=>{ if(G.bricksUnlocked){ G.bricks+=25; G.totalBricks+=25; } } },
  { icon:'⚡', label:'×3 клик 5 мин',     apply:()=>addBoost('streak3','Стрик-клик','⚡','click',3,300000) },
  { icon:'🍪', label:'+3% печенек',       apply:()=>{ const g=Math.max(100,Math.floor(G.totalCookies*.03)); G.cookies+=g; G.totalCookies+=g; } },
  { icon:'🧱', label:'+80 кирпичей',      apply:()=>{ if(G.bricksUnlocked){ G.bricks+=80; G.totalBricks+=80; } } },
  { icon:'🎉', label:'×5 ВСЁ 5 мин',      apply:()=>addBoost('streak6','Стрик-пир','🎉','all',5,300000) },
  { icon:'⭐', label:'+8% печенек + 🌟+1', apply:()=>{ const g=Math.max(200,Math.floor(G.totalCookies*.08)); G.cookies+=g; G.totalCookies+=g; G.prestigePoints=(G.prestigePoints||0)+1; } },
];
function streakReward(day){
  if (day <= 0) return STREAK_REWARDS[1];
  if (day <= 7) return STREAK_REWARDS[day] || STREAK_REWARDS[1];
  return STREAK_REWARDS[((day-1) % 6) + 1];
}
function checkDailyStreak(){
  const today = todayStr();
  if (G.lastLoginDay !== today){
    if (G.lastLoginDay){
      const y = new Date(); y.setDate(y.getDate()-1);
      const yStr = y.getFullYear() + '-' + String(y.getMonth()+1).padStart(2,'0') + '-' + String(y.getDate()).padStart(2,'0');
      if (G.lastLoginDay === yStr) G.loginStreak++;
      else G.loginStreak = 1;
    } else G.loginStreak = 1;
    G.lastLoginDay = today;
    if (G.loginStreak > (G.bestStreak||0)) G.bestStreak = G.loginStreak;
    save();
  }
  if (G.streakClaimedDay !== today) showStreakModal();
}
function showStreakModal(){
  const m = document.getElementById('streak-modal');
  document.getElementById('streak-count').textContent = G.loginStreak;
  const days = document.getElementById('streak-days');
  const cur = Math.min(7, G.loginStreak);
  let html = '';
  for (let i = 1; i <= 7; i++){
    const cls = [];
    if (i < cur) cls.push('done');
    if (i === cur) cls.push('today','done');
    if (i === 7) cls.push('bonus');
    html += `<div class="streak-day ${cls.join(' ')}">${i}</div>`;
  }
  days.innerHTML = html;
  const r = streakReward(G.loginStreak);
  document.getElementById('streak-reward-icon').textContent = r.icon;
  document.getElementById('streak-reward-label').textContent = r.label;
  m.classList.add('show');
}
document.getElementById('streak-claim').addEventListener('click', () => {
  if (G.streakClaimedDay === G.lastLoginDay){
    document.getElementById('streak-modal').classList.remove('show'); return;
  }
  const r = streakReward(G.loginStreak);
  r.apply();
  G.streakClaimedDay = G.lastLoginDay;
  spawnConfetti(innerWidth/2, innerHeight/3, 55);
  playPrestige();
  document.getElementById('streak-modal').classList.remove('show');
  save(); scheduleRender();
});

// ── COOKIE RAIN ─────────────────────────────────────────────────────────
let rainActive = false;
function scheduleNextRain(){
  if (!G.nextRainAt || G.nextRainAt < Date.now())
    G.nextRainAt = Date.now() + (RAIN_MIN + Math.random() * (RAIN_MAX - RAIN_MIN));
}
function maybeStartRain(){
  if (rainActive) return;
  if (G.totalCookies < 10000) return;
  if (Date.now() < G.nextRainAt) return;
  startRain();
}
function startRain(){
  rainActive = true;
  G.nextRainAt = Date.now() + (RAIN_MIN + Math.random() * (RAIN_MAX - RAIN_MIN));
  const banner = document.getElementById('rain-banner');
  banner.classList.add('show');
  setTimeout(() => banner.classList.remove('show'), 3000);
  playGoldenSpawn();
  let i = 0;
  const total = 30;
  const it = setInterval(() => {
    if (i >= total){ clearInterval(it); return; }
    spawnRainCookie(); i++;
  }, 340);
  setTimeout(() => { rainActive = false; }, 14000);
}
function spawnRainCookie(){
  const el = document.createElement('div');
  el.className = 'rain-cookie';
  const x = 20 + Math.random() * (innerWidth - 80);
  const dur = 4 + Math.random() * 3;
  el.style.left = x + 'px';
  el.style.top = '-60px';
  el.style.animation = `rainFall ${dur}s linear forwards`;
  el.textContent = '🍪';
  el.addEventListener('click', e => collectRainCookie(e, el), {once:true});
  el.addEventListener('touchstart', e => { e.preventDefault(); collectRainCookie(e, el); }, {once:true, passive:false});
  document.body.appendChild(el);
  setTimeout(() => { if (el.parentNode) el.remove(); }, dur*1000+200);
}
function collectRainCookie(e, el){
  if (el.classList.contains('caught')) return;
  el.classList.add('caught');
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width/2, cy = r.top + r.height/2;
  const gain = Math.max(100, Math.floor(G.totalCookies * 0.005));
  G.cookies += gain; G.totalCookies += gain;
  G.rainCookiesCollected = (G.rainCookiesCollected||0) + 1;
  if (G.rainCookiesCollected >= 30) G.rainsCaught = (G.rainsCaught||0) + 1;
  spawnFloat(cx, cy, gain, 'gold', '+');
  spawnCrumbs(cx, cy, 8, false);
  playCoin();
  setTimeout(() => el.remove(), 350);
  scheduleRender();
}
// ключевые кадры для падения добавляем динамически (зависят от innerHeight)
(function(){
  const s = document.createElement('style');
  s.textContent = '@keyframes rainFall{from{transform:translateY(0) rotate(0)}to{transform:translateY(' + (innerHeight + 120) + 'px) rotate(720deg)}}';
  document.head.appendChild(s);
})();

// ── POWERUPS TAB RENDER ─────────────────────────────────────────────────
function renderPowerups(){
  renderMissions();
  renderPet();

  const ab = document.getElementById('active-boosts-pane');
  const now = Date.now();
  G.activeBoosts = G.activeBoosts.filter(b => b.untilTs > now);
  if (G.activeBoosts.length === 0){
    ab.innerHTML = '<div class="no-boosts">Нет активных эффектов. Купите буст или дождитесь сундука!</div>';
  } else {
    ab.innerHTML = G.activeBoosts.map(b => {
      const left = b.untilTs - now;
      return `<div class="boost-active-card t-${b.type}">
        <div class="bac-icon">${b.icon}</div>
        <div><div class="bac-name">${b.name}</div><div class="bac-mul">×${b.mul} ${b.type==='click'?'клик':b.type==='cps'?'пассив':'ВСЁ'}</div></div>
        <div class="bac-time">${fmtCooldown(left)}</div>
      </div>`;
    }).join('');
  }

  const list = document.getElementById('powerups-list');
  let aff = false;
  list.innerHTML = POWERUPS.map(p => {
    const can = G.bricksUnlocked && G.bricks >= p.cost;
    if (can) aff = true;
    return `<div class="item-card brick-card${can?' affordable':''}">
      <div class="item-icon">${p.icon}</div>
      <div class="item-info"><div class="item-name">${p.name}</div><div class="item-desc">${p.desc}</div></div>
      <div class="item-right"><div class="item-cost bk ${can?'':'cant'}">🧱 ${fmt(p.cost)}</div>
      <button class="buy-btn bk" ${!can?'disabled':''} data-pid="${p.id}">Купить</button></div></div>`;
  }).join('');
  document.getElementById('hn-powerups').className = 'hnotif' + ((aff||chestState()||spinState())?' show':'');
  refreshFreebieTimers();
}
document.getElementById('powerups-list').addEventListener('click', e => {
  const btn = e.target.closest('.buy-btn'); if (!btn || btn.disabled) return;
  const p = POWERUPS.find(x => x.id === btn.dataset.pid);
  if (p) buyPowerup(p);
});

function refreshFreebieTimers(){
  const ct = document.getElementById('chest-timer');
  const st = document.getElementById('spin-timer');
  if (!ct || !st) return;
  const cl = Math.max(0, G.chestReadyAt - Date.now());
  const sl = Math.max(0, G.spinReadyAt - Date.now());
  ct.textContent = fmtCooldown(cl);
  st.textContent = fmtCooldown(sl);
  document.getElementById('chest-card').classList.toggle('cooldown', cl > 0);
  document.getElementById('spin-card').classList.toggle('cooldown', sl > 0);
  document.getElementById('chest-open-btn').disabled = cl > 0;
  document.getElementById('spin-open-btn').disabled = sl > 0;
}

function updateBoostStrip(){
  const strip = document.getElementById('boost-strip');
  const now = Date.now();
  G.activeBoosts = G.activeBoosts.filter(b => b.untilTs > now);
  if (G.activeBoosts.length === 0){ strip.innerHTML = ''; return; }
  strip.innerHTML = G.activeBoosts.map(b => {
    const left = Math.ceil((b.untilTs - now) / 1000);
    return `<div class="boost-chip t-${b.type}">${b.icon}<span class="bc-mul">×${b.mul}</span><span class="bc-time">${left}с</span></div>`;
  }).join('');
}

// ── THEME GRID ──────────────────────────────────────────────────────────
function renderThemeGrid(){
  const grid = document.getElementById('theme-grid');
  if (!grid) return;
  const eff = effectiveTheme();
  const items = [{ id:'auto', name:'Авто', icon:'🌐', preview: THEMES[eff].emojis }].concat(
    Object.keys(THEMES).map(k => ({ id:k, name:THEMES[k].name, icon:THEMES[k].icon, preview:THEMES[k].emojis }))
  );
  grid.innerHTML = items.map(it => {
    const active = G.theme === it.id;
    const prev = it.preview.slice(0, 4).join(' ');
    return `<div class="theme-card${active?' active':''}" data-tid="${it.id}">
      <div class="tc-preview">${prev}</div>
      <div class="tc-name">${it.icon} ${it.name}</div>
      <div class="tc-active-mark">✓ Выбрано</div>
    </div>`;
  }).join('');
}
document.getElementById('theme-grid').addEventListener('click', e => {
  const card = e.target.closest('.theme-card'); if (!card) return;
  G.theme = card.dataset.tid;
  applyTheme();
  playTab();
  renderThemeGrid();
  save();
});

// ── APPLY THEME WRAPPER (обновляет музыку, скин, стадию вместе с темой) ──
const _origApplyTheme = applyTheme;
applyTheme = function(){
  _origApplyTheme();
  applyMusicForTheme();
  applySkin();
  applyCookieStage();
};

// ── PER-SECOND TRACKERS ─────────────────────────────────────────────────
setInterval(() => {
  if (clicksThisSecond > G.cpsRecord) G.cpsRecord = clicksThisSecond;
  clicksThisSecond = 0;
}, 1000);

// Mission progress polling — отслеживаем дельты состояния
let lastTotalForMissions    = G.totalCookies;
let lastCritsForMissions    = G.crits || 0;
let lastShopBoughtForMissions    = Object.values(G.shop).reduce((s,v)=>s+v, 0);
let lastUpgradeBoughtForMissions = Object.values(G.upgrades).reduce((s,v)=>s+v, 0);
let lastChestsForMissions   = G.chestsOpened || 0;
let lastGoldenForMissions   = G.goldenCaught || 0;
setInterval(() => {
  const dEarn = G.totalCookies - lastTotalForMissions;
  if (dEarn > 0){ missionProgress('earn', dEarn); missionProgress('earn_big', dEarn); lastTotalForMissions = G.totalCookies; }
  const curCrits = G.crits||0;
  if (curCrits > lastCritsForMissions){ missionProgress('crit', curCrits - lastCritsForMissions); lastCritsForMissions = curCrits; }
  const curShop = Object.values(G.shop).reduce((s,v)=>s+v, 0);
  if (curShop > lastShopBoughtForMissions){ missionProgress('shop', curShop - lastShopBoughtForMissions); lastShopBoughtForMissions = curShop; }
  const curUpg = Object.values(G.upgrades).reduce((s,v)=>s+v, 0);
  if (curUpg > lastUpgradeBoughtForMissions){ missionProgress('upgrade', curUpg - lastUpgradeBoughtForMissions); lastUpgradeBoughtForMissions = curUpg; }
  const curChest = G.chestsOpened || 0;
  if (curChest > lastChestsForMissions){ missionProgress('chest', curChest - lastChestsForMissions); lastChestsForMissions = curChest; }
  const curGolden = G.goldenCaught || 0;
  if (curGolden > lastGoldenForMissions){ missionProgress('golden', curGolden - lastGoldenForMissions); lastGoldenForMissions = curGolden; }
  if (comboMul > 1.05) setMissionProgress('combo', Math.round(comboMul*100)/100);
}, 500);

// Mastery + stage refresh — раз в 2 сек, не на каждый клик
let _lastMasteryBonus = -1;
function refreshMasteryAndStage(){
  const bonus = getMasteryBonus();
  if (bonus !== _lastMasteryBonus){
    _lastMasteryBonus = bonus;
    recalcClickPower();
    const mb = document.getElementById('mastery-badge');
    if (bonus > 0){
      mb.classList.add('visible');
      document.getElementById('mastery-val').textContent = bonus.toFixed(1);
    } else mb.classList.remove('visible');
  }
  applyCookieStage();
}
setInterval(refreshMasteryAndStage, 2000);

// ── INIT ────────────────────────────────────────────────────────────────
load();
applyTheme();
applySkin();
applyCookieStage();
applyPet();
recalcCPS(); recalcClickPower(); recalcBPS();
updateBoostStrip();
checkBossSpawn();
checkDailyMissions();
checkDailyStreak();
scheduleNextRain();
setInterval(maybeStartRain, 30000);
if (G.bossPendingThreshold > 0) bossIconEl.classList.add('show');
doRender();

// Preload остальных скинов в idle, чтобы переключение было мгновенным
(function preloadSkins(){
  const ALL = ['classic','golden','gingerbread','pumpkin','snow','diamond','rainbow'];
  const cur = G.skinId || 'classic';
  const queue = ALL.filter(id => id !== cur);
  function loadOne(){
    const id = queue.shift();
    if (!id) return;
    const img = new Image();
    img.onload = img.onerror = () => schedule(loadOne);
    img.src = 'assets/skins/' + id + '.webp';
  }
  function schedule(fn){
    if (typeof requestIdleCallback === 'function') requestIdleCallback(fn, {timeout:3000});
    else setTimeout(fn, 300);
  }
  setTimeout(() => schedule(loadOne), 4000);
})();

// ── Service Worker ──────────────────────────────────────────────────────
if ('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
