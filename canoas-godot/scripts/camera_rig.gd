class_name CameraRig
extends Node3D
## Câmera em terceira pessoa com SpringArm (não atravessa prédios), mouse, recentragem no carro.

var target: Node3D
var yaw := 0.0
var pitch := -0.25
var arm: SpringArm3D
var cam: Camera3D
var dist := 5.0
var height := 1.6
var last_mouse := -10.0
var mode := 0
var time := 0.0
var shake := 0.0


func _ready() -> void:
	arm = SpringArm3D.new()
	arm.collision_mask = 1
	arm.margin = 0.3
	var sph := SphereShape3D.new()
	sph.radius = 0.25
	arm.shape = sph
	add_child(arm)
	cam = Camera3D.new()
	cam.fov = 70
	cam.near = 0.1
	cam.far = 4000.0
	arm.add_child(cam)
	cam.current = true


func mouse_look(rel: Vector2) -> void:
	yaw -= rel.x * 0.0025
	pitch = clampf(pitch - rel.y * 0.002, -1.2, 0.35)
	last_mouse = time


func _process(dt: float) -> void:
	time += dt
	if target == null:
		return
	var car := target as Car
	var want_dist := 5.0
	var want_h := 1.6
	if car:
		var big: bool = car.model == "bus"
		want_dist = (14.0 if big else 6.2) + car.linear_velocity.length() * 0.05
		want_h = 3.2 if big else 1.4
		if mode == 1:
			want_dist *= 1.8
		if time - last_mouse > 1.4 and car.linear_velocity.length() > 2.0:
			var fwd := car.forward()
			var tyaw := atan2(-fwd.x, -fwd.z)
			if car.forward_speed() < -2.0:
				tyaw += PI
			yaw = lerp_angle(yaw, tyaw, dt * 3.0)
			pitch = lerpf(pitch, -0.18, dt * 2.0)
		cam.fov = lerpf(cam.fov, 70.0 + minf(car.speed_kmh() * 0.09, 16.0), dt * 3.0)
	else:
		want_dist = 4.2 if mode == 0 else 7.0
		cam.fov = lerpf(cam.fov, 70.0, dt * 3.0)
	dist = lerpf(dist, want_dist, dt * 4.0)
	height = lerpf(height, want_h, dt * 4.0)
	var tp := target.global_position + Vector3.UP * height
	global_position = global_position.lerp(tp, minf(1.0, dt * (14.0 if car else 18.0))) if global_position.distance_to(tp) < 30 else tp
	rotation = Vector3(pitch, yaw, 0)
	arm.spring_length = dist
	if shake > 0.01:
		cam.h_offset = randf_range(-shake, shake)
		cam.v_offset = randf_range(-shake, shake)
		shake *= 0.88
	else:
		cam.h_offset = 0
		cam.v_offset = 0
