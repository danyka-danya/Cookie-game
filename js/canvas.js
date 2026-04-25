// ═══════════════════════════════════════════════════════════════════════
//  canvas.js — анимированный фон + crumb particles
//  Зависит: data.js (currentBgEmojis, CANVAS_DPR, CRUMB_MAX)
// ═══════════════════════════════════════════════════════════════════════

// ── ANIMATED BACKGROUND ─────────────────────────────────────────────────
(function(){
  const cv = document.getElementById('bg-canvas'), ctx = cv.getContext('2d');
  const DPR = CANVAS_DPR;
  let parts = [];
  function resize(){
    cv.width = innerWidth * DPR;
    cv.height = innerHeight * DPR;
    cv.style.width = innerWidth + 'px';
    cv.style.height = innerHeight + 'px';
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(DPR, DPR);
  }
  function mk(layer){
    const isBack = layer === 'back';
    return {
      e:   currentBgEmojis[Math.random()*currentBgEmojis.length|0],
      x:   Math.random() * innerWidth,
      y:   innerHeight + 30,
      sz:  isBack ? 22+Math.random()*22 : 11+Math.random()*14,
      vx:  (Math.random()-.5) * (isBack ? .18 : .42),
      vy:  isBack ? -.12-Math.random()*.18 : -.28-Math.random()*.42,
      rot: Math.random() * Math.PI * 2,
      vr:  (Math.random()-.5) * (isBack ? .008 : .024),
      a:   0, life: 0,
      maxL: isBack ? (580+Math.random()*340) : (380+Math.random()*240),
      maxA: isBack ? .085 : .18,
      layer: layer,
    };
  }
  for (let i=0; i<8; i++)  { const p = mk('back');  p.y = Math.random()*innerHeight; p.life = Math.random()*p.maxL; p.a = Math.random()*p.maxA; parts.push(p); }
  for (let i=0; i<18; i++) { const p = mk('front'); p.y = Math.random()*innerHeight; p.life = Math.random()*p.maxL; p.a = Math.random()*p.maxA; parts.push(p); }
  function draw(){
    if (document.hidden) { setTimeout(draw, 500); return; } // спим во вкладке-задней
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = parts.length-1; i >= 0; i--){
      const p = parts[i];
      p.life++; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      if (p.a < p.maxA) p.a += p.maxA * .015;
      if (p.life > p.maxL - 80) p.a = Math.max(0, p.a - p.maxA*.018);
      if (p.life >= p.maxL) { parts.splice(i,1); parts.push(mk(p.layer)); continue; }
      ctx.save();
      ctx.globalAlpha = p.a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.font = p.sz + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.e, 0, 0);
      ctx.restore();
    }
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize();
  draw();
})();

// ── CRUMB PARTICLES ─────────────────────────────────────────────────────
const crumbCv  = document.getElementById('crumb-canvas');
const crumbCtx = crumbCv.getContext('2d');
let crumbs = [];
function crumbResize(){
  crumbCv.width  = innerWidth  * CANVAS_DPR;
  crumbCv.height = innerHeight * CANVAS_DPR;
  crumbCv.style.width  = innerWidth  + 'px';
  crumbCv.style.height = innerHeight + 'px';
  crumbCtx.setTransform(1,0,0,1,0,0);
  crumbCtx.scale(CANVAS_DPR, CANVAS_DPR);
}
crumbResize();
window.addEventListener('resize', crumbResize);

function spawnCrumbs(x, y, n, isCrit){
  const colors = ['#7A3500','#5C2A00','#3B1A00','#A0522D','#8B4513'];
  if (crumbs.length > CRUMB_MAX) crumbs.splice(0, crumbs.length - CRUMB_MAX + n);
  for (let i = 0; i < n; i++){
    const ang = Math.random() * Math.PI * 2;
    const sp = 2.5 + Math.random() * 4.5;
    crumbs.push({
      x, y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - 2.5,
      g: .32, life: 0, maxL: 42 + Math.random()*22,
      sz: 2.5 + Math.random()*3.2,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random()-.5) * .4,
      col: isCrit ? '#FFD86B' : colors[Math.random()*colors.length|0],
      isCrit,
    });
  }
  ensureCrumbLoop();
}

function spawnConfetti(x, y, n){
  const colors = ['#FF6B00','#FFD86B','#7B2FBE','#4CAF50','#E74C3C','#3498DB','#FFFFFF','#FF8FE0'];
  for (let i = 0; i < n; i++){
    const ang = Math.random() * Math.PI * 2;
    const sp = 4 + Math.random() * 7;
    crumbs.push({
      x, y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - 5,
      g: .22, life: 0, maxL: 80 + Math.random()*40,
      sz: 4 + Math.random()*4,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random()-.5) * .55,
      col: colors[Math.random()*colors.length|0],
      isConfetti: true,
    });
  }
  ensureCrumbLoop();
}

let crumbRafActive = false;
function tickCrumbs(){
  if (crumbs.length === 0){
    crumbCtx.clearRect(0, 0, innerWidth, innerHeight);
    crumbRafActive = false;
    return; // выходим из RAF когда нет работы
  }
  crumbCtx.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = crumbs.length-1; i >= 0; i--){
    const c = crumbs[i];
    c.x += c.vx; c.y += c.vy; c.vy += c.g; c.rot += c.vr; c.life++;
    if (c.life >= c.maxL){ crumbs.splice(i,1); continue; }
    const a = 1 - c.life / c.maxL;
    crumbCtx.save();
    crumbCtx.globalAlpha = a;
    crumbCtx.translate(c.x, c.y);
    crumbCtx.rotate(c.rot);
    crumbCtx.fillStyle = c.col;
    if (c.isCrit){ crumbCtx.shadowColor = '#FFD86B'; crumbCtx.shadowBlur = 8; }
    if (c.isConfetti){
      crumbCtx.fillRect(-c.sz, -c.sz/2.2, c.sz*2, c.sz);
    } else {
      crumbCtx.beginPath();
      crumbCtx.ellipse(0, 0, c.sz*1.2, c.sz*.8, 0, 0, Math.PI*2);
      crumbCtx.fill();
    }
    crumbCtx.restore();
  }
  requestAnimationFrame(tickCrumbs);
}
function ensureCrumbLoop(){
  if (crumbRafActive) return;
  crumbRafActive = true;
  requestAnimationFrame(tickCrumbs);
}
