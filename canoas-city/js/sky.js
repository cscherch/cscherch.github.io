import * as THREE from 'three';
import { shared, waterMat } from './render.js';

const KEYS = [ // hora, topo, horizonte, luz do sol, intensidade
  [0, '#050914', '#0d1526', '#6f86b8', 0.0],
  [5, '#0b1530', '#3a3550', '#8890c0', 0.0],
  [6, '#3a5a8c', '#f2a35e', '#ffb070', 0.6],
  [7.5, '#5c8fd0', '#f0d0a8', '#ffe2b8', 1.6],
  [12, '#3f7ad0', '#b9d5ec', '#fff6e8', 2.6],
  [16.5, '#4c82cf', '#d9dde0', '#fff0d8', 2.2],
  [18, '#4a6aa8', '#f6a45a', '#ffa860', 1.2],
  [19, '#1f2a55', '#c2604a', '#ff7a50', 0.3],
  [20, '#0a1128', '#26304a', '#7080b0', 0.0],
  [24, '#050914', '#0d1526', '#6f86b8', 0.0],
];

export class Sky {
  constructor(scene, renderer) {
    this.scene = scene;
    this.hour = 17.2;
    this.speed = 1 / 40; // horas de jogo por segundo
    this.uniforms = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, night: shared.night, time: shared.time };
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.uniforms,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }',
      fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 sunDir; uniform float night; uniform float time; varying vec3 vD;
        float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
        void main(){
          float y = max(vD.y, 0.0);
          vec3 c = mix(hor, top, pow(y, 0.55));
          if (vD.y < 0.0) c = hor * 0.9;
          float sd = max(dot(vD, sunDir), 0.0);
          c += vec3(1.0,0.8,0.55) * pow(sd, 8.0) * 0.35 * (1.0 - night);
          c += vec3(1.0,0.95,0.85) * smoothstep(0.9993, 0.9997, sd) * 4.0 * step(-0.05, sunDir.y);
          // lua
          float md = max(dot(vD, -sunDir), 0.0);
          c += vec3(0.85,0.9,1.0) * smoothstep(0.9994, 0.9997, md) * 1.6 * night;
          // estrelas
          vec3 q = floor(vD * 260.0);
          float s = step(0.9975, h(q)) * night * smoothstep(0.05, 0.3, vD.y) * (0.6 + 0.4*sin(time*3.0 + h(q)*40.0));
          c += vec3(s);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(5000, 32, 16), mat);
    this.dome.frustumCulled = false; this.dome.renderOrder = -1;
    scene.add(this.dome);

    this.hemi = new THREE.HemisphereLight('#bcd4ff', '#5a5240', 1.0); scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#ffffff', 2.5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera; sc.left = -160; sc.right = 160; sc.top = 160; sc.bottom = -160; sc.near = 10; sc.far = 900;
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.6;
    scene.add(this.sun); scene.add(this.sun.target);
    scene.fog = new THREE.Fog('#c8d6e0', 250, 1700);
    this.tmpA = new THREE.Color(); this.tmpB = new THREE.Color();
  }
  sample(h, idx) {
    let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
    const a = KEYS[i], b = KEYS[i + 1];
    const t = (h - a[0]) / (b[0] - a[0]);
    if (idx === 4) return a[4] + (b[4] - a[4]) * t;
    return this.tmpA.set(a[idx]).lerp(this.tmpB.set(b[idx]), t).clone();
  }
  update(dt, focus) {
    this.hour = (this.hour + dt * this.speed) % 24;
    const h = this.hour;
    const top = this.sample(h, 1), hor = this.sample(h, 2), sunC = this.sample(h, 3), I = this.sample(h, 4);
    this.uniforms.top.value.copy(top); this.uniforms.hor.value.copy(hor);
    // sol: nasce 6h a leste, põe 19h a oeste
    const a = ((h - 6) / 13) * Math.PI;
    const sunDir = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.85, 0.35).normalize();
    const isDay = sunDir.y > -0.02;
    const lightDir = isDay ? sunDir : sunDir.clone().negate(); // à noite a lua ilumina
    this.uniforms.sunDir.value.copy(sunDir);
    const night = THREE.MathUtils.clamp(1 - I / 0.8, 0, 1);
    shared.night.value = night;
    this.sun.color.copy(sunC);
    this.sun.intensity = isDay ? Math.max(I, 0.05) : 0.35;
    this.sun.position.set(focus.x + lightDir.x * 400, Math.max(lightDir.y, 0.15) * 400, focus.z + lightDir.z * 400);
    this.sun.target.position.set(focus.x, 0, focus.z);
    this.hemi.intensity = 0.35 + I * 0.35;
    this.hemi.color.copy(top).lerp(new THREE.Color('#ffffff'), 0.5);
    this.scene.fog.color.copy(hor);
    this.scene.fog.far = 1700 - night * 500;
    this.dome.position.set(focus.x, 0, focus.z);
    for (const m of shared.lampMats) m.color.setRGB(0.3 + night * 3.5, 0.28 + night * 2.8, 0.22 + night * 1.6);
    if (waterMat) {
      waterMat.uniforms.uSky.value.copy(hor).lerp(top, 0.3);
      waterMat.uniforms.uSun.value.copy(lightDir);
      waterMat.uniforms.uSunCol.value.copy(sunC).multiplyScalar(isDay ? 1 : 0.4);
      waterMat.uniforms.uDeep.value.set('#1d3a40').multiplyScalar(0.35 + 0.65 * (1 - night));
    }
    return night;
  }
  clock() {
    const h = Math.floor(this.hour), m = Math.floor((this.hour % 1) * 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }
}
