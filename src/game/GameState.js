import { GAME_STATES, ALERT_STATES } from '../utils/Constants.js';

// Minimal event emitter (no external dep)
class EventEmitter {
  constructor() { this._handlers = {}; }
  on(ev, fn)  { (this._handlers[ev] ??= []).push(fn); return this; }
  off(ev, fn) { this._handlers[ev] = (this._handlers[ev] ?? []).filter(f => f !== fn); }
  emit(ev, ...args) { (this._handlers[ev] ?? []).forEach(fn => fn(...args)); }
}

export class GameState extends EventEmitter {
  constructor() {
    super();
    this.state     = GAME_STATES.LOADING;
    this.alert     = ALERT_STATES.NORMAL;
    this.mission   = null;
    this.score     = 0;
    this.stardate  = 47634.4;
    this.sector    = 1;
    this.warp      = 0;        // current warp factor (0 = impulse)
    this.heading   = { d: 247, m: 15 };
    this.paused    = false;
  }

  setState(next) {
    const prev  = this.state;
    this.state  = next;
    this.emit('stateChange', next, prev);
  }

  setAlert(level) {
    const prev   = this.alert;
    this.alert   = level;
    this.emit('alertChange', level, prev);
  }

  setMission(missionData) {
    this.mission = missionData;
    this.emit('missionStart', missionData);
  }

  addScore(pts) {
    this.score += pts;
    this.emit('scoreChange', this.score);
  }

  advanceStardate(amount = 0.1) {
    this.stardate = parseFloat((this.stardate + amount).toFixed(1));
    this.emit('stardateChange', this.stardate);
  }

  // Warp / navigation helpers
  engageWarp(factor) {
    this.warp = factor;
    this.emit('warpChange', factor);
  }

  dropToImpulse() {
    this.warp = 0;
    this.emit('warpChange', 0);
  }

  isInCombat()  { return this.state === GAME_STATES.COMBAT; }
  isIdle()      { return this.state === GAME_STATES.IDLE;   }
  isLoading()   { return this.state === GAME_STATES.LOADING; }
}
