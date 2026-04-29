# Star Trek: Bridge Command
### USS Enterprise NCC-1701-D — TNG Era Bridge Simulator

A fully 3D, interactive Star Trek: The Next Generation bridge simulator playable in any modern browser on desktop and mobile. No external assets — all textures and sounds are procedurally generated.

---

## Features

- **Full 3D TNG Bridge** — Accurate layout with conn/ops pit, captain's chair, tactical horseshoe, port/starboard stations, turbolift doors, and animated ceiling lights
- **6 TNG Crew Members** — Picard, Riker, Data, Worf, Troi, and La Forge at their stations with idle breathing/head animations and unique visual details (VISOR, Klingon ridges, android pallor, etc.)
- **Animated Viewscreen** — Twinkling star field with nebula clouds; switches to combat mode with enemy ship silhouettes, targeting reticles, phaser beams, and torpedo visuals
- **Space Combat System** — Turn-based combat against 5 enemy types: Romulan Warbird, Klingon Bird-of-Prey, Borg Cube, Cardassian Galor-class, Ferengi Marauder
- **LCARS HUD** — Authentic orange-on-dark LCARS interface with real-time shield/hull/power bars, sensor sweep, enemy status, crew dialogue portraits
- **Crew Dialogue** — Each crew member delivers contextual lines displayed with portrait
- **Red/Yellow Alert System** — Pulsing red overlay, alert strip lighting, audio klaxon
- **Warp Drive** — Animated streaking warp tunnel on the viewscreen
- **Web Audio** — All sound effects synthesized via Web Audio API (phasers, torpedoes, explosions, warp, alerts)
- **Mobile Friendly** — Touch drag to orbit camera, tap stations to interact, responsive layout

---

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

### Production build

```bash
npm run build
npm run preview
```

---

## Controls

### Desktop

| Input | Action |
|-------|--------|
| Mouse drag | Orbit camera around the bridge |
| Scroll wheel | Zoom in / out |
| Click station | Crew dialogue for that console |
| `1` | Fire Phasers |
| `2` | Fire Torpedoes |
| `3` | Toggle Shields |
| `4` | Evasive Maneuvers |
| `5` | Hail Enemy |
| `6` | Warp Out |
| `7` | Scan Enemy |
| `8` | Emergency Repairs |
| `R` | Reset camera |
| `M` | Toggle mute |

### Mobile

| Gesture | Action |
|---------|--------|
| Drag | Orbit camera |
| Pinch | Zoom |
| Tap station | Crew dialogue |
| On-screen buttons | All combat actions |

---

## Gameplay Loop

1. **Idle** — The bridge is at normal status. Crew deliver ambient dialogue. Camera can be orbited freely. Tap/click consoles to interact.
2. **Encounter** — After 8–18 seconds an enemy vessel is detected. Yellow alert activates, a mission banner appears.
3. **Red Alert / Combat** — 3 seconds later, red alert sounds and combat begins. The viewscreen shows the enemy ship.
4. **Combat Actions** (choose each turn):
   - **Fire Phasers** — High accuracy, moderate damage, requires recharge
   - **Fire Torpedoes** — High damage, limited supply (10 total)
   - **Toggle Shields** — Shields absorb damage; lowering them enables faster hull repair
   - **Evasive Maneuvers** — Reduces enemy accuracy by 55% for one turn
   - **Hail Enemy** — Sometimes causes Ferengi to retreat; others attack harder
   - **Warp Out** — Emergency escape; ends combat immediately
   - **Scan** — Reveals enemy shield and hull percentages
   - **Emergency Repairs** — Repairs damaged systems, restores minor hull
5. **Resolution** — Enemy destroyed, escaped, or hailed into retreat → back to idle → next encounter scheduled.

---

## Enemy Types

| Enemy | Shields | Hull | Attack | Notes |
|-------|---------|------|--------|-------|
| Romulan Warbird | 90 | 80 | 22 | Can attempt to cloak |
| Klingon Bird-of-Prey | 60 | 70 | 30 | High damage, lower accuracy |
| Borg Cube | 150 | 200 | 40 | Very tough — consider warp out |
| Cardassian Galor-class | 75 | 90 | 25 | Balanced opponent |
| Ferengi Marauder | 55 | 55 | 18 | Weakest; 40% chance to flee if hailed |

---

## Project Structure

```
src/
├── main.js                   # Entry point — wires all systems together
├── styles/main.css           # LCARS CSS theme
├── scene/
│   ├── Bridge.js             # 3D bridge geometry (floor, walls, consoles, chairs, doors)
│   ├── Characters.js         # TNG crew humanoid meshes + idle animations
│   └── Viewscreen.js         # Animated main viewscreen (starfield, combat, warp)
├── game/
│   ├── GameState.js          # State machine + event bus
│   ├── ShipSystems.js        # Shields, hull, weapons, engines
│   ├── Combat.js             # Turn-based combat engine (player + enemy AI)
│   └── Missions.js           # Encounter scheduler + crew chatter
├── ui/
│   └── LCARS.js              # DOM HUD management
├── controls/
│   └── InputManager.js       # Keyboard, mouse, touch + OrbitControls
└── utils/
    ├── Constants.js          # Colors, config, crew definitions, enemy stats
    ├── ProceduralTextures.js # Canvas-based texture generation (no image files)
    └── AudioManager.js       # Web Audio API sound synthesis (no audio files)
```

---

## Tech Stack

- **Three.js r160** — 3D WebGL rendering
- **Vite 5** — Build tooling and dev server
- **Web Audio API** — All sounds synthesized in-browser
- **Canvas 2D API** — All textures generated procedurally

No external image or audio assets required. The entire game is self-contained JavaScript.

---

*"Space: the final frontier. These are the voyages of the Starship Enterprise."*
