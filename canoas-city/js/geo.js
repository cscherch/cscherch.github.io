import { ORIGIN, SCALE } from './data.js';

const COS_LAT = Math.cos(ORIGIN.lat * Math.PI / 180);
const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LON = 111320 * COS_LAT;

// lat/lon -> coordenadas do mundo (x = leste, z = sul)
export function project(lat, lon) {
  return {
    x: (lon - ORIGIN.lon) * M_PER_DEG_LON * SCALE,
    z: -(lat - ORIGIN.lat) * M_PER_DEG_LAT * SCALE,
  };
}
export const projectPts = (pts) => pts.map(([la, lo]) => project(la, lo));
export const meters = (m) => m * SCALE;

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pointInPoly(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}

export function distSeg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const l2 = dx * dx + dz * dz;
  let t = l2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + t * dx, qz = az + t * dz;
  return Math.hypot(px - qx, pz - qz);
}

export function rectCorners(cx, cz, w, d, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const hw = w / 2, hd = d / 2;
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([u, v]) => ({ x: cx + u * c - v * s, z: cz + u * s + v * c }));
}

export function polylineLength(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
  return L;
}
