class_name Car
extends VehicleBody3D
## Carro com física de suspensão (VehicleBody3D): tração, freio, freio de mão com drift,
## direção sensível à velocidade, dano, faróis.

var model := "gol"
var spec: Dictionary
var wheels: Array[VehicleWheel3D] = []
var driven := false
var ai := false
var health := 100.0
var throttle := 0.0
var brake_in := 0.0
var steer_in := 0.0
var handbrake := false
var headlights: Array[SpotLight3D] = []
var siren: Node3D
var last_vel := Vector3.ZERO
var impact := 0.0


static func create(model_name: String, color = null) -> Car:
	var c := Car.new()
	c.model = model_name
	c.spec = CarBuilder.MODELS[model_name]
	var col: Color
	if color == null:
		var cols: Array = c.spec.colors
		col = cols[randi() % cols.size()]
	else:
		col = color
	c._assemble(col)
	return c


func _assemble(col: Color) -> void:
	var L: float = spec.L
	var W: float = spec.W
	mass = spec.mass
	collision_layer = 2
	collision_mask = 1 | 2 | 4
	center_of_mass_mode = RigidBody3D.CENTER_OF_MASS_MODE_CUSTOM
	center_of_mass = Vector3(0, 0.25 if model != "bus" else 0.6, 0.05 * L)
	continuous_cd = true
	var body := CarBuilder.build_body(model, col)
	body.name = "Body"
	body.rotation.y = PI # VehicleBody3D anda para +Z
	add_child(body)
	siren = body.get_node_or_null("Siren")
	# colisão: caixa inferior + cabine
	var top := 0.0
	for p in spec.profile:
		top = max(top, p[1])
	var cs := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(W, spec.belt - 0.3, L)
	cs.shape = box
	cs.position = Vector3(0, 0.3 + (spec.belt - 0.3) / 2, 0)
	add_child(cs)
	var cs2 := CollisionShape3D.new()
	var box2 := BoxShape3D.new()
	box2.size = Vector3(W * 0.85, top - spec.belt, L * 0.5)
	cs2.shape = box2
	cs2.position = Vector3(0, spec.belt + (top - spec.belt) / 2, 0)
	add_child(cs2)
	var r: float = spec.wheel_r
	var track: float = spec.track
	var i := 0
	for x in spec.wx:
		for s in [-1.0, 1.0]:
			var w := VehicleWheel3D.new()
			w.position = Vector3(s * track, r + 0.05, x)
			w.wheel_radius = r
			w.wheel_rest_length = 0.16
			w.suspension_travel = 0.18
			w.suspension_stiffness = 38.0 if model != "bus" else 60.0
			w.suspension_max_force = mass * 12.0
			w.damping_compression = 2.2
			w.damping_relaxation = 2.8
			w.wheel_friction_slip = 2.6
			w.wheel_roll_influence = 0.12
			var front: bool = x > 0
			w.use_as_steering = front
			# Fusca e Kombi: tração traseira; demais: dianteira; Opala traseira
			if model in ["fusca", "kombi", "opala", "bus", "police"]:
				w.use_as_traction = not front
			else:
				w.use_as_traction = front
			w.add_child(CarBuilder.wheel_mesh(r, 0.2 if model != "bus" else 0.3))
			add_child(w)
			wheels.append(w)
			i += 1


func setup_headlights() -> void:
	if headlights.size() > 0:
		return
	for s in [-1.0, 1.0]:
		var l := SpotLight3D.new()
		l.position = Vector3(s * (spec.W / 2 - 0.3), 0.75, spec.L / 2 + 0.1)
		l.rotation.y = PI
		l.spot_range = 70.0
		l.spot_angle = 32.0
		l.spot_attenuation = 0.6
		l.light_energy = 0.0
		l.light_color = Color(1, 0.95, 0.85)
		l.shadow_enabled = false
		l.rotation.x = -0.06
		add_child(l)
		headlights.append(l)


func set_lights(night: float) -> void:
	for l in headlights:
		l.light_energy = 6.0 * night if driven else 0.0


func speed_kmh() -> float:
	return linear_velocity.length() * 3.6


func forward_speed() -> float:
	return global_transform.basis.z.dot(linear_velocity)


func _physics_process(dt: float) -> void:
	var spd := forward_speed()
	var kmh := absf(spd) * 3.6
	var top: float = spec.top
	if health <= 0.0:
		throttle = 0.0
	# motor: força cai com a velocidade (curva simples) e corta na máxima
	var force := 0.0
	if throttle > 0.0:
		var k := clampf(1.0 - kmh / top, 0.0, 1.0)
		force = spec.power * throttle * (0.35 + 0.65 * k) * (0.6 if health < 30 else 1.0)
		if kmh > top:
			force = 0.0
	var brk := 0.0
	if brake_in > 0.0:
		if spd > 1.5:
			brk = brake_in * mass * 0.035
		else:
			force = -spec.power * 0.55 * brake_in if kmh < 30 else 0.0
	engine_force = force
	brake = brk + (0.0 if throttle > 0 or brake_in > 0 else mass * 0.0015)
	# direção sensível à velocidade
	var max_steer := lerpf(0.62, 0.14, clampf(kmh / 150.0, 0.0, 1.0))
	steering = move_toward(steering, -steer_in * max_steer, dt * 2.6)
	for w in wheels:
		var rear := not w.use_as_steering
		if handbrake and rear:
			w.brake = mass * 0.05
			w.wheel_friction_slip = 1.1
		else:
			w.brake = brk / 4.0
			w.wheel_friction_slip = 2.6 if not rear else 2.4
	# arrasto aerodinâmico e anti-capotamento leve
	apply_central_force(-linear_velocity * linear_velocity.length() * 0.42)
	var up := global_transform.basis.y
	if up.y < 0.6:
		apply_torque(up.cross(Vector3.UP) * mass * 8.0)
	# luz de freio
	CarBuilder.tail_mat.emission_energy_multiplier = 0.6
	# impacto
	var dv := (linear_velocity - last_vel).length()
	impact = dv if dv > 6.0 else 0.0
	if impact > 0.0 and driven:
		health = maxf(0.0, health - impact * 2.2)
	last_vel = linear_velocity
	if siren:
		siren.visible = fmod(Time.get_ticks_msec() / 250.0, 2.0) < 1.0


## orienta o carro para olhar na direção dada (frente = +Z)
func face(dir: Vector3) -> void:
	dir.y = 0
	if dir.length() < 0.01:
		return
	global_transform.basis = Basis.looking_at(-dir.normalized(), Vector3.UP)


func forward() -> Vector3:
	return global_transform.basis.z


func reset_upright() -> void:
	var t := global_transform
	var fwd := t.basis.z
	fwd.y = 0
	if fwd.length() < 0.1:
		fwd = Vector3.FORWARD
	global_transform = Transform3D(Basis.looking_at(-fwd.normalized(), Vector3.UP), t.origin + Vector3.UP * 1.2)
	linear_velocity = Vector3.ZERO
	angular_velocity = Vector3.ZERO
