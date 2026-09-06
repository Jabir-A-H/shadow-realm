import Phaser from 'phaser';
import { generateBladeDuelTextures } from './bladeDuelTextures';
import { ActionGameSceneCallbacks, ActionDifficulty } from '../actionGameTypes';

export type DuelistState =
  | 'idle'
  | 'walk-forward'
  | 'walk-backward'
  | 'guard'
  | 'poke-startup'
  | 'poke-active'
  | 'poke-recovery'
  | 'heavy-startup'
  | 'heavy-active'
  | 'heavy-recovery'
  | 'hit-stun';

export interface BladeDuelInitData {
  callbacks: ActionGameSceneCallbacks;
  difficulty?: ActionDifficulty;
  wardenName?: string;
  wardenColorHex?: string;
}

export class BladeDuelScene extends Phaser.Scene {
  private callbacks: ActionGameSceneCallbacks;
  private difficulty: ActionDifficulty;
  private wardenName: string;
  private wardenColorHex: string;

  // Sprites
  private playerSprite!: Phaser.GameObjects.Sprite;
  private wardenSprite!: Phaser.GameObjects.Sprite;

  // States
  private playerState: DuelistState = 'idle';
  private wardenState: DuelistState = 'idle';
  private stateTimerPlayer = 0;
  private stateTimerWarden = 0;

  // Match scores
  private playerLives = 3;
  private wardenLives = 3;
  private isRoundOver = false;
  private matchOver = false;
  private matchStartTime = 0;
  private hitsLanded = 0;
  private hitsTaken = 0;

  // Visuals & HUD
  private calloutText!: Phaser.GameObjects.Text;
  private playerGems: Phaser.GameObjects.Arc[] = [];
  private wardenGems: Phaser.GameObjects.Arc[] = [];
  private inkSlashGraphics!: Phaser.GameObjects.Graphics;

  // Controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyJ!: Phaser.Input.Keyboard.Key;
  private keyK!: Phaser.Input.Keyboard.Key;
  private keyZ!: Phaser.Input.Keyboard.Key;
  private keyX!: Phaser.Input.Keyboard.Key;

  // Virtual inputs from touch
  private virtualMove = 0; // -1 (back), 0 (none), 1 (forward)
  private virtualGuard = false;

  // AI timing
  private lastAiDecisionTime = 0;

  constructor(data?: BladeDuelInitData) {
    super({ key: 'BladeDuelScene' });
    this.callbacks = data?.callbacks || { onGameOver: () => {}, onScoreUpdate: () => {} };
    this.difficulty = data?.difficulty || 'veteran';
    this.wardenName = data?.wardenName || 'The Frost King';
    this.wardenColorHex = data?.wardenColorHex || '#48cae4';
  }

  init(data: BladeDuelInitData) {
    if (data.callbacks) this.callbacks = data.callbacks;
    if (data.difficulty) this.difficulty = data.difficulty;
    if (data.wardenName) this.wardenName = data.wardenName;
    if (data.wardenColorHex) this.wardenColorHex = data.wardenColorHex;
  }

  preload() {
    generateBladeDuelTextures(this, this.wardenColorHex);
  }

  create() {
    const { width, height } = this.scale;
    this.matchStartTime = Date.now();
    this.playerLives = 3;
    this.wardenLives = 3;
    this.isRoundOver = false;
    this.matchOver = false;
    this.hitsLanded = 0;
    this.hitsTaken = 0;

    // 1. Background (Rice Paper & Misty Stone Bridge)
    this.buildBackground(width, height);

    // 2. Dual combatants on 1D horizontal plane (ground Y = height * 0.65)
    const groundY = height * 0.66;
    this.playerSprite = this.add.sprite(width * 0.32, groundY, 'duel-player-idle').setOrigin(0.5, 1);
    this.wardenSprite = this.add
      .sprite(width * 0.68, groundY, `duel-warden-idle-${this.wardenColorHex.replace('#', '')}`)
      .setOrigin(0.5, 1);

    // 3. Ink slash layer
    this.inkSlashGraphics = this.add.graphics().setDepth(20);

    // 4. Combat HUD (Lives, Names, Callout text)
    this.buildCombatHUD(width, height);

    // 5. Keyboard input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
      this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
      this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
      this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    }

    this.showCallout('THE NEUTRAL', '#e0a96d', 1400);
  }

  update(time: number, delta: number) {
    if (this.matchOver) return;

    this.updateTimers(delta);
    if (!this.isRoundOver) {
      this.handlePlayerInput();
      this.updateAI(time);
      this.checkCombatCollisions();
    }
    this.updateSpriteVisuals();
  }

  // ==========================================
  // PUBLIC ACTIONS (Called from Touch Buttons)
  // ==========================================
  public triggerPoke() {
    if (this.canAct(this.playerState)) {
      this.playerState = 'poke-startup';
      this.stateTimerPlayer = 110;
      this.callbacks.onPlaySfx?.('wind');
    }
  }

  public triggerHeavy() {
    if (this.canAct(this.playerState)) {
      this.playerState = 'heavy-startup';
      this.stateTimerPlayer = 240;
      this.callbacks.onPlaySfx?.('wind');
    }
  }

  public setVirtualMovement(val: number) {
    this.virtualMove = val;
  }

  public setVirtualGuard(guarding: boolean) {
    this.virtualGuard = guarding;
  }

  // ==========================================
  // INPUT & STATE LOGIC
  // ==========================================
  private canAct(state: DuelistState): boolean {
    return (
      state === 'idle' ||
      state === 'walk-forward' ||
      state === 'walk-backward' ||
      state === 'guard'
    );
  }

  private handlePlayerInput() {
    if (
      Phaser.Input.Keyboard.JustDown(this.keyJ) ||
      Phaser.Input.Keyboard.JustDown(this.keyZ)
    ) {
      this.triggerPoke();
      return;
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.keyK) ||
      Phaser.Input.Keyboard.JustDown(this.keyX)
    ) {
      this.triggerHeavy();
      return;
    }

    if (!this.canAct(this.playerState)) return;

    const isGuarding =
      (this.cursors && this.cursors.down.isDown) ||
      (this.keyS && this.keyS.isDown) ||
      this.virtualGuard;

    const isMovingLeft =
      (this.cursors && this.cursors.left.isDown) ||
      (this.keyA && this.keyA.isDown) ||
      this.virtualMove < 0;

    const isMovingRight =
      (this.cursors && this.cursors.right.isDown) ||
      (this.keyD && this.keyD.isDown) ||
      this.virtualMove > 0;

    const speed = 150;
    const { width } = this.scale;
    const minDistance = 70;

    if (isGuarding) {
      this.playerState = 'guard';
    } else if (isMovingRight) {
      // Step forward towards opponent
      if (this.playerSprite.x + minDistance < this.wardenSprite.x) {
        this.playerSprite.x += (speed * this.game.loop.delta) / 1000;
      }
      this.playerState = 'walk-forward';
    } else if (isMovingLeft) {
      // Step backward away
      if (this.playerSprite.x > width * 0.1) {
        this.playerSprite.x -= (speed * this.game.loop.delta) / 1000;
      }
      this.playerState = 'walk-backward';
    } else {
      this.playerState = 'idle';
    }
  }

  private updateTimers(delta: number) {
    // Player State transitions
    if (this.stateTimerPlayer > 0) {
      this.stateTimerPlayer -= delta;
      if (this.stateTimerPlayer <= 0) {
        if (this.playerState === 'poke-startup') {
          this.playerState = 'poke-active';
          this.stateTimerPlayer = 130;
        } else if (this.playerState === 'poke-active') {
          this.playerState = 'poke-recovery';
          this.stateTimerPlayer = 160; // Whiff recovery window
        } else if (this.playerState === 'heavy-startup') {
          this.playerState = 'heavy-active';
          this.stateTimerPlayer = 170;
        } else if (this.playerState === 'heavy-active') {
          this.playerState = 'heavy-recovery';
          this.stateTimerPlayer = 320; // Long whiff recovery
        } else if (
          this.playerState === 'poke-recovery' ||
          this.playerState === 'heavy-recovery' ||
          this.playerState === 'hit-stun'
        ) {
          this.playerState = 'idle';
        }
      }
    }

    // Warden State transitions
    if (this.stateTimerWarden > 0) {
      this.stateTimerWarden -= delta;
      if (this.stateTimerWarden <= 0) {
        if (this.wardenState === 'poke-startup') {
          this.wardenState = 'poke-active';
          this.stateTimerWarden = 130;
        } else if (this.wardenState === 'poke-active') {
          this.wardenState = 'poke-recovery';
          this.stateTimerWarden = 160;
        } else if (this.wardenState === 'heavy-startup') {
          this.wardenState = 'heavy-active';
          this.stateTimerWarden = 170;
        } else if (this.wardenState === 'heavy-active') {
          this.wardenState = 'heavy-recovery';
          this.stateTimerWarden = 320;
        } else if (
          this.wardenState === 'poke-recovery' ||
          this.wardenState === 'heavy-recovery' ||
          this.wardenState === 'hit-stun'
        ) {
          this.wardenState = 'idle';
        }
      }
    }
  }

  // ==========================================
  // SMART WARDEN AI LOGIC
  // ==========================================
  private updateAI(time: number) {
    if (!this.canAct(this.wardenState)) return;

    // AI decision tick interval (Novice: 350ms, Veteran: 200ms, Master: 120ms)
    const decisionInterval =
      this.difficulty === 'master' ? 120 : this.difficulty === 'novice' ? 340 : 200;

    if (time - this.lastAiDecisionTime < decisionInterval) return;
    this.lastAiDecisionTime = time;

    const dist = this.wardenSprite.x - this.playerSprite.x;
    const { width } = this.scale;
    const deltaSeconds = decisionInterval / 1000;
    const speed = 135;

    // 1. Whiff Punish reaction: If player is recovering from whiffed heavy/poke
    if (
      (this.playerState === 'heavy-recovery' || this.playerState === 'poke-recovery') &&
      dist < 180
    ) {
      this.showCallout('WHIFF PUNISH!', '#ffd166', 700);
      this.wardenState = 'poke-startup';
      this.stateTimerWarden = 110;
      this.callbacks.onPlaySfx?.('wind');
      return;
    }

    // 2. Incoming strike reaction: Guard or spacing backstep
    if (this.playerState === 'heavy-startup' || this.playerState === 'poke-startup') {
      const guardChance = this.difficulty === 'master' ? 0.85 : this.difficulty === 'veteran' ? 0.65 : 0.4;
      if (Math.random() < guardChance) {
        this.wardenState = 'guard';
        this.stateTimerWarden = 350;
        return;
      }
    }

    // 3. Spacing Game (Blade Neutral): Stay in ideal duel distance (~140-190px)
    if (dist < 115) {
      // Too close: Step back
      if (this.wardenSprite.x < width * 0.9) {
        this.wardenSprite.x += speed * deltaSeconds;
      }
      this.wardenState = 'walk-backward';
    } else if (dist > 220) {
      // Too far: Advance into range
      this.wardenSprite.x -= speed * deltaSeconds;
      this.wardenState = 'walk-forward';
    } else {
      // In the sweet spot: Randomize strike or feint step
      const roll = Math.random();
      if (roll < 0.25) {
        // Quick Poke
        this.wardenState = 'poke-startup';
        this.stateTimerWarden = 110;
        this.callbacks.onPlaySfx?.('wind');
      } else if (roll < 0.42 && dist < 170) {
        // Heavy Strike
        this.wardenState = 'heavy-startup';
        this.stateTimerWarden = 240;
        this.callbacks.onPlaySfx?.('wind');
      } else if (roll < 0.65) {
        this.wardenState = 'idle';
      } else {
        // Feint backstep
        if (this.wardenSprite.x < width * 0.88) {
          this.wardenSprite.x += speed * 0.5 * deltaSeconds;
        }
        this.wardenState = 'walk-backward';
      }
    }
  }

  // ==========================================
  // COMBAT RESOLUTION & HIT DETECTION
  // ==========================================
  private checkCombatCollisions() {
    const dist = this.wardenSprite.x - this.playerSprite.x;
    const playerAttacking = this.playerState === 'poke-active' || this.playerState === 'heavy-active';
    const wardenAttacking = this.wardenState === 'poke-active' || this.wardenState === 'heavy-active';

    const playerReach = this.playerState === 'heavy-active' ? 180 : 125;
    const wardenReach = this.wardenState === 'heavy-active' ? 180 : 125;

    // 1. Blade Clash / Simultaneous strike parry
    if (playerAttacking && wardenAttacking) {
      if (dist <= Math.max(playerReach, wardenReach)) {
        this.resolveBladeClash();
        return;
      }
    }

    // 2. Player hits Warden
    if (playerAttacking && dist <= playerReach) {
      if (this.wardenState === 'guard') {
        // Blocked by Warden
        this.resolveBlockedHit(false);
      } else if (this.wardenState !== 'hit-stun') {
        // Clean hit lands on Warden!
        this.resolveCleanHit(true);
      }
      return;
    }

    // 3. Warden hits Player
    if (wardenAttacking && dist <= wardenReach) {
      if (this.playerState === 'guard') {
        // Blocked by Player
        this.resolveBlockedHit(true);
      } else if (this.playerState !== 'hit-stun') {
        // Clean hit lands on Player!
        this.resolveCleanHit(false);
      }
    }
  }

  private resolveBladeClash() {
    this.callbacks.onPlaySfx?.('clash');
    this.cameras.main.shake(120, 0.012);
    this.showCallout('CLASH!', '#f4ebd0', 600);

    // Push both combatants back
    this.playerSprite.x = Math.max(this.scale.width * 0.15, this.playerSprite.x - 32);
    this.wardenSprite.x = Math.min(this.scale.width * 0.85, this.wardenSprite.x + 32);

    // Spawn sparks at midpoint
    const midX = (this.playerSprite.x + this.wardenSprite.x) / 2;
    this.spawnClashSparks(midX, this.playerSprite.y - 34);

    // Recoil both to recovery
    this.playerState = 'poke-recovery';
    this.stateTimerPlayer = 180;
    this.wardenState = 'poke-recovery';
    this.stateTimerWarden = 180;
  }

  private resolveBlockedHit(playerBlocked: boolean) {
    this.callbacks.onPlaySfx?.('parry');
    this.cameras.main.shake(80, 0.008);

    if (playerBlocked) {
      this.showCallout('GUARD!', '#48cae4', 500);
      this.playerSprite.x = Math.max(this.scale.width * 0.12, this.playerSprite.x - 28);
      this.wardenState = 'poke-recovery';
      this.stateTimerWarden = 220;
    } else {
      this.showCallout('DEFLECTED!', this.wardenColorHex, 500);
      this.wardenSprite.x = Math.min(this.scale.width * 0.88, this.wardenSprite.x + 28);
      this.playerState = 'poke-recovery';
      this.stateTimerPlayer = 220;
    }
  }

  private resolveCleanHit(playerScored: boolean) {
    this.isRoundOver = true;
    this.cameras.main.shake(260, 0.024);

    if (playerScored) {
      this.wardenLives -= 1;
      this.hitsLanded += 1;
      this.callbacks.onPlaySfx?.('heavy-strike');
      this.callbacks.onPlaySfx?.('taiko-heavy');
      this.showCallout('CLEAN STRIKE!', '#e0a96d', 1100);

      this.wardenState = 'hit-stun';
      this.stateTimerWarden = 800;
      this.wardenSprite.x = Math.min(this.scale.width * 0.9, this.wardenSprite.x + 45);

      this.drawDynamicInkSlash(
        this.playerSprite.x + 20,
        this.playerSprite.y - 50,
        this.wardenSprite.x + 10,
        this.wardenSprite.y - 15,
        '#b3312c'
      );
    } else {
      this.playerLives -= 1;
      this.hitsTaken += 1;
      this.callbacks.onPlaySfx?.('heavy-strike');
      this.callbacks.onPlaySfx?.('taiko');
      this.showCallout('STRUCK!', '#b3312c', 1100);

      this.playerState = 'hit-stun';
      this.stateTimerPlayer = 800;
      this.playerSprite.x = Math.max(this.scale.width * 0.1, this.playerSprite.x - 45);

      this.drawDynamicInkSlash(
        this.wardenSprite.x - 20,
        this.wardenSprite.y - 50,
        this.playerSprite.x - 10,
        this.playerSprite.y - 15,
        this.wardenColorHex
      );
    }

    this.updateHUDGems();

    // Check for match end
    if (this.wardenLives <= 0 || this.playerLives <= 0) {
      this.matchOver = true;
      const won = this.wardenLives <= 0;
      const duration = Math.round((Date.now() - this.matchStartTime) / 1000);
      const score = Math.max(100, 1000 * this.playerLives - duration * 15 + this.hitsLanded * 250);

      this.time.delayedCall(1200, () => {
        this.callbacks.onGameOver({
          gameId: 'blade-duel',
          won,
          score,
          highScore: score,
          stats: {
            durationSeconds: duration,
            hitsLanded: this.hitsLanded,
            hitsTaken: this.hitsTaken,
          },
        });
      });
    } else {
      // Reset to neutral spacing after hit stun
      this.time.delayedCall(900, () => {
        this.resetToNeutralPositions();
      });
    }
  }

  private resetToNeutralPositions() {
    const { width } = this.scale;
    this.tweens.add({
      targets: this.playerSprite,
      x: width * 0.35,
      duration: 350,
      ease: 'Quad.easeOut',
    });
    this.tweens.add({
      targets: this.wardenSprite,
      x: width * 0.65,
      duration: 350,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.playerState = 'idle';
        this.wardenState = 'idle';
        this.isRoundOver = false;
        this.showCallout('READY', '#f4ebd0', 600);
      },
    });
  }

  // ==========================================
  // GRAPHICS, VISUALS & PARTICLES
  // ==========================================
  private updateSpriteVisuals() {
    // Player texture update
    if (this.playerState === 'poke-startup' || this.playerState === 'poke-active') {
      this.playerSprite.setTexture('duel-player-poke');
    } else if (this.playerState === 'heavy-startup' || this.playerState === 'heavy-active') {
      this.playerSprite.setTexture('duel-player-heavy');
    } else if (this.playerState === 'guard') {
      this.playerSprite.setTexture('duel-player-guard');
    } else if (this.playerState === 'hit-stun') {
      this.playerSprite.setTexture('duel-player-hit');
    } else {
      this.playerSprite.setTexture('duel-player-idle');
    }

    // Warden texture update
    const wKey = this.wardenColorHex.replace('#', '');
    if (this.wardenState === 'poke-startup' || this.wardenState === 'poke-active') {
      this.wardenSprite.setTexture(`duel-warden-poke-${wKey}`);
    } else if (this.wardenState === 'heavy-startup' || this.wardenState === 'heavy-active') {
      this.wardenSprite.setTexture(`duel-warden-heavy-${wKey}`);
    } else if (this.wardenState === 'guard') {
      this.wardenSprite.setTexture(`duel-warden-guard-${wKey}`);
    } else if (this.wardenState === 'hit-stun') {
      this.wardenSprite.setTexture(`duel-warden-hit-${wKey}`);
    } else {
      this.wardenSprite.setTexture(`duel-warden-idle-${wKey}`);
    }
  }

  private drawDynamicInkSlash(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    colorHex: string
  ) {
    this.inkSlashGraphics.clear();
    const colorNum = Phaser.Display.Color.HexStringToColor(colorHex).color;

    this.inkSlashGraphics.lineStyle(10, colorNum, 0.95);
    this.inkSlashGraphics.beginPath();
    this.inkSlashGraphics.moveTo(x1, y1);
    this.inkSlashGraphics.lineTo(x2, y2);
    this.inkSlashGraphics.stroke();

    this.inkSlashGraphics.lineStyle(3, 0xffffff, 0.9);
    this.inkSlashGraphics.beginPath();
    this.inkSlashGraphics.moveTo(x1, y1);
    this.inkSlashGraphics.lineTo(x2, y2);
    this.inkSlashGraphics.stroke();

    this.tweens.add({
      targets: this.inkSlashGraphics,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this.inkSlashGraphics.clear();
        this.inkSlashGraphics.alpha = 1;
      },
    });
  }

  private spawnClashSparks(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const spark = this.add.image(x, y, 'duel-spark').setDepth(25);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(80, 220);

      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: 250,
        onComplete: () => spark.destroy(),
      });
    }
  }

  private showCallout(text: string, color: string, duration = 800) {
    this.calloutText.setText(text);
    this.calloutText.setColor(color);
    this.calloutText.setAlpha(1);
    this.calloutText.setScale(1.2);

    this.tweens.add({
      targets: this.calloutText,
      scale: 1,
      alpha: { from: 1, to: 0 },
      delay: duration * 0.6,
      duration: duration * 0.4,
      ease: 'Power2',
    });
  }

  // ==========================================
  // ENVIRONMENT & BACKGROUND BUILDER
  // ==========================================
  private buildBackground(width: number, height: number) {
    const bg = this.add.graphics();

    // Parchment Wash
    bg.fillStyle(0x191919, 1);
    bg.fillRect(0, 0, width, height);

    // Distant mountain silhouette ink wash
    bg.fillStyle(0x232323, 1);
    bg.beginPath();
    bg.moveTo(0, height * 0.65);
    bg.lineTo(width * 0.2, height * 0.42);
    bg.lineTo(width * 0.45, height * 0.55);
    bg.lineTo(width * 0.7, height * 0.38);
    bg.lineTo(width, height * 0.58);
    bg.lineTo(width, height * 0.65);
    bg.closePath();
    bg.fill();

    // Misty horizon gradient
    bg.fillStyle(0x2b2b2b, 0.4);
    bg.fillRect(0, height * 0.58, width, height * 0.08);

    // Stone Bridge / Fighting Arena Platform
    const groundY = height * 0.66;
    bg.fillStyle(0x121212, 1);
    bg.fillRect(width * 0.05, groundY, width * 0.9, height * 0.34);

    // Arena boundary lines
    bg.lineStyle(3, 0xb3312c, 0.75);
    bg.strokeRect(width * 0.05, groundY, width * 0.9, height * 0.34);

    // Distance Hash Marks on the ground
    bg.lineStyle(1.5, 0x333333, 0.8);
    for (let lx = width * 0.15; lx < width * 0.85; lx += 40) {
      bg.lineBetween(lx, groundY + 2, lx, groundY + 12);
    }
  }

  private buildCombatHUD(width: number, height: number) {
    // Player Nameplate (Left)
    this.add
      .text(width * 0.08, height * 0.06, 'SHADOW WANDERER', {
        fontFamily: "'Cinzel', serif",
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#f4ebd0',
      })
      .setDepth(10);

    // Warden Nameplate (Right)
    this.add
      .text(width * 0.92, height * 0.06, this.wardenName.toUpperCase(), {
        fontFamily: "'Cinzel', serif",
        fontSize: '14px',
        fontStyle: 'bold',
        color: this.wardenColorHex,
      })
      .setOrigin(1, 0)
      .setDepth(10);

    // Player Life Gems (Left)
    for (let i = 0; i < 3; i++) {
      const gem = this.add
        .circle(width * 0.08 + i * 22, height * 0.11, 7, 0xb3312c)
        .setDepth(10);
      this.playerGems.push(gem);
    }

    // Warden Life Gems (Right)
    const wardenColorNum = Phaser.Display.Color.HexStringToColor(this.wardenColorHex).color;
    for (let i = 0; i < 3; i++) {
      const gem = this.add
        .circle(width * 0.92 - i * 22, height * 0.11, 7, wardenColorNum)
        .setDepth(10);
      this.wardenGems.push(gem);
    }

    // Centered Callout Text
    this.calloutText = this.add
      .text(width * 0.5, height * 0.3, '', {
        fontFamily: "'Cinzel', serif",
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#f4ebd0',
        stroke: '#141414',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setAlpha(0);
  }

  private updateHUDGems() {
    this.playerGems.forEach((gem, idx) => {
      gem.setVisible(idx < this.playerLives);
    });
    this.wardenGems.forEach((gem, idx) => {
      gem.setVisible(idx < this.wardenLives);
    });
  }
}
