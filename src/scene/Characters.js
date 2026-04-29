import * as THREE from 'three';
import { COLORS, CREW } from '../utils/Constants.js';

// Station world positions (must match Bridge.js layout)
const STATION_POSES = {
  conn:        { x: -1.3,  y: -0.44, z: -3.0,  ry: 0,            sitting: true  },
  ops:         { x:  1.3,  y: -0.44, z: -3.0,  ry: 0,            sitting: true  },
  captain:     { x:  0,    y:  0,    z: -1.8,  ry: 0,            sitting: true  },
  firstOfficer:{ x:  1.9,  y:  0,    z: -1.5,  ry: 0.12,         sitting: true  },
  counselor:   { x: -1.9,  y:  0,    z: -1.5,  ry: -0.12,        sitting: true  },
  tactical:    { x:  0,    y:  0.25, z:  0.5,  ry: 0,            sitting: false },
  engineering: { x: -5.3,  y:  0.25, z:  1.5,  ry:  Math.PI / 2, sitting: false },
};

export class Characters {
  constructor(scene) {
    this.scene   = scene;
    this.crew    = {};        // id → group
    this._anims  = {};        // id → anim state

    Object.values(CREW).forEach(def => this._spawnCharacter(def));
  }

  _spawnCharacter(def) {
    const pose = STATION_POSES[def.station];
    if (!pose) return;

    const group = new THREE.Group();
    group.position.set(pose.x, pose.y, pose.z);
    group.rotation.y = pose.ry;
    group.userData = { charId: def.id, name: def.name };

    this._buildBody(group, def, pose.sitting);
    this.scene.add(group);

    this.crew[def.id] = group;
    this._anims[def.id] = {
      idlePhase: Math.random() * Math.PI * 2,
      breathPhase: Math.random() * Math.PI * 2,
      headGroup: group.getObjectByName('head_group'),
      torsoMesh: group.getObjectByName('torso'),
    };
  }

  _buildBody(group, def, sitting) {
    const skin     = def.skinColor;
    const uniform  = def.uniformColor;
    const yBase    = sitting ? 0.44 : 0; // seated height offset

    const skinMat    = new THREE.MeshLambertMaterial({ color: skin });
    const uniformMat = new THREE.MeshLambertMaterial({ color: uniform });
    const blackMat   = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const pantsMat   = new THREE.MeshLambertMaterial({ color: 0x111122 });

    // ── Torso ──
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.22), uniformMat);
    torso.position.y = yBase + 0.26 + (sitting ? 0 : 0);
    torso.name = 'torso';
    group.add(torso);

    // Collar (black trim at top of uniform)
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.07, 0.23), blackMat);
    collar.position.y = yBase + 0.49;
    group.add(collar);

    // Division color pip stripe on chest
    const pipMat = new THREE.MeshBasicMaterial({ color: 0xFFCC00 });
    const pipRow = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.01), pipMat);
    pipRow.position.set(0.07, yBase + 0.44, 0.12);
    group.add(pipRow);

    // ── Legs / lower body ──
    if (!sitting) {
      const legMat = pantsMat;
      [-0.1, 0.1].forEach(lx => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.5, 8), legMat);
        leg.position.set(lx, yBase - 0.25, 0);
        group.add(leg);

        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.22), blackMat);
        boot.position.set(lx, yBase - 0.54, 0.02);
        group.add(boot);
      });
    }

    // ── Arms ──
    [-0.26, 0.26].forEach(ax => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.45, 8), uniformMat);
      arm.position.set(ax, yBase + 0.18, 0);
      arm.rotation.z = ax > 0 ? -0.15 : 0.15;
      group.add(arm);

      // Hand
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), skinMat);
      hand.position.set(ax * 1.06, yBase - 0.03, 0);
      group.add(hand);
    });

    // ── Neck ──
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.11, 8), skinMat);
    neck.position.y = yBase + 0.56;
    group.add(neck);

    // ── Head group (for idle nod animation) ──
    const headGroup = new THREE.Group();
    headGroup.position.y = yBase + 0.70;
    headGroup.name = 'head_group';
    group.add(headGroup);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 10), skinMat);
    headGroup.add(head);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const eyeMat = def.id === 'data'
      ? new THREE.MeshBasicMaterial({ color: 0xFFFF88 })  // Data's golden eyes
      : new THREE.MeshBasicMaterial({ color: 0x1A1A1A });
    [-0.055, 0.055].forEach(ex => {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(ex, 0.015, 0.135);
      headGroup.add(eye);
    });

    // Worf's forehead ridges
    if (def.id === 'worf') {
      const ridgeMat = new THREE.MeshLambertMaterial({ color: skin });
      for (let i = 0; i < 4; i++) {
        const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.025, 0.04), ridgeMat);
        ridge.position.set(0, 0.06 - i * 0.035, 0.12);
        ridge.rotation.x = 0.4;
        headGroup.add(ridge);
      }
    }

    // Picard — bald = smooth, slight shine
    if (def.id === 'picard') {
      const baldMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.5, metalness: 0.05 });
      const baldHead = new THREE.Mesh(new THREE.SphereGeometry(0.156, 12, 10), baldMat);
      headGroup.add(baldHead);
    }

    // La Forge's VISOR
    if (def.id === 'laforge') {
      const visorMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.04), visorMat);
      visor.position.set(0, 0.015, 0.13);
      headGroup.add(visor);

      // VISOR glow
      const visorGlow = new THREE.PointLight(0xFF4400, 0.8, 0.4);
      visorGlow.position.set(0, 0.015, 0.18);
      headGroup.add(visorGlow);
    }

    // Troi — hair volume
    if (def.id === 'troi') {
      const hairMat = new THREE.MeshLambertMaterial({ color: 0x1A0A00 });
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat);
      hair.position.y = 0.04;
      hair.scale.set(1, 0.8, 1.1);
      headGroup.add(hair);
    }

    // Riker — beard
    if (def.id === 'riker') {
      const beardMat = new THREE.MeshLambertMaterial({ color: 0x3A2510 });
      const beard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.06), beardMat);
      beard.position.set(0, -0.1, 0.1);
      headGroup.add(beard);
    }

    // Data — pale grid lines on face (emissive)
    if (def.id === 'data') {
      const gridMat = new THREE.MeshBasicMaterial({ color: 0xCCCC88, transparent: true, opacity: 0.15 });
      const gridLine = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.005, 0.01), gridMat);
      for (let i = 0; i < 3; i++) {
        const gl = gridLine.clone();
        gl.position.set(0, -0.04 + i * 0.04, 0.135);
        headGroup.add(gl);
      }
    }

    // Sitting characters get slightly bent posture
    if (sitting) {
      torso.rotation.x = -0.08;
    }
  }

  // ─── Update (idle animations) ─────────────────────────────────────────────

  update(delta) {
    const t = performance.now() * 0.001;

    Object.entries(this._anims).forEach(([id, anim]) => {
      if (!anim.headGroup) return;
      const p = anim.idlePhase;
      // Subtle head sway
      anim.headGroup.rotation.y = Math.sin(t * 0.4 + p) * 0.06;
      anim.headGroup.rotation.x = Math.sin(t * 0.25 + p * 1.3) * 0.03;

      // Breathing — torso
      if (anim.torsoMesh) {
        anim.torsoMesh.scale.y = 1 + Math.sin(t * 1.2 + anim.breathPhase) * 0.012;
      }
    });
  }

  // ─── Highlight character for dialogue ────────────────────────────────────

  highlight(charId) {
    const g = this.crew[charId];
    if (!g) return;
    g.traverse(obj => {
      if (obj.isMesh && obj.material) {
        obj.material.emissive?.setHex(0x222200);
      }
    });
    setTimeout(() => {
      g.traverse(obj => {
        if (obj.isMesh && obj.material?.emissive) {
          obj.material.emissive.setHex(0x000000);
        }
      });
    }, 1200);
  }

  getWorldPosition(charId) {
    const g = this.crew[charId];
    if (!g) return new THREE.Vector3();
    return g.position.clone();
  }
}
