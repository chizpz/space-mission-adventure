const W = 1080, H = 1920;
const cv = document.getElementById("c");
const ctx = cv.getContext("2d");

// ---------- утилиты ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const inv = (a, b, v) => clamp((v - a) / (b - a));
const ease = (k) => k * k * (3 - 2 * k);
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function ell(c, x, y, rx, ry, col) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = col; c.fill(); }
function glow(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col.replace("A", a)); g.addColorStop(1, col.replace("A", 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
function vgrad(c, y0, y1, stops) { const g = c.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; }
function vignette(c, k = 0.55) {
  const g = c.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.5, H * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${k})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function off(w, h, fn) { const o = document.createElement("canvas"); o.width = w; o.height = h; fn(o.getContext("2d"), w, h); return o; }

// ---------- палитра ----------
const SKIN = "#f4c8a8", SKIN_SH = "#e2ad8c", BLUSH = "rgba(240,120,130,0.45)";
const JUL = { hair: "#d9b36a", hairSh: "#b98f48", top: "#8fc6e8", topSh: "#6aa6cc", dress: true, eyes: "open" };
const MOM = { hair: "#3a2a22", hairSh: "#2a1d17", top: "#4f7d5c", topSh: "#3e6649", bun: true, eyes: "open" };
const DAD = { hair: "#5a4632", hairSh: "#45352a", top: "#b59a6a", topSh: "#9c8355", beard: true, glasses: true, short: true, eyes: "open" };
const CUTTER = { hair: "#1e1a18", hairSh: "#141110", top: "#c45a3a", topSh: "#a5482d", short: true, eyes: "open", hat: "#6b5a3a" };
const CUTTER2 = { hair: "#2a2220", hairSh: "#1a1514", top: "#3d6f8f", topSh: "#2f5a75", short: true, eyes: "open", skin: "#c99572" };

// ---------- персонаж (плоский, без обводки) ----------
// x,y = точка между ступнями, s = масштаб (1 = рост ~ 650 px)
function person(c, x, y, s, o, pose = {}) {
  const skin = o.skin || SKIN;
  c.save(); c.translate(x, y); c.scale(s, s);
  const bob = pose.bob || 0;
  c.translate(0, bob);
  // ноги
  if (!pose.noLegs) {
    const legCol = o.dress ? skin : "#23263b";
    const sw = pose.walk ? Math.sin(pose.walk) * 22 : 0;
    c.fillStyle = legCol;
    rr(c, -40 + sw, -175, 30, 170, 14); c.fill();
    rr(c, 10 - sw, -175, 30, 170, 14); c.fill();
    ell(c, -30 + sw, -8, 40, 16, pose.oneShoe ? "#e9e2d6" : "#f1f1f1");
    if (!pose.oneShoe) ell(c, 30 - sw, -8, 40, 16, "#f1f1f1"); else ell(c, 30 - sw, -8, 28, 12, skin);
  }
  // волосы сзади
  if (!o.short) {
    c.fillStyle = o.hairSh;
    if (pose.hairUp) {
      const L = 150 + Math.sin(pose.hairUp * 7) * 25;
      c.beginPath(); c.moveTo(-104, -560);
      c.bezierCurveTo(-150, -650 - L * 0.6, -60 + Math.sin(pose.hairUp * 9) * 20, -640 - L, 10, -650 - L);
      c.bezierCurveTo(80 + Math.sin(pose.hairUp * 8) * 20, -640 - L, 150, -650 - L * 0.5, 104, -560); c.closePath(); c.fill();
    } else { rr(c, -112, -650, 224, 300, 100); c.fill(); }
  }
  // тело
  const top = o.top, topSh = o.topSh;
  c.fillStyle = top;
  c.beginPath();
  if (o.dress) {
    c.moveTo(-88, -405); c.lineTo(88, -405); c.lineTo(132, -150); c.quadraticCurveTo(0, -128, -132, -150); c.closePath();
  } else {
    c.moveTo(-95, -405); c.lineTo(95, -405); c.lineTo(108, -165); c.quadraticCurveTo(0, -150, -108, -165); c.closePath();
  }
  c.fill();
  c.fillStyle = topSh; c.globalAlpha = 0.5;
  if (!o.dress) { rr(c, -55, -255, 110, 60, 14); c.fill(); }
  c.globalAlpha = 1;
  // руки
  const la = pose.armL || 0, ra = pose.armR || 0;
  for (const [sx, a] of [[-1, la], [1, ra]]) {
    c.save(); c.translate(sx * 92, -392); c.rotate(-sx * a);
    c.fillStyle = o.dress ? skin : top; rr(c, -24, 0, 48, 190, 24); c.fill();
    if (pose.cuts && sx === 1) {
      c.strokeStyle = "#b8323a"; c.lineWidth = 7; c.lineCap = "round";
      for (const [y0, dx] of [[40, 14], [75, -10], [112, 12]]) { c.beginPath(); c.moveTo(-14, y0); c.lineTo(14, y0 + dx * 0.6); c.stroke(); }
    }
    ell(c, 0, 200, 28, 28, skin);
    c.restore();
  }
  // шея и голова
  c.fillStyle = skin; rr(c, -24, -440, 48, 50, 10); c.fill();
  ell(c, 0, -530, 98, 110, skin);
  // волосы спереди
  c.fillStyle = o.hair;
  c.beginPath(); c.ellipse(0, -585, 104, 72, 0, Math.PI, 0); c.fill();
  if (!o.short && !pose.hairUp) { rr(c, -108, -600, 40, 170, 20); c.fill(); rr(c, 68, -600, 40, 170, 20); c.fill(); }
  if (o.bun) ell(c, 0, -665, 46, 40, o.hair);
  if (o.hat) { c.fillStyle = o.hat; c.beginPath(); c.ellipse(0, -600, 150, 26, 0, 0, Math.PI * 2); c.fill(); rr(c, -82, -690, 164, 95, 40); c.fill(); }
  // лицо
  const ey = -525, eyes = pose.eyes || o.eyes;
  c.fillStyle = "#2a1f24";
  if (eyes === "closed") {
    c.strokeStyle = "#2a1f24"; c.lineWidth = 6; c.lineCap = "round";
    for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 38, ey - 4, 16, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
  } else {
    const big = eyes === "wide" ? 1.35 : 1;
    for (const sx of [-1, 1]) {
      ell(c, sx * 38, ey, 21 * big, 22 * big, "#fff");
      ell(c, sx * 38 + (pose.look || 0) * 6, ey + 2, 10 * big, 10 * big, "#1d1a22");
      if (pose.tired) { c.fillStyle = SKIN_SH; c.fillRect(sx * 38 - 24, ey - 26, 48, 20); }
    }
  }
  if (pose.brows) {
    c.strokeStyle = o.hairSh; c.lineWidth = 8; c.lineCap = "round";
    for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 22, ey - 34 - (pose.brows > 0 ? 6 : 0)); c.lineTo(sx * 56, ey - 38 + pose.brows * 6); c.stroke(); }
  }
  if (o.glasses) {
    c.strokeStyle = "#2b2b33"; c.lineWidth = 6;
    for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 38, ey, 30, 0, Math.PI * 2); c.stroke(); }
    c.beginPath(); c.moveTo(-8, ey); c.lineTo(8, ey); c.stroke();
  }
  ell(c, -62, -480, 20, 12, BLUSH); ell(c, 62, -480, 20, 12, BLUSH);
  if (o.beard) { c.fillStyle = o.hair; c.beginPath(); c.ellipse(0, -470, 86, 62, 0, 0, Math.PI); c.fill(); }
  c.strokeStyle = "#5b3a3a"; c.lineWidth = 6; c.lineCap = "round";
  if (pose.mouth === "o") { ell(c, 0, -462, 12, 16, "#5b2f35"); }
  else if (pose.mouth === "smile") { c.beginPath(); c.arc(0, -478, 20, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke(); }
  else if (!o.beard) { c.beginPath(); c.moveTo(-18, -462); c.lineTo(18, -462); c.stroke(); }
  c.restore();
}

// ---------- окружение ----------
function cloudPuff(c, x, y, s, col) {
  c.fillStyle = col;
  for (const [dx, dy, r] of [[0, 0, 90], [80, 20, 70], [-85, 25, 65], [40, -40, 70], [-40, -30, 60], [130, 40, 50], [-130, 45, 45]]) {
    c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); c.fill();
  }
}
const CANOPY = off(1500, 2600, (c, w, h) => {
  const r = rng(7);
  c.fillStyle = "#123a24"; c.fillRect(0, 0, w, h);
  const greens = ["#1d5a33", "#24703c", "#2f8545", "#174d2c", "#3a9a50", "#1a6136"];
  for (let i = 0; i < 2600; i++) {
    const x = r() * w, y = r() * h, s = 22 + r() * 60;
    c.fillStyle = greens[(r() * greens.length) | 0];
    for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(x + (r() - 0.5) * s, y + (r() - 0.5) * s, s * (0.5 + r() * 0.4), 0, Math.PI * 2); c.fill(); }
    c.fillStyle = "rgba(160,220,120,0.18)"; c.beginPath(); c.arc(x - s * 0.2, y - s * 0.25, s * 0.35, 0, Math.PI * 2); c.fill();
  }
});
const LEAVES = off(1200, 2000, (c, w, h) => {
  const r = rng(21);
  for (let i = 0; i < 140; i++) {
    const x = r() * w, y = r() * h, s = 60 + r() * 140, a = r() * Math.PI * 2;
    c.save(); c.translate(x, y); c.rotate(a);
    c.fillStyle = ["#0f3a20", "#14502b", "#0b2c18"][(r() * 3) | 0];
    c.beginPath(); c.ellipse(0, 0, s, s * 0.38, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }
});
function canopy(c, ox, oy, sc) { c.save(); c.translate(W / 2, H / 2); c.scale(sc, sc); c.drawImage(CANOPY, -750 + ox, -1300 + oy); c.restore(); }

function seatRow(c, x, y, s, n = 3, col = "#3f5f9a") {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (let i = 0; i < n; i++) {
    const sx = (i - (n - 1) / 2) * 190;
    c.fillStyle = col; rr(c, sx - 80, -330, 160, 290, 34); c.fill();
    c.fillStyle = "rgba(255,255,255,0.12)"; rr(c, sx - 60, -320, 120, 50, 20); c.fill();
    c.fillStyle = "#2e4675"; rr(c, sx - 86, -60, 172, 70, 20); c.fill();
  }
  c.fillStyle = "#6b6f78"; c.fillRect(-(n * 190) / 2, 10, n * 190, 16);
  c.restore();
}
// девушка, сидящая в кресле (в ряду), вид спереди
function girlInSeat(c, x, y, s, pose = {}, n = 3) {
  seatRow(c, x, y, s, n);
  const px = x + (pose.slot !== undefined ? pose.slot : 0) * 190 * s;
  c.save();
  c.beginPath(); c.rect(px - 300 * s, y - 900 * s, 600 * s, 880 * s); c.clip();
  person(c, px, y + 150 * s, s, JUL, Object.assign({ noLegs: true }, pose));
  c.restore();
  // ноги свисают вперёд
  c.fillStyle = SKIN; rr(c, px - 50 * s, y - 20 * s, 32 * s, 170 * s, 14 * s); c.fill(); rr(c, px + 18 * s, y - 20 * s, 32 * s, 170 * s, 14 * s); c.fill();
  // ремень
  c.fillStyle = "#2b2f3a"; c.fillRect(px - 110 * s, y - 60 * s, 220 * s, 22 * s);
  c.fillStyle = "#c9ccd4"; rr(c, px - 26 * s, y - 66 * s, 52 * s, 34 * s, 6 * s); c.fill();
}

function plane(c, x, y, s, flip = 1) { // вид сбоку, 4 винта
  c.save(); c.translate(x, y); c.scale(s * flip, s);
  c.fillStyle = "#e8ebef"; rr(c, -300, -45, 600, 90, 45); c.fill();
  c.fillStyle = "#c4342f"; c.fillRect(-290, -4, 570, 14);
  c.fillStyle = "#e8ebef"; c.beginPath(); c.moveTo(-270, -40); c.lineTo(-330, -150); c.lineTo(-280, -150); c.lineTo(-200, -40); c.fill();
  c.fillStyle = "#c4342f"; c.beginPath(); c.moveTo(-300, -100); c.lineTo(-330, -150); c.lineTo(-280, -150); c.lineTo(-262, -100); c.fill();
  c.fillStyle = "#cfd3d9"; c.beginPath(); c.moveTo(-40, 10); c.lineTo(80, 10); c.lineTo(-10, 70); c.lineTo(-90, 70); c.fill();
  c.fillStyle = "#b7bcc4"; rr(c, 10, 10, 70, 26, 13); c.fill();
  c.fillStyle = "#2e3a55"; for (let i = 0; i < 13; i++) { c.beginPath(); c.arc(-220 + i * 36, -18, 8, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = "#2e3a55"; c.beginPath(); c.moveTo(250, -30); c.quadraticCurveTo(290, -28, 296, -5); c.lineTo(250, -5); c.fill();
  c.restore();
}
function planeTop(c, s) { // вид сверху, части отдельно: [фюзеляж-нос, хвост, левое крыло, правое крыло]
  return {
    nose: () => { c.fillStyle = "#e8ebef"; rr(c, -40, -300, 80, 330, 40); c.fill(); c.fillStyle = "#c4342f"; c.fillRect(-6, -290, 12, 310); },
    tail: () => { c.fillStyle = "#e8ebef"; rr(c, -36, 30, 72, 230, 30); c.fill(); c.fillStyle = "#dfe2e7"; c.beginPath(); c.moveTo(-120, 250); c.lineTo(120, 250); c.lineTo(30, 200); c.lineTo(-30, 200); c.fill(); },
    wingL: () => { c.fillStyle = "#d7dbe1"; c.beginPath(); c.moveTo(-40, -110); c.lineTo(-330, -40); c.lineTo(-330, 0); c.lineTo(-40, -40); c.fill(); c.fillStyle = "#b7bcc4"; for (const ex of [-130, -230]) { rr(c, ex - 16, -125, 32, 90, 14); c.fill(); } },
    wingR: () => { c.fillStyle = "#d7dbe1"; c.beginPath(); c.moveTo(40, -110); c.lineTo(330, -40); c.lineTo(330, 0); c.lineTo(40, -40); c.fill(); c.fillStyle = "#b7bcc4"; for (const ex of [130, 230]) { rr(c, ex - 16, -125, 32, 90, 14); c.fill(); } },
  };
}
function bolt(c, x0, y0, x1, y1, seed, wdt = 10) {
  const r = rng(seed), n = 9; c.strokeStyle = "#fffbe8"; c.lineWidth = wdt; c.lineJoin = "round";
  c.shadowColor = "#bfd4ff"; c.shadowBlur = 40;
  c.beginPath(); c.moveTo(x0, y0);
  for (let i = 1; i <= n; i++) { const k = i / n; c.lineTo(lerp(x0, x1, k) + (i < n ? (r() - 0.5) * 140 : 0), lerp(y0, y1, k)); }
  c.stroke(); c.shadowBlur = 0;
}
function rain(c, t, alpha = 0.35, n = 160) {
  const r = rng(99); c.strokeStyle = `rgba(190,210,255,${alpha})`; c.lineWidth = 3;
  c.beginPath();
  for (let i = 0; i < n; i++) { const x = r() * W, sp = 1800 + r() * 900, y = ((r() * H + t * sp) % (H + 200)) - 100; c.moveTo(x, y); c.lineTo(x - 18, y + 70); }
  c.stroke();
}
function water(c, y0, t, col1, col2) {
  c.fillStyle = vgrad(c, y0, H, [[0, col1], [1, col2]]); c.fillRect(0, y0, W, H - y0);
  c.strokeStyle = "rgba(255,255,255,0.18)"; c.lineWidth = 4;
  const r = rng(3);
  for (let i = 0; i < 26; i++) { const yy = y0 + 30 + r() * (H - y0), xx = ((r() * W + t * 90 * (0.5 + r())) % (W + 200)) - 100; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + 60 + r() * 60, yy); c.stroke(); }
}
function grain(c, t, a = 0.06) {
  const r = rng((t * 30) | 0); c.fillStyle = `rgba(255,255,255,${a})`;
  for (let i = 0; i < 500; i++) c.fillRect(r() * W, r() * H, 2, 2);
}

function lerp2(a, b, k) { const p = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(",")})`; }
function flashAt(t, ts) { let m = 0; for (const x of ts) { if (t >= x) m = Math.max(m, 1 - (t - x) / 0.35); } return clamp(m); }
// ---------- HUD ----------
function hudPill(text, t) {
  ctx.save(); ctx.font = "800 36px M"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  const w = ctx.measureText(text).width + 100;
  ctx.fillStyle = "rgba(10,8,20,0.62)"; rr(ctx, 30, 150, w, 76, 38); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 2; rr(ctx, 30, 150, w, 76, 38); ctx.stroke();
  ctx.fillStyle = (t * 1.6) % 1 < 0.6 ? "#ff3b3b" : "rgba(255,59,59,0.3)"; ell(ctx, 70, 188, 11, 11, ctx.fillStyle);
  ctx.fillStyle = "#e9e9f0"; ctx.fillText(text, 95, 190);
  ctx.restore();
}
let lastVal = null, lastChange = -9;
function hudCounter(label, value, t, col) {
  if (value !== lastVal) { lastVal = value; lastChange = t; }
  const pop = label === "ВЫСОТА" ? 1 : 1 + 0.25 * Math.max(0, 1 - (t - lastChange) / 0.2);
  ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const x = W - 360, y = 140, w = 330, h = 170;
  ctx.fillStyle = "rgba(12,10,20,0.75)"; rr(ctx, x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = "#e0303a"; ctx.lineWidth = 5; rr(ctx, x, y, w, h, 14); ctx.stroke();
  ctx.font = "800 26px M"; ctx.fillStyle = "#8d8fa0"; ctx.fillText(label, x + w / 2, y + 38);
  ctx.save(); ctx.translate(x + w / 2, y + 108); ctx.scale(pop, pop);
  ctx.font = "900 76px M"; ctx.fillStyle = col; ctx.fillText(value, 0, 0); ctx.restore();
  ctx.restore();
}

// ---------- субтитры ----------
const COLORS = { r: "#ff4d4d", y: "#ffd93b" };
function strokeText(s, x, y, size, fill) {
  ctx.font = `900 ${size}px M`;
  ctx.lineJoin = "round"; ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
  ctx.strokeStyle = "#0c0a12"; ctx.lineWidth = size * 0.16; ctx.strokeText(s, x, y);
  ctx.shadowColor = "transparent"; ctx.fillStyle = fill; ctx.fillText(s, x, y);
}
function subtitles(t) {
  const ch = CHUNKS.find((c) => t >= c.show && t < c.hide);
  if (!ch) return;
  const pop = easeOut(clamp((t - ch.show) / 0.12));
  if (ch.kind === "bubble") return bubble(ch, t, pop);
  let size = 112;
  ctx.font = `900 ${size}px M`;
  const space = size * 0.28;
  const widthOf = () => ch.words.reduce((a, w) => a + ctx.measureText(w.txt).width, 0) + space * (ch.words.length - 1);
  while (widthOf() > 960 && size > 60) { size -= 4; ctx.font = `900 ${size}px M`; }
  const total = widthOf();
  ctx.save(); ctx.translate(W / 2, 1248); ctx.scale(0.86 + 0.14 * pop, 0.86 + 0.14 * pop); ctx.globalAlpha = pop;
  ctx.textBaseline = "middle"; ctx.textAlign = "left";
  let x = -total / 2;
  for (const w of ch.words) {
    const spoken = t >= w.s;
    const fill = !spoken ? "rgba(150,150,165,0.85)" : w.color && COLORS[w.color] ? COLORS[w.color] : "#ffffff";
    strokeText(w.txt, x, 0, size, fill);
    x += ctx.measureText(w.txt).width + space;
  }
  ctx.restore();
}
function bubble(ch, t, pop) {
  let size = 88, ws, total, space, pad = 44;
  for (;;) {
    ctx.font = `900 ${size}px M`; space = size * 0.28;
    ws = ch.words.map((w) => ctx.measureText(w.txt).width);
    total = ws.reduce((a, b) => a + b, 0) + space * (ws.length - 1);
    if (total + pad * 2 + 30 <= W - 220 || size <= 50) break;
    size -= 4;
  }
  const bw = total + pad * 2 + 30, bh = 160, x0 = (W - bw) / 2 + 40, y0 = 1170;
  ctx.save(); ctx.globalAlpha = pop;
  ctx.translate(W / 2, y0 + bh / 2); ctx.scale(0.8 + 0.2 * pop, 0.8 + 0.2 * pop); ctx.translate(-W / 2, -(y0 + bh / 2));
  ctx.fillStyle = "#0c0a12"; rr(ctx, x0 - 8, y0 - 8, bw + 16, bh + 16, 60); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x0 + 40, y0 + bh); ctx.lineTo(x0 - 10, y0 + bh + 70); ctx.lineTo(x0 + 110, y0 + bh); ctx.fill();
  ctx.fillStyle = "#ffd93b"; rr(ctx, x0, y0, bw, bh, 54); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x0 + 48, y0 + bh - 4); ctx.lineTo(x0 + 2, y0 + bh + 54); ctx.lineTo(x0 + 104, y0 + bh - 4); ctx.fill();
  // аватар отца
  ctx.save(); ctx.beginPath(); ctx.arc(x0 - 30, y0 - 10, 62, 0, Math.PI * 2); ctx.fillStyle = "#f0d9b5"; ctx.fill(); ctx.clip();
  person(ctx, x0 - 30, y0 + 260, 0.5, DAD, { mouth: "smile" }); ctx.restore();
  ctx.strokeStyle = "#0c0a12"; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x0 - 30, y0 - 10, 62, 0, Math.PI * 2); ctx.stroke();
  ctx.textBaseline = "middle"; let x = x0 + pad + 15;
  ch.words.forEach((w, i) => {
    const spoken = t >= w.s;
    if (w.color === "k") { ctx.fillStyle = "#0c0a12"; rr(ctx, x - 14, y0 + 26, ws[i] + 28, bh - 52, 18); ctx.fill(); ctx.fillStyle = spoken ? "#ffd93b" : "rgba(255,217,59,0.4)"; }
    else ctx.fillStyle = spoken ? "#0c0a12" : "rgba(12,10,18,0.35)";
    ctx.fillText(w.txt, x, y0 + bh / 2 + 4);
    x += ws[i] + space;
  });
  ctx.restore();
}

