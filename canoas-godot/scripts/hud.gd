class_name HUD
extends CanvasLayer
## Interface: minimapa giratório, velocímetro, dinheiro, relógio, bairro/rua, missões, avisos.

var city: City
var minimap: TextureRect
var mm_mat: ShaderMaterial
var blips_ctl: Control
var speedo: Control
var lbl_money: Label
var lbl_clock: Label
var lbl_place: Label
var lbl_street: Label
var mission_box: PanelContainer
var lbl_mission: RichTextLabel
var lbl_timer: Label
var toasts: VBoxContainer
var lbl_hint: Label
var hint_t = 0.0
var big_map: TextureRect
var big_overlay: Control
var state = {}
var font: Font


func setup(c: City, mm_tex: Texture2D) -> void:
	city = c
	font = SystemFont.new()
	font.font_names = PackedStringArray(["Rajdhani", "Bahnschrift", "DejaVu Sans Condensed", "Arial Narrow", "sans-serif"])
	font.font_weight = 650
	var root = Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	# minimapa
	minimap = TextureRect.new()
	minimap.texture = mm_tex
	minimap.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	minimap.size = Vector2(240, 240)
	minimap.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	minimap.position = Vector2(24, -264)
	mm_mat = ShaderMaterial.new()
	mm_mat.shader = load("res://shaders/minimap.gdshader")
	minimap.material = mm_mat
	root.add_child(minimap)
	blips_ctl = Control.new()
	blips_ctl.size = Vector2(240, 240)
	blips_ctl.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	blips_ctl.position = Vector2(24, -264)
	blips_ctl.mouse_filter = Control.MOUSE_FILTER_IGNORE
	blips_ctl.draw.connect(_draw_blips)
	root.add_child(blips_ctl)
	lbl_place = _label(root, 30, Color(1, 0.82, 0.12))
	lbl_place.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	lbl_place.position = Vector2(284, -96)
	lbl_street = _label(root, 22, Color(1, 1, 1))
	lbl_street.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	lbl_street.position = Vector2(284, -58)
	lbl_money = _label(root, 40, Color(0.45, 1, 0.55))
	lbl_money.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	lbl_money.position = Vector2(-300, 18)
	lbl_money.size = Vector2(280, 50)
	lbl_money.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	lbl_clock = _label(root, 26, Color(1, 1, 1))
	lbl_clock.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	lbl_clock.position = Vector2(-300, 66)
	lbl_clock.size = Vector2(280, 34)
	lbl_clock.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	speedo = Control.new()
	speedo.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	speedo.position = Vector2(-280, -230)
	speedo.size = Vector2(260, 210)
	speedo.draw.connect(_draw_speedo)
	root.add_child(speedo)
	mission_box = PanelContainer.new()
	mission_box.set_anchors_preset(Control.PRESET_CENTER_TOP)
	mission_box.position = Vector2(-300, 16)
	mission_box.custom_minimum_size = Vector2(600, 0)
	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.04, 0.05, 0.07, 0.72)
	sb.border_width_left = 5
	sb.border_color = Color(1, 0.82, 0.12)
	sb.content_margin_left = 16; sb.content_margin_right = 16; sb.content_margin_top = 10; sb.content_margin_bottom = 10
	sb.corner_radius_top_right = 6; sb.corner_radius_bottom_right = 6
	mission_box.add_theme_stylebox_override("panel", sb)
	lbl_mission = RichTextLabel.new()
	lbl_mission.bbcode_enabled = true
	lbl_mission.fit_content = true
	lbl_mission.add_theme_font_override("normal_font", font)
	lbl_mission.add_theme_font_override("bold_font", font)
	lbl_mission.add_theme_font_size_override("normal_font_size", 22)
	lbl_mission.add_theme_font_size_override("bold_font_size", 22)
	mission_box.add_child(lbl_mission)
	mission_box.visible = false
	root.add_child(mission_box)
	lbl_timer = _label(root, 46, Color(1, 1, 1))
	lbl_timer.set_anchors_preset(Control.PRESET_CENTER_TOP)
	lbl_timer.position = Vector2(-100, 150)
	lbl_timer.size = Vector2(200, 60)
	lbl_timer.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl_timer.visible = false
	toasts = VBoxContainer.new()
	toasts.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	toasts.position = Vector2(-620, 110)
	toasts.size = Vector2(600, 400)
	toasts.alignment = BoxContainer.ALIGNMENT_BEGIN
	root.add_child(toasts)
	lbl_hint = _label(root, 24, Color(1, 1, 1))
	lbl_hint.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	lbl_hint.position = Vector2(-300, -300)
	lbl_hint.size = Vector2(600, 40)
	lbl_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	# mapa grande
	big_map = TextureRect.new()
	big_map.texture = mm_tex
	big_map.set_anchors_preset(Control.PRESET_FULL_RECT)
	big_map.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	big_map.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	big_map.visible = false
	root.add_child(big_map)
	big_overlay = Control.new()
	big_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	big_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	big_overlay.visible = false
	big_overlay.draw.connect(_draw_big)
	root.add_child(big_overlay)


func _label(parent: Control, size: int, col: Color) -> Label:
	var l = Label.new()
	l.add_theme_font_override("font", font)
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.85))
	l.add_theme_constant_override("outline_size", 6)
	parent.add_child(l)
	return l


func toast(text: String, kind := "") -> void:
	var l = _label(toasts, 22, Color(1, 1, 1) if kind == "" else (Color(0.5, 1, 0.6) if kind == "good" else Color(1, 0.55, 0.5)))
	l.text = text
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	l.autowrap_mode = TextServer.AUTOWRAP_WORD
	l.custom_minimum_size = Vector2(600, 0)
	var tw = l.create_tween()
	tw.tween_interval(4.0)
	tw.tween_property(l, "modulate:a", 0.0, 0.8)
	tw.tween_callback(l.queue_free)


func hint(text: String) -> void:
	lbl_hint.text = text
	hint_t = 0.2


func mission(title: String, text: String) -> void:
	if title == "":
		mission_box.visible = false
		lbl_timer.visible = false
		return
	mission_box.visible = true
	lbl_mission.text = "[color=#ffd21f][b]%s[/b][/color]\n%s\n[color=#999][font_size=16]X para cancelar[/font_size][/color]" % [title.to_upper(), text]


func timer(t: float) -> void:
	lbl_timer.visible = true
	lbl_timer.text = "%d:%02d" % [int(maxf(t, 0)) / 60, int(maxf(t, 0)) % 60]
	lbl_timer.add_theme_color_override("font_color", Color(1, 0.3, 0.3) if t < 10 else Color(1, 1, 1))


func toggle_map() -> bool:
	big_map.visible = not big_map.visible
	big_overlay.visible = big_map.visible
	return big_map.visible


func update(dt: float, st: Dictionary) -> void:
	state = st
	if hint_t > 0:
		hint_t -= dt
	else:
		lbl_hint.text = ""
	lbl_money.text = "R$ %s" % _fmt(st.money)
	lbl_clock.text = st.clock
	lbl_place.text = st.hood
	lbl_street.text = st.street
	var mm: Dictionary = city.meta.minimap
	var p: Vector3 = st.pos
	var uv = Vector2((p.x - mm.x0) / (mm.px * mm.w), (p.z - mm.z0) / (mm.px * mm.h))
	var zoom: float = 0.05 if st.car == null else lerpf(0.06, 0.12, clampf(st.kmh / 140.0, 0.0, 1.0))
	mm_mat.set_shader_parameter("center", uv)
	mm_mat.set_shader_parameter("zoom", zoom)
	mm_mat.set_shader_parameter("rot", st.cam_yaw)
	mm_mat.set_shader_parameter("aspect", float(mm.w) / float(mm.h))
	blips_ctl.queue_redraw()
	speedo.visible = st.car != null
	if speedo.visible:
		speedo.queue_redraw()
	if big_overlay.visible:
		big_overlay.queue_redraw()


func _fmt(v: int) -> String:
	var s = str(absi(v))
	var out = ""
	while s.length() > 3:
		out = "." + s.substr(s.length() - 3) + out
		s = s.substr(0, s.length() - 3)
	return ("-" if v < 0 else "") + s + out


func _world_to_mini(w: Vector3) -> Vector2:
	var mm: Dictionary = city.meta.minimap
	var p: Vector3 = state.pos
	var span: float = mm.px * mm.w * mm_mat.get_shader_parameter("zoom")
	var d = Vector2(w.x - p.x, w.z - p.z) / span * 240.0
	d = d.rotated(state.cam_yaw)
	return Vector2(120, 120) + d


func _draw_blips() -> void:
	if state.is_empty():
		return
	for b in state.blips:
		var q = _world_to_mini(b.p)
		var v = q - Vector2(120, 120)
		var edge = v.length() > 104
		if edge:
			q = Vector2(120, 120) + v.normalized() * 104
		blips_ctl.draw_circle(q, (5.0 if edge else b.get("r", 6.0)) + 2, Color(0, 0, 0))
		blips_ctl.draw_circle(q, 5.0 if edge else b.get("r", 6.0), b.c)
	# jogador
	var f: Vector3 = state.fwd
	var ang = Vector2(f.x, f.z).rotated(state.cam_yaw).angle() + PI / 2
	var tri = PackedVector2Array([Vector2(0, -11), Vector2(7, 8), Vector2(0, 4), Vector2(-7, 8)])
	var t2 = PackedVector2Array()
	for v in tri:
		t2.append(Vector2(120, 120) + v.rotated(ang))
	blips_ctl.draw_colored_polygon(t2, Color(1, 1, 1))
	blips_ctl.draw_polyline(t2 + PackedVector2Array([t2[0]]), Color(0, 0, 0), 2.0)
	var npos = Vector2(120, 120) + Vector2(0, -106).rotated(state.cam_yaw)
	blips_ctl.draw_string(font, npos + Vector2(-6, 7), "N", HORIZONTAL_ALIGNMENT_CENTER, -1, 18, Color(1, 1, 1))
	blips_ctl.draw_arc(Vector2(120, 120), 118, 0, TAU, 64, Color(1, 1, 1, 0.7), 3.0)


func _draw_speedo() -> void:
	var car = state.get("car")
	if car == null:
		return
	var c = Vector2(130, 120)
	var r = 95.0
	var a0 = PI * 0.75
	var a1 = PI * 2.25
	speedo.draw_arc(c, r, a0, a1, 48, Color(1, 1, 1, 0.15), 12.0)
	var k = clampf(state.kmh / 220.0, 0.0, 1.0)
	var col = Color(0.3, 1, 0.6).lerp(Color(1, 0.8, 0.1), clampf(k * 1.6, 0, 1)).lerp(Color(1, 0.25, 0.2), clampf((k - 0.6) * 2.5, 0, 1))
	speedo.draw_arc(c, r, a0, a0 + (a1 - a0) * k, 48, col, 12.0)
	for i in range(0, 221, 20):
		var a = a0 + (a1 - a0) * i / 220.0
		speedo.draw_line(c + Vector2(cos(a), sin(a)) * (r - 18), c + Vector2(cos(a), sin(a)) * (r - 10), Color(1, 1, 1, 0.6), 2)
	speedo.draw_string(font, c + Vector2(-60, 14), "%d" % int(state.kmh), HORIZONTAL_ALIGNMENT_CENTER, 120, 54, Color(1, 1, 1))
	speedo.draw_string(font, c + Vector2(-60, 40), "km/h", HORIZONTAL_ALIGNMENT_CENTER, 120, 18, Color(0.8, 0.8, 0.8))
	speedo.draw_string(font, c + Vector2(-100, 90), car.spec.name, HORIZONTAL_ALIGNMENT_CENTER, 200, 18, Color(0.85, 0.85, 0.85))
	speedo.draw_rect(Rect2(c + Vector2(-50, 52), Vector2(100, 7)), Color(1, 1, 1, 0.15))
	var h: float = car.health
	speedo.draw_rect(Rect2(c + Vector2(-50, 52), Vector2(h, 7)), Color(0.3, 1, 0.5) if h > 50 else (Color(1, 0.8, 0.1) if h > 25 else Color(1, 0.3, 0.2)))


func _draw_big() -> void:
	var mm: Dictionary = city.meta.minimap
	var vs = big_overlay.size
	var k = minf(vs.x / mm.w, vs.y / mm.h)
	var off = (vs - Vector2(mm.w, mm.h) * k) / 2
	var T = func(x: float, z: float) -> Vector2:
		return off + Vector2((x - mm.x0) / mm.px, (z - mm.z0) / mm.px) * k
	big_overlay.draw_rect(Rect2(Vector2.ZERO, vs), Color(0, 0, 0, 0.0))
	for h in city.hoods:
		var poly: PackedVector2Array = h[1]
		var cx = Vector2.ZERO
		for v in poly:
			cx += v
		cx /= max(1, poly.size())
		big_overlay.draw_string(font, T.call(cx.x, cx.y) - Vector2(80, 0), String(h[0]).to_upper(), HORIZONTAL_ALIGNMENT_CENTER, 160, 15, Color(1, 1, 1, 0.75))
	for b in state.get("blips", []):
		var q: Vector2 = T.call(b.p.x, b.p.z)
		big_overlay.draw_circle(q, 7, Color(0, 0, 0))
		big_overlay.draw_circle(q, 5, b.c)
	var p: Vector3 = state.pos
	var q: Vector2 = T.call(p.x, p.z)
	var tri = PackedVector2Array([Vector2(0, -13), Vector2(8, 9), Vector2(0, 4), Vector2(-8, 9)])
	var t2 = PackedVector2Array()
	for v in tri:
		t2.append(q + v.rotated(Vector2(state.fwd.x, state.fwd.z).angle() + PI / 2))
	big_overlay.draw_colored_polygon(t2, Color(1, 1, 1))
	big_overlay.draw_string(font, Vector2(30, 46), "CANOAS — RS", HORIZONTAL_ALIGNMENT_LEFT, -1, 34, Color(1, 1, 1))
	big_overlay.draw_string(font, Vector2(30, 74), "Mapa real: © OpenStreetMap, Overture Maps  ·  M para fechar", HORIZONTAL_ALIGNMENT_LEFT, -1, 17, Color(0.8, 0.8, 0.8))
