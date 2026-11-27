class_name Player
extends CharacterBody3D
## Personagem a pé: anda, corre, pula, com animação procedural de braços e pernas.

const WALK := 2.4
const RUN := 6.5
const JUMP := 4.8

var cam_yaw := 0.0
var parts := {}
var phase := 0.0
var model: Node3D
var input_dir := Vector2.ZERO
var running := false
var want_jump := false


func _ready() -> void:
	collision_layer = 4
	collision_mask = 1 | 2
	var cs := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 0.32
	cap.height = 1.75
	cs.shape = cap
	cs.position.y = 0.875
	add_child(cs)
	model = make_person(Color(0.04, 0.45, 0.2), Color(0.15, 0.16, 0.2), Color(0.78, 0.58, 0.44), Color(0.18, 0.11, 0.07))
	add_child(model)
	parts = model.get_meta("parts")


static func _limb(size: Vector3, m: Material, pivot: Vector3, parent: Node3D) -> Node3D:
	var p := Node3D.new()
	p.position = pivot
	parent.add_child(p)
	var mi := MeshInstance3D.new()
	var cm := CapsuleMesh.new()
	cm.radius = size.x
	cm.height = size.y
	mi.mesh = cm
	mi.position.y = -size.y / 2
	mi.material_override = m
	p.add_child(mi)
	return p


static func make_person(shirt: Color, pants: Color, skin: Color, hair: Color) -> Node3D:
	var root := Node3D.new()
	var ms := func(c: Color) -> StandardMaterial3D:
		var m := StandardMaterial3D.new()
		m.albedo_color = c
		m.roughness = 0.85
		return m
	var torso := MeshInstance3D.new()
	var tc := CapsuleMesh.new()
	tc.radius = 0.2
	tc.height = 0.72
	torso.mesh = tc
	torso.scale = Vector3(1.15, 1.0, 0.72)
	torso.position.y = 1.22
	torso.material_override = ms.call(shirt)
	root.add_child(torso)
	var head := MeshInstance3D.new()
	var hs := SphereMesh.new()
	hs.radius = 0.12
	hs.height = 0.27
	head.mesh = hs
	head.position.y = 1.7
	head.material_override = ms.call(skin)
	root.add_child(head)
	var hr := MeshInstance3D.new()
	var hrs := SphereMesh.new()
	hrs.radius = 0.125
	hrs.height = 0.16
	hr.mesh = hrs
	hr.position = Vector3(0, 1.76, 0.015)
	hr.material_override = ms.call(hair)
	root.add_child(hr)
	var parts := {}
	parts.la = _limb(Vector3(0.055, 0.62, 0), ms.call(shirt), Vector3(-0.25, 1.5, 0), root)
	parts.ra = _limb(Vector3(0.055, 0.62, 0), ms.call(shirt), Vector3(0.25, 1.5, 0), root)
	parts.ll = _limb(Vector3(0.075, 0.86, 0), ms.call(pants), Vector3(-0.1, 0.9, 0), root)
	parts.rl = _limb(Vector3(0.075, 0.86, 0), ms.call(pants), Vector3(0.1, 0.9, 0), root)
	for k in ["la", "ra"]:
		var hand := MeshInstance3D.new()
		var sm := SphereMesh.new()
		sm.radius = 0.05
		sm.height = 0.1
		hand.mesh = sm
		hand.position.y = -0.64
		hand.material_override = ms.call(skin)
		parts[k].add_child(hand)
	for k in ["ll", "rl"]:
		var shoe := MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = Vector3(0.11, 0.07, 0.24)
		shoe.mesh = bm
		shoe.position = Vector3(0, -0.88, -0.05)
		shoe.material_override = ms.call(Color(0.1, 0.1, 0.1))
		parts[k].add_child(shoe)
	for c in root.get_children():
		if c is GeometryInstance3D:
			c.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	root.set_meta("parts", parts)
	return root


static func animate(parts: Dictionary, phase: float, amt: float) -> void:
	var s := sin(phase) * amt
	parts.la.rotation.x = s
	parts.ra.rotation.x = -s
	parts.ll.rotation.x = -s * 0.9
	parts.rl.rotation.x = s * 0.9


func _physics_process(dt: float) -> void:
	var fwd := Vector3(sin(cam_yaw), 0, cos(cam_yaw)) * -1.0
	var right := Vector3(-fwd.z, 0, fwd.x)
	var dir := (fwd * input_dir.y + right * input_dir.x)
	if dir.length() > 1.0:
		dir = dir.normalized()
	var sp := RUN if running else WALK
	velocity.x = move_toward(velocity.x, dir.x * sp, dt * 30.0)
	velocity.z = move_toward(velocity.z, dir.z * sp, dt * 30.0)
	if not is_on_floor():
		velocity.y -= 9.81 * 1.6 * dt
	elif want_jump:
		velocity.y = JUMP
	want_jump = false
	move_and_slide()
	if global_position.y < -5:
		global_position.y = 1
	var hv := Vector2(velocity.x, velocity.z).length()
	if hv > 0.2:
		var target := atan2(-velocity.x, -velocity.z)
		model.rotation.y = lerp_angle(model.rotation.y, target, dt * 12.0)
		phase += dt * hv * 2.2
	animate(parts, phase, clampf(hv / RUN, 0.0, 1.0) * 0.9)
