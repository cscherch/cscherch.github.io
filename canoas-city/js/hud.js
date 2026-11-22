import { F } from './world.js';

const $ = (id) => document.getElementById(id);
const PX = 6; // unidades do mundo por pixel do mapa

export class HUD {
  constructor(W) {
    this.W = W;
    this.mini = $('minimap'); this.mctx = this.mini.getContext('2d');
    this.big = $('bigmap'); this.bctx = this.big.getContext('2d');
    this.speedo = $('speedo'); this.sctx = this.speedo.getContext('2d');
    this.toastT = 0; this.hintT = 0;
    this.buildMap();
  }
  buildMap() {
    const W = this.W, R = W.raster;
    const w = Math.ceil((R.maxX - R.minX) / PX), h = Math.ceil((R.maxZ - R.minZ) / PX);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); const img = g.createImageData(w, h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const f = R.get(R.minX + (i + 0.5) * PX, R.minZ + (j + 0.5) * PX);
      let col;
      if ((f & F.WATER) && !(f & F.ROAD)) col = [38, 86, 128];
      else if (f & F.ROAD) col = [150, 154, 160];
      else if (f & F.BUILD) col = [72, 78, 90];
      else if (f & F.AREA) col = [62, 88, 58];
      else if (f & F.INSIDE) col = [44, 50, 60];
      else col = [38, 56, 36];
      const o = (j * w + i) * 4; img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const tx = (p) => [(p.x - R.minX) / PX, (p.z - R.minZ) / PX];
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const r of W.roads) {
      if (r.type === 'street' || r.type === 'service') continue;
      g.strokeStyle = r.type === 'highway' || r.type === 'trunk' ? '#f2c14e' : '#e8e8e8';
      g.lineWidth = Math.max(2, r.width / PX + 1);
      g.beginPath(); r.pts.forEach((p, i) => { const [x, y] = tx(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    }
    g.strokeStyle = '#d04848'; g.lineWidth = 2; g.setLineDash([5, 3]);
    g.beginPath(); W.rail.forEach((p, i) => { const [x, y] = tx(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.setLineDash([]);
    // limite municipal
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.setLineDash([8, 6]);
    g.beginPath(); W.boundary.forEach((p, i) => { const [x, y] = tx(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.stroke(); g.setLineDash([]);
    this.mapImg = c; this.tx = tx;
  }
  set(id, html) { const e = $(id); if (e._v !== html) { e.innerHTML = html; e._v = html; } }
  money(v) { this.set('money', 'R$ ' + v.toLocaleString('pt-BR')); }
  toast(msg, kind = '') {
    const box = $('toasts'); const d = document.createElement('div'); d.className = 'toast ' + kind; d.innerHTML = msg; box.appendChild(d);
    setTimeout(() => d.classList.add('out'), 3800); setTimeout(() => d.remove(), 4500);
  }
  hint(html) { this.set('hint', html); $('hint').style.opacity = 1; this.hintT = 0.15; }
  mission(title, html) {
    const e = $('mission');
    if (!title) { e.style.display = 'none'; $('timer').style.display = 'none'; return; }
    e.style.display = 'block'; this.set('mission', `<div class="mt">${title}</div><div>${html}</div><div class="mx">X para cancelar</div>`);
  }
  timer(t) {
    const e = $('timer'); e.style.display = 'block';
    const m = Math.floor(Math.max(0, t) / 60), s = Math.floor(Math.max(0, t) % 60);
    this.set('timer', `${m}:${String(s).padStart(2, '0')}`); e.classList.toggle('warn', t < 10);
  }
  update(dt, st) {
    if (this.hintT > 0) { this.hintT -= dt; if (this.hintT <= 0) $('hint').style.opacity = 0; }
    this.set('clock', st.clock);
    this.set('place', `<b>${st.hood}</b>${st.street ? '<br>' + st.street : ''}`);
    $('vehicle').style.display = st.car ? 'block' : 'none';
    if (st.car) this.drawSpeedo(st.kmh, st.car.health, st.car.spec.name);
    this.drawMini(st);
  }
  drawSpeedo(kmh, health, name) {
    const g = this.sctx, w = this.speedo.width, h = this.speedo.height, cx = w / 2, cy = h * 0.6, r = w * 0.4;
    g.clearRect(0, 0, w, h);
    const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2, max = 240;
    g.lineWidth = 10; g.strokeStyle = 'rgba(255,255,255,0.15)'; g.beginPath(); g.arc(cx, cy, r, a0, a1); g.stroke();
    const k = Math.min(1, kmh / max);
    const grad = g.createLinearGradient(0, 0, w, 0); grad.addColorStop(0, '#3cff9a'); grad.addColorStop(0.6, '#ffd21f'); grad.addColorStop(1, '#ff3b3b');
    g.strokeStyle = grad; g.beginPath(); g.arc(cx, cy, r, a0, a0 + (a1 - a0) * k); g.stroke();
    g.fillStyle = '#fff'; g.font = 'bold 44px Rajdhani, Arial'; g.textAlign = 'center'; g.fillText(Math.round(kmh), cx, cy + 10);
    g.font = '14px Rajdhani, Arial'; g.fillStyle = '#bbb'; g.fillText('km/h', cx, cy + 30);
    g.fillText(name, cx, h - 8);
    g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(cx - 50, cy + 40, 100, 6);
    g.fillStyle = health > 50 ? '#3cff9a' : health > 25 ? '#ffd21f' : '#ff3b3b'; g.fillRect(cx - 50, cy + 40, health, 6);
  }
  drawMini(st) {
    const g = this.mctx, S = this.mini.width, R = S / 2;
    g.clearRect(0, 0, S, S);
    g.save(); g.beginPath(); g.arc(R, R, R - 3, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#1b2420'; g.fillRect(0, 0, S, S);
    const zoom = st.car ? 1.6 - Math.min(0.8, st.kmh / 200) : 2.2;
    const rot = -Math.PI / 2 - st.camYaw;
    const [px, py] = this.tx(st.pos);
    g.translate(R, R); g.rotate(rot); g.scale(zoom, zoom);
    g.imageSmoothingEnabled = true;
    g.drawImage(this.mapImg, -px, -py);
    g.restore();
    const toScreen = (x, z) => {
      const [mx, my] = this.tx({ x, z });
      let dx = (mx - px) * zoom, dy = (my - py) * zoom;
      const c = Math.cos(rot), s = Math.sin(rot);
      let sx = dx * c - dy * s, sy = dx * s + dy * c;
      const L = Math.hypot(sx, sy), lim = R - 12; let edge = false;
      if (L > lim) { sx *= lim / L; sy *= lim / L; edge = true; }
      return [R + sx, R + sy, edge];
    };
    for (const b of st.blips) {
      const [x, y, edge] = toScreen(b.x, b.z);
      g.fillStyle = b.color; g.strokeStyle = '#000'; g.lineWidth = 2;
      g.beginPath(); g.arc(x, y, edge ? 5 : (b.size || 6), 0, Math.PI * 2); g.fill(); g.stroke();
    }
    // jogador
    g.save(); g.translate(R, R); g.rotate(rot + st.heading + Math.PI / 2);
    g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 7); g.lineTo(0, 3); g.lineTo(-6, 7); g.closePath(); g.fill(); g.stroke(); g.restore();
    // norte
    const nx = R + Math.cos(rot - Math.PI / 2) * (R - 12), ny = R + Math.sin(rot - Math.PI / 2) * (R - 12);
    g.fillStyle = '#fff'; g.font = 'bold 14px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', nx, ny);
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3; g.beginPath(); g.arc(R, R, R - 3, 0, Math.PI * 2); g.stroke();
  }
  drawBig(st) {
    const cv = this.big; cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
    const g = this.bctx; const img = this.mapImg;
    const k = Math.min(cv.width / img.width, cv.height / img.height) * 0.95;
    const ox = (cv.width - img.width * k) / 2, oy = (cv.height - img.height * k) / 2;
    g.fillStyle = '#0d1210'; g.fillRect(0, 0, cv.width, cv.height);
    g.drawImage(img, ox, oy, img.width * k, img.height * k);
    const T = (x, z) => { const [a, b] = this.tx({ x, z }); return [ox + a * k, oy + b * k]; };
    const dpr = devicePixelRatio;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `600 ${13 * dpr}px Rajdhani, Arial`;
    for (const n of this.W.neighborhoods) { const [x, y] = T(n.x, n.z); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillText(n.name.toUpperCase(), x, y); }
    g.font = `${11 * dpr}px Rajdhani, Arial`;
    for (const l of this.W.landmarks) { const [x, y] = T(l.x, l.z); g.fillStyle = '#ffd21f'; g.beginPath(); g.arc(x, y, 3 * dpr, 0, 7); g.fill(); g.fillStyle = '#ffe9a0'; g.fillText(l.name, x, y - 10 * dpr); }
    for (const b of st.blips) { const [x, y] = T(b.x, b.z); g.fillStyle = b.color; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, (b.size || 6) * dpr * 0.9, 0, 7); g.fill(); g.stroke(); }
    const [px, py] = T(st.pos.x, st.pos.z);
    g.save(); g.translate(px, py); g.rotate(st.heading + Math.PI / 2); g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -12 * dpr); g.lineTo(8 * dpr, 9 * dpr); g.lineTo(0, 4 * dpr); g.lineTo(-8 * dpr, 9 * dpr); g.closePath(); g.fill(); g.stroke(); g.restore();
    g.font = `bold ${22 * dpr}px Rajdhani, Arial`; g.fillStyle = '#fff'; g.textAlign = 'left';
    g.fillText('CANOAS — RS', 24 * dpr, 30 * dpr);
    g.font = `${13 * dpr}px Rajdhani, Arial`; g.fillStyle = '#aaa';
    g.fillText(this.W.osm ? 'Mapa: dados © OpenStreetMap' : 'Mapa: reconstrução aproximada de Canoas', 24 * dpr, 52 * dpr);
    g.fillText('M para fechar', 24 * dpr, 70 * dpr);
  }
}
