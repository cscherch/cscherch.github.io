import * as THREE from 'three';
import { pointAlong } from './world.js';
import { mulberry32, distSeg } from './geo.js';

export function nearestOnRoad(r, x, z) {
  let best = null, bd = Infinity, acc = 0;
  for (let i = 1; i < r.pts.length; i++) {
    const a = r.pts[i - 1], b = r.pts[i];
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1;
    let t = ((x - a.x) * dx + (z - a.z) * dz) / (L * L); t = Math.max(0, Math.min(1, t));
    const d = distSeg(x, z, a.x, a.z, b.x, b.z);
    if (d < bd) { bd = d; best = acc + t * L; }
    acc += L;
  }
  return best;
}
export function snapToRoad(W, x, z, prefer) {
  // procura a via mais próxima em raio crescente
  let road = null;
  for (let r = 0; r < 400 && !road; r += 30) {
    for (let k = 0; k < 8 && !road; k++) {
      const a = (k / 8) * Math.PI * 2; road = W.nearestRoad(x + Math.cos(a) * r, z + Math.sin(a) * r);
      if (road && prefer && road.type === 'street' && r < 200) road = null;
    }
  }
  if (!road) return { x, z };
  const d = nearestOnRoad(road, x, z);
  const p = pointAlong(road, d, road.width / 4);
  return { x: p.x, z: p.z, road };
}

function makeMarker(color, h = 30, r = 3.2) {
  const g = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  beam.position.y = h / 2; g.add(beam);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.25, 8, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(3), toneMapped: false }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.4; g.add(ring);
  const icon = new THREE.Mesh(new THREE.OctahedronGeometry(1.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.5), toneMapped: false }));
  icon.position.y = 4; g.add(icon); g.userData.icon = icon; g.userData.ring = ring;
  return g;
}
function makeCuia() {
  const g = new THREE.Group();
  const cuia = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12, 0, Math.PI * 2, 0.5, Math.PI - 0.5), new THREE.MeshStandardMaterial({ color: '#6b8e23', roughness: 0.5, emissive: '#2a4a05', emissiveIntensity: 0.6 }));
  g.add(cuia);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.08, 6, 20), new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 1, roughness: 0.25, emissive: '#5a4300' }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.62; g.add(rim);
  const bomba = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6), rim.material); bomba.position.set(0.2, 1.0, 0); bomba.rotation.z = -0.3; g.add(bomba);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 8), new THREE.MeshBasicMaterial({ color: '#9cff5a', transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
  g.add(glow);
  return g;
}

const CUSTOMERS = ['Seu Tonico', 'Dona Neca', 'um estudante da ULBRA', 'a Prenda Juliana', 'o Gaudério Bagual', 'a Tia do Xis', 'um torcedor do Grêmio', 'uma torcedora do Inter', 'o Piá da Mathias', 'a Vó Cotinha'];
const FOOD = ['xis coração', 'xis bacon', 'xis salada', 'cachorro-quente prensado', 'pastel de feira', 'kit churrasco', 'cuca de uva', 'erva-mate 1kg'];

export class Missions {
  constructor(scene, W, game) {
    this.scene = scene; this.W = W; this.game = game; this.state = null;
    this.rng = mulberry32(777);
    const lm = (n) => W.landmarks.find((l) => l.name.startsWith(n));
    const starts = [
      { id: 'taxi', name: 'Táxi Canoas', color: '#ffd21f', at: lm('Estação Canoas') },
      { id: 'delivery', name: 'Tele-Xis', color: '#ff6a2a', at: lm('Canoas Shopping') },
      { id: 'race', name: 'Rally da BR-116', color: '#35e0ff', at: lm('Estação Niterói') },
      { id: 'tour', name: 'Tour de Canoas', color: '#c77dff', at: lm('Praça da Bandeira') },
    ];
    this.starts = starts.filter((s) => s.at).map((s) => {
      const p = snapToRoad(W, s.at.x, s.at.z, true);
      const m = makeMarker(s.color, 40, 4); m.position.set(p.x, 0, p.z); scene.add(m);
      return { ...s, x: p.x, z: p.z, marker: m };
    });
    this.target = makeMarker('#3cff6a', 60, 4.5); this.target.visible = false; scene.add(this.target);

    // cuias de chimarrão espalhadas pela cidade
    this.cuias = [];
    const roads = W.roads.filter((r) => r.len > 60);
    for (let i = 0; i < 30; i++) {
      const r = roads[Math.floor(this.rng() * roads.length)];
      const p = pointAlong(r, this.rng() * r.len, (this.rng() - 0.5) * r.width * 0.5);
      const c = makeCuia(); c.position.set(p.x, 1.2, p.z); scene.add(c);
      this.cuias.push({ m: c, x: p.x, z: p.z, got: false });
    }
    this.cuiasGot = 0;
  }

  randomDestination(px, pz, minD, maxD) {
    const W = this.W;
    for (let t = 0; t < 60; t++) {
      const useLm = this.rng() < 0.55;
      let x, z, label;
      if (useLm) { const l = W.landmarks[Math.floor(this.rng() * W.landmarks.length)]; x = l.x; z = l.z; label = l.name; }
      else {
        const r = W.roads[Math.floor(this.rng() * W.roads.length)];
        const p = pointAlong(r, this.rng() * r.len); x = p.x; z = p.z; label = null;
      }
      const d = Math.hypot(x - px, z - pz);
      if (d < minD || d > maxD) continue;
      const s = snapToRoad(W, x, z, useLm);
      if (W.isSolid(s.x, s.z)) continue;
      const hood = W.neighborhoodAt(s.x, s.z);
      label = label || ((s.road ? s.road.name + ', ' : '') + hood);
      return { x: s.x, z: s.z, label, dist: d };
    }
    return null;
  }

  setTarget(t) {
    this.tgt = t;
    if (t) { this.target.position.set(t.x, 0, t.z); this.target.visible = true; } else this.target.visible = false;
  }

  start(id) {
    const g = this.game, p = g.focus();
    this.starts.forEach((s) => (s.marker.visible = false));
    if (id === 'taxi') {
      this.state = { id, phase: 'pickup', fares: 0 };
      const t = this.randomDestination(p.x, p.z, 200, 650);
      this.setTarget(t); this.state.time = 60;
      g.hud.mission('Táxi Canoas', `Busque o passageiro em <b>${t.label}</b>`);
      g.hud.toast('🚕 Bah, tchê! Corridas de táxi liberadas');
    } else if (id === 'delivery') {
      this.state = { id, left: 3, phase: 'drop' };
      this.nextDelivery();
      g.hud.toast('🍔 Tele-Xis: 3 entregas, capricha!');
    } else if (id === 'race') {
      const br = this.W.roads.find((r) => r.name === 'BR-116');
      const s0 = nearestOnRoad(br, p.x, p.z);
      const cps = []; for (let d = s0 + 250; d < Math.min(br.len - 100, s0 + 5200); d += 380) { const q = pointAlong(br, d, br.width / 4); cps.push({ x: q.x, z: q.z, label: 'Checkpoint' }); }
      const q = pointAlong(br, Math.min(br.len - 100, s0 + 5200), br.width / 4); cps.push({ x: q.x, z: q.z, label: 'Chegada — Trevo da BR-386' });
      this.state = { id, cps, i: 0, t: 0, time: 150 };
      this.setTarget(cps[0]);
      g.hud.mission('Rally da BR-116', `Passe pelos ${cps.length} checkpoints rumo ao norte!`);
      g.hud.toast('🏁 Valendo! Acelera, guri!');
    } else if (id === 'tour') {
      const names = ['Catedral São Luiz Gonzaga', 'Unilasalle', 'ParkShopping Canoas', 'ULBRA', 'Parque Getúlio Vargas', 'Estádio Municipal', 'Prefeitura de Canoas'];
      const stops = names.map((n) => this.W.landmarks.find((l) => l.name === n)).filter(Boolean).map((l) => { const s = snapToRoad(this.W, l.x, l.z, true); return { x: s.x, z: s.z, label: l.name }; });
      this.state = { id, stops, i: 0, time: 400 };
      this.setTarget(stops[0]);
      g.hud.mission('Tour de Canoas', `Visite: <b>${stops[0].label}</b> (1/${stops.length})`);
      g.hud.toast('🗺️ Tour de Canoas — conheça a cidade!');
    }
  }
  nextDelivery() {
    const g = this.game, p = g.focus();
    const t = this.randomDestination(p.x, p.z, 400, 1300);
    const food = FOOD[Math.floor(this.rng() * FOOD.length)], who = CUSTOMERS[Math.floor(this.rng() * CUSTOMERS.length)];
    this.setTarget(t); this.state.time = 25 + t.dist / 13; this.state.reward = Math.round(80 + t.dist / 6);
    g.hud.mission('Tele-Xis', `Leve um <b>${food}</b> para ${who} em <b>${t.label}</b> (${this.state.left} restantes)`);
  }
  end(msg, ok) {
    const g = this.game;
    if (msg) g.hud.toast(msg, ok ? 'good' : 'bad');
    this.state = null; this.setTarget(null); g.hud.mission(null);
    this.starts.forEach((s) => (s.marker.visible = true));
  }

  update(dt, inCar, car) {
    const g = this.game, p = g.focus();
    const t = g.time;
    for (const s of this.starts) { s.marker.userData.icon.rotation.y = t * 2; s.marker.userData.icon.position.y = 4 + Math.sin(t * 3) * 0.5; }
    this.target.userData.icon.rotation.y = t * 2; this.target.userData.ring.scale.setScalar(1 + Math.sin(t * 5) * 0.08);
    for (const c of this.cuias) {
      if (c.got) continue;
      c.m.rotation.y = t * 1.5; c.m.position.y = 1.2 + Math.sin(t * 2 + c.x) * 0.25;
      if (Math.hypot(c.x - p.x, c.z - p.z) < 3.5) {
        c.got = true; c.m.visible = false; this.cuiasGot++;
        g.addMoney(100); g.audio.chime();
        g.hud.toast(`🧉 Cuia de chimarrão ${this.cuiasGot}/${this.cuias.length} — +R$ 100`, 'good');
        if (this.cuiasGot === this.cuias.length) { g.addMoney(5000); g.hud.toast('🏆 Todas as cuias! Tu é o gaúcho mais tri de Canoas! +R$ 5.000', 'good'); }
      }
    }
    const s = this.state;
    if (!s) {
      for (const st of this.starts) {
        if (Math.hypot(st.x - p.x, st.z - p.z) < 5) {
          if (!inCar) { g.hud.hint(`Entre em um carro para começar <b>${st.name}</b>`); continue; }
          this.start(st.id); g.audio.chime(); break;
        }
      }
      return;
    }
    if (s.time != null) {
      s.time -= dt;
      g.hud.timer(s.time);
      if (s.time <= 0) { this.end(s.id === 'taxi' && s.fares > 0 ? `⏱️ Tempo esgotado! Turno encerrado com ${s.fares} corridas.` : '⏱️ Tempo esgotado! Barbaridade...', false); return; }
    }
    if (!inCar && s.id !== 'tour') { this.end('Missão cancelada: você saiu do carro.', false); return; }
    const tg = this.tgt; if (!tg) return;
    const d = Math.hypot(tg.x - p.x, tg.z - p.z);
    const spd = car ? car.speed : 0;
    if (s.id === 'taxi') {
      if (d < 7 && spd < 7) {
        if (s.phase === 'pickup') {
          const dest = this.randomDestination(p.x, p.z, 600, 1800);
          s.phase = 'drop'; s.dest = dest; s.time = 25 + dest.dist / 14; s.start = dest.dist;
          const who = CUSTOMERS[Math.floor(this.rng() * CUSTOMERS.length)];
          this.setTarget(dest); g.audio.chime();
          g.hud.mission('Táxi Canoas', `${who[0].toUpperCase() + who.slice(1)} embarcou. Destino: <b>${dest.label}</b>`);
        } else {
          const pay = Math.round(40 + s.start / 8 + Math.max(0, s.time) * 3);
          g.addMoney(pay); s.fares++; g.audio.cash();
          g.hud.toast(`💵 Corrida concluída! +R$ ${pay}`, 'good');
          const t2 = this.randomDestination(p.x, p.z, 150, 600);
          s.phase = 'pickup'; s.time = 45; this.setTarget(t2);
          g.hud.mission('Táxi Canoas', `Corridas: ${s.fares}. Próximo passageiro em <b>${t2.label}</b>`);
        }
      }
    } else if (s.id === 'delivery') {
      if (d < 7 && spd < 8) {
        g.addMoney(s.reward + Math.round(s.time * 2)); g.audio.cash();
        g.hud.toast(`🍔 Entregue! +R$ ${s.reward + Math.round(s.time * 2)}`, 'good');
        s.left--;
        if (s.left <= 0) { g.addMoney(300); this.end('🏆 Todas as entregas feitas! Bônus R$ 300', true); }
        else this.nextDelivery();
      }
    } else if (s.id === 'race') {
      s.t += dt;
      if (d < 16) {
        s.i++; g.audio.chime();
        if (s.i >= s.cps.length) {
          const prize = Math.round(400 + s.time * 12);
          g.addMoney(prize);
          const best = g.save.raceBest;
          if (!best || s.t < best) { g.save.raceBest = s.t; g.persist(); }
          this.end(`🏁 Chegada em ${s.t.toFixed(1)}s! +R$ ${prize}${!best || s.t <= g.save.raceBest ? ' — NOVO RECORDE!' : ''}`, true);
          return;
        }
        s.time += 8;
        this.setTarget(s.cps[s.i]);
        g.hud.mission('Rally da BR-116', `Checkpoint ${s.i}/${s.cps.length - 1} — ${s.t.toFixed(1)}s`);
      }
    } else if (s.id === 'tour') {
      if (d < 12) {
        g.addMoney(150); g.audio.chime(); g.hud.toast(`📸 ${tg.label} visitado! +R$ 150`, 'good');
        s.i++;
        if (s.i >= s.stops.length) { g.addMoney(1000); this.end('🏆 Tour completo! Agora tu conhece Canoas. +R$ 1.000', true); return; }
        this.setTarget(s.stops[s.i]);
        g.hud.mission('Tour de Canoas', `Visite: <b>${s.stops[s.i].label}</b> (${s.i + 1}/${s.stops.length})`);
      }
    }
  }
}
