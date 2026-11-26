shader_type canvas_item;

uniform vec2 center = vec2(0.5);
uniform float zoom = 0.06;   // fração da largura do mapa visível
uniform float rot = 0.0;
uniform float aspect = 1.0;

void fragment() {
	vec2 d = UV - vec2(0.5);
	float r = length(d);
	if (r > 0.49) discard;
	float c = cos(-rot), s = sin(-rot);
	vec2 q = vec2(d.x * c - d.y * s, d.x * s + d.y * c);
	vec2 uv = center + vec2(q.x * zoom, q.y * zoom * aspect);
	vec3 col = texture(TEXTURE, uv).rgb;
	if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) col = vec3(0.1, 0.13, 0.1);
	float edge = smoothstep(0.47, 0.49, r);
	COLOR = vec4(mix(col, vec3(0.0), edge * 0.6), 0.95);
}
