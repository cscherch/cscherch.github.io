class_name City
extends RefCounted
## Dados globais da cidade: grafo de ruas reais (para trânsito e GPS), bairros, pontos de interesse.

var meta: Dictionary
var names: Array = []
var edges: Array = []        # cada: {a,b,c,o,w,n,s,pts:PackedVector2Array,len}
var node_edges = {}         # nó -> [índices de arestas]
var grid = {}               # "gx,gz" -> [índices]
const G := 80.0
var hoods: Array = []        # [nome, PackedVector2Array]
var pois: Array = []


func load_all() -> void:
	meta = JSON.parse_string(FileAccess.get_file_as_string("res://map/meta.json"))
	var g: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://map/graph.json"))
	names = g.names
	for e in g.edges:
		var p: Array = e.p
		var pts = PackedVector2Array()
		for i in range(0, p.size(), 2):
			pts.append(Vector2(p[i], p[i + 1]))
		var L = 0.0
		for i in range(1, pts.size()):
			L += pts[i].distance_to(pts[i - 1])
		var ei = edges.size()
		edges.append({"a": int(e.a), "b": int(e.b), "c": int(e.c), "o": int(e.o), "w": float(e.w), "n": int(e.n), "s": float(e.s), "pts": pts, "len": L})
		for k in [int(e.a), int(e.b)]:
			if not node_edges.has(k):
				node_edges[k] = []
			node_edges[k].append(ei)
		for i in range(1, pts.size()):
			var a = pts[i - 1]
			var b = pts[i]
			var steps = int(a.distance_to(b) / G) + 1
			for s in steps + 1:
				var q = a.lerp(b, float(s) / steps)
				var key = "%d,%d" % [floori(q.x / G), floori(q.y / G)]
				if not grid.has(key):
					grid[key] = []
				if grid[key].is_empty() or grid[key][-1] != ei:
					grid[key].append(ei)
	for h in meta.hoods:
		var poly = PackedVector2Array()
		for p in h[1]:
			poly.append(Vector2(p[0], p[1]))
		hoods.append([h[0], poly])
	pois = meta.pois


func hood_at(x: float, z: float) -> String:
	var p = Vector2(x, z)
	for h in hoods:
		if Geometry2D.is_point_in_polygon(p, h[1]):
			return h[0]
	return "Canoas"


func nearest_edge(x: float, z: float, maxd := 30.0) -> Dictionary:
	var gx = floori(x / G)
	var gz = floori(z / G)
	var best = -1
	var bd = maxd
	var bt = 0.0
	var p = Vector2(x, z)
	for i in range(-1, 2):
		for j in range(-1, 2):
			var key = "%d,%d" % [gx + i, gz + j]
			if not grid.has(key):
				continue
			for ei in grid[key]:
				var pts: PackedVector2Array = edges[ei].pts
				var acc = 0.0
				for k in range(1, pts.size()):
					var q = Geometry2D.get_closest_point_to_segment(p, pts[k - 1], pts[k])
					var d = q.distance_to(p) - edges[ei].w / 2.0
					if d < bd:
						bd = d
						best = ei
						bt = acc + q.distance_to(pts[k - 1])
					acc += pts[k].distance_to(pts[k - 1])
	if best < 0:
		return {}
	return {"e": best, "d": bt, "dist": bd}


func street_name(x: float, z: float) -> String:
	var r = nearest_edge(x, z, 18.0)
	if r.is_empty():
		return ""
	return names[edges[r.e].n]


## ponto e direção ao longo da aresta (offset > 0 = lado direito no sentido a->b)
func point_on(ei: int, d: float, offset := 0.0) -> Array:
	var pts: PackedVector2Array = edges[ei].pts
	d = clampf(d, 0.0, edges[ei].len)
	var acc = 0.0
	for k in range(1, pts.size()):
		var seg = pts[k].distance_to(pts[k - 1])
		if acc + seg >= d or k == pts.size() - 1:
			var t = (d - acc) / maxf(seg, 0.001)
			var dir = (pts[k] - pts[k - 1]).normalized()
			if dir.length() < 0.5:
				dir = Vector2(0, -1)
			var nrm = Vector2(-dir.y, dir.x)
			var q = pts[k - 1].lerp(pts[k], clampf(t, 0.0, 1.0)) + nrm * offset
			return [Vector3(q.x, 0, q.y), Vector3(dir.x, 0, dir.y)]
		acc += seg
	return [Vector3(pts[0].x, 0, pts[0].y), Vector3.FORWARD]


func random_edge(near: Vector3, rmin: float, rmax: float, min_class := 2) -> int:
	for t in 40:
		var a = randf() * TAU
		var r = randf_range(rmin, rmax)
		var res = nearest_edge(near.x + cos(a) * r, near.z + sin(a) * r, 60.0)
		if not res.is_empty() and edges[res.e].c >= min_class and edges[res.e].len > 30.0:
			return res.e
	return -1


func poi_named(sub: String) -> Array:
	for p in pois:
		if String(p[0]).to_lower().contains(sub.to_lower()):
			return p
	return []


func poi_exact(name: String) -> Array:
	for p in pois:
		if String(p[0]) == name:
			return p
	return []
