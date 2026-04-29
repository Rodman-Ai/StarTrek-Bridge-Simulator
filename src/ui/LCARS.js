import { ALERT_STATES, CREW } from '../utils/Constants.js';
import { createPortraitTexture } from '../utils/ProceduralTextures.js';

export class LCARS {
  constructor() {
    this._el = {
      shields:          document.getElementById('shields-bar'),
      shieldsVal:       document.getElementById('shields-value'),
      hull:             document.getElementById('hull-bar'),
      hullVal:          document.getElementById('hull-value'),
      power:            document.getElementById('power-bar'),
      powerVal:         document.getElementById('power-value'),
      warp:             document.getElementById('warp-display'),
      heading:          document.getElementById('heading-display'),
      sector:           document.getElementById('sector-display'),
      phasers:          document.getElementById('phasers-display'),
      torpedoes:        document.getElementById('torpedoes-display'),
      enemyType:        document.getElementById('enemy-type'),
      enemyShields:     document.getElementById('enemy-shields-bar'),
      enemyShieldsVal:  document.getElementById('enemy-shields-value'),
      enemyHull:        document.getElementById('enemy-hull-bar'),
      enemyHullVal:     document.getElementById('enemy-hull-value'),
      crewStatus:       document.getElementById('crew-status'),
      stardate:         document.getElementById('stardate-display'),
      alertText:        document.getElementById('alert-text'),
      alertIndicator:   document.getElementById('alert-indicator'),
      alertFlash:       document.getElementById('alert-flash'),
      dialogueBox:      document.getElementById('dialogue-box'),
      dialogueName:     document.getElementById('dialogue-name'),
      dialogueText:     document.getElementById('dialogue-text'),
      dialoguePortrait: document.getElementById('dialogue-portrait'),
      missionBanner:    document.getElementById('mission-banner'),
      missionType:      document.getElementById('mission-type'),
      missionTitle:     document.getElementById('mission-title'),
      sensorCanvas:     document.getElementById('sensor-canvas'),
      btnPhasers:       document.getElementById('btn-phasers'),
      btnTorpedoes:     document.getElementById('btn-torpedoes'),
      btnShields:       document.getElementById('btn-shields'),
      btnEvasive:       document.getElementById('btn-evasive'),
      btnHail:          document.getElementById('btn-hail'),
      btnWarp:          document.getElementById('btn-warp'),
      btnScan:          document.getElementById('btn-scan'),
      btnRepair:        document.getElementById('btn-repair'),
    };

    this._sensorCtx   = this._el.sensorCanvas?.getContext('2d');
    this._sensorAngle = 0;
    this._dialogTimer = null;
    this._bannerTimer = null;
    this._portraits   = {};

    this._buildPortraits();
  }

  _buildPortraits() {
    Object.values(CREW).forEach(c => {
      const canvas   = document.createElement('canvas');
      canvas.width   = 64; canvas.height = 64;
      const ctx      = canvas.getContext('2d');
      ctx.fillStyle  = '#1A1A2E';
      ctx.fillRect(0, 0, 64, 64);
      ctx.font       = '38px serif';
      ctx.textAlign  = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.portrait, 32, 32);
      this._portraits[c.id] = canvas.toDataURL();
    });
  }

  // ─── Ship status update ───────────────────────────────────────────────────

  updateShipStatus(status) {
    const { shieldPct, hullPct, powerPct, phasersReady, torpedoes, maxTorpedoes } = status;

    this._setBar(this._el.shields, this._el.shieldsVal, shieldPct,
      shieldPct > 50 ? '#9999FF' : shieldPct > 25 ? '#FFAA00' : '#CC0000');
    this._setBar(this._el.hull,    this._el.hullVal,    hullPct,
      hullPct > 50 ? '#00CCCC' : hullPct > 25 ? '#FFAA00' : '#CC0000');
    this._setBar(this._el.power,   this._el.powerVal,   powerPct ?? 100, '#FFCC00');

    if (this._el.phasers) {
      this._el.phasers.textContent = phasersReady ? 'READY' : 'CHARGING';
      this._el.phasers.style.color = phasersReady ? '#FF9900' : '#FF6600';
    }
    if (this._el.torpedoes) {
      this._el.torpedoes.textContent = `${torpedoes} / ${maxTorpedoes}`;
      this._el.torpedoes.style.color = torpedoes > 3 ? '#FF9900' : '#CC0000';
    }

    // Button states
    this._setButtonEnabled(this._el.btnPhasers,   phasersReady);
    this._setButtonEnabled(this._el.btnTorpedoes, torpedoes > 0);
  }

  updateEnemyStatus(enemyStatus) {
    if (!enemyStatus) {
      this._setText(this._el.enemyType, 'NONE');
      this._setBar(this._el.enemyShields, this._el.enemyShieldsVal, 0, '#CC0000');
      this._setBar(this._el.enemyHull,    this._el.enemyHullVal,    0, '#FF6600');
      return;
    }
    this._setText(this._el.enemyType, enemyStatus.name.toUpperCase());
    this._setBar(this._el.enemyShields, this._el.enemyShieldsVal,
      enemyStatus.shieldPct, '#CC0000');
    this._setBar(this._el.enemyHull, this._el.enemyHullVal,
      enemyStatus.hullPct, '#FF6600');
  }

  updateNavigation(gs) {
    this._setText(this._el.warp,    gs.warp > 0 ? `WARP ${gs.warp.toFixed(1)}` : 'IMPULSE');
    this._setText(this._el.heading, `${gs.heading.d}° MARK ${gs.heading.m}`);
    this._setText(this._el.sector,  String(gs.sector).padStart(3, '0'));
    this._setText(this._el.stardate,`STARDATE ${gs.stardate.toFixed(1)}`);
  }

  // ─── Alert state ──────────────────────────────────────────────────────────

  setAlertState(state) {
    const body = document.body;
    body.classList.remove('red-alert', 'yellow-alert');
    this._el.alertFlash?.classList.add('hidden');

    switch (state) {
      case ALERT_STATES.RED:
        this._setText(this._el.alertText, '⚠ RED ALERT ⚠');
        this._el.alertIndicator.style.borderColor = '#CC0000';
        this._el.alertFlash?.classList.remove('hidden');
        body.classList.add('red-alert');
        break;
      case ALERT_STATES.YELLOW:
        this._setText(this._el.alertText, '⚠ YELLOW ALERT');
        this._el.alertIndicator.style.borderColor = '#FFAA00';
        body.classList.add('yellow-alert');
        break;
      default:
        this._setText(this._el.alertText, 'ALL SYSTEMS NORMAL');
        this._el.alertIndicator.style.borderColor = '#FF9900';
        break;
    }
  }

  // ─── Crew dialogue ────────────────────────────────────────────────────────

  showDialogue(charId, text, autoDismiss = 4500) {
    const crew = Object.values(CREW).find(c => c.id === charId) ?? CREW.PICARD;
    clearTimeout(this._dialogTimer);

    this._setText(this._el.dialogueName, `${crew.rank.toUpperCase()} ${crew.name.toUpperCase()}`);
    this._setText(this._el.dialogueText, text);

    if (this._el.dialoguePortrait && this._portraits[charId]) {
      this._el.dialoguePortrait.style.backgroundImage = `url(${this._portraits[charId]})`;
      this._el.dialoguePortrait.style.backgroundSize  = 'cover';
    }

    this._el.dialogueBox?.classList.remove('hidden');

    if (autoDismiss > 0) {
      this._dialogTimer = setTimeout(() => this.hideDialogue(), autoDismiss);
    }
  }

  hideDialogue() {
    this._el.dialogueBox?.classList.add('hidden');
  }

  // ─── Mission banner ───────────────────────────────────────────────────────

  showMissionBanner(type, title, duration = 4000) {
    clearTimeout(this._bannerTimer);
    this._setText(this._el.missionType,  type.toUpperCase());
    this._setText(this._el.missionTitle, title.toUpperCase());
    this._el.missionBanner?.classList.remove('hidden');
    this._bannerTimer = setTimeout(() => this.hideMissionBanner(), duration);
  }

  hideMissionBanner() {
    this._el.missionBanner?.classList.add('hidden');
  }

  // ─── Crew status text ─────────────────────────────────────────────────────

  setCrewStatus(text) {
    this._setText(this._el.crewStatus, text);
  }

  // ─── Button lock during action ────────────────────────────────────────────

  lockActions(locked) {
    const buttons = [
      this._el.btnPhasers, this._el.btnTorpedoes, this._el.btnShields,
      this._el.btnEvasive, this._el.btnHail, this._el.btnWarp,
      this._el.btnScan, this._el.btnRepair,
    ];
    buttons.forEach(b => {
      if (b) b.disabled = locked;
    });
  }

  // ─── Sensor display update ────────────────────────────────────────────────

  updateSensor(delta, gs, enemyStatus) {
    if (!this._sensorCtx) return;
    const ctx = this._sensorCtx;
    const W = 160, H = 160, cx = W / 2, cy = H / 2;
    this._sensorAngle += delta * 1.5;

    ctx.fillStyle = '#00050F';
    ctx.fillRect(0, 0, W, H);

    // Grid rings
    ctx.strokeStyle = 'rgba(0, 153, 255, 0.2)';
    ctx.lineWidth = 1;
    [30, 55, 72].forEach(r => {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    });

    // Grid lines
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(a => {
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 72, cy + Math.sin(a) * 72);
      ctx.lineTo(cx - Math.cos(a) * 72, cy - Math.sin(a) * 72);
      ctx.stroke();
    });

    // Sweep line
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this._sensorAngle);
    const sweep = ctx.createLinearGradient(0, 0, 72, 0);
    sweep.addColorStop(0, 'rgba(0, 255, 100, 0.5)');
    sweep.addColorStop(1, 'rgba(0, 255, 100, 0)');
    ctx.strokeStyle = sweep;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(72, 0); ctx.stroke();
    ctx.restore();

    // Enterprise (center)
    ctx.fillStyle = '#00FF88';
    ctx.shadowColor = '#00FF88'; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();

    // Enemy blip
    if (enemyStatus) {
      const eAngle = this._sensorAngle * 0.3 + 1.2;
      const eDist  = 40 + Math.sin(this._sensorAngle * 0.5) * 8;
      const ex     = cx + Math.cos(eAngle) * eDist;
      const ey     = cy + Math.sin(eAngle) * eDist;
      ctx.fillStyle = '#FF3300'; ctx.shadowColor = '#FF3300'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  // ─── Loading screen ───────────────────────────────────────────────────────

  setLoadingProgress(pct, text) {
    const fill = document.getElementById('loading-fill');
    const msg  = document.getElementById('loading-text');
    if (fill) fill.style.width = `${pct}%`;
    if (msg)  msg.textContent  = text;
  }

  hideLoading() {
    const screen = document.getElementById('loading-screen');
    if (!screen) return;
    screen.classList.add('fade-out');
    setTimeout(() => screen.remove(), 900);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  _setBar(barEl, valEl, pct, color) {
    if (barEl) {
      barEl.style.width           = `${Math.max(0, Math.min(100, pct))}%`;
      barEl.style.backgroundColor = color;
    }
    if (valEl) valEl.textContent = `${Math.round(pct)}%`;
  }

  _setText(el, text) {
    if (el) el.textContent = text;
  }

  _setButtonEnabled(btn, enabled) {
    if (btn) btn.disabled = !enabled;
  }
}
