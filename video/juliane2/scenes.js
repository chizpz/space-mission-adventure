// Сцены второй версии. Опирается на lib.js (персонажи, окружение, HUD, субтитры) и timing.js.

// ---------- свет, глубина, плёнка ----------
const PL = document.createElement("canvas"); PL.width = W; PL.height = H; const pl = PL.getContext("2d");
const BL = document.createElement("canvas"); BL.width = W; BL.height = H; const bl = BL.getContext("2d");
const SNAP = document.createElement("canvas"); SNAP.width = W; SNAP.height = H; const snap = SNAP.getContext("2d");

// Персонаж с объёмом: тень с одной стороны, цветной свет с другой, контурный ободок.
function personLit(c, x, y, s, o, pose = {}, L = {}) {
  const dir = L.dir === undefined ? 1 : L.dir;
  const light = L.light || "rgba(255,210,150,0.35)";
  const shade = L.shade === undefined ? 0.38 : L.shade;
  const tint = L.tint || null;
  // тень на земле
  if (!pose.noLegs && L.ground !== false) { c.save(); c.globalAlpha = 0.35; ell(c, x + dir * -30 * s, y, 150 * s, 26 * s, "#000"); c.restore(); }
  pl.setTransform(1, 0, 0, 1, 0, 0); pl.clearRect(0, 0, W, H);
  pl.setTransform(c.getTransform());
  person(pl, x, y, s, o, pose);
  const m = c.getTransform();
  const p = m.transformPoint(new DOMPoint(x, y - 340 * s));
  const sw = 230 * s * Math.hypot(m.a, m.b);
  pl.setTransform(1, 0, 0, 1, 0, 0);
  pl.globalCompositeOperation = "source-atop";
  const g = pl.createLinearGradient(p.x - dir * sw, 0, p.x + dir * sw, 0);
  g.addColorStop(0, `rgba(8,10,30,${shade})`); g.addColorStop(0.45, "rgba(8,10,30,0)"); g.addColorStop(0.7, "rgba(0,0,0,0)"); g.addColorStop(1, light);
  pl.fillStyle = g; pl.fillRect(0, 0, W, H);
  const v = pl.createLinearGradient(0, p.y - sw * 1.4, 0, p.y + sw * 1.6);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, `rgba(0,0,10,${shade * 0.7})`);
  pl.fillStyle = v; pl.fillRect(0, 0, W, H);
  if (tint) { pl.fillStyle = tint; pl.fillRect(0, 0, W, H); }
  pl.globalCompositeOperation = "source-over";
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(PL, 0, 0); c.restore();
}
// Нарисовать слой с размытием (глубина резкости).
function blurred(px, fn) {
  bl.setTransform(1, 0, 0, 1, 0, 0); bl.clearRect(0, 0, W, H); fn(bl);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${px}px)`; ctx.drawImage(BL, 0, 0); ctx.filter = "none"; ctx.restore();
}
function rays(c, x, y, ang, n, len, a, col = "255,240,200") {
  c.save(); c.globalCompositeOperation = "lighter"; c.translate(x, y); c.rotate(ang);
  const r = rng(77);
  for (let i = 0; i < n; i++) {
    const off = (i - n / 2) * 110 + (r() - 0.5) * 60, wdt = 30 + r() * 70;
    const g = c.createLinearGradient(0, 0, 0, len); g.addColorStop(0, `rgba(${col},${a * (0.5 + r() * 0.5)})`); g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g; c.beginPath(); c.moveTo(off, 0); c.lineTo(off + wdt, 0); c.lineTo(off + wdt * 3, len); c.lineTo(off - wdt * 1.5, len); c.fill();
  }
  c.restore();
}
function motes(c, t, n, col, speed = 20) {
  const r = rng(31);
  for (let i = 0; i < n; i++) { const x = (r() * W + Math.sin(t * 0.6 + i) * 30) % W, y = ((r() * H - t * speed * (0.5 + r())) % H + H) % H; c.fillStyle = col; c.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t + i)); c.fillRect(x, y, 4, 4); }
  c.globalAlpha = 1;
}
function streaks(c, t, n, alpha, dir = -1, speed = 3200) {
  const r = rng(13); c.strokeStyle = `rgba(230,236,255,${alpha})`; c.lineWidth = 3;
  c.beginPath();
  for (let i = 0; i < n; i++) { const x = r() * W, len = 120 + r() * 260, y = (((r() * (H + 600)) + dir * t * speed * (0.6 + r() * 0.6)) % (H + 600) + H + 600) % (H + 600) - 300; c.moveTo(x, y); c.lineTo(x, y - dir * len); }
  c.stroke();
}
function grade(col, a, mode = "soft-light") { ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); }
function flash(a, col = "255,255,255") { if (a > 0) { ctx.fillStyle = `rgba(${col},${clamp(a)})`; ctx.fillRect(0, 0, W, H); } }
function fadeBlack(a) { if (a > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(a)})`; ctx.fillRect(0, 0, W, H); } }
function glitch(k, seed) {
  if (k <= 0) return;
  snap.setTransform(1, 0, 0, 1, 0, 0); snap.clearRect(0, 0, W, H); snap.drawImage(cv, 0, 0);
  const r = rng(seed);
  for (let i = 0; i < 14; i++) { const y = r() * H, h = 20 + r() * 140, dx = (r() - 0.5) * 220 * k; ctx.drawImage(SNAP, 0, y, W, h, dx, y, W, h); }
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.35 * k;
  ctx.drawImage(SNAP, 14 * k, 0); ctx.restore();
  ctx.fillStyle = `rgba(255,255,255,${0.08 * k})`; for (let i = 0; i < 40; i++) ctx.fillRect(0, r() * H, W, 2);
}
function sepia(a) { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = "color"; ctx.globalAlpha = a; ctx.fillStyle = "#8a6a44"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
function scratches(t, a) {
  const r = rng((t * 24) | 0); ctx.strokeStyle = `rgba(255,240,210,${a})`; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { const x = r() * W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (r() - 0.5) * 20, H); ctx.stroke(); }
}
function cloudWall(c, t, col, y0, n = 10, seed = 4, sp = 30) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) cloudPuff(c, (r() * (W + 400) - 200 + t * sp) % (W + 400) - 100, y0 + r() * 500, 1.4 + r() * 1.4, col);
}
function namePill(text, x, y) {
  ctx.save(); ctx.font = "900 44px M"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const w = ctx.measureText(text).width + 60;
  ctx.fillStyle = "#fff"; rr(ctx, x - w / 2, y - 38, w, 76, 38); ctx.fill();
  ctx.fillStyle = "#14121c"; ctx.fillText(text, x, y + 2); ctx.restore();
}

// ---------- кадры ----------
const ALT = (t) => Math.round(lerp(3000, 1200, inv(0, 6.37, t)) / 10) * 10;

function fallSky(t, k = 0) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#0d1124"], [0.55, "#222c46"], [1, "#2f3d4c"]]); ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.35 + k * 0.3; canopy(ctx, 0, -t * 60, 0.85 + k * 0.1); ctx.globalAlpha = 1;
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "rgba(13,17,36,1)"], [0.5, "rgba(13,17,36,0.4)"], [1, "rgba(13,17,36,0)"]]); ctx.fillRect(0, 0, W, H);
}
function fallClouds(t, a = 0.3, sp = 1500) {
  const r = rng(5);
  for (let i = 0; i < 10; i++) { const x = r() * W, y = H + 400 - ((t * sp * (0.6 + r() * 0.8) + r() * 2600) % (H + 900)); cloudPuff(ctx, x, y, 0.9 + r() * 1.3, `rgba(200,210,232,${a * (0.5 + r())})`); }
}
function shFall1(t) {
  fallSky(t); fallClouds(t, 0.25);
  const cy = 960 + Math.sin(t * 2) * 10;
  ctx.save(); ctx.translate(W / 2, cy); ctx.rotate(Math.sin(t * 1.7) * 0.12); ctx.translate(-W / 2, -cy);
  girlInSeat(ctx, W / 2, cy + 60, 0.75, { slot: 0, eyes: "wide", mouth: "o", armL: 0.6 + Math.sin(t * 6) * 0.1, armR: 0.7, brows: 1 });
  ctx.restore();
  streaks(ctx, t, 50, 0.35);
}
function shFall2(t) {
  fallSky(t, 0.4);
  const r = rng(9); for (let i = 0; i < 6; i++) cloudPuff(ctx, r() * W, ((r() * H + t * 900) % (H + 600)) - 300, 2.2 + r(), "rgba(190,200,225,0.18)");
  const x = 380 + Math.sin(t * 3) * 20, y = 1000;
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 1.8); ctx.translate(-x, -y);
  girlInSeat(ctx, x, y, 0.22, { slot: 0, eyes: "wide", mouth: "o", armL: 0.8, armR: 0.8 });
  ctx.restore();
  streaks(ctx, t, 90, 0.25);
}
function shFall3(t) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#06070f"], [1, "#1a2033"]]); ctx.fillRect(0, 0, W, H);
  cloudWall(ctx, t, "rgba(40,44,70,0.9)", 80, 9, 3, 10);
  const fl = flashAt(t, [2.6, 3.2]);
  // обломки самолёта высоко вверху, горят
  const r = rng(41);
  for (let i = 0; i < 9; i++) {
    const x = 200 + r() * 700, y = 260 + r() * 360 + t * 40, s = 0.3 + r() * 0.5;
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * (r() - 0.5) * 2 + r() * 6);
    ctx.fillStyle = "#c9ced6"; rr(ctx, -60 * s, -18 * s, 120 * s, 36 * s, 8); ctx.fill(); ctx.restore();
    if (i % 3 === 0) glow(ctx, x, y, 90, "rgba(255,140,50,A)", 0.7);
  }
  // кресло на переднем плане уходит вниз
  const k = inv(2.42, 3.73, t);
  ctx.save(); ctx.translate(W / 2, lerp(1300, 1900, k)); ctx.rotate(0.4 + k * 0.6);
  girlInSeat(ctx, 0, 0, 0.55, { slot: 0, eyes: "wide", mouth: "o", armL: 0.8, armR: 0.8 });
  ctx.restore();
  if (fl > 0) flash(fl * 0.5, "220,230,255");
  streaks(ctx, t, 40, 0.2);
}
function shBelt(t) {
  const lt = t - 3.73;
  ctx.fillStyle = "#1a2236"; ctx.fillRect(0, 0, W, H);
  fallClouds(t, 0.15, 2200);
  const z = lt < 0.87 ? lerp(3.4, 3.1, lt / 0.87) : lerp(1.7, 1.5, inv(4.6, 6.37, t));
  const fy = lt < 0.87 ? 1690 : 1080;
  ctx.save(); ctx.translate(W / 2, 980); ctx.scale(z, z); ctx.translate(-W / 2, -fy);
  ctx.translate(Math.sin(t * 40) * 2, Math.cos(t * 33) * 2);
  girlInSeat(ctx, W / 2, 1700, 1, { slot: 0, eyes: "wide", mouth: "o", armL: 0.25, armR: 0.25, brows: 1 });
  ctx.restore();
  const fl = flashAt(t, [5.2]); flash(fl * 0.4, "200,215,255");
  streaks(ctx, t, 40, 0.25);
  vignette(ctx, 0.6);
}
function shNotMovie(t) {
  // «Это не кино»: архивная плёнка, самолёт на полосе
  ctx.fillStyle = "#c9c2b3"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = vgrad(ctx, 0, 1100, [[0, "#d8d2c4"], [1, "#b9b2a2"]]); ctx.fillRect(0, 0, W, 1100);
  ctx.fillStyle = "#6e6a62"; ctx.fillRect(0, 1100, W, H);
  ctx.fillStyle = "#e6e0d2"; for (let i = 0; i < 6; i++) ctx.fillRect(i * 220 - ((t * 300) % 220), 1300, 120, 14);
  plane(ctx, 540 + (t - 6.37) * 30, 1080, 1.2);
  sepia(0.85); grain(ctx, t, 0.12); scratches(t, 0.35);
  // рамка плёнки
  ctx.fillStyle = "#0b0a08"; ctx.fillRect(0, 0, 70, H); ctx.fillRect(W - 70, 0, 70, H);
  ctx.fillStyle = "#3a352c"; for (let y = ((t * 400) % 120) - 120; y < H; y += 120) { rr(ctx, 18, y, 34, 60, 6); ctx.fill(); rr(ctx, W - 52, y, 34, 60, 6); ctx.fill(); }
  vignette(ctx, 0.7);
  glitch(1 - inv(6.37, 6.9, t), (t * 30) | 0);
}
function shLima(t) {
  const k = inv(7.86, 8.54, t);
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#b8bcc2"], [0.5, "#d4d2cb"], [1, "#8d8a83"]]); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + k * 0.05, 1 + k * 0.05); ctx.translate(-W / 2, -H / 2);
  // терминал
  ctx.fillStyle = "#e9e4d8"; ctx.fillRect(80, 760, 920, 420);
  ctx.fillStyle = "#3d4a5c"; for (let i = 0; i < 7; i++) ctx.fillRect(120 + i * 125, 840, 90, 220);
  ctx.fillStyle = "#c4342f"; ctx.fillRect(80, 740, 920, 30);
  ctx.font = "900 70px M"; ctx.fillStyle = "#2b2b33"; ctx.textAlign = "center"; ctx.fillText("LIMA", W / 2, 700);
  // пальмы
  for (const [x, s] of [[130, 1.1], [960, 1.25]]) {
    ctx.fillStyle = "#6b5a44"; ctx.fillRect(x - 12 * s, 820, 24 * s, 380);
    ctx.fillStyle = "#3d6b3f"; for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(x, 820); ctx.rotate(i * 1.05 + Math.sin(t * 2 + i) * 0.05); ctx.beginPath(); ctx.ellipse(110 * s, 0, 120 * s, 26 * s, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  }
  ctx.fillStyle = "#777468"; ctx.fillRect(0, 1180, W, H);
  ctx.restore();
  sepia(lerp(0.7, 0.15, k)); grain(ctx, t, 0.07); vignette(ctx, 0.5);
}
function shXmas(t) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#2a1e1a"], [1, "#120c0a"]]); ctx.fillRect(0, 0, W, H);
  blurred(14, (c) => { const r = rng(55); for (let i = 0; i < 30; i++) { glow(c, r() * W, 200 + r() * 1000, 60 + r() * 90, ["rgba(255,200,110,A)", "rgba(255,90,80,A)", "rgba(120,200,255,A)"][i % 3], 0.5); } });
  // ёлка
  const x = W / 2, y = 1500;
  ctx.fillStyle = "#4a2f20"; ctx.fillRect(x - 30, y - 60, 60, 100);
  ctx.fillStyle = "#1f5a34"; for (let i = 0; i < 4; i++) { const w = 380 - i * 80, yy = y - 60 - i * 190; ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x, yy - 300); ctx.lineTo(x + w, yy); ctx.fill(); }
  const r = rng(8); const cols = ["#ffd93b", "#ff5a5a", "#7fd0ff", "#ffffff"];
  for (let i = 0; i < 34; i++) { const lvl = (r() * 4) | 0, yy = y - 90 - lvl * 190 - r() * 200, half = (380 - lvl * 80) * (1 - (y - 60 - lvl * 190 - yy) / 300); const xx = x + (r() - 0.5) * 2 * half * 0.9; const on = Math.sin(t * 6 + i * 1.7) > -0.2; if (on) glow(ctx, xx, yy, 34, "rgba(255,230,160,A)", 0.6); ell(ctx, xx, yy, 10, 10, on ? cols[i % 4] : "#3a3a3a"); }
  ctx.fillStyle = "#ffd93b"; ctx.save(); ctx.translate(x, y - 880); ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? 22 : 54; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } ctx.fill(); ctx.restore();
  glow(ctx, x, y - 880, 160, "rgba(255,220,120,A)", 0.5);
  vignette(ctx, 0.55);
}
function flipCard(x, y, w, h, txt, k) {
  ctx.save();
  ctx.fillStyle = "#16161d"; rr(ctx, x - w / 2, y - h / 2, w, h, 18); ctx.fill();
  ctx.fillStyle = "#0d0d12"; ctx.fillRect(x - w / 2, y - 3, w, 6);
  ctx.font = `900 ${h * 0.62}px M`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#f2f0ea";
  ctx.save(); ctx.translate(x, y); ctx.scale(1, k < 1 ? Math.abs(Math.cos(k * Math.PI)) : 1); ctx.fillText(txt, 0, 8); ctx.restore();
  ctx.restore();
}
function shDate(t) {
  ctx.fillStyle = "#0b0b10"; ctx.fillRect(0, 0, W, H);
  glow(ctx, W / 2, 800, 700, "rgba(255,200,120,A)", 0.12);
  const k1 = inv(9.6, 10.0, t), k2 = inv(9.9, 10.3, t), k3 = inv(10.0, 10.6, t);
  const yr = k3 < 1 ? String(1950 + Math.floor(k3 * 21)) : "1971";
  flipCard(330, 620, 300, 300, k1 < 1 ? String(10 + Math.floor(k1 * 14)) : "24", k1);
  flipCard(750, 620, 300, 300, k2 < 1 ? String(1 + Math.floor(k2 * 11)).padStart(2, "0") : "12", k2);
  flipCard(W / 2, 1000, 720, 300, yr, k3 < 1 ? (k3 * 21) % 1 : 1);
  ctx.font = "800 40px M"; ctx.fillStyle = "#8d8fa0"; ctx.textAlign = "center"; ctx.fillText("ДЕНЬ            МЕСЯЦ", W / 2, 430);
  vignette(ctx, 0.5);
}
function airportBG(c, t, blurPx = 10) {
  blurred(blurPx, (b) => {
    b.fillStyle = vgrad(b, 0, H, [[0, "#9aa4b4"], [0.55, "#c9ccd2"], [1, "#575c68"]]); b.fillRect(0, 0, W, H);
    b.fillStyle = "#2c3140"; for (let i = 0; i < 6; i++) b.fillRect(i * 220 - 20, 200, 26, 1100);
    plane(b, 600 - t * 10, 1000, 1.3, -1);
    b.fillStyle = "#4e5462"; b.fillRect(0, 1250, W, H);
    const r = rng(2); for (let i = 0; i < 10; i++) glow(b, r() * W, 300 + r() * 800, 80, "rgba(255,240,200,A)", 0.3);
  });
}
function shJul(t) {
  airportBG(ctx, t, 14);
  const z = lerp(1.0, 1.06, inv(11.74, 13.34, t));
  ctx.save(); ctx.translate(W / 2, 1100); ctx.scale(z, z); ctx.translate(-W / 2, -1100);
  personLit(ctx, W / 2, 1900, 2.0, JUL, { look: 0.4, mouth: "smile" }, { dir: 1, light: "rgba(255,230,190,0.3)" });
  ctx.restore();
  if (t > 12.0) namePill("ЮЛИАНА · 17", W / 2, 360 + (1 - easeOut(inv(12.0, 12.3, t))) * 40);
  vignette(ctx, 0.5);
}
function shWalk(t) {
  const k = inv(13.34, 16.0, t);
  airportBG(ctx, t, 6);
  const ph = t * 6;
  personLit(ctx, lerp(260, 520, k), 1640, 0.95, MOM, { walk: ph, look: 1, bob: Math.abs(Math.sin(ph)) * -6 }, { dir: 1 });
  personLit(ctx, lerp(560, 820, k), 1660, 0.85, JUL, { walk: ph + 1, look: -1, bob: Math.abs(Math.sin(ph + 1)) * -6, mouth: "smile" }, { dir: 1 });
  ctx.fillStyle = "#7a4b3a"; rr(ctx, lerp(380, 640, k), 1480, 110, 120, 14); ctx.fill();
  vignette(ctx, 0.5);
}
function shDadAsk(t) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#3a2416"], [1, "#140b06"]]); ctx.fillRect(0, 0, W, H);
  glow(ctx, 820, 500, 800, "rgba(255,180,100,A)", 0.5);
  blurred(10, (b) => { b.fillStyle = "#2f5a32"; rr(b, 60, 260, 380, 520, 14); b.fill(); b.fillStyle = "#f3d58e"; b.beginPath(); b.moveTo(760, 330); b.lineTo(880, 330); b.lineTo(920, 430); b.lineTo(720, 430); b.fill(); });
  const z = lerp(1, 1.08, inv(16.0, 19.17, t));
  ctx.save(); ctx.translate(W / 2, 1000); ctx.scale(z, z); ctx.translate(-W / 2, -1000);
  personLit(ctx, W / 2, 1880, 1.95, DAD, { brows: -1, mouth: t > 17.65 && t < 18.7 ? (Math.sin(t * 20) > 0 ? "o" : null) : null }, { dir: 1, light: "rgba(255,190,120,0.4)" });
  ctx.restore();
  sepia(0.25); grain(ctx, t, 0.05); vignette(ctx, 0.7);
}
function shTakeoff(t) {
  const k = inv(19.17, 20.93, t);
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#7e8ea6"], [0.6, "#b9c0c8"], [1, "#55595f"]]); ctx.fillRect(0, 0, W, H);
  cloudWall(ctx, t, "rgba(90,96,120,0.5)", 150, 8, 6, 20);
  ctx.fillStyle = "#5a5d63"; ctx.beginPath(); ctx.moveTo(0, 1500); ctx.lineTo(W, 1350); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  const x = lerp(-250, 820, ease(k)), y = lerp(1420, 900, ease(k));
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12 - k * 0.12); plane(ctx, 0, 0, 1.25); ctx.restore();
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12 - k * 0.12); ctx.font = "900 46px M"; ctx.fillStyle = "#c4342f"; ctx.textAlign = "center"; ctx.fillText("LANSA", 40, -50 * 1.25 - 12); ctx.restore();
  vignette(ctx, 0.45);
}
function shStorm(t) {
  const k = inv(20.93, 23.29, t);
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#151827"], [0.6, "#2a2f45"], [1, "#16301f"]]); ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.6; canopy(ctx, 0, -t * 20, 0.85); ctx.globalAlpha = 1;
  ctx.fillStyle = vgrad(ctx, 900, H, [[0, "rgba(21,24,39,1)"], [1, "rgba(21,24,39,0)"]]); ctx.fillRect(0, 900, W, H);
  // стена грозы
  for (let i = 0; i < 14; i++) cloudPuff(ctx, 300 + (i % 5) * 200 - k * 160, 200 + Math.floor(i / 5) * 280, 2.2, `rgba(32,34,52,${0.85})`);
  const fl = flashAt(t, [21.6, 22.4, 22.6]);
  if (fl > 0) { glow(ctx, 760, 500, 600, "rgba(200,215,255,A)", fl * 0.7); }
  plane(ctx, lerp(200, 560, k), 960 + Math.sin(t * 3) * 10, 0.75);
  rain(ctx, t, 0.3, 100);
  vignette(ctx, 0.65);
}
function shCabin(t) {
  const k = inv(23.29, 25.84, t), sh = 4 + k * 14;
  ctx.save(); ctx.translate(Math.sin(t * 47) * sh, Math.cos(t * 39) * sh);
  const dim = Math.sin(t * 23) > 0.6 ? 0.55 : 1;
  ctx.fillStyle = "#2a2c38"; ctx.fillRect(-40, -40, W + 80, H + 80);
  // коридор с перспективой
  ctx.fillStyle = "#3a3d4c"; ctx.beginPath(); ctx.moveTo(-40, 300); ctx.lineTo(420, 700); ctx.lineTo(660, 700); ctx.lineTo(W + 40, 300); ctx.lineTo(W + 40, -40); ctx.lineTo(-40, -40); ctx.fill();
  ctx.fillStyle = "#4b4f60"; ctx.beginPath(); ctx.moveTo(300, H); ctx.lineTo(480, 760); ctx.lineTo(600, 760); ctx.lineTo(780, H); ctx.fill();
  glow(ctx, 540, 650, 300, "rgba(255,230,180,A)", 0.35 * dim);
  // ряды кресел с силуэтами
  for (let row = 5; row >= 0; row--) {
    const s = 0.3 + row * 0.16, y = 780 + row * 190;
    for (const side of [-1, 1]) for (let j = 0; j < 2; j++) {
      const x = 540 + side * (130 + j * 150) * s * 2.2;
      ctx.fillStyle = "#3f5f9a"; rr(ctx, x - 70 * s, y - 230 * s, 140 * s, 230 * s, 26 * s); ctx.fill();
      ctx.fillStyle = "#14141c"; ell(ctx, x + Math.sin(t * 9 + row + j) * 6 * s, y - 250 * s, 52 * s, 58 * s, "#14141c");
    }
  }
  // сумки падают
  const r = rng(17);
  for (let i = 0; i < 7; i++) { const st = 23.4 + r() * 1.8, x = 120 + r() * 840; if (t > st) { const y = 360 + Math.pow(t - st, 2) * 2400; ctx.save(); ctx.translate(x, y); ctx.rotate((t - st) * (r() * 6 - 3)); ctx.fillStyle = ["#7a4b3a", "#3c5a7a", "#6b6b3a"][i % 3]; rr(ctx, -60, -40, 120, 80, 12); ctx.fill(); ctx.restore(); } }
  ctx.restore();
  fadeBlack(1 - dim);
  vignette(ctx, 0.7);
}
function shFlashWin(t) {
  const lt = t - 25.84;
  ctx.fillStyle = "#3a3d4a"; ctx.fillRect(0, 0, W, H);
  ctx.save(); rr(ctx, 260, 360, 560, 820, 260); ctx.clip();
  ctx.fillStyle = "#1a1c2c"; ctx.fillRect(260, 360, 560, 820);
  bolt(ctx, 420, 340, 640, 1200, 11, 18);
  ctx.restore();
  ctx.strokeStyle = "#d8dbe3"; ctx.lineWidth = 46; rr(ctx, 260, 360, 560, 820, 260); ctx.stroke();
  flash(1 - lt / 0.9);
}
function shBolt(t) {
  const k = inv(26.83, 29.08, t);
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#0a0c18"], [1, "#1c2033"]]); ctx.fillRect(0, 0, W, H);
  cloudWall(ctx, t, "rgba(36,40,62,0.9)", 0, 12, 9, 60);
  const z = lerp(1.6, 1.9, k);
  ctx.save(); ctx.translate(W / 2, 960); ctx.scale(z, z); ctx.translate(Math.sin(t * 40) * 3, 0); plane(ctx, -40, 0, 1); ctx.restore();
  if (t < 27.3) { bolt(ctx, 520, 0, 560, 1000, 21, 16); flash(0.6 - (t - 26.83), "210,220,255"); }
  if (t > 27.0) { const f = inv(27.0, 29, t); glow(ctx, 470, 1020, 160 + f * 200, "rgba(255,120,40,A)", 0.9); glow(ctx, 470, 1020, 70 + f * 60, "rgba(255,230,150,A)", 1); const r = rng((t * 20) | 0); for (let i = 0; i < 20; i++) ell(ctx, 470 + (r() - 0.5) * 400, 1020 - r() * 300, 5, 5, "#ffcf6a"); }
  vignette(ctx, 0.6);
}
function shBreak(t) {
  const k = inv(29.08, 30.4, t), e = easeOut(k);
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#0a0c18"], [1, "#1c2033"]]); ctx.fillRect(0, 0, W, H);
  cloudWall(ctx, t, "rgba(40,44,68,0.85)", 0, 12, 12, 300);
  ctx.save(); ctx.translate(W / 2, 880); ctx.scale(1.35, 1.35);
  const P = planeTop(ctx);
  const part = (fn, dx, dy, rot) => { ctx.save(); ctx.translate(dx * e, dy * e); ctx.rotate(rot * e); fn(); ctx.restore(); };
  part(P.wingL, -180, 80, -0.9); part(P.nose, -40, -230, -0.6); part(P.tail, 70, 300, 0.9); part(P.wingR, 280, 110, 1.5);
  glow(ctx, 120 + 280 * e, -60 + 110 * e, 180, "rgba(255,130,40,A)", 0.9);
  const r = rng(3); for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = e * (150 + r() * 380); ctx.save(); ctx.translate(Math.cos(a) * d, Math.sin(a) * d); ctx.rotate(t * 4 + i); ctx.fillStyle = r() > 0.7 ? "#ffb04a" : "#aeb4be"; ctx.fillRect(-10, -5, 20 + r() * 20, 10); ctx.restore(); }
  ctx.restore();
  flash(1 - inv(29.08, 29.4, t), "255,220,180");
  vignette(ctx, 0.6);
}
function shSkyWide(t) {
  const k = inv(30.51, 31.83, t);
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#0a0c18"], [1, "#24304a"]]); ctx.fillRect(0, 0, W, H);
  const r = rng(61);
  for (let i = 0; i < 12; i++) { const x = r() * W, y = 300 + r() * 900 + k * 200 * (r() + 0.5); ctx.save(); ctx.translate(x, y); ctx.rotate(t * (r() - 0.5) * 3); ctx.fillStyle = "#a8aeb8"; rr(ctx, -30, -10, 60 + r() * 50, 20, 6); ctx.fill(); ctx.restore(); if (i % 4 === 0) glow(ctx, x, y, 60, "rgba(255,130,50,A)", 0.7); }
  cloudWall(ctx, t, "rgba(60,66,92,0.7)", 1300, 8, 15, 15);
  ctx.save(); ctx.translate(560, lerp(900, 1500, k)); ctx.rotate(t * 2); girlInSeat(ctx, 0, 0, 0.12, { slot: 0 }); ctx.restore();
  fadeBlack(inv(31.4, 31.83, t));
}
function canopyUp(t, light = 1) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#cfe8c4"], [1, "#9cc79a"]]); ctx.fillRect(0, 0, W, H);
  rays(ctx, 640, -100, 0.25, 7, 2200, 0.25 * light);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(t * 0.03); ctx.translate(-W / 2, -H / 2);
  ctx.drawImage(LEAVES, -300, -200, 1700, 2400); ctx.drawImage(LEAVES, 200, 300, 1300, 2000);
  ctx.restore();
}
function shWakeUp(t) {
  const lt = t - 31.83, open = ease(inv(0.1, 1.2, lt));
  canopyUp(t);
  motes(ctx, t, 50, "#fff7d0", 15);
  if (open < 1) { ctx.save(); ctx.filter = `blur(${(1 - open) * 18}px)`; ctx.drawImage(cv, 0, 0); ctx.restore(); }
  const lid = (1 - open) * H * 0.55 + Math.max(0, Math.sin(lt * 5) * 60 * (1 - open));
  ctx.fillStyle = "#000"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, lid); ctx.quadraticCurveTo(W / 2, lid + 160, 0, lid); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(W, H); ctx.lineTo(W, H - lid); ctx.quadraticCurveTo(W / 2, H - lid - 160, 0, H - lid); ctx.fill();
  vignette(ctx, 0.6);
}
function jungleFloor(c, seed = 12) {
  c.fillStyle = "#2b3d22"; c.fillRect(-600, -600, W + 1200, H + 1200);
  const r = rng(seed); for (let i = 0; i < 90; i++) ell(c, r() * 2200 - 600, r() * 3100 - 600, 30 + r() * 70, 14 + r() * 24, ["#3a4b28", "#24331c", "#4a5a2c", "#1d2a17"][i % 4]);
}
function shReveal(t) {
  const k = inv(33.64, 34.9, t), z = lerp(1.25, 0.9, ease(k));
  ctx.save(); ctx.translate(W / 2, 950); ctx.scale(z, z); ctx.translate(-W / 2, -950);
  jungleFloor(ctx);
  ctx.save(); ctx.translate(W / 2 + 160, 900); ctx.rotate(-0.25); seatRow(ctx, 0, 0, 0.6); ctx.restore();
  ctx.save(); ctx.translate(W / 2 - 150, 1080); ctx.rotate(-1.35);
  personLit(ctx, 0, 0, 0.75, JUL, { oneShoe: true, cuts: true, look: 1, eyes: "open", brows: 1 }, { dir: -1, light: "rgba(255,245,200,0.4)", ground: false });
  ctx.restore();
  ctx.restore();
  rays(ctx, 600, -200, 0.15, 5, 2300, 0.18);
  ctx.globalAlpha = 0.85; ctx.drawImage(LEAVES, -320 - k * 40, -600); ctx.globalAlpha = 1;
  vignette(ctx, 0.65);
}
function shInjury(t, which) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#1e4a2c"], [1, "#0b2013"]]); ctx.fillRect(0, 0, W, H);
  blurred(16, (b) => b.drawImage(LEAVES, -100, -300));
  if (which === 1) {
    const z = lerp(2.6, 2.8, inv(34.9, 36.18, t));
    ctx.save(); ctx.translate(W / 2 + 100, 900); ctx.scale(z, z); ctx.translate(0, 420);
    personLit(ctx, 0, 0, 1, JUL, { cuts: true, armL: 0.9, armR: 0.1, brows: 1, look: 1 }, { dir: -1, shade: 0.45 });
    // ключица: рентген-вставка
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255,80,80,${0.6 + 0.3 * Math.sin(t * 10)})`; ctx.lineWidth = 12; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-80, -398); ctx.quadraticCurveTo(-40, -385, -12, -392); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -388); ctx.quadraticCurveTo(40, -380, 80, -398); ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
    glow(ctx, W / 2 + 100, 900 - 0, 220, "rgba(255,40,40,A)", 0.25);
  } else {
    // рука с порезами крупно
    const z = lerp(1.0, 1.08, inv(36.18, 37.56, t));
    ctx.save(); ctx.translate(W / 2, 950); ctx.scale(z, z); ctx.rotate(-0.4);
    ctx.fillStyle = SKIN; rr(ctx, -500, -90, 1000, 180, 90); ctx.fill();
    ctx.fillStyle = "rgba(8,10,30,0.25)"; rr(ctx, -500, 20, 1000, 70, 40); ctx.fill();
    ctx.strokeStyle = "#a8242f"; ctx.lineCap = "round";
    for (const [x, len, w] of [[-260, 70, 14], [-90, 110, 18], [80, 90, 14], [230, 60, 10]]) { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x - len / 2, -40); ctx.lineTo(x + len / 2, 30); ctx.stroke(); }
    ell(ctx, 560, 0, 120, 110, SKIN);
    ctx.restore();
  }
  vignette(ctx, 0.7);
}
function shEmpty(t) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#1a3a2a"], [1, "#081a10"]]); ctx.fillRect(0, 0, W, H);
  const z = lerp(1, 1.1, inv(37.56, 38.76, t));
  ctx.save(); ctx.translate(W / 2, 1100); ctx.scale(z, z); ctx.translate(-W / 2, -1100);
  seatRow(ctx, W / 2 + 190, 1280, 1.25, 2, "#33507f");
  glow(ctx, W / 2 + 290, 1000, 300, "rgba(200,230,255,A)", 0.15);
  personLit(ctx, W / 2 - 300, 1760, 0.9, JUL, { look: 1, brows: 1, oneShoe: true, cuts: true }, { dir: 1, light: "rgba(170,200,255,0.25)", shade: 0.5 });
  ctx.restore();
  rain(ctx, t, 0.3, 90);
  vignette(ctx, 0.7);
}
function shDespair(t) {
  const z = lerp(1, 1.15, inv(38.76, 40.85, t));
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#0d1828"], [1, "#050a10"]]); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2, 1200); ctx.scale(z, z); ctx.translate(-W / 2, -1200);
  // корни огромного дерева
  ctx.fillStyle = "#1a1612"; ctx.fillRect(380, -200, 320, 1300);
  for (const [x, w] of [[120, 160], [880, 180], [260, 120], [780, 110]]) { ctx.beginPath(); ctx.moveTo(540, 900); ctx.quadraticCurveTo(x, 1000, x - w / 2, 1500); ctx.lineTo(x + w / 2, 1500); ctx.quadraticCurveTo(x + 40, 1080, 600, 1000); ctx.fill(); }
  personLit(ctx, W / 2, 1500, 0.7, JUL, { armL: 0.9, armR: 0.9, eyes: "closed", brows: 1, oneShoe: true }, { dir: 1, light: "rgba(150,180,255,0.25)", shade: 0.6 });
  ctx.restore();
  rain(ctx, t, 0.45, 180);
  if (Math.sin(t * 3) > 0.97) flash(0.25, "180,200,255");
  vignette(ctx, 0.75);
}
function shParents(t) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#6a8a4a"], [1, "#2e3e22"]]); ctx.fillRect(0, 0, W, H);
  blurred(12, (b) => { b.drawImage(LEAVES, -200, -400); glow(b, 700, 400, 500, "rgba(255,220,150,A)", 0.6); });
  rays(ctx, 700, -100, 0.3, 6, 2200, 0.25);
  personLit(ctx, 330, 1700, 0.95, DAD, { armL: 0.5, armR: 2.6, look: 1, mouth: "smile" }, { dir: 1 });
  personLit(ctx, 740, 1720, 0.9, MOM, { armR: 2.3, look: -1, mouth: "smile" }, { dir: -1 });
  // бинокль и блокнот
  ctx.fillStyle = "#2b2b33"; rr(ctx, 310, 1065, 70, 40, 10); ctx.fill();
  ctx.fillStyle = "#f2ead6"; rr(ctx, 700, 1080, 90, 110, 8); ctx.fill();
  // птица
  const bx = 820 - (t - 40.85) * 60, by = 520 + Math.sin(t * 8) * 10; ctx.strokeStyle = "#1d1a17"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(bx - 40, by - Math.abs(Math.sin(t * 10)) * 20); ctx.quadraticCurveTo(bx, by + 10, bx + 40, by - Math.abs(Math.sin(t * 10)) * 20); ctx.stroke();
  sepia(0.35); grain(ctx, t, 0.05); vignette(ctx, 0.65);
}
function shTeach(t) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#7a9a5a"], [1, "#30402a"]]); ctx.fillRect(0, 0, W, H);
  blurred(10, (b) => { b.drawImage(LEAVES, 0, -500); glow(b, 300, 300, 500, "rgba(255,220,150,A)", 0.6); });
  water(ctx, 1500, t, "#5aa0b0", "#2a5a66");
  personLit(ctx, 360, 1560, 1.0, DAD, { armR: 1.6, look: 1, mouth: t > 43.87 ? (Math.sin(t * 18) > 0 ? "o" : null) : "smile" }, { dir: -1 });
  personLit(ctx, 760, 1590, 0.7, JUL, { look: -1 }, { dir: -1 });
  sepia(0.35); grain(ctx, t, 0.05); vignette(ctx, 0.65);
}
function shMap(t) {
  ctx.fillStyle = "#1c2a1c"; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.5; canopy(ctx, 0, 0, 0.85); ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(12,20,12,0.55)"; ctx.fillRect(0, 0, W, H);
  // ручей -> река -> люди
  const k1 = inv(45.9, 47.2, t), k2 = inv(47.5, 49.0, t);
  ctx.lineCap = "round";
  const path = (from, to, wdt, col) => { ctx.strokeStyle = col; ctx.lineWidth = wdt; ctx.beginPath(); for (let i = from; i <= to; i++) { const y = 1700 - i * 14, x = 540 + Math.sin(i * 0.12) * 160; i === from ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); };
  path(0, Math.floor(50 * k1), 10, "#7fd0ff");
  if (k1 > 0.99) path(50, 50 + Math.floor(50 * k2), 36, "#4fa7e0");
  // точка: она
  ell(ctx, 540, 1700, 18, 18, "#ffd93b"); glow(ctx, 540, 1700, 60, "rgba(255,217,59,A)", 0.6);
  // посёлок
  if (k2 > 0.7) { const a = inv(0.7, 1, k2); ctx.globalAlpha = a; const r = rng(4); for (let i = 0; i < 8; i++) { const x = 540 + Math.sin(100 * 0.12) * 160 + (r() - 0.5) * 300, y = 300 + (r() - 0.5) * 160; ctx.fillStyle = "#d9b37a"; ctx.fillRect(x - 24, y - 10, 48, 36); ctx.fillStyle = "#8a4b2a"; ctx.beginPath(); ctx.moveTo(x - 32, y - 8); ctx.lineTo(x, y - 40); ctx.lineTo(x + 32, y - 8); ctx.fill(); glow(ctx, x, y + 6, 50, "rgba(255,200,120,A)", 0.5); } ctx.globalAlpha = 1; }
  vignette(ctx, 0.6);
}
function shStream(t) {
  // Общий план: Юлиана целиком идёт по ручью, вода по щиколотку.
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#1f4a2a"], [1, "#163522"]]); ctx.fillRect(0, 0, W, H);
  blurred(8, (b) => b.drawImage(LEAVES, -200 - t * 30, -900));
  rays(ctx, 700, -100, 0.2, 5, 1800, 0.25);
  ctx.fillStyle = "#2a3d22"; ctx.fillRect(0, 980, W, 120);
  water(ctx, 1060, t, "#3f7c86", "#1f4a55");
  const ph = t * 5.5, x = lerp(360, 720, inv(49.64, 51.70, t)), y = 1180;
  personLit(ctx, x, y, 0.75, JUL, { walk: ph, oneShoe: true, cuts: true, look: 1, bob: Math.abs(Math.sin(ph)) * -6 }, { dir: 1, ground: false, light: "rgba(255,240,200,0.35)" });
  // вода закрывает ступни
  ctx.fillStyle = "rgba(63,124,134,0.75)"; ctx.fillRect(0, y - 22, W, 60);
  ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) { const q = (t * 1.6 + i / 3) % 1; ctx.globalAlpha = 1 - q; ctx.beginPath(); ctx.ellipse(x, y - 4, 40 + q * 200, 8 + q * 40, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.9; ctx.drawImage(LEAVES, -700, 1250, 1300, 1100); ctx.drawImage(LEAVES, 650, 1300, 900, 900); ctx.globalAlpha = 1;
  vignette(ctx, 0.55);
}
function shDays(t) {
  const k = inv(51.70, 53.60, t), cyc = (k * 2) % 1, night = Math.sin(cyc * Math.PI * 2) * 0.5 + 0.5;
  ctx.fillStyle = lerp2("#7fb08a", "#0c1424", night); ctx.fillRect(0, 0, W, H);
  // солнце/луна по дуге
  const a = cyc * Math.PI; glow(ctx, lerp(100, 980, cyc), 700 - Math.sin(a) * 400, 200, night > 0.5 ? "rgba(200,215,255,A)" : "rgba(255,230,160,A)", 0.7);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = lerp2(["#1d5a33", "#24703c", "#174d2c", "#2f8545", "#1a6136"][i], "#08101a", night); ctx.beginPath(); ctx.moveTo(0, 600 + i * 150); for (let x = 0; x <= W; x += 60) ctx.lineTo(x, 620 + i * 150 + Math.sin(x * 0.02 + i) * 60); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill(); }
  ctx.fillStyle = lerp2("#4f97a8", "#1a2c44", night); ctx.beginPath(); ctx.moveTo(360, H); ctx.quadraticCurveTo(520, 1400, 500, 1100); ctx.lineTo(580, 1100); ctx.quadraticCurveTo(620, 1400, 780, H); ctx.fill();
  if (night > 0.6) rain(ctx, t, 0.45);
  personLit(ctx, 560 + Math.sin(k * 12) * 20, 1780, 0.36, JUL, { walk: t * 8, oneShoe: true }, { dir: 1, shade: 0.3 + night * 0.4 });
  vignette(ctx, 0.55);
}
function shPlaneUp(t) {
  const k = inv(53.60, 56.01, t);
  canopyUp(t, 0.6);
  // самолёт в просвете
  ctx.save(); ctx.globalCompositeOperation = "destination-over";
  ctx.restore();
  ctx.save(); ctx.translate(lerp(-300, W + 300, k), 520); ctx.scale(0.6, 0.6); ctx.globalAlpha = 0.85; plane(ctx, 0, 0, 1, -1); ctx.restore();
  ctx.drawImage(LEAVES, -400, -300, 1900, 900);
  fadeBlack(0.25); vignette(ctx, 0.6);
}
function shPlaneTop(t) {
  const k = inv(56.01, 58.79, t);
  canopy(ctx, 0, -(t - 56) * 20, 0.95);
  ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = "#000"; ctx.translate(lerp(-300, W + 300, k) + 80, 1150); ctx.scale(1, 0.5); ctx.beginPath(); ctx.ellipse(0, 0, 300, 70, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  plane(ctx, lerp(-300, W + 300, k), 600, 0.8);
  // маркер: она здесь, под кронами
  const p = 0.5 + 0.5 * Math.sin(t * 6);
  ctx.strokeStyle = `rgba(255,77,77,${0.6 + 0.4 * p})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(640, 1020, 40 + p * 14, 0, Math.PI * 2); ctx.stroke();
  ell(ctx, 640, 1020, 8, 8, "#ff4d4d");
  vignette(ctx, 0.5);
}
function shThree(t) {
  const lt = t - 58.79;
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#122a1c"], [1, "#050c08"]]); ctx.fillRect(0, 0, W, H);
  const z = lerp(1, 1.35, ease(inv(58.79, 64.7, t)));
  ctx.save(); ctx.translate(W / 2, 900); ctx.scale(z, z); ctx.translate(-W / 2, -900);
  rays(ctx, 560, -200, 0.05, 4, 1800, 0.18, "220,240,255");
  // три кресла с неподвижными силуэтами
  seatRow(ctx, W / 2, 1080, 0.9, 3, "#2c4068");
  for (let i = -1; i <= 1; i++) {
    const x = W / 2 + i * 171;
    ctx.fillStyle = "#0b0d10"; ell(ctx, x + i * 8, 840 + Math.abs(i) * 10, 56, 62, "#0b0d10");
    ctx.fillStyle = "#0b0d10"; rr(ctx, x - 70, 860, 140, 180, 30); ctx.fill();
    if (t > 62.44) { ctx.fillStyle = "#6b6f78"; ctx.fillRect(x - 74, 990, 148, 14); }
  }
  ctx.restore();
  // листва раздвигается
  const part = ease(inv(58.79, 60.2, t));
  ctx.drawImage(LEAVES, -700 - part * 500, -400, 1400, 2600);
  ctx.drawImage(LEAVES, 380 + part * 500, -300, 1400, 2600);
  // десатурация на «Мёртвых»
  if (t > 61.63) { ctx.save(); ctx.globalCompositeOperation = "saturation"; ctx.globalAlpha = 0.85; ctx.fillStyle = "#888"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const beat = t > 61.63 ? Math.max(0, Math.sin((t - 61.63) * 7.5)) : 0;
  fadeBlack(0.15 + beat * 0.15);
  vignette(ctx, 0.8);
}
function shOnward(t) {
  const k = inv(64.71, 66.07, t);
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#2a5a3a"], [1, "#10261a"]]); ctx.fillRect(0, 0, W, H);
  rays(ctx, 540, -100, 0, 5, 1800, 0.25);
  ctx.fillStyle = "#4f97a8"; ctx.beginPath(); ctx.moveTo(240, H); ctx.quadraticCurveTo(480, 1200, 520, 800); ctx.lineTo(560, 800); ctx.quadraticCurveTo(640, 1200, 840, H); ctx.fill();
  personLit(ctx, 540, lerp(1700, 1500, k), lerp(0.7, 0.55, k), JUL, { walk: t * 7, oneShoe: true, cuts: true }, { dir: -1, light: "rgba(255,240,200,0.4)" });
  ctx.drawImage(LEAVES, -500, -500, 1000, 1600); ctx.drawImage(LEAVES, 600, 200, 900, 1500);
  vignette(ctx, 0.6);
}
function shCandy(t) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#0b1424"], [1, "#05080f"]]); ctx.fillRect(0, 0, W, H);
  glow(ctx, W / 2, 1050, 600, "rgba(120,160,255,A)", 0.14);
  ctx.save(); ctx.translate(W / 2, 1050); ctx.scale(1.4, 1.4);
  ell(ctx, 0, 60, 300, 160, SKIN); ell(ctx, 0, 90, 230, 100, SKIN_SH);
  const cols = ["#e94b5a", "#ffd93b", "#5fbf7a", "#7fb6ff"]; const shown = 1 + Math.floor(inv(66.2, 67.3, t) * 3.99);
  for (let i = 0; i < shown; i++) { const x = -150 + i * 100, y = 30 + (i % 2) * 24; ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.moveTo(x - 60, y - 22); ctx.lineTo(x - 34, y); ctx.lineTo(x - 60, y + 22); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 60, y - 22); ctx.lineTo(x + 34, y); ctx.lineTo(x + 60, y + 22); ctx.fill(); ell(ctx, x, y, 40, 30, cols[i]); ell(ctx, x - 10, y - 9, 10, 7, "rgba(255,255,255,0.55)"); }
  ctx.restore();
  rain(ctx, t, 0.4);
  vignette(ctx, 0.7);
}
function riverDusk(t, warm = 1) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#f0a35e"], [0.45, "#e07a4f"], [1, "#4a2a30"]]); ctx.fillRect(0, 0, W, H);
  glow(ctx, 760, 700, 520, "rgba(255,220,150,A)", 0.7 * warm);
  ctx.fillStyle = "#3b2a2a"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(0, 820 + i * 60); for (let x = 0; x <= W; x += 80) ctx.lineTo(x, 800 + i * 60 + Math.sin(x * 0.015 + i * 2) * 50); ctx.lineTo(W, 1200); ctx.lineTo(0, 1200); ctx.fill(); }
  water(ctx, 1150, t, "#d98a5e", "#5a3438");
}
function hut(c) {
  c.fillStyle = "#5a3a24"; for (const x of [600, 720, 840]) c.fillRect(x, 1000, 18, 220);
  c.fillStyle = "#8a5a34"; c.fillRect(570, 900, 320, 110);
  c.fillStyle = "#c79a4a"; c.beginPath(); c.moveTo(530, 920); c.lineTo(730, 760); c.lineTo(930, 920); c.fill();
}
function shHut(t) {
  const k = ease(inv(68.14, 70.9, t));
  riverDusk(t);
  hut(ctx);
  personLit(ctx, lerp(150, 520, k), 1240, 0.32, JUL, { walk: t * 6, oneShoe: true }, { dir: 1, light: "rgba(255,200,140,0.5)" });
  vignette(ctx, 0.5);
}
function shLie(t) {
  const k = inv(72.0, 73.0, t);
  ctx.fillStyle = lerp2("#4a2f22", "#0a0c16", k); ctx.fillRect(0, 0, W, H);
  // под навесом
  ctx.fillStyle = lerp2("#c79a4a", "#2a2218", k); ctx.beginPath(); ctx.moveTo(-100, 700); ctx.lineTo(540, 300); ctx.lineTo(1180, 700); ctx.fill();
  ctx.fillStyle = lerp2("#7a5233", "#1c140e", k); ctx.fillRect(0, 1510, W, 200);
  if (k > 0.3) { const r = rng(5); for (let i = 0; i < 40; i++) ell(ctx, r() * W, 760 + r() * 400, 2, 2, `rgba(255,255,255,${k})`); }
  ctx.save(); ctx.translate(560, 1500); ctx.rotate(-Math.PI / 2);
  personLit(ctx, 0, 0, 0.6, JUL, { eyes: "closed", oneShoe: true, cuts: true }, { dir: 1, shade: 0.4 + k * 0.3, ground: false });
  ctx.restore();
  vignette(ctx, 0.65);
}
function shMorning(t) {
  const k = inv(73.09, 74.78, t);
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#c9d6d0"], [0.5, "#9fb4a8"], [1, "#4a5e58"]]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#2e3e36"; ctx.beginPath(); ctx.moveTo(0, 900); for (let x = 0; x <= W; x += 80) ctx.lineTo(x, 880 + Math.sin(x * 0.013) * 50); ctx.lineTo(W, 1150); ctx.lineTo(0, 1150); ctx.fill();
  water(ctx, 1120, t, "#8fa8a4", "#3a4c4a");
  hut(ctx);
  // туман
  ctx.fillStyle = "rgba(230,236,232,0.35)"; for (let i = 0; i < 4; i++) ctx.fillRect(0, 1050 + i * 40 + Math.sin(t + i) * 10, W, 30);
  const bx = lerp(-200, 330, ease(k)), by = 1330;
  boat(bx, by, t, [CUTTER, CUTTER2], [-120, 120]);
  vignette(ctx, 0.5);
}
function boat(bx, by, t, people, offs) {
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, by + 10); ctx.clip();
  people.forEach((p, i) => personLit(ctx, bx + offs[i], by + 70, 0.4, p, { armL: 0.5, armR: -0.3 }, { dir: 1, ground: false }));
  ctx.restore();
  ctx.fillStyle = "#5a3220"; ctx.beginPath(); ctx.moveTo(bx - 330, by - 20); ctx.lineTo(bx + 330, by - 20); ctx.quadraticCurveTo(bx + 280, by + 70, bx + 210, by + 70); ctx.lineTo(bx - 210, by + 70); ctx.quadraticCurveTo(bx - 280, by + 70, bx - 330, by - 20); ctx.fill();
  ctx.strokeStyle = "#7a4a2a"; ctx.lineWidth = 12; const pa = Math.sin(t * 3) * 0.5; ctx.beginPath(); ctx.moveTo(bx - 200, by - 110); ctx.lineTo(bx - 200 - 110 * Math.cos(pa), by + 110); ctx.stroke();
}
function shScared(t) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#b8c8c0"], [1, "#55665e"]]); ctx.fillRect(0, 0, W, H);
  blurred(10, (b) => { hut(b); });
  const back = ease(inv(74.9, 75.4, t)) * 40;
  personLit(ctx, 300 - back, 1700, 1.4, CUTTER, { eyes: "wide", mouth: "o", brows: 1, look: 1 }, { dir: 1 });
  personLit(ctx, 790 + back, 1730, 1.35, CUTTER2, { eyes: "wide", mouth: "o", brows: 1, look: -1 }, { dir: -1 });
  vignette(ctx, 0.55);
}
function shBoatAway(t) {
  const k = inv(76.33, 78.13, t);
  riverDusk(t, 1.2);
  ctx.fillStyle = "rgba(255,200,140,0.12)"; ctx.fillRect(0, 0, W, H);
  const bx = lerp(260, 760, k), by = 1380 + Math.sin(t * 2) * 6;
  boat(bx, by, t, [CUTTER, JUL, CUTTER2], [-200, 0, 200]);
  ctx.fillStyle = "rgba(255,255,255,0.25)"; for (let i = 0; i < 5; i++) ctx.fillRect(bx - 400 - i * 90 - ((t * 200) % 90), by + 60 + (i % 2) * 14, 60, 5);
  vignette(ctx, 0.45);
}
function shStat(t) {
  ctx.fillStyle = "#08080d"; ctx.fillRect(0, 0, W, H);
  const cols = 10, cell = 86, x0 = (W - cols * cell) / 2 + cell / 2, y0 = 330;
  const fadeK = inv(78.4, 80.1, t), survivor = 61;
  const order = []; { const r = rng(92); for (let i = 0; i < 92; i++) order.push([r(), i]); order.sort((a, b) => a[0] - b[0]); }
  const rank = {}; order.forEach(([_, i], n) => (rank[i] = n));
  for (let i = 0; i < 92; i++) {
    const x = x0 + (i % cols) * cell, y = y0 + Math.floor(i / cols) * cell;
    const gone = i !== survivor && rank[i] / 92 < fadeK;
    let col = gone ? "#2a2a33" : "#d8dbe3";
    if (i === survivor && t > 80.23) { col = "#ffd93b"; glow(ctx, x, y, 120 + Math.sin(t * 6) * 10, "rgba(255,217,59,A)", 0.6); }
    ctx.fillStyle = col; ell(ctx, x, y - 16, 14, 14, col); rr(ctx, x - 19, y + 2, 38, 30, 12); ctx.fill();
  }
  if (t > 80.23) { const k = easeOut(inv(80.23, 80.6, t)); ctx.save(); ctx.globalAlpha = k; ctx.font = "900 46px M"; ctx.fillStyle = "#ffd93b"; ctx.textAlign = "center"; ctx.fillText("1 ИЗ 92", W / 2, 230); ctx.restore(); }
}
function shFinal(t) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#2a1a10"], [1, "#0a0605"]]); ctx.fillRect(0, 0, W, H);
  glow(ctx, 760, 600, 800, "rgba(255,180,100,A)", 0.45);
  const z = lerp(1.0, 1.08, inv(81.69, 86.6, t));
  ctx.save(); ctx.translate(W / 2, 1000); ctx.scale(z, z); ctx.translate(-W / 2, -1000);
  personLit(ctx, W / 2, 1900, 2.0, JUL, { look: 0, brows: 0 }, { dir: 1, light: "rgba(255,200,130,0.45)", shade: 0.55 });
  ctx.restore();
  grain(ctx, t, 0.04); vignette(ctx, 0.7);
  if (t > 83.4) {
    const k = easeOut(inv(83.4, 84.0, t));
    ctx.fillStyle = `rgba(0,0,0,${0.55 * k})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = k; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    strokeText("ЮЛИАНА КЁПКЕ", W / 2, 1180, 92, "#ffffff");
    ctx.font = "800 44px M"; ctx.fillStyle = "#c9cbd6"; ctx.fillText("ЕДИНСТВЕННАЯ ВЫЖИВШАЯ", W / 2, 1290); ctx.fillText("РЕЙСА 508 АВИАКОМПАНИИ LANSA", W / 2, 1350);
    ctx.restore();
  }
  fadeBlack(inv(85.9, 86.6, t));
}

// ---------- монтаж ----------
const SHOTS = [
  [0, 1.25, shFall1], [1.25, 2.42, shFall2], [2.42, 3.73, shFall3], [3.73, 6.37, shBelt],
  [6.37, 7.86, shNotMovie], [7.86, 8.54, shLima], [8.54, 9.57, shXmas], [9.57, 11.74, shDate],
  [11.74, 13.34, shJul], [13.34, 16.0, shWalk], [16.0, 19.17, shDadAsk], [19.17, 20.93, shTakeoff],
  [20.93, 23.29, shStorm], [23.29, 25.84, shCabin], [25.84, 26.83, shFlashWin], [26.83, 29.08, shBolt],
  [29.08, 30.51, shBreak], [30.51, 31.83, shSkyWide], [31.83, 33.64, shWakeUp], [33.64, 34.9, shReveal],
  [34.9, 36.18, (t) => shInjury(t, 1)], [36.18, 37.56, (t) => shInjury(t, 2)], [37.56, 38.76, shEmpty], [38.76, 40.85, shDespair],
  [40.85, 42.71, shParents], [42.71, 45.89, shTeach], [45.89, 49.64, shMap], [49.64, 51.70, shStream],
  [51.70, 53.60, shDays], [53.60, 56.01, shPlaneUp], [56.01, 58.79, shPlaneTop], [58.79, 64.71, shThree],
  [64.71, 66.07, shOnward], [66.07, 68.14, shCandy], [68.14, 71.16, shHut], [71.16, 73.09, shLie],
  [73.09, 74.78, shMorning], [74.78, 76.33, shScared], [76.33, 78.13, shBoatAway], [78.13, 81.69, shStat],
  [81.69, 99, shFinal],
];

// Пояснение: что такое LANSA. Карточка в стиле «ПРАВИЛО №», появляется вместе с первым упоминанием.
function airlineChip(t) {
  const k = easeOut(inv(17.55, 17.85, t)), out = 1 - inv(20.6, 20.93, t);
  const a = k * out; if (a <= 0) return;
  const w = 900, h = 190, x = (W - w) / 2, y = 290 + (1 - k) * 30;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(14,12,24,0.88)"; rr(ctx, x, y, w, h, 26); ctx.fill();
  ctx.strokeStyle = "#ffd93b"; ctx.lineWidth = 6; rr(ctx, x, y, w, h, 26); ctx.stroke();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = "800 34px M"; ctx.fillStyle = "#ffd93b"; ctx.fillText("АВИАКОМПАНИЯ", W / 2, y + 52);
  ctx.font = "900 64px M"; ctx.fillStyle = "#ffffff"; ctx.fillText("LANSA · ПЕРУ", W / 2, y + 122);
  ctx.restore();
}
function hud(t) {
  if (t < 6.37) { hudPill("ПЕРУ · 24.12.1971", t); hudCounter("ВЫСОТА", `${ALT(t)} м`, t, "#ff4d4d"); return; }
  if (t < 11.74) return;
  if (t < 31.83) { hudPill(t < 20.93 ? "ЛИМА · 24.12.1971" : "АВИАКОМПАНИЯ LANSA · РЕЙС 508", t); if (t >= 17.55 && t < 20.93) airlineChip(t); return; }
  if (t < 78.13) {
    const flash = t >= 40.85 && t < 45.89;
    hudPill(flash ? "ВОСПОМИНАНИЕ" : "ПЕРУ · СЕЛЬВА", t);
    let d = 1;
    if (t >= 51.70) d = 2; if (t >= 52.48) d = 3;
    if (t >= 53.6) d = 3 + Math.floor(inv(53.6, 68.14, t) * 6.99);
    if (t >= 68.14) d = 10; if (t >= 73.09) d = 11;
    hudCounter("ДНЕЙ В ДЖУНГЛЯХ", String(d), t, "#ff4d4d");
  }
}
function camera(t) {
  let z = 1;
  for (const p of PUNCHES) if (t >= p && t < p + 0.35) z = Math.max(z, 1 + 0.045 * (1 - (t - p) / 0.35));
  let sh = 0;
  if (t < 6.37) sh = 5; else if (t > 23.29 && t < 31.0) sh = 9; else if (t > 61.6 && t < 62.2) sh = 4;
  return { z, dx: Math.sin(t * 51) * sh, dy: Math.cos(t * 43) * sh };
}
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.filter = "none"; ctx.globalCompositeOperation = "source-over";
  const cam = camera(t);
  ctx.save();
  ctx.translate(W / 2 + cam.dx, H / 2 + cam.dy); ctx.scale(cam.z, cam.z); ctx.translate(-W / 2, -H / 2);
  const sh = SHOTS.find(([a, b]) => t >= a && t < b);
  sh[2](t);
  ctx.restore();
  // переход: короткий провал в чёрное на каждой склейке
  for (const [a] of SHOTS) { const d = t - a; if (d >= 0 && d < 0.06 && a > 0) fadeBlack(0.5 * (1 - d / 0.06)); }
  hud(t);
  subtitles(t);
}
window.render = render;
window.ready = document.fonts.load("900 100px M", "ЁЖ").then(() => document.fonts.load("800 40px M", "ЁЖ")).then(() => document.fonts.ready);
