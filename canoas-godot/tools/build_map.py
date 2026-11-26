#!/usr/bin/env python3
"""Converte os dados reais de Canoas/RS (Overture Maps / OpenStreetMap) em blocos
binários que o jogo Godot carrega por streaming.

Entrada: pasta com os GeoJSON baixados por `overturemaps download`
  (building, segment, water, land_use, land_cover, place, infrastructure, division_area)
Saída:   canoas-godot/map/meta.json, map/graph.json, map/minimap.png, map/chunks/*.bin

Uso:
  pip install overturemaps shapely mapbox_earcut zstandard pillow numpy
  BBOX=-51.255,-29.985,-51.070,-29.845
  for t in buildings segment water land_use land_cover place infrastructure division_area; do
    overturemaps download --bbox=$BBOX -f geojson --type=${t%s} -o dados/$t.geojson; done
  python3 tools/build_map.py dados map

Dados © OpenStreetMap contributors, Overture Maps Foundation (ODbL / CDLA).
"""
import json, math, os, struct, sys, zlib
from collections import defaultdict
import numpy as np
import mapbox_earcut as earcut
import zstandard
from shapely.geometry import shape, Polygon, MultiPolygon, LineString, Point, box
from shapely.strtree import STRtree
from shapely.ops import unary_union
from PIL import Image, ImageDraw

SRC, OUT = sys.argv[1], sys.argv[2]
LAT0, LON0 = -29.915, -51.1625
KX = 111320.0 * math.cos(math.radians(LAT0))
KZ = 110574.0
CHUNK = 400.0
CENTRO = None  # preenchido depois


def P(lon, lat):
    return ((lon - LON0) * KX, -(lat - LAT0) * KZ)


def proj_coords(cs):
    return [P(c[0], c[1]) for c in cs]


def proj_geom(g):
    t = g["type"]
    if t == "Polygon":
        return Polygon(proj_coords(g["coordinates"][0]), [proj_coords(r) for r in g["coordinates"][1:]])
    if t == "MultiPolygon":
        return MultiPolygon([Polygon(proj_coords(p[0]), [proj_coords(r) for r in p[1:]]) for p in g["coordinates"]])
    if t == "LineString":
        return LineString(proj_coords(g["coordinates"]))
    if t == "MultiLineString":
        return [LineString(proj_coords(l)) for l in g["coordinates"]]
    if t == "Point":
        return Point(P(*g["coordinates"][:2]))
    return None


def load(name):
    p = os.path.join(SRC, name + ".geojson")
    if not os.path.exists(p):
        print("faltando", p)
        return []
    return json.load(open(p, encoding="utf-8"))["features"]


def nm(p):
    n = p.get("names") or {}
    return n.get("primary") or ""


def rnd(i, k=0):
    x = (i * 2654435761 + k * 40503 + 12345) & 0xFFFFFFFF
    x ^= x >> 15
    x = (x * 2246822519) & 0xFFFFFFFF
    x ^= x >> 13
    return (x & 0xFFFFFF) / float(0x1000000)


# ---------- limites e bairros ----------
print("limites…")
divs = load("division_area")
canoas = None
hoods = []
for f in divs:
    p = f["properties"]
    g = proj_geom(f["geometry"])
    if g is None:
        continue
    if p.get("subtype") == "locality" and nm(p) == "Canoas":
        canoas = g.buffer(0)
for f in divs:
    p = f["properties"]
    if p.get("subtype") in ("macrohood", "neighborhood"):
        g = proj_geom(f["geometry"]).buffer(0)
        if canoas is not None and g.representative_point().within(canoas.buffer(50)):
            hoods.append((nm(p), g))
if canoas is None:
    canoas = box(-8000, -7000, 8000, 7000)
REGION = canoas.buffer(500)
WIDE = canoas.buffer(1500)
cx_, cz_ = None, None
for n, g in hoods:
    if n == "Centro":
        c = g.representative_point(); CENTRO = (c.x, c.y)
if CENTRO is None:
    CENTRO = P(-51.1839, -29.9177)
print("bairros", len(hoods), "centro", CENTRO)

chunks = defaultdict(lambda: defaultdict(list))


def ckey(x, z):
    return (int(math.floor(x / CHUNK)), int(math.floor(z / CHUNK)))


# ---------- prédios ----------
print("prédios…")
blds = load("buildings")
bpolys = []
nb = 0
for i, f in enumerate(blds):
    p = f["properties"]
    if p.get("is_underground"):
        continue
    g = proj_geom(f["geometry"])
    polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]
    for poly in polys:
        if poly.area < 12:
            continue
        c = poly.centroid
        if not c.within(REGION):
            continue
        poly = poly.simplify(0.35, preserve_topology=True)
        if poly.is_empty or not isinstance(poly, Polygon) or poly.area < 12:
            continue
        area = poly.area
        h = p.get("height")
        fl = p.get("num_floors")
        cls = p.get("class") or ""
        dc = math.hypot(c.x - CENTRO[0], c.y - CENTRO[1])
        r = rnd(i)
        if h:
            H = float(h)
        elif fl:
            H = float(fl) * 3.1 + 0.6
        elif cls in ("house", "terrace", "detached", "residential") and area < 400:
            H = 3.2 * (1 + (r < 0.3)) + 0.5
        elif area > 2500:
            H = 7 + r * 7
        elif dc < 1400 and 180 < area < 2200 and r < 0.42:
            H = 3.1 * (5 + int(rnd(i, 1) ** 1.6 * 17)) + 1
        elif dc < 3000 and 250 < area < 1800 and r < 0.12:
            H = 3.1 * (3 + int(rnd(i, 2) * 8)) + 1
        elif area < 160:
            H = 3.2 * (1 + (r < 0.22)) + 0.4
        else:
            H = 3.2 * (1 + int(r * 2.4)) + 0.5
        bpolys.append(poly)
        chunks[ckey(c.x, c.y)]["bld"].append((poly, H, i))
        nb += 1
print("prédios no jogo:", nb)
btree = STRtree(bpolys)

# ---------- ruas ----------
print("ruas…")
WIDTH = {"motorway": 11.5, "trunk": 10, "primary": 12, "secondary": 10.5, "tertiary": 9, "residential": 7,
         "unclassified": 7, "living_street": 6, "service": 4.5, "track": 4, "unknown": 6, "pedestrian": 6}
CLASS_ID = {"motorway": 7, "trunk": 6, "primary": 5, "secondary": 4, "tertiary": 3, "residential": 2,
            "unclassified": 2, "living_street": 2, "unknown": 2, "pedestrian": 1, "service": 1, "track": 0}
segs = load("segment")
roads = []
rails = []
names = []
name_idx = {}
for f in segs:
    p = f["properties"]
    g = proj_geom(f["geometry"])
    if not isinstance(g, LineString) or g.length < 1:
        continue
    if not g.intersects(WIDE):
        continue
    if p.get("subtype") == "rail":
        rails.append((g, p.get("class")))
        continue
    cls = p.get("class")
    if cls not in WIDTH:
        continue
    oneway = 0
    for ar in p.get("access_restrictions") or []:
        w = ar.get("when") or {}
        if ar.get("access_type") == "denied" and w.get("heading") and not w.get("mode") and not w.get("using") and not ar.get("between"):
            oneway = 1 if w["heading"] == "backward" else -1
    w = WIDTH[cls]
    if oneway and cls in ("primary", "secondary", "tertiary"):
        w *= 0.72
    bridge = any((rf.get("values") or []) and "is_bridge" in rf.get("values") for rf in (p.get("road_flags") or []))
    con = p.get("connectors") or []
    a = next((c["connector_id"] for c in con if c.get("at") == 0.0), None)
    b = next((c["connector_id"] for c in con if c.get("at") == 1.0), None)
    n = nm(p)
    if n not in name_idx:
        name_idx[n] = len(names); names.append(n)
    sp = None
    for sl in p.get("speed_limits") or []:
        try:
            sp = sl["max_speed"]["value"]
        except Exception:
            pass
    roads.append(dict(g=g, cls=cls, w=w, oneway=oneway, name=name_idx[n], a=a, b=b, bridge=bridge, speed=sp))
print("ruas", len(roads), "trilhos", len(rails))


def ribbon(coords, w, y, side_off=0.0):
    """retorna lista de quads [(p0l,p0r,p1l,p1r, v0, v1)] com mitra"""
    pts = np.array(coords, dtype=np.float64)
    n = len(pts)
    if n < 2:
        return [], []
    d = np.diff(pts, axis=0)
    L = np.linalg.norm(d, axis=1)
    keep = np.concatenate([[True], L > 0.05])
    pts = pts[keep]
    n = len(pts)
    if n < 2:
        return [], []
    d = np.diff(pts, axis=0); L = np.linalg.norm(d, axis=1); d /= L[:, None]
    nrm = np.stack([-d[:, 1], d[:, 0]], 1)
    vn = np.zeros((n, 2)); vn[0] = nrm[0]; vn[-1] = nrm[-1]
    if n > 2:
        s = nrm[:-1] + nrm[1:]
        sl = np.linalg.norm(s, axis=1); sl[sl < 1e-6] = 1
        s /= sl[:, None]
        cosv = np.clip(np.sum(s * nrm[1:], 1), 0.5, 1)
        vn[1:-1] = s / cosv[:, None]
    cum = np.concatenate([[0], np.cumsum(L)])
    left = pts + vn * (side_off - w / 2)
    right = pts + vn * (side_off + w / 2)
    return (left, right, cum), pts


def add_strip(layer_list, left, right, cum, y, extra):
    layer_list.append((left, right, cum, y, extra))


for r in roads:
    g = r["g"]
    coords = list(g.coords)
    res, pts = ribbon(coords, r["w"], 0)
    if not res:
        continue
    left, right, cum = res
    cid = CLASS_ID[r["cls"]]
    y = 0.08 + cid * 0.008
    total = cum[-1]
    # quebra por bloco usando o ponto médio de cada quad
    for k in range(len(cum) - 1):
        mx, mz = (left[k][0] + right[k + 1][0]) / 2, (left[k][1] + right[k + 1][1]) / 2
        chunks[ckey(mx, mz)]["road"].append((left[k], right[k], left[k + 1], right[k + 1], cum[k], cum[k + 1], y, cid, total, r["oneway"], r["w"]))
    if cid >= 2 and r["cls"] not in ("motorway", "trunk"):
        res2, _ = ribbon(coords, r["w"] + 5.0, 0)
        if res2:
            l2, r2, c2 = res2
            for k in range(len(c2) - 1):
                mx, mz = (l2[k][0] + r2[k + 1][0]) / 2, (l2[k][1] + r2[k + 1][1]) / 2
                chunks[ckey(mx, mz)]["walk"].append((l2[k], r2[k], l2[k + 1], r2[k + 1], c2[k], c2[k + 1], 0.05))
for g, cls in rails:
    res, _ = ribbon(list(g.coords), 4.2, 0)
    if not res:
        continue
    l, rr, c = res
    for k in range(len(c) - 1):
        mx, mz = (l[k][0] + rr[k + 1][0]) / 2, (l[k][1] + rr[k + 1][1]) / 2
        chunks[ckey(mx, mz)]["rail"].append((l[k], rr[k], l[k + 1], rr[k + 1], c[k], c[k + 1], 0.07))

# ---------- água e verde ----------
print("água e áreas verdes…")
water_polys = []
for f in load("water"):
    p = f["properties"]
    g = proj_geom(f["geometry"])
    if g is None:
        continue
    if isinstance(g, (Polygon, MultiPolygon)):
        if p.get("class") == "swimming_pool":
            continue
        g = g.buffer(0).intersection(WIDE)
        if not g.is_empty:
            water_polys.append(g)
    else:
        lines = g if isinstance(g, list) else [g]
        wd = {"river": 40, "canal": 8, "stream": 4, "ditch": 2.5, "drain": 2.5}.get(p.get("subtype") if p.get("subtype") != "canal" else p.get("class"), 3)
        for ln in lines:
            if ln.intersects(WIDE):
                water_polys.append(ln.buffer(wd / 2, cap_style=2).intersection(WIDE))
water = unary_union(water_polys).simplify(0.8) if water_polys else None

green = []
GREEN_KIND = {"park": 1, "grass": 1, "pitch": 2, "recreation_ground": 1, "playground": 3, "cemetery": 4, "forest": 5,
              "shrub": 5, "wetland": 6, "crop": 7, "farmland": 7, "meadow": 1, "barren": 8, "track": 9}
for fn in ("land_use", "land_cover"):
    for f in load(fn):
        p = f["properties"]
        k = GREEN_KIND.get(p.get("class")) or GREEN_KIND.get(p.get("subtype"))
        if not k:
            continue
        g = proj_geom(f["geometry"])
        if g is None or not isinstance(g, (Polygon, MultiPolygon)):
            continue
        g = g.buffer(0).intersection(WIDE)
        if g.is_empty:
            continue
        green.append((g.simplify(1.0), k))


def tri_poly(poly):
    """triangula polígono (com furos) -> vértices Nx2, índices"""
    ext = np.array(poly.exterior.coords[:-1], dtype=np.float64)
    rings = [ext] + [np.array(h.coords[:-1], dtype=np.float64) for h in poly.interiors]
    allv = np.concatenate(rings)
    ends = np.cumsum([len(r) for r in rings]).astype(np.uint32)
    idx = earcut.triangulate_float64(allv, ends)
    return allv, idx


def clip_to_chunks(geom, layer, extra):
    minx, minz, maxx, maxz = geom.bounds
    for i in range(int(math.floor(minx / CHUNK)), int(math.floor(maxx / CHUNK)) + 1):
        for j in range(int(math.floor(minz / CHUNK)), int(math.floor(maxz / CHUNK)) + 1):
            part = geom.intersection(box(i * CHUNK, j * CHUNK, (i + 1) * CHUNK, (j + 1) * CHUNK))
            if part.is_empty:
                continue
            for pg in (part.geoms if hasattr(part, "geoms") else [part]):
                if isinstance(pg, Polygon) and pg.area > 1:
                    chunks[(i, j)][layer].append((pg, extra))


if water is not None:
    clip_to_chunks(water, "water", 0)
for g, k in green:
    clip_to_chunks(g, "green", k)

# ---------- árvores e postes ----------
print("árvores…")
trees = defaultdict(list)
lamps = defaultdict(list)
wtree = STRtree(water_polys) if water_polys else None


def free_spot(x, z, r=1.5):
    pt = Point(x, z)
    for i in btree.query(pt.buffer(r)):
        if bpolys[i].distance(pt) < r:
            return False
    return True


ti = 0
for r in roads:
    cid = CLASS_ID[r["cls"]]
    if cid < 2 or r["cls"] in ("motorway",):
        continue
    g = r["g"]
    L = g.length
    sp = 13 if cid <= 2 else 17
    d = sp / 2
    while d < L:
        a = g.interpolate(d); b = g.interpolate(min(L, d + 1))
        dx, dz = b.x - a.x, b.y - a.y; l = math.hypot(dx, dz) or 1; dx /= l; dz /= l
        for side in (-1, 1):
            ti += 1
            off = r["w"] / 2 + 1.6
            x, z = a.x - dz * off * side, a.y + dx * off * side
            if rnd(ti, 7) < (0.42 if cid <= 2 else 0.6) and free_spot(x, z, 1.2):
                trees[ckey(x, z)].append((x, z, 0.75 + rnd(ti, 3) * 0.6, int(rnd(ti, 5) * 4)))
            if cid >= 3 and int(d / sp) % 3 == 0 and side == (1 if int(d / sp) % 2 else -1):
                lx, lz = a.x - dz * (r["w"] / 2 + 0.6) * side, a.y + dx * (r["w"] / 2 + 0.6) * side
                if free_spot(lx, lz, 0.6):
                    lamps[ckey(lx, lz)].append((lx, lz, math.atan2(dz * side, -dx * side)))
        d += sp
for g, k in green:
    if k not in (1, 4, 5, 6):
        continue
    dens = {1: 1 / 350, 4: 1 / 500, 5: 1 / 90, 6: 1 / 220}[k]
    for pg in (g.geoms if hasattr(g, "geoms") else [g]):
        if not isinstance(pg, Polygon):
            continue
        n = min(4000, int(pg.area * dens))
        minx, minz, maxx, maxz = pg.bounds
        for _ in range(n):
            ti += 1
            x = minx + rnd(ti, 11) * (maxx - minx); z = minz + rnd(ti, 13) * (maxz - minz)
            if pg.contains(Point(x, z)) and free_spot(x, z, 1.5):
                trees[ckey(x, z)].append((x, z, 0.9 + rnd(ti, 17) * 0.9, int(rnd(ti, 19) * 4)))

# ---------- escrita dos blocos ----------
print("gerando malhas…")
os.makedirs(os.path.join(OUT, "chunks"), exist_ok=True)
zc = zstandard.ZstdCompressor(level=19)
chunk_list = []


def pack_chunk(key, L):
    ox, oz = key[0] * CHUNK, key[1] * CHUNK
    secs = {}
    blobs = []

    def add(name, arrs):
        secs[name] = {}
        for an, arr in arrs.items():
            off = sum(len(b) for b in blobs)
            b = arr.tobytes(); blobs.append(b)
            secs[name][an] = [off, len(b)]

    # prédios: paredes + telhado (planos ou de duas águas nas casas)
    if L["bld"]:
        V, U2, I = [], [], []
        for poly, H, bi in L["bld"]:
            ring = np.array(poly.exterior.coords[:-1], dtype=np.float64)
            # orientação anti-horária (vista de cima, z para baixo)
            a = 0.5 * np.sum(ring[:, 0] * np.roll(ring[:, 1], -1) - np.roll(ring[:, 0], -1) * ring[:, 1])
            if a < 0:
                ring = ring[::-1]
            n = len(ring)
            style = rnd(bi, 23)
            base = len(V)
            for (x, z) in ring:
                V.append((x - ox, 0.0, z - oz)); U2.append((style, H))
            for (x, z) in ring:
                V.append((x - ox, H, z - oz)); U2.append((style, H))
            for k in range(n):
                k2 = (k + 1) % n
                I += [base + k, base + k2, base + n + k2, base + k, base + n + k2, base + n + k]
            # telhado
            mrr = poly.minimum_rotated_rectangle
            gable = n <= 6 and H < 8 and poly.area < 260 and poly.area / max(mrr.area, 1) > 0.85
            if gable:
                rc = np.array(mrr.exterior.coords[:4])
                e1, e2 = rc[1] - rc[0], rc[2] - rc[1]
                if np.linalg.norm(e1) < np.linalg.norm(e2):
                    rc = np.roll(rc, -1, axis=0); e1, e2 = rc[1] - rc[0], rc[2] - rc[1]
                rh = min(2.6, np.linalg.norm(e2) * 0.32)
                eave = 0.45
                u1 = e1 / np.linalg.norm(e1); u2 = e2 / np.linalg.norm(e2)
                c0 = rc[0] - u1 * eave - u2 * eave; c1 = rc[1] + u1 * eave - u2 * eave
                c2 = rc[2] + u1 * eave + u2 * eave; c3 = rc[3] - u1 * eave + u2 * eave
                m0 = (rc[0] + rc[3]) / 2 - u1 * eave; m1 = (rc[1] + rc[2]) / 2 + u1 * eave
                rb = len(V)
                for (x, z), y in ((c0, H - 0.15), (c1, H - 0.15), (c2, H - 0.15), (c3, H - 0.15), (m0, H + rh), (m1, H + rh)):
                    V.append((x - ox, y, z - oz)); U2.append((style, -1.0))
                I += [rb + 0, rb + 4, rb + 5, rb + 0, rb + 5, rb + 1, rb + 3, rb + 2, rb + 5, rb + 3, rb + 5, rb + 4, rb + 0, rb + 3, rb + 4, rb + 1, rb + 5, rb + 2]
            else:
                try:
                    tri = earcut.triangulate_float64(ring, np.array([n], dtype=np.uint32))
                    for t in range(0, len(tri), 3):
                        I += [base + n + int(tri[t]), base + n + int(tri[t + 2]), base + n + int(tri[t + 1])]
                except Exception:
                    pass
        add("bld", {"v": np.array(V, np.float32), "u2": np.array(U2, np.float32), "i": np.array(I, np.int32)})

    def strips(name, items, with_extra):
        V, UV, U2, I = [], [], [], []
        for it in items:
            p0l, p0r, p1l, p1r, v0, v1, y = it[:7]
            b = len(V)
            for (x, z), u, v in ((p0l, 0, v0), (p0r, 1, v0), (p1l, 0, v1), (p1r, 1, v1)):
                V.append((x - ox, y, z - oz)); UV.append((u, v))
                U2.append((it[7], it[8]) if with_extra else (0, 0))
            I += [b, b + 2, b + 1, b + 1, b + 2, b + 3]
        if V:
            add(name, {"v": np.array(V, np.float32), "uv": np.array(UV, np.float32), "u2": np.array(U2, np.float32), "i": np.array(I, np.int32)})

    if L["road"]:
        items = [(a, b, c, d, v0, v1, y, cid + (0.5 if ow else 0) + 0.01 * min(w, 20) / 20, total) for (a, b, c, d, v0, v1, y, cid, total, ow, w) in L["road"]]
        strips("road", items, True)
    if L["walk"]:
        strips("walk", L["walk"], False)
    if L["rail"]:
        strips("rail", L["rail"], False)
    for lname in ("water", "green"):
        if not L[lname]:
            continue
        V, U2, I = [], [], []
        y = 0.03 if lname == "water" else 0.02
        for pg, k in L[lname]:
            try:
                vv, idx = tri_poly(pg)
            except Exception:
                continue
            b = len(V)
            for (x, z) in vv:
                V.append((x - ox, y, z - oz)); U2.append((k, 0))
            for t in range(0, len(idx), 3):
                I += [b + int(idx[t]), b + int(idx[t + 2]), b + int(idx[t + 1])]
        if V:
            add(lname, {"v": np.array(V, np.float32), "u2": np.array(U2, np.float32), "i": np.array(I, np.int32)})
    T = trees.get(key)
    if T:
        add("trees", {"d": np.array([(x - ox, z - oz, s, t) for x, z, s, t in T], np.float32)})
    Lm = lamps.get(key)
    if Lm:
        add("lamps", {"d": np.array([(x - ox, z - oz, a) for x, z, a in Lm], np.float32)})
    if not blobs:
        return None
    raw = b"".join(blobs)
    hdr = json.dumps({"o": [ox, oz], "s": secs, "n": len(raw)}).encode()
    comp = zc.compress(raw)
    with open(os.path.join(OUT, "chunks", f"c_{key[0]}_{key[1]}.bin"), "wb") as fh:
        fh.write(struct.pack("<II", len(hdr), len(raw)))
        fh.write(hdr)
        fh.write(comp)
    return len(comp)


keys = set(chunks.keys()) | set(trees.keys())
total = 0
for key in sorted(keys):
    sz = pack_chunk(key, chunks[key])
    if sz:
        chunk_list.append([key[0], key[1]]); total += sz
print("blocos", len(chunk_list), "MB", round(total / 1e6, 1))

# ---------- grafo de ruas (trânsito) ----------
print("grafo…")
nodes = {}
edges = []
for r in roads:
    if CLASS_ID[r["cls"]] < 2 or r["cls"] == "pedestrian":
        continue
    if not r["g"].intersects(REGION):
        continue
    def nid(c, pt):
        key = c or f"{round(pt[0])},{round(pt[1])}"
        if key not in nodes:
            nodes[key] = len(nodes)
        return nodes[key]
    cs = list(r["g"].simplify(1.0).coords)
    edges.append({"a": nid(r["a"], cs[0]), "b": nid(r["b"], cs[-1]), "c": CLASS_ID[r["cls"]], "o": r["oneway"], "w": round(r["w"], 1),
                  "n": r["name"], "s": r["speed"] or 0, "p": [round(v, 1) for c in cs for v in c]})
json.dump({"names": names, "edges": edges, "nodes": len(nodes)}, open(os.path.join(OUT, "graph.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

# ---------- POIs ----------
print("pontos de interesse…")
KEEP = {"shopping_center", "college_university", "university", "hospital", "train_station", "airport", "stadium_arena",
        "church_cathedral", "city_hall", "park", "gas_station", "supermarket", "school", "police_department",
        "fire_department", "bus_station", "public_and_government_association", "restaurant", "bar", "pharmacy", "bank",
        "fast_food_restaurant", "bakery", "pizza_restaurant", "hotel", "gym", "beauty_salon", "car_dealer", "auto_repair"}
pois = []
for f in load("place"):
    p = f["properties"]
    g = proj_geom(f["geometry"])
    if g is None or not g.within(REGION):
        continue
    cat = (p.get("categories") or {}).get("primary") or (p.get("taxonomy") or {}).get("primary") or p.get("basic_category") or ""
    n = nm(p)
    if not n or (p.get("confidence") or 0) < 0.5:
        continue
    if cat in KEEP or any(k in cat for k in ("shopping", "university", "hospital", "station", "stadium")):
        pois.append([n, cat, round(g.x, 1), round(g.y, 1)])
print("pois", len(pois))

# ---------- minimapa ----------
print("minimapa…")
MPX = 4.0
mx0, mz0, mx1, mz1 = WIDE.bounds
W_, H_ = int((mx1 - mx0) / MPX), int((mz1 - mz0) / MPX)
img = Image.new("RGB", (W_, H_), (34, 40, 34))
dr = ImageDraw.Draw(img)
T = lambda x, z: ((x - mx0) / MPX, (z - mz0) / MPX)
def fillg(g, col):
    for pg in (g.geoms if hasattr(g, "geoms") else [g]):
        if isinstance(pg, Polygon):
            dr.polygon([T(x, z) for x, z in pg.exterior.coords], fill=col)
fillg(canoas, (44, 48, 56))
for g, k in green:
    fillg(g, (52, 82, 50))
if water is not None:
    fillg(water, (40, 92, 140))
for pg in bpolys:
    dr.polygon([T(x, z) for x, z in pg.exterior.coords], fill=(78, 84, 98))
for r in sorted(roads, key=lambda r: CLASS_ID[r["cls"]]):
    cid = CLASS_ID[r["cls"]]
    col = (242, 193, 78) if cid >= 6 else (235, 235, 235) if cid >= 4 else (170, 172, 180) if cid >= 2 else (120, 122, 130)
    dr.line([T(x, z) for x, z in r["g"].coords], fill=col, width=max(1, int(r["w"] / MPX + (1 if cid >= 4 else 0))))
for g, cls in rails:
    dr.line([T(x, z) for x, z in g.coords], fill=(210, 80, 80), width=2)
img.save(os.path.join(OUT, "minimap.png"), optimize=True)

meta = {
    "origin": [LAT0, LON0], "chunk": CHUNK, "chunks": chunk_list,
    "minimap": {"x0": mx0, "z0": mz0, "px": MPX, "w": W_, "h": H_},
    "boundary": [[round(x, 1), round(z, 1)] for x, z in canoas.simplify(20).exterior.coords] if isinstance(canoas, Polygon) else [],
    "hoods": [[n, [[round(x, 1), round(z, 1)] for x, z in (g.geoms[0] if hasattr(g, "geoms") else g).simplify(10).exterior.coords]] for n, g in hoods],
    "pois": pois, "centro": [round(CENTRO[0], 1), round(CENTRO[1], 1)],
    "credits": "Dados do mapa © OpenStreetMap contributors (ODbL), Overture Maps Foundation, Microsoft ML Buildings (ODbL)",
}
json.dump(meta, open(os.path.join(OUT, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("OK")
