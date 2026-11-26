// Céu dinâmico: gradiente, sol com halo, nuvens procedurais em movimento, lua e estrelas.
shader_type sky;

uniform vec3 top_color = vec3(0.2, 0.4, 0.75);
uniform vec3 horizon_color = vec3(0.7, 0.78, 0.86);
uniform float night = 0.0;
uniform float cloudiness = 0.55;
uniform vec3 sun_dir = vec3(0.0, 1.0, 0.0);
uniform vec3 sun_color = vec3(1.0);

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
	vec2 i = floor(p), f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
	float v = 0.0, a = 0.5;
	for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
	return v;
}

void sky() {
	vec3 d = EYEDIR;
	float y = max(d.y, 0.0);
	vec3 col = mix(horizon_color, top_color, pow(y, 0.45));
	if (d.y < 0.0) col = horizon_color * mix(0.75, 0.45, clamp(-d.y * 4.0, 0.0, 1.0));
	float sd = dot(d, normalize(sun_dir));
	float day = 1.0 - night;
	col += sun_color * pow(max(sd, 0.0), 6.0) * 0.25 * day;
	col += sun_color * pow(max(sd, 0.0), 64.0) * 0.6 * day;
	col += sun_color * smoothstep(0.9993, 0.9997, sd) * 12.0 * day * step(-0.02, sun_dir.y);
	// lua (oposta ao sol)
	float md = dot(d, -normalize(sun_dir));
	col += vec3(0.85, 0.9, 1.0) * smoothstep(0.9994, 0.9997, md) * 3.0 * night;
	col += vec3(0.4, 0.45, 0.6) * pow(max(md, 0.0), 30.0) * 0.15 * night;
	// estrelas
	vec2 sp = d.xz / max(d.y, 0.05) * 60.0;
	float st = step(0.996, hash(floor(sp))) * smoothstep(0.05, 0.3, d.y);
	float tw = 0.6 + 0.4 * sin(TIME * 3.0 + hash(floor(sp)) * 50.0);
	// nuvens
	float c = 0.0;
	if (d.y > 0.0) {
		vec2 uv = d.xz / (d.y + 0.08) * 0.9 + vec2(TIME * 0.004, TIME * 0.0015);
		float n = fbm(uv * 1.3);
		c = smoothstep(1.0 - cloudiness, 1.15 - cloudiness * 0.5, n) * smoothstep(0.0, 0.18, d.y);
		float shade = fbm(uv * 1.3 + normalize(sun_dir).xz * 0.08);
		vec3 lit = mix(vec3(1.0), sun_color, 0.35) * mix(1.0, 0.72, smoothstep(0.4, 0.8, shade));
		vec3 ccol = mix(lit, horizon_color * 0.9, 0.25);
		ccol = mix(ccol, vec3(0.06, 0.07, 0.1), night * 0.92);
		col = mix(col, ccol, c * 0.92);
	}
	col += vec3(st * tw * night * (1.0 - c) * 1.5);
	COLOR = col;
}
