import * as THREE from 'three';
import { COLORS } from '../utils/Constants.js';
import {
  createLCARSConsoleTexture,
  createFloorTexture,
  createWallTexture,
  createCeilingTexture,
  createDisplayTexture,
  createSectorMapTexture,
} from '../utils/ProceduralTextures.js';

const R     = 7.4;   // bridge outer radius
const H     = 3.6;   // ceiling height
const PIT_D = 0.44;  // pit depth below main floor
const PIT_R = 3.0;   // pit (conn/ops well) radius
const PIT_Z = -1.6;  // pit center offset toward viewscreen

export class Bridge {
  constructor(scene) {
    this.group = new THREE.Group();
    this.interactiveObjects = [];
    this.consoleLights      = [];
    this.alertLights        = [];
    this.doorMeshes         = [];

    this._mats = this._buildMaterials();
    this._buildFloor();
    this._buildWalls();
    this._buildCeiling();
    this._buildViewscreenWall();
    this._buildConsoles();
    this._buildChairs();
    this._buildRailings();
    this._buildDoors();
    this._buildCeilingLights();
    this._buildAlertStrips();

    scene.add(this.group);
  }

  // ─── Materials ────────────────────────────────────────────────────────────

  _buildMaterials() {
    const floorTex   = createFloorTexture();
    const wallTex    = createWallTexture();
    const ceilTex    = createCeilingTexture();
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(3, 3);
    wallTex.wrapS  = wallTex.wrapT  = THREE.RepeatWrapping;
    wallTex.repeat.set(4, 2);

    return {
      carpet:    new THREE.MeshLambertMaterial({ map: floorTex }),
      wall:      new THREE.MeshLambertMaterial({ map: wallTex }),
      ceiling:   new THREE.MeshLambertMaterial({ map: ceilTex }),
      metal:     new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.85, roughness: 0.25 }),
      metalDark: new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9,  roughness: 0.2  }),
      console:   new THREE.MeshLambertMaterial({ color: 0x0A0A14 }),
      consoleTop:new THREE.MeshLambertMaterial({ color: 0x111118 }),
      chair:     new THREE.MeshLambertMaterial({ color: 0x1A0A0A }),
      chairArm:  new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 }),
      railing:   new THREE.MeshStandardMaterial({ color: 0x888866, metalness: 0.5, roughness: 0.5 }),
      trim:      new THREE.MeshStandardMaterial({ color: 0x998866, metalness: 0.4, roughness: 0.6 }),
      vsFrame:   new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7, roughness: 0.3 }),
      alertRed:  new THREE.MeshBasicMaterial({ color: 0xCC0000, transparent: true, opacity: 0 }),
      alertYellow:new THREE.MeshBasicMaterial({ color: 0xFFAA00, transparent: true, opacity: 0 }),
    };
  }

  // ─── Floor ────────────────────────────────────────────────────────────────

  _buildFloor() {
    // Main floor (full circle)
    const mainFloor = this._mesh(new THREE.CircleGeometry(R, 48), this._mats.carpet);
    mainFloor.rotation.x = -Math.PI / 2;
    mainFloor.receiveShadow = true;
    this.group.add(mainFloor);

    // Lower pit floor
    const pitFloor = this._mesh(new THREE.CircleGeometry(PIT_R, 40), this._mats.carpet);
    pitFloor.rotation.x = -Math.PI / 2;
    pitFloor.position.set(0, -PIT_D, PIT_Z);
    pitFloor.receiveShadow = true;
    this.group.add(pitFloor);

    // Pit side cylinder wall
    const pitWall = this._mesh(
      new THREE.CylinderGeometry(PIT_R, PIT_R, PIT_D, 40, 1, true),
      this._mats.metalDark
    );
    pitWall.position.set(0, -PIT_D / 2, PIT_Z);
    this.group.add(pitWall);

    // Step edge ring
    const stepRing = this._mesh(
      new THREE.TorusGeometry(PIT_R, 0.06, 6, 40),
      this._mats.metal
    );
    stepRing.rotation.x = Math.PI / 2;
    stepRing.position.set(0, 0.02, PIT_Z);
    this.group.add(stepRing);

    // Aft raised platform (behind tactical station)
    const aftRise = 0.25;
    const aftFloor = this._mesh(
      new THREE.BoxGeometry(R * 1.4, aftRise, 3.5),
      this._mats.carpet
    );
    aftFloor.position.set(0, aftRise / 2 - 0.01, 3.0);
    this.group.add(aftFloor);

    // Aft step edge
    const aftEdge = this._mesh(
      new THREE.BoxGeometry(R * 1.4, 0.06, 0.06),
      this._mats.metal
    );
    aftEdge.position.set(0, aftRise + 0.03, 1.25);
    this.group.add(aftEdge);
  }

  // ─── Walls ────────────────────────────────────────────────────────────────

  _buildWalls() {
    // Main cylindrical outer wall (excludes front arc for viewscreen)
    const arcLen = Math.PI * 1.75; // ~315 degrees
    const arcStart = Math.PI * 0.125;
    const wallGeo = new THREE.CylinderGeometry(R, R, H, 48, 1, true, arcStart, arcLen);
    const wall = this._mesh(wallGeo, this._mats.wall);
    wall.position.y = H / 2;
    this.group.add(wall);

    // Inner face of wall
    const innerWallGeo = new THREE.CylinderGeometry(R - 0.05, R - 0.05, H, 48, 1, true, arcStart, arcLen);
    const innerWall = this._mesh(innerWallGeo, this._mats.wall);
    innerWall.position.y = H / 2;
    this.group.add(innerWall);

    // Wall base trim strip
    const trim = this._mesh(
      new THREE.CylinderGeometry(R - 0.02, R - 0.02, 0.12, 48, 1, true, arcStart, arcLen),
      this._mats.trim
    );
    trim.position.y = 0.06;
    this.group.add(trim);

    // Wall upper trim strip
    const trimTop = this._mesh(
      new THREE.CylinderGeometry(R - 0.02, R - 0.02, 0.12, 48, 1, true, arcStart, arcLen),
      this._mats.trim
    );
    trimTop.position.y = H - 0.06;
    this.group.add(trimTop);

    // LCARS wall panels along port/starboard sides
    this._addWallPanels();
  }

  _addWallPanels() {
    // Rectangular LCARS display panels mounted on the walls
    const panelPositions = [
      { x: -R + 0.12, y: 1.6, z:  0.5, ry: Math.PI / 2 },
      { x: -R + 0.12, y: 1.6, z:  2.0, ry: Math.PI / 2 },
      { x: -R + 0.12, y: 1.6, z:  3.5, ry: Math.PI / 2 },
      { x:  R - 0.12, y: 1.6, z:  0.5, ry: -Math.PI / 2 },
      { x:  R - 0.12, y: 1.6, z:  2.0, ry: -Math.PI / 2 },
      { x:  R - 0.12, y: 1.6, z:  3.5, ry: -Math.PI / 2 },
    ];
    panelPositions.forEach(p => {
      const tex = createLCARSConsoleTexture(256, 128);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9 });
      const panel = this._mesh(new THREE.PlaneGeometry(1.4, 0.9), mat);
      panel.position.set(p.x, p.y, p.z);
      panel.rotation.y = p.ry;
      this.group.add(panel);

      // Glow light behind panel
      const glow = new THREE.PointLight(0xFF9900, 2, 2);
      glow.position.set(p.x * 0.85, p.y, p.z);
      this.consoleLights.push(glow);
      this.group.add(glow);
    });
  }

  // ─── Ceiling ──────────────────────────────────────────────────────────────

  _buildCeiling() {
    const ceil = this._mesh(new THREE.CircleGeometry(R, 48), this._mats.ceiling);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = H;
    this.group.add(ceil);

    // Ceiling edge ring
    const ceilRing = this._mesh(
      new THREE.TorusGeometry(R - 0.05, 0.08, 6, 48),
      this._mats.metal
    );
    ceilRing.rotation.x = Math.PI / 2;
    ceilRing.position.y = H;
    this.group.add(ceilRing);
  }

  // ─── Viewscreen wall ──────────────────────────────────────────────────────

  _buildViewscreenWall() {
    const vsW = 8.2, vsH = 3.2;
    const wallW = 10, wallHgt = H;
    const wallZ = -R * 0.88;

    // Solid wall behind viewscreen (slightly angled)
    const frontWall = this._mesh(
      new THREE.PlaneGeometry(wallW, wallHgt),
      this._mats.wall
    );
    frontWall.position.set(0, wallHgt / 2, wallZ - 0.05);
    this.group.add(frontWall);

    // Viewscreen outer frame (border surround)
    const frameThick = 0.22;
    const frameDepth = 0.18;
    const framePieces = [
      // top
      { w: vsW + frameThick * 2, h: frameThick, d: frameDepth, x: 0, y: H / 2 + vsH / 2 + frameThick / 2, z: wallZ },
      // bottom
      { w: vsW + frameThick * 2, h: frameThick, d: frameDepth, x: 0, y: H / 2 - vsH / 2 - frameThick / 2, z: wallZ },
      // left
      { w: frameThick, h: vsH + frameThick * 2, d: frameDepth, x: -(vsW / 2 + frameThick / 2), y: H / 2, z: wallZ },
      // right
      { w: frameThick, h: vsH + frameThick * 2, d: frameDepth, x:  vsW / 2 + frameThick / 2,  y: H / 2, z: wallZ },
    ];
    framePieces.forEach(f => {
      const piece = this._mesh(new THREE.BoxGeometry(f.w, f.h, f.d), this._mats.vsFrame);
      piece.position.set(f.x, f.y, f.z);
      this.group.add(piece);
    });

    // LCARS decoration strips along viewscreen wall
    const stripTex = createLCARSConsoleTexture(512, 32);
    const stripMat = new THREE.MeshBasicMaterial({ map: stripTex });
    [H / 2 - vsH / 2 - frameThick - 0.2, H / 2 + vsH / 2 + frameThick + 0.2].forEach(y => {
      const strip = this._mesh(new THREE.PlaneGeometry(wallW, 0.18), stripMat);
      strip.position.set(0, y, wallZ + 0.01);
      this.group.add(strip);
    });
  }

  // ─── Console stations ─────────────────────────────────────────────────────

  _buildConsoles() {
    const stations = [
      { id: 'conn',       label: 'CONN / HELM',    x: -1.3, y: -PIT_D, z: PIT_Z - 1.2, ry: 0,            w: 1.8, d: 0.7 },
      { id: 'ops',        label: 'OPS',            x:  1.3, y: -PIT_D, z: PIT_Z - 1.2, ry: 0,            w: 1.8, d: 0.7 },
      { id: 'tactical',   label: 'TACTICAL',       x:  0,   y:  0.25,  z:  0.6,        ry: 0,            w: 3.2, d: 0.8 },
      { id: 'engineering',label: 'ENGINEERING',    x: -5.6, y:  0.25,  z:  1.5,        ry:  Math.PI/2,   w: 2.2, d: 0.7 },
      { id: 'science',    label: 'SCIENCE',        x:  5.6, y:  0.25,  z:  1.5,        ry: -Math.PI/2,   w: 2.2, d: 0.7 },
      { id: 'aft1',       label: 'MISSION OPS',    x: -2.5, y:  0.25,  z:  4.8,        ry: Math.PI,      w: 1.8, d: 0.7 },
      { id: 'aft2',       label: 'ENVIRONMENT',    x:  2.5, y:  0.25,  z:  4.8,        ry: Math.PI,      w: 1.8, d: 0.7 },
    ];

    stations.forEach(s => this._createConsoleStation(s));
  }

  _createConsoleStation({ id, label, x, y, z, ry, w, d }) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = ry;
    group.userData = { stationId: id, label };

    const bodyH = 0.85;
    // Console body
    const body = this._mesh(new THREE.BoxGeometry(w, bodyH, d), this._mats.console);
    body.position.y = bodyH / 2;
    group.add(body);

    // Slanted top surface
    const topW = w, topD = d * 1.15;
    const topGeo = new THREE.BoxGeometry(topW, 0.06, topD);
    const top = this._mesh(topGeo, this._mats.consoleTop);
    top.position.set(0, bodyH + 0.03, -d * 0.08);
    top.rotation.x = -0.3;
    group.add(top);

    // LCARS screen on slanted surface
    const screenTex = createLCARSConsoleTexture(512, 256);
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, transparent: true, opacity: 0.95 });
    const screen = this._mesh(new THREE.PlaneGeometry(topW - 0.1, topD - 0.1), screenMat);
    screen.position.set(0, bodyH + 0.07, -d * 0.08);
    screen.rotation.x = -0.3 - Math.PI / 2;
    group.add(screen);

    // Indicator light strip on console front
    const indMat = new THREE.MeshBasicMaterial({ color: 0xFF9900 });
    const ind = this._mesh(new THREE.BoxGeometry(w - 0.1, 0.04, 0.04), indMat);
    ind.position.set(0, bodyH * 0.6, d / 2 + 0.02);
    group.add(ind);

    // Console glow light
    const light = new THREE.PointLight(0xFF9900, 3, 2.5);
    light.position.set(0, bodyH + 0.4, 0);
    this.consoleLights.push(light);
    group.add(light);

    // Interactive hitbox
    const hitbox = this._mesh(
      new THREE.BoxGeometry(w, bodyH + 0.4, d + 0.2),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = (bodyH + 0.4) / 2;
    hitbox.userData = { stationId: id, label, interactive: true };
    group.add(hitbox);
    this.interactiveObjects.push(hitbox);

    this.group.add(group);
    return group;
  }

  // ─── Chairs ───────────────────────────────────────────────────────────────

  _buildChairs() {
    // Captain's chair
    this._createCommandChair(0, 0, -1.8, 0, true, 'captain');

    // FO and Counselor flanking chairs
    this._createCommandChair( 1.9, 0, -1.5,  0.15, false, 'firstOfficer');
    this._createCommandChair(-1.9, 0, -1.5, -0.15, false, 'counselor');

    // Conn/ops seats (lower in pit)
    this._createSeat(-1.3, -PIT_D, PIT_Z - 0.5, 0, 'conn');
    this._createSeat( 1.3, -PIT_D, PIT_Z - 0.5, 0, 'ops');
  }

  _createCommandChair(x, y, z, ry, isMain, id) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    g.userData = { stationId: id };

    // Seat
    const seat = this._mesh(new THREE.BoxGeometry(0.85, 0.12, 0.85), this._mats.chair);
    seat.position.y = 0.48;
    g.add(seat);

    // Back
    const back = this._mesh(new THREE.BoxGeometry(0.85, 0.6, 0.1), this._mats.chair);
    back.position.set(0, 0.82, -0.4);
    back.rotation.x = 0.12;
    g.add(back);

    // Pedestal
    const ped = this._mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.48, 12), this._mats.metalDark);
    ped.position.y = 0.24;
    g.add(ped);

    // Armrests
    [-0.5, 0.5].forEach(sx => {
      const arm = this._mesh(new THREE.BoxGeometry(0.12, 0.06, 0.55), this._mats.chairArm);
      arm.position.set(sx, 0.6, -0.1);
      g.add(arm);

      if (isMain) {
        // Captain's chair has mini LCARS panels on armrests
        const armTex = createDisplayTexture('CMD', 'READY', '#FF9900');
        const armScreen = this._mesh(
          new THREE.PlaneGeometry(0.1, 0.06),
          new THREE.MeshBasicMaterial({ map: armTex })
        );
        armScreen.position.set(sx, 0.64, -0.1);
        armScreen.rotation.x = -Math.PI / 2;
        g.add(armScreen);
      }
    });

    this.group.add(g);
  }

  _createSeat(x, y, z, ry, id) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    g.userData = { stationId: id };

    const seat = this._mesh(new THREE.BoxGeometry(0.7, 0.1, 0.65), this._mats.chair);
    seat.position.y = 0.44;
    g.add(seat);

    const back = this._mesh(new THREE.BoxGeometry(0.7, 0.45, 0.08), this._mats.chair);
    back.position.set(0, 0.67, -0.3);
    back.rotation.x = 0.1;
    g.add(back);

    const ped = this._mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.44, 8), this._mats.metalDark);
    ped.position.y = 0.22;
    g.add(ped);

    this.group.add(g);
  }

  // ─── Railings ─────────────────────────────────────────────────────────────

  _buildRailings() {
    // Circular railing around the pit (half-circle on aft side)
    const railR   = PIT_R + 0.08;
    const railH   = 0.9;
    const railArc = Math.PI; // semi-circle (aft half)

    // Main horizontal rail
    const railGeo = new THREE.TorusGeometry(railR, 0.04, 6, 48, railArc);
    const rail    = this._mesh(railGeo, this._mats.railing);
    rail.rotation.x = Math.PI / 2;
    rail.rotation.z = -Math.PI / 2; // orient aft half
    rail.position.set(0, railH, PIT_Z);
    this.group.add(rail);

    // Lower rail
    const lowerRail = this._mesh(
      new THREE.TorusGeometry(railR, 0.025, 6, 48, railArc),
      this._mats.railing
    );
    lowerRail.rotation.x = Math.PI / 2;
    lowerRail.rotation.z = -Math.PI / 2;
    lowerRail.position.set(0, railH * 0.5, PIT_Z);
    this.group.add(lowerRail);

    // Vertical posts
    for (let i = 0; i <= 6; i++) {
      const angle = (i / 6) * Math.PI - Math.PI / 2;
      const px = Math.cos(angle) * railR;
      const pz = Math.sin(angle) * railR + PIT_Z;
      const post = this._mesh(
        new THREE.CylinderGeometry(0.025, 0.025, railH, 6),
        this._mats.railing
      );
      post.position.set(px, railH / 2, pz);
      this.group.add(post);
    }
  }

  // ─── Turbolift Doors ──────────────────────────────────────────────────────

  _buildDoors() {
    const doors = [
      { x: -2.8, z: R * 0.82, ry:  0.52 },
      { x:  2.8, z: R * 0.82, ry: -0.52 },
    ];
    doors.forEach(d => {
      const doorGroup = new THREE.Group();
      doorGroup.position.set(d.x, 0, d.z);
      doorGroup.rotation.y = d.ry;

      // Door frame
      const frame = this._mesh(
        new THREE.BoxGeometry(1.4, H * 0.85, 0.1),
        this._mats.metalDark
      );
      frame.position.y = H * 0.85 / 2;
      doorGroup.add(frame);

      // Two door panels (left / right)
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x2A2A3A, metalness: 0.6 });
      [-0.3, 0.3].forEach(ox => {
        const panel = this._mesh(new THREE.BoxGeometry(0.58, H * 0.80, 0.06), panelMat);
        panel.position.set(ox, H * 0.80 / 2, 0.02);
        panel.userData.doorPanel = true;
        doorGroup.add(panel);
        this.doorMeshes.push({ mesh: panel, openX: ox > 0 ? 0.65 : -0.65, closedX: ox });
      });

      // LCARS door panel to the side
      const doorTex = createDisplayTexture('TURBOLIFT', 'READY', '#00CCCC');
      const doorScreen = this._mesh(
        new THREE.PlaneGeometry(0.4, 0.55),
        new THREE.MeshBasicMaterial({ map: doorTex })
      );
      doorScreen.position.set(0.82, 1.2, 0.06);
      doorGroup.add(doorScreen);

      // Glow
      const glow = new THREE.PointLight(0x00CCCC, 1.5, 2);
      glow.position.set(0.82, 1.2, 0.3);
      doorGroup.add(glow);

      this.group.add(doorGroup);
    });
  }

  // ─── Ceiling lights ───────────────────────────────────────────────────────

  _buildCeilingLights() {
    const lightPositions = [
      { x:  0,   z: -3   },
      { x: -3.5, z: -1   },
      { x:  3.5, z: -1   },
      { x:  0,   z:  1   },
      { x: -4,   z:  3   },
      { x:  4,   z:  3   },
    ];

    const panelMat = new THREE.MeshBasicMaterial({ color: 0xFFF5E0 });

    lightPositions.forEach(pos => {
      // Physical panel geometry
      const panel = this._mesh(new THREE.PlaneGeometry(1.0, 0.3), panelMat);
      panel.rotation.x = Math.PI / 2;
      panel.position.set(pos.x, H - 0.02, pos.z);
      this.group.add(panel);

      // Actual light source
      const light = new THREE.PointLight(0xFFE8CC, 12, 5, 2);
      light.position.set(pos.x, H - 0.15, pos.z);
      this.group.add(light);
    });
  }

  // ─── Alert strips ─────────────────────────────────────────────────────────

  _buildAlertStrips() {
    // Red alert strips along the wall base
    const alertArc = Math.PI * 1.6;
    const alertGeo = new THREE.TorusGeometry(R - 0.08, 0.05, 6, 64, alertArc);

    this._mats.alertRed.opacity = 0;
    const redStrip = this._mesh(alertGeo, this._mats.alertRed);
    redStrip.rotation.x = Math.PI / 2;
    redStrip.position.y = 0.08;
    this.group.add(redStrip);

    // Red lights (inactive by default)
    [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].forEach(angle => {
      const lx = Math.cos(angle) * (R - 1.5);
      const lz = Math.sin(angle) * (R - 1.5);
      const alertLight = new THREE.PointLight(0xFF1100, 0, 8, 2);
      alertLight.position.set(lx, 0.5, lz);
      this.alertLights.push(alertLight);
      this.group.add(alertLight);
    });
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  setAlertState(state) {
    const isRed    = state === 'RED';
    const isYellow = state === 'YELLOW';

    this._mats.alertRed.opacity    = isRed ? 0.9 : 0;
    this._mats.alertYellow.opacity = isYellow ? 0.6 : 0;

    this.alertLights.forEach(l => {
      l.color.setHex(isRed ? 0xFF1100 : isYellow ? 0xFFAA00 : 0xFF1100);
      l.intensity = isRed ? 18 : isYellow ? 8 : 0;
    });
  }

  update(delta) {
    // Subtle console flicker
    const t = performance.now() * 0.001;
    this.consoleLights.forEach((l, i) => {
      l.intensity = 3 + Math.sin(t * 2.1 + i * 1.3) * 0.3;
    });
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  _mesh(geo, mat) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow    = true;
    m.receiveShadow = true;
    return m;
  }
}
