import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld, pointAlong } from './world.js';
import { SCALE } from './data.js';
import { buildScene, shared, waterMat } from './render.js';
import { Sky } from './sky.js';
import { Car, Traffic, Train, makeCarModel, headMat, tailMat } from './vehicles.js';
import { Player, Pedestrians } from './people.js';
import { Missions, nearestOnRoad } from './missions.js';
import { HUD } from './hud.js';
import { Audio } from './audio.js';

const $ = (id) => document.getElementById(id);
const status = (t) => { $('loadstatus').textContent = t; };
const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

class Game {
  async init() {
    status('Carregando mapa de Canoas…'); await frame();
    let osm = null;
    try { const r = await fetch('data/canoas-osm.json'); if (r.ok) osm = await r.json(); } catch (e) { /* sem extrato OSM */ }
    status(osm ? 'Gerando cidade a partir do OpenStreetMap…' : 'Gerando ruas, quadras e prédios…'); await frame();
    const W = (this.W = buildWorld(osm));

    const renderer = (this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }));
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    $('game').appendChild(renderer.domElement);
    const scene = (this.scene = new THREE.Scene());
    this.camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.3, 4000);

    status('Construindo a cidade (prédios, árvores, Trensurb)…'); await frame();
    buildScene(scene, W);
    this.sky = new Sky(scene, renderer);

    status('Chamando o trânsito e os pedestres…'); await frame();
    this.traffic = new Traffic(scene, W, 50);
    this.peds = new Pedestrians(scene, W, 45);
    this.trains = [new Train(scene, W, 2, 400, 1), new Train(scene, W, -2, W.railRoad.len - 400, -1)];

    // ponto inicial: Av. Guilherme Schell, ao lado da Estação Canoas
    const gs = W.roads.find((r) => r.name === 'Av. Guilherme Schell') || W.roads[0];
    const st = W.stations.find((s) => s.name === 'Estação Canoas') || { x: 0, z: 0 };
    const d0 = nearestOnRoad(gs, st.x, st.z);
    const pp = pointAlong(gs, d0, -(gs.width / 2 + 1.6));
    this.player = new Player(scene, pp.x, pp.z);
    this.player.yaw = Math.atan2(pp.dz, pp.dx);
    this.cars = [];
    const park = (type, d, color) => {
      const p = pointAlong(gs, d0 + d, -(gs.width / 2 - 1.7));
      this.cars.push(new Car(scene, type, p.x, p.z, Math.atan2(p.dz, p.dx), color ? makeCarModel(type, color) : undefined));
    };
    park('sport', 4, '#c4161c'); park('taxi', -7); park('hatch', -16); park('pickup', -25);
    for (const s of (W.parkedSpots || []).slice(0, 40)) {
      const types = ['hatch', 'sedan', 'hatch', 'pickup', 'sedan', 'sport'];
      this.cars.push(new Car(scene, types[Math.floor(Math.random() * types.length)], s.x, s.z, s.ang));
    }
    this.car = null;
    this.camYaw = this.player.yaw; this.camPitch = 0.32; this.camMode = 0; this.lastMouse = -10;
    this.camera.position.set(pp.x - 8, 5, pp.z);

    this.hud = new HUD(W);
    this.audio = new Audio();
    this.save = { money: 500 };
    try { Object.assign(this.save, JSON.parse(localStorage.getItem('canoas-city') || '{}')); } catch (e) { /* armazenamento indisponível */ }
    this.hud.money(this.save.money);
    this.missions = new Missions(scene, W, this);

    // faróis do carro do jogador
    this.headlight = new THREE.SpotLight('#fff1d0', 0, 110, 0.55, 0.6, 1.3);
    scene.add(this.headlight); scene.add(this.headlight.target);
    // fumaça de dano
    this.smoke = [];
    const smm = new THREE.MeshBasicMaterial({ color: '#555', transparent: true, opacity: 0.5, depthWrite: false });
    for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 5), smm.clone()); m.visible = false; scene.add(m); this.smoke.push({ m, life: 0 }); }

    // pós-processamento
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.55, 0.5, 0.9);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.quality = 1;

    this.setupInput();
    addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight); this.composer.setSize(innerWidth, innerHeight);
    });
    this.time = 0; this.clock = new THREE.Clock(); this.paused = true; this.mapOpen = false;
    status('Pronto! Bah, tchê!');
    $('play').style.display = 'inline-block';
    $('play').onclick = () => this.begin();
    renderer.setAnimationLoop(() => this.loop());
  }

  begin() {
    $('loading').style.display = 'none'; $('hud').style.display = 'block';
    this.paused = false; this.audio.init();
    if (!this.touch) this.renderer.domElement.requestPointerLock?.();
    this.hud.toast('Bem-vindo a <b>Canoas</b>! Aperte <b>F</b> perto de um carro para dirigir.');
    this.hud.toast('Siga os marcadores coloridos para começar missões. Colete as 🧉 cuias!');
  }

  focus() { return this.car ? this.car.pos : this.player.pos; }
  addMoney(v) { this.save.money = Math.max(0, this.save.money + v); this.hud.money(this.save.money); this.persist(); }
  persist() { try { localStorage.setItem('canoas-city', JSON.stringify(this.save)); } catch (e) { /* ok */ } }

  setupInput() {
    this.keys = {};
    const map = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'brake', ShiftLeft: 'run', ShiftRight: 'run' };
    addEventListener('keydown', (e) => {
      if (map[e.code]) { this.keys[map[e.code]] = true; e.preventDefault(); }
      if (e.repeat) return;
      if (this.paused && e.code !== 'KeyP' && e.code !== 'Escape') return;
      switch (e.code) {
        case 'KeyF': case 'Enter': this.toggleCar(); break;
        case 'KeyH': this.audio.horn(); break;
        case 'KeyC': this.camMode = (this.camMode + 1) % 3; break;
        case 'KeyM': this.mapOpen = !this.mapOpen; $('bigmap').style.display = this.mapOpen ? 'block' : 'none'; break;
        case 'KeyX': if (this.missions.state) this.missions.end('Missão cancelada.', false); break;
        case 'KeyR': this.resetCar(); break;
        case 'KeyN': this.sky.hour = (this.sky.hour + 3) % 24; this.hud.toast('⏩ ' + this.sky.clock()); break;
        case 'KeyQ': this.setQuality(1 - this.quality); break;
        case 'KeyK': this.audio.setMuted(!this.audio.muted); this.hud.toast(this.audio.muted ? '🔇 Som desligado' : '🔊 Som ligado'); break;
        case 'KeyP': this.togglePause(); break;
      }
    });
    addEventListener('keyup', (e) => { if (map[e.code]) this.keys[map[e.code]] = false; });
    const cv = this.renderer.domElement;
    cv.addEventListener('click', () => { if (!this.paused && !this.touch) cv.requestPointerLock?.(); });
    addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== cv) return;
      this.camYaw += e.movementX * 0.0028; this.camPitch = THREE.MathUtils.clamp(this.camPitch + e.movementY * 0.002, -0.1, 1.2);
      this.lastMouse = this.time;
    });
    addEventListener('wheel', (e) => { this.zoom = THREE.MathUtils.clamp((this.zoom || 1) + Math.sign(e.deltaY) * 0.1, 0.6, 2); });
    // controles de toque
    this.touch = matchMedia('(pointer: coarse)').matches;
    if (this.touch) {
      $('touch').style.display = 'block';
      document.querySelectorAll('#touch [data-k]').forEach((b) => {
        const k = b.dataset.k;
        const on = (e) => { e.preventDefault(); this.keys[k] = true; b.classList.add('on'); };
        const off = (e) => { e.preventDefault(); this.keys[k] = false; b.classList.remove('on'); };
        b.addEventListener('touchstart', on); b.addEventListener('touchend', off); b.addEventListener('touchcancel', off);
      });
      $('t-f').addEventListener('touchstart', (e) => { e.preventDefault(); this.toggleCar(); });
      $('t-m').addEventListener('touchstart', (e) => { e.preventDefault(); this.mapOpen = !this.mapOpen; $('bigmap').style.display = this.mapOpen ? 'block' : 'none'; });
      $('t-h').addEventListener('touchstart', (e) => { e.preventDefault(); this.audio.horn(); });
      let last = null;
      cv.addEventListener('touchstart', (e) => { last = e.touches[0]; });
      cv.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (last) { this.camYaw += (t.clientX - last.clientX) * 0.006; this.lastMouse = this.time; } last = t; });
    }
  }
  togglePause() {
    this.paused = !this.paused; $('pause').style.display = this.paused ? 'flex' : 'none';
    if (this.paused) document.exitPointerLock?.(); else if (!this.touch) this.renderer.domElement.requestPointerLock?.();
  }
  setQuality(q) {
    this.quality = q;
    this.renderer.shadowMap.enabled = !!q; this.sky.sun.castShadow = !!q; this.bloom.enabled = !!q;
    this.renderer.setPixelRatio(q ? Math.min(devicePixelRatio, 1.5) : 0.75);
    this.scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true)); });
    this.hud.toast(q ? '✨ Gráficos: Alto' : '⚡ Gráficos: Rápido');
  }

  toggleCar() {
    if (this.car) {
      if (this.car.speed > 6) { this.hud.toast('Pare o carro para sair!'); return; }
      const c = this.car, h = c.heading;
      for (const side of [-1, 1]) {
        const x = c.pos.x - Math.sin(h) * side * (c.spec.W / 2 + 1.2) * -1, z = c.pos.z + Math.cos(h) * side * (c.spec.W / 2 + 1.2) * -1;
        if (!this.W.isSolid(x, z)) { this.player.pos.set(x, 0, z); break; }
      }
      c.driven = false; this.car = null; this.player.model.visible = true;
      this.camYaw = h;
      return;
    }
    const p = this.player.pos;
    let best = null, bd = 6;
    for (const c of this.cars) { const d = Math.hypot(c.pos.x - p.x, c.pos.z - p.z) - c.spec.L / 4; if (d < bd && c.health > 0) { bd = d; best = c; } }
    if (!best) {
      const t = this.traffic.nearest(p.x, p.z, 6);
      if (t) {
        // "pega emprestado" um carro do trânsito
        this.traffic.remove(t);
        const h = -t.model.rotation.y;
        best = new Car(this.scene, t.type, t.model.position.x, t.model.position.z, h, t.model);
        this.cars.push(best);
        this.hud.toast(t.type === 'police' ? '🚨 Bah! Pegou a viatura! -R$ 200' : 'O motorista saiu correndo: “Bah, que isso, tchê?!”', 'bad');
        if (t.type === 'police') this.addMoney(-200);
      }
    }
    if (best) { this.car = best; best.driven = true; this.player.model.visible = false; this.camYaw = best.heading; this.audio.init(); }
  }
  resetCar() {
    const c = this.car; if (!c) return;
    const r = this.W.nearestRoad(c.pos.x, c.pos.z) || this.W.roads.reduce((a, b) => a);
    const d = nearestOnRoad(r, c.pos.x, c.pos.z);
    const p = pointAlong(r, d, r.width / 4);
    c.pos.set(p.x, 0, p.z); c.heading = Math.atan2(p.dz, p.dx); c.vel.set(0, 0); c.sync();
  }

  updateCamera(dt) {
    const tgt = this.car ? this.car.pos : this.player.pos;
    const inCar = !!this.car;
    if (inCar && this.time - this.lastMouse > 1.6 && this.car.speed > 2) {
      let want = this.car.heading;
      if (this.car.forwardSpeed < -3) want += Math.PI;
      let d = want - this.camYaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      this.camYaw += d * Math.min(1, dt * 3);
      this.camPitch += (0.22 - this.camPitch) * Math.min(1, dt * 2);
    }
    const z = this.zoom || 1;
    let dist, height;
    if (inCar) {
      const big = this.car.type === 'bus' ? 2 : 1;
      if (this.camMode === 1) { dist = 14 * big; height = 5; } else if (this.camMode === 2) { dist = -0.2; height = 1.4; } else { dist = 8.5 * big; height = 2.6 * big; }
      dist += this.car.speed * 0.06;
    } else { dist = this.camMode === 1 ? 9 : 5.5; height = 1.9; }
    dist *= z;
    const pitch = inCar && this.camMode === 2 ? 0.05 : this.camPitch;
    const look = new THREE.Vector3(tgt.x, tgt.y + (inCar ? 1.6 : 1.6), tgt.z);
    const back = new THREE.Vector3(-Math.cos(this.camYaw) * Math.cos(pitch), Math.sin(pitch), -Math.sin(this.camYaw) * Math.cos(pitch));
    let L = dist;
    // não atravessar prédios
    for (let s = 1.5; s < dist; s += 0.8) {
      const px = look.x + back.x * s, pz = look.z + back.z * s, py = look.y + back.y * s;
      if (py < 30 && this.W.isSolid(px, pz)) { L = Math.max(1.2, s - 1); break; }
    }
    const want = look.clone().addScaledVector(back, L); want.y += height - 1.6 + (inCar ? 0 : 0.3);
    if (inCar && this.camMode === 2) { want.set(tgt.x + Math.cos(this.car.heading) * 0.3, 1.35, tgt.z + Math.sin(this.car.heading) * 0.3); this.camera.position.copy(want); }
    else this.camera.position.lerp(want, Math.min(1, dt * (inCar ? 10 : 14)));
    if (this.camera.position.y < 0.5) this.camera.position.y = 0.5;
    if (inCar && this.camMode === 2) this.camera.lookAt(tgt.x + Math.cos(this.camYaw) * 20, 1.3, tgt.z + Math.sin(this.camYaw) * 20);
    else this.camera.lookAt(look);
    // shake
    if (this.shake > 0) { this.camera.position.x += (Math.random() - 0.5) * this.shake; this.camera.position.y += (Math.random() - 0.5) * this.shake; this.shake *= 0.86; }
    const fovT = 62 + (inCar ? Math.min(18, this.car.speed * 0.4) : 0);
    this.camera.fov += (fovT - this.camera.fov) * Math.min(1, dt * 3); this.camera.updateProjectionMatrix();
  }

  loop() {
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.paused || this.mapOpen) {
      if (this.mapOpen) this.hud.drawBig(this.hudState || this.state());
      if (!this.paused) { this.composer.render(); }
      return;
    }
    this.time += dt; shared.time.value = this.time;
    const W = this.W, k = this.keys;
    let impact = 0;
    if (this.car) {
      impact = this.car.update(dt, k, W);
      impact = Math.max(impact, this.traffic.collide(this.car) * 0.8);
      // carros estacionados
      for (const c of this.cars) {
        if (c === this.car) continue;
        const dx = this.car.pos.x - c.pos.x, dz = this.car.pos.z - c.pos.z, d = Math.hypot(dx, dz), lim = (this.car.spec.W + c.spec.W) / 2 + 0.8;
        if (d < lim && d > 0.01) {
          const nx = dx / d, nz = dz / d; this.car.pos.x += nx * (lim - d) * 0.6; this.car.pos.z += nz * (lim - d) * 0.6;
          c.pos.x -= nx * (lim - d) * 0.4; c.pos.z -= nz * (lim - d) * 0.4; if (W.isSolid(c.pos.x, c.pos.z)) { c.pos.x += nx * (lim - d) * 0.4; c.pos.z += nz * (lim - d) * 0.4; }
          c.sync();
          const vn = this.car.vel.x * nx + this.car.vel.y * nz; if (vn < 0) { this.car.vel.x -= 1.3 * vn * nx; this.car.vel.y -= 1.3 * vn * nz; impact = Math.max(impact, -vn); }
        }
      }
      if (impact > 3) {
        this.audio.crash(impact); this.shake = Math.min(1.2, impact * 0.05);
        if (impact > 7) { this.car.health = Math.max(0, this.car.health - impact * 0.7); }
        if (this.car.health <= 0) this.wreck();
      }
      this.player.pos.copy(this.car.pos);
      const hits = this.peds.update(dt, this.car.pos.x, this.car.pos.z, this.car);
      if (hits) { this.addMoney(-50 * hits); this.hud.toast('⚠️ Cuidado com o pedestre! Multa de R$ 50', 'bad'); }
      this.audio.engine(true, this.car.speed, k.up ? 1 : 0, this.car.drift || 0);
    } else {
      this.player.update(dt, { up: k.up, down: k.down, left: k.left, right: k.right, run: k.run, jump: k.brake }, this.camYaw, W);
      this.peds.update(dt, this.player.pos.x, this.player.pos.z, null);
      this.audio.engine(false, 0, 0, 0);
      // dica de entrar no carro
      const p = this.player.pos;
      if (this.cars.some((c) => c.health > 0 && Math.hypot(c.pos.x - p.x, c.pos.z - p.z) < 5)) this.hud.hint('<b>F</b> — entrar no carro');
      else if (this.traffic.nearest(p.x, p.z, 6)) this.hud.hint('<b>F</b> — pegar este carro');
    }
    const fp = this.focus();
    this.traffic.update(dt, fp.x, fp.z, this.car, this.car ? null : this.player.pos);
    if (this.traffic.cars.some((c) => c.horn > 0.95)) { this.traffic.cars.forEach((c) => { if (c.horn > 0.95) c.horn = 0.9; }); this.audio.tone([330, 415], 0.3, 'square', 0.03, 0); }
    for (const t of this.trains) t.update(dt);
    this.missions.update(dt, !!this.car, this.car);

    const night = this.sky.update(dt, fp);
    if (waterMat) waterMat.uniforms.uTime.value = this.time;
    headMat.color.setScalar(1 + night * 4);
    tailMat.color.setRGB(1 + night * 2, 0.15, 0.1);
    for (const f of shared.flames) { f.scale.set(1 + Math.sin(this.time * 13) * 0.1, 1 + Math.sin(this.time * 7.3) * 0.2, 1); }
    if (shared.flag) { const pa = shared.flag.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i); pa.setZ(i, Math.sin(x * 1.3 - this.time * 4) * 0.25 * (x + 3) / 6); } pa.needsUpdate = true; }
    // faróis
    if (this.car && night > 0.3) {
      const c = this.car, fx = Math.cos(c.heading), fz = Math.sin(c.heading);
      this.headlight.intensity = 400 * night;
      this.headlight.position.set(c.pos.x + fx * 2, 1.2, c.pos.z + fz * 2);
      this.headlight.target.position.set(c.pos.x + fx * 30, 0, c.pos.z + fz * 30);
    } else this.headlight.intensity = 0;
    this.updateSmoke(dt);
    this.updateCamera(dt);

    const st = (this.hudState = this.state());
    this.hud.update(dt, st);
    this.composer.render();
  }
  state() {
    const fp = this.focus();
    const road = this.W.nearestRoad(fp.x, fp.z);
    const blips = [];
    for (const s of this.missions.starts) if (s.marker.visible) blips.push({ x: s.x, z: s.z, color: s.color, size: 7 });
    if (this.missions.tgt) blips.push({ x: this.missions.tgt.x, z: this.missions.tgt.z, color: '#3cff6a', size: 8 });
    for (const c of this.missions.cuias) if (!c.got && Math.hypot(c.x - fp.x, c.z - fp.z) < 500) blips.push({ x: c.x, z: c.z, color: '#9cff5a', size: 3 });
    return {
      pos: fp, heading: this.car ? this.car.heading : this.player.yaw, camYaw: this.camYaw, car: this.car,
      kmh: this.car ? (this.car.speed / SCALE) * 3.6 * 0.9 : 0, clock: this.sky.clock(),
      hood: this.W.neighborhoodAt(fp.x, fp.z), street: road ? road.name : '', blips,
    };
  }
  wreck() {
    const c = this.car;
    this.hud.toast('💥 Barbaridade! Perdeu o carro. Conserto: -R$ 200', 'bad'); this.addMoney(-200);
    c.model.traverse((o) => { if (o.material && o.material.color && o.material.toneMapped !== false) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.25); } });
    c.vel.set(0, 0); c.health = 0;
    this.car = null; this.player.model.visible = true;
    this.player.pos.set(c.pos.x + Math.cos(c.heading + Math.PI / 2) * 3, 0, c.pos.z + Math.sin(c.heading + Math.PI / 2) * 3);
    if (this.W.isSolid(this.player.pos.x, this.player.pos.z)) this.player.pos.set(c.pos.x - Math.cos(c.heading + Math.PI / 2) * 3, 0, c.pos.z - Math.sin(c.heading + Math.PI / 2) * 3);
    c.burning = 12;
    if (this.missions.state) this.missions.end('Missão falhou: carro destruído.', false);
  }
  updateSmoke(dt) {
    const emitters = this.cars.filter((c) => (c.health < 40 && c.health > 0 && c === this.car) || c.burning > 0);
    for (const c of emitters) {
      if (c.burning > 0) c.burning -= dt;
      if (Math.random() < dt * (c.burning > 0 ? 25 : 10)) {
        const s = this.smoke.find((q) => q.life <= 0); if (!s) break;
        s.life = 2; s.m.visible = true;
        s.m.position.set(c.pos.x + Math.cos(c.heading) * c.spec.L * 0.35, 1.2, c.pos.z + Math.sin(c.heading) * c.spec.L * 0.35);
        s.m.material.color.set(c.burning > 0 && Math.random() < 0.4 ? '#ff7a20' : '#4a4a4a');
      }
    }
    for (const s of this.smoke) {
      if (s.life <= 0) continue;
      s.life -= dt; s.m.position.y += dt * 2.2; s.m.scale.setScalar(1 + (2 - s.life) * 1.5); s.m.material.opacity = Math.max(0, s.life / 2) * 0.5;
      if (s.life <= 0) s.m.visible = false;
    }
  }
}

const game = new Game();
window.game = game;
game.init().catch((e) => { console.error(e); status('Erro ao iniciar: ' + e.message); });
