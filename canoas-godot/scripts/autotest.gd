extends Node
## Teste automático (só roda com: -- --shot=<pasta>). Joga um roteiro e salva capturas.

var game
var dir := ""
var t := 0.0
var step := 0
var log_lines: PackedStringArray = []


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS


func _shot(name: String) -> void:
	var img := get_viewport().get_texture().get_image()
	img.save_png(dir + "/" + name + ".png")
	var fp: Vector3 = game.focus()
	log_lines.append("%s t=%.1f pos=%s hood=%s street=%s fps=%d chunks=%d car=%s kmh=%.0f" % [name, t, str(fp.snapped(Vector3.ONE)), game.city.hood_at(fp.x, fp.z), game.city.street_name(fp.x, fp.z), Engine.get_frames_per_second(), game.streamer.loaded.size(), str(game.car.model if game.car else "-"), game.car.speed_kmh() if game.car else 0.0])
	print(log_lines[-1])


func _process(dt: float) -> void:
	t += dt
	match step:
		0:
			if t > 12.0:
				_shot("01_a_pe"); step += 1
		1:
			game.toggle_car()
			step += 1
		2:
			if t > 14.0:
				_shot("02_no_carro"); step += 1
				Input.action_press("up")
		3:
			if t > 22.0:
				_shot("03_dirigindo"); step += 1
				Input.action_release("up")
				Input.action_press("down")
		4:
			if t > 25.0:
				Input.action_release("down")
				game.hour = 18.4
				step += 1
		5:
			if t > 28.0:
				_shot("04_por_do_sol"); step += 1
				game.hour = 21.5
		6:
			if t > 31.0:
				_shot("05_noite"); step += 1
				game.hour = 11.0
				game.rig.pitch = -0.75
				game.rig.mode = 1
		7:
			if t > 34.0:
				_shot("06_vista_alta"); step += 1
				game.map_open = game.hud.toggle_map()
		8:
			if t > 35.5:
				_shot("07_mapa"); step += 1
				FileAccess.open(dir + "/log.txt", FileAccess.WRITE).store_string("\n".join(log_lines))
				get_tree().quit()
