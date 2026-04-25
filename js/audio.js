// ═══════════════════════════════════════════════════════════════════════
//  audio.js — звуковой движок + музыка по темам
//  Зависит: data.js (MUSIC_PATTERNS, effectiveTheme)
// ═══════════════════════════════════════════════════════════════════════

let audioCtx = null;
let sfxEnabled = true;
let musicEnabled = true;
let musicGain = null;
let musicStarted = false;

function getACtx(){
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function ensureAudio(){
  const ctx = getACtx();
  if (ctx.state === 'suspended') ctx.resume();
  if (!musicStarted) { musicStarted = true; startMusic(); }
}

// ── SFX ─────────────────────────────────────────────────────────────────
let _lastCrunchAt = 0;
function playCrunch(){
  if (!sfxEnabled) return;
  const now = performance.now();
  if (now - _lastCrunchAt < 35) return; // до 28/сек, иначе iOS Audio задыхается
  _lastCrunchAt = now;
  try{
    const ctx = getACtx();
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate*.07), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/d.length, 1.8) * .65;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(.32, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .07);
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start(); src.stop(ctx.currentTime + .08);
  }catch(e){}
}
function playCrit(){
  if (!sfxEnabled) return;
  try{
    const ctx = getACtx(), now = ctx.currentTime;
    [880,1320,1760,2200].forEach((f,i)=>{
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = ctx.createGain(); const t = now + i*.04;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(.18, t+.02);
      g.gain.exponentialRampToValueAtTime(.001, t+.18);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t+.2);
    });
  }catch(e){}
}
function playGoldenSpawn(){
  if (!sfxEnabled) return;
  try{
    const ctx = getACtx(), now = ctx.currentTime;
    [659,784,988,1319].forEach((f,i)=>{
      const o = ctx.createOscillator(); o.type='sine'; o.frequency.value=f;
      const g = ctx.createGain(); const t = now + i*.05;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(.16, t+.025);
      g.gain.exponentialRampToValueAtTime(.001, t+.25);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t+.27);
    });
  }catch(e){}
}
function playGoldenTap(){
  if (!sfxEnabled) return;
  try{
    const ctx = getACtx(), now = ctx.currentTime;
    [523,659,784,988,1319,1568].forEach((f,i)=>{
      const o = ctx.createOscillator(); o.type='triangle'; o.frequency.value=f;
      const g = ctx.createGain(); const t = now + i*.06;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(.22, t+.03);
      g.gain.exponentialRampToValueAtTime(.001, t+.28);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t+.3);
    });
  }catch(e){}
}
function playCoin(){
  if (!sfxEnabled) return;
  try{
    const ctx = getACtx(), now = ctx.currentTime;
    const o = ctx.createOscillator(); o.type='sine';
    o.frequency.setValueAtTime(900, now);
    o.frequency.exponentialRampToValueAtTime(1500, now+.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(.22, now);
    g.gain.exponentialRampToValueAtTime(.001, now+.2);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now+.22);
  }catch(e){}
}
function playUpgrade(){
  if (!sfxEnabled) return;
  try{
    const ctx = getACtx(), now = ctx.currentTime;
    [523,659,784,1047].forEach((f,i)=>{
      const o = ctx.createOscillator(); o.type='triangle'; o.frequency.value=f;
      const g = ctx.createGain(); const t = now + i*.07;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(.18, t+.03);
      g.gain.exponentialRampToValueAtTime(.001, t+.18);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t+.2);
    });
  }catch(e){}
}
function playTab(){
  if (!sfxEnabled) return;
  try{
    const ctx = getACtx(), now = ctx.currentTime;
    const o = ctx.createOscillator(); o.type='sine'; o.frequency.value=520;
    const g = ctx.createGain();
    g.gain.setValueAtTime(.1, now);
    g.gain.exponentialRampToValueAtTime(.001, now+.09);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now+.1);
  }catch(e){}
}
function playPrestige(){
  if (!sfxEnabled) return;
  try{
    const ctx = getACtx(), now = ctx.currentTime;
    [392,523,659,784,1047,1319,1568].forEach((f,i)=>{
      const o = ctx.createOscillator(); o.type='sine'; o.frequency.value=f;
      const g = ctx.createGain(); const t = now + i*.085;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(.25, t+.04);
      g.gain.exponentialRampToValueAtTime(.001, t+.3);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t+.35);
    });
  }catch(e){}
}
function playUnlock(){
  if (!sfxEnabled) return;
  try{
    const ctx = getACtx(), now = ctx.currentTime;
    [330,440,550,660,825].forEach((f,i)=>{
      const o = ctx.createOscillator(); o.type='square'; o.frequency.value=f;
      const g = ctx.createGain(); const t = now + i*.06;
      g.gain.setValueAtTime(.13, t);
      g.gain.exponentialRampToValueAtTime(.001, t+.14);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t+.15);
    });
  }catch(e){}
}

// ── BACKGROUND MUSIC (per-theme) ────────────────────────────────────────
let currentMusic = MUSIC_PATTERNS.classic;
function applyMusicForTheme(){
  const t = effectiveTheme();
  currentMusic = MUSIC_PATTERNS[t] || MUSIC_PATTERNS.classic;
}

function startMusic(){
  if (!musicEnabled) return;
  try{
    const ctx = getACtx();
    musicGain = ctx.createGain();
    musicGain.gain.value = .06;
    musicGain.connect(ctx.destination);
    let step = 0;
    function tick(){
      if (!musicGain) return;
      if (!musicEnabled) { setTimeout(tick, 100); return; }
      const p = currentMusic;
      const BEAT = 60 / p.bpm / 2;
      try{
        const ctx2 = getACtx(), now = ctx2.currentTime;
        const mIdx = p.melody[step % p.melody.length];
        const bIdx = p.bass[step % p.bass.length];
        if (mIdx >= 0){
          const f = p.scale[mIdx];
          const o  = ctx2.createOscillator(); o.type = p.wave;  o.frequency.value = f;
          const o2 = ctx2.createOscillator(); o2.type = 'sine'; o2.frequency.value = f*2;
          const g = ctx2.createGain();
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(.85, now+.018);
          g.gain.linearRampToValueAtTime(.5,  now+BEAT*.4);
          g.gain.linearRampToValueAtTime(0,   now+BEAT*.85);
          o.connect(g); o2.connect(g); g.connect(musicGain);
          o.start(now); o2.start(now); o.stop(now+BEAT); o2.stop(now+BEAT);
        }
        if (bIdx >= 0){
          const bf = p.scale[bIdx] * .5;
          const bo = ctx2.createOscillator(); bo.type='triangle'; bo.frequency.value=bf;
          const bg = ctx2.createGain();
          bg.gain.setValueAtTime(0, now);
          bg.gain.linearRampToValueAtTime(.7, now+.025);
          bg.gain.linearRampToValueAtTime(0,  now+BEAT*1.6);
          bo.connect(bg); bg.connect(musicGain);
          bo.start(now); bo.stop(now+BEAT*1.7);
        }
        if (step % 2 === 1){
          const buf = ctx2.createBuffer(1, Math.floor(ctx2.sampleRate*.04), ctx2.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/d.length, 3);
          const src = ctx2.createBufferSource(); src.buffer = buf;
          const hf = ctx2.createBiquadFilter(); hf.type='highpass'; hf.frequency.value=6500;
          const hg = ctx2.createGain();
          hg.gain.setValueAtTime(.12, now);
          hg.gain.exponentialRampToValueAtTime(.001, now+.05);
          src.connect(hf); hf.connect(hg); hg.connect(musicGain);
          src.start(now); src.stop(now+.06);
        }
        if (step % 8 === 0 || step % 8 === 4){
          const ko = ctx2.createOscillator(); ko.type='sine';
          ko.frequency.setValueAtTime(120, now);
          ko.frequency.exponentialRampToValueAtTime(45, now+.09);
          const kg = ctx2.createGain();
          kg.gain.setValueAtTime(.6, now);
          kg.gain.exponentialRampToValueAtTime(.001, now+.13);
          ko.connect(kg); kg.connect(musicGain);
          ko.start(now); ko.stop(now+.14);
        }
        step++;
      }catch(e){}
      setTimeout(tick, BEAT * 1000);
    }
    setTimeout(tick, 200);
  }catch(e){}
}
