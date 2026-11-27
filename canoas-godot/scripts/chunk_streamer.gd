extends Node3D
## Carrega os blocos (400 m x 400 m) do mapa real de Canoas ao redor do jogador.
## A leitura e o parse rodam em threads; a criação das malhas acontece no thread principal.

const LOAD_R := 1000.0
const UNLOAD_R := 1350.0
const MAX_BUILDS_PER_FRAME := 2

var meta: Dictionary
var chunk_size := 400.0
var available := {}         # "i,j" -> true
var loaded := {}            # "i,j" -> Node3D
var pending := {}           # "i,j" -> task id
var ready_queue: Array = [] # [key, data]
var mutex := Mutex.new()

var mat_bld: ShaderMaterial
var mat_road: ShaderMaterial
var mat_walk: ShaderMaterial
var mat_rail: ShaderMaterial
var mat_green: ShaderMaterial
var mat_water: ShaderMaterial
var tree_mesh: Mesh
var lamp_mesh: Mesh
var lamp_head_mat: StandardMaterial3D
var focus := Vector3.ZERO


func setup(m: Dictionary, mats: Dictionary) -> void:
	meta = m
	chunk_size = float(meta.chunk)
	for c in meta.chunks:
		available["%d,%d" % [int(c[0]), int(c[1])]] = true
	mat_bld = mats.bld; mat_road = mats.road; mat_walk = mats.walk; mat_rail = mats.rail
	mat_green = mats.green; mat_water = mats.water
	tree_mesh = Props.make_tree_mesh()
	lamp_head_mat = mats.lamp_head
	lamp_mesh = Props.make_lamp_mesh(lamp_head_mat)


func chunk_key(x: float, z: float) -> Vector2i:
	return Vector2i(floori(x / chunk_size), floori(z / chunk_size))


func update_focus(p: Vector3) -> void:
	focus = p
	var c := chunk_key(p.x, p.z)
	var r := int(ceil(LOAD_R / chunk_size))
	var want: Array = []
	for i in range(c.x - r, c.x + r + 1):
		for j in range(c.y - r, c.y + r + 1):
			var k := "%d,%d" % [i, j]
			if not available.has(k) or loaded.has(k) or pending.has(k):
				continue
			var center := Vector3((i + 0.5) * chunk_size, 0, (j + 0.5) * chunk_size)
			var d := center.distance_to(Vector3(p.x, 0, p.z))
			if d < LOAD_R:
				want.append([d, k, i, j])
	want.sort_custom(func(a, b): return a[0] < b[0])
	for w in want.slice(0, 6):
		var k: String = w[1]
		var path := "res://map/chunks/c_%d_%d.bin" % [w[2], w[3]]
		pending[k] = WorkerThreadPool.add_task(_load_task.bind(k, path))
	# descarrega longe
	for k in loaded.keys():
		var parts: PackedStringArray = k.split(",")
		var center := Vector3((int(parts[0]) + 0.5) * chunk_size, 0, (int(parts[1]) + 0.5) * chunk_size)
		if center.distance_to(Vector3(p.x, 0, p.z)) > UNLOAD_R:
			loaded[k].queue_free()
			loaded.erase(k)


func is_loaded_at(x: float, z: float) -> bool:
	var c := chunk_key(x, z)
	var k := "%d,%d" % [c.x, c.y]
	return loaded.has(k) or not available.has(k)


func _process(_dt: float) -> void:
	var n := 0
	while n < MAX_BUILDS_PER_FRAME:
		mutex.lock()
		var item = ready_queue.pop_front() if ready_queue.size() > 0 else null
		mutex.unlock()
		if item == null:
			break
		var k: String = item[0]
		if pending.has(k):
			WorkerThreadPool.wait_for_task_completion(pending[k])
			pending.erase(k)
		if item[1] != null and not loaded.has(k):
			loaded[k] = _build(item[1])
		n += 1


# ---------- thread de carga ----------
static func _vec3(f: PackedFloat32Array) -> PackedVector3Array:
	var out := PackedVector3Array()
	var n := f.size() / 3
	out.resize(n)
	for i in n:
		out[i] = Vector3(f[i * 3], f[i * 3 + 1], f[i * 3 + 2])
	return out


static func _vec2(f: PackedFloat32Array) -> PackedVector2Array:
	var out := PackedVector2Array()
	var n := f.size() / 2
	out.resize(n)
	for i in n:
		out[i] = Vector2(f[i * 2], f[i * 2 + 1])
	return out


func _load_task(k: String, path: String) -> void:
	var data = null
	var bytes := FileAccess.get_file_as_bytes(path)
	if bytes.size() > 8:
		var hl := bytes.decode_u32(0)
		var raw_len := bytes.decode_u32(4)
		var hdr = JSON.parse_string(bytes.slice(8, 8 + hl).get_string_from_utf8())
		var raw := bytes.slice(8 + hl).decompress(raw_len, FileAccess.COMPRESSION_ZSTD)
		data = {"o": Vector3(hdr.o[0], 0, hdr.o[1])}
		for sname in hdr.s:
			var sec: Dictionary = hdr.s[sname]
			var arrs := {}
			for an in sec:
				var off: int = sec[an][0]
				var ln: int = sec[an][1]
				var chunk := raw.slice(off, off + ln)
				if an == "i":
					arrs.i = chunk.to_int32_array()
				elif an == "v":
					arrs.v = _vec3(chunk.to_float32_array())
				elif an == "uv" or an == "u2":
					arrs[an] = _vec2(chunk.to_float32_array())
				else:
					arrs[an] = chunk.to_float32_array()
			if sname == "bld" and arrs.has("v"):
				# faces para a colisão
				var faces := PackedVector3Array()
				var idx: PackedInt32Array = arrs.i
				faces.resize(idx.size())
				var vv: PackedVector3Array = arrs.v
				for t in idx.size():
					faces[t] = vv[idx[t]]
				arrs.faces = faces
			data[sname] = arrs
	mutex.lock()
	ready_queue.append([k, data])
	mutex.unlock()


# ---------- montagem no thread principal ----------
func _mesh(arrs: Dictionary, mat: Material, with_uv: bool) -> ArrayMesh:
	var a := []
	a.resize(Mesh.ARRAY_MAX)
	a[Mesh.ARRAY_VERTEX] = arrs.v
	var nrm := PackedVector3Array()
	nrm.resize(arrs.v.size())
	nrm.fill(Vector3.UP)
	a[Mesh.ARRAY_NORMAL] = nrm
	if with_uv and arrs.has("uv"):
		a[Mesh.ARRAY_TEX_UV] = arrs.uv
	if arrs.has("u2"):
		a[Mesh.ARRAY_TEX_UV2] = arrs.u2
	a[Mesh.ARRAY_INDEX] = arrs.i
	var m := ArrayMesh.new()
	m.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, a)
	m.surface_set_material(0, mat)
	return m


func _build(data: Dictionary) -> Node3D:
	var root := Node3D.new()
	root.position = data.o
	add_child(root)
	var layers := [["green", mat_green, false], ["water", mat_water, false], ["walk", mat_walk, true],
		["rail", mat_rail, true], ["road", mat_road, true], ["bld", mat_bld, false]]
	for l in layers:
		if not data.has(l[0]):
			continue
		var mi := MeshInstance3D.new()
		mi.mesh = _mesh(data[l[0]], l[1], l[2])
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if l[0] == "bld" else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		root.add_child(mi)
	if data.has("bld") and data.bld.has("faces"):
		var body := StaticBody3D.new()
		body.collision_layer = 1
		var cs := CollisionShape3D.new()
		var shape := ConcavePolygonShape3D.new()
		shape.set_faces(data.bld.faces)
		cs.shape = shape
		body.add_child(cs)
		root.add_child(body)
	if data.has("trees"):
		var d: PackedFloat32Array = data.trees.d
		var n := d.size() / 4
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.use_colors = true
		mm.mesh = tree_mesh
		mm.instance_count = n
		for i in n:
			var s: float = d[i * 4 + 2]
			var t := Transform3D(Basis(Vector3.UP, fmod(d[i * 4] * 1.7 + d[i * 4 + 1], TAU)).scaled(Vector3(s, s * randf_range(0.9, 1.15), s)), Vector3(d[i * 4], 0, d[i * 4 + 1]))
			mm.set_instance_transform(i, t)
			mm.set_instance_color(i, Props.tree_color(int(d[i * 4 + 3]), d[i * 4] + d[i * 4 + 1]))
		var mmi := MultiMeshInstance3D.new()
		mmi.multimesh = mm
		root.add_child(mmi)
		# colisão simples dos troncos
		var body := StaticBody3D.new()
		for i in n:
			var cs := CollisionShape3D.new()
			var cyl := CylinderShape3D.new()
			cyl.radius = 0.22 * d[i * 4 + 2]
			cyl.height = 3.0
			cs.shape = cyl
			cs.position = Vector3(d[i * 4], 1.5, d[i * 4 + 1])
			body.add_child(cs)
		root.add_child(body)
	if data.has("lamps"):
		var d: PackedFloat32Array = data.lamps.d
		var n := d.size() / 3
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.mesh = lamp_mesh
		mm.instance_count = n
		for i in n:
			mm.set_instance_transform(i, Transform3D(Basis(Vector3.UP, -d[i * 3 + 2]), Vector3(d[i * 3], 0, d[i * 3 + 1])))
		var mmi := MultiMeshInstance3D.new()
		mmi.multimesh = mm
		mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		root.add_child(mmi)
	return root
