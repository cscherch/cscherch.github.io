extends Node3D
## Pedestres caminhando pelas calçadas das ruas reais.

const COUNT := 55
var game
var city: City
var peds: Array = []
const SHIRTS := [Color(0.75, 0.15, 0.15), Color(0.15, 0.35, 0.7), Color(0.9, 0.75, 0.2), Color(0.2, 0.55, 0.3), Color(0.5, 0.3, 0.6),
	Color(0.92, 0.92, 0.9), Color(0.1, 0.1, 0.12), Color(0.85, 0.45, 0.15), Color(0.2, 0.55, 0.6), Color(0.0, 0.4, 0.75)]
const SKINS := [Color(0.95, 0.78, 0.62), Color(0.85, 0.65, 0.48), Color(0.68, 0.48, 0.32), Color(0.45, 0.3, 0.2), Color(0.98, 0.85, 0.72)]


func setup(g) -> void:
	game = g
	city = g.city
	for i in COUNT:
		var m = Player.make_person(SHIRTS[i % SHIRTS.size()], [Color(0.15, 0.17, 0.22), Color(0.25, 0.3, 0.45), Color(0.35, 0.28, 0.2)][i % 3], SKINS[i % SKINS.size()], [Color(0.08, 0.06, 0.05), Color(0.3, 0.18, 0.08), Color(0.75, 0.6, 0.35)][i % 3])
		m.visible = false
		add_child(m)
		peds.append({"m": m, "e": -1, "d": 0.0, "dir": 1, "side": 1, "sp": randf_range(1.1, 1.6), "ph": randf() * 6.0, "down": 0.0, "flee": 0.0})


func _place(p: Dictionary) -> void:
	var fp: Vector3 = game.focus()
	var e = city.random_edge(fp, 40.0, 220.0, 2)
	if e < 0:
		return
	p.e = e
	p.d = randf_range(0, city.edges[e].len)
	p.dir = 1 if randf() < 0.5 else -1
	p.side = 1 if randf() < 0.5 else -1
	p.down = 0.0
	p.m.visible = true
	p.m.rotation = Vector3.ZERO


func _process(dt: float) -> void:
	if game == null:
		return
	var fp: Vector3 = game.focus()
	var car: Car = game.car
	for p in peds:
		if p.e < 0 or p.m.global_position.distance_to(fp) > 260.0:
			_place(p)
			continue
		var m: Node3D = p.m
		if p.down > 0.0:
			p.down -= dt
			m.rotation.x = lerpf(m.rotation.x, -PI / 2, dt * 8.0)
			if p.down <= 0.0:
				_place(p)
			continue
		var ed: Dictionary = city.edges[p.e]
		var sp: float = p.sp
		if car and car.linear_velocity.length() > 4.0:
			var d = car.global_position.distance_to(m.global_position)
			if d < 2.3:
				p.down = 4.0
				game.add_money(-80)
				game.hud.toast("⚠️ Atropelou um pedestre! Multa de R$ 80. Te liga, tchê!", "bad")
				continue
			if d < 12.0:
				p.flee = 1.2
		if p.flee > 0.0:
			p.flee -= dt
			sp = 5.0
		p.d += sp * dt * p.dir
		if p.d < 0 or p.d > ed.len:
			p.dir = -p.dir
			p.d = clampf(p.d, 0, ed.len)
		var off: float = (ed.w / 2.0 + 1.3) * p.side
		var res: Array = city.point_on(p.e, p.d, off)
		var pos: Vector3 = res[0]
		if p.flee > 0.0:
			pos += Vector3(-res[1].z, 0, res[1].x) * p.side * 1.2
		m.global_position = pos
		var dirv: Vector3 = res[1] * p.dir
		m.rotation.y = atan2(-dirv.x, -dirv.z)
		p.ph += dt * sp * 2.4
		Player.animate(m.get_meta("parts"), p.ph, minf(0.9, sp * 0.35))
