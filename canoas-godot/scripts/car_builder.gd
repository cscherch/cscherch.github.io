class_name CarBuilder
## Modelos de carros brasileiros (nomes paródia), montados a partir do perfil lateral real.
## Perfil: pontos (x para frente, y para cima) em metros, sentido horário a partir da traseira inferior.

const MODELS := {
	"fusca": {
		"name": "Fuskinha 1300", "L": 4.08, "W": 1.54, "mass": 820, "power": 3200.0, "top": 125.0,
		"wheel_r": 0.31, "wx": [1.20, -1.20], "track": 0.66, "belt": 0.92, "roof_w": 0.74,
		"profile": [[-2.04, 0.38], [-2.05, 0.62], [-1.95, 0.82], [-1.65, 1.05], [-1.15, 1.32], [-0.55, 1.48], [0.15, 1.5],
			[0.6, 1.42], [0.95, 1.08], [1.55, 0.98], [1.95, 0.78], [2.04, 0.55], [2.0, 0.38]],
		"glass": [[3, 4], [7, 8]],
		"windows": [[[-1.4, 0.96], [-0.65, 0.98], [-0.5, 1.36], [-1.05, 1.28]], [[-0.45, 0.98], [0.78, 1.0], [0.55, 1.36], [-0.4, 1.4]]],
		"colors": [Color(0.55, 0.72, 0.85), Color(0.85, 0.78, 0.6), Color(0.7, 0.12, 0.1), Color(0.93, 0.93, 0.9), Color(0.2, 0.35, 0.22)],
	},
	"gol": {
		"name": "Gol Quadrado", "L": 3.81, "W": 1.6, "mass": 860, "power": 3600.0, "top": 160.0,
		"wheel_r": 0.29, "wx": [1.18, -1.18], "track": 0.68, "belt": 0.9, "roof_w": 0.8,
		"profile": [[-1.9, 0.36], [-1.92, 0.85], [-1.82, 1.3], [-1.45, 1.36], [0.25, 1.36], [0.92, 0.96], [1.82, 0.88], [1.9, 0.72], [1.9, 0.36]],
		"glass": [[1, 2], [4, 5]],
		"windows": [[[-1.6, 0.94], [-0.45, 0.94], [-0.45, 1.3], [-1.55, 1.3]], [[-0.38, 0.94], [0.82, 0.96], [0.25, 1.3], [-0.38, 1.3]]],
		"colors": [Color(0.75, 0.75, 0.76), Color(0.75, 0.1, 0.1), Color(0.95, 0.95, 0.93), Color(0.1, 0.18, 0.4), Color(0.12, 0.12, 0.12)],
	},
	"uno": {
		"name": "Unu Mile", "L": 3.69, "W": 1.55, "mass": 800, "power": 3300.0, "top": 150.0,
		"wheel_r": 0.28, "wx": [1.15, -1.15], "track": 0.66, "belt": 0.92, "roof_w": 0.84,
		"profile": [[-1.84, 0.36], [-1.85, 0.9], [-1.78, 1.42], [-1.5, 1.45], [0.35, 1.44], [0.95, 0.98], [1.78, 0.88], [1.85, 0.66], [1.84, 0.36]],
		"glass": [[1, 2], [4, 5]],
		"windows": [[[-1.62, 0.96], [-0.35, 0.96], [-0.35, 1.38], [-1.6, 1.38]], [[-0.28, 0.96], [0.86, 0.98], [0.33, 1.38], [-0.28, 1.38]]],
		"colors": [Color(0.95, 0.95, 0.93), Color(0.8, 0.12, 0.1), Color(0.12, 0.3, 0.6), Color(0.55, 0.55, 0.57), Color(0.9, 0.75, 0.15)],
	},
	"opala": {
		"name": "Opalão Diplomata", "L": 4.8, "W": 1.76, "mass": 1250, "power": 5200.0, "top": 185.0,
		"wheel_r": 0.33, "wx": [1.45, -1.25], "track": 0.74, "belt": 0.92, "roof_w": 0.84,
		"profile": [[-2.4, 0.38], [-2.42, 0.86], [-2.0, 0.92], [-1.35, 0.98], [-0.85, 1.36], [0.4, 1.38], [0.95, 0.98], [2.3, 0.9], [2.4, 0.7], [2.38, 0.38]],
		"glass": [[3, 4], [5, 6]],
		"windows": [[[-1.2, 1.0], [-0.12, 1.0], [-0.12, 1.32], [-0.85, 1.32]], [[-0.05, 1.0], [0.85, 1.0], [0.4, 1.32], [-0.05, 1.32]]],
		"colors": [Color(0.1, 0.1, 0.1), Color(0.35, 0.05, 0.06), Color(0.85, 0.8, 0.65), Color(0.15, 0.3, 0.2), Color(0.6, 0.6, 0.62)],
	},
	"kombi": {
		"name": "Kombão", "L": 4.5, "W": 1.72, "mass": 1200, "power": 3000.0, "top": 115.0,
		"wheel_r": 0.33, "wx": [1.2, -1.2], "track": 0.72, "belt": 1.2, "roof_w": 0.94,
		"profile": [[-2.25, 0.4], [-2.27, 1.2], [-2.2, 1.85], [-1.9, 1.95], [1.9, 1.95], [2.22, 1.75], [2.27, 1.2], [2.25, 0.4]],
		"glass": [[5, 6]],
		"windows": [[[-2.0, 1.25], [-1.0, 1.25], [-1.0, 1.75], [-2.0, 1.75]], [[-0.9, 1.25], [0.3, 1.25], [0.3, 1.75], [-0.9, 1.75]], [[0.4, 1.25], [1.95, 1.25], [1.95, 1.75], [0.4, 1.75]]],
		"two_tone": true,
		"colors": [Color(0.15, 0.45, 0.7), Color(0.75, 0.15, 0.1), Color(0.3, 0.55, 0.35), Color(0.95, 0.75, 0.2)],
	},
	"onix": {
		"name": "Onyks Turbo", "L": 4.16, "W": 1.73, "mass": 1050, "power": 4300.0, "top": 190.0,
		"wheel_r": 0.32, "wx": [1.3, -1.25], "track": 0.74, "belt": 0.98, "roof_w": 0.8,
		"profile": [[-2.05, 0.4], [-2.08, 0.82], [-1.98, 1.12], [-1.7, 1.44], [-0.4, 1.5], [0.55, 1.38], [1.15, 1.0], [1.95, 0.86], [2.08, 0.6], [2.05, 0.4]],
		"glass": [[2, 3], [5, 6]],
		"windows": [[[-1.6, 1.04], [-0.35, 1.02], [-0.35, 1.42], [-1.45, 1.42]], [[-0.28, 1.02], [1.0, 1.02], [0.5, 1.36], [-0.28, 1.44]]],
		"colors": [Color(0.95, 0.95, 0.95), Color(0.2, 0.2, 0.22), Color(0.6, 0.62, 0.65), Color(0.65, 0.05, 0.08), Color(0.08, 0.2, 0.45)],
	},
	"strada": {
		"name": "Estradeira CS", "L": 4.47, "W": 1.73, "mass": 1100, "power": 4000.0, "top": 165.0,
		"wheel_r": 0.34, "wx": [1.4, -1.35], "track": 0.74, "belt": 1.02, "roof_w": 0.84,
		"profile": [[-2.23, 0.42], [-2.25, 1.02], [-0.55, 1.02], [-0.5, 1.58], [0.35, 1.6], [0.95, 1.1], [2.15, 0.98], [2.25, 0.7], [2.22, 0.42]],
		"glass": [[2, 3], [4, 5]],
		"windows": [[[-0.42, 1.08], [0.85, 1.08], [0.35, 1.52], [-0.42, 1.52]]],
		"bed": true,
		"colors": [Color(0.95, 0.95, 0.95), Color(0.75, 0.1, 0.1), Color(0.3, 0.3, 0.32), Color(0.4, 0.3, 0.2)],
	},
	"taxi": {
		"name": "Táxi Canoas", "L": 4.4, "W": 1.7, "mass": 1080, "power": 4000.0, "top": 170.0,
		"wheel_r": 0.31, "wx": [1.32, -1.28], "track": 0.72, "belt": 0.98, "roof_w": 0.82,
		"profile": [[-2.2, 0.4], [-2.22, 0.9], [-1.65, 1.02], [-1.1, 1.44], [0.35, 1.46], [0.95, 1.02], [2.1, 0.9], [2.2, 0.66], [2.18, 0.4]],
		"glass": [[2, 3], [4, 5]],
		"windows": [[[-1.05, 1.04], [-0.1, 1.04], [-0.1, 1.4], [-0.95, 1.4]], [[-0.02, 1.04], [0.85, 1.04], [0.35, 1.4], [-0.02, 1.4]]],
		"taxi": true,
		"colors": [Color(0.95, 0.95, 0.94)],
	},
	"police": {
		"name": "Viatura BM", "L": 4.6, "W": 1.82, "mass": 1350, "power": 5600.0, "top": 200.0,
		"wheel_r": 0.35, "wx": [1.4, -1.35], "track": 0.78, "belt": 1.05, "roof_w": 0.86,
		"profile": [[-2.3, 0.45], [-2.32, 1.05], [-2.2, 1.68], [-1.9, 1.75], [0.35, 1.76], [1.0, 1.15], [2.2, 1.02], [2.32, 0.75], [2.3, 0.45]],
		"glass": [[1, 2], [4, 5]],
		"windows": [[[-2.0, 1.1], [-0.9, 1.1], [-0.9, 1.68], [-1.95, 1.68]], [[-0.8, 1.1], [0.1, 1.1], [0.1, 1.68], [-0.8, 1.68]], [[0.2, 1.1], [0.9, 1.12], [0.35, 1.68], [0.2, 1.68]]],
		"police": true,
		"colors": [Color(0.96, 0.96, 0.96)],
	},
	"bus": {
		"name": "Ônibus Canoense", "L": 11.5, "W": 2.5, "mass": 9000, "power": 22000.0, "top": 95.0,
		"wheel_r": 0.5, "wx": [3.6, -2.6], "track": 1.05, "belt": 1.45, "roof_w": 0.98,
		"profile": [[-5.75, 0.45], [-5.78, 3.0], [-5.6, 3.15], [5.5, 3.15], [5.75, 2.95], [5.78, 1.45], [5.78, 0.45]],
		"glass": [[4, 5]],
		"windows": [[[-5.3, 1.6], [5.2, 1.6], [5.2, 2.75], [-5.3, 2.75]]],
		"colors": [Color(0.1, 0.45, 0.75), Color(0.95, 0.6, 0.1), Color(0.2, 0.55, 0.3)],
	},
}

static var _glass: StandardMaterial3D
static var _dark: StandardMaterial3D
static var _chrome: StandardMaterial3D
static var head_mat: StandardMaterial3D
static var tail_mat: StandardMaterial3D


static func mats() -> void:
	if _glass:
		return
	_glass = StandardMaterial3D.new()
	_glass.albedo_color = Color(0.06, 0.08, 0.1)
	_glass.metallic = 0.4
	_glass.roughness = 0.04
	_glass.cull_mode = BaseMaterial3D.CULL_DISABLED
	_dark = StandardMaterial3D.new()
	_dark.albedo_color = Color(0.06, 0.06, 0.06)
	_dark.roughness = 0.7
	_chrome = StandardMaterial3D.new()
	_chrome.albedo_color = Color(0.8, 0.8, 0.82)
	_chrome.metallic = 1.0
	_chrome.roughness = 0.2
	head_mat = StandardMaterial3D.new()
	head_mat.albedo_color = Color(1, 0.98, 0.9)
	head_mat.emission_enabled = true
	head_mat.emission = Color(1, 0.95, 0.85)
	head_mat.emission_energy_multiplier = 1.0
	tail_mat = StandardMaterial3D.new()
	tail_mat.albedo_color = Color(0.6, 0.02, 0.02)
	tail_mat.emission_enabled = true
	tail_mat.emission = Color(1, 0.05, 0.03)
	tail_mat.emission_energy_multiplier = 0.6


static func paint(c: Color) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.metallic = 0.55
	m.roughness = 0.22
	m.clearcoat_enabled = true
	m.clearcoat = 0.8
	m.clearcoat_roughness = 0.08
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	return m


static func half_w(spec: Dictionary, y: float) -> float:
	var W: float = spec.W / 2.0
	var belt: float = spec.belt
	if y <= belt:
		return W
	var top := 0.0
	for p in spec.profile:
		top = max(top, p[1])
	var t := clampf((y - belt) / max(top - belt, 0.01), 0.0, 1.0)
	return W * lerpf(0.97, spec.roof_w, t)


## Retorna um Node3D com a carroceria (sem rodas). Frente do carro = -Z (padrão Godot).
static func build_body(model: String, color: Color) -> Node3D:
	mats()
	var spec: Dictionary = MODELS[model]
	var root := Node3D.new()
	var body_mat := paint(color)
	var prof: Array = spec.profile
	var n := prof.size()
	var glass_seg := {}
	for g in spec.glass:
		glass_seg[g[0]] = true
	var st_body := SurfaceTool.new()
	st_body.begin(Mesh.PRIMITIVE_TRIANGLES)
	var st_glass := SurfaceTool.new()
	st_glass.begin(Mesh.PRIMITIVE_TRIANGLES)
	# converte (x frente, y) -> Vector3 com frente em -Z
	var P := func(x: float, y: float, side: float) -> Vector3:
		return Vector3(side * half_w(spec, y), y, -x)
	# faixa superior (contorno) entre os lados
	for i in n:
		var a: Array = prof[i]
		var b: Array = prof[(i + 1) % n]
		if i == n - 1 and a[1] < 0.5 and b[1] < 0.5:
			continue
		var st: SurfaceTool = st_glass if glass_seg.has(i) else st_body
		var al: Vector3 = P.call(a[0], a[1], -1.0)
		var ar: Vector3 = P.call(a[0], a[1], 1.0)
		var bl: Vector3 = P.call(b[0], b[1], -1.0)
		var br: Vector3 = P.call(b[0], b[1], 1.0)
		for v in [al, bl, br, al, br, ar]:
			st.add_vertex(v)
	# laterais
	var poly := PackedVector2Array()
	for p in prof:
		poly.append(Vector2(p[0], p[1]))
	var tri := Geometry2D.triangulate_polygon(poly)
	for side in [-1.0, 1.0]:
		for t in range(0, tri.size(), 3):
			var ids := [tri[t], tri[t + 1], tri[t + 2]]
			if side < 0:
				ids.reverse()
			for id in ids:
				st_body.add_vertex(P.call(prof[id][0], prof[id][1], side))
	# fundo
	var lo := 0.4
	st_body.add_vertex(Vector3(-spec.W / 2, lo, spec.L / 2)); st_body.add_vertex(Vector3(spec.W / 2, lo, -spec.L / 2)); st_body.add_vertex(Vector3(-spec.W / 2, lo, -spec.L / 2))
	st_body.add_vertex(Vector3(-spec.W / 2, lo, spec.L / 2)); st_body.add_vertex(Vector3(spec.W / 2, lo, spec.L / 2)); st_body.add_vertex(Vector3(spec.W / 2, lo, -spec.L / 2))
	_outward(st_body, Vector3(0, 0.9, 0))
	_outward(st_glass, Vector3(0, 0.9, 0))
	var mi := MeshInstance3D.new()
	mi.mesh = st_body.commit()
	mi.material_override = body_mat
	root.add_child(mi)
	var mg := MeshInstance3D.new()
	mg.mesh = st_glass.commit()
	mg.material_override = _glass
	root.add_child(mg)
	if spec.get("two_tone", false):
		var top := MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = Vector3(spec.W * 0.985, 0.62, spec.L * 0.93)
		top.mesh = bm
		top.position = Vector3(0, 1.58, 0)
		top.material_override = paint(Color(0.95, 0.95, 0.93))
		root.add_child(top)
	# janelas laterais
	for side in [-1.0, 1.0]:
		for w in spec.windows:
			var wp := PackedVector2Array()
			for p in w:
				wp.append(Vector2(p[0], p[1]))
			var wt := Geometry2D.triangulate_polygon(wp)
			var st := SurfaceTool.new()
			st.begin(Mesh.PRIMITIVE_TRIANGLES)
			for t in range(0, wt.size(), 3):
				var ids := [wt[t], wt[t + 1], wt[t + 2]]
				if side < 0:
					ids.reverse()
				for id in ids:
					var v: Vector3 = P.call(w[id][0], w[id][1], side)
					v.x += side * 0.012
					st.set_normal(Vector3(side, 0, 0))
					st.add_vertex(v)
			var wm := MeshInstance3D.new()
			wm.mesh = st.commit()
			wm.material_override = _glass
			root.add_child(wm)
	var L: float = spec.L
	var W: float = spec.W
	# para-choques, faróis, lanternas, placa
	_box(root, Vector3(W * 1.0, 0.16, 0.12), Vector3(0, 0.48, -L / 2 - 0.03), _dark)
	_box(root, Vector3(W * 1.0, 0.16, 0.12), Vector3(0, 0.48, L / 2 + 0.03), _dark)
	var front_y := 0.72 if model != "bus" else 0.9
	for s in [-1.0, 1.0]:
		var hl := _box(root, Vector3(0.32, 0.14, 0.04), Vector3(s * (W / 2 - 0.28), front_y, -L / 2 - 0.005), head_mat)
		var tl := _box(root, Vector3(0.26, 0.16, 0.04), Vector3(s * (W / 2 - 0.22), front_y + 0.06, L / 2 + 0.005), tail_mat)
		# retrovisores
		if model != "bus":
			_box(root, Vector3(0.18, 0.1, 0.08), Vector3(s * (W / 2 + 0.07), spec.belt + 0.08, -L * 0.12), body_mat)
	_plate(root, Vector3(0, 0.62, L / 2 + 0.04), 0.0)
	_plate(root, Vector3(0, 0.5, -L / 2 - 0.1), PI)
	if spec.get("taxi", false):
		var sign := _box(root, Vector3(0.6, 0.18, 0.28), Vector3(0, 1.56, -0.2), head_mat)
		_box(root, Vector3(W * 1.005, 0.12, L * 0.6), Vector3(0, 0.82, 0), paint(Color(0.9, 0.12, 0.1)))
	if spec.get("police", false):
		_box(root, Vector3(W * 1.005, 0.22, L * 0.7), Vector3(0, 0.85, 0), paint(Color(0.12, 0.25, 0.55)))
		var bar := Node3D.new()
		bar.name = "Siren"
		root.add_child(bar)
		var rm := StandardMaterial3D.new(); rm.emission_enabled = true; rm.emission = Color(1, 0.1, 0.1); rm.emission_energy_multiplier = 3.0; rm.albedo_color = Color(1, 0.2, 0.2)
		var bmm := StandardMaterial3D.new(); bmm.emission_enabled = true; bmm.emission = Color(0.1, 0.3, 1); bmm.emission_energy_multiplier = 3.0; bmm.albedo_color = Color(0.2, 0.3, 1)
		_box(bar, Vector3(0.5, 0.14, 0.25), Vector3(-0.3, 1.83, -0.3), rm)
		_box(bar, Vector3(0.5, 0.14, 0.25), Vector3(0.3, 1.83, -0.3), bmm)
		var lbl := Label3D.new()
		lbl.text = "BRIGADA MILITAR"
		lbl.font_size = 40
		lbl.pixel_size = 0.004
		lbl.modulate = Color(0.1, 0.2, 0.5)
		lbl.position = Vector3(W / 2 + 0.02, 1.2, 0)
		lbl.rotation.y = PI / 2
		root.add_child(lbl)
	if spec.get("bed", false):
		_box(root, Vector3(W * 0.94, 0.05, L * 0.36), Vector3(0, 0.98, L * 0.3), _dark)
	if model == "bus":
		var lbl := Label3D.new()
		lbl.text = "CANOAS - CENTRO"
		lbl.font_size = 64
		lbl.pixel_size = 0.006
		lbl.modulate = Color(1, 0.75, 0.1)
		lbl.position = Vector3(0, 2.95, -L / 2 - 0.05)
		lbl.rotation.y = PI
		root.add_child(lbl)
	for c in root.get_children():
		if c is GeometryInstance3D:
			c.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	return root


## refaz a malha com normais planas apontando para fora do centro do carro
static func _outward(st: SurfaceTool, center: Vector3) -> void:
	var arr := st.commit_to_arrays()
	var v: PackedVector3Array = arr[Mesh.ARRAY_VERTEX]
	st.clear()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in range(0, v.size() - 2, 3):
		var a := v[i]
		var b := v[i + 1]
		var c := v[i + 2]
		var n := (b - a).cross(c - a)
		if n.length() < 1e-8:
			continue
		n = n.normalized()
		var cen := (a + b + c) / 3.0
		var out := cen - center
		out.y *= 0.6
		if n.dot(out) < 0.0:
			n = -n
			var tmp := b
			b = c
			c = tmp
		# Godot: face frontal em sentido horário
		if (b - a).cross(c - a).dot(n) > 0.0:
			var tmp2 := b
			b = c
			c = tmp2
		for q in [a, b, c]:
			st.set_normal(n)
			st.add_vertex(q)


static func _box(parent: Node3D, size: Vector3, pos: Vector3, m: Material) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var b := BoxMesh.new()
	b.size = size
	mi.mesh = b
	mi.position = pos
	mi.material_override = m
	parent.add_child(mi)
	return mi


static func random_plate() -> String:
	var L := "ABCDEFGHJKLMNOPQRSTUVWXYZ"
	return "I%s%s%d%s%d%d" % [L[randi() % 25], L[randi() % 25], randi() % 10, L[randi() % 25], randi() % 10, randi() % 10]


static func _plate(parent: Node3D, pos: Vector3, rot: float) -> void:
	var p := Node3D.new()
	p.position = pos
	p.rotation.y = rot
	parent.add_child(p)
	var bg := StandardMaterial3D.new()
	bg.albedo_color = Color(0.95, 0.95, 0.95)
	_box(p, Vector3(0.4, 0.13, 0.01), Vector3.ZERO, bg)
	var band := StandardMaterial3D.new()
	band.albedo_color = Color(0.0, 0.2, 0.6)
	_box(p, Vector3(0.4, 0.03, 0.012), Vector3(0, 0.05, 0), band)
	var lbl := Label3D.new()
	lbl.text = random_plate()
	lbl.font_size = 48
	lbl.pixel_size = 0.0014
	lbl.modulate = Color(0.05, 0.05, 0.05)
	lbl.outline_size = 0
	lbl.position = Vector3(0, -0.012, 0.008)
	p.add_child(lbl)


static func wheel_mesh(r: float, width: float) -> Node3D:
	mats()
	var n := Node3D.new()
	var tire := MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = r
	cm.bottom_radius = r
	cm.height = width
	cm.radial_segments = 20
	tire.mesh = cm
	tire.rotation.z = PI / 2
	tire.material_override = _dark
	n.add_child(tire)
	var rim := MeshInstance3D.new()
	var rmesh := CylinderMesh.new()
	rmesh.top_radius = r * 0.62
	rmesh.bottom_radius = r * 0.62
	rmesh.height = width + 0.02
	rmesh.radial_segments = 10
	rim.mesh = rmesh
	rim.rotation.z = PI / 2
	rim.material_override = _chrome
	n.add_child(rim)
	return n
