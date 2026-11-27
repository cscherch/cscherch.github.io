#!/usr/bin/env python3
"""Baixa ruas, prédios, rios e parques reais de Canoas/RS do OpenStreetMap
(via Overpass API) e grava canoas-city/data/canoas-osm.json.

Quando esse arquivo existe, o jogo usa os dados reais no lugar da
reconstrução aproximada embutida em js/data.js.

Uso:
    python3 tools/fetch_canoas_osm.py              # tudo
    python3 tools/fetch_canoas_osm.py --no-buildings   # só ruas/rios (arquivo bem menor)

Observação: o Google Maps não permite baixar/redistribuir os dados do mapa;
o OpenStreetMap é aberto (licença ODbL) — mantenha o crédito "© OpenStreetMap".
"""
import argparse
import json
import os
import sys
import urllib.parse
import urllib.request

# sul, oeste, norte, leste — cobre o município de Canoas
BBOX = (-29.975, -51.245, -29.850, -51.080)
ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
ROAD_TYPES = "motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link|road"


def query(q):
    data = urllib.parse.urlencode({"data": q}).encode()
    last = None
    for url in ENDPOINTS:
        try:
            print(f"Consultando {url} …", file=sys.stderr)
            req = urllib.request.Request(url, data=data, headers={"User-Agent": "canoas-city-game/1.0"})
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.load(r)
        except Exception as e:  # tenta o próximo servidor
            last = e
            print(f"  falhou: {e}", file=sys.stderr)
    raise SystemExit(f"Não foi possível acessar o Overpass: {last}")


def pts(geom, nd=5):
    return [[round(g["lat"], nd), round(g["lon"], nd)] for g in geom]


def stitch(ways):
    """Junta trechos de 'outer' de uma relação em anéis fechados."""
    rings, open_ = [], [list(w) for w in ways if len(w) > 1]
    while open_:
        cur = open_.pop(0)
        changed = True
        while changed and cur[0] != cur[-1]:
            changed = False
            for i, w in enumerate(open_):
                if w[0] == cur[-1]:
                    cur += w[1:]
                elif w[-1] == cur[-1]:
                    cur += w[::-1][1:]
                elif w[-1] == cur[0]:
                    cur = w[:-1] + cur
                elif w[0] == cur[0]:
                    cur = w[::-1][:-1] + cur
                else:
                    continue
                open_.pop(i)
                changed = True
                break
        if len(cur) > 3:
            rings.append(cur)
    return rings


def height_of(tags):
    h = tags.get("height")
    lv = tags.get("building:levels")
    try:
        h = float(str(h).replace("m", "").strip()) if h else None
    except ValueError:
        h = None
    try:
        lv = float(lv) if lv else None
    except ValueError:
        lv = None
    return h, lv


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-buildings", action="store_true")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "data", "canoas-osm.json"))
    a = ap.parse_args()
    s, w, n, e = BBOX
    bb = f"({s},{w},{n},{e})"
    parts = [
        f'way["highway"~"^({ROAD_TYPES})$"]{bb};',
        f'way["natural"="water"]{bb};',
        f'relation["natural"="water"]{bb};',
        f'way["waterway"~"^(river|canal|stream)$"]{bb};',
        f'way["leisure"~"^(park|pitch|garden)$"]{bb};',
    ]
    if not a.no_buildings:
        parts.append(f'way["building"]{bb};')
    q = "[out:json][timeout:240];(" + "".join(parts) + ");out geom;"
    res = query(q)

    out = {"source": "© OpenStreetMap contributors (ODbL)", "roads": [], "buildings": [], "water": [], "waterways": [], "parks": []}
    for el in res.get("elements", []):
        t = el.get("tags", {})
        if el["type"] == "way" and "geometry" in el:
            g = pts(el["geometry"])
            if "highway" in t:
                out["roads"].append({"n": t.get("name", ""), "t": t["highway"], "p": g})
            elif "building" in t:
                h, lv = height_of(t)
                b = {"p": g}
                if h:
                    b["h"] = h
                if lv:
                    b["l"] = lv
                out["buildings"].append(b)
            elif t.get("natural") == "water":
                out["water"].append({"p": g})
            elif "waterway" in t:
                out["waterways"].append({"t": t["waterway"], "n": t.get("name", ""), "p": g})
            elif "leisure" in t:
                out["parks"].append({"n": t.get("name", ""), "p": g})
        elif el["type"] == "relation" and t.get("natural") == "water":
            outers = [pts(m["geometry"]) for m in el.get("members", []) if m.get("role") == "outer" and "geometry" in m]
            for ring in stitch(outers):
                out["water"].append({"p": ring})

    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"OK: {len(out['roads'])} vias, {len(out['buildings'])} prédios, {len(out['water'])} áreas de água -> {a.out}")


if __name__ == "__main__":
    main()
