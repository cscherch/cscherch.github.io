// Asfalto com faixas: UV.x = 0..1 na largura, UV.y = metros ao longo da via.
// UV2.x = classe (+0.5 se mão única, + largura/2000), UV2.y = comprimento do trecho.
shader_type spatial;

uniform sampler2D asphalt_tex : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D asphalt_nor : hint_normal, filter_linear_mipmap, repeat_enable;
uniform sampler2D asphalt_rough : hint_roughness_g, filter_linear_mipmap, repeat_enable;
uniform float wet = 0.0;

varying vec3 wpos;
varying vec2 info;

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	info = UV2;
}

float band(float x, float c, float w) { return 1.0 - smoothstep(w * 0.5, w * 0.5 + 0.01, abs(x - c)); }

void fragment() {
	TANGENT = normalize((VIEW_MATRIX * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
	BINORMAL = normalize((VIEW_MATRIX * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
	float cid = floor(info.x + 0.001);
	float fr = info.x - cid;
	bool oneway = fr >= 0.5;
	float width = (fr - (oneway ? 0.5 : 0.0)) * 2000.0;
	width = max(width, 4.0);
	float along = UV.y;
	float total = info.y;
	vec2 tuv = wpos.xz * 0.22;
	vec3 col = texture(asphalt_tex, tuv).rgb * 0.82;
	float rough = texture(asphalt_rough, tuv).g;
	if (cid < 0.5) col = mix(col, vec3(0.42, 0.36, 0.29), 0.8); // estrada de chão
	float x = UV.x * width; // metros desde a borda
	float ends = step(9.0, along) * step(along, total - 9.0);
	float dash = step(fract(along / 9.0), 0.45);
	vec3 white = vec3(0.92);
	vec3 yellow = vec3(0.95, 0.72, 0.12);
	float lw = 0.14;
	vec3 mark = vec3(0.0);
	float m = 0.0;
	if (cid >= 5.0) {
		float edge = band(x, 0.35, lw) + band(x, width - 0.35, lw);
		m += edge; mark = white;
		if (oneway) {
			float lanes = max(2.0, floor(width / 3.4));
			for (float i = 1.0; i < 4.0; i += 1.0) { if (i < lanes) m += band(x, width * i / lanes, lw) * dash * ends; }
		} else {
			float c = band(x, width * 0.5 - 0.15, lw) + band(x, width * 0.5 + 0.15, lw);
			if (c > 0.0) { mark = yellow; m = c * ends; }
			m += (band(x, width * 0.25, lw) + band(x, width * 0.75, lw)) * dash * ends;
		}
	} else if (cid >= 3.0) {
		float c = band(x, width * 0.5, lw) * dash * ends;
		m = c; mark = oneway ? white : yellow;
	}
	m = clamp(m, 0.0, 1.0);
	col = mix(col, mark * 0.85, m);
	rough = mix(rough, 0.6, m);
	// poças / asfalto molhado
	rough = mix(rough, 0.08, wet * 0.8);
	col *= mix(1.0, 0.55, wet);
	ALBEDO = col;
	ROUGHNESS = rough;
	NORMAL_MAP = texture(asphalt_nor, tuv).rgb;
	NORMAL_MAP_DEPTH = 0.8;
}
