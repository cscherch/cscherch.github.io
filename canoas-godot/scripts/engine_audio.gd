class_name EngineAudio
extends Node
## Sons sintetizados em tempo real: motor (RPM com troca de marchas), buzina, batida.

var player: AudioStreamPlayer
var pb: AudioStreamGeneratorPlayback
var rate := 22050.0
var phase := 0.0
var phase2 := 0.0
var rpm := 0.0
var on := false
var throttle := 0.0
var vol := 0.0
var horn_t := 0.0
var crash_t := 0.0
var crash_amp := 0.0
var far_horn_t := 0.0
var beat := 0.0
var character := 1.0


func _ready() -> void:
	player = AudioStreamPlayer.new()
	var gen := AudioStreamGenerator.new()
	gen.mix_rate = rate
	gen.buffer_length = 0.12
	player.stream = gen
	player.volume_db = -6.0
	add_child(player)
	player.play()
	pb = player.get_stream_playback()


func update_engine(is_on: bool, kmh: float, thr: float, model: String) -> void:
	on = is_on
	throttle = thr
	var gear := mini(5, int(kmh / 32.0))
	var g_lo := gear * 32.0
	var frac := clampf((kmh - g_lo) / 32.0, 0.0, 1.0)
	var target := 900.0 + frac * 4200.0 + gear * 300.0
	if kmh < 3:
		target = 850.0 + thr * 1800.0
	rpm = lerpf(rpm, target, 0.12)
	character = 0.6 if model == "fusca" or model == "kombi" else (0.8 if model == "opala" else 1.0)


func horn() -> void:
	horn_t = 0.45


func horn_far() -> void:
	far_horn_t = 0.3


func crash(power: float) -> void:
	crash_t = 0.35
	crash_amp = clampf(power * 0.05, 0.2, 0.9)


func _process(_dt: float) -> void:
	if pb == null:
		return
	var n := pb.get_frames_available()
	var target_vol := (0.16 + throttle * 0.14) if on else 0.0
	var f0 := rpm / 60.0 * 2.0 * character # pulsos de ignição (4 cilindros)
	for i in n:
		vol = lerpf(vol, target_vol, 0.0008)
		phase = fmod(phase + f0 / rate, 1.0)
		phase2 = fmod(phase2 + f0 * 0.5 / rate, 1.0)
		var s := 0.0
		if vol > 0.001:
			var saw := phase * 2.0 - 1.0
			var pulse := 1.0 if phase < 0.35 else -0.4
			s = (saw * 0.35 + pulse * 0.45 + sin(phase2 * TAU) * 0.4) * vol
			s += (randf() - 0.5) * 0.04 * vol * (1.0 + throttle)
		if horn_t > 0.0:
			horn_t -= 1.0 / rate
			beat += 1.0 / rate
			s += (sign(sin(beat * TAU * 392.0)) + sign(sin(beat * TAU * 494.0))) * 0.06
		if far_horn_t > 0.0:
			far_horn_t -= 1.0 / rate
			beat += 1.0 / rate
			s += (sign(sin(beat * TAU * 330.0)) + sign(sin(beat * TAU * 415.0))) * 0.015
		if crash_t > 0.0:
			crash_t -= 1.0 / rate
			s += (randf() - 0.5) * crash_amp * (crash_t / 0.35)
		s = clampf(s, -1.0, 1.0)
		pb.push_frame(Vector2(s, s))
