// Prédios: reboco/tijolo/concreto em coordenadas de mundo, janelas procedurais
// (acesas à noite), telhado de barro nas casas e laje nos prédios.
shader_type spatial;
render_mode cull_back;

uniform sampler2D plaster_tex : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D plaster_nor : hint_normal, filter_linear_mipmap, repeat_enable;
uniform sampler2D brick_tex : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D concrete_tex : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D roof_tex : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D roof_nor : hint_normal, filter_linear_mipmap, repeat_enable;
uniform float night = 0.0;

varying vec3 wpos;
varying vec2 st;

float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

const vec3 PAL_HOUSE[10] = vec3[](vec3(0.93, 0.89, 0.80), vec3(0.95, 0.85, 0.62), vec3(0.86, 0.90, 0.78),
	vec3(0.95, 0.80, 0.72), vec3(0.78, 0.86, 0.92), vec3(0.97, 0.95, 0.90), vec3(0.92, 0.78, 0.48),
	vec3(0.82, 0.70, 0.62), vec3(0.70, 0.80, 0.66), vec3(0.88, 0.62, 0.50));
const vec3 PAL_TALL[6] = vec3[](vec3(0.88, 0.87, 0.84), vec3(0.78, 0.78, 0.78), vec3(0.85, 0.80, 0.70),
	vec3(0.70, 0.72, 0.75), vec3(0.93, 0.92, 0.88), vec3(0.62, 0.58, 0.55));

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	st = UV2;
}

void fragment() {
	vec3 vn = normalize(cross(dFdx(VERTEX), dFdy(VERTEX)));
	if (dot(vn, -VERTEX) < 0.0) vn = -vn;
	vec3 wn = normalize((INV_VIEW_MATRIX * vec4(vn, 0.0)).xyz);
	float style = st.x;
	float H = st.y;
	bool tile_roof = H < 0.0;
	bool tall = H > 13.0;
	float is_wall = 1.0 - step(0.55, abs(wn.y));
	vec3 col;
	float rough = 0.85;
	float metal = 0.0;
	vec3 emis = vec3(0.0);
	vec3 nmap = vec3(0.5, 0.5, 1.0);
	if (tile_roof) {
		vec2 ruv = wpos.xz * 0.45;
		col = texture(roof_tex, ruv).rgb * mix(vec3(1.0), vec3(0.75, 0.72, 0.7), step(0.8, style));
		nmap = texture(roof_nor, ruv).rgb;
		rough = 0.7;
	} else if (is_wall < 0.5) {
		// laje / telhado plano
		col = texture(concrete_tex, wpos.xz * 0.12).rgb * 0.62;
		rough = 0.95;
	} else {
		vec2 t = vec2(-wn.z, wn.x);
		float u = dot(wpos.xz, t);
		float v = wpos.y;
		vec2 tuv = vec2(u, v) * 0.33;
		vec3 base;
		if (tall) {
			base = PAL_TALL[int(style * 6.0) % 6];
		} else {
			base = PAL_HOUSE[int(style * 10.0) % 10];
		}
		vec3 tex = texture(plaster_tex, tuv).rgb;
		col = base * (0.55 + 0.6 * tex);
		if (fract(style * 7.3) < 0.14 && !tall) col = texture(brick_tex, tuv * 0.8).rgb * 1.1; // tijolo à vista
		nmap = texture(plaster_nor, tuv).rgb;
		// janelas
		float fh = 3.1;
		float ws = tall ? 2.6 : 3.4;
		vec2 cell = vec2(u / ws, (v - 0.9) / fh);
		vec2 f = fract(cell);
		float win = step(0.2, f.x) * step(f.x, 0.8) * step(0.3, f.y) * step(f.y, 0.85);
		win *= step(1.0, v) * step(v, H - 0.6);
		if (!tall) win *= step(0.25, h21(floor(cell) + style * 13.0));
		bool curtain = tall && fract(style * 3.7) < 0.28;
		if (curtain) win = step(1.0, v) * step(v, H - 0.4) * (1.0 - step(0.94, f.y));
		vec2 wid = floor(cell) + floor(wpos.xz / 40.0) * 3.0 + style * 50.0;
		float r = h21(wid);
		vec3 glass = mix(vec3(0.05, 0.07, 0.09), vec3(0.22, 0.28, 0.34), r * 0.7);
		if (curtain) glass = mix(vec3(0.12, 0.22, 0.30), vec3(0.20, 0.30, 0.36), r * 0.4);
		// moldura escura e base
		col = mix(col, glass, win);
		rough = mix(rough, 0.22, win);
		metal = mix(0.0, 0.12, win);
		nmap = mix(nmap, vec3(0.5, 0.5, 1.0), win);
		col *= mix(0.78, 1.0, smoothstep(0.0, 1.2, v));
		float lit = step(0.66, h21(wid + 4.1));
		vec3 wc = mix(vec3(1.0, 0.72, 0.42), vec3(0.75, 0.85, 1.0), step(0.78, h21(wid + 9.3)));
		emis = win * lit * night * wc * 1.3;
	}
	ALBEDO = col;
	ROUGHNESS = rough;
	METALLIC = metal;
	NORMAL = vn;
	if (is_wall > 0.5 && !tile_roof) {
		vec3 tw = vec3(-wn.z, 0.0, wn.x);
		TANGENT = normalize((VIEW_MATRIX * vec4(tw, 0.0)).xyz);
		BINORMAL = normalize((VIEW_MATRIX * vec4(0.0, -1.0, 0.0, 0.0)).xyz);
	} else {
		TANGENT = normalize((VIEW_MATRIX * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
		BINORMAL = normalize(cross(vn, TANGENT));
	}
	NORMAL_MAP = nmap;
	NORMAL_MAP_DEPTH = 0.6;
	EMISSION = emis;
}
