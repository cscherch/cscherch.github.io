extends Node3D
## Trânsito com IA seguindo o grafo real de ruas de Canoas (respeita mão única).
## Os carros da IA são Car (VehicleBody3D) congelados em modo cinemático;
## ao serem "pegos" pelo jogador, viram carros com física normal.

const COUNT := 42
const MIN_R := 110.0
const MAX_R := 520.0
var game
var city: City
var agents: Array = []
var models = ["gol", "gol", "uno", "uno", "onix", "onix", "fusca", "opala", "kombi", "strada", "taxi", "bus", "police", "onix", "gol"]


func setup(g) -> void:
	game = g
	city = g.city


func _spawn(a: Dictionary) -> bool:
	var fp: Vector3 = game.focus()
	var e = city.random_edge(fp, MIN_R, MAX_R, 2)
	if e < 0:
		return false
	var ed: Dictionary = city.edges[e]
	var dir = 1
	if ed.o == -1:
		dir = -1
	elif ed.o == 0 and randf() < 0.5:
		dir = -1
	var d = randf_range(5.0, maxf(6.0, ed.len - 5.0))
	if not game.streamer.is_loaded_at(fp.x, fp.z):
		return false
	a.e = e
	a.dir = dir
	a.d = d
	a.speed = 8.0
	a.wait = 0.0
	a.lane = 0.0 if ed.o != 0 else 1.0
	if a.car == null:
		a.car = _make_ai(models[randi() % models.size()])
	var p = _pose(a)
	if p[1].length() < 0.1:
		p[1] = Vector3.FORWARD
	a.car.global_transform = Transform3D(Basis.looking_at(p[1], Vector3.UP), p[0] + Vector3(0, 0.05, 0))
	a.car.visible = true
	return true


func _pose(a: Dictionary) -> Array:
	var ed: Dictionary = city.edges[a.e]
	var off: float = ed.w / 4.0 if ed.o == 0 else (ed.w / 4.0 if a.lane > 0.5 else -ed.w / 4.0 + 0.5)
	var res: Array
	if a.dir > 0:
		res = city.point_on(a.e, a.d, off)
		return [res[0], res[1]]
	res = city.point_on(a.e, ed.len - a.d, -off)
	return [res[0], -res[1]]


func _next_edge(a: Dictionary) -> bool:
	var ed: Dictionary = city.edges[a.e]
	var node: int = ed.b if a.dir > 0 else ed.a
	var opts = []
	for ei in city.node_edges.get(node, []):
		if ei == a.e:
			continue
		var e2: Dictionary = city.edges[ei]
		if e2.a == node and e2.o != -1:
			opts.append([ei, 1, e2.c])
		elif e2.b == node and e2.o != 1:
			opts.append([ei, -1, e2.c])
	if opts.is_empty():
		# retorno no fim da rua
		if ed.o == 0:
			a.dir = -a.dir
			a.d = 2.0
			return true
		return false
	# prefere vias do mesmo porte
	opts.shuffle()
	opts.sort_custom(func(x, y): return absi(x[2] - ed.c) < absi(y[2] - ed.c))
	var pick: Array = opts[0] if randf() < 0.6 else opts[randi() % opts.size()]
	a.e = pick[0]
	a.dir = pick[1]
	a.d = 0.5
	return true


## carro da IA: corpo cinemático leve (visual + colisão), sem física de suspensão
func _make_ai(model: String) -> AnimatableBody3D:
	var spec: Dictionary = CarBuilder.MODELS[model]
	var cols: Array = spec.colors
	var col: Color = cols[randi() % cols.size()]
	var b := AnimatableBody3D.new()
	b.sync_to_physics = false
	b.collision_layer = 2
	b.collision_mask = 0
	b.set_meta("model", model)
	b.set_meta("color", col)
	b.set_meta("spec", spec)
	b.add_child(CarBuilder.build_body(model, col))
	var cs := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(spec.W, 1.2 if model != "bus" else 2.8, spec.L)
	cs.shape = box
	cs.position.y = box.size.y / 2 + 0.3
	b.add_child(cs)
	var wheels := []
	for x in spec.wx:
		for s in [-1.0, 1.0]:
			var w := CarBuilder.wheel_mesh(spec.wheel_r, 0.2 if model != "bus" else 0.3)
			w.position = Vector3(s * spec.track, spec.wheel_r, -x)
			b.add_child(w)
			wheels.append(w)
	b.set_meta("wheels", wheels)
	add_child(b)
	return b


func steal_near(p: Vector3) -> Car:
	for a in agents:
		if a.car and a.car.visible and a.car.global_position.distance_to(p) < 5.5:
			var ai: AnimatableBody3D = a.car
			var c := Car.create(ai.get_meta("model"), ai.get_meta("color"))
			game.add_child(c)
			c.global_position = ai.global_position + Vector3(0, 0.15, 0)
			c.face(-ai.global_transform.basis.z)
			ai.queue_free()
			a.car = null
			agents.erase(a)
			return c
	return null


func has_near(p: Vector3) -> bool:
	for a in agents:
		if a.car and a.car.visible and a.car.global_position.distance_to(p) < 5.5:
			return true
	return false


func _physics_process(dt: float) -> void:
	if game == null:
		return
	while agents.size() < COUNT:
		agents.append({"car": null, "e": -1})
	var fp: Vector3 = game.focus()
	var pcar: Car = game.car
	var ppos: Vector3 = pcar.global_position if pcar else game.player.global_position
	var spawned = 0
	for a in agents:
		if a.car == null or a.e < 0 or a.car.global_position.distance_to(fp) > MAX_R + 120.0:
			if spawned < 2 and _spawn(a):
				spawned += 1
			elif a.car:
				a.car.visible = false
			continue
		var c: AnimatableBody3D = a.car
		var cspec: Dictionary = c.get_meta("spec")
		var ed: Dictionary = city.edges[a.e]
		var limit = 13.0
		match ed.c:
			7, 6: limit = 26.0
			5, 4: limit = 17.0
			3: limit = 14.0
			_: limit = 10.0
		if ed.s > 0:
			limit = minf(limit, ed.s / 3.6)
		if c.get_meta("model") == "bus":
			limit = minf(limit, 13.0)
		var target = limit
		var pos = c.global_position
		var fwd = -c.global_transform.basis.z
		# carro da frente / jogador
		for b in agents:
			if b == a or b.car == null or not b.car.visible:
				continue
			var dv: Vector3 = b.car.global_position - pos
			var along = dv.dot(fwd)
			if along > 0 and along < 22 and absf(dv.dot(c.global_transform.basis.x)) < 2.2:
				target = minf(target, maxf(0.0, (along - 7.0) * 0.9))
		var dp = ppos - pos
		var al = dp.dot(fwd)
		if al > 0 and al < 25 and absf(dp.dot(c.global_transform.basis.x)) < 2.6:
			target = minf(target, maxf(0.0, (al - 6.5) * 0.8))
			if al < 12 and randf() < dt * 0.3:
				game.engine_audio.horn_far()
		if pcar and pcar.global_position.distance_to(pos) < (cspec.L + pcar.spec.L) * 0.55 and pcar.linear_velocity.length() > 3.0:
			a.wait = 2.5
		if a.wait > 0.0:
			a.wait -= dt
			target = 0.0
		# freia antes de curvas fechadas no fim da via
		var remain: float = ed.len - a.d
		if remain < 18.0:
			target = minf(target, 7.0)
		a.speed = move_toward(a.speed, target, dt * (3.0 if target > a.speed else 9.0))
		a.d += a.speed * dt
		if a.d >= ed.len:
			a.d -= ed.len
			if not _next_edge(a):
				a.e = -1
				continue
		var p = _pose(a)
		if p[1].length() < 0.1:
			continue
		var want = Basis.looking_at(p[1], Vector3.UP)
		var cur = c.global_transform.basis.orthonormalized()
		var nb = cur.slerp(want, minf(1.0, dt * 6.0))
		c.global_transform = Transform3D(nb, p[0] + Vector3(0, 0.05, 0))
		for w in c.get_meta("wheels"):
			w.rotation.x -= a.speed * dt / cspec.wheel_r
