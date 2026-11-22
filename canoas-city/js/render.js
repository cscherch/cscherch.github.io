import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { F, pointAlong } from './world.js';
import { mulberry32 } from './geo.js';

export const shared = { night: { value: 0 }, time: { value: 0 }, lampMats: [], flames: [] };

// ---------- Texturas procedurais ----------
function canvasTex(size, draw, repeat = true) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 8;
  return t;
}
function noise(g, s, base, amp, n = 9000, sz = 2) {
  g.fillStyle = base; g.fillRect(0, 0, s, s);
  const r = mulberry32(7);
  for (let i = 0; i < n; i++) {
    const v = (r() - 0.5) * amp;
    g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`;
    g.fillRect(r() * s, r() * s, sz * r() + 1, sz * r() + 1);
  }
}
export const TEX = {};
function makeTextures() {
  TEX.asphalt = canvasTex(256, (g, s) => {
    noise(g, s, '#3b3d41', 0.16, 14000, 2);
    const r = mulberry32(3); g.strokeStyle = 'rgba(20,20,22,0.5)'; g.lineWidth = 1;
    for (let i = 0; i < 6; i++) { g.beginPath(); let x = r() * s, y = r() * s; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
  });
  TEX.concrete = canvasTex(256, (g, s) => {
    noise(g, s, '#a7a39a', 0.12, 8000, 2);
    g.strokeStyle = 'rgba(60,60,60,0.35)'; g.lineWidth = 2;
    for (let i = 0; i <= s; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, s); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(s, i); g.stroke(); }
  });
  TEX.detail = canvasTex(512, (g, s) => noise(g, s, '#808080', 0.35, 40000, 3));
  TEX.gravel = canvasTex(128, (g, s) => noise(g, s, '#6b5f52', 0.3, 5000, 2));
}

// ---------- Geometria de faixas ----------
function ribbon(pts, w, y, vScale = 8, uScale = null, off = 0) {
  const n = pts.length; if (n < 2) return null;
  const pos = [], uv = [], idx = [];
  let cum = 0;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    if (i > 0) cum += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z);
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b.x - a.x, dz = b.z - a.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    let nx = -dz, nz = dx;
    // fator de mitra
    let k = 1;
    if (i > 0 && i < n - 1) {
      const d1x = p.x - pts[i - 1].x, d1z = p.z - pts[i - 1].z, l1 = Math.hypot(d1x, d1z) || 1;
      const cosA = (d1x / l1) * dx + (d1z / l1) * dz; k = Math.min(2, 1 / Math.max(0.5, Math.sqrt((1 + cosA) / 2)));
    }
    const hw = (w / 2) * k;
    const cx = p.x + nx * off, cz = p.z + nz * off;
    pos.push(cx - nx * hw, y, cz - nz * hw, cx + nx * hw, y, cz + nz * hw);
    const us = uScale ?? w / vScale;
    uv.push(0, cum / vScale, us, cum / vScale);
    if (i > 0) { const o = (i - 1) * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
function dashes(road, off, y, len, gap, w) {
  const geos = [];
  const quads = [];
  for (let d = 2; d + len < road.len; d += len + gap) {
    const a = pointAlong(road, d, off), b = pointAlong(road, d + len, off);
    quads.push([a, b]);
  }
  if (!quads.length) return null;
  const pos = [], idx = [];
  quads.forEach(([a, b], i) => {
    const nx = -a.dz * w / 2, nz = a.dx * w / 2;
    pos.push(a.x - nx, y, a.z - nz, a.x + nx, y, a.z + nz, b.x - nx, y, b.z - nz, b.x + nx, y, b.z + nz);
    const o = i * 4; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2));
  g.setIndex(idx);
  geos.push(g);
  return g;
}
function mergeAdd(scene, geos, mat, { shadow = false, cast = false } = {}) {
  geos = geos.filter(Boolean); if (!geos.length) return null;
  const out = [];
  for (let i = 0; i < geos.length; i += 400) {
    const m = new THREE.Mesh(mergeGeometries(geos.slice(i, i + 400)), mat);
    m.receiveShadow = shadow; m.castShadow = cast; m.matrixAutoUpdate = false;
    scene.add(m); out.push(m);
  }
  return out;
}

// ---------- Material dos prédios (janelas em world-space, acesas à noite) ----------
function buildingMaterial(opts = {}) {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0.05, ...opts });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uNight = shared.night;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying vec3 vWN;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 cWP = vec4(transformed, 1.0);
        vec3 cN = objectNormal;
        #ifdef USE_INSTANCING
          cWP = instanceMatrix * cWP; cN = mat3(instanceMatrix) * cN;
        #endif
        cWP = modelMatrix * cWP; vWPos = cWP.xyz; vWN = normalize(mat3(modelMatrix) * cN);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWPos; varying vec3 vWN; uniform float uNight;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float isWall = 1.0 - step(0.5, abs(vWN.y));
        vec2 tdir = vec2(-vWN.z, vWN.x);
        float uu = dot(vWPos.xz, tdir);
        vec2 cell = vec2(uu / 3.1, (vWPos.y - 0.9) / 3.2);
        vec2 fc = fract(cell);
        float win = step(0.18, fc.x) * step(fc.x, 0.82) * step(0.28, fc.y) * step(fc.y, 0.82) * step(0.9, vWPos.y) * isWall;
        // base escura do térreo
        float ground = 1.0 - step(0.9, vWPos.y);
        diffuseColor.rgb *= mix(0.55, 1.0, isWall);
        diffuseColor.rgb *= 1.0 - ground * 0.35;
        vec2 wid = floor(cell) + floor(vWPos.xz * 0.013) * 7.0;
        float rnd = h21(wid);
        vec3 glass = mix(vec3(0.10,0.13,0.18), vec3(0.30,0.36,0.42), rnd * 0.6);
        diffuseColor.rgb = mix(diffuseColor.rgb, glass, win * 0.9);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.18, win);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float lit = step(0.62, h21(wid + 3.7));
        vec3 wc = mix(vec3(1.0,0.78,0.45), vec3(0.75,0.85,1.0), step(0.75, h21(wid + 9.1)));
        totalEmissiveRadiance += win * lit * uNight * wc * 0.85;`);
  };
  return m;
}

const WALL_DENSE = ['#d9d4c9', '#c9c2b6', '#e6e1d6', '#b7b9bd', '#9ea7ad', '#cfc5b0', '#e3d3b8', '#a9a196'];
const WALL_HOUSE = ['#f2e2c4', '#e8c9a0', '#d8e2c9', '#f0d9d2', '#c9dbe6', '#f5efe0', '#e7d08f', '#d3b8a6', '#bfd0b5', '#f1c27d', '#e9e4da', '#c97f5f'];
const ROOF = ['#9c4a2f', '#a85a3a', '#7c3d2a', '#8a8f94', '#6d7378', '#b0634a'];

function tiledInstances(scene, items, geo, mat, setup, { cast = true, tile = 1000 } = {}) {
  const tiles = new Map();
  for (const it of items) {
    const k = Math.floor(it.x / tile) + ',' + Math.floor(it.z / tile);
    let a = tiles.get(k); if (!a) tiles.set(k, (a = [])); a.push(it);
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
  const meshes = [];
  for (const arr of tiles.values()) {
    const im = new THREE.InstancedMesh(geo, mat, arr.length);
    arr.forEach((it, i) => {
      setup(it, p, s, col);
      q.setFromAxisAngle(up, -(it.ang || 0));
      m4.compose(p, q, s); im.setMatrixAt(i, m4); im.setColorAt(i, col);
    });
    im.castShadow = cast; im.receiveShadow = true;
    im.computeBoundingSphere();
    scene.add(im); meshes.push(im);
  }
  return meshes;
}

// ---------- Construção da cena ----------
export function buildScene(scene, W) {
  makeTextures();
  const R = W.raster;
  const rng = mulberry32(99);

  // Chão com mapa de cores derivado do raster
  const ds = 2;
  const cw = Math.ceil(R.w / ds), ch = Math.ceil(R.h / ds);
  const cnv = document.createElement('canvas'); cnv.width = cw; cnv.height = ch;
  const g = cnv.getContext('2d'); const img = g.createImageData(cw, ch);
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
    const f = R.data[(j * ds) * R.w + i * ds];
    let c;
    if (f & F.WATER) c = [52, 74, 70];
    else if (f & F.INSIDE) c = (f & F.WALK) ? [150, 146, 136] : [122, 132, 96];
    else c = [96, 124, 66];
    const o = (j * cw + i) * 4; img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const area = (a, color) => {
    g.fillStyle = color; g.beginPath();
    a.poly.forEach((p, i) => { const x = (p.x - R.minX) / R.cell / ds, y = (p.z - R.minZ) / R.cell / ds; i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.closePath(); g.fill();
  };
  const AREA_COL = { airbase: '#7f9a58', refinery: '#8c8a80', campus: '#6c9a4c', mall: '#55565a', mall2: '#6a6a6e', park: '#5c8f3b', osmpark: '#5c8f3b', plaza: '#b9ae9c', stadium: '#6a6a6a', wetland: '#4d6e38' };
  for (const a of W.areas) area(a, AREA_COL[a.kind] || '#777');
  const groundTex = new THREE.CanvasTexture(cnv); groundTex.colorSpace = THREE.SRGBColorSpace; groundTex.anisotropy = 8;
  W.mapCanvas = cnv;
  const gw = R.maxX - R.minX, gh = R.maxZ - R.minZ;
  const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95 });
  groundMat.onBeforeCompile = (sh) => {
    sh.uniforms.detailMap = { value: TEX.detail };
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D detailMap;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        float dt = texture2D(detailMap, vMapUv * 260.0).r * 0.6 + texture2D(detailMap, vMapUv * 37.0).r * 0.6;
        diffuseColor.rgb *= 0.55 + dt * 0.75;`);
  };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(gw * 3, gh * 3), groundMat);
  // UVs ajustados para que o centro corresponda ao raster
  const uvA = ground.geometry.attributes.uv;
  for (let i = 0; i < uvA.count; i++) uvA.setXY(i, uvA.getX(i) * 3 - 1, uvA.getY(i) * 3 - 1);
  groundTex.wrapS = groundTex.wrapT = THREE.ClampToEdgeWrapping;
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((R.minX + R.maxX) / 2, 0, (R.minZ + R.maxZ) / 2);
  ground.receiveShadow = true; scene.add(ground);

  // Água
  waterMat = waterMaterial();
  const wGeos = W.rivers.map((r) => ribbon(r.pts, r.width, 0.06, 20));
  for (const poly of W.waterPolys) {
    const shape = new THREE.Shape(poly.map((p) => new THREE.Vector2(p.x, -p.z)));
    const sg = new THREE.ShapeGeometry(shape); sg.rotateX(-Math.PI / 2); sg.translate(0, 0.06, 0);
    sg.deleteAttribute('uv'); sg.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(sg.attributes.position.count * 2), 2));
    wGeos.push(sg);
  }
  mergeAdd(scene, wGeos, waterMat);

  // Vias
  const asphalt = new THREE.MeshStandardMaterial({ map: TEX.asphalt, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const walkMat = new THREE.MeshStandardMaterial({ map: TEX.concrete, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const white = new THREE.MeshStandardMaterial({ color: '#e8e8e0', roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const yellow = new THREE.MeshStandardMaterial({ color: '#e0b020', roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const aG = [], wG = [], mW = [], mY = [], medians = [];
  for (const r of W.roads) {
    aG.push(ribbon(r.pts, r.width, 0.14, 8));
    if (r.sidewalk) wG.push(ribbon(r.pts, r.width + r.sidewalk * 2, 0.1, 6));
    if (r.type === 'highway' || r.type === 'trunk') {
      mY.push(ribbon(r.pts, 0.25, 0.18, 8, null, 0.35), ribbon(r.pts, 0.25, 0.18, 8, null, -0.35));
      mW.push(ribbon(r.pts, 0.3, 0.18, 8, null, r.width / 2 - 0.8), ribbon(r.pts, 0.3, 0.18, 8, null, -r.width / 2 + 0.8));
      mW.push(dashes(r, r.width / 4, 0.18, 4, 6, 0.25), dashes(r, -r.width / 4, 0.18, 4, 6, 0.25));
      medians.push(r);
    } else if (r.type === 'avenue' || r.type === 'primary' || r.type === 'secondary') {
      medians.push(r);
      mW.push(dashes(r, r.width / 4, 0.18, 3, 5, 0.22), dashes(r, -r.width / 4, 0.18, 3, 5, 0.22));
    } else if (r.type === 'road' || r.type === 'tertiary') {
      mY.push(dashes(r, 0, 0.18, 3, 4, 0.22));
    }
  }
  mergeAdd(scene, aG, asphalt, { shadow: true });
  mergeAdd(scene, wG, walkMat, { shadow: true });
  mergeAdd(scene, mW, white); mergeAdd(scene, mY, yellow);
  // canteiro central / mureta
  const medianGeos = [];
  const medMat = new THREE.MeshStandardMaterial({ color: '#8d8b85', roughness: 0.9 });
  const grassMed = new THREE.MeshStandardMaterial({ color: '#5d7f3a', roughness: 1 });
  const grassGeos = [];
  for (const r of medians) {
    const hw = r.type === 'highway' || r.type === 'trunk' ? 0.4 : 1.1;
    const geo = ribbon(r.pts, hw * 2, 0.45, 8); if (!geo) continue;
    medianGeos.push(geo);
    if (hw > 1) grassGeos.push(ribbon(r.pts, hw * 2 - 0.4, 0.47, 8));
  }
  mergeAdd(scene, medianGeos, medMat, { shadow: true });
  mergeAdd(scene, grassGeos, grassMed);

  // Pontes
  const railMat = new THREE.MeshStandardMaterial({ color: '#b5b2aa', roughness: 0.8 });
  const bG = [];
  for (const b of W.bridges) {
    const pts = []; for (let d = b.from; d <= b.to; d += 6) pts.push(pointAlong(b.road, d));
    pts.push(pointAlong(b.road, b.to));
    for (const side of [-1, 1]) {
      const off = side * (b.road.width / 2 + 0.4);
      // extruda verticalmente: usa caixas por segmento
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], c = pts[i];
        const L = Math.hypot(c.x - a.x, c.z - a.z);
        const box = new THREE.BoxGeometry(L, 1.1, 0.5);
        box.rotateY(-Math.atan2(c.z - a.z, c.x - a.x));
        box.translate((a.x + c.x) / 2 - a.dz * off, 0.7, (a.z + c.z) / 2 + a.dx * off);
        bG.push(box);
      }
    }
    // tabuleiro
    const deck = ribbon(pts, b.road.width + 1.6, 0.12, 8); if (deck) bG.push(deck);
  }
  mergeAdd(scene, bG, railMat, { shadow: true, cast: true });

  // Prédios
  const boxGeo = new THREE.BoxGeometry(1, 1, 1); boxGeo.translate(0, 0.5, 0);
  const bMat = buildingMaterial();
  tiledInstances(scene, W.buildings, boxGeo, bMat, (it, p, s, col) => {
    p.set(it.x, 0, it.z); s.set(it.w, it.h, it.d);
    col.set(WALL_DENSE[Math.floor(it.c * WALL_DENSE.length)]);
  });
  tiledInstances(scene, W.houses, boxGeo, bMat, (it, p, s, col) => {
    p.set(it.x, 0, it.z); s.set(it.w, it.h, it.d);
    col.set(WALL_HOUSE[Math.floor(it.c * WALL_HOUSE.length)]);
  });
  // telhados de duas águas nas casas
  const roofGeo = new THREE.BufferGeometry();
  {
    const v = [-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5, -0.5, 1, 0, 0.5, 1, 0];
    // faces: duas águas + oitões
    const tris = [0, 4, 5, 0, 5, 1, 3, 2, 5, 3, 5, 4, 0, 3, 4, 1, 5, 2];
    const pos = []; tris.forEach((i) => pos.push(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]));
    roofGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); roofGeo.computeVertexNormals();
  }
  const roofMat = new THREE.MeshStandardMaterial({ roughness: 0.75, flatShading: true });
  const roofItems = W.houses.filter((h) => h.c < 0.85).map((h) => ({ ...h, ang: h.d > h.w ? h.ang + Math.PI / 2 : h.ang, L: Math.max(h.w, h.d), S: Math.min(h.w, h.d) }));
  tiledInstances(scene, roofItems, roofGeo, roofMat, (it, p, s, col) => {
    p.set(it.x, it.h, it.z);
    s.set(it.L + 0.8, it.S * 0.28, it.S + 0.8);
    col.set(ROOF[Math.floor((it.c * 7.13 % 1) * ROOF.length)]);
  });

  buildRail(scene, W);
  buildAreas(scene, W, rng);

  // Prédios OSM (polígonos extrudados)
  if (W.osmBuildings) buildOSMBuildings(scene, W.osmBuildings, bMat);

  // Árvores (tronco + copa em uma só malha; cor da instância tinge a copa)
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.35, 3.2, 5); trunkGeo.translate(0, 1.6, 0);
  const leafGeo = new THREE.IcosahedronGeometry(2.3, 1); leafGeo.scale(1, 0.85, 1); leafGeo.translate(0, 4.4, 0);
  {
    const pa = leafGeo.attributes.position; const r2 = mulberry32(5);
    for (let i = 0; i < pa.count; i++) { const k = 0.82 + r2() * 0.3; pa.setXYZ(i, pa.getX(i) * k, 4.4 + (pa.getY(i) - 4.4) * k, pa.getZ(i) * k); }
  }
  const tg = trunkGeo.toNonIndexed(); const lg = leafGeo.toNonIndexed(); lg.computeVertexNormals();
  tg.setAttribute('color', new THREE.Float32BufferAttribute(new Array(tg.attributes.position.count).fill(0).flatMap(() => [0.55, 0.42, 0.75]), 3));
  lg.setAttribute('color', new THREE.Float32BufferAttribute(new Array(lg.attributes.position.count * 3).fill(1), 3));
  tg.deleteAttribute('uv'); lg.deleteAttribute('uv');
  const treeGeo = mergeGeometries([tg, lg]);
  const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true, vertexColors: true });
  const greens = ['#3f6b2a', '#4c7a31', '#5a8a3a', '#36602a', '#6b8f3a', '#2f5a25'];
  tiledInstances(scene, W.trees, treeGeo, leafMat, (it, p, s, col) => {
    p.set(it.x, 0, it.z); s.set(it.s * 1.1, it.s, it.s * 1.1);
    const r = (it.x * 13.7 + it.z * 7.1) % 1;
    const rr = r < 0 ? r + 1 : r;
    col.set(rr < 0.035 ? '#d86fa8' : rr < 0.06 ? '#e6c229' : greens[Math.floor(rr * 997) % greens.length]); // ipês rosa e amarelo
  });

  // Postes de luz
  const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 8, 5); poleGeo.translate(0, 4, 0);
  const armGeo = new THREE.BoxGeometry(2.2, 0.15, 0.15); armGeo.translate(1.0, 7.9, 0);
  const poleMerged = mergeGeometries([poleGeo, armGeo]);
  const poleMat = new THREE.MeshStandardMaterial({ color: '#6f7377', roughness: 0.6, metalness: 0.4 });
  const lampItems = W.lamps.map((l) => ({ ...l, ang: Math.atan2(l.dz, l.dx) }));
  tiledInstances(scene, lampItems, poleMerged, poleMat, (it, p, s, col) => { p.set(it.x, 0, it.z); s.setScalar(1); col.set('#ffffff'); }, { cast: false });
  const headGeo = new THREE.SphereGeometry(0.42, 8, 6); headGeo.scale(1.4, 0.5, 1); headGeo.translate(2.0, 7.75, 0);
  const headMat = new THREE.MeshBasicMaterial({ color: '#555' });
  shared.lampMats.push(headMat);
  tiledInstances(scene, lampItems, headGeo, headMat, (it, p, s, col) => { p.set(it.x, 0, it.z); s.setScalar(1); col.set('#ffffff'); }, { cast: false });
}

function buildOSMBuildings(scene, list, mat) {
  const TILE = 600; const tiles = new Map();
  for (const b of list) {
    const k = Math.floor(b.poly[0].x / TILE) + ',' + Math.floor(b.poly[0].z / TILE);
    let a = tiles.get(k); if (!a) tiles.set(k, (a = [])); a.push(b);
  }
  const col = new THREE.Color();
  for (const arr of tiles.values()) {
    const pos = [], nor = [], colr = [];
    for (const b of arr) {
      let poly = b.poly;
      if (poly.length > 3 && poly[0].x === poly[poly.length - 1].x && poly[0].z === poly[poly.length - 1].z) poly = poly.slice(0, -1);
      col.set((b.h > 12 ? WALL_DENSE : WALL_HOUSE)[Math.floor(b.c * (b.h > 12 ? WALL_DENSE.length : WALL_HOUSE.length))]);
      // orientação
      let area = 0; for (let i = 0; i < poly.length; i++) { const a = poly[i], c = poly[(i + 1) % poly.length]; area += a.x * c.z - c.x * a.z; }
      const cw = area > 0;
      for (let i = 0; i < poly.length; i++) {
        let a = poly[i], c = poly[(i + 1) % poly.length];
        if (!cw) [a, c] = [c, a];
        let nx = c.z - a.z, nz = -(c.x - a.x); const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
        nx = -nx; nz = -nz;
        pos.push(a.x, 0, a.z, c.x, 0, c.z, c.x, b.h, c.z, a.x, 0, a.z, c.x, b.h, c.z, a.x, b.h, a.z);
        for (let k = 0; k < 6; k++) { nor.push(nx, 0, nz); colr.push(col.r, col.g, col.b); }
      }
      const tris = THREE.ShapeUtils.triangulateShape(poly.map((p) => new THREE.Vector2(p.x, p.z)), []);
      for (const t of tris) {
        const [i0, i1, i2] = THREE.ShapeUtils.isClockWise(poly.map((p) => new THREE.Vector2(p.x, p.z))) ? t : [t[0], t[2], t[1]];
        for (const i of [i0, i2, i1]) { pos.push(poly[i].x, b.h, poly[i].z); nor.push(0, 1, 0); colr.push(col.r, col.g, col.b); }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
    const m = mat.clone(); m.vertexColors = true; m.side = THREE.DoubleSide; m.onBeforeCompile = mat.onBeforeCompile;
    const mesh = new THREE.Mesh(geo, m); mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh);
  }
}

function waterMaterial() {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uSky: { value: new THREE.Color('#8fb3c9') }, uDeep: { value: new THREE.Color('#1f3d44') }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color('#fff') } }]),
    vertexShader: `varying vec3 vW; #include <fog_pars_vertex>
      void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition; #include <fog_vertex> }`.replace(/#include <(\w+)>/g, '\n#include <$1>\n'),
    fragmentShader: `uniform float uTime; uniform vec3 uSky; uniform vec3 uDeep; uniform vec3 uSun; uniform vec3 uSunCol; varying vec3 vW;
      #include <fog_pars_fragment>
      void main(){
        vec2 p = vW.xz * 0.08;
        float t = uTime;
        vec3 n = normalize(vec3(sin(p.x*1.3+t*0.9)*0.25 + sin(p.y*2.1 - t*1.3)*0.15 + sin((p.x+p.y)*3.7+t*2.0)*0.06, 1.0,
                               cos(p.y*1.1+t*0.7)*0.25 + cos(p.x*2.7 + t*1.1)*0.15 + cos((p.x-p.y)*4.3-t*1.7)*0.06));
        vec3 v = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
        vec3 col = mix(uDeep, uSky, 0.25 + 0.6*fres);
        vec3 h = normalize(uSun + v);
        col += uSunCol * pow(max(dot(n, h), 0.0), 120.0) * 1.5 * step(0.0, uSun.y);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}
export let waterMat = null;

function signTexture(text, bg = '#1d3b6b', fg = '#ffffff', w = 1024, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = fg; let size = h * 0.55; g.font = `bold ${size}px Arial, sans-serif`;
  while (g.measureText(text).width > w * 0.9 && size > 10) { size -= 4; g.font = `bold ${size}px Arial, sans-serif`; }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function addSign(scene, text, x, y, z, ang, width, opts = {}) {
  const tex = signTexture(text, opts.bg, opts.fg);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false }));
  m.position.set(x, y, z); m.rotation.y = ang; scene.add(m); return m;
}

function solidRect(W, x, z, w, d, ang) {
  const c = Math.cos(ang), s = Math.sin(ang), R = W.raster;
  for (let u = -w / 2; u <= w / 2; u += 1.5) for (let v = -d / 2; v <= d / 2; v += 1.5) {
    const i = R.idx(x + u * c - v * s, z + u * s + v * c); if (i >= 0) R.data[i] |= F.BUILD | F.SOLID;
  }
}
function solidCircle(W, x, z, r) {
  const R = W.raster;
  for (let u = -r; u <= r; u += 1.5) for (let v = -r; v <= r; v += 1.5) if (u * u + v * v <= r * r) {
    const i = R.idx(x + u, z + v); if (i >= 0) R.data[i] |= F.BUILD | F.SOLID;
  }
}

function boxAt(scene, W, mat, x, z, w, h, d, ang, y = 0, solid = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z); m.rotation.y = -ang; m.castShadow = m.receiveShadow = true; scene.add(m);
  if (solid) solidRect(W, x, z, w, d, ang);
  return m;
}

function buildRail(scene, W) {
  const geos = [ribbon(W.rail, 8, 0.2, 6)];
  const ballast = new THREE.MeshStandardMaterial({ map: TEX.gravel, roughness: 1 });
  mergeAdd(scene, geos, ballast, { shadow: true });
  const steel = new THREE.MeshStandardMaterial({ color: '#8a8a8a', metalness: 0.8, roughness: 0.35 });
  const railG = [];
  for (const off of [-2.6, -1.4, 1.4, 2.6]) {
    const g = ribbon(W.rail, 0.18, 0.42, 8, null, off); if (g) railG.push(g);
  }
  mergeAdd(scene, railG, steel);
  // postes da catenária
  const cat = [];
  const railRoad = { pts: W.rail }; let L = 0; const cum = [0];
  for (let i = 1; i < W.rail.length; i++) { L += Math.hypot(W.rail[i].x - W.rail[i - 1].x, W.rail[i].z - W.rail[i - 1].z); cum.push(L); }
  railRoad.cum = cum; railRoad.len = L; W.railRoad = railRoad;
  for (let d = 0; d < L; d += 45) {
    const p = pointAlong(railRoad, d, 4.2);
    const pole = new THREE.BoxGeometry(0.3, 7, 0.3); pole.translate(p.x, 3.5, p.z); cat.push(pole);
    const arm = new THREE.BoxGeometry(0.15, 0.15, 6.5); arm.rotateY(-Math.atan2(p.dz, p.dx) + Math.PI / 2);
    const q = pointAlong(railRoad, d, 1.2); arm.translate(q.x, 6.8, q.z); cat.push(arm);
  }
  mergeAdd(scene, cat, new THREE.MeshStandardMaterial({ color: '#5d6166', metalness: 0.5, roughness: 0.5 }), { cast: true });
  // fio
  const wireG = []; for (const off of [-2, 2]) { const g = ribbon(W.rail, 0.05, 6.6, 8, null, off); if (g) wireG.push(g); }
  mergeAdd(scene, wireG, new THREE.MeshBasicMaterial({ color: '#222' }));

  // Estações
  const plat = new THREE.MeshStandardMaterial({ color: '#c9c4b8', roughness: 0.9 });
  const roofM = new THREE.MeshStandardMaterial({ color: '#2a5d9f', roughness: 0.5, metalness: 0.3 });
  for (const s of W.stations) {
    // direção local do trilho
    let best = 0, bd = Infinity;
    for (let d = 0; d < railRoad.len; d += 5) { const p = pointAlong(railRoad, d); const dd = (p.x - s.x) ** 2 + (p.z - s.z) ** 2; if (dd < bd) { bd = dd; best = d; } }
    const p = pointAlong(railRoad, best); const ang = Math.atan2(p.dz, p.dx);
    for (const side of [-1, 1]) {
      const q = pointAlong(railRoad, best, side * 6.5);
      boxAt(scene, W, plat, q.x, q.z, 90, 1.1, 4.5, ang);
      const r = boxAt(scene, W, roofM, q.x, q.z, 70, 0.4, 5.5, ang, 5.5, false);
      for (let k = -30; k <= 30; k += 15) { const c = pointAlong(railRoad, best + k, side * 7.8); boxAt(scene, W, roofM, c.x, c.z, 0.3, 5.5, 0.3, 0, 0, false); }
      addSign(scene, s.name, q.x - p.dz * side * 0.1, 7.2, q.z + p.dx * side * 0.1, -ang, 14, { bg: '#0b3b7a' });
    }
    s.rd = best;
  }
}

function buildAreas(scene, W, rng) {
  const concrete = new THREE.MeshStandardMaterial({ color: '#c8c4bb', roughness: 0.85 });
  const white = new THREE.MeshStandardMaterial({ color: '#eeeeea', roughness: 0.6 });
  const glass = new THREE.MeshStandardMaterial({ color: '#4a6378', roughness: 0.15, metalness: 0.6 });
  const asph = new THREE.MeshStandardMaterial({ map: TEX.asphalt, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const lineM = new THREE.MeshBasicMaterial({ color: '#e8e8e8' });
  const L = (a, u, v) => ({ x: a.x + u * Math.cos(a.ang) - v * Math.sin(a.ang), z: a.z + u * Math.sin(a.ang) + v * Math.cos(a.ang) });
  for (const a of W.areas) {
    if (a.kind === 'airbase') {
      const runway = new THREE.Mesh(new THREE.PlaneGeometry(a.w * 0.9, 34), asph);
      runway.rotation.x = -Math.PI / 2; runway.rotation.z = -a.ang; runway.position.set(a.x, 0.15, a.z); runway.receiveShadow = true; scene.add(runway);
      for (let u = -a.w * 0.42; u < a.w * 0.42; u += 30) { const p = L(a, u, 0); const m = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.9), lineM); m.rotation.x = -Math.PI / 2; m.rotation.z = -a.ang; m.position.set(p.x, 0.2, p.z); scene.add(m); }
      for (const end of [-1, 1]) for (let v = -12; v <= 12; v += 3) { const p = L(a, end * a.w * 0.43, v); const m = new THREE.Mesh(new THREE.PlaneGeometry(18, 1.2), lineM); m.rotation.x = -Math.PI / 2; m.rotation.z = -a.ang; m.position.set(p.x, 0.2, p.z); scene.add(m); }
      const tw = L(a, 0, -70); const taxi = new THREE.Mesh(new THREE.PlaneGeometry(a.w * 0.7, 18), asph); taxi.rotation.x = -Math.PI / 2; taxi.rotation.z = -a.ang; taxi.position.set(tw.x, 0.15, tw.z); scene.add(taxi);
      const hangarM = new THREE.MeshStandardMaterial({ color: '#7d8a76', roughness: 0.7, metalness: 0.2 });
      for (let i = 0; i < 4; i++) {
        const p = L(a, -260 + i * 110, -170);
        const h = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 70, 20, 1, false, 0, Math.PI), hangarM);
        h.rotation.z = Math.PI / 2; h.rotation.y = -a.ang; h.position.set(p.x, 0, p.z); h.castShadow = h.receiveShadow = true; scene.add(h);
        solidRect(W, p.x, p.z, 70, 46, a.ang);
      }
      const tp = L(a, 200, -150);
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 28, 10), concrete); tower.position.set(tp.x, 14, tp.z); tower.castShadow = true; scene.add(tower);
      const cab = new THREE.Mesh(new THREE.CylinderGeometry(6, 5, 5, 10), glass); cab.position.set(tp.x, 30, tp.z); scene.add(cab);
      solidCircle(W, tp.x, tp.z, 4.5);
      for (let i = 0; i < 3; i++) { const p = L(a, -150 + i * 70, -110); scene.add(makePlane(p.x, p.z, a.ang + Math.PI / 2)); solidCircle(W, p.x, p.z, 3); }
      const sp = L(a, -400, -230); addSign(scene, 'BASE AÉREA DE CANOAS', sp.x, 6, sp.z, -a.ang, 40, { bg: '#2f4a2a' });
    } else if (a.kind === 'refinery') {
      const tankM = new THREE.MeshStandardMaterial({ color: '#dcdcd6', roughness: 0.45, metalness: 0.5 });
      for (let i = -3; i <= 3; i++) for (let j = -2; j <= 1; j++) {
        if (rng() < 0.15) continue;
        const r = 9 + rng() * 9, h = 10 + rng() * 10;
        const p = L(a, i * 60 + 80, j * 60);
        const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), tankM); t.position.set(p.x, h / 2, p.z); t.castShadow = t.receiveShadow = true; scene.add(t);
        solidCircle(W, p.x, p.z, r);
      }
      const redW = new THREE.MeshStandardMaterial({ color: '#b8402e', roughness: 0.6 });
      for (let i = 0; i < 4; i++) {
        const p = L(a, -280 + i * 35, 150);
        const c = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 55 + i * 8, 10), i % 2 ? redW : concrete); c.position.set(p.x, (55 + i * 8) / 2, p.z); c.castShadow = true; scene.add(c);
        solidCircle(W, p.x, p.z, 3);
      }
      // torres de destilação e tocha
      for (let i = 0; i < 5; i++) { const p = L(a, -200 + i * 22, 60); boxAt(scene, W, concrete, p.x, p.z, 10, 25 + i * 6, 10, a.ang); }
      const fp = L(a, -330, -120);
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 70, 8), concrete); stack.position.set(fp.x, 35, fp.z); scene.add(stack);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(2.5, 9, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 1.6, 0.4), transparent: true, opacity: 0.9, toneMapped: false }));
      flame.position.set(fp.x, 75, fp.z); scene.add(flame); shared.flames.push(flame);
      const fl = new THREE.PointLight('#ff8a3a', 600, 220, 1.6); fl.position.set(fp.x, 74, fp.z); scene.add(fl);
      solidCircle(W, fp.x, fp.z, 2);
      const sp = L(a, 0, a.d / 2 - 15); addSign(scene, 'REFINARIA ALBERTO PASQUALINI', sp.x, 6, sp.z, -a.ang, 46, { bg: '#0f6b3a' });
    } else if (a.kind === 'campus') {
      const brick = new THREE.MeshStandardMaterial({ color: '#a4553a', roughness: 0.85 });
      const spots = [[-180, -120, 120, 40, 18], [0, -140, 150, 35, 22], [170, -120, 90, 50, 16], [-170, 80, 100, 45, 14], [150, 100, 120, 40, 26], [0, 60, 70, 70, 12]];
      for (const [u, v, w, d, h] of spots) { const p = L(a, u, v); boxAt(scene, W, buildingMaterial({ color: u > 0 ? '#e3ddd0' : '#b8664a' }), p.x, p.z, w, h, d, a.ang); }
      const sp = L(a, 0, -140 + 18); addSign(scene, 'ULBRA', sp.x, 28, sp.z, -a.ang, 40, { bg: '#1c3f8a' });
      const hp = L(a, 150, 100 + 21); addSign(scene, 'HOSPITAL UNIVERSITÁRIO', hp.x, 30, hp.z, -a.ang, 40, { bg: '#0d6e5a' });
    } else if (a.kind === 'mall' || a.kind === 'mall2') {
      const big = a.kind === 'mall';
      const bw = a.w * (big ? 0.55 : 0.85), bd = a.d * (big ? 0.6 : 0.85), h = big ? 17 : 24;
      const bm = buildingMaterial({ color: big ? '#f1efe9' : '#d9d2c4' });
      const off = big ? -a.d * 0.12 : 0;
      const c = L(a, 0, off);
      boxAt(scene, W, bm, c.x, c.z, bw, h, bd, a.ang);
      const g2 = L(a, 0, off + bd / 2 + 0.6); boxAt(scene, W, glass, g2.x, g2.z, bw * 0.3, h * 0.8, 1.2, a.ang, 0, false);
      const sp = L(a, 0, off + bd / 2 + 1.5);
      addSign(scene, big ? 'ParkShopping Canoas' : 'Canoas Shopping', sp.x, h + 5, sp.z, -a.ang, big ? 60 : 44, { bg: big ? '#7a1f4b' : '#c8102e' });
      if (big) {
        // estacionamento com vagas e carros parados
        const pl = L(a, 0, a.d / 2 - (a.d * 0.4) / 2);
        const lot = new THREE.Mesh(new THREE.PlaneGeometry(a.w * 0.95, a.d * 0.36), asph); lot.rotation.x = -Math.PI / 2; lot.rotation.z = -a.ang; lot.position.set(pl.x, 0.13, pl.z); lot.receiveShadow = true; scene.add(lot);
        W.parkedSpots = W.parkedSpots || [];
        for (let u = -a.w * 0.44; u < a.w * 0.44; u += 3.6) for (const v of [a.d / 2 - a.d * 0.3, a.d / 2 - a.d * 0.12]) {
          const p = L(a, u, v); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 6), lineM); m.rotation.x = -Math.PI / 2; m.rotation.z = -a.ang; m.position.set(p.x, 0.2, p.z); scene.add(m);
          if (rng() < 0.45) W.parkedSpots.push({ x: p.x + Math.cos(a.ang) * 1.8, z: p.z + Math.sin(a.ang) * 1.8, ang: a.ang + Math.PI / 2 });
        }
      }
    } else if (a.kind === 'plaza') {
      const pav = new THREE.Mesh(new THREE.PlaneGeometry(a.w, a.d), new THREE.MeshStandardMaterial({ map: TEX.concrete, roughness: 0.9 }));
      pav.rotation.x = -Math.PI / 2; pav.rotation.z = -a.ang; pav.position.set(a.x, 0.12, a.z); pav.receiveShadow = true; scene.add(pav);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 18, 8), white); pole.position.set(a.x, 9, a.z); scene.add(pole);
      solidCircle(W, a.x, a.z, 1);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(6, 4, 12, 4), new THREE.MeshStandardMaterial({ map: rsFlag(), side: THREE.DoubleSide }));
      flag.position.set(a.x + 3.2, 15.5, a.z); scene.add(flag); shared.flag = flag;
      const mon = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.5, 1.2, 16), concrete); mon.position.set(a.x + 18, 0.6, a.z + 12); scene.add(mon);
      for (let i = 0; i < 10; i++) { const p = L(a, (rng() - 0.5) * a.w * 0.9, (rng() - 0.5) * a.d * 0.9); W.trees.push({ x: p.x, z: p.z, s: 1 }); }
    } else if (a.kind === 'stadium') {
      const field = new THREE.Mesh(new THREE.PlaneGeometry(a.w * 0.6, a.d * 0.55), new THREE.MeshStandardMaterial({ color: '#3f8f35', roughness: 1 }));
      field.rotation.x = -Math.PI / 2; field.rotation.z = -a.ang; field.position.set(a.x, 0.16, a.z); scene.add(field);
      const standM = new THREE.MeshStandardMaterial({ color: '#9a9590', roughness: 0.9 });
      for (const [u, v, w, d] of [[0, -a.d * 0.4, a.w * 0.8, 18], [0, a.d * 0.4, a.w * 0.8, 18], [-a.w * 0.42, 0, 18, a.d * 0.6], [a.w * 0.42, 0, 18, a.d * 0.6]]) {
        const p = L(a, u, v); boxAt(scene, W, standM, p.x, p.z, w, 9, d, a.ang);
      }
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const p = L(a, u * a.w * 0.45, v * a.d * 0.45);
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 30, 6), standM); t.position.set(p.x, 15, p.z); scene.add(t);
        const lt = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 0.6), new THREE.MeshBasicMaterial({ color: '#fff' })); lt.position.set(p.x, 30, p.z); scene.add(lt); shared.lampMats.push(lt.material);
      }
    }
  }
}

function rsFlag() {
  const c = document.createElement('canvas'); c.width = 300; c.height = 200; const g = c.getContext('2d');
  g.fillStyle = '#0b8a3a'; g.fillRect(0, 0, 300, 200);
  g.fillStyle = '#d81e1e'; g.beginPath(); g.moveTo(0, 200); g.lineTo(300, 0); g.lineTo(300, 70); g.lineTo(105, 200); g.closePath(); g.fill();
  g.fillStyle = '#f5d21a'; g.beginPath(); g.moveTo(105, 200); g.lineTo(300, 70); g.lineTo(300, 140); g.lineTo(210, 200); g.closePath(); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(150, 100, 26, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makePlane(x, z, ang) {
  const grp = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: '#8f9a8a', roughness: 0.5, metalness: 0.4 });
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.2, 26, 12), m); fus.rotation.z = Math.PI / 2; fus.position.y = 3; grp.add(fus);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4, 12), m); nose.rotation.z = -Math.PI / 2; nose.position.set(15, 3, 0); grp.add(nose);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 30), m); wing.position.set(1, 3.4, 0); grp.add(wing);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 0.3), m); tail.position.set(-12, 5.5, 0); grp.add(tail);
  const stab = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.25, 10), m); stab.position.set(-12, 3.4, 0); grp.add(stab);
  for (const zz of [-6, 6]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 4, 10), m); e.rotation.z = Math.PI / 2; e.position.set(2, 2.4, zz); grp.add(e); }
  const wheels = new THREE.Mesh(new THREE.BoxGeometry(1, 1.8, 1), new THREE.MeshStandardMaterial({ color: '#222' })); wheels.position.set(0, 0.9, 0); grp.add(wheels);
  grp.traverse((o) => { o.castShadow = true; });
  grp.position.set(x, 0, z); grp.rotation.y = -ang; return grp;
}

