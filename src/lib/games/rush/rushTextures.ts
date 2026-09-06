import Phaser from 'phaser';

export function generateInkRushTextures(scene: Phaser.Scene) {
  // 1. Courier Sprinting Silhouette (36x48)
  if (!scene.textures.exists('rush-courier-run')) {
    const c = document.createElement('canvas');
    c.width = 36;
    c.height = 48;
    const ctx = c.getContext('2d')!;

    // Courier Headband & Head
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.arc(18, 10, 8, 0, Math.PI * 2);
    ctx.fill();

    // Red Headband trailing ribbon
    ctx.strokeStyle = '#b3312c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(12, 10);
    ctx.lineTo(2, 6);
    ctx.stroke();

    // Body
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(12, 18, 12, 16);

    // Courier Scroll on Back
    ctx.fillStyle = '#e0a96d';
    ctx.fillRect(8, 16, 5, 14);

    // Sprinting legs
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(10, 34, 5, 14);
    ctx.fillRect(21, 32, 5, 14);

    scene.textures.addCanvas('rush-courier-run', c);
  }

  // 2. Courier Jump Silhouette (36x48)
  if (!scene.textures.exists('rush-courier-jump')) {
    const c = document.createElement('canvas');
    c.width = 36;
    c.height = 48;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.arc(18, 10, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(12, 16, 12, 14);

    // Tucked jump legs
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(8, 28, 6, 10);
    ctx.fillRect(22, 28, 6, 10);

    // Headband fluttering high
    ctx.strokeStyle = '#b3312c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.lineTo(0, 2);
    ctx.stroke();

    scene.textures.addCanvas('rush-courier-jump', c);
  }

  // 3. Courier Slide Silhouette (48x24)
  if (!scene.textures.exists('rush-courier-slide')) {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 24;
    const ctx = c.getContext('2d')!;

    // Low stretched body
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(10, 8, 28, 12);

    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.arc(38, 14, 7, 0, Math.PI * 2);
    ctx.fill();

    // Legs kicked back
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(2, 12, 12, 6);

    // Red ribbon
    ctx.strokeStyle = '#b3312c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(34, 10);
    ctx.lineTo(24, 4);
    ctx.stroke();

    scene.textures.addCanvas('rush-courier-slide', c);
  }

  // 4. Obstacle: River Rock (40x28 - must jump or switch lane)
  if (!scene.textures.exists('rush-obstacle-rock')) {
    const c = document.createElement('canvas');
    c.width = 40;
    c.height = 28;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#262626';
    ctx.beginPath();
    ctx.moveTo(4, 24);
    ctx.lineTo(14, 6);
    ctx.lineTo(28, 4);
    ctx.lineTo(36, 18);
    ctx.lineTo(34, 26);
    ctx.lineTo(6, 26);
    ctx.closePath();
    ctx.fill();

    // Rushing water foam at base
    ctx.strokeStyle = '#0077b6';
    ctx.lineWidth = 2;
    ctx.stroke();

    scene.textures.addCanvas('rush-obstacle-rock', c);
  }

  // 5. Obstacle: Hanging Bamboo Water Gate (48x44 - must slide or switch lane)
  if (!scene.textures.exists('rush-obstacle-gate')) {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 44;
    const ctx = c.getContext('2d')!;

    // High beam
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(4, 4, 40, 8);

    // Hanging spiked bamboo rungs
    ctx.fillStyle = '#b3312c';
    ctx.fillRect(8, 12, 4, 16);
    ctx.fillRect(18, 12, 4, 16);
    ctx.fillRect(28, 12, 4, 16);
    ctx.fillRect(38, 12, 4, 16);

    // Clearance gap underneath for sliding (Y: 28 to 44 is clear)
    ctx.strokeStyle = '#e0a96d';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, 40, 24);

    scene.textures.addCanvas('rush-obstacle-gate', c);
  }

  // 6. Collectible: Vermilion Scroll (24x24)
  if (!scene.textures.exists('rush-scroll')) {
    const c = document.createElement('canvas');
    c.width = 24;
    c.height = 24;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#b3312c';
    ctx.fillRect(6, 4, 12, 16);

    ctx.fillStyle = '#e0a96d';
    ctx.fillRect(4, 3, 16, 3);
    ctx.fillRect(4, 18, 16, 3);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, 8);
    ctx.lineTo(12, 16);
    ctx.stroke();

    scene.textures.addCanvas('rush-scroll', c);
  }
}
