import * as THREE from 'three';
import { pointAlong } from './world.js';
import { shared } from './render.js';

const matCache = new Map();
function mat(color, opts = {}) {
  const k = color + JSON.stringify(opts);
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.55, ...opts }));
  return matCache.get(k);
}
const glassMat = new THREE.MeshStandardMaterial({ color: '#1a2633', roughness: 0.08, metalness: 0.9 });
const tireMat = new THREE.MeshStandardMaterial({ color: '#1b1b1b', roughness: 0.9 });
const rimMat = new THREE.MeshStandardMaterial({ color: '#b8bcc2', roughness: 0.3, metalness: 0.9 });
export const headMat = new THREE.MeshBasicMaterial({ color: '#fffbe8', toneMapped: false });
export const tailMat = new THREE.MeshBasicMaterial({ color: '#ff2a1a', toneMapped: false });
const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 14); wheelGeo.rotateX(Math.PI / 2);
const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.32, 8); rimGeo.rotateX(Math.PI / 2);

export const SPECS = {
  hatch: { L: 3.9, W: 1.7, H: 1.45, maxSpeed: 32, accel: 9, name: 'Hatch Popular', colors: ['#c8c8c8', '#d23b2f', '#f0f0f0', '#2c3e66', '#222', '#8a8f93'] },
  sedan: { L: 4.5, W: 1.8, H: 1.45, maxSpeed: 37, accel: 10, name: 'Sedã', colors: ['#1d1d1f', '#9ea3a8', '#f2f2f2', '#5a1a1a', '#21405e'] },
  sport: { L: 4.4, W: 1.95, H: 1.2, maxSpeed: 48, accel: 16, name: 'Esportivo', colors: ['#e3a21a', '#c4161c', '#1f6fd1', '#14a36b'] },
  pickup: { L: 5.2, W: 1.9, H: 1.8, maxSpeed: 34, accel: 9, name: 'Picape', colors: ['#f0f0f0', '#4a4a4a', '#7a5a3a', '#2d4a2a'] },
  taxi: { L: 4.5, W: 1.8, H: 1.45, maxSpeed: 36, accel: 10, name: 'Táxi', colors: ['#f2f2f2'] },
  bus: { L: 12, W: 2.6, H: 3.3, maxSpeed: 24, accel: 4.5, name: 'Ônibus', colors: ['#2a6fb5', '#d9a21b', '#2f8a4a'] },
  police: { L: 4.6, W: 1.85, H: 1.5, maxSpeed: 44, accel: 14, name: 'Viatura', colors: ['#f4f4f4'] },
};

export function makeCarModel(type, color) {
  const sp = SPECS[type];
  color = color || sp.colors[Math.floor(Math.random() * sp.colors.length)];
  const g = new THREE.Group();
  const { L, W, H } = sp;
  const body = mat(color);
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  if (type === 'bus') {
    add(new THREE.BoxGeometry(L, H - 0.5, W), body, 0, 0.45 + (H - 0.5) / 2, 0);
    add(new THREE.BoxGeometry(L * 0.92, 0.9, W + 0.02), glassMat, -0.2, H - 1.1, 0);
    add(new THREE.BoxGeometry(0.05, 1.4, W * 0.9), glassMat, L / 2 + 0.01, H - 1.4, 0);
    add(new THREE.BoxGeometry(L * 0.98, 0.12, W * 0.98), mat('#e8e8e8'), 0, H - 0.02, 0);
  } else {
    const lowH = type === 'sport' ? 0.55 : 0.7;
    add(new THREE.BoxGeometry(L, lowH, W), body, 0, 0.35 + lowH / 2, 0);
    // capô inclinado
    const hood = add(new THREE.BoxGeometry(L * 0.28, 0.12, W * 0.96), body, L * 0.33, 0.35 + lowH + 0.02, 0); hood.rotation.z = -0.08;
    if (type === 'pickup') {
      add(new THREE.BoxGeometry(L * 0.38, H - lowH - 0.35, W * 0.92), body, L * 0.05, 0.35 + lowH + (H - lowH - 0.35) / 2, 0);
      add(new THREE.BoxGeometry(L * 0.37, (H - lowH - 0.35) * 0.6, W * 0.94), glassMat, L * 0.05, 0.35 + lowH + (H - lowH - 0.35) * 0.55, 0);
      for (const z of [-1, 1]) add(new THREE.BoxGeometry(L * 0.38, 0.35, 0.08), body, -L * 0.3, 0.35 + lowH + 0.17, z * W * 0.46);
    } else {
      const cabL = type === 'hatch' ? L * 0.55 : L * 0.5;
      const cabX = type === 'hatch' ? -L * 0.12 : -L * 0.05;
      const cabH = H - lowH - 0.35;
      add(new THREE.BoxGeometry(cabL, cabH, W * 0.86), glassMat, cabX, 0.35 + lowH + cabH / 2, 0);
      add(new THREE.BoxGeometry(cabL * 0.82, 0.08, W * 0.84), body, cabX, 0.35 + lowH + cabH, 0);
    }
  }
  // faróis e lanternas
  for (const z of [-1, 1]) {
    add(new THREE.BoxGeometry(0.06, 0.18, 0.38), headMat, L / 2 + 0.01, 0.8, z * (W / 2 - 0.3));
    add(new THREE.BoxGeometry(0.06, 0.18, 0.38), tailMat, -L / 2 - 0.01, 0.85, z * (W / 2 - 0.3));
  }
  if (type === 'taxi') {
    add(new THREE.BoxGeometry(0.9, 0.3, 0.4), mat('#ffd21f', { metalness: 0 }), -L * 0.05, H + 0.15, 0);
    add(new THREE.BoxGeometry(L * 0.98, 0.18, W + 0.02), mat('#d22', { metalness: 0 }), 0, 0.75, 0);
  }
  if (type === 'police') {
    add(new THREE.BoxGeometry(L * 0.98, 0.25, W + 0.02), mat('#1d3f8a', { metalness: 0 }), 0, 0.75, 0);
    const bar = add(new THREE.BoxGeometry(0.4, 0.18, 1.2), new THREE.MeshBasicMaterial({ color: '#ff2020', toneMapped: false }), -L * 0.05, H + 0.1, 0);
    g.userData.siren = bar;
  }
  const wheels = [];
  const wx = type === 'bus' ? L / 2 - 2.2 : L / 2 - 0.75;
  for (const x of [wx, -wx]) for (const z of [-1, 1]) {
    const w = new THREE.Group();
    const t = new THREE.Mesh(wheelGeo, tireMat); t.castShadow = true; w.add(t);
    const r = new THREE.Mesh(rimGeo, rimMat); w.add(r);
    w.position.set(x, 0.38, z * (W / 2 - 0.12)); g.add(w); wheels.push(w);
  }
  g.userData.wheels = wheels;
  g.userData.type = type;
  g.userData.color = color;
  return g;
}

// ---------- Carro dirigível (física arcade) ----------
export class Car {
  constructor(scene, type, x, z, heading, model) {
    this.type = type; this.spec = SPECS[type];
    this.model = model || makeCarModel(type);
    scene.add(this.model);
    this.pos = new THREE.Vector3(x, 0, z);
    this.heading = heading; this.vel = new THREE.Vector2(); this.steer = 0; this.health = 100; this.wheelRot = 0;
    this.driven = false;
    this.sync();
  }
  get speed() { return this.vel.length(); }
  get forwardSpeed() { return this.vel.x * Math.cos(this.heading) + this.vel.y * Math.sin(this.heading); }
  sync() {
    this.model.position.copy(this.pos);
    this.model.rotation.y = -this.heading;
  }
  blockedAt(W, x, z, h) {
    const c = Math.cos(h), s = Math.sin(h), hl = this.spec.L / 2 * 0.95, hw = this.spec.W / 2 * 0.9;
    for (const [u, v] of [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw], [hl, 0], [0, hw], [0, -hw], [-hl, 0]]) {
      if (W.isSolid(x + u * c - v * s, z + u * s + v * c)) return true;
    }
    return false;
  }
  update(dt, inp, W) {
    const sp = this.spec;
    const c = Math.cos(this.heading), s = Math.sin(this.heading);
    let vf = this.vel.x * c + this.vel.y * s;
    let vl = -this.vel.x * s + this.vel.y * c;
    const max = sp.maxSpeed * (this.health > 25 ? 1 : 0.6);
    if (inp.up) vf += sp.accel * dt * Math.max(0.15, 1 - Math.max(0, vf) / max);
    if (inp.down) { if (vf > 0.5) vf -= 22 * dt; else vf = Math.max(-max * 0.35, vf - sp.accel * 0.6 * dt); }
    if (!inp.up && !inp.down) vf -= Math.sign(vf) * Math.min(Math.abs(vf), (1.2 + Math.abs(vf) * 0.06) * dt);
    vf -= vf * 0.02 * dt;
    let grip = 9;
    if (inp.brake) { vf -= Math.sign(vf) * Math.min(Math.abs(vf), 14 * dt); grip = 1.6; }
    vl *= Math.exp(-grip * dt);
    const target = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    this.steer += (target - this.steer) * Math.min(1, dt * 7);
    const wb = sp.L * 0.6;
    const steerAng = this.steer * 0.62 / (1 + Math.abs(vf) * 0.045);
    const yaw = (vf / wb) * Math.tan(steerAng) * (inp.brake ? 1.35 : 1);
    this.heading += yaw * dt;
    const c2 = Math.cos(this.heading), s2 = Math.sin(this.heading);
    this.vel.set(c2 * vf - s2 * vl, s2 * vf + c2 * vl);
    this.drift = Math.abs(vl);

    let impact = 0;
    const nx = this.pos.x + this.vel.x * dt, nz = this.pos.z + this.vel.y * dt;
    if (!this.blockedAt(W, nx, nz, this.heading)) { this.pos.x = nx; this.pos.z = nz; }
    else {
      impact = this.speed;
      if (!this.blockedAt(W, nx, this.pos.z, this.heading)) { this.pos.x = nx; this.vel.y *= -0.2; this.vel.x *= 0.7; }
      else if (!this.blockedAt(W, this.pos.x, nz, this.heading)) { this.pos.z = nz; this.vel.x *= -0.2; this.vel.y *= 0.7; }
      else { this.vel.multiplyScalar(-0.25); }
      if (this.blockedAt(W, this.pos.x, this.pos.z, this.heading)) this.heading -= yaw * dt; // desfaz a rotação
      impact = Math.max(0, impact - this.speed * 0.5);
    }
    this.wheelRot += vf * dt / 0.38;
    const wh = this.model.userData.wheels;
    wh.forEach((w, i) => { w.children[0].rotation.z = -this.wheelRot; w.children[1].rotation.z = -this.wheelRot; if (i < 2) w.rotation.y = -this.steer * 0.5; });
    // inclinação lateral
    this.model.rotation.z = THREE.MathUtils.clamp(vl * 0.01, -0.06, 0.06);
    this.sync();
    this.model.rotation.x = THREE.MathUtils.clamp(-yaw * vf * 0.004, -0.08, 0.08);
    return impact;
  }
}

// ---------- Tráfego ----------
export class Traffic {
  constructor(scene, W, count = 46) {
    this.scene = scene; this.W = W; this.cars = [];
    this.laneSamples = W.lanes.map((l) => { const s = []; for (let d = 0; d < l.road.len; d += 40) s.push(d); return s; });
    const types = ['hatch', 'hatch', 'hatch', 'sedan', 'sedan', 'pickup', 'taxi', 'bus', 'sport', 'hatch', 'sedan', 'police'];
    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const model = makeCarModel(type);
      scene.add(model);
      const c = { model, type, spec: SPECS[type], lane: 0, d: 0, speed: 0, wait: 0, wheelRot: 0, active: false, horn: 0 };
      this.cars.push(c);
    }
  }
  place(c, px, pz, near) {
    const W = this.W;
    for (let t = 0; t < 30; t++) {
      const li = Math.floor(Math.random() * W.lanes.length);
      const lane = W.lanes[li];
      const ss = this.laneSamples[li];
      const d = ss[Math.floor(Math.random() * ss.length)];
      const p = this.posOf(lane, d);
      const dist = Math.hypot(p.x - px, p.z - pz);
      if (dist > (near ? 40 : 220) && dist < 600) {
        if (this.cars.some((o) => o !== c && o.active && o.lane === li && Math.abs(o.d - d) < 20)) continue;
        c.lane = li; c.d = d; c.speed = lane.road.type === 'highway' ? 22 : 14; c.active = true; c.model.visible = true;
        return true;
      }
    }
    return false;
  }
  posOf(lane, d) {
    const r = lane.road;
    if (lane.dir > 0) { const p = pointAlong(r, d, lane.off); return { x: p.x, z: p.z, h: Math.atan2(p.dz, p.dx) }; }
    const p = pointAlong(r, r.len - d, -lane.off); return { x: p.x, z: p.z, h: Math.atan2(-p.dz, -p.dx) };
  }
  update(dt, px, pz, playerCar, onFootPos) {
    const W = this.W;
    // agrupa por faixa
    const byLane = new Map();
    for (const c of this.cars) if (c.active) { let a = byLane.get(c.lane); if (!a) byLane.set(c.lane, (a = [])); a.push(c); }
    for (const arr of byLane.values()) arr.sort((a, b) => a.d - b.d);
    for (const c of this.cars) {
      if (!c.active || Math.hypot(c.model.position.x - px, c.model.position.z - pz) > 750) { c.active = false; c.model.visible = false; this.place(c, px, pz, false); continue; }
      const lane = W.lanes[c.lane];
      const limit = lane.road.type === 'highway' ? 26 : lane.road.type === 'avenue' || lane.road.type === 'primary' ? 17 : 13;
      let target = Math.min(limit, c.spec.maxSpeed * 0.8);
      const arr = byLane.get(c.lane); const idx = arr.indexOf(c);
      const ahead = arr[idx + 1];
      if (ahead) { const gap = ahead.d - c.d - (c.spec.L + ahead.spec.L) / 2; if (gap < 25) target = Math.min(target, Math.max(0, (gap - 4) * 0.8)); }
      // jogador à frente
      const cp = c.model.position, h = -c.model.rotation.y;
      const fx = Math.cos(h), fz = Math.sin(h);
      for (const o of [playerCar ? playerCar.pos : null, onFootPos]) {
        if (!o) continue;
        const dx = o.x - cp.x, dz = o.z - cp.z;
        const along = dx * fx + dz * fz, lat = Math.abs(-dx * fz + dz * fx);
        if (along > 0 && along < 22 && lat < 2.8) { target = Math.min(target, Math.max(0, (along - 6) * 0.7)); if (along < 12 && Math.random() < dt * 0.4) c.horn = 0.5; }
      }
      if (c.wait > 0) { c.wait -= dt; target = 0; }
      c.speed += THREE.MathUtils.clamp(target - c.speed, -18 * dt, c.spec.accel * 0.6 * dt);
      c.d += c.speed * dt;
      if (c.d >= lane.road.len - 2) {
        // retorno: vai para a faixa oposta
        const opp = W.lanes.findIndex((l) => l.road === lane.road && l.dir !== lane.dir);
        c.lane = opp; c.d = 2;
      }
      const p = this.posOf(W.lanes[c.lane], c.d);
      // suaviza rotação
      let dh = p.h - h; while (dh > Math.PI) dh -= Math.PI * 2; while (dh < -Math.PI) dh += Math.PI * 2;
      c.model.position.set(p.x, 0, p.z);
      c.model.rotation.y = -(h + dh * Math.min(1, dt * 8));
      c.wheelRot += c.speed * dt / 0.38;
      for (const w of c.model.userData.wheels) { w.children[0].rotation.z = -c.wheelRot; w.children[1].rotation.z = -c.wheelRot; }
      if (c.model.userData.siren) c.model.userData.siren.material.color.set(Math.floor(shared.time.value * 4) % 2 ? '#ff2020' : '#2040ff');
      if (c.horn > 0) c.horn -= dt;
    }
  }
  // colisão do carro do jogador com o tráfego (círculos ao longo do comprimento)
  collide(car) {
    let hit = 0;
    for (const c of this.cars) {
      if (!c.active) continue;
      const dx = car.pos.x - c.model.position.x, dz = car.pos.z - c.model.position.z;
      const lim = (car.spec.L + c.spec.L) / 2;
      if (dx * dx + dz * dz > lim * lim) continue;
      // teste mais fino em caixa
      const h = -c.model.rotation.y, fx = Math.cos(h), fz = Math.sin(h);
      const along = dx * fx + dz * fz, lat = -dx * fz + dz * fx;
      const ea = c.spec.L / 2 + car.spec.W / 2 * 0.9, el = c.spec.W / 2 + car.spec.W / 2 * 0.9;
      if (Math.abs(along) < ea && Math.abs(lat) < el) {
        const pa = ea - Math.abs(along), pl = el - Math.abs(lat);
        let nx, nz;
        if (pa < pl) { nx = fx * Math.sign(along); nz = fz * Math.sign(along); car.pos.x += nx * pa; car.pos.z += nz * pa; }
        else { nx = -fz * Math.sign(lat); nz = fx * Math.sign(lat); car.pos.x += nx * pl; car.pos.z += nz * pl; }
        const vn = car.vel.x * nx + car.vel.y * nz;
        if (vn < 0) { car.vel.x -= 1.4 * vn * nx; car.vel.y -= 1.4 * vn * nz; hit = Math.max(hit, -vn); }
        c.wait = 2.5; c.speed = 0; c.horn = 1;
      }
    }
    return hit;
  }
  nearest(x, z, maxD) {
    let best = null, bd = maxD;
    for (const c of this.cars) {
      if (!c.active) continue;
      const d = Math.hypot(c.model.position.x - x, c.model.position.z - z);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }
  remove(c) { c.active = false; this.cars.splice(this.cars.indexOf(c), 1); }
}

// ---------- Trem do Trensurb ----------
export class Train {
  constructor(scene, W, off, startD, dir) {
    this.W = W; this.off = off; this.d = startD; this.dir = dir; this.speed = 16; this.wait = 0;
    this.cars = [];
    const body = new THREE.MeshStandardMaterial({ color: '#f2f2f0', roughness: 0.4, metalness: 0.4 });
    const stripe = new THREE.MeshStandardMaterial({ color: '#1f5fbf', roughness: 0.4 });
    const stripe2 = new THREE.MeshStandardMaterial({ color: '#f08a1c', roughness: 0.4 });
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(21, 3.4, 2.9), body); b.position.y = 2.4; b.castShadow = true; g.add(b);
      const w = new THREE.Mesh(new THREE.BoxGeometry(20.4, 1.0, 2.95), glassMat); w.position.y = 2.9; g.add(w);
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(21.02, 0.3, 2.96), stripe); s1.position.y = 1.6; g.add(s1);
      const s2 = new THREE.Mesh(new THREE.BoxGeometry(21.02, 0.15, 2.96), stripe2); s2.position.y = 1.35; g.add(s2);
      scene.add(g); this.cars.push(g);
    }
  }
  update(dt) {
    const rr = this.W.railRoad; if (!rr) return;
    // para nas estações
    if (this.wait > 0) { this.wait -= dt; }
    else {
      const next = this.d + this.dir * this.speed * dt;
      for (const s of this.W.stations) {
        if (s.rd != null && (this.d - s.rd) * (next - s.rd) < 0 && !this.lastStop?.includes(s.name)) { this.wait = 6; this.lastStop = s.name; }
      }
      this.d = next;
      if (this.d > rr.len - 60 || this.d < 60) { this.dir *= -1; this.d = THREE.MathUtils.clamp(this.d, 61, rr.len - 61); this.lastStop = null; }
    }
    this.cars.forEach((g, i) => {
      const d = this.d - this.dir * i * 21.6;
      const a = pointAlong(rr, d - 8, this.off), b = pointAlong(rr, d + 8, this.off);
      g.position.set((a.x + b.x) / 2, 0.3, (a.z + b.z) / 2);
      g.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    });
  }
}
