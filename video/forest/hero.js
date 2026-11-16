// Герой: Дима в зимней одежде. Рисуется на отдельном слое, потом получает свет и тень сцены.
// winterMan(x, y, s, o): стоя, вид спереди, ступни на y+60, рост ~770*s.
// winterSit(x, y, s, o): сидит, обхватив колени, сиденье на y.
// Опции o: t, core (тепло внутри, 0..1), cold (холод от конечностей, 0..1), wetBack (пот, 0..1),
// shiver (дрожь), zip (0 закрыта .. 1 открыта), zipCol, jacketOff (0..1), eyes ("open"|"closed"|"tired"),
// light ("warm"|"cold"), breath (true/false).

const HL = document.createElement("canvas"); HL.width = W; HL.height = H; const hl = HL.getContext("2d");

const C_JACKET = "#b4432e", C_JACKET_SH = "#8a2f20", C_JACKET_HI = "#d0603f";
const C_PANTS = "#1f2a44", C_PANTS_SH = "#151d31";
const C_BOOT = "#3d2b20", C_SOLE = "#17110d";
const C_GLOVE = "#2b2f38", C_SKIN = "#efc6a6", C_SKIN_SH = "#d9a888";
const C_HAT = "#2f6f73", C_HAT_SH = "#22555a", C_SCARF = "#d9a441", C_SCARF_SH = "#b88629";
const C_FUR = "#cbbda6", C_FUR_SH = "#9e907b", C_SWEATER = "#6b6f7a";

function P(c, f) { c.beginPath(); f(); }
function rrc(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function fillWith(c, col, path) { path(); c.fillStyle = col; c.fill(); }

// ---- части ----
function boots(c, sx) { rrc(c, sx < 0 ? -96 : 14, 2, 84, 58, 20); c.fillStyle = C_BOOT; c.fill(); c.fillStyle = C_SOLE; c.fillRect(sx < 0 ? -100 : 10, 48, 92, 14); c.fillStyle = "rgba(255,255,255,0.12)"; c.fillRect(sx < 0 ? -86 : 24, 14, 50, 6); }
function legPath(c, sx) { rrc(c, sx < 0 ? -90 : 12, -255, 78, 268, 28); }
function jacketPath(c) {
  c.beginPath();
  c.moveTo(-120, -505); c.quadraticCurveTo(0, -540, 120, -505);
  c.lineTo(128, -215); c.quadraticCurveTo(0, -192, -128, -215); c.closePath();
}
function sleevePath(c, sx) { c.save(); c.translate(sx * 120, -500); c.rotate(-sx * 0.12); rrc(c, -34, 0, 68, 262, 32); c.restore(); }
function gloveAt(sx) { return [sx * 120 + sx * 31, -500 + 262 * Math.cos(0.12) + 6]; }
function headPath(c) { c.beginPath(); c.ellipse(0, -640, 64, 76, 0, 0, Math.PI * 2); }

function drawJacket(c, o) {
  // рукава
  for (const sx of [-1, 1]) {
    sleevePath(c, sx); c.fillStyle = C_JACKET; c.fill();
    c.save(); c.translate(sx * 120, -500); c.rotate(-sx * 0.12);
    c.strokeStyle = C_JACKET_SH; c.lineWidth = 4; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(-32, i * 52); c.quadraticCurveTo(0, i * 52 + 8, 32, i * 52); c.stroke(); }
    c.fillStyle = C_JACKET_SH; rrc(c, -36, 236, 72, 26, 10); c.fill();
    c.restore();
  }
  // корпус
  jacketPath(c); c.fillStyle = C_JACKET; c.fill();
  c.save(); jacketPath(c); c.clip();
  c.strokeStyle = C_JACKET_SH; c.lineWidth = 5;
  for (let i = 0; i < 6; i++) { const y = -470 + i * 50; c.beginPath(); c.moveTo(-130, y); c.quadraticCurveTo(0, y + 12, 130, y); c.stroke(); }
  c.fillStyle = "rgba(255,255,255,0.08)"; for (let i = 0; i < 6; i++) { const y = -495 + i * 50; c.fillRect(30, y + 14, 70, 8); }
  // молния
  const zip = o.zip || 0;
  if (zip > 0) { c.fillStyle = C_SWEATER; c.beginPath(); c.moveTo(-4, -520); c.lineTo(4, -520); c.lineTo(4 + 40 * zip, lerp(-520, -215, zip)); c.lineTo(-4 - 40 * zip, lerp(-520, -215, zip)); c.fill(); }
  c.strokeStyle = "#5a1d13"; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -515); c.lineTo(0, -215); c.stroke();
  c.fillStyle = o.zipCol && zip > 0 ? o.zipCol : "#d8d2c8"; rrc(c, -10, lerp(-520, -330, zip), 20, 34, 5); c.fill();
  // карманы
  c.strokeStyle = C_JACKET_SH; c.lineWidth = 5; for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 30, -300); c.lineTo(sx * 95, -310); c.stroke(); }
  // пот: тёмные мокрые пятна, капли
  if (o.wetBack) {
    c.fillStyle = `rgba(20,30,70,${0.45 * o.wetBack})`; c.beginPath(); c.ellipse(0, -400, 110, 140, 0, 0, Math.PI * 2); c.fill();
    const r = rng(3); for (let i = 0; i < 12; i++) { const dx = (r() - 0.5) * 200, dy = -480 + r() * 240 + (((o.t || 0) * 50 + i * 30) % 40); c.fillStyle = `rgba(150,200,255,${0.9 * o.wetBack})`; c.beginPath(); c.ellipse(dx, dy, 6, 10, 0, 0, Math.PI * 2); c.fill(); }
  }
  c.restore();
}
function drawHeadGear(c, o, t) {
  // капюшон с мехом за головой
  const r = rng(11);
  for (let i = 0; i < 22; i++) { const a = Math.PI * (0.95 + i / 21 * 1.1), rr2 = 76 + r() * 8; c.fillStyle = i % 2 ? C_FUR : C_FUR_SH; c.beginPath(); c.arc(Math.cos(a) * rr2, -600 + Math.sin(a) * rr2 * 0.55 + 40, 17 + r() * 5, 0, Math.PI * 2); c.fill(); }
  // шея и шарф
  c.fillStyle = C_SKIN_SH; c.fillRect(-26, -580, 52, 40);
  rrc(c, -78, -566, 156, 52, 24); c.fillStyle = C_SCARF; c.fill();
  c.strokeStyle = C_SCARF_SH; c.lineWidth = 6; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 30, -562); c.lineTo(i * 30 + 8, -518); c.stroke(); }
  c.save(); c.translate(42, -526); c.rotate(0.08 + Math.sin(t * 2) * 0.03); rrc(c, -22, 0, 48, 150, 12); c.fillStyle = C_SCARF; c.fill(); c.fillStyle = C_SCARF_SH; c.fillRect(-22, 40, 48, 10); c.fillRect(-22, 80, 48, 10); for (let i = 0; i < 6; i++) c.fillRect(-20 + i * 8, 150, 4, 16); c.restore();
  // голова
  headPath(c); c.fillStyle = C_SKIN; c.fill();
  c.fillStyle = C_SKIN_SH; c.beginPath(); c.ellipse(-30, -610, 30, 40, 0.3, 0, Math.PI * 2); c.globalAlpha = 0.35; c.fill(); c.globalAlpha = 1;
  // лицо
  const eyes = o.eyes || "open";
  c.fillStyle = "rgba(220,80,80,0.42)"; c.beginPath(); c.ellipse(-36, -612, 18, 11, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(36, -612, 18, 11, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(210,90,80,0.6)"; c.beginPath(); c.ellipse(0, -618, 10, 13, 0, 0, Math.PI * 2); c.fill();
  if (eyes === "closed") { c.strokeStyle = "#3a2618"; c.lineWidth = 5; c.lineCap = "round"; for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 25, -646, 11, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); } }
  else {
    for (const sx of [-1, 1]) { c.fillStyle = "#fff"; c.beginPath(); c.ellipse(sx * 25, -646, 12, eyes === "tired" ? 5 : 8, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#2a1c14"; c.beginPath(); c.arc(sx * 25 + 1, -646, 5.5, 0, Math.PI * 2); c.fill(); }
  }
  c.strokeStyle = (o.cold || 0) > 0.5 ? "#dfe9f7" : "#5a3b28"; c.lineWidth = 6; c.lineCap = "round";
  for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 12, -664 - (o.worried ? 4 : 0)); c.lineTo(sx * 38, -666 + (o.worried ? 4 : 0)); c.stroke(); }
  c.strokeStyle = "#7a3a30"; c.lineWidth = 5; c.beginPath(); c.moveTo(-14, -592); c.quadraticCurveTo(0, -596, 14, -592); c.stroke();
  // шапка
  c.fillStyle = C_HAT; c.beginPath(); c.ellipse(0, -690, 70, 62, 0, Math.PI, 0); c.fill();
  c.fillStyle = "rgba(255,255,255,0.75)"; for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(i * 22, -716, 4, 0, Math.PI * 2); c.fill(); }
  rrc(c, -74, -702, 148, 40, 14); c.fillStyle = C_HAT_SH; c.fill();
  c.strokeStyle = "rgba(0,0,0,0.25)"; c.lineWidth = 3; for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(i * 11, -700); c.lineTo(i * 11, -664); c.stroke(); }
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; c.fillStyle = i % 2 ? "#e9e4da" : "#cfc8bb"; c.beginPath(); c.arc(Math.cos(a) * 14, -762 + Math.sin(a) * 14, 16, 0, Math.PI * 2); c.fill(); }
}
function breath(c, t) {
  for (let i = 0; i < 3; i++) { const q = ((t * 0.45 + i / 3) % 1); c.fillStyle = `rgba(235,242,255,${0.5 * (1 - q)})`; c.beginPath(); c.arc(28 + q * 90, -594 - q * 70, 12 + q * 34, 0, Math.PI * 2); c.fill(); }
}
function iceOver(c, a, path) { if (a <= 0) return; path(); c.fillStyle = `rgba(160,205,255,${clamp(a) * 0.7})`; c.fill(); }

function drawStanding(c, o, t) {
  const cold = o.cold || 0, off = o.jacketOff || 0;
  for (const sx of [-1, 1]) { legPath(c, sx); c.fillStyle = C_PANTS; c.fill(); c.fillStyle = C_PANTS_SH; c.fillRect(sx < 0 ? -90 : 12, -150, 78, 8); boots(c, sx); }
  if (off > 0) { // свитер под курткой
    rrc(c, -112, -510, 224, 300, 50); c.fillStyle = C_SWEATER; c.fill();
    for (const sx of [-1, 1]) { sleevePath(c, sx); c.fillStyle = C_SWEATER; c.fill(); }
  }
  drawHeadGear(c, o, t);
  c.save(); if (off > 0) { c.globalAlpha = 1 - off * 0.55; c.translate(off * 280, -off * 30); c.rotate(off * 0.2); }
  drawJacket(c, o);
  c.restore();
  for (const sx of [-1, 1]) { const [gx, gy] = gloveAt(sx); c.fillStyle = C_GLOVE; c.beginPath(); c.ellipse(gx, gy + 18, 32, 38, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#3b404c"; c.fillRect(gx - 30, gy - 8, 60, 14); }
  // тепло внутри
  if (o.core) { c.save(); c.globalCompositeOperation = "source-atop"; const g = c.createRadialGradient(0, -380, 10, 0, -380, 220); g.addColorStop(0, `rgba(255,170,80,${o.core * 0.75})`); g.addColorStop(1, "rgba(255,170,80,0)"); c.fillStyle = g; c.fillRect(-140, -560, 280, 380); c.restore(); }
  // холод от конечностей к центру
  if (cold) {
    for (const sx of [-1, 1]) { const [gx, gy] = gloveAt(sx); iceOver(c, cold * 3, () => { c.beginPath(); c.ellipse(gx, gy + 18, 32, 38, 0, 0, Math.PI * 2); }); iceOver(c, cold * 3, () => rrc(c, sx < 0 ? -96 : 14, 2, 84, 58, 20)); }
    for (const sx of [-1, 1]) { iceOver(c, cold * 2 - 0.5, () => sleevePath(c, sx)); iceOver(c, cold * 2 - 0.5, () => legPath(c, sx)); }
    iceOver(c, cold * 1.5 - 0.9, () => jacketPath(c));
    iceOver(c, cold * 1.2 - 0.6, () => headPath(c));
  }
  if (o.breath !== false) breath(c, t);
}
function drawSitting(c, o, t) {
  const cold = o.cold || 0;
  c.save(); c.translate(0, 120);
  jacketPath(c); c.fillStyle = C_JACKET; c.fill();
  c.save(); jacketPath(c); c.clip(); c.strokeStyle = C_JACKET_SH; c.lineWidth = 5; for (let i = 0; i < 6; i++) { const y = -470 + i * 50; c.beginPath(); c.moveTo(-130, y); c.quadraticCurveTo(0, y + 12, 130, y); c.stroke(); } c.restore();
  drawHeadGear(c, o, t);
  if (o.breath !== false) breath(c, t);
  c.restore();
  // голени, колени, ботинки
  for (const sx of [-1, 1]) {
    rrc(c, sx < 0 ? -100 : 26, -150, 74, 160, 26); c.fillStyle = C_PANTS; c.fill();
    c.fillStyle = C_PANTS; c.beginPath(); c.arc(sx * 62, -160, 52, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(sx < 0 ? -4 : 18, 0); rrc(c, sx < 0 ? -100 : 26 - 18 + 4, 0, 84, 50, 18); c.restore();
    rrc(c, sx < 0 ? -106 : 22, 0, 86, 52, 18); c.fillStyle = C_BOOT; c.fill(); c.fillStyle = C_SOLE; c.fillRect(sx < 0 ? -108 : 20, 42, 90, 12);
  }
  // руки обхватывают колени
  for (const sx of [-1, 1]) { c.save(); c.translate(sx * 125, -330); c.rotate(sx * 0.9); rrc(c, -32, 0, 64, 200, 30); c.fillStyle = C_JACKET; c.fill(); c.restore(); }
  c.fillStyle = C_GLOVE; c.beginPath(); c.ellipse(-26, -190, 34, 30, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(26, -184, 34, 30, 0, 0, Math.PI * 2); c.fill();
  if (cold) {
    iceOver(c, cold * 3, () => { c.beginPath(); c.ellipse(0, -188, 64, 34, 0, 0, Math.PI * 2); });
    for (const sx of [-1, 1]) iceOver(c, cold * 3, () => rrc(c, sx < 0 ? -106 : 22, 0, 86, 52, 18));
    iceOver(c, cold * 1.6 - 0.6, () => { c.save(); c.translate(0, 120); headPath(c); c.restore(); });
  }
}
function lightHero(x, y, s, o, drawFn) {
  hl.setTransform(1, 0, 0, 1, 0, 0); hl.clearRect(0, 0, W, H);
  const m = ctx.getTransform();
  hl.setTransform(m); hl.translate(x + (o.shiver || 0) * Math.sin((o.t || 0) * 70) * 6, y); hl.scale(s, s);
  drawFn(hl, o, o.t || 0);
  // свет и тень
  const p = m.transformPoint(new DOMPoint(x, y - 380 * s)), sw = 260 * s * Math.hypot(m.a, m.b);
  hl.setTransform(1, 0, 0, 1, 0, 0); hl.globalCompositeOperation = "source-atop";
  const lightCol = o.light === "cold" ? "rgba(150,190,255,0.28)" : "rgba(255,190,120,0.28)";
  const g = hl.createLinearGradient(p.x - sw, 0, p.x + sw, 0);
  g.addColorStop(0, "rgba(5,8,25,0.55)"); g.addColorStop(0.45, "rgba(5,8,25,0.08)"); g.addColorStop(0.75, "rgba(0,0,0,0)"); g.addColorStop(1, lightCol);
  hl.fillStyle = g; hl.fillRect(0, 0, W, H);
  const v = hl.createLinearGradient(0, p.y - sw * 1.6, 0, p.y + sw * 1.8); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,15,0.35)");
  hl.fillStyle = v; hl.fillRect(0, 0, W, H);
  hl.globalCompositeOperation = "source-over";
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  // тень на земле
  ctx.globalAlpha = 0.45; ctx.fillStyle = "#000"; const f = m.transformPoint(new DOMPoint(x, y + 62 * s)); ctx.beginPath(); ctx.ellipse(f.x, f.y, 170 * s, 26 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  ctx.drawImage(HL, 0, 0); ctx.restore();
}
function winterMan(x, y, s, o = {}) { lightHero(x, y, s, o, drawStanding); }
function winterSit(x, y, s, o = {}) { lightHero(x, y, s, Object.assign({ jacketOff: 0 }, o), drawSitting); }
