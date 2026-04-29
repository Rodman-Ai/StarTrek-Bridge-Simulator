// TNG color palette
export const COLORS = {
  LCARS_ORANGE:     0xFF9900,
  LCARS_PEACH:      0xFFCC99,
  LCARS_GOLD:       0xFFCC00,
  LCARS_RED:        0xCC0000,
  LCARS_BLUE:       0x9999FF,
  LCARS_TEAL:       0x00CCCC,
  LCARS_PURPLE:     0xCC66FF,
  LCARS_GRAY:       0x999999,

  // Bridge surfaces
  CARPET_BURGUNDY:  0x4A1520,
  CARPET_MID:       0x5C1F2A,
  WALL_LIGHT:       0xC8B89A,
  WALL_MID:         0x8A7A6A,
  WALL_DARK:        0x3A3228,
  CEILING_PANEL:    0x2A2820,
  METAL_GRAY:       0x888888,
  METAL_DARK:       0x444444,

  // Console colors
  CONSOLE_DARK:     0x111118,
  CONSOLE_MID:      0x1A1A28,
  CONSOLE_GLOW:     0xFF9900,
  CONSOLE_BLUE:     0x003388,
  DISPLAY_BG:       0x000818,

  // Lighting
  AMBIENT_BRIDGE:   0x404060,
  CEILING_WARM:     0xFFE8CC,
  CEILING_COOL:     0xCCDDFF,
  CONSOLE_EMIT:     0xFF9900,
  ALERT_RED:        0xFF2200,

  // Character skins
  SKIN_LIGHT:       0xFFCCAA,
  SKIN_MED:         0xCC9966,
  SKIN_DARK:        0x774433,
  SKIN_DATA:        0xCCCC99,  // Data's android pallor

  // Uniforms
  UNIFORM_RED:      0x8B1A1A,  // Command
  UNIFORM_GOLD:     0xAA8800,  // Operations
  UNIFORM_TEAL:     0x006666,  // Sciences
  UNIFORM_BLACK:    0x111111,
  UNIFORM_TRIM:     0x222222,
};

// Game configuration
export const CONFIG = {
  BRIDGE_RADIUS:    7.5,
  BRIDGE_HEIGHT:    3.6,
  PIT_DEPTH:        0.45,
  PIT_RADIUS:       3.2,

  // Camera
  CAM_NEAR:         0.1,
  CAM_FAR:          200,
  CAM_FOV:          65,
  CAM_START_POS:    { x: 0, y: 2.5, z: 3.5 },
  CAM_START_TARGET: { x: 0, y: 1.2, z: -2 },

  // Physics / timing
  DELTA_CAP:        0.05,   // max seconds per frame
  CHAR_ANIM_SPEED:  0.8,
  STAR_COUNT:       2000,

  // Combat
  COMBAT_COOLDOWN:  1200,   // ms between actions
  ENEMY_DELAY:      1800,   // ms for enemy response
};

// Crew manifest
export const CREW = {
  PICARD: {
    id: 'picard',
    name: 'Jean-Luc Picard',
    rank: 'Captain',
    division: 'command',
    skinColor: COLORS.SKIN_LIGHT,
    uniformColor: COLORS.UNIFORM_RED,
    station: 'captain',
    portrait: '👨‍🦲',
    phrases: [
      'Make it so.',
      'Engage.',
      'The line must be drawn here!',
      'There are four lights!',
      'Tea. Earl Grey. Hot.',
      'We are the Enterprise.',
    ],
  },
  RIKER: {
    id: 'riker',
    name: 'William T. Riker',
    rank: 'Commander',
    division: 'command',
    skinColor: COLORS.SKIN_LIGHT,
    uniformColor: COLORS.UNIFORM_RED,
    station: 'firstOfficer',
    portrait: '🧔',
    phrases: [
      'Aye, Captain.',
      'On screen.',
      'Red alert! All hands battle stations!',
      'Counselor, what do you sense?',
      'Shields to maximum!',
    ],
  },
  DATA: {
    id: 'data',
    name: 'Data',
    rank: 'Lt. Commander',
    division: 'operations',
    skinColor: COLORS.SKIN_DATA,
    uniformColor: COLORS.UNIFORM_GOLD,
    station: 'ops',
    portrait: '🤖',
    phrases: [
      'Captain, sensors indicate…',
      'Processing. One moment.',
      'Fascinating.',
      'I am detecting elevated neutrino emissions.',
      'The probability is 73.4%.',
      'Shields at 67.3%, Captain.',
    ],
  },
  WORF: {
    id: 'worf',
    name: 'Worf',
    rank: 'Lieutenant',
    division: 'operations',
    skinColor: COLORS.SKIN_DARK,
    uniformColor: COLORS.UNIFORM_GOLD,
    station: 'tactical',
    portrait: '⚔️',
    phrases: [
      'Captain, enemy vessel decloaking!',
      'Shields up! Weapons hot!',
      'Today is a good day to fight!',
      'Firing phasers!',
      'The Klingon proverb says…',
      'Torpedo away!',
    ],
  },
  TROI: {
    id: 'troi',
    name: 'Deanna Troi',
    rank: 'Counselor',
    division: 'sciences',
    skinColor: COLORS.SKIN_MED,
    uniformColor: COLORS.UNIFORM_TEAL,
    station: 'counselor',
    portrait: '🔮',
    phrases: [
      'Captain, I sense deception.',
      'They are afraid.',
      'I feel intense hostility.',
      'There is great pain in that vessel.',
      'Captain, something feels wrong.',
    ],
  },
  LAFORGE: {
    id: 'laforge',
    name: 'Geordi La Forge',
    rank: 'Lt. Commander',
    division: 'operations',
    skinColor: COLORS.SKIN_DARK,
    uniformColor: COLORS.UNIFORM_GOLD,
    station: 'engineering',
    portrait: '🔧',
    phrases: [
      'Captain, the shields are holding!',
      'I need at least ten minutes!',
      'She will fly, Captain.',
      'Rerouting power from life support.',
      'Warp core is stable.',
      'Engineering to bridge — ready!',
    ],
  },
};

// Enemy ship types
export const ENEMIES = {
  ROMULAN_WARBIRD: {
    id: 'romulan_warbird',
    name: 'Romulan Warbird',
    faction: 'Romulan Star Empire',
    shields: 90,
    hull: 80,
    attack: 22,
    accuracy: 0.72,
    color: 0x004400,
    hailResponse: 'This is Commander Tomalak. Lower your shields or be destroyed.',
  },
  KLINGON_BIRD_OF_PREY: {
    id: 'klingon_bop',
    name: "Klingon Bird-of-Prey",
    faction: 'Klingon Empire',
    shields: 60,
    hull: 70,
    attack: 30,
    accuracy: 0.65,
    color: 0x332200,
    hailResponse: 'Surrender, Federation cowards! Today you meet Sto-vo-kor!',
  },
  BORG_CUBE: {
    id: 'borg_cube',
    name: 'Borg Cube',
    faction: 'Borg Collective',
    shields: 150,
    hull: 200,
    attack: 40,
    accuracy: 0.90,
    color: 0x334433,
    hailResponse: 'We are the Borg. Resistance is futile. Your biological distinctiveness will be added to our own.',
  },
  CARDASSIAN_GALOR: {
    id: 'cardassian_galor',
    name: 'Cardassian Galor-class',
    faction: 'Cardassian Union',
    shields: 75,
    hull: 90,
    attack: 25,
    accuracy: 0.68,
    color: 0x443322,
    hailResponse: 'Federation vessel, you are trespassing in Cardassian space. Stand down or face annihilation.',
  },
  FERENGI_MARAUDER: {
    id: 'ferengi_marauder',
    name: "Ferengi Marauder",
    faction: 'Ferengi Alliance',
    shields: 55,
    hull: 55,
    attack: 18,
    accuracy: 0.60,
    color: 0x664400,
    hailResponse: "Your ship is worth more than you know! Surrender and we'll split the profit — 90/10, our favor.",
  },
};

export const GAME_STATES = {
  LOADING:       'LOADING',
  IDLE:          'IDLE',
  ENCOUNTER:     'ENCOUNTER',
  COMBAT:        'COMBAT',
  HAILING:       'HAILING',
  MISSION_END:   'MISSION_END',
  WARP_OUT:      'WARP_OUT',
};

export const ALERT_STATES = {
  NORMAL:  'NORMAL',
  YELLOW:  'YELLOW',
  RED:     'RED',
};
