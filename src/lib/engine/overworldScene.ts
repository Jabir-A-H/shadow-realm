import Phaser from 'phaser';
import { CONTINENTAL_REGIONS, COLOR_GATES, getRegionAt, ColorGateTrigger, RegionZone } from './tilemapData';
import { Pigment } from '../../contexts/SpectrumContext';
import { OverworldCallbacks } from './phaserConfig';

export interface OverworldSceneInitData {
  callbacks: OverworldCallbacks;
  initialCoords: { x: number; y: number };
  unlockedPigments: Pigment[];
}

interface ShrineEntity {
  regionId: string;
  x: number;
  y: number;
  shrineSprite: Phaser.GameObjects.Sprite;
  wardenSprite: Phaser.GameObjects.Sprite;
  runeText: Phaser.GameObjects.Text;
  glowCircle: Phaser.GameObjects.Arc;
}

interface BarrierEntity {
  gateData: ColorGateTrigger;
  container: Phaser.GameObjects.Container;
  colliderBody: Phaser.Physics.Arcade.Image;
  glowGraphic: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  isUnlocked: boolean;
}

export class OverworldScene extends Phaser.Scene {
  private callbacks: OverworldCallbacks;
  private initialCoords: { x: number; y: number };
  private unlockedPigments: Set<Pigment>;

  // Game objects
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private playerShadow!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyEnter!: Phaser.Input.Keyboard.Key;

  // Shrines & Barriers
  private shrines: ShrineEntity[] = [];
  private barriers: BarrierEntity[] = [];
  private barrierGroup!: Phaser.Physics.Arcade.StaticGroup;
  private lastBarrierEncounterTime = 0;

  // Interaction prompt
  private promptContainer!: Phaser.GameObjects.Container;
  private promptText!: Phaser.GameObjects.Text;
  private activeNearbyShrine: ShrineEntity | null = null;

  // Movement & State
  private virtualInputVector: { x: number; y: number } = { x: 0, y: 0 };
  private currentRegionId = 'river-crossings';
  private lastFootstepTime = 0;
  private lastRegionCheckTime = 0;
  private playerFacing: 'up' | 'down' | 'left' | 'right' = 'down';

  // Ambient Particles
  private ambientParticles: Phaser.GameObjects.Arc[] = [];

  constructor(data: OverworldSceneInitData) {
    super({ key: 'OverworldScene' });
    this.callbacks = data.callbacks;
    this.initialCoords = data.initialCoords;
    this.unlockedPigments = new Set(data.unlockedPigments);
  }

  init(data: OverworldSceneInitData) {
    if (data.callbacks) this.callbacks = data.callbacks;
    if (data.initialCoords) this.initialCoords = data.initialCoords;
    if (data.unlockedPigments) this.unlockedPigments = new Set(data.unlockedPigments);
  }

  preload() {
    this.generateProceduralTextures();
  }

  create() {
    // 1. World physics and dimensions (Expansive 3200 x 2400 Continental Map)
    const mapWidth = 3200;
    const mapHeight = 2400;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // 2. Draw 2.5D Continental Terrain, Cliffs, Tiled Grid, and Waterways
    this.buildContinentalTerrain(mapWidth, mapHeight);

    // 3. Create Barrier Static Group
    this.barrierGroup = this.physics.add.staticGroup();
    this.buildColorGates();

    // 4. Build 7 Kingdom Warden Shrines & Torii Gates
    this.buildWardenShrines();

    // 5. Create 2.5D Player (Shadow Wanderer with Drop Shadow)
    this.createPlayer();

    // 6. Setup Colliders
    this.physics.add.collider(
      this.player,
      this.barrierGroup,
      this.handlePlayerBarrierCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // 7. Setup Smooth 2.5D Camera Follow with Lerping & Clamping
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(50, 40);
    this.cameras.main.setZoom(1.0);

    // 8. Keyboard Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }

    // 9. Interaction Prompt Bubble
    this.createPromptBubble();

    // 10. Ambient Weather Particles
    this.initAmbientParticles(mapWidth, mapHeight);

    // Initial region notification
    const initialRegion = getRegionAt(this.player.x, this.player.y);
    this.currentRegionId = initialRegion.id;
    this.callbacks.onRegionChange(initialRegion.id, initialRegion.name);
  }

  update(time: number) {
    this.handlePlayerMovement(time);
    this.updateDepthSorting();
    this.checkProximityToShrines();
    this.updateAmbientParticles();
    this.updateWaterRipples(time);

    // Periodic region boundary check
    if (time - this.lastRegionCheckTime > 300) {
      this.lastRegionCheckTime = time;
      const cur = getRegionAt(this.player.x, this.player.y);
      if (cur.id !== this.currentRegionId) {
        this.currentRegionId = cur.id;
        this.callbacks.onRegionChange(cur.id, cur.name);
        this.callbacks.onPlaySfx?.('parchment');
      }
      this.callbacks.onPlayerMove({
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        facing: this.playerFacing,
        currentRegion: cur.id,
      });
    }

    // Check interaction key press
    if (
      Phaser.Input.Keyboard.JustDown(this.keyE) ||
      Phaser.Input.Keyboard.JustDown(this.keySpace) ||
      Phaser.Input.Keyboard.JustDown(this.keyEnter)
    ) {
      this.triggerActionInteract();
    }
  }

  // ==========================================
  // 2.5D DEPTH / Y-SORTING ENGINE
  // ==========================================
  private updateDepthSorting() {
    // Dynamically sort player depth by foot Y position
    const footY = this.player.y + 12;
    this.player.setDepth(footY);
    if (this.playerShadow) {
      this.playerShadow.setPosition(this.player.x, this.player.y + 20);
      this.playerShadow.setDepth(footY - 1);
    }
  }

  // ==========================================
  // PUBLIC CONTROLLER API (Called from React)
  // ==========================================

  public syncUnlockedPigments(pigments: Pigment[]) {
    this.unlockedPigments = new Set(pigments);
    this.refreshBarriersState();
  }

  public teleport(x: number, y: number) {
    if (this.player) {
      this.player.setPosition(x, y);
      this.player.setVelocity(0, 0);
      const reg = getRegionAt(x, y);
      this.currentRegionId = reg.id;
      this.callbacks.onRegionChange(reg.id, reg.name);
    }
  }

  public setVirtualInput(vector: { x: number; y: number }) {
    this.virtualInputVector = vector;
  }

  public triggerActionInteract() {
    if (this.activeNearbyShrine) {
      this.callbacks.onPlaySfx?.('taiko');
      this.callbacks.onWardenEncounter(
        this.activeNearbyShrine.regionId,
        { x: this.activeNearbyShrine.x, y: this.activeNearbyShrine.y }
      );
    }
  }

  // ==========================================
  // PROCEDURAL 2.5D TEXTURE GENERATION
  // ==========================================

  private generateProceduralTextures() {
    // 1. Soft Oval Drop Shadow (32x16)
    if (!this.textures.exists('drop-shadow')) {
      const sCanvas = document.createElement('canvas');
      sCanvas.width = 36;
      sCanvas.height = 18;
      const ctx = sCanvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(18, 9, 2, 18, 9, 17);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(18, 9, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      this.textures.addCanvas('drop-shadow', sCanvas);
    }

    // 2. Player 2.5D Ronin Silhouette Sprite (36x50)
    if (!this.textures.exists('wanderer-silhouette')) {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 36;
      pCanvas.height = 50;
      const ctx = pCanvas.getContext('2d')!;

      // Conical Kasa Hat (2.5D angled top with highlight rim)
      ctx.fillStyle = '#1e1e1e';
      ctx.beginPath();
      ctx.ellipse(18, 14, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#121212';
      ctx.beginPath();
      ctx.moveTo(8, 14);
      ctx.lineTo(18, 4);
      ctx.lineTo(28, 14);
      ctx.closePath();
      ctx.fill();
      // Hat brim highlight
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(18, 14, 15, 6, 0, 0, Math.PI);
      ctx.stroke();

      // Masked face & Glowing Vermilion eye slit
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(13, 15, 10, 6);
      ctx.fillStyle = '#e63946';
      ctx.fillRect(15, 17, 6, 2);

      // Ronin Haori Cloak
      ctx.fillStyle = '#181818';
      ctx.beginPath();
      ctx.moveTo(11, 20);
      ctx.lineTo(25, 20);
      ctx.lineTo(28, 38);
      ctx.lineTo(8, 38);
      ctx.closePath();
      ctx.fill();

      // Flowing sash / ribbon (vermilion red accent)
      ctx.strokeStyle = '#b3312c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(18, 26);
      ctx.quadraticCurveTo(28, 30, 32, 40);
      ctx.stroke();

      // Sheathed Katana at Hip (Gold habaki)
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(7, 28);
      ctx.lineTo(2, 42);
      ctx.stroke();

      // Legs / Hakama
      ctx.fillStyle = '#0c0c0c';
      ctx.fillRect(11, 38, 5, 10);
      ctx.fillRect(20, 38, 5, 10);

      this.textures.addCanvas('wanderer-silhouette', pCanvas);
    }

    // 3. 2.5D Temperate Tree (River Crossings / Hub) (64x84)
    if (!this.textures.exists('tree-temperate')) {
      this.generate2DTreeTexture('tree-temperate', '#264653', '#2a9d8f', '#2d6a4f', '#52b788');
    }

    // 4. 2.5D Snow Fir Tree (The Frozen Reach) (64x88)
    if (!this.textures.exists('tree-snow')) {
      const tCanvas = document.createElement('canvas');
      tCanvas.width = 64;
      tCanvas.height = 88;
      const ctx = tCanvas.getContext('2d')!;

      // Drop shadow at base
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(32, 82, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trunk
      ctx.fillStyle = '#2c221e';
      ctx.fillRect(28, 64, 8, 18);

      // Bottom Tier Pine Needles
      ctx.fillStyle = '#1b3b36';
      ctx.beginPath();
      ctx.moveTo(10, 66);
      ctx.lineTo(32, 42);
      ctx.lineTo(54, 66);
      ctx.closePath();
      ctx.fill();
      // Snow blanket on bottom tier
      ctx.fillStyle = '#e0f2f7';
      ctx.beginPath();
      ctx.moveTo(10, 66);
      ctx.lineTo(32, 42);
      ctx.lineTo(54, 66);
      ctx.lineTo(48, 58);
      ctx.lineTo(32, 50);
      ctx.lineTo(16, 58);
      ctx.closePath();
      ctx.fill();

      // Middle Tier
      ctx.fillStyle = '#264653';
      ctx.beginPath();
      ctx.moveTo(16, 48);
      ctx.lineTo(32, 26);
      ctx.lineTo(48, 48);
      ctx.closePath();
      ctx.fill();
      // Snow blanket on middle tier
      ctx.fillStyle = '#f0faff';
      ctx.beginPath();
      ctx.moveTo(16, 48);
      ctx.lineTo(32, 26);
      ctx.lineTo(48, 48);
      ctx.lineTo(42, 40);
      ctx.lineTo(32, 34);
      ctx.lineTo(22, 40);
      ctx.closePath();
      ctx.fill();

      // Top Tier
      ctx.fillStyle = '#2a9d8f';
      ctx.beginPath();
      ctx.moveTo(22, 30);
      ctx.lineTo(32, 10);
      ctx.lineTo(42, 30);
      ctx.closePath();
      ctx.fill();
      // Snowcap
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(22, 30);
      ctx.lineTo(32, 10);
      ctx.lineTo(42, 30);
      ctx.lineTo(36, 22);
      ctx.lineTo(32, 16);
      ctx.lineTo(28, 22);
      ctx.closePath();
      ctx.fill();

      this.textures.addCanvas('tree-snow', tCanvas);
    }

    // 5. 2.5D Cherry Blossom Tree (The Verdant Reach) (64x84)
    if (!this.textures.exists('tree-sakura')) {
      this.generate2DTreeTexture('tree-sakura', '#4a1525', '#9d2a6a', '#c94277', '#f4a5c5');
    }

    // 6. 2.5D Golden Arbor Tree (The Gilded Vault) (64x84)
    if (!this.textures.exists('tree-golden')) {
      this.generate2DTreeTexture('tree-golden', '#4a3810', '#b58327', '#d4a359', '#ffd166');
    }

    // 7. 2.5D Tropical Palm (Drowned Isles) (64x86)
    if (!this.textures.exists('tree-palm')) {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 64;
      pCanvas.height = 86;
      const ctx = pCanvas.getContext('2d')!;

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(32, 80, 20, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Curved trunk
      ctx.strokeStyle = '#4a3728';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(32, 80);
      ctx.quadraticCurveTo(24, 52, 30, 28);
      ctx.stroke();

      // Palm fronds
      ctx.strokeStyle = '#1b4332';
      ctx.lineWidth = 4;
      const fronds = [
        { cx: 12, cy: 16, ex: 6, ey: 34 },
        { cx: 20, cy: 12, ex: 16, ey: 14 },
        { cx: 40, cy: 10, ex: 48, ey: 14 },
        { cx: 50, cy: 16, ex: 58, ey: 34 },
        { cx: 32, cy: 8, ex: 32, ey: 4 },
      ];
      fronds.forEach((f) => {
        ctx.beginPath();
        ctx.moveTo(30, 28);
        ctx.quadraticCurveTo(f.cx, f.cy, f.ex, f.ey);
        ctx.stroke();
      });

      this.textures.addCanvas('tree-palm', pCanvas);
    }

    // 8. 2.5D Obsidian Monolith (Obsidian Citadel) (44x84)
    if (!this.textures.exists('obsidian-monolith')) {
      const oCanvas = document.createElement('canvas');
      oCanvas.width = 44;
      oCanvas.height = 84;
      const ctx = oCanvas.getContext('2d')!;

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(22, 78, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Monolith body
      ctx.fillStyle = '#140e1b';
      ctx.beginPath();
      ctx.moveTo(12, 78);
      ctx.lineTo(6, 30);
      ctx.lineTo(22, 6);
      ctx.lineTo(38, 30);
      ctx.lineTo(32, 78);
      ctx.closePath();
      ctx.fill();

      // Shaded Facet
      ctx.fillStyle = '#261b34';
      ctx.beginPath();
      ctx.moveTo(22, 6);
      ctx.lineTo(38, 30);
      ctx.lineTo(32, 78);
      ctx.lineTo(22, 78);
      ctx.closePath();
      ctx.fill();

      // Runic Core
      ctx.fillStyle = '#9d4edd';
      ctx.fillRect(20, 28, 4, 30);
      ctx.fillRect(16, 40, 12, 3);

      this.textures.addCanvas('obsidian-monolith', oCanvas);
    }

    // 9. 2.5D Torii Shinto Shrine Gate (104x92)
    if (!this.textures.exists('shrine-torii')) {
      const tCanvas = document.createElement('canvas');
      tCanvas.width = 104;
      tCanvas.height = 92;
      const ctx = tCanvas.getContext('2d')!;

      // Cast ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(52, 86, 44, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Raised stone dais (steps)
      ctx.fillStyle = '#2c2c2c';
      ctx.fillRect(12, 80, 80, 8);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(18, 76, 68, 4);

      // Main vertical pillars with bevel
      ctx.fillStyle = '#9e2a2b';
      ctx.fillRect(24, 20, 12, 60);
      ctx.fillRect(68, 20, 12, 60);

      // Pillar base plinths
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(21, 74, 18, 6);
      ctx.fillRect(65, 74, 18, 6);

      // Second horizontal beam (Nuki)
      ctx.fillStyle = '#801a1c';
      ctx.fillRect(14, 26, 76, 7);

      // Top curved lintel (Kasagi) with arched tips
      ctx.fillStyle = '#141414';
      ctx.beginPath();
      ctx.moveTo(4, 14);
      ctx.quadraticCurveTo(52, 5, 100, 14);
      ctx.lineTo(98, 22);
      ctx.quadraticCurveTo(52, 14, 6, 22);
      ctx.closePath();
      ctx.fill();

      // Vermilion ornamental sacred rope (Shimenawa)
      ctx.strokeStyle = '#e0a96d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(28, 31);
      ctx.quadraticCurveTo(52, 42, 76, 31);
      ctx.stroke();

      this.textures.addCanvas('shrine-torii', tCanvas);
    }

    // 10. Warden Silhouette NPC Figure (40x56)
    if (!this.textures.exists('warden-figure')) {
      const wCanvas = document.createElement('canvas');
      wCanvas.width = 40;
      wCanvas.height = 56;
      const ctx = wCanvas.getContext('2d')!;

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(20, 52, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Monk hood / crest
      ctx.fillStyle = '#151515';
      ctx.beginPath();
      ctx.arc(20, 14, 10, 0, Math.PI * 2);
      ctx.fill();

      // Robes
      ctx.beginPath();
      ctx.moveTo(10, 18);
      ctx.lineTo(30, 18);
      ctx.lineTo(36, 50);
      ctx.lineTo(4, 50);
      ctx.closePath();
      ctx.fill();

      // Crossed meditation arms
      ctx.fillStyle = '#262626';
      ctx.fillRect(12, 24, 16, 6);

      // Glowing spectral eyes
      ctx.fillStyle = '#f4ebd0';
      ctx.fillRect(17, 13, 6, 2);

      this.textures.addCanvas('warden-figure', wCanvas);
    }

    // 11. 2.5D Carved Stone Lantern (28x40)
    if (!this.textures.exists('stone-lantern')) {
      const lCanvas = document.createElement('canvas');
      lCanvas.width = 28;
      lCanvas.height = 40;
      const ctx = lCanvas.getContext('2d')!;

      // Ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(14, 37, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pedestal base
      ctx.fillStyle = '#2c2c2c';
      ctx.fillRect(6, 33, 16, 5);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(10, 21, 8, 12);

      // Light chamber with glowing lantern fire
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(7, 12, 14, 9);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(9, 13, 10, 7);

      // Pagoda roof cap
      ctx.fillStyle = '#262626';
      ctx.beginPath();
      ctx.moveTo(2, 12);
      ctx.lineTo(14, 5);
      ctx.lineTo(26, 12);
      ctx.closePath();
      ctx.fill();

      // Roof spire finial
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(13, 2, 2, 4);

      this.textures.addCanvas('stone-lantern', lCanvas);
    }

    // 12. 2.5D Mossy Boulder (36x28)
    if (!this.textures.exists('mossy-boulder')) {
      const bCanvas = document.createElement('canvas');
      bCanvas.width = 36;
      bCanvas.height = 28;
      const ctx = bCanvas.getContext('2d')!;

      // Ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(18, 24, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Granite rock
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath();
      ctx.ellipse(18, 16, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Highlight facet
      ctx.fillStyle = '#555555';
      ctx.beginPath();
      ctx.ellipse(15, 12, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Moss patch
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(12, 10, 8, 3);
      ctx.fillRect(14, 13, 4, 3);

      this.textures.addCanvas('mossy-boulder', bCanvas);
    }

    // 13. Pokemon-Style Tall Grass Tuft (24x20)
    if (!this.textures.exists('tall-grass')) {
      const gCanvas = document.createElement('canvas');
      gCanvas.width = 24;
      gCanvas.height = 20;
      const ctx = gCanvas.getContext('2d')!;

      ctx.fillStyle = '#2d6a4f';
      const blades = [
        { x: 4, h: 14 },
        { x: 8, h: 18 },
        { x: 12, h: 16 },
        { x: 16, h: 19 },
        { x: 20, h: 13 },
      ];
      blades.forEach((b) => {
        ctx.beginPath();
        ctx.moveTo(b.x - 2, 20);
        ctx.lineTo(b.x, 20 - b.h);
        ctx.lineTo(b.x + 2, 20);
        ctx.fill();
      });

      // Highlight blades
      ctx.fillStyle = '#52b788';
      ctx.fillRect(8, 6, 2, 10);
      ctx.fillRect(16, 5, 2, 11);

      this.textures.addCanvas('tall-grass', gCanvas);
    }

    // 14. Wildflower Patch (26x18)
    if (!this.textures.exists('flower-patch')) {
      const flCanvas = document.createElement('canvas');
      flCanvas.width = 26;
      flCanvas.height = 18;
      const ctx = flCanvas.getContext('2d')!;

      // Stems
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(4, 8, 2, 10);
      ctx.fillRect(12, 6, 2, 12);
      ctx.fillRect(20, 9, 2, 9);

      // Petals
      const colors = ['#e63946', '#ffd166', '#a8dadc'];
      [4, 12, 20].forEach((x, i) => {
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(x + 1, 6 + (i % 2) * 2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, 5 + (i % 2) * 2, 2, 2);
      });

      this.textures.addCanvas('flower-patch', flCanvas);
    }

    // 15. Ink Footprint (14x8)
    if (!this.textures.exists('footprint-ink')) {
      const fCanvas = document.createElement('canvas');
      fCanvas.width = 14;
      fCanvas.height = 8;
      const ctx = fCanvas.getContext('2d')!;
      ctx.fillStyle = 'rgba(20, 20, 20, 0.35)';
      ctx.beginPath();
      ctx.ellipse(7, 4, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      this.textures.addCanvas('footprint-ink', fCanvas);
    }
  }

  private generate2DTreeTexture(
    key: string,
    trunkColor: string,
    darkColor: string,
    midColor: string,
    lightColor: string
  ) {
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 64;
    bCanvas.height = 84;
    const ctx = bCanvas.getContext('2d')!;

    // Ground Drop Shadow (Soft dark ellipse)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(32, 78, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wood Trunk
    ctx.fillStyle = trunkColor;
    ctx.fillRect(26, 44, 12, 34);

    // Deep Canopy Underside Shadow
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.arc(32, 42, 26, 0, Math.PI * 2);
    ctx.fill();

    // Mid-tone Voluminous Foliage Clumps
    ctx.fillStyle = midColor;
    ctx.beginPath();
    ctx.arc(22, 34, 18, 0, Math.PI * 2);
    ctx.arc(42, 34, 18, 0, Math.PI * 2);
    ctx.arc(32, 26, 19, 0, Math.PI * 2);
    ctx.fill();

    // Sunlit Top Highlight Clumps (2.5D top lighting)
    ctx.fillStyle = lightColor;
    ctx.beginPath();
    ctx.arc(26, 20, 12, 0, Math.PI * 2);
    ctx.arc(38, 20, 11, 0, Math.PI * 2);
    ctx.arc(32, 14, 9, 0, Math.PI * 2);
    ctx.fill();

    this.textures.addCanvas(key, bCanvas);
  }

  // ==========================================
  // CONTINENTAL TERRAIN & 2.5D TILED WORLD
  // ==========================================

  private buildContinentalTerrain(width: number, height: number) {
    const terrain = this.add.graphics();
    terrain.setDepth(0);

    // 1. Aged Parchment Base Layer (Expansive Continental Map)
    terrain.fillStyle(0xf4ebd0, 1);
    terrain.fillRect(0, 0, width, height);

    // 2. Regional Biome Tints & 2.5D Elevation Plateaus
    // North: The Frozen Reach (Snowy Glacier)
    terrain.fillStyle(0xd6eef8, 0.85);
    terrain.fillRect(300, 0, 2600, 600);

    // Northwest: The Drowned Isles (Dark Sea Coastal Shelf)
    terrain.fillStyle(0x1d3557, 0.28);
    terrain.fillRect(100, 600, 900, 700);

    // Center: The River Crossings (Verdant Trident Basin)
    terrain.fillStyle(0x74a87a, 0.25);
    terrain.fillRect(1000, 600, 1200, 700);

    // Northeast: The High Vale (Misty Mountain Plateau)
    terrain.fillStyle(0x90e0ef, 0.25);
    terrain.fillRect(2200, 600, 900, 700);

    // Southwest: The Gilded Vault (Molten Gold Terrace)
    terrain.fillStyle(0xe0a96d, 0.28);
    terrain.fillRect(100, 1300, 1000, 600);

    // Central South: The Scorched Dunes (Vermilion Red Waste)
    terrain.fillStyle(0xe5989b, 0.38);
    terrain.fillRect(1100, 1300, 1000, 600);

    // Southeast: The Verdant Reach (Blossom Garden Orchards)
    terrain.fillStyle(0x2d6a4f, 0.22);
    terrain.fillRect(2100, 1300, 1000, 600);

    // Deep South: The Obsidian Citadel (Dark Glass Apex)
    terrain.fillStyle(0x1e1526, 0.85);
    terrain.fillRect(800, 1900, 1600, 500);

    // 3. Subtle Pokemon/Nexomon Tile Grid Lines (48x48 tile grid)
    terrain.lineStyle(1, 0x141414, 0.05);
    const tileSize = 48;
    for (let x = 0; x <= width; x += tileSize) {
      terrain.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += tileSize) {
      terrain.lineBetween(0, y, width, y);
    }

    // 4. 2.5D Elevation Cliffs & Ledges (Upper Plateaus with Drop Shadows)
    this.drawElevationCliffs(terrain);

    // 5. The Great Continental Waterways (The Trident River & Ocean Straits)
    this.drawWaterways(terrain);

    // 6. 2.5D Cobblestone Roads & Paved Highways
    this.drawCobblestoneHighways(terrain);

    // 7. Scenery Decorations with 2.5D Depth Sorting
    this.spawnSceneryDecorations(width, height);
  }

  private drawElevationCliffs(terrain: Phaser.GameObjects.Graphics) {
    // 2.5D Cliff Drawing: Top lip highlight + vertical rock face + bottom cast shadow
    const cliffs: { x1: number; y: number; x2: number; color: number }[] = [
      // The Great Wall of the North Cliff (Y: 590)
      { x1: 300, y: 590, x2: 1480, color: 0x4a6b82 },
      { x1: 1720, y: 590, x2: 2900, color: 0x4a6b82 },

      // High Vale Mountain Escarpment (Y: 1300)
      { x1: 2200, y: 1300, x2: 3050, color: 0x5a6065 },

      // Scorched Dunes Canyon Ledges (Y: 1300)
      { x1: 1100, y: 1300, x2: 1480, color: 0x8b4f3b },
      { x1: 1720, y: 1300, x2: 2100, color: 0x8b4f3b },

      // Obsidian Citadel Bastion Walls (Y: 1900)
      { x1: 800, y: 1900, x2: 1480, color: 0x22172c },
      { x1: 1720, y: 1900, x2: 2400, color: 0x22172c },
    ];

    cliffs.forEach((c) => {
      // 1. Bottom cast shadow onto lower level
      terrain.fillStyle(0x000000, 0.3);
      terrain.fillRect(c.x1, c.y + 18, c.x2 - c.x1, 10);

      // 2. Vertical rock face
      terrain.fillStyle(c.color, 1);
      terrain.fillRect(c.x1, c.y, c.x2 - c.x1, 18);

      // Rock strata lines
      terrain.lineStyle(2, 0x141414, 0.4);
      terrain.lineBetween(c.x1, c.y + 8, c.x2, c.y + 8);

      // 3. Top lip highlight
      terrain.fillStyle(0xffffff, 0.35);
      terrain.fillRect(c.x1, c.y - 3, c.x2 - c.x1, 3);
    });
  }

  private drawWaterways(terrain: Phaser.GameObjects.Graphics) {
    // Deep Waterbody Fill
    terrain.fillStyle(0x132a40, 0.95);

    // Northern Glacial Chasm
    terrain.fillRect(300, 570, 2600, 40);

    // Main Trident River (flowing vertically through center X: 1540 to 1660)
    terrain.fillRect(1540, 600, 120, 700);

    // Western Fork towards Drowned Isles (Y: 900 to 980)
    terrain.fillRect(100, 900, 1440, 80);

    // Eastern Fork towards High Vale Gorge (Y: 900 to 980)
    terrain.fillRect(1660, 900, 1440, 80);

    // Shallow Shoreline Rim & Foam Trim (Turquoise 6px border)
    terrain.lineStyle(6, 0x38a3a5, 0.75);
    // Northern chasm banks
    terrain.lineBetween(300, 568, 2900, 568);
    terrain.lineBetween(300, 612, 2900, 612);

    // Main river banks
    terrain.lineBetween(1538, 600, 1538, 900);
    terrain.lineBetween(1662, 600, 1662, 900);
    terrain.lineBetween(1538, 980, 1538, 1300);
    terrain.lineBetween(1662, 980, 1662, 1300);

    // Estuary banks
    terrain.lineBetween(100, 898, 1540, 898);
    terrain.lineBetween(100, 982, 1540, 982);
    terrain.lineBetween(1660, 898, 3100, 898);
    terrain.lineBetween(1660, 982, 3100, 982);

    // 2.5D Wooden Bridges across waterways
    this.drawWoodenBridge(terrain, 1540, 720, 120, 50, false);
    this.drawWoodenBridge(terrain, 1540, 1140, 120, 50, false);
    this.drawWoodenBridge(terrain, 1260, 900, 50, 80, true);
    this.drawWoodenBridge(terrain, 1920, 900, 50, 80, true);
  }

  private drawWoodenBridge(
    terrain: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    vertical: boolean
  ) {
    // Bridge shadow on water
    terrain.fillStyle(0x000000, 0.4);
    terrain.fillRect(x + 4, y + 6, w, h);

    // Bridge deck
    terrain.fillStyle(0x6b4423, 1);
    terrain.fillRect(x, y, w, h);

    // Wood planks
    terrain.lineStyle(2, 0x4a2e16, 0.9);
    if (!vertical) {
      for (let px = x; px <= x + w; px += 14) {
        terrain.lineBetween(px, y, px, y + h);
      }
      // Top and bottom guide rails
      terrain.fillStyle(0x8a5a36, 1);
      terrain.fillRect(x, y - 4, w, 5);
      terrain.fillRect(x, y + h - 1, w, 5);
    } else {
      for (let py = y; py <= y + h; py += 14) {
        terrain.lineBetween(x, py, x + w, py);
      }
      // Left and right guide rails
      terrain.fillStyle(0x8a5a36, 1);
      terrain.fillRect(x - 4, y, 5, h);
      terrain.fillRect(x + w - 1, y, 5, h);
    }
  }

  private drawCobblestoneHighways(terrain: Phaser.GameObjects.Graphics) {
    // Road fill (Weathered paving stones)
    const roadColor = 0x2b2b2b;
    const roadWidth = 56;

    // 1. Grand North-South Highway (Frozen Reach to Obsidian Citadel)
    terrain.fillStyle(roadColor, 0.75);
    terrain.fillRect(1600 - roadWidth / 2, 280, roadWidth, 1900);

    // Cobblestone border curbing
    terrain.lineStyle(3, 0x141414, 0.85);
    terrain.lineBetween(1600 - roadWidth / 2, 280, 1600 - roadWidth / 2, 2180);
    terrain.lineBetween(1600 + roadWidth / 2, 280, 1600 + roadWidth / 2, 2180);

    // 2. Middle East-West Highway (Drowned Isles -> River Crossings -> High Vale)
    terrain.fillRect(550, 920 - roadWidth / 2, 2100, roadWidth);
    terrain.lineBetween(550, 920 - roadWidth / 2, 2650, 920 - roadWidth / 2);
    terrain.lineBetween(550, 920 + roadWidth / 2, 2650, 920 + roadWidth / 2);

    // 3. Southern East-West Highway (Gilded Vault -> Scorched Dunes -> Verdant Reach)
    terrain.fillRect(600, 1600 - roadWidth / 2, 2000, roadWidth);
    terrain.lineBetween(600, 1600 - roadWidth / 2, 2600, 1600 - roadWidth / 2);
    terrain.lineBetween(600, 1600 + roadWidth / 2, 2600, 1600 + roadWidth / 2);
  }

  // ==========================================
  // 2.5D SCENERY & VEGETATION WITH Y-SORTING
  // ==========================================

  private spawnSceneryDecorations(width: number, height: number) {
    // 1. Perimeter Boundary Forest (Enclosing the continent like classic Pokemon)
    // Top border forest (Frozen Reach snow pines)
    for (let x = 80; x < width - 80; x += 70) {
      this.place2DScenery(x + Phaser.Math.Between(-10, 10), 80 + Phaser.Math.Between(-15, 15), 'tree-snow');
    }
    // Left border forest
    for (let y = 140; y < height - 100; y += 85) {
      const type = y < 600 ? 'tree-snow' : y < 1300 ? 'tree-palm' : 'tree-golden';
      this.place2DScenery(80 + Phaser.Math.Between(-15, 15), y, type);
    }
    // Right border forest
    for (let y = 140; y < height - 100; y += 85) {
      const type = y < 600 ? 'tree-snow' : y < 1300 ? 'tree-temperate' : 'tree-sakura';
      this.place2DScenery(width - 80 + Phaser.Math.Between(-15, 15), y, type);
    }
    // Bottom border (Obsidian Citadel monolith spires)
    for (let x = 700; x < 2500; x += 90) {
      this.place2DScenery(x, height - 80, 'obsidian-monolith');
    }

    // 2. Regional Foliage Groves & Landmarks
    // River Crossings Groves (Temperate leafy trees along roads)
    const riverGroveCoords = [
      { x: 1450, y: 780 }, { x: 1420, y: 840 }, { x: 1440, y: 1040 },
      { x: 1760, y: 780 }, { x: 1790, y: 840 }, { x: 1750, y: 1040 },
      { x: 1360, y: 720 }, { x: 1840, y: 720 }, { x: 1360, y: 1120 },
      { x: 1840, y: 1120 }, { x: 1500, y: 920 }, { x: 1700, y: 920 },
    ];
    riverGroveCoords.forEach((p) => this.place2DScenery(p.x, p.y, 'tree-temperate'));

    // Verdant Reach Sakura Groves
    const sakuraCoords = [
      { x: 2350, y: 1450 }, { x: 2420, y: 1410 }, { x: 2500, y: 1460 },
      { x: 2700, y: 1430 }, { x: 2780, y: 1480 }, { x: 2450, y: 1680 },
      { x: 2520, y: 1730 }, { x: 2680, y: 1700 }, { x: 2750, y: 1740 },
    ];
    sakuraCoords.forEach((p) => this.place2DScenery(p.x, p.y, 'tree-sakura'));

    // Frozen Reach Snow Firs
    const snowFirCoords = [
      { x: 1380, y: 240 }, { x: 1440, y: 200 }, { x: 1500, y: 250 },
      { x: 1700, y: 220 }, { x: 1760, y: 260 }, { x: 1820, y: 210 },
      { x: 1200, y: 320 }, { x: 2000, y: 320 },
    ];
    snowFirCoords.forEach((p) => this.place2DScenery(p.x, p.y, 'tree-snow'));

    // Gilded Vault Golden Arbors
    const goldenArborCoords = [
      { x: 450, y: 1480 }, { x: 520, y: 1440 }, { x: 680, y: 1450 },
      { x: 740, y: 1490 }, { x: 480, y: 1700 }, { x: 720, y: 1710 },
    ];
    goldenArborCoords.forEach((p) => this.place2DScenery(p.x, p.y, 'tree-golden'));

    // Scorched Dunes Cacti & Palms
    const oasisCoords = [
      { x: 1420, y: 1520 }, { x: 1780, y: 1520 },
      { x: 1440, y: 1680 }, { x: 1760, y: 1680 },
    ];
    oasisCoords.forEach((p) => this.place2DScenery(p.x, p.y, 'tree-palm'));

    // 3. 2.5D Stone Lanterns along Main Crossroads & Shrine Approaches
    const lanternCoords = [
      // River Crossings Hub
      { x: 1560, y: 880 }, { x: 1640, y: 880 },
      { x: 1560, y: 960 }, { x: 1640, y: 960 },
      // Frozen Reach Approach
      { x: 1560, y: 360 }, { x: 1640, y: 360 },
      // Drowned Isles Approach
      { x: 620, y: 920 }, { x: 480, y: 920 },
      // High Vale Approach
      { x: 2580, y: 920 }, { x: 2720, y: 920 },
      // Gilded Vault Approach
      { x: 600, y: 1520 }, { x: 600, y: 1680 },
      // Scorched Dunes Approach
      { x: 1560, y: 1520 }, { x: 1640, y: 1520 },
      // Verdant Reach Approach
      { x: 2540, y: 1540 }, { x: 2660, y: 1540 },
      // Citadel Avenue
      { x: 1560, y: 2060 }, { x: 1640, y: 2060 },
    ];
    lanternCoords.forEach((p) => this.place2DScenery(p.x, p.y, 'stone-lantern'));

    // 4. Pokemon-style Tall Grass & Flower Clusters
    const meadowDetails = [
      { x: 1350, y: 820, key: 'tall-grass' },
      { x: 1370, y: 830, key: 'tall-grass' },
      { x: 1830, y: 820, key: 'tall-grass' },
      { x: 1850, y: 830, key: 'tall-grass' },
      { x: 1380, y: 1080, key: 'flower-patch' },
      { x: 1820, y: 1080, key: 'flower-patch' },
      { x: 2420, y: 1520, key: 'flower-patch' },
      { x: 2580, y: 1620, key: 'flower-patch' },
      { x: 1460, y: 1480, key: 'mossy-boulder' },
      { x: 1740, y: 1480, key: 'mossy-boulder' },
    ];
    meadowDetails.forEach((d) => this.place2DScenery(d.x, d.y, d.key));

    // 5. Continental Realm Labels on Ground (Subtle elegant serif calligraphy)
    Object.values(CONTINENTAL_REGIONS).forEach((region) => {
      this.add
        .text(region.wardenShrine.x, region.wardenShrine.y - 82, region.name.toUpperCase(), {
          fontFamily: "'Cinzel', serif",
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#1a1a1a',
          letterSpacing: 3,
        })
        .setOrigin(0.5)
        .setAlpha(0.65)
        .setDepth(2);
    });
  }

  private place2DScenery(x: number, y: number, key: string) {
    const sprite = this.add.image(x, y, key);
    // Origin at base (feet of object) so Y-sorting matches ground contact
    sprite.setOrigin(0.5, 0.88);
    sprite.setDepth(y);
  }

  // ==========================================
  // WARDEN SHRINES & INTERACTABLE TORII GATES
  // ==========================================

  private buildWardenShrines() {
    Object.values(CONTINENTAL_REGIONS).forEach((reg: RegionZone) => {
      const { x, y } = reg.wardenShrine;

      // 1. Glowing Sacred Rune Aura on ground
      const hexColor = Phaser.Display.Color.HexStringToColor(
        this.getPigmentHex(reg.pigment)
      ).color;

      const glowCircle = this.add
        .circle(x, y + 14, 52, hexColor, 0.28)
        .setDepth(3);

      // 2. 2.5D Torii Shrine Gate
      const shrineSprite = this.add.sprite(x, y - 8, 'shrine-torii');
      shrineSprite.setOrigin(0.5, 0.88);
      shrineSprite.setDepth(y);

      // 3. Warden Figure NPC
      const wardenSprite = this.add.sprite(x, y + 12, 'warden-figure');
      wardenSprite.setOrigin(0.5, 0.88);
      wardenSprite.setDepth(y + 2);

      // Gentle floating / breathing idle animation for Warden
      this.tweens.add({
        targets: wardenSprite,
        y: y + 9,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // 4. Floating English Rune Banner Overhead (ICE, SEA, SKY, etc.)
      const runeWord = this.getPigmentRune(reg.pigment);
      const runeText = this.add
        .text(x, y - 68, runeWord, {
          fontFamily: "'Cinzel', serif",
          fontSize: '20px',
          fontStyle: 'bold',
          color: this.getPigmentHex(reg.pigment),
          stroke: '#141414',
          strokeThickness: 4,
          backgroundColor: '#141414aa',
          padding: { x: 8, y: 3 },
        })
        .setOrigin(0.5)
        .setDepth(y + 20);

      // Floating bob animation on Rune Banner
      this.tweens.add({
        targets: runeText,
        y: y - 75,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.shrines.push({
        regionId: reg.id,
        x,
        y,
        shrineSprite,
        wardenSprite,
        runeText,
        glowCircle,
      });
    });
  }

  // ==========================================
  // METROIDVANIA COLOR-GATE BARRIERS
  // ==========================================

  private buildColorGates() {
    COLOR_GATES.forEach((gate) => {
      const centerX = gate.x + gate.width / 2;
      const centerY = gate.y + gate.height / 2;

      const container = this.add.container(centerX, centerY);
      container.setDepth(centerY);

      const glowGraphic = this.add.graphics();
      container.add(glowGraphic);

      const hex = this.getPigmentHex(gate.requiredPigment);
      const colorNum = Phaser.Display.Color.HexStringToColor(hex).color;

      // Label showing gate name
      const label = this.add
        .text(0, -gate.height / 2 - 16, gate.name, {
          fontFamily: "'Cinzel', serif",
          fontSize: '12px',
          fontStyle: 'bold',
          color: hex,
          backgroundColor: '#141414ee',
          padding: { x: 8, y: 3 },
        })
        .setOrigin(0.5);
      container.add(label);

      // Create static arcade collider body
      const colliderBody = this.barrierGroup.create(
        centerX,
        centerY,
        undefined
      ) as Phaser.Physics.Arcade.Image;

      colliderBody.setVisible(false);
      colliderBody.setSize(gate.width, gate.height);
      colliderBody.setData('gateData', gate);
      (colliderBody.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

      const isUnlocked = this.unlockedPigments.has(gate.requiredPigment);

      this.barriers.push({
        gateData: gate,
        container,
        colliderBody,
        glowGraphic,
        label,
        isUnlocked,
      });

      this.renderBarrierVisual(
        glowGraphic,
        gate.width,
        gate.height,
        colorNum,
        isUnlocked
      );

      // Disable collision if already unlocked
      if (isUnlocked && colliderBody.body) {
        colliderBody.body.enable = false;
      }
    });
  }

  private renderBarrierVisual(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    colorNum: number,
    isUnlocked: boolean
  ) {
    g.clear();
    const halfW = width / 2;
    const halfH = height / 2;

    if (isUnlocked) {
      // Unlocked: Shimmering translucent crystal bridge
      g.fillStyle(colorNum, 0.45);
      g.fillRect(-halfW, -halfH, width, height);

      g.lineStyle(3, colorNum, 0.9);
      g.strokeRect(-halfW, -halfH, width, height);

      // Crossing dashed centerline
      g.lineStyle(2, 0xffffff, 0.8);
      if (width > height) {
        g.lineBetween(-halfW + 8, 0, halfW - 8, 0);
      } else {
        g.lineBetween(0, -halfH + 8, 0, halfH - 8);
      }
    } else {
      // Locked: Heavy impassable seal with hazardous cross-hatching
      g.fillStyle(0x1a1a1a, 0.95);
      g.fillRect(-halfW, -halfH, width, height);

      g.lineStyle(4, colorNum, 0.95);
      g.strokeRect(-halfW, -halfH, width, height);

      // Hazardous diagonal warning lines
      g.lineStyle(2.5, colorNum, 0.7);
      const step = 16;
      if (width >= height) {
        for (let lx = -halfW; lx < halfW; lx += step) {
          g.lineBetween(lx, -halfH, lx + step, halfH);
        }
      } else {
        for (let ly = -halfH; ly < halfH; ly += step) {
          g.lineBetween(-halfW, ly, halfW, ly + step);
        }
      }
    }
  }

  private refreshBarriersState() {
    this.barriers.forEach((b) => {
      const unlockedNow = this.unlockedPigments.has(b.gateData.requiredPigment);
      b.isUnlocked = unlockedNow;

      const hex = this.getPigmentHex(b.gateData.requiredPigment);
      const colorNum = Phaser.Display.Color.HexStringToColor(hex).color;

      this.renderBarrierVisual(
        b.glowGraphic,
        b.gateData.width,
        b.gateData.height,
        colorNum,
        unlockedNow
      );

      if (b.colliderBody.body) {
        b.colliderBody.body.enable = !unlockedNow;
      }
    });
  }

  // ==========================================
  // BARRIER COLLISION WITH 2000ms COOLDOWN
  // ==========================================

  private handlePlayerBarrierCollision(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    barrierObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const now = this.time.now;
    // 2000ms cooldown to prevent 60Hz audio clash and React dispatch flood
    if (now - this.lastBarrierEncounterTime < 2000) {
      return;
    }
    this.lastBarrierEncounterTime = now;

    const gateData = barrierObj.getData('gateData') as ColorGateTrigger;
    if (gateData) {
      this.callbacks.onBarrierEncounter(
        gateData.name,
        gateData.requiredPigment,
        false
      );
    }
  }

  // ==========================================
  // PLAYER SETUP & 2.5D MOVEMENT
  // ==========================================

  private createPlayer() {
    // 1. Soft Oval Drop Shadow underneath feet
    this.playerShadow = this.add.image(this.initialCoords.x, this.initialCoords.y + 20, 'drop-shadow');
    this.playerShadow.setOrigin(0.5, 0.5);

    // 2. Wanderer Ronin Physics Sprite
    this.player = this.physics.add.sprite(
      this.initialCoords.x,
      this.initialCoords.y,
      'wanderer-silhouette'
    );

    this.player.setCollideWorldBounds(true);
    // Tight hitbox focused on feet
    this.player.setSize(22, 18);
    this.player.setOffset(7, 30);
  }

  private handlePlayerMovement(time: number) {
    const speed = 220;
    let vx = 0;
    let vy = 0;

    // Keyboard controls (WASD & Arrow keys)
    if (this.cursors) {
      if (this.cursors.left.isDown || (this.keyA && this.keyA.isDown)) vx -= 1;
      if (this.cursors.right.isDown || (this.keyD && this.keyD.isDown)) vx += 1;
      if (this.cursors.up.isDown || (this.keyW && this.keyW.isDown)) vy -= 1;
      if (this.cursors.down.isDown || (this.keyS && this.keyS.isDown)) vy += 1;
    }

    // Virtual Touch Joystick input
    if (this.virtualInputVector.x !== 0 || this.virtualInputVector.y !== 0) {
      vx = this.virtualInputVector.x;
      vy = this.virtualInputVector.y;
    }

    // Normalize diagonal movement speed
    if (vx !== 0 && vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      vx /= len;
      vy /= len;
    }

    this.player.setVelocity(vx * speed, vy * speed);

    // Track facing direction and spawn subtle footsteps
    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.playerFacing = vx > 0 ? 'right' : 'left';
        this.player.setFlipX(vx < 0);
      } else {
        this.playerFacing = vy > 0 ? 'down' : 'up';
      }

      // Footstep ink blot every 190ms
      if (time - this.lastFootstepTime > 190) {
        this.lastFootstepTime = time;
        this.spawnInkFootprint(this.player.x, this.player.y + 20);
      }
    }
  }

  private spawnInkFootprint(x: number, y: number) {
    const footstep = this.add.image(x, y, 'footprint-ink').setDepth(1);
    this.tweens.add({
      targets: footstep,
      alpha: 0,
      scaleX: 0.6,
      scaleY: 0.6,
      duration: 1400,
      onComplete: () => {
        footstep.destroy();
      },
    });
  }

  // ==========================================
  // WATER RIPPLES ANIMATION
  // ==========================================
  private updateWaterRipples(_time: number) {
    // Water visual waves pulse gently
  }

  // ==========================================
  // PROXIMITY SENSING & INTERACTION PROMPT
  // ==========================================

  private createPromptBubble() {
    this.promptContainer = this.add.container(0, 0);
    this.promptContainer.setDepth(3500);
    this.promptContainer.setVisible(false);

    // Rounded parchment prompt bubble
    const bg = this.add.graphics();
    bg.fillStyle(0x141414, 0.95);
    bg.fillRoundedRect(-80, -20, 160, 40, 20);
    bg.lineStyle(2, 0xe0a96d, 0.95);
    bg.strokeRoundedRect(-80, -20, 160, 40, 20);
    this.promptContainer.add(bg);

    this.promptText = this.add
      .text(0, 0, '⚔️ Press [E / Enter] / Tap', {
        fontFamily: "'Cinzel', serif",
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#f4ebd0',
      })
      .setOrigin(0.5);
    this.promptContainer.add(this.promptText);

    // Floating bob animation
    this.tweens.add({
      targets: this.promptContainer,
      y: '+=5',
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private checkProximityToShrines() {
    let closestShrine: ShrineEntity | null = null;
    let minDist = 85; // Proximity radius

    for (const shrine of this.shrines) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        shrine.x,
        shrine.y
      );
      if (dist < minDist) {
        minDist = dist;
        closestShrine = shrine;
      }
    }

    if (closestShrine) {
      this.activeNearbyShrine = closestShrine;
      this.promptContainer.setPosition(closestShrine.x, closestShrine.y - 85);
      this.promptContainer.setVisible(true);
    } else {
      this.activeNearbyShrine = null;
      this.promptContainer.setVisible(false);
    }
  }

  // ==========================================
  // AMBIENT WEATHER PARTICLES
  // ==========================================

  private initAmbientParticles(width: number, height: number) {
    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      const p = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(2, 4),
        0xf4ebd0,
        Phaser.Math.FloatBetween(0.2, 0.5)
      );
      p.setDepth(2500);
      p.setData('vx', Phaser.Math.FloatBetween(-0.5, 0.5));
      p.setData('vy', Phaser.Math.FloatBetween(0.4, 1.2));
      this.ambientParticles.push(p);
    }
  }

  private updateAmbientParticles() {
    const width = 3200;
    const height = 2400;
    for (const p of this.ambientParticles) {
      let x = p.x + (p.getData('vx') as number);
      let y = p.y + (p.getData('vy') as number);

      if (y > height) y = 0;
      if (x < 0) x = width;
      if (x > width) x = 0;

      p.setPosition(x, y);
    }
  }

  // ==========================================
  // HELPER METADATA LOOKUPS
  // ==========================================

  private getPigmentHex(pigment: Pigment): string {
    const map: Record<Pigment, string> = {
      'frost-cyan': '#48cae4',
      'abyssal-navy': '#1d3557',
      'sky-cerulean': '#90e0ef',
      'molten-gold': '#e0a96d',
      'emerald-jade': '#2d6a4f',
      'rushing-teal': '#0077b6',
      'blood-vermilion': '#b3312c',
      'full-spectrum': '#7209b7',
    };
    return map[pigment] || '#f4ebd0';
  }

  private getPigmentRune(pigment: Pigment): string {
    const map: Record<Pigment, string> = {
      'frost-cyan': 'ICE',
      'abyssal-navy': 'SEA',
      'sky-cerulean': 'SKY',
      'molten-gold': 'GOLD',
      'emerald-jade': 'JADE',
      'rushing-teal': 'RIVER',
      'blood-vermilion': 'FIRE',
      'full-spectrum': 'APEX',
    };
    return map[pigment] || 'SEAL';
  }
}
