import Phaser from 'phaser';

export function generateRogueOutlawTextures(scene: Phaser.Scene) {
  // 1. Player Outlaw Gunslinger (36x36 top-down silhouette)
  if (!scene.textures.exists('outlaw-player')) {
    const c = document.createElement('canvas');
    c.width = 36;
    c.height = 36;
    const ctx = c.getContext('2d')!;

    // Wide brim outlaw hat (top-down view)
    ctx.fillStyle = '#161616';
    ctx.beginPath();
    ctx.ellipse(18, 18, 14, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hat crown
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.ellipse(18, 18, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red neckerchief
    ctx.fillStyle = '#b3312c';
    ctx.fillRect(16, 26, 4, 4);

    // Revolver gun barrel extending right
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(28, 17, 7, 3);

    scene.textures.addCanvas('outlaw-player', c);
  }

  // 2. Player Rolling Silhouette (32x32)
  if (!scene.textures.exists('outlaw-player-roll')) {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#262626';
    ctx.beginPath();
    ctx.arc(16, 16, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e0a96d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(16, 16, 13, 0, Math.PI * 1.5);
    ctx.stroke();

    scene.textures.addCanvas('outlaw-player-roll', c);
  }

  // 3. Enemy Bandit: Knife Rusher (32x32)
  if (!scene.textures.exists('outlaw-enemy-rusher')) {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#181818';
    ctx.beginPath();
    ctx.arc(16, 16, 11, 0, Math.PI * 2);
    ctx.fill();

    // Red bandanna
    ctx.fillStyle = '#b3312c';
    ctx.fillRect(11, 10, 10, 4);

    // Glinting curved dagger
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(24, 12);
    ctx.lineTo(31, 16);
    ctx.lineTo(24, 20);
    ctx.closePath();
    ctx.fill();

    scene.textures.addCanvas('outlaw-enemy-rusher', c);
  }

  // 4. Enemy Bandit: Rifle Marksman (34x34)
  if (!scene.textures.exists('outlaw-enemy-marksman')) {
    const c = document.createElement('canvas');
    c.width = 34;
    c.height = 34;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.ellipse(17, 17, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye slit
    ctx.fillStyle = '#e0a96d';
    ctx.fillRect(23, 15, 3, 3);

    // Long rifle barrel
    ctx.fillStyle = '#777777';
    ctx.fillRect(24, 16, 9, 2);

    scene.textures.addCanvas('outlaw-enemy-marksman', c);
  }

  // 5. Boss: The Red Viper (48x48)
  if (!scene.textures.exists('outlaw-boss-viper')) {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 48;
    const ctx = c.getContext('2d')!;

    // Crimson duster & hat
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.arc(24, 24, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#b3312c';
    ctx.beginPath();
    ctx.arc(24, 24, 13, 0, Math.PI * 2);
    ctx.fill();

    // Glowing viper gold eyes
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(32, 20, 4, 3);
    ctx.fillRect(32, 25, 4, 3);

    // Dual pistols
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(36, 17, 10, 3);
    ctx.fillRect(36, 28, 10, 3);

    scene.textures.addCanvas('outlaw-boss-viper', c);
  }

  // 6. Player Bullet (12x5)
  if (!scene.textures.exists('outlaw-bullet-player')) {
    const c = document.createElement('canvas');
    c.width = 12;
    c.height = 5;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(2, 1, 9, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 2, 5, 1);
    scene.textures.addCanvas('outlaw-bullet-player', c);
  }

  // 7. Enemy Bullet (8x8)
  if (!scene.textures.exists('outlaw-bullet-enemy')) {
    const c = document.createElement('canvas');
    c.width = 8;
    c.height = 8;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#b3312c';
    ctx.beginPath();
    ctx.arc(4, 4, 3.5, 0, Math.PI * 2);
    ctx.fill();
    scene.textures.addCanvas('outlaw-bullet-enemy', c);
  }

  // 8. Tumbleweed (24x24)
  if (!scene.textures.exists('outlaw-tumbleweed')) {
    const c = document.createElement('canvas');
    c.width = 24;
    c.height = 24;
    const ctx = c.getContext('2d')!;
    ctx.strokeStyle = '#b08968';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(12, 12, 5 + i * 1.5, i * 0.8, i * 0.8 + Math.PI * 1.3);
      ctx.stroke();
    }
    scene.textures.addCanvas('outlaw-tumbleweed', c);
  }

  // 9. Desert Rock Cover (44x34)
  if (!scene.textures.exists('outlaw-rock')) {
    const c = document.createElement('canvas');
    c.width = 44;
    c.height = 34;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#2b2320';
    ctx.beginPath();
    ctx.moveTo(6, 28);
    ctx.lineTo(14, 8);
    ctx.lineTo(34, 6);
    ctx.lineTo(42, 24);
    ctx.lineTo(36, 32);
    ctx.lineTo(10, 32);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b3312c';
    ctx.lineWidth = 1;
    ctx.stroke();
    scene.textures.addCanvas('outlaw-rock', c);
  }
}
