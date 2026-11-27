extends Node3D
## Canoas City — jogo principal.

var city = City.new()
var streamer: Node3D
var player: Player
var rig: CameraRig
var hud: HUD
var car: Car = null
var cars: Array[Car] = []
var traffic: Node3D
var peds: Node3D
var missions: Node
var sun: DirectionalLight3D
var env: Environment
var sky_mat: ShaderMaterial
var mats = {}
var hour = 16.8
var time_speed = 1.0 / 30.0 # horas de jogo por segundo
var night = 0.0
var money = 500
var t = 0.0
var engine_audio: EngineAudio
var map_open = false
var paused = false
var save_path = "user://canoas.save"


func _ready() -> void:
	_setup_input()
	city.load_all()
	_load_save()
	_setup_environment()
	_setup_materials()
	_setup_ground()
	streamer = preload("res://scripts/chunk_streamer.gd").new()
	add_child(streamer)
	streamer.setup(city.meta, mats)
	# ponto inicial: perto do Centro, numa avenida real
	var spawn = _spawn_point()
	player = Player.new()
	add_child(player)
	player.global_position = spawn[0] + Vector3(0, 0.2, 0)
	rig = CameraRig.new()
	add_child(rig)
	rig.target = player
	rig.yaw = atan2(-spawn[1].x, -spawn[1].z)
	rig.global_position = player.global_position
	# carros estacionados perto do início
	var models = ["gol", "fusca", "opala", "onix", "kombi", "uno", "strada", "taxi"]
	for i in models.size():
		var e: int = spawn[2]
		var d: float = spawn[3] + 3.5 - i * 7.0
		var pp: Array = city.point_on(e, d, city.edges[e].w / 2.0 - 1.3)
		var c = Car.create(models[i], Color(0.75, 0.08, 0.08) if models[i] == "opala" else null)
		add_child(c)
		c.global_position = pp[0] + Vector3(0, 0.4, 0)
		c.face(pp[1])
		cars.append(c)
	traffic = preload("res://scripts/traffic.gd").new()
	add_child(traffic)
	traffic.setup(self)
	peds = preload("res://scripts/pedestrians.gd").new()
	add_child(peds)
	peds.setup(self)
	hud = HUD.new()
	add_child(hud)
	hud.setup(city, load("res://map/minimap.png"))
	missions = preload("res://scripts/missions.gd").new()
	add_child(missions)
	missions.setup(self)
	engine_audio = EngineAudio.new()
	add_child(engine_audio)
	streamer.update_focus(player.global_position)
	hud.toast("Bem-vindo a [Canoas]! Aperta F perto de um carro pra dirigir, tchê.".replace("[", "").replace("]", ""))
	hud.toast("Siga os marcadores coloridos no minimapa para as missões.")
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--shot="):
			var at = preload("res://scripts/autotest.gd").new()
			at.game = self
			at.dir = a.substr(7)
			add_child(at)


func _spawn_point() -> Array:
	var target = Vector3(city.meta.centro[0], 0, city.meta.centro[1])
	for nm in ["Estação Trensurb - Canoas/La Salle", "Canoas Shopping", "Unilasalle Canoas"]:
		var p: Array = city.poi_exact(nm)
		if p.size() > 0:
			target = Vector3(p[2], 0, p[3])
			break
	for r in [60.0, 150.0, 300.0, 600.0]:
		for k in 16:
			var a = k * TAU / 16
			var res = city.nearest_edge(target.x + cos(a) * r * 0.5, target.z + sin(a) * r * 0.5, r)
			if not res.is_empty() and city.edges[res.e].c >= 3 and city.edges[res.e].len > 120:
				var d: float = clampf(res.d, 10.0, city.edges[res.e].len - 80.0)
				var pp: Array = city.point_on(res.e, d, city.edges[res.e].w / 2.0 + 1.5)
				return [pp[0], pp[1], res.e, d]
	return [target, Vector3.FORWARD, 0, 0.0]


func _setup_input() -> void:
	var map = {
		"up": [KEY_W, KEY_UP], "down": [KEY_S, KEY_DOWN], "left": [KEY_A, KEY_LEFT], "right": [KEY_D, KEY_RIGHT],
		"handbrake": [KEY_SPACE], "run": [KEY_SHIFT], "enter": [KEY_F, KEY_ENTER], "horn": [KEY_H], "map": [KEY_M],
		"camera": [KEY_C], "reset": [KEY_R], "time": [KEY_N], "cancel": [KEY_X], "pause": [KEY_ESCAPE, KEY_P], "quality": [KEY_Q],
	}
	for a in map:
		if not InputMap.has_action(a):
			InputMap.add_action(a)
		for k in map[a]:
			var ev = InputEventKey.new()
			ev.physical_keycode = k
			InputMap.action_add_event(a, ev)
	var pads = {"up": JOY_BUTTON_RIGHT_SHOULDER, "down": JOY_BUTTON_LEFT_SHOULDER, "enter": JOY_BUTTON_Y, "handbrake": JOY_BUTTON_X, "map": JOY_BUTTON_BACK, "pause": JOY_BUTTON_START, "horn": JOY_BUTTON_LEFT_STICK, "run": JOY_BUTTON_A}
	for a in pads:
		var ev = InputEventJoypadButton.new()
		ev.button_index = pads[a]
		InputMap.action_add_event(a, ev)


func _setup_environment() -> void:
	var we = WorldEnvironment.new()
	env = Environment.new()
	var sky = Sky.new()
	sky_mat = ShaderMaterial.new()
	sky_mat.shader = load("res://shaders/sky.gdshader")
	sky.sky_material = sky_mat
	sky.radiance_size = Sky.RADIANCE_SIZE_256
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	env.tonemap_mode = Environment.TONE_MAPPER_ACES
	env.tonemap_exposure = 1.0
	env.tonemap_white = 6.0
	env.ssao_enabled = true
	env.ssao_radius = 1.2
	env.ssao_intensity = 1.6
	env.glow_enabled = true
	env.glow_intensity = 0.6
	env.glow_bloom = 0.05
	env.glow_hdr_threshold = 1.1
	env.glow_blend_mode = Environment.GLOW_BLEND_MODE_SOFTLIGHT
	env.fog_enabled = true
	env.fog_light_color = Color(0.7, 0.76, 0.82)
	env.fog_density = 0.0011
	env.fog_aerial_perspective = 0.5
	env.fog_sky_affect = 0.25
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.1
	env.adjustment_contrast = 1.05
	we.environment = env
	add_child(we)
	sun = DirectionalLight3D.new()
	sun.shadow_enabled = true
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS
	sun.directional_shadow_max_distance = 320.0
	sun.directional_shadow_blend_splits = true
	sun.shadow_bias = 0.04
	sun.shadow_normal_bias = 1.2
	sun.light_angular_distance = 0.6
	add_child(sun)


func _stars_texture() -> Texture2D:
	var img = Image.create(2048, 1024, false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))
	var rng = RandomNumberGenerator.new()
	rng.seed = 42
	for i in 3500:
		var x = rng.randi_range(0, 2047)
		var y = rng.randi_range(0, 520)
		var b = rng.randf_range(0.3, 1.0)
		img.set_pixel(x, y, Color(b, b, b * 1.05, 1))
	return ImageTexture.create_from_image(img)


func _tex(name: String) -> Texture2D:
	return load("res://textures/%s.jpg" % name)


func _setup_materials() -> void:
	var noise = NoiseTexture2D.new()
	noise.seamless = true
	noise.width = 512
	noise.height = 512
	var fn = FastNoiseLite.new()
	fn.frequency = 0.01
	noise.noise = fn
	var m = ShaderMaterial.new()
	m.shader = load("res://shaders/building.gdshader")
	m.set_shader_parameter("plaster_tex", _tex("plaster_diff"))
	m.set_shader_parameter("plaster_nor", _tex("plaster_nor"))
	m.set_shader_parameter("brick_tex", _tex("brick_diff"))
	m.set_shader_parameter("concrete_tex", _tex("concrete_diff"))
	m.set_shader_parameter("roof_tex", _tex("roof_diff"))
	m.set_shader_parameter("roof_nor", _tex("roof_nor"))
	mats.bld = m
	var r = ShaderMaterial.new()
	r.shader = load("res://shaders/road.gdshader")
	r.set_shader_parameter("asphalt_tex", _tex("asphalt_diff"))
	r.set_shader_parameter("asphalt_nor", _tex("asphalt_nor"))
	r.set_shader_parameter("asphalt_rough", _tex("asphalt_rough"))
	mats.road = r
	var gs: Shader = load("res://shaders/ground.gdshader")
	var mk = func(a: String, b: String, mode: int, sa: float, tint: Color) -> ShaderMaterial:
		var sm = ShaderMaterial.new()
		sm.shader = gs
		sm.set_shader_parameter("tex_a", _tex(a + "_diff"))
		sm.set_shader_parameter("nor_a", _tex(a + "_nor"))
		sm.set_shader_parameter("tex_b", _tex(b + "_diff"))
		sm.set_shader_parameter("noise", noise)
		sm.set_shader_parameter("mode", mode)
		sm.set_shader_parameter("scale_a", sa)
		sm.set_shader_parameter("tint", Vector3(tint.r, tint.g, tint.b))
		return sm
	mats.walk = mk.call("sidewalk", "concrete", 2, 0.35, Color(1, 1, 1))
	mats.rail = mk.call("gravel", "dirt", 3, 0.5, Color(1, 1, 1))
	mats.green = mk.call("grass", "dirt", 1, 0.2, Color(0.95, 1.0, 0.9))
	mats.ground = mk.call("grass", "dirt", 0, 0.12, Color(0.85, 0.85, 0.8))
	var mm: Dictionary = city.meta.minimap
	mats.ground.set_shader_parameter("mask", load("res://map/minimap.png"))
	mats.ground.set_shader_parameter("mask_rect", Vector4(mm.x0, mm.z0, mm.px * mm.w, mm.px * mm.h))
	mats.ground.set_shader_parameter("tex_c", _tex("concrete_diff"))
	var w = ShaderMaterial.new()
	w.shader = load("res://shaders/water.gdshader")
	for k in ["wave_a", "wave_b"]:
		var nt = NoiseTexture2D.new()
		nt.seamless = true
		nt.as_normal_map = true
		nt.bump_strength = 4.0
		var f2 = FastNoiseLite.new()
		f2.frequency = 0.02 if k == "wave_a" else 0.05
		nt.noise = f2
		w.set_shader_parameter(k, nt)
	mats.water = w
	var lh = StandardMaterial3D.new()
	lh.albedo_color = Color(0.9, 0.9, 0.85)
	lh.emission_enabled = true
	lh.emission = Color(1.0, 0.82, 0.55)
	lh.emission_energy_multiplier = 0.0
	mats.lamp_head = lh


func _setup_ground() -> void:
	var g = MeshInstance3D.new()
	var pm = PlaneMesh.new()
	pm.size = Vector2(40000, 40000)
	g.mesh = pm
	g.material_override = mats.ground
	g.position.y = -0.02
	g.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(g)
	var body = StaticBody3D.new()
	body.collision_layer = 1
	var cs = CollisionShape3D.new()
	cs.shape = WorldBoundaryShape3D.new()
	body.add_child(cs)
	add_child(body)


# ---------- ciclo do dia ----------
func _update_sky(dt: float) -> void:
	hour = fmod(hour + dt * time_speed, 24.0)
	var a = (hour - 6.0) / 13.0 * PI # nasce 6h, põe 19h
	var elev = sin(a)
	var day = clampf(elev * 3.0 + 0.15, 0.0, 1.0)
	night = 1.0 - clampf(elev * 4.0 + 0.4, 0.0, 1.0)
	var dir = Vector3(cos(a), maxf(elev, -0.2), 0.35).normalized()
	if elev < -0.05:
		dir = Vector3(-cos(a), 0.6, -0.3).normalized() # lua
	sun.look_at_from_position(dir * 100.0, Vector3.ZERO, Vector3.UP)
	var golden = clampf(1.0 - absf(elev) * 4.0, 0.0, 1.0) * day
	sun.light_color = Color(1, 0.97, 0.92).lerp(Color(1.0, 0.62, 0.35), golden) if elev > -0.05 else Color(0.55, 0.65, 0.9)
	sun.light_energy = (0.25 + 1.35 * day) if elev > -0.05 else 0.12
	var top = Color(0.2, 0.4, 0.75).lerp(Color(0.02, 0.03, 0.08), night)
	var hor = Color(0.7, 0.78, 0.86).lerp(Color(0.95, 0.55, 0.35), golden).lerp(Color(0.05, 0.06, 0.12), night)
	sky_mat.set_shader_parameter("top_color", Vector3(top.r, top.g, top.b))
	sky_mat.set_shader_parameter("horizon_color", Vector3(hor.r, hor.g, hor.b))
	sky_mat.set_shader_parameter("night", night)
	var sdir := Vector3(cos(a), elev, 0.35).normalized()
	sky_mat.set_shader_parameter("sun_dir", sdir)
	var sc := Color(1, 0.95, 0.85).lerp(Color(1.0, 0.55, 0.3), golden)
	sky_mat.set_shader_parameter("sun_color", Vector3(sc.r, sc.g, sc.b))
	env.fog_light_color = hor
	env.ambient_light_energy = 1.0 - night * 0.75
	env.ambient_light_sky_contribution = 1.0 - night * 0.5
	mats.bld.set_shader_parameter("night", night)
	mats.lamp_head.emission_energy_multiplier = night * 6.0
	CarBuilder.mats()
	CarBuilder.head_mat.emission_energy_multiplier = 0.5 + night * 5.0


func clock() -> String:
	return "%02d:%02d" % [int(hour), int(fmod(hour, 1.0) * 60)]


# ---------- entrada ----------
func _unhandled_input(e: InputEvent) -> void:
	if e is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		rig.mouse_look(e.relative)
	elif e is InputEventMouseButton and e.pressed:
		if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED and not paused:
			Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	if e.is_action_pressed("enter"):
		toggle_car()
	elif e.is_action_pressed("horn"):
		engine_audio.horn()
	elif e.is_action_pressed("map"):
		map_open = hud.toggle_map()
	elif e.is_action_pressed("camera"):
		rig.mode = (rig.mode + 1) % 2
	elif e.is_action_pressed("reset") and car:
		car.reset_upright()
	elif e.is_action_pressed("time"):
		hour = fmod(hour + 3.0, 24.0)
		hud.toast("⏩ " + clock())
	elif e.is_action_pressed("cancel"):
		missions.cancel()
	elif e.is_action_pressed("pause"):
		paused = not paused
		get_tree().paused = paused
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if paused else Input.MOUSE_MODE_CAPTURED
		hud.toast("Pausado — P para continuar" if paused else "Valendo!")
	elif e.is_action_pressed("quality"):
		var hi = not env.ssao_enabled
		env.ssao_enabled = hi
		env.glow_enabled = hi
		sun.shadow_enabled = hi
		get_viewport().scaling_3d_scale = 1.0 if hi else 0.67
		hud.toast("Gráficos: " + ("altos" if hi else "rápidos"))


func toggle_car() -> void:
	if car:
		if car.speed_kmh() > 12.0:
			hud.toast("Para o carro antes de descer, guri!")
			return
		var side = car.global_transform.basis.x
		var out = car.global_position - side * (car.spec.W / 2 + 0.9)
		player.global_position = Vector3(out.x, 0.3, out.z)
		player.visible = true
		player.process_mode = Node.PROCESS_MODE_INHERIT
		player.collision_layer = 4
		car.driven = false
		car.throttle = 0
		car.brake_in = 0.5
		car.set_lights(night)
		rig.target = player
		car = null
		return
	var best: Car = null
	var bd = 4.5
	for c in cars:
		var d = c.global_position.distance_to(player.global_position) - c.spec.L * 0.25
		if d < bd and c.health > 0:
			bd = d
			best = c
	if best == null:
		best = traffic.steal_near(player.global_position)
		if best:
			cars.append(best)
			if best.model == "police":
				hud.toast("🚨 Bah! Roubou a viatura da Brigada! -R$ 300", "bad")
				add_money(-300)
			else:
				hud.toast(["“Ô loco, meu carro!”", "“Bah, que isso, tchê?!”", "“Me devolve, seu guri!”"].pick_random(), "bad")
	if best:
		car = best
		car.driven = true
		car.ai = false
		car.setup_headlights()
		player.visible = false
		player.process_mode = Node.PROCESS_MODE_DISABLED
		player.collision_layer = 0
		rig.target = car


func add_money(v: int) -> void:
	money += v
	_save()


func _load_save() -> void:
	if FileAccess.file_exists(save_path):
		var d = JSON.parse_string(FileAccess.get_file_as_string(save_path))
		if d is Dictionary:
			money = int(d.get("money", 500))


func _save() -> void:
	var f = FileAccess.open(save_path, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify({"money": money}))


func focus() -> Vector3:
	return car.global_position if car else player.global_position


func _process(dt: float) -> void:
	t += dt
	_update_sky(dt)
	var fp = focus()
	streamer.update_focus(fp)
	var iv = Vector2(Input.get_axis("left", "right"), Input.get_axis("down", "up"))
	var joy = Vector2(Input.get_joy_axis(0, JOY_AXIS_LEFT_X), -Input.get_joy_axis(0, JOY_AXIS_LEFT_Y))
	if joy.length() > 0.2:
		iv = joy
	var rs = Vector2(Input.get_joy_axis(0, JOY_AXIS_RIGHT_X), Input.get_joy_axis(0, JOY_AXIS_RIGHT_Y))
	if rs.length() > 0.2:
		rig.mouse_look(rs * 12.0)
	if car:
		car.throttle = maxf(iv.y, Input.get_joy_axis(0, JOY_AXIS_TRIGGER_RIGHT))
		car.brake_in = maxf(-iv.y, Input.get_joy_axis(0, JOY_AXIS_TRIGGER_LEFT))
		car.steer_in = iv.x
		car.handbrake = Input.is_action_pressed("handbrake")
		car.set_lights(night)
		if car.impact > 4.0:
			rig.shake = minf(0.5, car.impact * 0.04)
			engine_audio.crash(car.impact)
		if car.health <= 0.0:
			hud.toast("💥 Barbaridade! Detonou o carro. Conserto: -R$ 250", "bad")
			add_money(-250)
			toggle_car_force_exit()
		engine_audio.update_engine(true, car.speed_kmh(), car.throttle, car.model)
	else:
		player.input_dir = iv
		player.running = Input.is_action_pressed("run")
		player.want_jump = Input.is_action_just_pressed("handbrake")
		player.cam_yaw = rig.yaw
		engine_audio.update_engine(false, 0, 0, "")
		var near = false
		for c in cars:
			if c.health > 0 and c.global_position.distance_to(player.global_position) < 4.0:
				near = true
		if near:
			hud.hint("[F] entrar no carro")
		elif traffic.has_near(player.global_position):
			hud.hint("[F] pegar este carro")
	# congela o jogador/carro até o bloco carregar (evita cair por buracos)
	var fwd = car.forward() if car else (-player.model.global_transform.basis.z)
	var st = {
		"pos": fp, "fwd": fwd, "cam_yaw": rig.yaw, "car": car, "kmh": car.speed_kmh() if car else 0.0,
		"money": money, "clock": clock(), "hood": city.hood_at(fp.x, fp.z), "street": city.street_name(fp.x, fp.z),
		"blips": missions.blips(),
	}
	hud.update(dt, st)


func toggle_car_force_exit() -> void:
	var c = car
	c.health = 0.0
	c.driven = false
	var out = c.global_position + c.global_transform.basis.x * (c.spec.W / 2 + 1.2)
	player.global_position = Vector3(out.x, 0.3, out.z)
	player.visible = true
	player.process_mode = Node.PROCESS_MODE_INHERIT
	player.collision_layer = 4
	rig.target = player
	car = null
	missions.fail("Missão falhou: o carro foi pro saco.")
