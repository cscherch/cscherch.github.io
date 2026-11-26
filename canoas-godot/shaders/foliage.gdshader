// Copa das árvores: cor por instância, balanço com o vento, variação de luz.
shader_type spatial;
render_mode cull_back;

varying vec3 tint;
varying float sh;

void vertex() {
	tint = COLOR.rgb;
	vec3 w = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float h = max(VERTEX.y - 2.5, 0.0);
	float s = sin(TIME * 1.3 + w.x * 0.05 + w.z * 0.07) * 0.06 + sin(TIME * 2.9 + w.z * 0.3) * 0.02;
	VERTEX.x += s * h;
	VERTEX.z += s * h * 0.6;
	sh = 0.75 + 0.25 * sin(dot(VERTEX, vec3(3.1, 2.3, 4.7)));
}

void fragment() {
	ALBEDO = tint * sh;
	ROUGHNESS = 0.85;
	SPECULAR = 0.25;
	BACKLIGHT = tint * 0.35;
}
