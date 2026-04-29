// Web Audio API sound generator — no external audio files needed

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = true;
    this.initialized = false;
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }

  // Resume after user gesture (browser requirement)
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.initialized) this.init();
  }

  _gain(value, t) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(value, t);
    g.connect(this.masterGain);
    return g;
  }

  _osc(type, freq, g, startTime, dur) {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    osc.connect(g);
    osc.start(startTime);
    osc.stop(startTime + dur);
    return osc;
  }

  play(name) {
    if (!this.enabled || !this.initialized) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;

    switch (name) {
      case 'red_alert':     this._redAlert(t);        break;
      case 'phaser_fire':   this._phaserFire(t);      break;
      case 'torpedo_fire':  this._torpedoFire(t);      break;
      case 'shield_hit':    this._shieldHit(t);       break;
      case 'hull_hit':      this._hullHit(t);         break;
      case 'explosion':     this._explosion(t);       break;
      case 'warp_engage':   this._warpEngage(t);      break;
      case 'beep':          this._beep(t);            break;
      case 'hail':          this._hail(t);            break;
      case 'victory':       this._victory(t);         break;
      case 'defeat':        this._defeat(t);          break;
      case 'evasive':       this._evasive(t);         break;
      case 'scan':          this._scan(t);            break;
      case 'repair':        this._repair(t);          break;
      case 'door':          this._door(t);            break;
      case 'ambient':       this._ambient(t);         break;
    }
  }

  _redAlert(t) {
    const g = this._gain(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(880, t);
    o.frequency.setValueAtTime(660, t + 0.45);
    o.connect(g); o.start(t); o.stop(t + 0.9);

    const g2 = this._gain(0.3, t + 1.0);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 1.9);
    const o2 = this.ctx.createOscillator();
    o2.type = 'sawtooth';
    o2.frequency.setValueAtTime(880, t + 1.0);
    o2.frequency.setValueAtTime(660, t + 1.45);
    o2.connect(g2); o2.start(t + 1.0); o2.stop(t + 1.9);
  }

  _phaserFire(t) {
    const g = this._gain(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(2200, t);
    o.frequency.exponentialRampToValueAtTime(400, t + 0.4);
    o.connect(g); o.start(t); o.stop(t + 0.4);
  }

  _torpedoFire(t) {
    const g = this._gain(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.6);
    o.connect(g); o.start(t); o.stop(t + 0.6);

    // Pop
    const g2 = this._gain(0.6, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    const noise = this._createNoise(t, 0.1);
    noise.connect(g2);
  }

  _shieldHit(t) {
    const g = this._gain(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(440, t);
    o.frequency.exponentialRampToValueAtTime(220, t + 0.5);
    o.connect(g); o.start(t); o.stop(t + 0.5);
  }

  _hullHit(t) {
    const g = this._gain(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    const noise = this._createNoise(t, 0.8);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    noise.connect(filter);
    filter.connect(g);
  }

  _explosion(t) {
    const g = this._gain(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    const noise = this._createNoise(t, 1.5);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 1.5);
    noise.connect(filter);
    filter.connect(g);
  }

  _warpEngage(t) {
    const g = this._gain(0.4, t);
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(80, t);
    o.frequency.exponentialRampToValueAtTime(2000, t + 1.5);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
    o.connect(g); o.start(t); o.stop(t + 1.8);
  }

  _beep(t) {
    const g = this._gain(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    this._osc('sine', 1760, g, t, 0.15);
  }

  _hail(t) {
    [0, 0.15, 0.3].forEach((offset, i) => {
      const g = this._gain(0.2, t + offset);
      g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.12);
      this._osc('sine', 880 + i * 220, g, t + offset, 0.12);
    });
  }

  _victory(t) {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const g = this._gain(0.25, t + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.18 + 0.5);
      this._osc('sine', freq, g, t + i * 0.18, 0.5);
    });
  }

  _defeat(t) {
    const notes = [440, 370, 330, 277];
    notes.forEach((freq, i) => {
      const g = this._gain(0.25, t + i * 0.22);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.22 + 0.6);
      this._osc('sine', freq, g, t + i * 0.22, 0.6);
    });
  }

  _evasive(t) {
    const g = this._gain(0.3, t);
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(800, t + 0.3);
    o.frequency.exponentialRampToValueAtTime(200, t + 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    o.connect(g); o.start(t); o.stop(t + 0.7);
  }

  _scan(t) {
    [0, 0.2, 0.4].forEach(offset => {
      const g = this._gain(0.15, t + offset);
      g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.18);
      this._osc('sine', 1320, g, t + offset, 0.18);
    });
  }

  _repair(t) {
    const g = this._gain(0.2, t);
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(440, t);
    o.frequency.setValueAtTime(660, t + 0.1);
    o.frequency.setValueAtTime(440, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g); o.start(t); o.stop(t + 0.4);
  }

  _door(t) {
    const g = this._gain(0.2, t);
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(220, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); o.start(t); o.stop(t + 0.3);
  }

  _ambient(t) {
    // Low hum of ship systems
    const g = this._gain(0.04, t);
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 60;
    g.gain.setValueAtTime(0.04, t);
    o.connect(g); o.start(t); o.stop(t + 2);
  }

  _createNoise(startTime, dur) {
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.start(startTime);
    source.stop(startTime + dur);
    return source;
  }

  toggleMute() {
    this.enabled = !this.enabled;
    if (this.masterGain) {
      this.masterGain.gain.value = this.enabled ? 0.4 : 0;
    }
    return this.enabled;
  }
}

export const audio = new AudioManager();
