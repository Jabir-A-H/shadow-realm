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
  kanjiText: Phaser.GameObjects.Text;
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
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  // Shrines & Barriers
  private shrines: ShrineEntity[] = [];
  private barriers: BarrierEntity[] = [];
  private barrierGroup!: Phaser.Physics.Arcade.StaticGroup;

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
    // 1. World physics and dimensions (1400 wide x 1800 high)
    this.physics.world.setBounds(0, 0, 1400, 1800);

    // 2. Draw Continental Map Graphics & Roads
    this.buildContinentalTerrain();

    // 3. Create Barrier Static Group
    this.barrierGroup = this.physics.add.staticGroup();
    this.buildColorGates();

    // 4. Build 7 Kingdom Warden Shrines & Torii Gates
    this.buildWardenShrines();

    // 5. Create Player (The Shadow Wanderer)
    this.createPlayer();

    // 6. Setup Colliders
    this.physics.add.collider(
      this.player,
      this.barrierGroup,
      this.handlePlayerBarrierCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // 7. Setup Camera Follow
    this.cameras.main.setBounds(0, 0, 1400, 1800);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.1);

    // 8. Keyboard Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // 9. Interaction Prompt Bubble
    this.createPromptBubble();

    // 10. Ambient Weather Particles
    this.initAmbientParticles();

    // Initial region notification
    const initialRegion = getRegionAt(this.player.x, this.player.y);
    this.currentRegionId = initialRegion.id;
    this.callbacks.onRegionChange(initialRegion.id, initialRegion.name);
  }

  update(time: number) {
    this.handlePlayerMovement(time);
    this.checkProximityToShrines();
    this.updateAmbientParticles();

    // Periodic region boundary check
    if (time - this.lastRegionCheckTime > 400) {
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
      });
    }

    // Check interaction key press
    if (
      Phaser.Input.Keyboard.JustDown(this.keyE) ||
      Phaser.Input.Keyboard.JustDown(this.keySpace)
    ) {
      this.triggerActionInteract();
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
  // PROCEDURAL TEXTURE GENERATION
  // ==========================================

  private generateProceduralTextures() {
    // 1. Player Ronin Silhouette Sprite (32x44)
    if (!this.textures.exists('wanderer-silhouette')) {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 32;
      pCanvas.height = 44;
      const ctx = pCanvas.getContext('2d')!;

      // Conical Kasa Hat
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.ellipse(16, 12, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(8, 12);
      ctx.lineTo(16, 4);
      ctx.lineTo(24, 12);
      ctx.closePath();
      ctx.fill();

      // Scarf / Cloak
      ctx.fillStyle = '#1c1c1c';
      ctx.beginPath();
      ctx.moveTo(11, 14);
      ctx.lineTo(21, 14);
      ctx.lineTo(24, 34);
      ctx.lineTo(8, 34);
      ctx.closePath();
      ctx.fill();

      // Fluttering sash / ribbon (red accent)
      ctx.strokeStyle = '#b3312c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(16, 20);
      ctx.quadraticCurveTo(24, 24, 28, 32);
      ctx.stroke();

      // Sheathed Katana at Hip
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, 26);
      ctx.lineTo(2, 38);
      ctx.stroke();

      // Legs / Hakama
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(10, 34, 4, 8);
      ctx.fillRect(18, 34, 4, 8);

      this.textures.addCanvas('wanderer-silhouette', pCanvas);
    }

    // 2. Torii Shinto Shrine Gate (96x84)
    if (!this.textures.exists('shrine-torii')) {
      const tCanvas = document.createElement('canvas');
      tCanvas.width = 96;
      tCanvas.height = 84;
      const ctx = tCanvas.getContext('2d')!;

      // Top lintel (Kasagi) with curved tips
      ctx.fillStyle = '#181818';
      ctx.beginPath();
      ctx.moveTo(4, 14);
      ctx.quadraticCurveTo(48, 6, 92, 14);
      ctx.lineTo(92, 22);
      ctx.quadraticCurveTo(48, 14, 4, 22);
      ctx.closePath();
      ctx.fill();

      // Second horizontal beam (Nuki)
      ctx.fillRect(12, 26, 72, 6);

      // Main vertical pillars
      ctx.fillRect(22, 22, 10, 60);
      ctx.fillRect(64, 22, 10, 60);

      // Stone bases (Kamebara)
      ctx.fillStyle = '#2c2c2c';
      ctx.fillRect(18, 76, 18, 8);
      ctx.fillRect(60, 76, 18, 8);

      // Vermilion ornamental sacred rope (Shimenawa)
      ctx.strokeStyle = '#b3312c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(26, 30);
      ctx.quadraticCurveTo(48, 40, 70, 30);
      ctx.stroke();

      this.textures.addCanvas('shrine-torii', tCanvas);
    }

    // 3. Warden Silhouette NPC (40x56)
    if (!this.textures.exists('warden-figure')) {
      const wCanvas = document.createElement('canvas');
      wCanvas.width = 40;
      wCanvas.height = 56;
      const ctx = wCanvas.getContext('2d')!;

      // Monk hood / crest
      ctx.fillStyle = '#151515';
      ctx.beginPath();
      ctx.arc(20, 14, 10, 0, Math.PI * 2);
      ctx.fill();

      // Robes
      ctx.beginPath();
      ctx.moveTo(10, 18);
      ctx.lineTo(30, 18);
      ctx.lineTo(36, 52);
      ctx.lineTo(4, 52);
      ctx.closePath();
      ctx.fill();

      // Crossed meditation arms
      ctx.fillStyle = '#262626';
      ctx.fillRect(12, 24, 16, 6);

      // Glowing eye slit
      ctx.fillStyle = '#f4ebd0';
      ctx.fillRect(18, 13, 4, 2);

      this.textures.addCanvas('warden-figure', wCanvas);
    }

    // 4. Shinto Lantern (24x36)
    if (!this.textures.exists('stone-lantern')) {
      const lCanvas = document.createElement('canvas');
      lCanvas.width = 24;
      lCanvas.height = 36;
      const ctx = lCanvas.getContext('2d')!;

      ctx.fillStyle = '#222222';
      // Cap
      ctx.beginPath();
      ctx.moveTo(2, 10);
      ctx.lineTo(12, 4);
      ctx.lineTo(22, 10);
      ctx.closePath();
      ctx.fill();
      // Light chamber
      ctx.fillStyle = '#e0a96d';
      ctx.fillRect(7, 11, 10, 9);
      // Pillar
      ctx.fillStyle = '#282828';
      ctx.fillRect(9, 20, 6, 12);
      ctx.fillRect(4, 32, 16, 4);

      this.textures.addCanvas('stone-lantern', lCanvas);
    }

    // 5. Bamboo / Cherry Tree (56x72)
    if (!this.textures.exists('cherry-bamboo')) {
      const bCanvas = document.createElement('canvas');
      bCanvas.width = 56;
      bCanvas.height = 72;
      const ctx = bCanvas.getContext('2d')!;

      // Stems
      ctx.strokeStyle = '#1e1e1e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(20, 72);
      ctx.quadraticCurveTo(24, 36, 18, 12);
      ctx.moveTo(32, 72);
      ctx.quadraticCurveTo(30, 36, 36, 8);
      ctx.stroke();

      // Canopy foliage (Sumi-e ink brush blot)
      ctx.fillStyle = '#1c1c1c';
      ctx.beginPath();
      ctx.arc(22, 18, 16, 0, Math.PI * 2);
      ctx.arc(36, 14, 14, 0, Math.PI * 2);
      ctx.arc(28, 8, 12, 0, Math.PI * 2);
      ctx.fill();

      // Subtle blossom speckles
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(20, 14, 3, 3);
      ctx.fillRect(34, 18, 3, 3);
      ctx.fillRect(26, 8, 3, 3);

      this.textures.addCanvas('cherry-bamboo', bCanvas);
    }

    // 6. Ink Footprint (12x8)
    if (!this.textures.exists('footprint-ink')) {
      const fCanvas = document.createElement('canvas');
      fCanvas.width = 12;
      fCanvas.height = 8;
      const ctx = fCanvas.getContext('2d')!;
      ctx.fillStyle = 'rgba(20, 20, 20, 0.4)';
      ctx.beginPath();
      ctx.ellipse(6, 4, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      this.textures.addCanvas('footprint-ink', fCanvas);
    }
  }

  // ==========================================
  // CONTINENTAL TERRAIN & ROADS
  // ==========================================

  private buildContinentalTerrain() {
    const terrain = this.add.graphics();

    // 1. Aged Parchment Base Layer
    terrain.fillStyle(0xf4ebd0, 1);
    terrain.fillRect(0, 0, 1400, 1800);

    // 2. Regional Ink Wash Gradients & Regional Terrain Tints
    // The Frozen Reach (North): Icy Frost wash
    terrain.fillStyle(0xd6eef8, 0.6);
    terrain.fillRect(200, 0, 880, 310);

    // The Drowned Isles (Northwest Archipelago): Deep navy water
    terrain.fillStyle(0x1d3557, 0.25);
    terrain.fillRect(80, 310, 380, 320);

    // The High Vale (Northeast): Sky cerulean mountain wash
    terrain.fillStyle(0x90e0ef, 0.25);
    terrain.fillRect(840, 310, 420, 320);

    // The Gilded Vault (West): Molten gold wash
    terrain.fillStyle(0xe0a96d, 0.25);
    terrain.fillRect(80, 630, 440, 320);

    // The Verdant Reach (East): Emerald jade garden wash
    terrain.fillStyle(0x2d6a4f, 0.2);
    terrain.fillRect(520, 630, 620, 320);

    // The Scorched Dunes (South): Blood vermilion desert wash
    terrain.fillStyle(0xe5989b, 0.35);
    terrain.fillRect(180, 950, 940, 360);

    // The Obsidian Citadel (Deep South): Obsidian ink wash
    terrain.fillStyle(0x221a28, 0.7);
    terrain.fillRect(450, 1310, 420, 360);

    // 3. The Great Continental Waterways (The Trident & Oceans)
    terrain.fillStyle(0x142838, 0.85);
    // Northern Ice Chasm
    terrain.fillRect(200, 290, 880, 30);

    // Trident River Main Fork (Flowing through River Crossings)
    terrain.beginPath();
    terrain.moveTo(620, 320);
    terrain.lineTo(660, 320);
    terrain.lineTo(660, 640);
    terrain.lineTo(620, 640);
    terrain.closePath();
    terrain.fill();

    // Western River Fork towards Drowned Isles
    terrain.beginPath();
    terrain.moveTo(620, 480);
    terrain.lineTo(100, 480);
    terrain.lineTo(100, 520);
    terrain.lineTo(620, 520);
    terrain.closePath();
    terrain.fill();

    // Eastern River Fork towards High Vale Gorge
    terrain.beginPath();
    terrain.moveTo(660, 480);
    terrain.lineTo(1200, 480);
    terrain.lineTo(1200, 510);
    terrain.lineTo(660, 510);
    terrain.closePath();
    terrain.fill();

    // 4. Brushed Ink Roads connecting all 7 Kingdoms
    terrain.lineStyle(24, 0x242424, 0.75);
    // North-South Continental Highway
    terrain.beginPath();
    terrain.moveTo(640, 160);
    terrain.lineTo(640, 1460);
    terrain.stroke();

    // West Road (to Gilded Vault & Drowned Isles)
    terrain.beginPath();
    terrain.moveTo(640, 470);
    terrain.lineTo(280, 470);
    terrain.moveTo(640, 790);
    terrain.lineTo(300, 790);
    terrain.stroke();

    // East Road (to High Vale & Verdant Reach)
    terrain.beginPath();
    terrain.moveTo(640, 470);
    terrain.lineTo(1020, 470);
    terrain.moveTo(640, 790);
    terrain.lineTo(810, 790);
    terrain.stroke();

    // 5. Natural Scenery & Decorative Landmarks
    this.spawnSceneryDecorations();
  }

  private spawnSceneryDecorations() {
    // Shinto Lanterns lining main crossroads and shrines
    const lanternPositions = [
      { x: 610, y: 440 }, { x: 670, y: 440 },
      { x: 610, y: 500 }, { x: 670, y: 500 },
      { x: 610, y: 760 }, { x: 670, y: 760 },
      { x: 610, y: 820 }, { x: 670, y: 820 },
      { x: 610, y: 140 }, { x: 670, y: 140 },
      { x: 250, y: 460 }, { x: 310, y: 460 },
      { x: 990, y: 460 }, { x: 1050, y: 460 },
      { x: 270, y: 780 }, { x: 330, y: 780 },
      { x: 780, y: 780 }, { x: 840, y: 780 },
      { x: 610, y: 1100 }, { x: 670, y: 1100 },
      { x: 610, y: 1420 }, { x: 670, y: 1420 },
    ];

    lanternPositions.forEach((pos) => {
      this.add.image(pos.x, pos.y, 'stone-lantern').setDepth(3);
    });

    // Bamboo & Cherry Groves in Verdant Reach and River Crossings
    const treePositions = [
      { x: 540, y: 420 }, { x: 570, y: 390 }, { x: 710, y: 410 }, { x: 730, y: 450 },
      { x: 540, y: 720 }, { x: 570, y: 750 }, { x: 740, y: 730 }, { x: 870, y: 760 },
      { x: 900, y: 820 }, { x: 840, y: 850 }, { x: 770, y: 860 }, { x: 740, y: 890 },
      { x: 490, y: 560 }, { x: 780, y: 560 },
    ];

    treePositions.forEach((pos) => {
      this.add.image(pos.x, pos.y, 'cherry-bamboo').setDepth(4);
    });

    // Decorative Realm Title Calligraphy on Ground
    Object.values(CONTINENTAL_REGIONS).forEach((region) => {
      this.add
        .text(region.wardenShrine.x, region.wardenShrine.y - 70, region.name.toUpperCase(), {
          fontFamily: "'Cinzel', 'Noto Serif JP', serif",
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#1a1a1a',
          letterSpacing: 2,
        })
        .setOrigin(0.5)
        .setAlpha(0.65)
        .setDepth(1);
    });
  }

  // ==========================================
  // WARDEN SHRINES & INTERACTABLE TORII GATES
  // ==========================================

  private buildWardenShrines() {
    Object.values(CONTINENTAL_REGIONS).forEach((reg: RegionZone) => {
      const { x, y } = reg.wardenShrine;

      // Glowing aura circle on ground
      const hexColor = Phaser.Display.Color.HexStringToColor(
        this.getPigmentHex(reg.pigment)
      ).color;

      const glowCircle = this.add
        .circle(x, y + 10, 44, hexColor, 0.25)
        .setDepth(2);

      // Torii Shrine Gate
      const shrineSprite = this.add
        .sprite(x, y - 10, 'shrine-torii')
        .setDepth(5);

      // Warden Silhouette Figure standing at shrine
      const wardenSprite = this.add
        .sprite(x, y + 12, 'warden-figure')
        .setDepth(6);

      // Floating Kanji Seal Banner overhead
      const kanji = this.getPigmentKanji(reg.pigment);
      const kanjiText = this.add
        .text(x, y - 54, kanji, {
          fontFamily: "'Noto Serif JP', serif",
          fontSize: '22px',
          fontStyle: 'bold',
          color: this.getPigmentHex(reg.pigment),
          stroke: '#141414',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(7);

      // Subtle vertical floating tween on Kanji text
      this.tweens.add({
        targets: kanjiText,
        y: y - 60,
        duration: 1600,
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
        kanjiText,
        glowCircle,
      });
    });
  }

  // ==========================================
  // METROIDVANIA COLOR-GATE BARRIERS
  // ==========================================

  private buildColorGates() {
    COLOR_GATES.forEach((gate) => {
      const container = this.add.container(gate.x + gate.width / 2, gate.y + gate.height / 2);
      container.setDepth(8);

      const glowGraphic = this.add.graphics();
      container.add(glowGraphic);

      const hex = this.getPigmentHex(gate.requiredPigment);
      const colorNum = Phaser.Display.Color.HexStringToColor(hex).color;

      // Label showing gate name
      const label = this.add
        .text(0, -gate.height / 2 - 14, gate.name, {
          fontFamily: "'Cinzel', serif",
          fontSize: '11px',
          color: hex,
          backgroundColor: '#141414dd',
          padding: { x: 6, y: 2 },
        })
        .setOrigin(0.5);
      container.add(label);

      // Create static arcade collider body
      const colliderBody = this.barrierGroup.create(
        gate.x + gate.width / 2,
        gate.y + gate.height / 2,
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
      g.fillStyle(colorNum, 0.4);
      g.fillRect(-halfW, -halfH, width, height);

      g.lineStyle(3, colorNum, 0.9);
      g.strokeRect(-halfW, -halfH, width, height);

      // Crossing dashed centerline
      g.lineStyle(2, 0xffffff, 0.7);
      if (width > height) {
        g.lineBetween(-halfW + 6, 0, halfW - 6, 0);
      } else {
        g.lineBetween(0, -halfH + 6, 0, halfH - 6);
      }
    } else {
      // Locked: Heavy impassable seal with hazardous cross-hatching
      g.fillStyle(0x1a1a1a, 0.95);
      g.fillRect(-halfW, -halfH, width, height);

      g.lineStyle(3, colorNum, 0.9);
      g.strokeRect(-halfW, -halfH, width, height);

      // Hazardous diagonal warning lines
      g.lineStyle(2, colorNum, 0.6);
      const step = 14;
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

  private handlePlayerBarrierCollision(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    barrierObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
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
  // PLAYER SETUP & MOVEMENT
  // ==========================================

  private createPlayer() {
    this.player = this.physics.add.sprite(
      this.initialCoords.x,
      this.initialCoords.y,
      'wanderer-silhouette'
    );

    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);

    // Tight hitbox centered on feet
    this.player.setSize(20, 20);
    this.player.setOffset(6, 24);
  }

  private handlePlayerMovement(time: number) {
    const speed = 210;
    let vx = 0;
    let vy = 0;

    // Keyboard controls
    if (this.cursors) {
      if (this.cursors.left.isDown || this.keyA.isDown) vx -= 1;
      if (this.cursors.right.isDown || this.keyD.isDown) vx += 1;
      if (this.cursors.up.isDown || this.keyW.isDown) vy -= 1;
      if (this.cursors.down.isDown || this.keyS.isDown) vy += 1;
    }

    // Virtual Touch Joystick input
    if (this.virtualInputVector.x !== 0 || this.virtualInputVector.y !== 0) {
      vx = this.virtualInputVector.x;
      vy = this.virtualInputVector.y;
    }

    // Normalize diagonal velocity
    if (vx !== 0 && vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      vx /= len;
      vy /= len;
    }

    this.player.setVelocity(vx * speed, vy * speed);

    // Track facing direction and spawn subtle ink footprints
    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.playerFacing = vx > 0 ? 'right' : 'left';
        this.player.setFlipX(vx < 0);
      } else {
        this.playerFacing = vy > 0 ? 'down' : 'up';
      }

      // Spawn footstep ink blot every 180ms
      if (time - this.lastFootstepTime > 180) {
        this.lastFootstepTime = time;
        this.spawnInkFootprint(this.player.x, this.player.y + 18);
      }
    }
  }

  private spawnInkFootprint(x: number, y: number) {
    const footstep = this.add.image(x, y, 'footprint-ink').setDepth(2);
    this.tweens.add({
      targets: footstep,
      alpha: 0,
      scaleX: 0.7,
      scaleY: 0.7,
      duration: 1400,
      onComplete: () => {
        footstep.destroy();
      },
    });
  }

  // ==========================================
  // PROXIMITY SENSING & INTERACTION PROMPT
  // ==========================================

  private createPromptBubble() {
    this.promptContainer = this.add.container(0, 0);
    this.promptContainer.setDepth(20);
    this.promptContainer.setVisible(false);

    // Rounded background parchment bubble
    const bg = this.add.graphics();
    bg.fillStyle(0x141414, 0.95);
    bg.fillRoundedRect(-70, -18, 140, 36, 18);
    bg.lineStyle(2, 0xe0a96d, 0.9);
    bg.strokeRoundedRect(-70, -18, 140, 36, 18);
    this.promptContainer.add(bg);

    this.promptText = this.add
      .text(0, 0, '⚔️ Press [E] / Tap', {
        fontFamily: "'Cinzel', serif",
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f4ebd0',
      })
      .setOrigin(0.5);
    this.promptContainer.add(this.promptText);

    // Gentle floating bob
    this.tweens.add({
      targets: this.promptContainer,
      y: '+=4',
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private checkProximityToShrines() {
    let closestShrine: ShrineEntity | null = null;
    let minDist = 75; // Proximity radius

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
      this.promptContainer.setPosition(closestShrine.x, closestShrine.y - 75);
      this.promptContainer.setVisible(true);
    } else {
      this.activeNearbyShrine = null;
      this.promptContainer.setVisible(false);
    }
  }

  // ==========================================
  // AMBIENT WEATHER PARTICLES
  // ==========================================

  private initAmbientParticles() {
    const particleCount = 28;
    for (let i = 0; i < particleCount; i++) {
      const p = this.add.circle(
        Phaser.Math.Between(0, 1400),
        Phaser.Math.Between(0, 1800),
        Phaser.Math.Between(2, 4),
        0xf4ebd0,
        Phaser.Math.FloatBetween(0.2, 0.5)
      );
      p.setDepth(15);
      p.setData('vx', Phaser.Math.FloatBetween(-0.6, 0.6));
      p.setData('vy', Phaser.Math.FloatBetween(0.5, 1.4));
      this.ambientParticles.push(p);
    }
  }

  private updateAmbientParticles() {
    for (const p of this.ambientParticles) {
      let x = p.x + (p.getData('vx') as number);
      let y = p.y + (p.getData('vy') as number);

      if (y > 1800) y = 0;
      if (x < 0) x = 1400;
      if (x > 1400) x = 0;

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

  private getPigmentKanji(pigment: Pigment): string {
    const map: Record<Pigment, string> = {
      'frost-cyan': '氷',
      'abyssal-navy': '海',
      'sky-cerulean': '風',
      'molten-gold': '金',
      'emerald-jade': '木',
      'rushing-teal': '川',
      'blood-vermilion': '炎',
      'full-spectrum': '極',
    };
    return map[pigment] || '印';
  }
}
