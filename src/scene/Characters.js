import * as THREE from 'three';
import { COLORS, CREW } from '../utils/Constants.js';

const HR = 0.22;  // head radius (was 0.155)

const STATION_POSES = {
  conn:         { x: -1.3,  y: -0.44, z: -3.0,  ry: 0,            sitting: true  },
  ops:          { x:  1.3,  y: -0.44, z: -3.0,  ry: 0,            sitting: true  },
  captain:      { x:  0,    y:  0,    z: -1.8,  ry: 0,            sitting: true  },
  firstOfficer: { x:  1.9,  y:  0,    z: -1.5,  ry: 0.12,         sitting: true  },
  counselor:    { x: -1.9,  y:  0,    z: -1.5,  ry: -0.12,        sitting: true  },
  tactical:     { x:  0,    y:  0.25, z:  0.5,  ry: 0,            sitting: false },
  engineering:  { x: -5.3,  y:  0.25, z:  1.5,  ry:  Math.PI / 2, sitting: false },
};

// Character-specific scale variations for proportion diversity
const CHAR_SCALES = {
  worf:    { x: 1.12, y: 1.05, z: 1.12 },
  picard:  { x: 0.95, y: 1.00, z: 0.95 },
  data:    { x: 1.00, y: 1.02, z: 1.00 },
  troi:    { x: 0.92, y: 0.97, z: 0.92 },
  riker:   { x: 1.08, y: 1.04, z: 1.08 },
  laforge: { x: 0.98, y: 0.99, z: 0.98 },
};

const RANK_PIPS = {
  'Captain':       4,
  'Commander':     3,
  'Lt. Commander': 2,
  'Lieutenant':    1,
  'Counselor':     2,
};

export class Characters {
  constructor(scene) {
    this.scene  = scene;
    this.crew   = {};
    this._anims = {};

    Object.values(CREW).forEach(def => this._spawnCharacter(def));
  }

  _spawnCharacter(def) {
    const pose = STATION_POSES[def.station];
    if (!pose) return;

    const group = new THREE.Group();
    group.position.set(pose.x, pose.y, pose.z);
    group.rotation.y = pose.ry;
    group.userData = { charId: def.id, name: def.name };

    const sc = CHAR_SCALES[def.id] || { x: 1, y: 1, z: 1 };
    group.scale.set(sc.x, sc.y, sc.z);

    this._buildBody(group, def, pose.sitting);
    this._addNameLabel(group, def, pose.sitting ? 1.85 : 2.15);

    this.scene.add(group);
    this.crew[def.id] = group;

    const headGroup = group.getObjectByName('head_group');
    this._anims[def.id] = {
      idlePhase:   Math.random() * Math.PI * 2,
      breathPhase: Math.random() * Math.PI * 2,
      blinkTimer:  Math.random() * 4 + 2,
      blinking:    false,
      headGroup,
      torsoMesh:   group.getObjectByName('torso'),
    };
  }

  // ─── Name label sprite ───────────────────────────────────────────────────

  _addNameLabel(group, def, yTop) {
    const W = 256, LH = 48;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = LH;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, W, LH);
    ctx.strokeStyle = '#FF9900';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, W - 2, LH - 2);

    // Division color sidebar
    const divColor = { command: '#8B1A1A', operations: '#AA8800', sciences: '#006666' }[def.division] || '#666';
    ctx.fillStyle = divColor;
    ctx.fillRect(0, 0, 9, LH);

    ctx.fillStyle = '#FFCC99';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(def.rank.toUpperCase(), 14, 15);

    ctx.fillStyle = '#FF9900';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(def.name.toUpperCase(), 14, 34);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.92 });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.1, 0.22, 1);
    sprite.position.set(0, yTop, 0);
    group.add(sprite);
  }

  // ─── Combadge ────────────────────────────────────────────────────────────

  _buildCombadge(group, yBase) {
    const shape = new THREE.Shape();
    shape.moveTo(0,     0.068);
    shape.lineTo(0.058, -0.038);
    shape.lineTo(0.038, -0.038);
    shape.lineTo(0.038, -0.086);
    shape.lineTo(-0.038,-0.086);
    shape.lineTo(-0.038,-0.038);
    shape.lineTo(-0.058,-0.038);
    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshStandardMaterial({ color: 0xFFCC00, metalness: 0.8, roughness: 0.2 });
    const badge = new THREE.Mesh(geo, mat);
    badge.position.set(0.05, yBase + 0.43, 0.116);
    group.add(badge);
  }

  _browColor(id) {
    return {
      picard: 0x5A3A1A, riker: 0x3A2510, data: 0x888855,
      worf:   0x221108, troi:  0x1A0A00, laforge: 0x111108,
    }[id] || 0x3A2A1A;
  }

  // ─── Body assembly ───────────────────────────────────────────────────────

  _buildBody(group, def, sitting) {
    const skin    = def.skinColor;
    const uniform = def.uniformColor;
    const yBase   = sitting ? 0.44 : 0;

    const skinMat    = new THREE.MeshStandardMaterial({ color: skin,    roughness: 0.65, metalness: 0.05 });
    const uniformMat = new THREE.MeshLambertMaterial({ color: uniform });
    const blackMat   = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const pantsMat   = new THREE.MeshLambertMaterial({ color: 0x111122 });

    // ── Torso ──
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.22), uniformMat);
    torso.position.y = yBase + 0.26;
    torso.name = 'torso';
    if (sitting) torso.rotation.x = -0.06;
    group.add(torso);

    // Collar detail
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.07, 0.23), blackMat);
    collar.position.y = yBase + 0.49;
    group.add(collar);

    // Undershirt strip at collar opening
    const undershirt = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.04, 0.10), blackMat);
    undershirt.position.set(0, yBase + 0.508, 0.08);
    group.add(undershirt);

    // Shoulder stripes (division color accent)
    [-0.21, 0.21].forEach(sx => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.04, 0.22), uniformMat);
      strap.position.set(sx, yBase + 0.49, 0);
      group.add(strap);
    });

    // Chest pip stripe
    const pipMat = new THREE.MeshBasicMaterial({ color: 0xFFCC00 });
    const pipRow = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.018, 0.01), pipMat);
    pipRow.position.set(0.06, yBase + 0.43, 0.12);
    group.add(pipRow);

    // Combadge
    this._buildCombadge(group, yBase);

    // Rank pips on collar
    const pipCount = RANK_PIPS[def.rank] || 1;
    const pipGeo = new THREE.SphereGeometry(0.011, 6, 6);
    const pipMatS = new THREE.MeshStandardMaterial({ color: 0xFFCC00, metalness: 0.9, roughness: 0.1 });
    for (let i = 0; i < Math.min(pipCount, 4); i++) {
      const pip = new THREE.Mesh(pipGeo, pipMatS);
      pip.position.set(-0.075 + i * 0.026, yBase + 0.508, 0.116);
      group.add(pip);
    }

    // ── Legs ──
    if (!sitting) {
      [-0.1, 0.1].forEach(lx => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.5, 8), pantsMat);
        leg.position.set(lx, yBase - 0.25, 0);
        group.add(leg);
        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.22), blackMat);
        boot.position.set(lx, yBase - 0.54, 0.02);
        group.add(boot);
      });
    } else {
      // Seated: thigh horizontal forward, shin vertical down
      [-0.1, 0.1].forEach(lx => {
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.26, 8), pantsMat);
        thigh.rotation.x = Math.PI / 2;
        thigh.position.set(lx, yBase - 0.12, 0.13);
        group.add(thigh);

        const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.30, 8), pantsMat);
        shin.position.set(lx, yBase - 0.27, 0.26);
        group.add(shin);

        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.18), blackMat);
        boot.position.set(lx, yBase - 0.42, 0.27);
        group.add(boot);
      });
    }

    // ── Arms (grouped for rotation) ──
    [-0.26, 0.26].forEach(ax => {
      const armGrp = new THREE.Group();
      armGrp.position.set(ax, yBase + 0.235, sitting ? 0.04 : 0);
      armGrp.rotation.z = ax > 0 ? -0.15 : 0.15;
      armGrp.rotation.x = sitting ? 0.42 : 0;
      group.add(armGrp);

      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.44, 8), uniformMat);
      arm.position.y = -0.22;
      armGrp.add(arm);

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), skinMat);
      hand.position.y = -0.44;
      armGrp.add(hand);

      // Finger suggestions
      for (let fi = 0; fi < 3; fi++) {
        const finger = new THREE.Mesh(
          new THREE.CylinderGeometry(0.009, 0.007, 0.06, 5), skinMat
        );
        finger.position.set((fi - 1) * 0.02, -0.475, 0.018);
        finger.rotation.x = -0.35;
        armGrp.add(finger);
      }
    });

    // ── Neck ──
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.11, 8), skinMat);
    neck.position.y = yBase + 0.58;
    group.add(neck);

    // ── Head group ──
    const headGroup = new THREE.Group();
    headGroup.position.y = yBase + 0.72;
    headGroup.name = 'head_group';
    group.add(headGroup);

    // Head mesh
    const headMat = def.id === 'picard'
      ? new THREE.MeshStandardMaterial({ color: skin, roughness: 0.5, metalness: 0.05 })
      : skinMat.clone();
    const head = new THREE.Mesh(new THREE.SphereGeometry(HR, 14, 12), headMat);
    headGroup.add(head);

    // ── Eyes: sclera + iris + pupil ──
    const scleraMat = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, roughness: 0.7 });
    const irisMat   = def.id === 'data'
      ? new THREE.MeshBasicMaterial({ color: 0xFFFF88 })
      : new THREE.MeshStandardMaterial({ color: 0x1A3A1A, roughness: 0.5 });
    const pupilMat  = new THREE.MeshBasicMaterial({ color: 0x040404 });

    const eyeLidsGrp = new THREE.Group();
    eyeLidsGrp.name = 'eyelids_group';

    [-0.074, 0.074].forEach((ex, ei) => {
      const ey = 0.022, ez = HR * 0.87;

      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.031, 8, 8), scleraMat);
      sclera.position.set(ex, ey, ez);
      headGroup.add(sclera);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.021, 8, 8), irisMat);
      iris.position.set(ex, ey, ez + 0.006);
      headGroup.add(iris);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), pupilMat);
      pupil.position.set(ex, ey, ez + 0.014);
      headGroup.add(pupil);

      // Eyelid hemisphere for blink
      const lidMat = new THREE.MeshLambertMaterial({ color: skin });
      const lid = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.5),
        lidMat
      );
      lid.position.set(ex, ey, ez);
      lid.rotation.x = Math.PI;
      lid.scale.y = 0.01;
      eyeLidsGrp.add(lid);
    });

    headGroup.add(eyeLidsGrp);

    // ── Eyebrows ──
    const browMat = new THREE.MeshLambertMaterial({ color: this._browColor(def.id) });
    [-0.072, 0.072].forEach(ex => {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.017, 0.018), browMat);
      brow.position.set(ex, 0.065, HR * 0.87);
      brow.rotation.z = ex < 0 ? 0.18 : -0.18;
      headGroup.add(brow);
    });

    // ── Nose ──
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.016, 0.038, 6), skinMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, -0.018, HR * 0.92);
    headGroup.add(nose);

    // ── Mouth ──
    const mouthMat = new THREE.MeshLambertMaterial({ color: 0x882222 });
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.011, 0.01), mouthMat);
    mouth.position.set(0, -0.068, HR * 0.9);
    headGroup.add(mouth);

    // ── Ears ──
    [-1, 1].forEach(side => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), skinMat);
      ear.scale.set(0.48, 0.9, 0.45);
      ear.position.set(side * HR * 0.96, 0, 0);
      headGroup.add(ear);
    });

    // ── Character-specific features ──
    this._addCharacterFeatures(headGroup, def, skin, skinMat, yBase, group);
  }

  _addCharacterFeatures(headGroup, def, skin, skinMat, yBase, group) {
    if (def.id === 'worf') {
      const ridgeMat = new THREE.MeshLambertMaterial({ color: skin });
      for (let i = 0; i < 6; i++) {
        const w = 0.21 - i * 0.014;
        const ridge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.021, 0.038), ridgeMat);
        ridge.position.set(0, 0.095 - i * 0.031, HR * 0.82);
        ridge.rotation.x = 0.33;
        headGroup.add(ridge);
      }
      // Wider Klingon jaw
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.09, 0.17), ridgeMat);
      jaw.position.set(0, -0.115, 0.025);
      headGroup.add(jaw);
    }

    if (def.id === 'picard') {
      // Side fringe of remaining hair
      const hairMat = new THREE.MeshLambertMaterial({ color: 0x8A7A6A });
      [-1, 1].forEach(side => {
        const fringe = new THREE.Mesh(
          new THREE.SphereGeometry(0.024, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat
        );
        fringe.position.set(side * HR * 0.88, 0.085, -0.018);
        headGroup.add(fringe);
      });
    }

    if (def.id === 'laforge') {
      const visorMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.92, roughness: 0.08 });
      // Main visor bar
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.062, 0.044), visorMat);
      visor.position.set(0, 0.02, HR * 0.87);
      headGroup.add(visor);
      // Temple arms
      [-1, 1].forEach(side => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.012, 0.065), visorMat);
        arm.position.set(side * 0.158, 0.02, HR * 0.83);
        headGroup.add(arm);
      });
      // Scan lines on visor face
      const scanMat = new THREE.MeshBasicMaterial({ color: 0xFF4400, transparent: true, opacity: 0.72 });
      for (let i = 0; i < 3; i++) {
        const sl = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.004, 0.004), scanMat);
        sl.position.set(0, 0.01 + i * 0.014, HR * 0.91);
        headGroup.add(sl);
      }
      const visorGlow = new THREE.PointLight(0xFF4400, 0.8, 0.4);
      visorGlow.position.set(0, 0.02, HR * 0.97);
      headGroup.add(visorGlow);
    }

    if (def.id === 'troi') {
      const hairMat = new THREE.MeshLambertMaterial({ color: 0x1A0A00 });
      // Top dome
      const hairTop = new THREE.Mesh(
        new THREE.SphereGeometry(HR * 0.93, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat
      );
      hairTop.position.y = 0.04;
      headGroup.add(hairTop);
      // Side volumes
      [-1, 1].forEach(side => {
        const hairSide = new THREE.Mesh(new THREE.SphereGeometry(0.115, 8, 8), hairMat);
        hairSide.scale.set(0.5, 1.25, 0.68);
        hairSide.position.set(side * HR * 0.96, -0.04, 0);
        headGroup.add(hairSide);
      });
      // Back volume
      const hairBack = new THREE.Mesh(new THREE.SphereGeometry(HR * 0.8, 8, 8), hairMat);
      hairBack.scale.set(1, 1.1, 0.6);
      hairBack.position.set(0, 0, -HR * 0.55);
      headGroup.add(hairBack);
    }

    if (def.id === 'riker') {
      const beardMat = new THREE.MeshLambertMaterial({ color: 0x3A2510 });
      // Chin beard
      const chin = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.095, 0.07), beardMat);
      chin.position.set(0, -0.115, HR * 0.76);
      headGroup.add(chin);
      // Jaw sides
      [-1, 1].forEach(side => {
        const jawB = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.13, 0.07), beardMat);
        jawB.position.set(side * 0.1, -0.072, HR * 0.72);
        headGroup.add(jawB);
      });
      // Moustache
      const moustache = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.021, 0.046), beardMat);
      moustache.position.set(0, -0.052, HR * 0.88);
      headGroup.add(moustache);
    }

    if (def.id === 'data') {
      // Pale circuit grid lines on face
      const gridMat = new THREE.MeshBasicMaterial({ color: 0xCCCC88, transparent: true, opacity: 0.22 });
      for (let i = 0; i < 4; i++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.004, 0.004), gridMat);
        line.position.set(0, -0.04 + i * 0.033, HR * 0.89);
        headGroup.add(line);
      }
      // Cheekbone highlights
      const cheekMat = new THREE.MeshBasicMaterial({ color: 0xCCCC88, transparent: true, opacity: 0.12 });
      [-1, 1].forEach(side => {
        const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.036, 0.01), cheekMat);
        cheek.position.set(side * 0.1, 0, HR * 0.89);
        headGroup.add(cheek);
      });
    }
  }

  // ─── Update (idle + blink animations) ───────────────────────────────────

  update(delta) {
    const t = performance.now() * 0.001;

    Object.entries(this._anims).forEach(([id, anim]) => {
      if (!anim.headGroup) return;
      const p = anim.idlePhase;

      // Head sway
      anim.headGroup.rotation.y = Math.sin(t * 0.4  + p)       * 0.07;
      anim.headGroup.rotation.x = Math.sin(t * 0.25 + p * 1.3) * 0.035;

      // Breathing
      if (anim.torsoMesh) {
        anim.torsoMesh.scale.y = 1 + Math.sin(t * 1.2 + anim.breathPhase) * 0.012;
      }

      // Blink
      if (!anim.blinking) {
        anim.blinkTimer -= delta;
        if (anim.blinkTimer <= 0) {
          anim.blinking   = true;
          anim.blinkTimer = Math.random() * 4 + 2.5;
          const lids = anim.headGroup.getObjectByName('eyelids_group');
          if (lids) {
            lids.children.forEach(l => { l.scale.y = 1; });
            setTimeout(() => {
              lids.children.forEach(l => { l.scale.y = 0.01; });
              anim.blinking = false;
            }, 110);
          } else {
            anim.blinking = false;
          }
        }
      }
    });
  }

  // ─── Highlight for dialogue ───────────────────────────────────────────────

  highlight(charId) {
    const g = this.crew[charId];
    if (!g) return;
    g.traverse(obj => {
      if (obj.isMesh && obj.material?.emissive) obj.material.emissive.setHex(0x222200);
    });
    setTimeout(() => {
      g.traverse(obj => {
        if (obj.isMesh && obj.material?.emissive) obj.material.emissive.setHex(0x000000);
      });
    }, 1200);
  }

  getWorldPosition(charId) {
    const g = this.crew[charId];
    if (!g) return new THREE.Vector3();
    return g.position.clone();
  }
}
