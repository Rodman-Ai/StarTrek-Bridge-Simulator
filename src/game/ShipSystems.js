export class ShipSystems {
  constructor() {
    this.reset();
  }

  reset() {
    this.shields    = { strength: 100, max: 100, raised: true  };
    this.hull       = { integrity: 100, max: 100 };
    this.weapons    = { phasers: 100, torpedoes: 10, maxTorpedoes: 10, phaserCharge: 100 };
    this.engines    = { warpPower: 100, impulsePower: 100, online: true };
    this.power      = { total: 100, available: 100 };
    this.sensors    = { online: true, range: 100 };
    this.lifeSup    = { online: true, integrity: 100 };
    this.comms      = { online: true };

    // Damage flags
    this.damaged    = {
      shields: false, engines: false, weapons: false, sensors: false,
    };
  }

  // ─── Damage ───────────────────────────────────────────────────────────────

  takeDamage(amount) {
    const results = [];

    if (this.shields.raised && this.shields.strength > 0) {
      const absorbed = Math.min(this.shields.strength, amount);
      this.shields.strength = Math.max(0, this.shields.strength - absorbed);
      amount -= absorbed;
      results.push({ system: 'shields', absorbed });

      if (this.shields.strength === 0) {
        this.shields.raised = false;
        results.push({ system: 'shields', event: 'failed' });
      }
    }

    if (amount > 0) {
      this.hull.integrity = Math.max(0, this.hull.integrity - amount);
      results.push({ system: 'hull', damage: amount });

      // System damage from hull hits
      if (amount > 15 && Math.random() < 0.3) {
        const systems = ['shields', 'engines', 'weapons', 'sensors'];
        const dmgSys  = systems[Math.floor(Math.random() * systems.length)];
        this.damaged[dmgSys] = true;
        results.push({ system: dmgSys, event: 'damaged' });
      }
    }

    return results;
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  raiseShields() {
    if (this.shields.strength > 0) {
      this.shields.raised = true;
      return true;
    }
    return false;
  }

  lowerShields() {
    this.shields.raised = false;
  }

  firePhasers() {
    if (this.damaged.weapons) return { success: false, reason: 'weapons damaged' };
    if (this.weapons.phaserCharge < 20) return { success: false, reason: 'charging' };
    const damage = 20 + Math.random() * 25;
    this.weapons.phaserCharge = Math.max(0, this.weapons.phaserCharge - 30);
    return { success: true, damage };
  }

  fireTorpedo() {
    if (this.damaged.weapons)   return { success: false, reason: 'weapons damaged' };
    if (this.weapons.torpedoes <= 0) return { success: false, reason: 'no torpedoes' };
    const damage = 35 + Math.random() * 30;
    this.weapons.torpedoes--;
    return { success: true, damage };
  }

  repairSystems() {
    // Partial repair each call
    if (this.damaged.shields  && Math.random() < 0.6) {
      this.damaged.shields  = false;
      this.shields.strength = Math.min(this.shields.max, this.shields.strength + 20);
    }
    if (this.damaged.engines  && Math.random() < 0.5) this.damaged.engines  = false;
    if (this.damaged.weapons  && Math.random() < 0.5) this.damaged.weapons  = false;
    if (this.damaged.sensors  && Math.random() < 0.7) this.damaged.sensors  = false;

    // Minor hull repair
    this.hull.integrity = Math.min(this.hull.max, this.hull.integrity + 5);
  }

  evasiveManeuvers() {
    // Evasive reduces incoming hit chance temporarily; handled in Combat
    if (this.damaged.engines) return { success: false, reason: 'engines damaged' };
    return { success: true };
  }

  // ─── Per-frame tick ───────────────────────────────────────────────────────

  update(delta) {
    // Recharge phasers
    if (this.weapons.phaserCharge < 100) {
      this.weapons.phaserCharge = Math.min(100, this.weapons.phaserCharge + delta * 18);
    }
    // Slow shield recharge when raised and under 30%
    if (this.shields.raised && this.shields.strength < 30) {
      this.shields.strength = Math.min(30, this.shields.strength + delta * 1.5);
    }
  }

  // ─── Status snapshot for UI ───────────────────────────────────────────────

  getStatus() {
    return {
      shieldPct:    Math.round(this.shields.strength),
      hullPct:      Math.round(this.hull.integrity),
      powerPct:     Math.round(this.power.available),
      shieldsUp:    this.shields.raised,
      torpedoes:    this.weapons.torpedoes,
      maxTorpedoes: this.weapons.maxTorpedoes,
      phasersReady: this.weapons.phaserCharge >= 20 && !this.damaged.weapons,
      damaged:      { ...this.damaged },
    };
  }

  isDestroyed() { return this.hull.integrity <= 0; }
}
