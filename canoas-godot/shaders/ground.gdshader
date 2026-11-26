// Chão: grama / terra misturadas por ruído, áreas verdes coloridas pelo tipo (UV2.x),
// calçadas e trilho usam o mesmo shader com "mode".
shader_type spatial;

uniform sampler2D tex_a : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D nor_a : hint_normal, filter_linear_mipmap, repeat_enable;
uniform sampler2D tex_b : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D noise : filter_linear, repeat_enable;
uniform sampler2D mask : filter_linear;
uniform sampler2D tex_c : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform vec4 mask_rect = vec4(-10000.0, -10000.0, 20000.0, 20000.0);
uniform float scale_a = 0.25;
uniform float scale_b = 0.15;
uniform int mode = 0; // 0 chão, 1 área verde, 2 calçada, 3 trilho
uniform vec3 tint = vec3(1.0);

varying vec3 wpos;
varying vec2 info;

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	info = UV2;
}

void fragment() {
	TANGENT = normalize((VIEW_MATRIX * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
	BINORMAL = normalize((VIEW_MATRIX * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
	vec2 p = wpos.xz;
	vec3 a = texture(tex_a, p * scale_a).rgb;
	vec3 b = texture(tex_b, p * scale_b).rgb;
	float n = texture(noise, p * 0.004).r;
	float n2 = texture(noise, p * 0.03 + 0.5).r;
	vec3 col;
	float rough = 0.95;
	if (mode == 0) {
		col = mix(a, b, smoothstep(0.35, 0.75, n * 0.7 + n2 * 0.4));
		col *= tint * (0.85 + 0.3 * n2);
		// dentro da cidade: terra batida, concreto e pouca grama
		vec2 muv = (p - mask_rect.xy) / mask_rect.zw;
		vec3 mc = texture(mask, muv).rgb;
		float urban = smoothstep(-0.01, 0.06, mc.b - mc.g) * step(0.0, muv.x) * step(muv.x, 1.0) * step(0.0, muv.y) * step(muv.y, 1.0);
		vec3 c = texture(tex_c, p * 0.18).rgb;
		vec3 dirt = b * vec3(0.95, 0.88, 0.78);
		vec3 urb = mix(c * 0.85, dirt, smoothstep(0.3, 0.7, n2));
		urb = mix(urb, a * 0.9, smoothstep(0.62, 0.8, n) * 0.6);
		col = mix(col, urb, urban);
	} else if (mode == 1) {
		float k = info.x;
		col = a * tint;
		if (k > 1.5 && k < 2.5) col = a * vec3(0.75, 1.15, 0.7);        // campo de futebol
		else if (k > 3.5 && k < 4.5) col = mix(a, b, 0.5);              // cemitério
		else if (k > 4.5 && k < 5.5) col = a * vec3(0.55, 0.75, 0.5);   // mata
		else if (k > 5.5 && k < 6.5) col = a * vec3(0.6, 0.75, 0.55);   // banhado
		else if (k > 6.5 && k < 7.5) col = mix(a, b, 0.6) * vec3(1.05, 1.0, 0.8); // lavoura
		else if (k > 7.5) col = b;                                     // terra
		col *= 0.85 + 0.3 * n2;
	} else if (mode == 2) {
		col = a * tint * (0.9 + 0.2 * n2);
		rough = 0.9;
	} else {
		col = a * 0.8;
		float x = UV.x;
		float rails = smoothstep(0.03, 0.0, abs(x - 0.33)) + smoothstep(0.03, 0.0, abs(x - 0.67));
		float sleepers = step(fract(UV.y / 0.6), 0.35) * step(0.2, x) * step(x, 0.8);
		col = mix(col, vec3(0.32, 0.27, 0.22), sleepers * 0.8);
		col = mix(col, vec3(0.62, 0.62, 0.64), clamp(rails, 0.0, 1.0));
		rough = mix(0.95, 0.25, clamp(rails, 0.0, 1.0));
	}
	ALBEDO = col;
	ROUGHNESS = rough;
	NORMAL_MAP = texture(nor_a, p * scale_a).rgb;
	NORMAL_MAP_DEPTH = 0.7;
}
