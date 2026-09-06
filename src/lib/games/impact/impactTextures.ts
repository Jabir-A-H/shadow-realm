import Phaser from 'phaser';

export function generateInkImpactTextures(scene: Phaser.Scene) {
  // 1. Player Ship: Origami Crane / Ink Glider (40x28)
  if (!scene.textures.exists('impact-glider')) {
    const c = document.createElement('canvas');
    c.width = 40;
    c.height = 28;
    const ctx = c.getContext('2d')!;

    // Fuselage / Bird beak
    ctx.fillStyle = '#f4ebd0';
    ctx.beginPath();
    ctx.moveTo(38, 14);
    ctx.lineTo(2, 4);
    ctx.lineTo(10, 14);
    ctx.lineTo(2, 24);
    ctx.closePath();
    ctx.fill();

    // Wings
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.moveTo(22, 14);
    ctx.lineTo(6, 2);
    ctx.lineTo(16, 14);
    ctx.lineTo(6, 26);
    ctx.closePath();
    ctx.fill();

    // Red wing accents
    ctx.fillStyle = '#b3312c';
    ctx.fillRect(12, 12, 10, 4);

    scene.textures.addCanvas('impact-glider', c);
  }

  // 2. Ink Dart Projectile (20x6)
  if (!scene.textures.exists('impact-dart')) {
    const c = document.createElement('canvas');
    c.width = 20;
    c.height = 6;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#90e0ef';
    ctx.beginPath();
    ctx.ellipse(10, 3, 9, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 2, 8, 2);

    scene.textures.addCanvas('impact-dart', c);
  }

  // 3. Enemy Ink Bullet (10x10)
  if (!scene.textures.exists('impact-enemy-bullet')) {
    const c = document.createElement('canvas');
    c.width = 10;
    c.height = 10;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#b3312c';
    ctx.beginPath();
    ctx.arc(5, 5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f4ebd0';
    ctx.lineWidth = 1;
    ctx.stroke();

    scene.textures.addCanvas('impact-enemy-bullet', c);
  }

  // 4. Enemy 1: Ink Blot (28x28)
  if (!scene.textures.exists('impact-enemy-blot')) {
    const c = document.createElement('canvas');
    c.width = 28;
    c.height = 28;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#151515';
    ctx.beginPath();
    ctx.arc(14, 14, 10, 0, Math.PI * 2);
    ctx.fill();

    // Spiky ink splatter blobs around core
    ctx.beginPath();
    ctx.arc(6, 14, 4, 0, Math.PI * 2);
    ctx.arc(22, 14, 4, 0, Math.PI * 2);
    ctx.arc(14, 6, 4, 0, Math.PI * 2);
    ctx.arc(14, 22, 4, 0, Math.PI * 2);
    ctx.fill();

    // Glowing red eye
    ctx.fillStyle = '#e63946';
    ctx.fillRect(10, 12, 8, 4);

    scene.textures.addCanvas('impact-enemy-blot', c);
  }

  // 5. Enemy 2: Shadow Raven (36x28)
  if (!scene.textures.exists('impact-enemy-raven')) {
    const c = document.createElement('canvas');
    c.width = 36;
    c.height = 28;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#181818';
    // Beak pointing left
    ctx.beginPath();
    ctx.moveTo(2, 14);
    ctx.lineTo(12, 10);
    ctx.lineTo(12, 18);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillRect(12, 10, 16, 8);

    // Wings
    ctx.beginPath();
    ctx.moveTo(18, 10);
    ctx.lineTo(34, 2);
    ctx.lineTo(24, 14);
    ctx.lineTo(34, 26);
    ctx.lineTo(18, 18);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(8, 12, 3, 3);

    scene.textures.addCanvas('impact-enemy-raven', c);
  }

  // 6. Enemy 3: Ink Squid (32x32)
  if (!scene.textures.exists('impact-enemy-squid')) {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#1c1c1c';
    // Bulbous mantle (facing left)
    ctx.beginPath();
    ctx.ellipse(20, 16, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tentacles trailing behind
    ctx.fillRect(2, 8, 12, 3);
    ctx.fillRect(0, 14, 14, 4);
    ctx.fillRect(2, 21, 12, 3);

    // Cyan eye
    ctx.fillStyle = '#48cae4';
    ctx.fillRect(16, 12, 4, 4);

    scene.textures.addCanvas('impact-enemy-squid', c);
  }

  // 7. Boss: Ink Dragon / Sky Titan (80x70)
  if (!scene.textures.exists('impact-boss')) {
    const c = document.createElement('canvas');
    c.width = 80;
    c.height = 70;
    const ctx = c.getContext('2d')!;

    // Massive Dragon Maw (facing left)
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.moveTo(6, 35);
    ctx.lineTo(32, 10);
    ctx.lineTo(76, 18);
    ctx.lineTo(76, 52);
    ctx.lineTo(32, 60);
    ctx.closePath();
    ctx.fill();

    // Horns / Crest
    ctx.fillStyle = '#90e0ef';
    ctx.beginPath();
    ctx.moveTo(34, 12);
    ctx.lineTo(54, 2);
    ctx.lineTo(50, 14);
    ctx.closePath();
    ctx.fill();

    // Menacing glowing eye
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.arc(26, 30, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 28, 4, 4);

    // Fangs
    ctx.fillStyle = '#f4ebd0';
    ctx.beginPath();
    ctx.moveTo(14, 30);
    ctx.lineTo(20, 36);
    ctx.lineTo(16, 36);
    ctx.closePath();
    ctx.fill();

    scene.textures.addCanvas('impact-boss', c);
  }

  // 8. Powerup Icons (20x20)
  // Spread Shot
  if (!scene.textures.exists('power-spread')) {
    const c = document.createElement('canvas');
    c.width = 20;
    c.height = 20;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#e0a96d';
    ctx.beginPath();
    ctx.arc(10, 10, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#141414';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('W', 10, 10);
    scene.textures.addCanvas('power-spread', c);
  }

  // Shield
  if (!scene.textures.exists('power-shield')) {
    const c = document.createElement('canvas');
    c.width = 20;
    c.height = 20;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#48cae4';
    ctx.beginPath();
    ctx.arc(10, 10, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#141414';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', 10, 10);
    scene.textures.addCanvas('power-shield', c);
  }

  // Ink Splatter explosion particle (12x12)
  if (!scene.textures.exists('impact-splat')) {
    const c = document.createElement('canvas');
    c.width = 12;
    c.height = 12;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.arc(6, 6, 5, 0, Math.PI * 2);
    ctx.fill();
    scene.textures.addCanvas('impact-splat', c);
  }
}
