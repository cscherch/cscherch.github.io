// Áudio procedural (WebAudio): motor, pneus, buzina, efeitos
export class Audio {
  constructor() { this.ctx = null; this.muted = false; }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = (this.ctx = new AC());
    this.master = c.createGain(); this.master.gain.value = 0.5; this.master.connect(c.destination);
    // motor
    this.eng1 = c.createOscillator(); this.eng1.type = 'sawtooth';
    this.eng2 = c.createOscillator(); this.eng2.type = 'square';
    this.engF = c.createBiquadFilter(); this.engF.type = 'lowpass'; this.engF.frequency.value = 600;
    this.engG = c.createGain(); this.engG.gain.value = 0;
    this.eng1.connect(this.engF); this.eng2.connect(this.engF); this.engF.connect(this.engG); this.engG.connect(this.master);
    this.eng1.start(); this.eng2.start();
    // ruído (pneus / vento)
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    const n = c.createBufferSource(); n.buffer = buf; n.loop = true;
    this.skF = c.createBiquadFilter(); this.skF.type = 'bandpass'; this.skF.frequency.value = 1400; this.skF.Q.value = 3;
    this.skG = c.createGain(); this.skG.gain.value = 0;
    n.connect(this.skF); this.skF.connect(this.skG); this.skG.connect(this.master);
    const n2 = c.createBufferSource(); n2.buffer = buf; n2.loop = true;
    this.wF = c.createBiquadFilter(); this.wF.type = 'lowpass'; this.wF.frequency.value = 400;
    this.wG = c.createGain(); this.wG.gain.value = 0;
    n2.connect(this.wF); this.wF.connect(this.wG); this.wG.connect(this.master);
    n.start(); n2.start();
  }
  engine(on, speed, throttle, drift) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const gear = Math.min(5, Math.floor(speed / 9));
    const rpm = 0.25 + ((speed - gear * 9) / 9) * 0.6 + gear * 0.05;
    this.eng1.frequency.setTargetAtTime(35 + rpm * 90, t, 0.05);
    this.eng2.frequency.setTargetAtTime(17.5 + rpm * 45, t, 0.05);
    this.engF.frequency.setTargetAtTime(300 + throttle * 900 + rpm * 400, t, 0.1);
    this.engG.gain.setTargetAtTime(on ? 0.06 + throttle * 0.07 : 0, t, 0.1);
    this.skG.gain.setTargetAtTime(on ? Math.min(0.25, Math.max(0, drift - 3) * 0.04) : 0, t, 0.05);
    this.wG.gain.setTargetAtTime(on ? Math.min(0.2, speed * 0.004) : 0, t, 0.2);
  }
  tone(freqs, dur = 0.15, type = 'sine', vol = 0.2, gap = 0.08) {
    if (!this.ctx) return; const c = this.ctx;
    freqs.forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
      const t0 = c.currentTime + i * gap; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g); g.connect(this.master); o.start(t0); o.stop(t0 + dur + 0.05);
    });
  }
  chime() { this.tone([660, 880, 1320], 0.25); }
  cash() { this.tone([1046, 1318, 1568, 2093], 0.2, 'triangle', 0.18, 0.06); }
  horn() { this.tone([392, 494], 0.45, 'square', 0.08, 0); }
  crash(power) {
    if (!this.ctx) return; const c = this.ctx;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    const g = c.createGain(); const t = c.currentTime; g.gain.setValueAtTime(Math.min(0.8, power * 0.04), t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + 0.5);
  }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.5; }
}
