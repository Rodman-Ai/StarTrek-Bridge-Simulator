import { GAME_STATES, ALERT_STATES } from '../utils/Constants.js';

const IDLE_MIN = 8000;   // ms before first encounter
const IDLE_MAX = 18000;

const MISSION_TEMPLATES = [
  {
    type: 'combat',
    title: 'HOSTILE VESSEL DETECTED',
    intro: 'An unidentified vessel is approaching on an intercept course.',
    enemies: ['romulan_warbird', 'klingon_bop', 'cardassian_galor', 'ferengi_marauder'],
  },
  {
    type: 'combat',
    title: 'BORDER INCURSION',
    intro: 'We are being hailed by a vessel of the Klingon Empire.',
    enemies: ['klingon_bop'],
  },
  {
    type: 'combat',
    title: 'BORG CUBE DETECTED',
    intro: 'Long range sensors confirm: a Borg Cube is on an intercept trajectory.',
    enemies: ['borg_cube'],
  },
  {
    type: 'combat',
    title: 'ROMULAN AMBUSH',
    intro: 'A vessel has decloaked off the port bow. Weapons are charged.',
    enemies: ['romulan_warbird'],
  },
  {
    type: 'exploration',
    title: 'ANOMALY DETECTED',
    intro: 'Sensors have detected a spatial anomaly in this sector.',
    enemies: [],
  },
  {
    type: 'diplomacy',
    title: 'INCOMING TRANSMISSION',
    intro: 'We are receiving a hail from a Ferengi vessel.',
    enemies: ['ferengi_marauder'],
  },
];

const VICTORY_DIALOGS = [
  { charId: 'picard',  text: 'Well done, everyone. Stand down from red alert.' },
  { charId: 'riker',   text: 'Excellent work. Resuming course.' },
  { charId: 'worf',    text: 'The enemy is destroyed! Today is a good day!' },
  { charId: 'data',    text: 'Combat efficiency: 94.7%. All systems nominal.' },
];

const DEFEAT_DIALOGS = [
  { charId: 'picard', text: 'All hands, abandon ship! This is not the end of our mission.' },
  { charId: 'riker',  text: 'We gave it everything we had. Initiating emergency protocols.' },
];

const ENCOUNTER_DIALOGS = [
  { charId: 'worf',   text: 'Captain, sensors show an unidentified vessel. Shields on stand-by.' },
  { charId: 'data',   text: 'Captain, I am detecting a warp signature on approach vector 245.' },
  { charId: 'troi',   text: 'Captain, I sense aggression. Be cautious.' },
];

const IDLE_DIALOGS = [
  { charId: 'data',    text: 'Captain, long-range sensors indicate we are approaching the Neutral Zone.' },
  { charId: 'laforge', text: 'Chief Engineer to bridge: warp core efficiency at 98%. Everything is nominal.' },
  { charId: 'riker',   text: 'Captain, crew rotation complete. All stations are at peak efficiency.' },
  { charId: 'data',    text: 'Fascinating. Sensors indicate a class-M planet in the adjacent system.' },
  { charId: 'troi',   text: 'The crew is in excellent spirits, Captain.' },
  { charId: 'worf',   text: 'Captain, I recommend running a defensive systems drill.' },
  { charId: 'picard', text: 'Increase to warp seven. Let us not keep Starfleet waiting.' },
];

export class MissionSystem {
  constructor(gameState, onEncounter, onDialogue) {
    this.gs           = gameState;
    this.onEncounter  = onEncounter;   // (template, enemyKey) => void
    this.onDialogue   = onDialogue;    // ({ charId, text }) => void
    this._timer       = null;
    this._idleTimer   = null;
    this._missionIdx  = 0;
    this._started     = false;
  }

  start() {
    if (this._started) return;
    this._started = true;
    this._scheduleNextEncounter();
    this._scheduleIdleDialogue();
  }

  stop() {
    clearTimeout(this._timer);
    clearTimeout(this._idleTimer);
  }

  // ─── Encounter scheduling ─────────────────────────────────────────────────

  _scheduleNextEncounter() {
    const delay = IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN);
    this._timer = setTimeout(() => this._triggerEncounter(), delay);
  }

  _triggerEncounter() {
    if (!this.gs.isIdle()) {
      this._scheduleNextEncounter();
      return;
    }

    // Pick a random template, weight toward combat
    const pool = MISSION_TEMPLATES.filter(t => t.type === 'combat');
    const template = Math.random() < 0.15
      ? MISSION_TEMPLATES[Math.floor(Math.random() * MISSION_TEMPLATES.length)]
      : pool[Math.floor(Math.random() * pool.length)];

    const enemyKey = template.enemies.length
      ? template.enemies[Math.floor(Math.random() * template.enemies.length)]
      : 'romulan_warbird';

    // Announce with crew dialogue
    const dialog = ENCOUNTER_DIALOGS[Math.floor(Math.random() * ENCOUNTER_DIALOGS.length)];
    this.onDialogue(dialog);

    setTimeout(() => {
      this.gs.setMission({ ...template, enemyKey });
      this.onEncounter(template, enemyKey);
    }, 2200);
  }

  // ─── Idle bridge chatter ──────────────────────────────────────────────────

  _scheduleIdleDialogue() {
    const delay = 12000 + Math.random() * 20000;
    this._idleTimer = setTimeout(() => {
      if (this.gs.isIdle()) {
        const d = IDLE_DIALOGS[Math.floor(Math.random() * IDLE_DIALOGS.length)];
        this.onDialogue(d);
      }
      this._scheduleIdleDialogue();
    }, delay);
  }

  // ─── Public helpers ───────────────────────────────────────────────────────

  getVictoryDialogue() {
    return VICTORY_DIALOGS[Math.floor(Math.random() * VICTORY_DIALOGS.length)];
  }

  getDefeatDialogue() {
    return DEFEAT_DIALOGS[Math.floor(Math.random() * DEFEAT_DIALOGS.length)];
  }

  reschedule() {
    clearTimeout(this._timer);
    this._scheduleNextEncounter();
  }
}
