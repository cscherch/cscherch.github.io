// Gera o modelo de dados da cidade (sem renderização): raster de colisão, vias, prédios, árvores.
import * as D from './data.js';
import { project, projectPts, meters, mulberry32, pointInPoly, distSeg, rectCorners } from './geo.js';

export const F = { INSIDE: 1, ROAD: 2, BUILD: 4, WATER: 8, AREA: 16, RAIL: 32, WALK: 64, SOLID: 128 };
export const ROAD_W = { highway: 26, trunk: 22, primary: 17, avenue: 16, secondary: 14, tertiary: 12, road: 12, street: 9, service: 6 };
const SIDEWALK = 2.6;

export class Raster {
  constructor(minX, minZ, maxX, maxZ, cell) {
    this.cell = cell; this.minX = minX; this.minZ = minZ;
    this.w = Math.ceil((maxX - minX) / cell); this.h = Math.ceil((maxZ - minZ) / cell);
    this.maxX = minX + this.w * cell; this.maxZ = minZ + this.h * cell;
    this.data = new Uint8Array(this.w * this.h);
  }
  idx(x, z) {
    const i = Math.floor((x - this.minX) / this.cell), j = Math.floor((z - this.minZ) / this.cell);
    if (i < 0 || j < 0 || i >= this.w || j >= this.h) return -1;
    return j * this.w + i;
  }
  get(x, z) { const i = this.idx(x, z); return i < 0 ? 0 : this.data[i]; }
  paintPolyline(pts, r, flag) {
    const c = this.cell;
    // subdivide segmentos longos para que a caixa envolvente fique justa
    const sub = [pts[0]];
    const piece = Math.max(r * 1.5, 8);
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], b = pts[k];
      const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / piece));
      for (let t = 1; t <= n; t++) sub.push({ x: a.x + ((b.x - a.x) * t) / n, z: a.z + ((b.z - a.z) * t) / n });
    }
    pts = sub;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], b = pts[k];
      const i0 = Math.max(0, Math.floor((Math.min(a.x, b.x) - r - this.minX) / c));
      const i1 = Math.min(this.w - 1, Math.floor((Math.max(a.x, b.x) + r - this.minX) / c));
      const j0 = Math.max(0, Math.floor((Math.min(a.z, b.z) - r - this.minZ) / c));
      const j1 = Math.min(this.h - 1, Math.floor((Math.max(a.z, b.z) + r - this.minZ) / c));
      for (let j = j0; j <= j1; j++) {
        const z = this.minZ + (j + 0.5) * c;
        for (let i = i0; i <= i1; i++) {
          const x = this.minX + (i + 0.5) * c;
          if (distSeg(x, z, a.x, a.z, b.x, b.z) <= r) this.data[j * this.w + i] |= flag;
        }
      }
    }
  }
  paintPolygon(poly, flag, clear = 0) {
    const c = this.cell;
    let zmin = Infinity, zmax = -Infinity;
    for (const p of poly) { zmin = Math.min(zmin, p.z); zmax = Math.max(zmax, p.z); }
    const j0 = Math.max(0, Math.floor((zmin - this.minZ) / c)), j1 = Math.min(this.h - 1, Math.floor((zmax - this.minZ) / c));
    for (let j = j0; j <= j1; j++) {
      const z = this.minZ + (j + 0.5) * c;
      const xs = [];
      for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
        const p = poly[a], q = poly[b];
        if ((p.z > z) !== (q.z > z)) xs.push(p.x + ((z - p.z) * (q.x - p.x)) / (q.z - p.z));
      }
      xs.sort((u, v) => u - v);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const i0 = Math.max(0, Math.round((xs[k] - this.minX) / c)), i1 = Math.min(this.w - 1, Math.round((xs[k + 1] - this.minX) / c) - 1);
        for (let i = i0; i <= i1; i++) {
          const o = j * this.w + i;
          this.data[o] = (this.data[o] & ~clear) | flag;
        }
      }
    }
  }
  // true se nenhuma célula do retângulo tem bits de `mask` e todas têm bits de `need`
  rectFree(cx, cz, w, d, ang, mask, need = 0) {
    const c = Math.cos(ang), s = Math.sin(ang), st = this.cell * 0.9;
    for (let u = -w / 2; u <= w / 2 + 0.01; u += Math.min(st, w / 2)) {
      for (let v = -d / 2; v <= d / 2 + 0.01; v += Math.min(st, d / 2)) {
        const f = this.get(cx + u * c - v * s, cz + u * s + v * c);
        if (f & mask) return false;
        if ((f & need) !== need) return false;
      }
    }
    return true;
  }
}

function makeRoad(name, type, pts, width) {
  const w = width ?? ROAD_W[type] ?? 9;
  let len = 0; const cum = [0];
  for (let i = 1; i < pts.length; i++) { len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); cum.push(len); }
  return { name, type, width: w, pts, cum, len, sidewalk: type === 'highway' || type === 'trunk' || type === 'service' ? 0 : SIDEWALK };
}

export function pointAlong(road, d, offset = 0) {
  const { pts, cum } = road;
  d = Math.max(0, Math.min(road.len, d));
  let i = 1;
  while (i < cum.length - 1 && cum[i] < d) i++;
  const a = pts[i - 1], b = pts[i];
  const segL = cum[i] - cum[i - 1] || 1;
  const t = (d - cum[i - 1]) / segL;
  const dx = (b.x - a.x) / segL, dz = (b.z - a.z) / segL;
  return { x: a.x + (b.x - a.x) * t - dz * offset, z: a.z + (b.z - a.z) * t + dx * offset, dx, dz };
}

export function buildWorld(osm) {
  const rng = mulberry32(20240505);
  const W = { roads: [], buildings: [], houses: [], trees: [], lamps: [], areas: [], bridges: [], osm: !!osm };

  W.boundary = projectPts(D.BOUNDARY);
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
  for (const p of W.boundary) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); }
  const M = 700;
  const R = new Raster(minX - M, minZ - M, maxX + M, maxZ + M, 3);
  W.raster = R;
  W.bounds = { minX: R.minX, minZ: R.minZ, maxX: R.maxX, maxZ: R.maxZ };

  R.paintPolygon(W.boundary, F.INSIDE);

  // Rios
  W.rivers = D.RIVERS.map((r) => ({ name: r.name, width: meters(r.width), pts: projectPts(r.pts) }));
  W.waterPolys = [];
  for (const r of W.rivers) R.paintPolyline(r.pts, r.width / 2, F.WATER);

  // Áreas especiais
  if (!osm) {
    for (const a of D.AREAS) {
      const c = project(a.lat, a.lon);
      const area = { ...a, x: c.x, z: c.z, w: meters(a.w), d: meters(a.h), ang: (a.angle * Math.PI) / 180 };
      area.poly = rectCorners(area.x, area.z, area.w, area.d, area.ang);
      W.areas.push(area);
      R.paintPolygon(area.poly, F.AREA);
    }
  }

  // Bairros
  W.neighborhoods = D.NEIGHBORHOODS.map((n) => ({ ...n, ...project(n.lat, n.lon), ang: (n.angle * Math.PI) / 180, s: meters(n.block) }));
  W.landmarks = D.LANDMARKS.map((l) => ({ ...l, ...project(l.lat, l.lon) }));

  // Trilho do Trensurb
  W.rail = projectPts(D.RAIL.pts);
  W.stations = D.STATIONS.map((s) => {
    // estação: ponto do trilho mais próximo da latitude
    const z = project(s.lat, D.ORIGIN.lon).z;
    let best = W.rail[0];
    for (let i = 1; i < W.rail.length; i++) {
      const a = W.rail[i - 1], b = W.rail[i];
      if ((a.z - z) * (b.z - z) <= 0) { const t = (z - a.z) / (b.z - a.z); best = { x: a.x + (b.x - a.x) * t, z }; break; }
    }
    return { name: s.name, x: best.x, z: best.z };
  });

  if (osm) loadOSM(W, osm, R, rng); else generateProcedural(W, R, rng);

  // Trilho por último: sólido onde não há via
  R.paintPolyline(W.rail, 6, F.RAIL);

  // Colisão
  const d = R.data;
  for (let i = 0; i < d.length; i++) {
    const f = d[i];
    if ((f & F.BUILD) || ((f & F.WATER) && !(f & F.ROAD)) || ((f & F.RAIL) && !(f & F.ROAD))) d[i] |= F.SOLID;
  }

  // Pontes (via sobre água)
  for (const r of W.roads) {
    if (r.type === 'street' || r.type === 'service') continue;
    let inWater = false, start = 0;
    for (let s = 0; s <= r.len; s += 3) {
      const p = pointAlong(r, s);
      const w = (R.get(p.x, p.z) & F.WATER) !== 0;
      if (w && !inWater) { inWater = true; start = Math.max(0, s - 6); }
      if ((!w || s + 3 > r.len) && inWater) { inWater = false; W.bridges.push({ road: r, from: start, to: Math.min(r.len, s + 6) }); }
    }
  }

  // Índice espacial das vias (para nome da rua e spawn de tráfego)
  W.roadIndex = new Map();
  const G = 60;
  W.roads.forEach((r, ri) => {
    for (let k = 1; k < r.pts.length; k++) {
      const a = r.pts[k - 1], b = r.pts[k];
      const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / G) + 1;
      for (let t = 0; t <= n; t++) {
        const x = a.x + ((b.x - a.x) * t) / n, z = a.z + ((b.z - a.z) * t) / n;
        const key = Math.floor(x / G) + ',' + Math.floor(z / G);
        let arr = W.roadIndex.get(key); if (!arr) W.roadIndex.set(key, (arr = []));
        const e = ri * 10000 + k; if (arr[arr.length - 1] !== e) arr.push(e);
      }
    }
  });
  W.nearestRoad = (x, z) => {
    const gx = Math.floor(x / G), gz = Math.floor(z / G);
    let best = null, bd = Infinity;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const arr = W.roadIndex.get(gx + i + ',' + (gz + j)); if (!arr) continue;
      for (const e of arr) {
        const r = W.roads[Math.floor(e / 10000)], k = e % 10000;
        const a = r.pts[k - 1], b = r.pts[k];
        const dd = distSeg(x, z, a.x, a.z, b.x, b.z) - r.width / 2;
        if (dd < bd) { bd = dd; best = r; }
      }
    }
    return bd < 25 ? best : null;
  };
  W.neighborhoodAt = (x, z) => {
    if (!(R.get(x, z) & F.INSIDE)) {
      if (z > project(-29.966, -51.17).z) return 'Porto Alegre (outra margem)';
      if (z < project(-29.858, -51.17).z) return 'Esteio / Sapucaia';
      return x < 0 ? 'Delta do Jacuí' : 'Cachoeirinha';
    }
    let best = null, bd = Infinity;
    for (const n of W.neighborhoods) { const dd = (n.x - x) ** 2 + (n.z - z) ** 2; if (dd < bd) { bd = dd; best = n; } }
    return best.name;
  };
  W.isSolid = (x, z) => { const i = R.idx(x, z); return i < 0 ? true : (R.data[i] & F.SOLID) !== 0; };

  // Faixas para o tráfego
  W.lanes = [];
  for (const r of W.roads) {
    if (r.len < 120) continue;
    if (!['highway', 'trunk', 'primary', 'avenue', 'secondary', 'tertiary', 'road'].includes(r.type)) continue;
    const off = r.width / 4 + (r.type === 'highway' ? 1.5 : 0);
    W.lanes.push({ road: r, dir: 1, off }, { road: r, dir: -1, off });
  }
  return W;
}

function addRoad(W, R, road) {
  W.roads.push(road);
  R.paintPolyline(road.pts, road.width / 2 + road.sidewalk, F.WALK);
  R.paintPolyline(road.pts, road.width / 2, F.ROAD);
}

function generateProcedural(W, R, rng) {
  // Vias principais
  for (const r of D.ROADS) addRoad(W, R, makeRoad(r.name, r.type, projectPts(r.pts)));
  const hoods = W.neighborhoods;

  // dono de cada ponto = bairro mais próximo (cache em grade grossa)
  const OG = 15, ow = Math.ceil((R.maxX - R.minX) / OG), oh = Math.ceil((R.maxZ - R.minZ) / OG);
  const owner = new Int8Array(ow * oh);
  for (let j = 0; j < oh; j++) for (let i = 0; i < ow; i++) {
    const x = R.minX + (i + 0.5) * OG, z = R.minZ + (j + 0.5) * OG;
    let b = 0, bd = Infinity;
    hoods.forEach((n, k) => { const dd = (n.x - x) ** 2 + (n.z - z) ** 2; if (dd < bd) { bd = dd; b = k; } });
    owner[j * ow + i] = b;
  }
  const ownerAt = (x, z) => {
    const i = Math.floor((x - R.minX) / OG), j = Math.floor((z - R.minZ) / OG);
    if (i < 0 || j < 0 || i >= ow || j >= oh) return -1;
    return owner[j * ow + i];
  };
  const streetOK = (x, z, k) => {
    const f = R.get(x, z);
    return ownerAt(x, z) === k && (f & F.INSIDE) && !(f & (F.WATER | F.AREA));
  };

  const streetNames = ['Rua Tiradentes', 'Rua Ipiranga', 'Rua Domingos Martins', 'Rua XV de Janeiro', 'Rua Frei Orlando',
    'Rua Muck', 'Rua Caçapava', 'Rua Boqueirão', 'Rua Dr. Barcelos', 'Rua Lavras', 'Rua Cândido Machado', 'Rua Pernambuco',
    'Rua Bahia', 'Rua Paraná', 'Rua Santa Maria', 'Rua Pelotas', 'Rua Gramado', 'Rua Bento Gonçalves', 'Rua Farroupilha',
    'Rua Chimarrão', 'Rua da Erva-Mate', 'Rua Quaraí', 'Rua Ijuí', 'Rua Uruguai', 'Rua Rio Pardo', 'Rua Itaqui', 'Rua Alegrete',
    'Rua Jaguarão', 'Rua São Borja', 'Rua Livramento', 'Rua Bagé', 'Rua Erechim', 'Rua Torres', 'Rua Osório', 'Rua Tramandaí'];

  W.blocks = [];
  hoods.forEach((n, k) => {
    // bbox do bairro
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let j = 0; j < oh; j++) for (let i = 0; i < ow; i++) if (owner[j * ow + i] === k) {
      const x = R.minX + i * OG, z = R.minZ + j * OG;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x + OG); z0 = Math.min(z0, z); z1 = Math.max(z1, z + OG);
    }
    const c = Math.cos(n.ang), s = Math.sin(n.ang), S = n.s;
    const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => [(x - n.x) * c + (z - n.z) * s, -(x - n.x) * s + (z - n.z) * c]);
    const u0 = Math.min(...corners.map((p) => p[0])), u1 = Math.max(...corners.map((p) => p[0]));
    const v0 = Math.min(...corners.map((p) => p[1])), v1 = Math.max(...corners.map((p) => p[1]));
    const toW = (u, v) => ({ x: n.x + u * c - v * s, z: n.z + u * s + v * c });
    n.toW = toW;
    const step = 3;
    const genLines = (alongU) => {
      const a0 = alongU ? v0 : u0, a1 = alongU ? v1 : u1, b0 = alongU ? u0 : v0, b1 = alongU ? u1 : v1;
      for (let q = Math.floor(a0 / S) * S; q <= a1; q += S) {
        let run = null;
        const flush = () => {
          if (run && run.b - run.a >= S * 0.6) {
            const ext = S * 0.5;
            const pa = alongU ? toW(run.a - ext, q) : toW(q, run.a - ext);
            const pb = alongU ? toW(run.b + ext, q) : toW(q, run.b + ext);
            const A = (R.get(pa.x, pa.z) & F.INSIDE) && !(R.get(pa.x, pa.z) & F.WATER) ? pa : (alongU ? toW(run.a, q) : toW(q, run.a));
            const B = (R.get(pb.x, pb.z) & F.INSIDE) && !(R.get(pb.x, pb.z) & F.WATER) ? pb : (alongU ? toW(run.b, q) : toW(q, run.b));
            const nm = streetNames[Math.floor(rng() * streetNames.length)];
            addRoad(W, R, makeRoad(nm, 'street', [A, B]));
          }
          run = null;
        };
        for (let t = b0; t <= b1; t += step) {
          const p = alongU ? toW(t, q) : toW(q, t);
          if (streetOK(p.x, p.z, k)) { if (!run) run = { a: t, b: t }; else run.b = t; } else flush();
        }
        flush();
      }
    };
    genLines(true); genLines(false);

    // Lotes e prédios
    const mask = F.ROAD | F.WALK | F.WATER | F.AREA | F.RAIL | F.BUILD;
    const dens = n.density;
    for (let bu = Math.floor(u0 / S); bu * S <= u1; bu++) {
      for (let bv = Math.floor(v0 / S); bv * S <= v1; bv++) {
        const cu = (bu + 0.5) * S, cv = (bv + 0.5) * S;
        const bc = toW(cu, cv);
        if (ownerAt(bc.x, bc.z) !== k || !(R.get(bc.x, bc.z) & F.INSIDE)) continue;
        const inner = S - ROAD_W.street - SIDEWALK * 2 - 1;
        const tall = dens > 0.8 ? 1 : 0;
        const lotW = tall ? 20 + rng() * 8 : dens > 0.45 ? 13 + rng() * 6 : 9 + rng() * 3;
        const nU = Math.max(1, Math.floor(inner / lotW));
        const rows = inner > 34 ? 2 : 1;
        const lw = inner / nU, ld = inner / rows;
        for (let a = 0; a < nU; a++) for (let b = 0; b < rows; b++) {
          // lotes do miolo só com rows=2: frente para a rua
          if (rng() < 0.06) { // terreno vazio / árvore
            const p = toW(cu - inner / 2 + (a + 0.5) * lw, cv - inner / 2 + (b + 0.5) * ld);
            if (R.rectFree(p.x, p.z, 2, 2, n.ang, mask, F.INSIDE)) W.trees.push({ x: p.x, z: p.z, s: 0.8 + rng() * 0.8 });
            continue;
          }
          let floors;
          if (tall) floors = rng() < 0.35 ? 8 + Math.floor(rng() ** 2 * 22) : 2 + Math.floor(rng() * 6);
          else if (dens > 0.45) floors = rng() < 0.12 ? 4 + Math.floor(rng() * 10) : 1 + Math.floor(rng() * 3);
          else floors = rng() < 0.03 ? 3 + Math.floor(rng() * 4) : 1 + (rng() < 0.3 ? 1 : 0);
          const h = floors * 3.2 + 0.4;
          const bw = lw * (0.72 + rng() * 0.2), bd = ld * (0.7 + rng() * 0.22);
          const p = toW(cu - inner / 2 + (a + 0.5) * lw, cv - inner / 2 + (b + 0.5) * ld);
          if (!R.rectFree(p.x, p.z, bw + 1, bd + 1, n.ang, mask, F.INSIDE)) continue;
          R.paintPolygon(rectCorners(p.x, p.z, bw, bd, n.ang), F.BUILD);
          const item = { x: p.x, z: p.z, w: bw, d: bd, h, ang: n.ang, c: rng(), floors };
          if (floors <= 2 && !tall) W.houses.push(item); else W.buildings.push(item);
        }
      }
    }
  });

  // Árvores e postes ao longo das vias principais
  for (const r of W.roads) {
    if (r.type === 'street') {
      if (rng() < 0.5) treesAlong(W, R, r, 30, rng);
      continue;
    }
    treesAlong(W, R, r, 22, rng);
    for (let d = 10; d < r.len; d += 38) {
      for (const side of [-1, 1]) {
        const p = pointAlong(r, d + (side > 0 ? 19 : 0), side * (r.width / 2 + (r.sidewalk ? 0.8 : 1.5)));
        const f = R.get(p.x, p.z);
        if (!(f & (F.BUILD | F.WATER)) && !(f & F.ROAD)) W.lamps.push({ x: p.x, z: p.z, dx: -side * p.dz, dz: side * p.dx });
      }
    }
  }

  // Vegetação: parques, várzea fora da cidade
  for (const a of W.areas) {
    if (a.kind === 'park' || a.kind === 'wetland') {
      const n = Math.floor((a.w * a.d) / (a.kind === 'park' ? 260 : 120));
      for (let i = 0; i < n; i++) {
        const u = (rng() - 0.5) * a.w, v = (rng() - 0.5) * a.d;
        const x = a.x + u * Math.cos(a.ang) - v * Math.sin(a.ang), z = a.z + u * Math.sin(a.ang) + v * Math.cos(a.ang);
        if (a.kind === 'park' && Math.abs(u) < 4) continue; // caminho
        if (!(R.get(x, z) & (F.ROAD | F.WATER))) W.trees.push({ x, z, s: 0.9 + rng() * 1.1 });
      }
    }
  }
  for (let i = 0; i < 9000; i++) {
    const x = R.minX + rng() * (R.maxX - R.minX), z = R.minZ + rng() * (R.maxZ - R.minZ);
    const f = R.get(x, z);
    if (f & (F.INSIDE | F.WATER | F.ROAD | F.WALK)) continue;
    // aglomerados
    const k = 1 + Math.floor(rng() * 5);
    for (let j = 0; j < k; j++) {
      const xx = x + (rng() - 0.5) * 30, zz = z + (rng() - 0.5) * 30;
      if (!(R.get(xx, zz) & (F.INSIDE | F.WATER | F.ROAD | F.WALK))) W.trees.push({ x: xx, z: zz, s: 0.9 + rng() * 1.3 });
    }
  }
}

function treesAlong(W, R, r, spacing, rng) {
  if (!r.sidewalk) return;
  for (let d = spacing / 2; d < r.len; d += spacing) {
    for (const side of [-1, 1]) {
      const p = pointAlong(r, d + rng() * 4, side * (r.width / 2 + r.sidewalk * 0.55));
      const f = R.get(p.x, p.z);
      if ((f & F.WALK) && !(f & (F.ROAD | F.BUILD | F.WATER | F.RAIL))) W.trees.push({ x: p.x, z: p.z, s: 0.6 + rng() * 0.5 });
    }
  }
}

// ----- Modo OpenStreetMap (dados reais) -----
const OSM_TYPE = {
  motorway: 'highway', trunk: 'highway', motorway_link: 'secondary', trunk_link: 'secondary',
  primary: 'primary', primary_link: 'tertiary', secondary: 'secondary', secondary_link: 'tertiary',
  tertiary: 'tertiary', tertiary_link: 'street', residential: 'street', unclassified: 'street',
  living_street: 'street', service: 'service', road: 'street',
};

function loadOSM(W, osm, R, rng) {
  W.osmBuildings = [];
  for (const w of osm.water || []) {
    const poly = projectPts(w.p);
    if (poly.length > 2) { W.waterPolys.push(poly); R.paintPolygon(poly, F.WATER); }
  }
  for (const w of osm.waterways || []) {
    const pts = projectPts(w.p);
    const width = meters(w.t === 'river' ? 60 : w.t === 'canal' ? 15 : 6);
    W.rivers.push({ name: w.n || '', width, pts });
    R.paintPolyline(pts, width / 2, F.WATER);
  }
  for (const p of osm.parks || []) {
    const poly = projectPts(p.p);
    if (poly.length > 2) W.areas.push({ kind: 'osmpark', name: p.n || '', poly });
  }
  for (const r of osm.roads || []) {
    const t = OSM_TYPE[r.t]; if (!t) continue;
    const pts = projectPts(r.p); if (pts.length < 2) continue;
    addRoad(W, R, makeRoad(r.n || nameFor(t), t, pts));
  }
  for (const b of osm.buildings || []) {
    const poly = projectPts(b.p);
    if (poly.length < 3) continue;
    const levels = b.l || (b.h ? b.h / 3 : 1 + (rng() < 0.3 ? 1 : 0));
    const h = b.h ? meters(b.h) * 1.2 : levels * 3.2 + 0.4;
    R.paintPolygon(poly, F.BUILD);
    W.osmBuildings.push({ poly, h, c: rng() });
  }
  for (const r of W.roads) if (r.type !== 'street' && r.type !== 'service') {
    treesAlong(W, R, r, 26, rng);
    for (let d = 10; d < r.len; d += 40) {
      const p = pointAlong(r, d, r.width / 2 + 1);
      if (!(R.get(p.x, p.z) & (F.BUILD | F.ROAD | F.WATER))) W.lamps.push({ x: p.x, z: p.z, dx: -p.dz, dz: p.dx });
    }
  }
  for (const a of W.areas) {
    let minx = Infinity, maxx = -Infinity, minz = Infinity, maxz = -Infinity;
    for (const p of a.poly) { minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); minz = Math.min(minz, p.z); maxz = Math.max(maxz, p.z); }
    const n = Math.min(400, ((maxx - minx) * (maxz - minz)) / 300);
    for (let i = 0; i < n; i++) {
      const x = minx + rng() * (maxx - minx), z = minz + rng() * (maxz - minz);
      if (pointInPoly(x, z, a.poly) && !(R.get(x, z) & (F.ROAD | F.BUILD | F.WATER))) W.trees.push({ x, z, s: 0.9 + rng() });
    }
  }
}
function nameFor(t) { return t === 'service' ? 'Acesso' : t === 'highway' ? 'Rodovia' : 'Rua sem nome'; }
