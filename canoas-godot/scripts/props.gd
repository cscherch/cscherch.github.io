class_name Props
## Malhas procedurais de objetos de rua: árvores (incluindo ipês), postes, placas.


static func _sphere_blob(st: SurfaceTool, c: Vector3, r: Vector3, seed: int) -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = seed
	var rings := 6
	var segs := 9
	var pts := []
	for i in rings + 1:
		var row := []
		var phi := PI * float(i) / rings
		for j in segs:
			var th := TAU * float(j) / segs
			var k := 1.0 + rng.randf_range(-0.18, 0.18)
			var d := Vector3(sin(phi) * cos(th), cos(phi), sin(phi) * sin(th))
			row.append(c + d * r * k)
		pts.append(row)
	for i in rings:
		for j in segs:
			var a: Vector3 = pts[i][j]
			var b: Vector3 = pts[i][(j + 1) % segs]
			var cc: Vector3 = pts[i + 1][(j + 1) % segs]
			var d: Vector3 = pts[i + 1][j]
			for v in [a, cc, b, a, d, cc]:
				st.set_normal((v - c).normalized())
				st.add_vertex(v)


static func make_tree_mesh() -> ArrayMesh:
	var mesh := ArrayMesh.new()
	# tronco
	var cyl := CylinderMesh.new()
	cyl.top_radius = 0.14
	cyl.bottom_radius = 0.24
	cyl.height = 3.2
	cyl.radial_segments = 7
	var arr := cyl.get_mesh_arrays()
	var verts: PackedVector3Array = arr[Mesh.ARRAY_VERTEX]
	for i in verts.size():
		verts[i].y += 1.6
	arr[Mesh.ARRAY_VERTEX] = verts
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
	var bark := StandardMaterial3D.new()
	bark.albedo_color = Color(0.33, 0.25, 0.19)
	bark.roughness = 1.0
	mesh.surface_set_material(0, bark)
	# copa: vários "chumaços" irregulares
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	_sphere_blob(st, Vector3(0, 4.6, 0), Vector3(2.3, 1.7, 2.3), 1)
	_sphere_blob(st, Vector3(1.1, 4.1, 0.4), Vector3(1.5, 1.2, 1.5), 2)
	_sphere_blob(st, Vector3(-0.9, 4.2, -0.7), Vector3(1.6, 1.3, 1.6), 3)
	_sphere_blob(st, Vector3(0.2, 5.6, -0.2), Vector3(1.4, 1.1, 1.4), 4)
	var leaves := st.commit_to_arrays()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, leaves)
	var lm := ShaderMaterial.new()
	lm.shader = load("res://shaders/foliage.gdshader")
	mesh.surface_set_material(1, lm)
	return mesh


static func tree_color(t: int, seed: float) -> Color:
	var r := fmod(abs(seed * 0.137), 1.0)
	if r < 0.03:
		return Color(0.86, 0.42, 0.66) # ipê-roxo
	if r < 0.055:
		return Color(0.93, 0.78, 0.16) # ipê-amarelo
	var greens := [Color(0.25, 0.42, 0.16), Color(0.31, 0.48, 0.2), Color(0.36, 0.52, 0.22), Color(0.22, 0.36, 0.15)]
	return greens[t % 4]


static func make_lamp_mesh(head_mat: Material) -> ArrayMesh:
	var mesh := ArrayMesh.new()
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var pole := CylinderMesh.new()
	pole.top_radius = 0.07
	pole.bottom_radius = 0.11
	pole.height = 8.0
	pole.radial_segments = 6
	st.append_from(pole, 0, Transform3D(Basis(), Vector3(0, 4, 0)))
	var arm := BoxMesh.new()
	arm.size = Vector3(2.2, 0.1, 0.1)
	st.append_from(arm, 0, Transform3D(Basis(), Vector3(1.05, 7.9, 0)))
	mesh = st.commit()
	var pm := StandardMaterial3D.new()
	pm.albedo_color = Color(0.42, 0.44, 0.46)
	pm.metallic = 0.6
	pm.roughness = 0.45
	mesh.surface_set_material(0, pm)
	var head := BoxMesh.new()
	head.size = Vector3(0.7, 0.14, 0.32)
	var ha := head.get_mesh_arrays()
	var hv: PackedVector3Array = ha[Mesh.ARRAY_VERTEX]
	for i in hv.size():
		hv[i] += Vector3(2.05, 7.82, 0)
	ha[Mesh.ARRAY_VERTEX] = hv
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, ha)
	mesh.surface_set_material(1, head_mat)
	return mesh
