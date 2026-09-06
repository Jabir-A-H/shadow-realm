import Phaser from 'phaser';

export function generateBladeDuelTextures(scene: Phaser.Scene, wardenColorHex = '#48cae4') {
  // 1. Player Idle (48x64)
  if (!scene.textures.exists('duel-player-idle')) {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 64;
    const ctx = c.getContext('2d')!;

    // Conical Hat
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.ellipse(24, 14, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, 14);
    ctx.lineTo(24, 4);
    ctx.lineTo(38, 14);
    ctx.closePath();
    ctx.fill();

    // Body / Robe
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.moveTo(16, 16);
    ctx.lineTo(32, 16);
    ctx.lineTo(36, 46);
    ctx.lineTo(12, 46);
    ctx.closePath();
    ctx.fill();

    // Red sash
    ctx.fillStyle = '#b3312c';
    ctx.fillRect(15, 30, 18, 4);

    // Legs
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(16, 46, 5, 16);
    ctx.fillRect(27, 46, 5, 16);

    // Katana in neutral ready position
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(28, 32);
    ctx.lineTo(44, 26);
    ctx.stroke();

    // Katana hilt & guard
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(24, 33);
    ctx.lineTo(28, 32);
    ctx.stroke();

    scene.textures.addCanvas('duel-player-idle', c);
  }

  // 2. Player Quick Poke Thrust (80x64)
  if (!scene.textures.exists('duel-player-poke')) {
    const c = document.createElement('canvas');
    c.width = 80;
    c.height = 64;
    const ctx = c.getContext('2d')!;

    // Lunging body
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.moveTo(14, 18);
    ctx.lineTo(32, 18);
    ctx.lineTo(38, 46);
    ctx.lineTo(10, 46);
    ctx.closePath();
    ctx.fill();

    // Hat tilted forward
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.ellipse(26, 14, 18, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Lunging legs
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(8, 46, 6, 14);
    ctx.fillRect(28, 46, 14, 8);
    ctx.fillRect(38, 52, 6, 10);

    // Extended sword arm and razor straight blade thrust
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(32, 28);
    ctx.lineTo(76, 28);
    ctx.stroke();

    // White thrust streak
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(40, 28);
    ctx.lineTo(78, 28);
    ctx.stroke();

    scene.textures.addCanvas('duel-player-poke', c);
  }

  // 3. Player Heavy Strike (80x64)
  if (!scene.textures.exists('duel-player-heavy')) {
    const c = document.createElement('canvas');
    c.width = 80;
    c.height = 64;
    const ctx = c.getContext('2d')!;

    // Deep stance
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.moveTo(16, 20);
    ctx.lineTo(34, 20);
    ctx.lineTo(36, 48);
    ctx.lineTo(12, 48);
    ctx.closePath();
    ctx.fill();

    // Hat
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.ellipse(24, 16, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs spread wide
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(6, 48, 8, 14);
    ctx.fillRect(32, 48, 8, 14);

    // Huge sweeping downward slash arc
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(28, 22);
    ctx.lineTo(74, 50);
    ctx.stroke();

    // Dynamic ink slash crescent trail
    ctx.strokeStyle = 'rgba(244, 235, 208, 0.6)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(32, 36, 42, -Math.PI / 4, Math.PI / 6);
    ctx.stroke();

    scene.textures.addCanvas('duel-player-heavy', c);
  }

  // 4. Player Guard / Block Stance (48x64)
  if (!scene.textures.exists('duel-player-guard')) {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 64;
    const ctx = c.getContext('2d')!;

    // Braced body
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(14, 18, 20, 28);

    // Hat
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.ellipse(24, 14, 17, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Braced legs
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(12, 46, 7, 16);
    ctx.fillRect(25, 46, 7, 16);

    // Vertical blade held defensive in front of chest
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, 10);
    ctx.lineTo(30, 44);
    ctx.stroke();

    // Guard glow shimmer
    ctx.fillStyle = 'rgba(230, 230, 255, 0.2)';
    ctx.fillRect(26, 12, 8, 30);

    scene.textures.addCanvas('duel-player-guard', c);
  }

  // 5. Player Hit Stun (48x64)
  if (!scene.textures.exists('duel-player-hit')) {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 64;
    const ctx = c.getContext('2d')!;

    // Knocked backward body
    ctx.fillStyle = '#262626';
    ctx.beginPath();
    ctx.moveTo(8, 20);
    ctx.lineTo(26, 16);
    ctx.lineTo(30, 48);
    ctx.lineTo(6, 50);
    ctx.closePath();
    ctx.fill();

    // Flying hat
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.ellipse(14, 12, 16, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Reeling legs
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(4, 48, 6, 14);
    ctx.fillRect(20, 48, 6, 14);

    // Splattered red / black ink
    ctx.fillStyle = '#b3312c';
    ctx.beginPath();
    ctx.arc(26, 26, 5, 0, Math.PI * 2);
    ctx.arc(36, 20, 3, 0, Math.PI * 2);
    ctx.arc(32, 34, 4, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('duel-player-hit', c);
  }

  // ==========================================
  // WARDEN OPPONENT TEXTURES (FROST / VERMILION)
  // ==========================================
  const wardenKeySuffix = wardenColorHex.replace('#', '');

  // 6. Warden Idle (48x64)
  if (!scene.textures.exists(`duel-warden-idle-${wardenKeySuffix}`)) {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 64;
    const ctx = c.getContext('2d')!;

    // Hood / Horns
    ctx.fillStyle = '#161616';
    ctx.beginPath();
    ctx.arc(24, 14, 12, 0, Math.PI * 2);
    ctx.fill();

    // Glowing eyes with warden pigment
    ctx.fillStyle = wardenColorHex;
    ctx.fillRect(16, 14, 5, 2.5);

    // Long Warden Robe
    ctx.fillStyle = '#1f1f1f';
    ctx.beginPath();
    ctx.moveTo(14, 18);
    ctx.lineTo(34, 18);
    ctx.lineTo(38, 56);
    ctx.lineTo(10, 56);
    ctx.closePath();
    ctx.fill();

    // Flowing Cape / Trim
    ctx.strokeStyle = wardenColorHex;
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 20, 24, 34);

    // Katana / Warden Greatblade (Facing Left)
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, 34);
    ctx.lineTo(4, 28);
    ctx.stroke();

    scene.textures.addCanvas(`duel-warden-idle-${wardenKeySuffix}`, c);
  }

  // 7. Warden Poke Thrust (80x64)
  if (!scene.textures.exists(`duel-warden-poke-${wardenKeySuffix}`)) {
    const c = document.createElement('canvas');
    c.width = 80;
    c.height = 64;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#1f1f1f';
    ctx.beginPath();
    ctx.moveTo(48, 18);
    ctx.lineTo(66, 18);
    ctx.lineTo(70, 48);
    ctx.lineTo(42, 48);
    ctx.closePath();
    ctx.fill();

    // Glowing eyes
    ctx.fillStyle = wardenColorHex;
    ctx.fillRect(44, 14, 5, 2.5);

    // Thrust blade extending to the left
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(48, 28);
    ctx.lineTo(4, 28);
    ctx.stroke();

    ctx.strokeStyle = wardenColorHex;
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 26, 36, 4);

    scene.textures.addCanvas(`duel-warden-poke-${wardenKeySuffix}`, c);
  }

  // 8. Warden Heavy Strike (80x64)
  if (!scene.textures.exists(`duel-warden-heavy-${wardenKeySuffix}`)) {
    const c = document.createElement('canvas');
    c.width = 80;
    c.height = 64;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#1f1f1f';
    ctx.beginPath();
    ctx.moveTo(44, 20);
    ctx.lineTo(64, 20);
    ctx.lineTo(68, 52);
    ctx.lineTo(40, 52);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = wardenColorHex;
    ctx.fillRect(42, 16, 5, 2.5);

    // Downward crushing strike to the left
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(52, 20);
    ctx.lineTo(6, 52);
    ctx.stroke();

    // Colored slash arc
    ctx.strokeStyle = wardenColorHex;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(48, 36, 42, (3 * Math.PI) / 4, (5 * Math.PI) / 6);
    ctx.stroke();

    scene.textures.addCanvas(`duel-warden-heavy-${wardenKeySuffix}`, c);
  }

  // 9. Warden Guard Stance (48x64)
  if (!scene.textures.exists(`duel-warden-guard-${wardenKeySuffix}`)) {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 64;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#1f1f1f';
    ctx.fillRect(14, 18, 20, 36);

    ctx.fillStyle = wardenColorHex;
    ctx.fillRect(16, 14, 5, 2.5);

    // Vertical guard on left side
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(18, 10);
    ctx.lineTo(18, 46);
    ctx.stroke();

    ctx.fillStyle = `${wardenColorHex}33`;
    ctx.fillRect(14, 12, 8, 32);

    scene.textures.addCanvas(`duel-warden-guard-${wardenKeySuffix}`, c);
  }

  // 10. Warden Hit Stun (48x64)
  if (!scene.textures.exists(`duel-warden-hit-${wardenKeySuffix}`)) {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 64;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#242424';
    ctx.beginPath();
    ctx.moveTo(22, 16);
    ctx.lineTo(40, 20);
    ctx.lineTo(42, 50);
    ctx.lineTo(18, 48);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#b3312c';
    ctx.beginPath();
    ctx.arc(18, 28, 6, 0, Math.PI * 2);
    ctx.arc(10, 22, 4, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas(`duel-warden-hit-${wardenKeySuffix}`, c);
  }

  // 11. Sparks & Particles
  if (!scene.textures.exists('duel-spark')) {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 2, 2, 12);
    ctx.fillRect(2, 7, 12, 2);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(5, 5, 6, 6);
    scene.textures.addCanvas('duel-spark', c);
  }
}
