import { ENEMIES, GAME_STATES, ALERT_STATES, CREW } from '../utils/Constants.js';

const PLAYER_ACTION_DELAY = 1400; // ms — time for action to "execute"
const ENEMY_DELAY         = 1800; // ms — enemy response after player

export class Combat {
  constructor(gameState, shipSystems, onEvent) {
    this.gs         = gameState;
    this.sys        = shipSystems;
    this.onEvent    = onEvent;   // callback(type, payload)

    this.enemy      = null;
    this.evasive    = false;     // evasive maneuvers active this turn
    this.hailed     = false;
    this.turnLocked = false;
    this._turnTimer = null;
  }

  // ─── Start / end ──────────────────────────────────────────────────────────

  startCombat(enemyKey) {
    const template    = ENEMIES[enemyKey] ?? ENEMIES.ROMULAN_WARBIRD;
    this.enemy = {
      key:       enemyKey,
      name:      template.name,
      faction:   template.faction,
      shields:   template.shields,
      maxShields:template.shields,
      hull:      template.hull,
      maxHull:   template.hull,
      attack:    template.attack,
      accuracy:  template.accuracy,
      hailText:  template.hailResponse,
    };
    this.evasive    = false;
    this.hailed     = false;
    this.turnLocked = false;
    clearTimeout(this._turnTimer);
    this.onEvent('combatStart', { enemy: this.enemy });
  }

  endCombat(outcome) {
    clearTimeout(this._turnTimer);
    this.turnLocked = false;
    this.enemy      = null;
    this.onEvent('combatEnd', { outcome });
  }

  // ─── Player action entry point ────────────────────────────────────────────

  playerAction(action) {
    if (this.turnLocked || !this.enemy) return;

    this.turnLocked = true;
    this.evasive    = false;

    switch (action) {
      case 'phasers':   this._actionPhasers();  break;
      case 'torpedoes': this._actionTorpedo();  break;
      case 'shields':   this._actionShields();  break;
      case 'evasive':   this._actionEvasive();  break;
      case 'hail':      this._actionHail();     break;
      case 'warp':      this._actionWarp();     return;   // immediate exit
      case 'scan':      this._actionScan();     break;
      case 'repair':    this._actionRepair();   break;
      default:          this.turnLocked = false; return;
    }
  }

  // ─── Player actions ───────────────────────────────────────────────────────

  _actionPhasers() {
    const result = this.sys.firePhasers();
    if (!result.success) {
      this.onEvent('crewDialogue', {
        charId: 'worf', text: `Phasers not ready, Captain — ${result.reason}.`,
      });
      this._unlock();
      return;
    }
    this.onEvent('firePhasers', { damage: result.damage });
    this.onEvent('crewDialogue', { charId: 'worf', text: 'Phasers firing!' });

    setTimeout(() => {
      this._applyDamageToEnemy(result.damage);
      this._checkEnemyDeath() || this._enemyTurn();
    }, PLAYER_ACTION_DELAY);
  }

  _actionTorpedo() {
    const result = this.sys.fireTorpedo();
    if (!result.success) {
      this.onEvent('crewDialogue', {
        charId: 'worf', text: `Torpedo bay not ready — ${result.reason}.`,
      });
      this._unlock();
      return;
    }
    this.onEvent('fireTorpedo', { damage: result.damage });
    this.onEvent('crewDialogue', { charId: 'worf', text: 'Torpedo away!' });

    setTimeout(() => {
      this._applyDamageToEnemy(result.damage);
      this._checkEnemyDeath() || this._enemyTurn();
    }, PLAYER_ACTION_DELAY);
  }

  _actionShields() {
    if (this.sys.shields.raised) {
      this.sys.lowerShields();
      this.onEvent('crewDialogue', { charId: 'data', text: 'Shields lowered, Captain.' });
    } else {
      const ok = this.sys.raiseShields();
      this.onEvent('crewDialogue', {
        charId: 'data',
        text: ok ? `Shields up. Strength at ${Math.round(this.sys.shields.strength)}%.`
                 : 'Shield emitters offline, Captain.',
      });
    }
    this._enemyTurn();
  }

  _actionEvasive() {
    const result = this.sys.evasiveManeuvers();
    if (!result.success) {
      this.onEvent('crewDialogue', { charId: 'riker', text: 'Engines are too damaged for evasive!' });
      this._unlock();
      return;
    }
    this.evasive = true;
    this.onEvent('evasiveManeuvers', {});
    this.onEvent('crewDialogue', { charId: 'riker', text: 'Evasive maneuvers! Helm responding!' });
    this._enemyTurn();
  }

  _actionHail() {
    if (this.hailed) {
      this.onEvent('crewDialogue', {
        charId: 'picard',
        text: 'They are not responding to our hail. We must find another way.',
      });
      this._enemyTurn();
      return;
    }
    this.hailed = true;
    this.onEvent('hailing', { text: this.enemy.hailText, faction: this.enemy.faction });
    this.onEvent('crewDialogue', { charId: 'troi', text: 'I sense great hostility, Captain. They are not open to negotiation.' });

    // Some enemies might stand down (low probability)
    if (this.enemy.key === 'ferengi_marauder' && Math.random() < 0.4) {
      setTimeout(() => {
        this.onEvent('crewDialogue', { charId: 'picard', text: 'They are withdrawing. Stand down from red alert.' });
        this.endCombat('hailed');
      }, ENEMY_DELAY);
    } else {
      this._enemyTurn();
    }
  }

  _actionWarp() {
    this.onEvent('crewDialogue', { charId: 'laforge', text: 'Warp drive online — ready to engage!' });
    this.onEvent('warpOut', {});
    setTimeout(() => this.endCombat('escaped'), 1200);
  }

  _actionScan() {
    const e = this.enemy;
    const shieldPct = Math.round((e.shields / e.maxShields) * 100);
    const hullPct   = Math.round((e.hull   / e.maxHull)    * 100);
    this.onEvent('scanResult', { enemy: e });
    this.onEvent('crewDialogue', {
      charId: 'data',
      text: `Scanning ${e.name}: shields at ${shieldPct}%, hull integrity ${hullPct}%. Tactical analysis updated.`,
    });
    this._enemyTurn();
  }

  _actionRepair() {
    this.sys.repairSystems();
    const st = this.sys.getStatus();
    this.onEvent('crewDialogue', {
      charId: 'laforge',
      text: `Emergency repairs underway. Shields at ${st.shieldPct}%, hull at ${st.hullPct}%.`,
    });
    this.onEvent('repairComplete', {});
    this._enemyTurn();
  }

  // ─── Enemy turn ───────────────────────────────────────────────────────────

  _enemyTurn() {
    this._turnTimer = setTimeout(() => {
      if (!this.enemy) return;

      // Enemy AI — weighted random action
      const action = this._enemyAI();
      const evasiveMod = this.evasive ? 0.45 : 1.0;  // evasive halves hit chance
      const hit = Math.random() < this.enemy.accuracy * evasiveMod;

      if (action === 'fire') {
        if (hit) {
          const dmg     = this.enemy.attack * (0.7 + Math.random() * 0.6);
          const results = this.sys.takeDamage(Math.round(dmg));
          this.onEvent('enemyFired', { hit: true, damage: dmg, results });

          const sysHit = results.find(r => r.system === 'hull');
          if (sysHit) {
            this.onEvent('crewDialogue', {
              charId: 'worf',
              text: `Direct hit! Hull integrity at ${Math.round(this.sys.hull.integrity)}%!`,
            });
          }

          if (this.sys.isDestroyed()) {
            this.onEvent('crewDialogue', { charId: 'picard', text: 'All hands — abandon ship!' });
            setTimeout(() => this.endCombat('destroyed'), 1200);
            return;
          }
        } else {
          this.onEvent('enemyFired', { hit: false });
          this.onEvent('crewDialogue', { charId: 'data', text: `${this.enemy.name} missed. Evasive pattern successful.` });
        }
      } else if (action === 'cloak') {
        this.onEvent('crewDialogue', {
          charId: 'worf', text: `${this.enemy.name} is attempting to cloak!`,
        });
        // Re-engage after 2s
        setTimeout(() => {
          this.onEvent('crewDialogue', { charId: 'data', text: 'They have decloaked. Re-acquiring target.' });
        }, 2000);
      } else {
        this.onEvent('crewDialogue', {
          charId: 'data', text: `${this.enemy.name} is recharging weapons.`,
        });
      }

      this._unlock();
    }, ENEMY_DELAY);
  }

  _enemyAI() {
    const shieldFrac = this.enemy.shields / this.enemy.maxShields;
    // At low shields: more likely to charge or retreat
    if (shieldFrac < 0.25 && Math.random() < 0.35) return 'charge';
    // Romulans and Klingons can cloak
    if ((this.enemy.key === 'romulan_warbird' || this.enemy.key === 'klingon_bop') && Math.random() < 0.12) return 'cloak';
    return 'fire';
  }

  // ─── Damage helpers ───────────────────────────────────────────────────────

  _applyDamageToEnemy(damage) {
    if (!this.enemy) return;

    if (this.enemy.shields > 0) {
      const shieldDmg = Math.min(this.enemy.shields, damage);
      this.enemy.shields = Math.max(0, this.enemy.shields - shieldDmg);
      damage -= shieldDmg;
    }
    if (damage > 0) {
      this.enemy.hull = Math.max(0, this.enemy.hull - damage);
    }
    this.onEvent('enemyDamaged', { shields: this.enemy.shields, hull: this.enemy.hull });
  }

  _checkEnemyDeath() {
    if (!this.enemy || this.enemy.hull > 0) return false;
    this.onEvent('crewDialogue', {
      charId: 'worf', text: `${this.enemy.name} destroyed! Direct hit!`,
    });
    this.onEvent('enemyDestroyed', { name: this.enemy.name });
    setTimeout(() => {
      this.gs.addScore(100 + Math.floor(this.enemy.maxHull * 0.5));
      this.endCombat('victory');
    }, 1400);
    return true;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  _unlock() {
    this.turnLocked = false;
  }

  getEnemyStatus() {
    if (!this.enemy) return null;
    return {
      name:       this.enemy.name,
      shieldPct:  Math.round((this.enemy.shields / this.enemy.maxShields) * 100),
      hullPct:    Math.round((this.enemy.hull    / this.enemy.maxHull)    * 100),
      faction:    this.enemy.faction,
      key:        this.enemy.key,
    };
  }
}
