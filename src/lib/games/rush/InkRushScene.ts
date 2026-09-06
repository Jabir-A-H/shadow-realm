import Phaser from 'phaser';
import { generateInkRushTextures } from './rushTextures';
import { ActionGameSceneCallbacks, ActionDifficulty } from '../actionGameTypes';

export interface InkRushInitData {
  callbacks: ActionGameSceneCallbacks;
  difficulty?: ActionDifficulty;
}

export class InkRushScene extends Phaser.Scene {
  private callbacks: ActionGameSceneCallbacks;
  private difficulty: ActionDifficulty;

  // Courier Player
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private currentLane = 1; // 0: Top, 1: Middle, 2: Bottom
  private laneYPositions: number[] = [];
  public currentBaseY = 0;
  public jumpOffsetY = 0;
  private jumpTween: Phaser.Tweens.Tween | null = null;
  private laneTween: Phaser.Tweens.Tween | null = null;
  private isJumping = false;
  private isSliding = false;
  private slideTimer = 0;
  private isInvulnerable = false;
  private playerLives = 3;

  // Obstacles & Collectibles Groups
  private obstacles!: Phaser.Physics.Arcade.Group;
  private collectibles!: Phaser.Physics.Arcade.Group;

  // Gameplay Run Stats
  private distanceMeters = 0;
  private targetDistance = 800; // 800m to win
  private currentSpeed = 320;
  private score = 0;
  private scrollsCollected = 0;
  private isGameOver = false;
  private gameStartTime = 0;
  private nextObstacleSpawnTime = 0;

  // River visual water lines
  private riverRipples: Phaser.GameObjects.Graphics[] = [];

  // Controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  // HUD
  private distanceText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private hearts: Phaser.GameObjects.Text[] = [];

  constructor(data?: InkRushInitData) {
    super({ key: 'InkRushScene' });
    this.callbacks = data?.callbacks || { onGameOver: () => {}, onScoreUpdate: () => {} };
    this.difficulty = data?.difficulty || 'veteran';
  }

  init(data: InkRushInitData) {
    if (data.callbacks) this.callbacks = data.callbacks;
    if (data.difficulty) this.difficulty = data.difficulty;
  }

  preload() {
    generateInkRushTextures(this);
  }

  create() {
    const { width, height } = this.scale;
    this.gameStartTime = Date.now();
    this.score = 0;
    this.distanceMeters = 0;
    this.scrollsCollected = 0;
    this.playerLives = 3;
    this.currentLane = 1;
    this.isJumping = false;
    this.isSliding = false;
    this.isGameOver = false;
    this.currentSpeed = 320;
    this.jumpTween = null;
    this.laneTween = null;

    // 1. Calculate 3 lane Y positions
    this.laneYPositions = [height * 0.38, height * 0.52, height * 0.66];
    this.currentBaseY = this.laneYPositions[this.currentLane];
    this.jumpOffsetY = 0;

    // 2. Draw Riverbed & Rapids
    this.buildRiverbed(width, height);

    // 3. Entity Groups
    this.obstacles = this.physics.add.group();
    this.collectibles = this.physics.add.group();

    // 4. Create Courier Player
    this.player = this.physics.add.sprite(
      width * 0.2,
      this.laneYPositions[this.currentLane],
      'rush-courier-run'
    );
    this.player.setOrigin(0.5, 0.8);
    this.player.setSize(22, 34);
    this.player.setDepth(15);

    // 5. Collisions & Overlaps
    this.physics.add.overlap(
      this.player,
      this.obstacles,
      this.handlePlayerObstacleCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.collectibles,
      this.handleCollectScroll as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // 6. Keyboard Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // 7. HUD
    this.buildHUD(width, height);
  }

  update(time: number, delta: number) {
    if (this.isGameOver) return;

    this.handleKeyboardInputs();
    this.player.y = this.currentBaseY + this.jumpOffsetY;
    this.updateRunProgress(delta);
    this.updateObstacleSpawns(time);
    this.updateRiverRipples();
    this.cleanupOffscreen();

    // Handle slide recovery
    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        if (!this.isJumping) {
          this.player.setTexture('rush-courier-run');
        }
      }
    }
  }

  // ==========================================
  // PUBLIC ACTIONS (Touch Controls)
  // ==========================================
  public switchLaneUp() {
    if (this.currentLane > 0 && !this.isGameOver) {
      this.currentLane -= 1;
      this.animateLaneChange();
    }
  }

  public switchLaneDown() {
    if (this.currentLane < 2 && !this.isGameOver) {
      this.currentLane += 1;
      this.animateLaneChange();
    }
  }

  public triggerJump() {
    if (this.isJumping || this.isSliding || this.isGameOver) return;
    this.isJumping = true;
    this.callbacks.onPlaySfx?.('wind');
    this.player.setTexture('rush-courier-jump');

    if (this.jumpTween) {
      this.jumpTween.stop();
      this.jumpTween = null;
    }

    this.jumpTween = this.tweens.add({
      targets: this,
      jumpOffsetY: -65,
      duration: 280,
      yoyo: true,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        this.player.y = this.currentBaseY + this.jumpOffsetY;
      },
      onComplete: () => {
        this.jumpOffsetY = 0;
        this.isJumping = false;
        this.player.y = this.currentBaseY;
        this.jumpTween = null;
        if (!this.isSliding) {
          this.player.setTexture('rush-courier-run');
        }
      },
    });
  }

  public triggerSlide() {
    if (this.isJumping || this.isSliding || this.isGameOver) return;
    this.isSliding = true;
    this.slideTimer = 550;
    this.callbacks.onPlaySfx?.('wind');
    this.player.setTexture('rush-courier-slide');
  }

  // ==========================================
  // INPUT HANDLING
  // ==========================================
  private handleKeyboardInputs() {
    // A or Left: Lane Up
    if (
      Phaser.Input.Keyboard.JustDown(this.cursors.left) ||
      Phaser.Input.Keyboard.JustDown(this.keyA)
    ) {
      this.switchLaneUp();
    }
    // D or Right: Lane Down
    else if (
      Phaser.Input.Keyboard.JustDown(this.cursors.right) ||
      Phaser.Input.Keyboard.JustDown(this.keyD)
    ) {
      this.switchLaneDown();
    }

    // W, Up, or Space: Jump
    if (
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keyW) ||
      Phaser.Input.Keyboard.JustDown(this.keySpace)
    ) {
      this.triggerJump();
    }

    // S or Down: Slide
    if (
      Phaser.Input.Keyboard.JustDown(this.cursors.down) ||
      Phaser.Input.Keyboard.JustDown(this.keyS)
    ) {
      this.triggerSlide();
    }
  }

  private animateLaneChange() {
    this.callbacks.onPlaySfx?.('parchment');
    const targetY = this.laneYPositions[this.currentLane];

    if (this.laneTween) {
      this.laneTween.stop();
      this.laneTween = null;
    }

    this.laneTween = this.tweens.add({
      targets: this,
      currentBaseY: targetY,
      duration: 160,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        this.player.y = this.currentBaseY + this.jumpOffsetY;
      },
      onComplete: () => {
        this.currentBaseY = targetY;
        this.player.y = this.currentBaseY + this.jumpOffsetY;
        this.laneTween = null;
      },
    });
  }

  // ==========================================
  // RUN PROGRESS & SPEED
  // ==========================================
  private updateRunProgress(delta: number) {
    const metersGained = (this.currentSpeed * delta) / 1000 / 10;
    this.distanceMeters += metersGained;
    this.score += Math.round(metersGained * 10);

    // Gently increase speed
    this.currentSpeed = Math.min(520, 320 + this.distanceMeters * 0.2);

    this.updateHUD();

    // Check target victory
    if (this.distanceMeters >= this.targetDistance) {
      this.finishGame(true);
    }
  }

  // ==========================================
  // PROCEDURAL HAZARD & SCROLL SPAWNER
  // ==========================================
  private updateObstacleSpawns(time: number) {
    const minInterval = this.difficulty === 'master' ? 700 : this.difficulty === 'novice' ? 1100 : 900;
    const spawnInterval = Math.max(minInterval, 1800 - this.distanceMeters * 1.2);

    if (time > this.nextObstacleSpawnTime) {
      this.nextObstacleSpawnTime = time + spawnInterval;
      this.spawnHazardWave();
    }
  }

  private spawnHazardWave() {
    const { width } = this.scale;
    const lane = Phaser.Math.Between(0, 2);
    const laneY = this.laneYPositions[lane];

    const roll = Math.random();
    if (roll < 0.5) {
      // River Rock: Jump or switch lane
      const rock = this.obstacles.create(width + 40, laneY, 'rush-obstacle-rock') as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      rock.setOrigin(0.5, 0.8);
      rock.setVelocityX(-this.currentSpeed);
      rock.setData('type', 'rock');
      rock.setData('lane', lane);
      rock.setSize(34, 20);
      rock.setDepth(10);
    } else if (roll < 0.8) {
      // Hanging Bamboo Gate: Slide or switch lane
      const gate = this.obstacles.create(width + 40, laneY - 14, 'rush-obstacle-gate') as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      gate.setOrigin(0.5, 0.5);
      gate.setVelocityX(-this.currentSpeed);
      gate.setData('type', 'gate');
      gate.setData('lane', lane);
      gate.setSize(40, 26);
      gate.setDepth(10);
    }

    // Chance to spawn Vermilion Courier Scroll in one of the other lanes
    if (Math.random() < 0.45) {
      const scrollLane = (lane + Phaser.Math.Between(1, 2)) % 3;
      const scroll = this.collectibles.create(
        width + 70,
        this.laneYPositions[scrollLane] - 6,
        'rush-scroll'
      ) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      scroll.setVelocityX(-this.currentSpeed);
      scroll.setDepth(12);
    }
  }

  // ==========================================
  // COLLISIONS & DAMAGE
  // ==========================================
  private handlePlayerObstacleCollision(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    obstacleObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    if (this.isInvulnerable || this.isGameOver) return;

    const obstacle = obstacleObj as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    const obstacleLane = obstacle.getData('lane') as number;

    // Ignore collisions from obstacles in other lanes (prevents vertical jump bleed)
    if (obstacleLane !== undefined && obstacleLane !== this.currentLane) {
      return;
    }

    const type = obstacle.getData('type') as string;

    // If jumping over a rock, dodge success!
    if (type === 'rock' && this.isJumping) {
      return;
    }

    // If sliding under a gate, dodge success!
    if (type === 'gate' && this.isSliding) {
      return;
    }

    // Clean hit taken
    obstacle.destroy();
    this.playerLives -= 1;
    this.callbacks.onPlaySfx?.('heavy-strike');
    this.cameras.main.shake(200, 0.02);
    this.updateHUD();

    if (this.playerLives <= 0) {
      this.finishGame(false);
      return;
    }

    // Invulnerability frames
    this.isInvulnerable = true;
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      yoyo: true,
      repeat: 6,
      duration: 100,
      onComplete: () => {
        this.player.setAlpha(1);
        this.isInvulnerable = false;
      },
    });
  }

  private handleCollectScroll(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    scrollObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    scrollObj.destroy();
    this.callbacks.onPlaySfx?.('seal-stamp');
    this.scrollsCollected += 1;
    this.score += 350;
    this.callbacks.onScoreUpdate(this.score);
    this.updateHUD();
  }

  private finishGame(won: boolean) {
    this.isGameOver = true;
    this.currentSpeed = 0;
    this.obstacles.setVelocityX(0);
    this.collectibles.setVelocityX(0);

    if (won) {
      this.callbacks.onPlaySfx?.('victory');
      this.callbacks.onPlaySfx?.('taiko-heavy');
      this.cameras.main.flash(500, 244, 235, 208);
    }

    const duration = Math.round((Date.now() - this.gameStartTime) / 1000);
    this.time.delayedCall(1200, () => {
      this.callbacks.onGameOver({
        gameId: 'ink-rush',
        won,
        score: this.score,
        highScore: this.score,
        stats: {
          durationSeconds: duration,
          distanceMeters: Math.round(this.distanceMeters),
          scrollsCollected: this.scrollsCollected,
        },
      });
    });
  }

  private cleanupOffscreen() {
    this.obstacles.getChildren().forEach((o) => {
      const obs = o as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      if (obs.x < -60) obs.destroy();
    });

    this.collectibles.getChildren().forEach((c) => {
      const col = c as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      if (col.x < -40) col.destroy();
    });
  }

  // ==========================================
  // RIVERBED & RAPIDS GRAPHICS
  // ==========================================
  private buildRiverbed(width: number, height: number) {
    const bg = this.add.graphics();

    // Deep Rushing Teal Water
    bg.fillStyle(0x0e1b24, 1);
    bg.fillRect(0, 0, width, height);

    // Riverbank banks (Top and bottom land borders)
    bg.fillStyle(0x1a2818, 1);
    bg.fillRect(0, 0, width, height * 0.28);
    bg.fillRect(0, height * 0.76, width, height * 0.24);

    // Riverbed 3-lane sandbars
    this.laneYPositions.forEach((ly) => {
      bg.lineStyle(28, 0x142b38, 0.7);
      bg.lineBetween(0, ly, width, ly);

      bg.lineStyle(1.5, 0x0077b6, 0.4);
      bg.lineBetween(0, ly - 20, width, ly - 20);
      bg.lineBetween(0, ly + 20, width, ly + 20);
    });

    // Procedural foam ripples
    for (let i = 0; i < 14; i++) {
      const g = this.add.graphics();
      g.lineStyle(2, 0x90e0ef, 0.4);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Phaser.Math.Between(20, 60), 0);
      g.stroke();
      g.x = Phaser.Math.Between(0, width);
      g.y = Phaser.Math.Between(height * 0.32, height * 0.72);
      g.setData('speed', Phaser.Math.Between(4, 8));
      this.riverRipples.push(g);
    }
  }

  private updateRiverRipples() {
    for (const r of this.riverRipples) {
      r.x -= r.getData('speed') as number;
      if (r.x < -60) {
        r.x = this.scale.width + 40;
        r.y = Phaser.Math.Between(this.scale.height * 0.32, this.scale.height * 0.72);
      }
    }
  }

  // ==========================================
  // HUD
  // ==========================================
  private buildHUD(width: number, _height: number) {
    this.distanceText = this.add
      .text(width * 0.05, 14, `DISTANCE: 0m / ${this.targetDistance}m`, {
        fontFamily: "'Cinzel', monospace",
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#0077b6',
      })
      .setDepth(25);

    this.scoreText = this.add
      .text(width * 0.95, 14, 'SCORE: 0', {
        fontFamily: "'Cinzel', monospace",
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#f4ebd0',
      })
      .setOrigin(1, 0)
      .setDepth(25);

    // Hearts
    for (let i = 0; i < 3; i++) {
      const h = this.add
        .text(width * 0.05 + i * 22, 36, '❤️', {
          fontSize: '14px',
        })
        .setDepth(25);
      this.hearts.push(h);
    }
  }

  private updateHUD() {
    this.distanceText.setText(
      `DISTANCE: ${Math.round(this.distanceMeters)}m / ${this.targetDistance}m`
    );
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.hearts.forEach((h, idx) => {
      h.setVisible(idx < this.playerLives);
    });
  }
}
