import * as THREE from 'three';

import { CONFIG, GAME_STATES, ALERT_STATES } from './utils/Constants.js';
import { audio }                              from './utils/AudioManager.js';
import { Bridge }                             from './scene/Bridge.js';
import { Characters }                         from './scene/Characters.js';
import { Viewscreen }                         from './scene/Viewscreen.js';
import { GameState }                          from './game/GameState.js';
import { ShipSystems }                        from './game/ShipSystems.js';
import { Combat }                             from './game/Combat.js';
import { MissionSystem }                      from './game/Missions.js';
import { LCARS }                              from './ui/LCARS.js';
import { InputManager }                       from './controls/InputManager.js';

// ─── Bootstrap ────────────────────────────────────────────────────────────────

class BridgeSimulator {
  constructor() {
    this._canvas     = document.getElementById('game-canvas');
    this._clock      = new THREE.Clock();
    this._frameId    = null;

    this._initRenderer();
    this._initScene();
    this._initSystems();
    this._hookEvents();
    this._load();
  }

  // ─── Renderer / Scene / Camera ────────────────────────────────────────────

  _initRenderer() {
    this._renderer = new THREE.WebGLRenderer({
      canvas:     this._canvas,
      antialias:  true,
      powerPreference: 'high-performance',
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    this._renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.0;

    window.addEventListener('resize', () => this._onResize());
  }

  _initScene() {
    this._scene  = new THREE.Scene();
    this._scene.background = new THREE.Color(0x000005);
    this._scene.fog        = new THREE.FogExp2(0x000005, 0.035);

    this._camera = new THREE.PerspectiveCamera(
      CONFIG.CAM_FOV,
      window.innerWidth / window.innerHeight,
      CONFIG.CAM_NEAR,
      CONFIG.CAM_FAR
    );
    this._camera.position.set(
      CONFIG.CAM_START_POS.x,
      CONFIG.CAM_START_POS.y,
      CONFIG.CAM_START_POS.z
    );

    // Global ambient — dark blue fill
    const ambient = new THREE.AmbientLight(0x303050, 3.5);
    this._scene.add(ambient);

    // Soft overhead fill
    const dirLight = new THREE.DirectionalLight(0xFFE0CC, 0.8);
    dirLight.position.set(0, 10, 2);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    this._scene.add(dirLight);
  }

  _initSystems() {
    // Game state
    this._gs      = new GameState();
    this._sys     = new ShipSystems();

    // Combat engine — all game events flow through _onCombatEvent
    this._combat  = new Combat(this._gs, this._sys, (type, payload) => this._onCombatEvent(type, payload));

    // Mission scheduler
    this._missions = new MissionSystem(
      this._gs,
      (template, enemyKey) => this._onEncounterTriggered(template, enemyKey),
      (dialogue)           => this._onCrewDialogue(dialogue)
    );

    // UI
    this._lcars  = new LCARS();
  }

  _hookEvents() {
    // Global alert state → bridge + UI sync
    this._gs.on('alertChange', (level) => {
      this._bridge?.setAlertState(level);
      this._lcars.setAlertState(level);
      if (level === ALERT_STATES.RED) audio.play('red_alert');
    });

    this._gs.on('stateChange', (next) => {
      this._lcars.lockActions(next !== GAME_STATES.COMBAT);
    });

    this._gs.on('stardateChange', () => {
      this._lcars.updateNavigation(this._gs);
    });
  }

  // ─── Loading sequence ─────────────────────────────────────────────────────

  async _load() {
    const steps = [
      [10,  'Engaging warp core...'],
      [25,  'Initializing bridge systems...'],
      [40,  'Loading sensor arrays...'],
      [55,  'Assembling bridge geometry...'],
      [70,  'Placing crew at stations...'],
      [82,  'Calibrating LCARS displays...'],
      [92,  'Running tactical diagnostics...'],
      [100, 'All systems nominal. Engage!'],
    ];

    for (const [pct, msg] of steps) {
      this._lcars.setLoadingProgress(pct, msg);
      await this._delay(pct < 70 ? 250 : 180);
    }

    // Build 3D objects
    this._bridge     = new Bridge(this._scene);
    this._characters = new Characters(this._scene);
    this._viewscreen = new Viewscreen(this._scene);

    // Input
    this._input = new InputManager(this._canvas, this._camera, this._renderer.domElement);
    this._input.setInteractiveObjects(this._bridge.interactiveObjects);
    this._input.onInput((type, payload) => this._handleInput(type, payload));
    this._input.onHover((data) => {
      if (data?.label) this._lcars.setCrewStatus(data.label);
    });
    this._input.bindGlobalAction((type, payload) => this._handleInput(type, payload));

    // Start rendering
    this._gs.setState(GAME_STATES.IDLE);
    this._lcars.lockActions(true); // no combat actions during idle
    await this._delay(400);
    this._lcars.hideLoading();
    this._startLoop();

    // Welcome dialogue
    await this._delay(1200);
    this._lcars.showDialogue('picard', 'Captain\'s log. We are on patrol in Sector 001. All hands at their posts. Today should be… interesting.', 5000);
    this._lcars.updateNavigation(this._gs);

    // Start mission scheduler
    await this._delay(3000);
    this._missions.start();
    this._initAudio();
  }

  // ─── Main loop ────────────────────────────────────────────────────────────

  _startLoop() {
    const loop = () => {
      this._frameId = requestAnimationFrame(loop);
      const delta   = Math.min(this._clock.getDelta(), CONFIG.DELTA_CAP);

      this._update(delta);
      this._renderer.render(this._scene, this._camera);
    };
    loop();
  }

  _update(delta) {
    this._input?.update();
    this._bridge?.update(delta);
    this._characters?.update(delta);
    this._viewscreen?.update(delta);
    this._sys.update(delta);
    this._gs.advanceStardate(delta * 0.001);

    // Periodic UI refresh (every frame is fine for bars)
    this._lcars.updateShipStatus(this._sys.getStatus());
    this._lcars.updateNavigation(this._gs);
    this._lcars.updateSensor(delta, this._gs, this._combat.getEnemyStatus());

    if (this._gs.isInCombat()) {
      this._lcars.updateEnemyStatus(this._combat.getEnemyStatus());
    }
  }

  // ─── Input handling ───────────────────────────────────────────────────────

  _handleInput(type, payload) {
    audio.resume();

    switch (type) {
      case 'gameAction':
        if (this._gs.isInCombat()) {
          this._combat.playerAction(payload.action);
        }
        break;

      case 'stationClick':
        this._onStationClick(payload);
        break;

      case 'resetCamera':
        this._input.resetCamera(
          CONFIG.CAM_START_TARGET,
          CONFIG.CAM_START_POS
        );
        break;

      case 'mute':
        audio.toggleMute();
        break;

      case 'pause':
        this._gs.paused = !this._gs.paused;
        break;
    }
  }

  _onStationClick(data) {
    if (!data?.stationId) return;
    audio.play('beep');

    const lines = {
      tactical:    { charId: 'worf',    text: 'Captain, tactical systems are fully armed. All phaser banks charged.' },
      conn:        { charId: 'picard',  text: 'Conn — maintain present course, maximum warp.' },
      ops:         { charId: 'data',    text: 'Operations is running at peak efficiency, Captain.' },
      engineering: { charId: 'laforge', text: 'Engineering: warp core output is nominal. We are running at 110 percent.' },
      science:     { charId: 'data',    text: 'Science sensors are detecting several interesting anomalies in this sector.' },
      captain:     { charId: 'picard',  text: 'The bridge is the heart of the Enterprise. From here, we explore the unknown.' },
      firstOfficer:{ charId: 'riker',   text: 'Ready to execute your orders, Captain.' },
      counselor:   { charId: 'troi',    text: 'The crew is focused and alert, Captain.' },
    };

    const line = lines[data.stationId];
    if (line) {
      this._lcars.showDialogue(line.charId, line.text);
      this._characters?.highlight(line.charId);
    }
  }

  // ─── Encounter / Mission ──────────────────────────────────────────────────

  _onEncounterTriggered(template, enemyKey) {
    this._gs.setState(GAME_STATES.ENCOUNTER);
    this._gs.setAlert(ALERT_STATES.YELLOW);
    this._lcars.showMissionBanner(template.type, template.title);

    setTimeout(() => {
      this._gs.setAlert(ALERT_STATES.RED);
      this._gs.setState(GAME_STATES.COMBAT);
      this._lcars.lockActions(false);
      this._combat.startCombat(enemyKey);
      this._viewscreen.setCombatMode(enemyKey);
      this._lcars.showDialogue('worf',
        `${this._combat.getEnemyStatus()?.name} detected! Red alert — all hands to battle stations!`, 4000);
    }, 3000);
  }

  // ─── Combat events ────────────────────────────────────────────────────────

  _onCombatEvent(type, payload) {
    switch (type) {
      case 'combatStart':
        this._lcars.setCrewStatus('BATTLE STATIONS');
        break;

      case 'firePhasers':
        audio.play('phaser_fire');
        this._viewscreen.firePhasers();
        this._lcars.lockActions(true);
        setTimeout(() => this._lcars.lockActions(false), 1400);
        break;

      case 'fireTorpedo':
        audio.play('torpedo_fire');
        this._viewscreen.fireTorpedo();
        this._lcars.lockActions(true);
        setTimeout(() => this._lcars.lockActions(false), 1400);
        break;

      case 'evasiveManeuvers':
        audio.play('evasive');
        break;

      case 'hailing':
        audio.play('hail');
        this._lcars.showDialogue('riker', `Hailing ${payload.faction}: "${payload.text}"`, 5500);
        break;

      case 'enemyFired':
        if (payload.hit) {
          audio.play(this._sys.shields.raised ? 'shield_hit' : 'hull_hit');
          this._viewscreen.showHullHit();
          this._triggerScreenShake();
        }
        break;

      case 'enemyDamaged':
        this._lcars.updateEnemyStatus(this._combat.getEnemyStatus());
        break;

      case 'enemyDestroyed':
        audio.play('explosion');
        this._viewscreen.setCombatMode('exploding');
        setTimeout(() => this._viewscreen.setNormalMode(), 2200);
        break;

      case 'crewDialogue':
        this._onCrewDialogue(payload);
        break;

      case 'repairComplete':
        audio.play('repair');
        break;

      case 'warpOut':
        audio.play('warp_engage');
        this._viewscreen.setWarpMode();
        this._lcars.lockActions(true);
        break;

      case 'combatEnd':
        this._onCombatEnd(payload.outcome);
        break;
    }
  }

  _onCombatEnd(outcome) {
    this._gs.setState(GAME_STATES.MISSION_END);
    this._gs.setAlert(ALERT_STATES.NORMAL);
    this._lcars.lockActions(true);
    this._lcars.updateEnemyStatus(null);

    let dialogue;
    if (outcome === 'victory') {
      dialogue = this._missions.getVictoryDialogue();
      this._lcars.showMissionBanner('MISSION COMPLETE', `+${this._gs.score} POINTS`);
      audio.play('victory');
    } else if (outcome === 'destroyed') {
      dialogue = this._missions.getDefeatDialogue();
      this._lcars.showMissionBanner('SHIP DESTROYED', 'RESTARTING MISSION');
      audio.play('defeat');
      setTimeout(() => this._resetShip(), 5000);
    } else if (outcome === 'escaped') {
      dialogue = { charId: 'riker', text: 'We are clear of the enemy. Good work, everyone.' };
    } else if (outcome === 'hailed') {
      dialogue = { charId: 'picard', text: 'Diplomacy — the finest tool in our arsenal.' };
      audio.play('victory');
    }

    if (dialogue) this._lcars.showDialogue(dialogue.charId, dialogue.text, 5000);

    setTimeout(() => {
      this._viewscreen.setNormalMode();
      this._gs.setState(GAME_STATES.IDLE);
      this._missions.reschedule();
    }, 6000);
  }

  _onCrewDialogue(dialogue) {
    this._lcars.showDialogue(dialogue.charId, dialogue.text);
    this._characters?.highlight(dialogue.charId);
  }

  // ─── Ship reset after destruction ─────────────────────────────────────────

  _resetShip() {
    this._sys.reset();
    this._viewscreen.setNormalMode();
    this._gs.setState(GAME_STATES.IDLE);
    this._gs.setAlert(ALERT_STATES.NORMAL);
    this._lcars.lockActions(true);
    this._lcars.showDialogue('picard', 'Damage control teams report. Let us get back to work.', 4000);
    this._missions.reschedule();
  }

  // ─── Screen shake ─────────────────────────────────────────────────────────

  _triggerScreenShake() {
    const orig = this._camera.position.clone();
    const strength = 0.08;
    let t = 0;
    const shake = () => {
      t += 0.04;
      if (t > 1) { this._camera.position.copy(orig); return; }
      this._camera.position.x = orig.x + (Math.random() - 0.5) * strength * (1 - t);
      this._camera.position.y = orig.y + (Math.random() - 0.5) * strength * (1 - t);
      requestAnimationFrame(shake);
    };
    shake();
  }

  // ─── Audio init ───────────────────────────────────────────────────────────

  _initAudio() {
    // Web Audio needs user gesture — init on first real interaction
    const initOnce = () => {
      audio.init();
      window.removeEventListener('click',     initOnce);
      window.removeEventListener('touchstart',initOnce);
      window.removeEventListener('keydown',   initOnce);
    };
    window.addEventListener('click',      initOnce);
    window.addEventListener('touchstart', initOnce, { passive: true });
    window.addEventListener('keydown',    initOnce);
  }

  // ─── Resize ───────────────────────────────────────────────────────────────

  _onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h);
  }

  // ─── Utility ──────────────────────────────────────────────────────────────

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}

// ─── Start ────────────────────────────────────────────────────────────────────

new BridgeSimulator();
