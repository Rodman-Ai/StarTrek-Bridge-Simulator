import * as THREE from 'three';

// All textures are generated on canvas — no external image assets needed.

export function createLCARSConsoleTexture(width = 512, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000810';
  ctx.fillRect(0, 0, width, height);

  // LCARS panels
  const panels = [
    { x: 8,   y: 8,  w: 80, h: 30, color: '#FF9900' },
    { x: 8,   y: 44, w: 80, h: 16, color: '#FFCC99' },
    { x: 8,   y: 66, w: 80, h: 16, color: '#9999FF' },
    { x: 8,   y: 88, w: 80, h: 24, color: '#FF9900' },
    { x: 96,  y: 8,  w: width-104, h: 30, color: '#001830' },
    { x: 96,  y: 44, w: width-104, h: 60, color: '#000D18' },
  ];

  panels.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, 4);
    ctx.fill();
  });

  // Data lines
  ctx.strokeStyle = '#FF9900';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 8; i++) {
    const y = 50 + i * 7;
    ctx.beginPath();
    ctx.moveTo(96, y); ctx.lineTo(width - 8, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Random bar graphs
  ctx.fillStyle = '#00AAFF';
  for (let i = 0; i < 12; i++) {
    const bh = 10 + Math.random() * 40;
    ctx.fillRect(100 + i * 28, height - 20 - bh, 20, bh);
  }

  // Readout text (tiny)
  ctx.fillStyle = '#FF9900';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('LCARS', 12, 28);
  ctx.font = '8px monospace';
  ctx.fillStyle = '#000';
  ctx.fillText('STA', 18, 56);
  ctx.fillText('NAV', 18, 76);
  ctx.fillStyle = '#FFCC99';
  ctx.fillText('PWR', 18, 100);

  // Scanline effect
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#000';
  for (let y = 0; y < height; y += 2) {
    ctx.fillRect(0, y, width, 1);
  }
  ctx.globalAlpha = 1;

  return new THREE.CanvasTexture(canvas);
}

export function createViewscreenStarfieldTexture(width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000005';
  ctx.fillRect(0, 0, width, height);

  // Draw stars
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 1.5;
    const brightness = 0.4 + Math.random() * 0.6;
    ctx.globalAlpha = brightness;
    ctx.fillStyle = `hsl(${210 + Math.random() * 60}, 30%, ${70 + Math.random() * 30}%)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Distant nebula
  const gradient = ctx.createRadialGradient(width * 0.3, height * 0.4, 0, width * 0.3, height * 0.4, width * 0.35);
  gradient.addColorStop(0, 'rgba(60, 20, 80, 0.3)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return new THREE.CanvasTexture(canvas);
}

export function createFloorTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Base carpet color (TNG burgundy/plum)
  ctx.fillStyle = '#3D1018';
  ctx.fillRect(0, 0, width, height);

  // Carpet pattern — subtle weave
  ctx.globalAlpha = 0.12;
  for (let x = 0; x < width; x += 4) {
    for (let y = 0; y < height; y += 4) {
      if ((x + y) % 8 < 4) {
        ctx.fillStyle = '#6B2030';
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
  ctx.globalAlpha = 1;

  // Decorative strips
  ctx.strokeStyle = '#5A1A25';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, width * 0.4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#6B2030';
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, width * 0.25, 0, Math.PI * 2);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

export function createWallTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Base wall color (TNG beige/tan)
  ctx.fillStyle = '#B8A890';
  ctx.fillRect(0, 0, width, height);

  // Panel lines
  ctx.strokeStyle = '#988878';
  ctx.lineWidth = 2;
  for (let x = 0; x < width; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += 96) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Subtle grille texture
  ctx.globalAlpha = 0.08;
  for (let y = 0; y < height; y += 6) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, y, width, 1);
  }
  ctx.globalAlpha = 1;

  return new THREE.CanvasTexture(canvas);
}

export function createCeilingTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#252320';
  ctx.fillRect(0, 0, width, height);

  // Light panel strips
  ctx.fillStyle = '#FFFEE8';
  ctx.globalAlpha = 0.9;
  for (let y = 80; y < height; y += 120) {
    ctx.fillRect(20, y, width - 40, 18);
  }
  ctx.globalAlpha = 1;

  // Grid lines
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

export function createDisplayTexture(label = 'SYSTEMS', value = '100%', color = '#FF9900') {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000810';
  ctx.fillRect(0, 0, 256, 128);

  // Panel header
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 28);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, 128, 19);

  // Value display
  ctx.fillStyle = color;
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(value, 128, 80);

  // Scan lines
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#000';
  for (let y = 0; y < 128; y += 2) { ctx.fillRect(0, y, 256, 1); }

  return new THREE.CanvasTexture(canvas);
}

export function createSectorMapTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#00050F';
  ctx.fillRect(0, 0, 256, 256);

  // Grid
  ctx.strokeStyle = 'rgba(0, 153, 255, 0.2)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const x = i * 32;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(256, x); ctx.stroke();
  }

  // Stars / objects
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.5})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Enterprise blip (center)
  ctx.fillStyle = '#00FF88';
  ctx.beginPath();
  ctx.arc(128, 128, 5, 0, Math.PI * 2);
  ctx.fill();

  // Range rings
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
  [30, 60, 90].forEach(r => {
    ctx.beginPath();
    ctx.arc(128, 128, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  return new THREE.CanvasTexture(canvas);
}

export function createPortraitTexture(emoji, bgColor = '#1A1A2E') {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 128, 128);
  ctx.font = '80px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 64, 64);

  return new THREE.CanvasTexture(canvas);
}

export function createViewscreenCombatTexture(enemyType, phase = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Space background
  ctx.fillStyle = '#000008';
  ctx.fillRect(0, 0, 512, 256);

  // Stars
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.5})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 256, 1, 1);
  }

  // Enemy ship silhouette
  drawEnemyShip(ctx, enemyType, 350, 128, phase);

  // Targeting reticle
  ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(350, 128, 60, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(350 - 70, 128); ctx.lineTo(350 - 50, 128);
  ctx.moveTo(350 + 50, 128); ctx.lineTo(350 + 70, 128);
  ctx.moveTo(350, 128 - 70); ctx.lineTo(350, 128 - 50);
  ctx.moveTo(350, 128 + 50); ctx.lineTo(350, 128 + 70);
  ctx.stroke();

  // Range display
  ctx.fillStyle = 'rgba(255, 153, 0, 0.8)';
  ctx.font = '10px monospace';
  ctx.fillText(`RANGE: ${Math.floor(40000 - phase * 100)} km`, 310, 200);

  return new THREE.CanvasTexture(canvas);
}

function drawEnemyShip(ctx, type, cx, cy, phase) {
  const wobble = Math.sin(phase * 0.05) * 2;
  ctx.save();
  ctx.translate(cx + wobble, cy + wobble * 0.5);

  switch (type) {
    case 'romulan_warbird':
      // Large D'deridex-style warbird
      ctx.fillStyle = '#003300';
      ctx.strokeStyle = '#005500';
      ctx.lineWidth = 1;
      // Main body
      ctx.beginPath();
      ctx.ellipse(0, 0, 55, 12, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      // Wings
      ctx.fillStyle = '#004400';
      ctx.beginPath();
      ctx.moveTo(-40, 0); ctx.lineTo(-20, -30); ctx.lineTo(20, -28); ctx.lineTo(30, 0);
      ctx.lineTo(20, 28); ctx.lineTo(-20, 30); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Engine glow
      ctx.fillStyle = 'rgba(0, 255, 50, 0.6)';
      ctx.beginPath(); ctx.arc(-52, 0, 5, 0, Math.PI * 2); ctx.fill();
      break;

    case 'klingon_bop':
      // Bird of Prey
      ctx.fillStyle = '#2A1800';
      ctx.strokeStyle = '#553300';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 0); ctx.lineTo(-10, -8); ctx.lineTo(-30, 0); ctx.lineTo(-10, 8); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Wings swept forward
      ctx.fillStyle = '#3A2200';
      ctx.beginPath();
      ctx.moveTo(-5, -5); ctx.lineTo(-35, -35); ctx.lineTo(-15, -5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-5, 5); ctx.lineTo(-35, 35); ctx.lineTo(-15, 5);
      ctx.fill();
      // Disruptor glow
      ctx.fillStyle = 'rgba(180, 50, 255, 0.8)';
      ctx.beginPath(); ctx.arc(38, 0, 4, 0, Math.PI * 2); ctx.fill();
      break;

    case 'borg_cube':
      // Borg cube (square)
      ctx.strokeStyle = '#44AA44';
      ctx.fillStyle = '#1A331A';
      ctx.lineWidth = 2;
      ctx.fillRect(-35, -35, 70, 70);
      ctx.strokeRect(-35, -35, 70, 70);
      // Grid lines
      ctx.strokeStyle = 'rgba(0, 180, 80, 0.5)';
      ctx.lineWidth = 1;
      for (let i = -28; i <= 35; i += 14) {
        ctx.beginPath(); ctx.moveTo(i, -35); ctx.lineTo(i, 35); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-35, i); ctx.lineTo(35, i); ctx.stroke();
      }
      // Green glow
      ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
      ctx.fillRect(-35, -35, 70, 70);
      break;

    case 'cardassian_galor':
      ctx.fillStyle = '#332211';
      ctx.strokeStyle = '#665522';
      ctx.lineWidth = 1;
      // Elongated body
      ctx.beginPath();
      ctx.ellipse(0, 0, 50, 10, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      // Side wings
      ctx.fillStyle = '#443322';
      ctx.beginPath();
      ctx.moveTo(10, -8); ctx.lineTo(-20, -20); ctx.lineTo(-30, -8); ctx.lineTo(-10, -4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, 8); ctx.lineTo(-20, 20); ctx.lineTo(-30, 8); ctx.lineTo(-10, 4);
      ctx.fill();
      break;

    default:
      // Ferengi Marauder
      ctx.fillStyle = '#332200';
      ctx.strokeStyle = '#664400';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, 30, 8, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(-25, -18); ctx.lineTo(-20, -4); ctx.lineTo(0, -6);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 6); ctx.lineTo(-25, 18); ctx.lineTo(-20, 4); ctx.lineTo(0, 6);
      ctx.fill();
  }
  ctx.restore();
}
