import * as THREE from 'three';

const VS_W = 7.8;   // viewscreen width
const VS_H = 3.0;   // viewscreen height
const VS_Z = -6.4;  // distance from bridge center

export class Viewscreen {
  constructor(scene) {
    this.scene      = scene;
    this.canvas     = document.createElement('canvas');
    this.canvas.width  = 1024;
    this.canvas.height = 512;
    this.ctx        = this.canvas.getContext('2d');
    this.texture    = new THREE.CanvasTexture(this.canvas);
    this.texture.needsUpdate = true;

    this.mode        = 'normal';   // 'normal' | 'combat' | 'warp' | 'planet'
    this.enemyType   = null;
    this.combatPhase = 0;
    this.warpPhase   = 0;
    this.flashTimer  = 0;
    this.phaserBeam  = null;       // { active, timer }
    this.torpedoBlip = null;
    this.hitFlash    = 0;

    this._stars      = this._generateStars(1800);

    this._buildMesh(scene);
    this._drawNormal(0);
  }

  // ─── Build 3D mesh ────────────────────────────────────────────────────────

  _buildMesh(scene) {
    const mat = new THREE.MeshBasicMaterial({
      map: this.texture,
      side: THREE.FrontSide,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(VS_W, VS_H), mat);
    this.mesh.position.set(0, 1.85, VS_Z);
    scene.add(this.mesh);

    // Screen glow light (illuminates bridge from front)
    this.screenLight = new THREE.PointLight(0x8899CC, 6, 8, 2);
    this.screenLight.position.set(0, 1.85, VS_Z + 0.5);
    scene.add(this.screenLight);
  }

  // ─── Stars pool ───────────────────────────────────────────────────────────

  _generateStars(count) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * 1024,
      y: Math.random() * 512,
      r: 0.4 + Math.random() * 1.4,
      brightness: 0.3 + Math.random() * 0.7,
      twinkle: Math.random() * Math.PI * 2,
      speed: 0.02 + Math.random() * 0.05,
      hue: 200 + Math.random() * 80,
    }));
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  setNormalMode() {
    this.mode      = 'normal';
    this.enemyType = null;
    this.screenLight.color.setHex(0x8899CC);
    this.screenLight.intensity = 6;
  }

  setCombatMode(enemyType) {
    this.mode        = 'combat';
    this.enemyType   = enemyType;
    this.combatPhase = 0;
    this.screenLight.color.setHex(0x886644);
  }

  setWarpMode() {
    this.mode      = 'warp';
    this.warpPhase = 0;
    this.screenLight.color.setHex(0x6699FF);
    this.screenLight.intensity = 15;
  }

  firePhasers() {
    this.phaserBeam = { active: true, timer: 0.5 };
  }

  fireTorpedo() {
    this.torpedoBlip = { x: 200, y: 256, timer: 0.8 };
  }

  showHullHit() {
    this.hitFlash = 0.6;
    this.screenLight.color.setHex(0xFF4400);
  }

  // ─── Update loop ──────────────────────────────────────────────────────────

  update(delta) {
    if (this.phaserBeam?.active)  this.phaserBeam.timer  -= delta;
    if (this.torpedoBlip)         this.torpedoBlip.timer -= delta;
    if (this.hitFlash > 0)        this.hitFlash          -= delta;
    if (this.phaserBeam?.timer  <= 0) this.phaserBeam  = null;
    if (this.torpedoBlip?.timer <= 0) this.torpedoBlip = null;

    if (this.hitFlash <= 0 && this.mode === 'combat') {
      this.screenLight.color.setHex(0x886644);
      this.screenLight.intensity = 4;
    } else if (this.hitFlash > 0) {
      this.screenLight.intensity = 18 * this.hitFlash;
    }

    switch (this.mode) {
      case 'normal':  this._drawNormal(delta);  break;
      case 'combat':  this._drawCombat(delta);  break;
      case 'warp':    this._drawWarp(delta);     break;
      case 'planet':  this._drawPlanet(delta);  break;
    }

    this.texture.needsUpdate = true;
  }

  // ─── Drawing: Normal (starfield) ──────────────────────────────────────────

  _drawNormal(delta) {
    const { ctx, canvas } = this;
    const W = canvas.width, H = canvas.height;
    const t = performance.now() * 0.001;

    ctx.fillStyle = '#000008';
    ctx.fillRect(0, 0, W, H);

    // Nebula background
    const neb = ctx.createRadialGradient(W * 0.35, H * 0.45, 0, W * 0.35, H * 0.45, W * 0.4);
    neb.addColorStop(0, 'rgba(50, 15, 70, 0.3)');
    neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, W, H);

    const neb2 = ctx.createRadialGradient(W * 0.72, H * 0.3, 0, W * 0.72, H * 0.3, W * 0.25);
    neb2.addColorStop(0, 'rgba(10, 30, 80, 0.25)');
    neb2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, W, H);

    // Stars
    this._stars.forEach(s => {
      const tw   = 0.7 + Math.sin(t * s.speed * 10 + s.twinkle) * 0.3;
      const alpha = s.brightness * tw;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsl(${s.hue}, 25%, 88%)`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Distant galaxy smear
    ctx.globalAlpha = 0.08;
    const band = ctx.createLinearGradient(0, H * 0.55, W, H * 0.42);
    band.addColorStop(0,   'rgba(200,180,255,0)');
    band.addColorStop(0.3, 'rgba(200,180,255,1)');
    band.addColorStop(0.7, 'rgba(200,180,255,1)');
    band.addColorStop(1,   'rgba(200,180,255,0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  // ─── Drawing: Combat ──────────────────────────────────────────────────────

  _drawCombat(delta) {
    this.combatPhase += delta;
    const { ctx, canvas } = this;
    const W = canvas.width, H = canvas.height;
    const t = this.combatPhase;

    // Dark space background
    ctx.fillStyle = '#00000A';
    ctx.fillRect(0, 0, W, H);

    // Sparse stars
    ctx.globalAlpha = 0.5;
    this._stars.slice(0, 400).forEach(s => {
      ctx.fillStyle = '#AAAACC';
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    ctx.globalAlpha = 1;

    // Enemy ship
    const ex = W * 0.62 + Math.sin(t * 0.7) * 18;
    const ey = H * 0.44 + Math.sin(t * 1.1) * 8;
    this._drawEnemyShip(ctx, this.enemyType, ex, ey, t);

    // Targeting reticle
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.arc(ex, ey, 65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Corner ticks
    [[ex - 75, ey], [ex + 75, ey], [ex, ey - 75], [ex, ey + 75]].forEach(([x, y]) => {
      const dx = x < ex ? 15 : x > ex ? -15 : 0;
      const dy = y < ey ? 15 : y > ey ? -15 : 0;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();
    });

    // Enterprise weapons fire
    if (this.phaserBeam?.active) {
      const intensity = Math.min(1, this.phaserBeam.timer * 5);
      ctx.strokeStyle = `rgba(255, 140, 0, ${intensity})`;
      ctx.lineWidth = 3 + intensity * 2;
      ctx.shadowColor = '#FF8800';
      ctx.shadowBlur = 12 * intensity;
      ctx.beginPath();
      ctx.moveTo(W * 0.05, H * 0.9);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      // Second beam
      ctx.strokeStyle = `rgba(255, 200, 50, ${intensity * 0.6})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W * 0.08, H * 0.88);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Impact flash on enemy
      ctx.fillStyle = `rgba(255,200,80,${intensity * 0.5})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 45 + intensity * 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Torpedo
    if (this.torpedoBlip) {
      const prog = 1 - this.torpedoBlip.timer / 0.8;
      const tx   = W * 0.08 + (ex - W * 0.08) * prog;
      const ty   = H * 0.85 + (ey - H * 0.85) * prog;
      ctx.fillStyle = '#FF5500';
      ctx.shadowColor = '#FF8800';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(tx, ty, 7, 0, Math.PI * 2);
      ctx.fill();
      // Trail
      ctx.fillStyle = 'rgba(255,85,0,0.35)';
      ctx.beginPath();
      ctx.arc(tx - (ex - W * 0.08) * 0.08, ty - (ey - H * 0.85) * 0.08, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Hull hit flash (red overlay)
    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(255, 30, 0, ${this.hitFlash * 0.35})`;
      ctx.fillRect(0, 0, W, H);

      // Screen shake suggestion via chromatic aberration strips
      ctx.fillStyle = `rgba(255, 0, 0, ${this.hitFlash * 0.15})`;
      ctx.fillRect(0, 0, W, 4);
      ctx.fillRect(0, H - 4, W, 4);
    }

    // HUD data overlay
    ctx.fillStyle = 'rgba(255,153,0,0.75)';
    ctx.font = '11px monospace';
    ctx.fillText(`RANGE: ${Math.floor(Math.max(100, 42000 - t * 380))} km`, 20, 24);
    ctx.fillText(`BEARING: ${Math.floor(245 + Math.sin(t * 0.3) * 4)}°`, 20, 40);
    ctx.fillText(`WARP SIGNATURE: DETECTED`, 20, 56);

    const enemyLabel = this.enemyType?.replace(/_/g, ' ').toUpperCase() ?? 'UNKNOWN';
    ctx.fillText(`TARGET: ${enemyLabel}`, W - 220, 24);
    ctx.fillText(`LOCK STATUS: CONFIRMED`, W - 220, 40);
  }

  // ─── Drawing: Warp ────────────────────────────────────────────────────────

  _drawWarp(delta) {
    this.warpPhase += delta * 2.5;
    const { ctx, canvas } = this;
    const W = canvas.width, H = canvas.height;
    const t = this.warpPhase;

    ctx.fillStyle = '#000005';
    ctx.fillRect(0, 0, W, H);

    // Warp streaks
    const cx = W / 2, cy = H / 2;
    const streakCount = 180;
    for (let i = 0; i < streakCount; i++) {
      const angle  = (i / streakCount) * Math.PI * 2;
      const speed  = 0.6 + ((i * 7919) % 100) / 100 * 0.4;
      const len    = 30 + t * speed * 200;
      const r1     = 8 + t * speed * 80;
      const r2     = r1 + len;
      const alpha  = Math.min(1, t * 0.5) * speed;
      const blue   = Math.floor(180 + speed * 75);

      ctx.globalAlpha = alpha * 0.7;
      ctx.strokeStyle = `rgb(${Math.floor(speed * 120)}, ${Math.floor(speed * 160)}, ${blue})`;
      ctx.lineWidth = 0.8 + speed * 1.2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Central tunnel glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 140);
    glow.addColorStop(0, `rgba(100, 150, 255, ${Math.min(0.6, t * 0.3)})`);
    glow.addColorStop(1, 'rgba(0,0,30,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  // ─── Drawing: Planet approach ─────────────────────────────────────────────

  _drawPlanet(delta) {
    this._drawNormal(delta);
    const { ctx, canvas } = this;
    const W = canvas.width, H = canvas.height;

    // Planet
    const grad = ctx.createRadialGradient(W * 0.65, H * 0.5, 0, W * 0.65, H * 0.5, 130);
    grad.addColorStop(0,   'rgba(40, 100, 180, 1)');
    grad.addColorStop(0.4, 'rgba(30, 130, 60, 0.9)');
    grad.addColorStop(0.75,'rgba(20, 80, 40, 0.8)');
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(W * 0.65, H * 0.5, 130, 0, Math.PI * 2);
    ctx.fill();

    // Atmosphere glow
    const atmo = ctx.createRadialGradient(W * 0.65, H * 0.5, 110, W * 0.65, H * 0.5, 155);
    atmo.addColorStop(0, 'rgba(80,160,255,0)');
    atmo.addColorStop(1, 'rgba(80,160,255,0.2)');
    ctx.fillStyle = atmo;
    ctx.beginPath();
    ctx.arc(W * 0.65, H * 0.5, 155, 0, Math.PI * 2);
    ctx.fill();
  }

  // ─── Enemy ship silhouettes ───────────────────────────────────────────────

  _drawEnemyShip(ctx, type, cx, cy, t) {
    ctx.save();
    ctx.translate(cx, cy);
    const scale = 1.1 + Math.sin(t * 0.4) * 0.03;
    ctx.scale(scale, scale);

    const wobble = Math.sin(t * 1.2) * 1.5;
    ctx.translate(wobble, wobble * 0.4);

    switch (type) {
      case 'romulan_warbird': this._drawWarbird(ctx);         break;
      case 'klingon_bop':    this._drawBirdOfPrey(ctx);      break;
      case 'borg_cube':      this._drawBorgCube(ctx, t);     break;
      case 'cardassian_galor':this._drawGalor(ctx);          break;
      default:               this._drawFerengi(ctx);         break;
    }
    ctx.restore();
  }

  _drawWarbird(ctx) {
    ctx.fillStyle = '#003300'; ctx.strokeStyle = '#00AA44'; ctx.lineWidth = 1;
    // Hull
    ctx.beginPath(); ctx.ellipse(0, 0, 60, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Wings
    ctx.fillStyle = '#005500';
    ctx.beginPath();
    ctx.moveTo(-45, 0); ctx.lineTo(-20, -38); ctx.lineTo(18, -35); ctx.lineTo(32, 0);
    ctx.lineTo(18, 35); ctx.lineTo(-20, 38); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Engine glow
    ctx.fillStyle = 'rgba(0,255,80,0.7)'; ctx.shadowColor = '#00FF44'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(-58, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  _drawBirdOfPrey(ctx) {
    ctx.fillStyle = '#2A1600'; ctx.strokeStyle = '#774400'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(48, 0); ctx.lineTo(-12, -10); ctx.lineTo(-35, 0); ctx.lineTo(-12, 10); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Wings
    ctx.fillStyle = '#3A2000';
    ctx.beginPath(); ctx.moveTo(-6, -7); ctx.lineTo(-42, -44); ctx.lineTo(-18, -7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-6, 7);  ctx.lineTo(-42, 44);  ctx.lineTo(-18, 7);  ctx.fill();
    // Disruptor
    ctx.fillStyle = 'rgba(160,60,255,0.9)'; ctx.shadowColor = '#AA44FF'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(46, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  _drawBorgCube(ctx, t) {
    ctx.fillStyle = '#1A331A'; ctx.strokeStyle = '#44BB44'; ctx.lineWidth = 2;
    ctx.fillRect(-42, -42, 84, 84); ctx.strokeRect(-42, -42, 84, 84);
    ctx.strokeStyle = 'rgba(0,200,80,0.4)'; ctx.lineWidth = 1;
    for (let i = -28; i <= 42; i += 14) {
      ctx.beginPath(); ctx.moveTo(i, -42); ctx.lineTo(i, 42); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-42, i); ctx.lineTo(42, i); ctx.stroke();
    }
    // Tractor beam pulse
    ctx.fillStyle = `rgba(0,255,100,${0.1 + Math.sin(t * 3) * 0.08})`;
    ctx.fillRect(-42, -42, 84, 84);
    // Glow
    ctx.shadowColor = '#00FF80'; ctx.shadowBlur = 15;
    ctx.strokeStyle = '#00FF80'; ctx.lineWidth = 2;
    ctx.strokeRect(-42, -42, 84, 84);
    ctx.shadowBlur = 0;
  }

  _drawGalor(ctx) {
    ctx.fillStyle = '#332211'; ctx.strokeStyle = '#776633'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 0, 55, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#443322';
    ctx.beginPath(); ctx.moveTo(12, -9); ctx.lineTo(-22, -24); ctx.lineTo(-32, -9); ctx.lineTo(-12, -4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, 9);  ctx.lineTo(-22, 24);  ctx.lineTo(-32, 9);  ctx.lineTo(-12, 4);  ctx.fill();
    ctx.fillStyle = 'rgba(255,120,40,0.8)'; ctx.shadowColor = '#FF7722'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(53, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  _drawFerengi(ctx) {
    ctx.fillStyle = '#332200'; ctx.strokeStyle = '#886600'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 0, 35, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#442200';
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(-28, -22); ctx.lineTo(-22, -5); ctx.lineTo(0, -7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 7);  ctx.lineTo(-28, 22);  ctx.lineTo(-22, 5);  ctx.lineTo(0, 7);  ctx.fill();
    ctx.fillStyle = 'rgba(255,180,0,0.8)'; ctx.shadowColor = '#FFAA00'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(33, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
}
