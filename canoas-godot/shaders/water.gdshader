// Rios dos Sinos / Gravataí e arroios: ondas animadas, reflexo do céu.
shader_type spatial;
render_mode cull_disabled;

uniform sampler2D wave_a : hint_normal, filter_linear_mipmap, repeat_enable;
uniform sampler2D wave_b : hint_normal, filter_linear_mipmap, repeat_enable;
uniform vec3 deep = vec3(0.10, 0.17, 0.16);
uniform vec3 shallow = vec3(0.22, 0.30, 0.24);

varying vec3 wpos;

void vertex() { wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }

void fragment() {
	TANGENT = normalize((VIEW_MATRIX * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
	BINORMAL = normalize((VIEW_MATRIX * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
	vec2 p = wpos.xz;
	vec3 na = texture(wave_a, p * 0.025 + vec2(TIME * 0.012, TIME * 0.006)).rgb;
	vec3 nb = texture(wave_b, p * 0.06 - vec2(TIME * 0.02, -TIME * 0.011)).rgb;
	float fres = pow(1.0 - clamp(dot(NORMAL, normalize(-VERTEX)), 0.0, 1.0), 4.0);
	ALBEDO = mix(deep, shallow, 0.3 + 0.4 * fres);
	ROUGHNESS = 0.04;
	METALLIC = 0.05;
	SPECULAR = 0.7;
	NORMAL_MAP = normalize(na * 0.5 + nb * 0.5);
	NORMAL_MAP_DEPTH = 0.6;
}
