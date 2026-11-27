import * as THREE from 'three';
import { F } from './world.js';

function limb(w, h, d, m) { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, -h / 2, 0); const o = new THREE.Mesh(g, m); o.castShadow = true; return o; }

export function makePerson(shirt = '#2b6cb0', pants = '#2d3748', skin = '#c68e66', hair = '#2a1b12') {
  const g = new THREE.Group();
  const ms = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.5), ms(shirt)); torso.position.y = 1.25; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.3), ms(skin)); head.position.y = 1.8; head.castShadow = true; g.add(head);
  const hr = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.32), ms(hair)); hr.position.y = 1.98; g.add(hr);
  const parts = {};
  for (const [k, x] of [['lArm', -0.33], ['rArm', 0.33]]) { const a = new THREE.Group(); a.position.set(0, 1.58, x); a.add(limb(0.14, 0.62, 0.14, ms(shirt))); g.add(a); parts[k] = a; }
  for (const [k, x] of [['lLeg', -0.13], ['rLeg', 0.13]]) { const a = new THREE.Group(); a.position.set(0, 0.9, x); a.add(limb(0.18, 0.9, 0.18, ms(pants))); g.add(a); parts[k] = a; }
  g.userData.parts = parts;
  return g;
}

function animateWalk(model, phase, amount) {
  const p = model.userData.parts; const s = Math.sin(phase) * amount;
  p.lArm.rotation.z = s; p.rArm.rotation.z = -s; p.lLeg.rotation.z = -s; p.rLeg.rotation.z = s;
}

export class Player {
  constructor(scene, x, z) {
    // camisa tricolor gaúcha :)
    this.model = makePerson('#0b8a3a', '#30343a', '#d4a27c', '#3b2416');
    scene.add(this.model);
    this.pos = new THREE.Vector3(x, 0, z); this.vy = 0; this.yaw = 0; this.phase = 0; this.onGround = true;
  }
  update(dt, inp, camYaw, W) {
    let mx = 0, mz = 0;
    if (inp.up) mz += 1; if (inp.down) mz -= 1; if (inp.left) mx -= 1; if (inp.right) mx += 1;
    const moving = mx || mz;
    const speed = inp.run ? 9 : 4.5;
    if (moving) {
      // direção relativa à câmera (camYaw = direção para onde a câmera olha)
      const fx = Math.cos(camYaw), fz = Math.sin(camYaw);
      let dx = fx * mz - fz * mx, dz = fz * mz + fx * mx;
      const l = Math.hypot(dx, dz); dx /= l; dz /= l;
      const target = Math.atan2(dz, dx);
      let dh = target - this.yaw; while (dh > Math.PI) dh -= Math.PI * 2; while (dh < -Math.PI) dh += Math.PI * 2;
      this.yaw += dh * Math.min(1, dt * 12);
      const nx = this.pos.x + dx * speed * dt, nz = this.pos.z + dz * speed * dt;
      if (!W.isSolid(nx, this.pos.z)) this.pos.x = nx;
      if (!W.isSolid(this.pos.x, nz)) this.pos.z = nz;
      this.phase += dt * speed * 1.6;
    } else this.phase *= 0.8;
    if (inp.jump && this.onGround) { this.vy = 6; this.onGround = false; }
    this.vy -= 18 * dt; this.pos.y += this.vy * dt;
    if (this.pos.y <= 0) { this.pos.y = 0; this.vy = 0; this.onGround = true; }
    animateWalk(this.model, this.phase, moving ? (inp.run ? 0.9 : 0.6) : 0);
    this.model.position.copy(this.pos);
    this.model.rotation.y = -this.yaw;
  }
}

// ---------- Pedestres (perto do jogador) ----------
const SHIRTS = ['#c53030', '#2b6cb0', '#d69e2e', '#38a169', '#805ad5', '#e2e8f0', '#1a202c', '#dd6b20', '#319795', '#b83280'];
const SKINS = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#a26a42'];
export class Pedestrians {
  constructor(scene, W, n = 40) {
    this.W = W; this.list = [];
    for (let i = 0; i < n; i++) {
      const m = makePerson(SHIRTS[i % SHIRTS.length], ['#2d3748', '#4a5568', '#2c5282', '#744210'][i % 4], SKINS[i % SKINS.length], ['#1a1a1a', '#4a2c17', '#d9b26a'][i % 3]);
      m.visible = false; scene.add(m);
      this.list.push({ m, x: 0, z: 0, h: 0, active: false, phase: Math.random() * 6, flee: 0, down: 0 });
    }
  }
  spawn(p, px, pz) {
    const R = this.W.raster;
    for (let t = 0; t < 25; t++) {
      const a = Math.random() * Math.PI * 2, r = 50 + Math.random() * 180;
      const x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
      const f = R.get(x, z);
      if ((f & F.WALK) && !(f & (F.ROAD | F.SOLID))) { p.x = x; p.z = z; p.h = Math.random() * Math.PI * 2; p.active = true; p.m.visible = true; p.down = 0; p.m.rotation.x = 0; return; }
    }
  }
  update(dt, px, pz, car) {
    const R = this.W.raster;
    let hits = 0;
    for (const p of this.list) {
      if (!p.active || Math.hypot(p.x - px, p.z - pz) > 260) { p.active = false; p.m.visible = false; this.spawn(p, px, pz); continue; }
      if (p.down > 0) {
        p.down -= dt; p.m.rotation.z = Math.min(Math.PI / 2, p.m.rotation.z + dt * 6);
        if (p.down <= 0) { p.m.rotation.z = 0; }
        continue;
      }
      let sp = 1.3;
      if (car && car.speed > 4) {
        const dx = p.x - car.pos.x, dz = p.z - car.pos.z, d = Math.hypot(dx, dz);
        if (d < 2.4) { p.down = 3; hits++; p.flee = 0; continue; }
        if (d < 14) { p.flee = 1.2; p.h = Math.atan2(dz, dx); }
      }
      if (p.flee > 0) { p.flee -= dt; sp = 6; }
      const nx = p.x + Math.cos(p.h) * sp * dt, nz = p.z + Math.sin(p.h) * sp * dt;
      const f = R.get(nx, nz);
      const ok = p.flee > 0 ? !(f & F.SOLID) : (f & F.WALK) && !(f & (F.ROAD | F.SOLID));
      if (ok) { p.x = nx; p.z = nz; } else p.h += Math.PI * (0.5 + Math.random());
      if (Math.random() < dt * 0.1) p.h += (Math.random() - 0.5) * 2;
      p.phase += dt * sp * 2.2;
      animateWalk(p.m, p.phase, Math.min(0.9, sp * 0.3));
      p.m.position.set(p.x, 0, p.z); p.m.rotation.y = -p.h;
    }
    return hits;
  }
}
