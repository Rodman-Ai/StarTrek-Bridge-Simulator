import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from '../utils/Constants.js';

export class InputManager {
  constructor(canvas, camera, domElement) {
    this.canvas       = canvas;
    this.camera       = camera;
    this.domElement   = domElement;
    this._actionCb    = null;
    this._hoverCb     = null;
    this._raycaster   = new THREE.Raycaster();
    this._mouse       = new THREE.Vector2();
    this._interactives = [];
    this._isMobile    = this._detectMobile();
    this._orbitActive = false;

    this._setupOrbitControls();
    this._setupPointer();
    this._setupKeyboard();
    this._setupMobile();
  }

  // ─── OrbitControls setup ──────────────────────────────────────────────────

  _setupOrbitControls() {
    this.orbit = new OrbitControls(this.camera, this.canvas);
    this.orbit.enableDamping    = true;
    this.orbit.dampingFactor    = 0.08;
    this.orbit.enablePan        = false;
    this.orbit.minDistance      = 1.8;
    this.orbit.maxDistance      = 14;
    this.orbit.minPolarAngle    = Math.PI * 0.1;   // don't go above ceiling
    this.orbit.maxPolarAngle    = Math.PI * 0.78;  // don't go below floor
    this.orbit.target.set(
      CONFIG.CAM_START_TARGET.x,
      CONFIG.CAM_START_TARGET.y,
      CONFIG.CAM_START_TARGET.z
    );
    // Allow full horizontal rotation
    this.orbit.update();
  }

  // ─── Pointer (mouse / touch tap) ─────────────────────────────────────────

  _setupPointer() {
    this.canvas.addEventListener('click', e => this._onPointerClick(e));
    this.canvas.addEventListener('mousemove', e => this._onPointerMove(e));
  }

  _onPointerClick(e) {
    if (!this._actionCb) return;
    this._updateMouse(e);
    const hit = this._raycast();
    if (hit) this._actionCb('stationClick', hit.object.userData);
  }

  _onPointerMove(e) {
    if (!this._hoverCb) return;
    this._updateMouse(e);
    const hit = this._raycast();
    this._hoverCb(hit ? hit.object.userData : null);
    this.canvas.style.cursor = hit ? 'pointer' : 'default';
  }

  _updateMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx   = e.touches ? e.touches[0].clientX : e.clientX;
    const cy   = e.touches ? e.touches[0].clientY : e.clientY;
    this._mouse.x =  ((cx - rect.left)  / rect.width)  * 2 - 1;
    this._mouse.y = -((cy - rect.top)   / rect.height) * 2 + 1;
  }

  _raycast() {
    if (!this._interactives.length) return null;
    this._raycaster.setFromCamera(this._mouse, this.camera);
    const hits = this._raycaster.intersectObjects(this._interactives, false);
    return hits.length ? hits[0] : null;
  }

  // ─── Keyboard ─────────────────────────────────────────────────────────────

  _setupKeyboard() {
    window.addEventListener('keydown', e => {
      if (!this._actionCb) return;
      switch (e.key) {
        case '1': this._actionCb('gameAction', { action: 'phasers'   }); break;
        case '2': this._actionCb('gameAction', { action: 'torpedoes' }); break;
        case '3': this._actionCb('gameAction', { action: 'shields'   }); break;
        case '4': this._actionCb('gameAction', { action: 'evasive'   }); break;
        case '5': this._actionCb('gameAction', { action: 'hail'      }); break;
        case '6': this._actionCb('gameAction', { action: 'warp'      }); break;
        case '7': this._actionCb('gameAction', { action: 'scan'      }); break;
        case '8': this._actionCb('gameAction', { action: 'repair'    }); break;
        case 'Escape': this._actionCb('pause', {}); break;
        case 'm': case 'M': this._actionCb('mute', {}); break;
        case 'r': case 'R': this._actionCb('resetCamera', {}); break;
      }
    });
  }

  // ─── Mobile touch ─────────────────────────────────────────────────────────

  _setupMobile() {
    if (!this._isMobile) return;

    const hint = document.getElementById('mobile-controls');
    if (hint) {
      hint.classList.remove('hidden');
      setTimeout(() => hint.classList.add('hidden'), 5000);
    }

    // Tap to interact (touch start + end without major move)
    let touchStart = null;
    this.canvas.addEventListener('touchstart', e => {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
    }, { passive: true });

    this.canvas.addEventListener('touchend', e => {
      if (!touchStart || !this._actionCb) return;
      const dx = Math.abs(e.changedTouches[0].clientX - touchStart.x);
      const dy = Math.abs(e.changedTouches[0].clientY - touchStart.y);
      const dt = Date.now() - touchStart.t;
      if (dx < 12 && dy < 12 && dt < 300) {
        // It was a tap
        const fakeEvent = {
          clientX: e.changedTouches[0].clientX,
          clientY: e.changedTouches[0].clientY,
        };
        this._updateMouse(fakeEvent);
        const hit = this._raycast();
        if (hit) this._actionCb('stationClick', hit.object.userData);
      }
      touchStart = null;
    }, { passive: true });
  }

  _detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      .test(navigator.userAgent) || window.matchMedia('(max-width: 768px)').matches;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  setInteractiveObjects(objects) {
    this._interactives = objects;
  }

  onInput(callback) {
    this._actionCb = callback;
  }

  onHover(callback) {
    this._hoverCb = callback;
  }

  resetCamera(target, position) {
    this.camera.position.set(position.x, position.y, position.z);
    this.orbit.target.set(target.x, target.y, target.z);
    this.orbit.update();
  }

  update() {
    this.orbit.update();
  }

  // Expose window.gameAction for HTML button onclick handlers
  bindGlobalAction(cb) {
    window.gameAction = (action) => cb('gameAction', { action });
  }
}
