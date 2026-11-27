extends Node
## Missões com gírias gaúchas: Táxi Canoas, Tele-Xis, Rally da BR-116, Tour de Canoas e cuias de chimarrão.

var game
var city: City
var starts: Array = []
var target_marker: Node3D
var tgt = null  # {p: Vector3, label: String}
var state = null
var cuias: Array = []
var cuias_got = 0
var t = 0.0

const CLIENTES := ["o Seu Tonico", "a Dona Neca", "um estudante da ULBRA", "a prenda Juliana", "o gaudério Bagual",
	"a tia do xis", "um gremista nervoso", "uma colorada animada", "o piá da Mathias", "a vó Cotinha", "um tchê de bombacha"]
const LANCHES := ["xis coração", "xis bacon", "xis salada", "cachorro-quente prensado", "pastel de feira", "kit churrasco",
	"cuca de uva", "pacote de erva-mate", "bergamotas", "negrinho e cueca virada"]
const ELOGIOS := ["Tri legal!", "Bah, mandou bem!", "Capaz! Que motorista!", "Barbaridade, que rapidez!", "Tu é o cara, tchê!"]


func setup(g) -> void:
	game = g
	city = g.city
	var specs = [
		["taxi", "Táxi Canoas", Color(1, 0.82, 0.1), ["Canoas Shopping", "Estação Canoas", "Shopping"]],
		["delivery", "Tele-Xis", Color(1, 0.42, 0.15), ["Xis", "Lanches", "Lancheria", "Pizzaria"]],
		["race", "Rally da BR-116", Color(0.2, 0.85, 1), ["Estação Niterói", "Niterói", "Posto"]],
		["tour", "Tour de Canoas", Color(0.75, 0.45, 1), ["Prefeitura", "Praça", "Igreja"]],
	]
	var origin: Vector3 = game.player.global_position
	for i in specs.size():
		var s: Array = specs[i]
		var pos = Vector3.ZERO
		var found = false
		for nmq in s[3]:
			var best = null
			var bd = 1e9
			for p in city.pois:
				if String(p[0]).to_lower().contains(String(nmq).to_lower()):
					var d = Vector3(p[2], 0, p[3]).distance_to(origin)
					if d < bd:
						bd = d
						best = p
			if best and bd < 4000:
				pos = snap(Vector3(best[2], 0, best[3]))
				found = true
				break
		if not found:
			var a = i * TAU / specs.size()
			pos = snap(origin + Vector3(cos(a), 0, sin(a)) * 250.0)
		var m = _marker(s[2], 40.0)
		m.position = pos
		add_child(m)
		starts.append({"id": s[0], "name": s[1], "c": s[2], "p": pos, "m": m})
	target_marker = _marker(Color(0.25, 1, 0.4), 70.0)
	target_marker.visible = false
	add_child(target_marker)
	# cuias
	var rng = RandomNumberGenerator.new()
	rng.seed = 2024
	for i in 30:
		var e = rng.randi_range(0, city.edges.size() - 1)
		var ed: Dictionary = city.edges[e]
		if ed.c < 2:
			continue
		var res: Array = city.point_on(e, rng.randf_range(0, ed.len), rng.randf_range(-1.5, 1.5))
		var c = _cuia()
		c.position = res[0] + Vector3(0, 1.1, 0)
		add_child(c)
		cuias.append({"m": c, "p": res[0], "got": false})


func snap(p: Vector3) -> Vector3:
	for r in [20.0, 60.0, 150.0, 400.0]:
		var res = city.nearest_edge(p.x, p.z, r)
		if not res.is_empty():
			var ed: Dictionary = city.edges[res.e]
			return city.point_on(res.e, res.d, ed.w / 4.0)[0]
	return p


func _marker(col: Color, h: float) -> Node3D:
	var n = Node3D.new()
	var beam = MeshInstance3D.new()
	var cm = CylinderMesh.new()
	cm.top_radius = 3.0
	cm.bottom_radius = 3.0
	cm.height = h
	cm.cap_top = false
	cm.cap_bottom = false
	beam.mesh = cm
	beam.position.y = h / 2
	var m = StandardMaterial3D.new()
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.albedo_color = Color(col.r, col.g, col.b, 0.22)
	m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	beam.material_override = m
	beam.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	n.add_child(beam)
	var ring = MeshInstance3D.new()
	var tm = TorusMesh.new()
	tm.inner_radius = 2.8
	tm.outer_radius = 3.2
	ring.mesh = tm
	ring.position.y = 0.3
	var rm = StandardMaterial3D.new()
	rm.emission_enabled = true
	rm.emission = col
	rm.emission_energy_multiplier = 4.0
	rm.albedo_color = col
	ring.material_override = rm
	n.add_child(ring)
	var icon = MeshInstance3D.new()
	var pm = PrismMesh.new()
	pm.size = Vector3(1.4, 1.6, 0.4)
	icon.mesh = pm
	icon.rotation.z = PI
	icon.position.y = 4.5
	icon.material_override = rm
	icon.name = "Icon"
	n.add_child(icon)
	return n


func _cuia() -> Node3D:
	var n = Node3D.new()
	var body = MeshInstance3D.new()
	var sm = SphereMesh.new()
	sm.radius = 0.55
	sm.height = 0.95
	body.mesh = sm
	var gm = StandardMaterial3D.new()
	gm.albedo_color = Color(0.4, 0.55, 0.15)
	gm.emission_enabled = true
	gm.emission = Color(0.3, 0.6, 0.05)
	gm.emission_energy_multiplier = 0.8
	gm.roughness = 0.5
	body.material_override = gm
	n.add_child(body)
	var rim = MeshInstance3D.new()
	var tm = TorusMesh.new()
	tm.inner_radius = 0.42
	tm.outer_radius = 0.52
	rim.mesh = tm
	rim.position.y = 0.42
	var am = StandardMaterial3D.new()
	am.albedo_color = Color(0.85, 0.7, 0.25)
	am.metallic = 1.0
	am.roughness = 0.2
	rim.material_override = am
	n.add_child(rim)
	var bomba = MeshInstance3D.new()
	var cm = CylinderMesh.new()
	cm.top_radius = 0.04
	cm.bottom_radius = 0.04
	cm.height = 1.0
	bomba.mesh = cm
	bomba.position = Vector3(0.15, 0.75, 0)
	bomba.rotation.z = -0.3
	bomba.material_override = am
	n.add_child(bomba)
	return n


func blips() -> Array:
	var out = []
	if state == null:
		for s in starts:
			out.append({"p": s.p, "c": s.c, "r": 7.0})
	if tgt:
		out.append({"p": tgt.p, "c": Color(0.25, 1, 0.4), "r": 8.0})
	var fp: Vector3 = game.focus()
	for c in cuias:
		if not c.got and c.p.distance_to(fp) < 600:
			out.append({"p": c.p, "c": Color(0.6, 1, 0.3), "r": 3.5})
	return out


func set_target(p: Vector3, label: String) -> void:
	tgt = {"p": p, "label": label}
	target_marker.position = p
	target_marker.visible = true


func random_destination(minD: float, maxD: float) -> Dictionary:
	var fp: Vector3 = game.focus()
	for i in 80:
		if randf() < 0.65 and city.pois.size() > 0:
			var p: Array = city.pois[randi() % city.pois.size()]
			var pos = Vector3(p[2], 0, p[3])
			var d = pos.distance_to(fp)
			if d > minD and d < maxD:
				var sp = snap(pos)
				return {"p": sp, "label": "%s (%s)" % [p[0], city.hood_at(sp.x, sp.z)], "d": d}
		else:
			var e = city.random_edge(fp, minD, maxD, 2)
			if e >= 0:
				var ed: Dictionary = city.edges[e]
				var res: Array = city.point_on(e, ed.len * 0.5, ed.w / 4.0)
				var nm: String = city.names[ed.n]
				return {"p": res[0], "label": "%s, %s" % [nm if nm != "" else "rua sem nome", city.hood_at(res[0].x, res[0].z)], "d": res[0].distance_to(fp)}
	return {"p": fp + Vector3(300, 0, 0), "label": "logo ali", "d": 300.0}


func start(id: String) -> void:
	for s in starts:
		s.m.visible = false
	var hud: HUD = game.hud
	match id:
		"taxi":
			state = {"id": id, "phase": "pickup", "fares": 0, "time": 70.0}
			var d = random_destination(200, 700)
			set_target(d.p, d.label)
			hud.mission("Táxi Canoas", "Busca o passageiro em [b]%s[/b]" % d.label)
			hud.toast("🚕 Bah! Começou teu turno de táxi.")
		"delivery":
			state = {"id": id, "left": 3, "time": 0.0, "reward": 0}
			_next_delivery()
			hud.toast("🍔 Tele-Xis: 3 entregas. Não deixa esfriar, tchê!")
		"race":
			var cps = _br116_checkpoints()
			if cps.is_empty():
				hud.toast("Não achei a BR-116 daqui.")
				end_mission("", false)
				return
			state = {"id": id, "cps": cps, "i": 0, "t": 0.0, "time": 45.0 + cps.size() * 9.0}
			set_target(cps[0], "Checkpoint 1")
			hud.mission("Rally da BR-116", "Passa por %d checkpoints na BR, rumo ao norte!" % cps.size())
			hud.toast("🏁 Valendo! Pé na tábua, guri!")
		"tour":
			var names = ["ULBRA", "ParkShopping", "Canoas Shopping", "Hospital", "Unilasalle", "Prefeitura", "Base Aérea", "Estação"]
			var stops = []
			for q in names:
				var p: Array = city.poi_named(q)
				if p.size() > 0:
					stops.append({"p": snap(Vector3(p[2], 0, p[3])), "label": p[0]})
			if stops.is_empty():
				end_mission("", false)
				return
			state = {"id": id, "stops": stops, "i": 0, "time": 600.0}
			set_target(stops[0].p, stops[0].label)
			hud.mission("Tour de Canoas", "Visita: [b]%s[/b] (1/%d)" % [stops[0].label, stops.size()])
			hud.toast("🗺️ Bora conhecer Canoas!")


func _br116_checkpoints() -> Array:
	var fp: Vector3 = game.focus()
	var pts = []
	for e in city.edges:
		var nm: String = city.names[e.n]
		if e.c >= 6 and (nm.contains("116") or nm.contains("BR")):
			for i in range(0, e.pts.size(), 3):
				pts.append(Vector3(e.pts[i].x, 0, e.pts[i].y))
	if pts.is_empty():
		return []
	pts.sort_custom(func(a, b): return a.z > b.z) # sul -> norte
	var start_i = 0
	var bd = 1e9
	for i in pts.size():
		var d: float = pts[i].distance_to(fp)
		if d < bd:
			bd = d
			start_i = i
	var cps = []
	var last: Vector3 = pts[start_i]
	for i in range(start_i, pts.size()):
		if pts[i].distance_to(last) > 420.0:
			cps.append(pts[i])
			last = pts[i]
		if cps.size() >= 12:
			break
	return cps


func _next_delivery() -> void:
	var d = random_destination(350, 1400)
	var food: String = LANCHES.pick_random()
	var who: String = CLIENTES.pick_random()
	set_target(d.p, d.label)
	state.time = 30.0 + d.d / 11.0
	state.reward = int(90 + d.d / 6.0)
	game.hud.mission("Tele-Xis", "Leva um [b]%s[/b] pra %s em [b]%s[/b] (%d restantes)" % [food, who, d.label, state.left])


func cancel() -> void:
	if state != null:
		end_mission("Missão cancelada.", false)


func fail(msg: String) -> void:
	if state != null:
		end_mission(msg, false)


func end_mission(msg: String, ok: bool) -> void:
	if msg != "":
		game.hud.toast(msg, "good" if ok else "bad")
	state = null
	tgt = null
	target_marker.visible = false
	game.hud.mission("", "")
	for s in starts:
		s.m.visible = true


func _process(dt: float) -> void:
	if game == null:
		return
	t += dt
	var fp: Vector3 = game.focus()
	for s in starts:
		s.m.get_node("Icon").rotation.y = t * 2.0
		s.m.get_node("Icon").position.y = 4.5 + sin(t * 3.0) * 0.4
	target_marker.get_node("Icon").rotation.y = t * 2.0
	for c in cuias:
		if c.got:
			continue
		c.m.rotation.y = t * 1.5
		c.m.position.y = 1.1 + sin(t * 2.0 + c.p.x) * 0.2
		if c.p.distance_to(fp) < 3.5:
			c.got = true
			c.m.visible = false
			cuias_got += 1
			game.add_money(100)
			game.hud.toast("🧉 Cuia de chimarrão %d/%d — +R$ 100" % [cuias_got, cuias.size()], "good")
			if cuias_got == cuias.size():
				game.add_money(5000)
				game.hud.toast("🏆 Juntou todas as cuias! Tu é o gaúcho mais tri de Canoas! +R$ 5.000", "good")
	var car: Car = game.car
	var in_car: bool = car != null
	if state == null:
		for s in starts:
			if s.p.distance_to(fp) < 6.0:
				if not in_car:
					game.hud.hint("Entra num carro pra começar: %s" % s.name)
				else:
					start(s.id)
				break
		return
	if state.has("time"):
		state.time -= dt
		game.hud.timer(state.time)
		if state.time <= 0:
			if state.id == "taxi" and state.fares > 0:
				end_mission("⏱️ Fim do turno: %d corridas. Tri!" % state.fares, true)
			else:
				end_mission("⏱️ Acabou o tempo... Barbaridade!", false)
			return
	if not in_car and state.id != "tour":
		end_mission("Missão cancelada: tu saiu do carro.", false)
		return
	if tgt == null:
		return
	var d: float = tgt.p.distance_to(Vector3(fp.x, 0, fp.z))
	var spd = car.speed_kmh() if car else 0.0
	var hud: HUD = game.hud
	match state.id:
		"taxi":
			if d < 8.0 and spd < 20.0:
				if state.phase == "pickup":
					var dest = random_destination(600, 2200)
					state.phase = "drop"
					state.dist = dest.d
					state.time = 30.0 + dest.d / 12.0
					set_target(dest.p, dest.label)
					hud.mission("Táxi Canoas", "%s embarcou. \"Me leva em [b]%s[/b], por favor!\"" % [String(CLIENTES.pick_random()).capitalize(), dest.label])
				else:
					var pay = int(40 + state.dist / 7.0 + maxf(0, state.time) * 3.0)
					game.add_money(pay)
					state.fares += 1
					hud.toast("💵 %s +R$ %d" % [ELOGIOS.pick_random(), pay], "good")
					var nxt = random_destination(150, 650)
					state.phase = "pickup"
					state.time = 55.0
					set_target(nxt.p, nxt.label)
					hud.mission("Táxi Canoas", "Corridas: %d. Próximo passageiro em [b]%s[/b]" % [state.fares, nxt.label])
		"delivery":
			if d < 8.0 and spd < 20.0:
				var pay: int = state.reward + int(state.time * 2.0)
				game.add_money(pay)
				hud.toast("🍔 Entregue! %s +R$ %d" % [ELOGIOS.pick_random(), pay], "good")
				state.left -= 1
				if state.left <= 0:
					game.add_money(300)
					end_mission("🏆 Todas as entregas feitas! Bônus R$ 300", true)
				else:
					_next_delivery()
		"race":
			state.t += dt
			if d < 18.0:
				state.i += 1
				if state.i >= state.cps.size():
					var prize = int(500 + state.time * 15)
					game.add_money(prize)
					end_mission("🏁 Chegada em %.1fs! +R$ %d. Tri barbaridade!" % [state.t, prize], true)
					return
				state.time += 6.0
				set_target(state.cps[state.i], "Checkpoint %d" % (state.i + 1))
				hud.mission("Rally da BR-116", "Checkpoint %d/%d — %.1fs" % [state.i, state.cps.size(), state.t])
		"tour":
			if d < 14.0:
				game.add_money(150)
				hud.toast("📸 %s visitado! +R$ 150" % tgt.label, "good")
				state.i += 1
				if state.i >= state.stops.size():
					game.add_money(1000)
					end_mission("🏆 Tour completo! Agora tu conhece Canoas, tchê. +R$ 1.000", true)
					return
				var s: Dictionary = state.stops[state.i]
				set_target(s.p, s.label)
				hud.mission("Tour de Canoas", "Visita: [b]%s[/b] (%d/%d)" % [s.label, state.i + 1, state.stops.size()])
