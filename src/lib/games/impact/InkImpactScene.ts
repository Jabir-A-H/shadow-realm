import Phaser from 'phaser';
import { generateInkImpactTextures } from './impactTextures';
import { ActionGameSceneCallbacks, ActionDifficulty } from '../actionGameTypes';

export interface InkImpactInitData {
  callbacks: ActionGameSceneCallbacks;
  difficulty?: ActionDifficulty;
}

export class InkImpactScene extends Phaser.Scene {
  private callbacks: ActionGameSceneCallbacks;
  private difficulty: ActionDifficulty;

  // Player
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private playerHealth = 3;
  private hasShield = false;
  private hasSpread = false;
  private bombsRemaining = 2;
  private isInvulnerable = false;
  private lastFireTime = 0;

  // Groups (Pooled Projectiles & Enemies)
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private powerups!: Phaser.Physics.Arcade.Group;

  // Boss
  private boss: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
  private bossHealth = 30;
  private maxBossHealth = 30;
  private bossSpawned = false;

  // Gameplay State
  private score = 0;
  private enemiesDefeated = 0;
  private gameStartTime = 0;
  private isGameOver = false;
  private nextSpawnTime = 0;

  // Parallax background clouds
  private clouds: Phaser.GameObjects.Arc[] = [];

  // Controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyJ!: Phaser.Input.Keyboard.Key;
  private keyK!: Phaser.Input.Keyboard.Key;
  private keyB!: Phaser.Input.Keyboard.Key;

  // Touch Virtual Inputs
  private virtualDir: { x: number; y: number } = { x: 0, y: 0 };
  private virtualFiring = false;

  // UI elements
  private scoreText!: Phaser.GameObjects.Text;
  private hearts: Phaser.GameObjects.Text[] = [];
  private bombIcons: Phaser.GameObjects.Text[] = [];
  private bossHealthBar!: Phaser.GameObjects.Graphics;

  constructor(data?: InkImpactInitData) {
    super({ key: 'InkImpactScene' });
    this.callbacks = data?.callbacks || { onGameOver: () => {}, onScoreUpdate: () => {} };
    this.difficulty = data?.difficulty || 'veteran';
  }

  init(data: InkImpactInitData) {
    if (data.callbacks) this.callbacks = data.callbacks;
    if (data.difficulty) this.difficulty = data.difficulty;
  }

  preload() {
    generateInkImpactTextures(this);
  }

  create() {
    const { width, height } = this.scale;
    this.gameStartTime = Date.now();
    this.score = 0;
    this.playerHealth = 3;
    this.bombsRemaining = 2;
    this.hasShield = false;
    this.hasSpread = false;
    this.isGameOver = false;
    this.bossSpawned = false;
    this.enemiesDefeated = 0;

    // 1. Scrolling background
    this.buildScrollingSky(width, height);

    // 2. Projectile & Entity Groups
    this.playerBullets = this.physics.add.group({
      defaultKey: 'impact-dart',
      maxSize: 40,
    });

    this.enemyBullets = this.physics.add.group({
      defaultKey: 'impact-enemy-bullet',
      maxSize: 60,
    });

    this.enemies = this.physics.add.group();
    this.powerups = this.physics.add.group();

    // 3. Create Player Glider
    this.player = this.physics.add.sprite(width * 0.15, height * 0.5, 'impact-glider');
    this.player.setCollideWorldBounds(true);
    this.player.setSize(32, 20);
    this.player.setDepth(15);

    // 4. Overlap & Colliders
    this.physics.add.overlap(
      this.playerBullets,
      this.enemies,
      this.handleBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.enemyBullets,
      this.handlePlayerHitByBullet as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.powerups,
      this.handleCollectPowerup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // 5. Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
      this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
      this.keyB = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    }

    // 6. HUD
    this.buildHUD(width, height);
  }

  update(time: number) {
    if (this.isGameOver) return;

    this.updateBackgroundClouds();
    this.handlePlayerMovement();
    this.handleFiring(time);
    this.updateEnemySpawns(time);
    this.updateEnemies(time);
    this.updateBossBehavior(time);
    this.cleanupOffscreenObjects();
  }

  // ==========================================
  // PUBLIC ACTIONS (Called from Touch Buttons)
  // ==========================================
  public setVirtualMovement(vec: { x: number; y: number }) {
    this.virtualDir = vec;
  }

  public setVirtualFiring(firing: boolean) {
    this.virtualFiring = firing;
  }

  public triggerBomb() {
    if (this.bombsRemaining <= 0 || this.isGameOver) return;
    this.bombsRemaining -= 1;
    this.callbacks.onPlaySfx?.('taiko-heavy');
    this.callbacks.onPlaySfx?.('ink-splash');
    this.cameras.main.flash(300, 179, 49, 44);
    this.cameras.main.shake(250, 0.02);

    // Clear all enemy bullets
    this.enemyBullets.clear(true, true);

    // Damage all enemies
    this.enemies.getChildren().forEach((e) => {
      const enemy = e as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      this.destroyEnemy(enemy, 50);
    });

    // Damage boss if active
    if (this.boss && this.boss.active) {
      this.bossHealth -= 8;
      this.drawBossHealth();
      if (this.bossHealth <= 0) {
        this.destroyBoss();
      }
    }

    this.updateHUD();
  }

  // ==========================================
  // PLAYER MOVEMENT & SHOOTING
  // ==========================================
  private handlePlayerMovement() {
    const speed = 240;
    let vx = 0;
    let vy = 0;

    if (this.cursors) {
      if (this.cursors.left?.isDown || this.keyA?.isDown) vx -= 1;
      if (this.cursors.right?.isDown || this.keyD?.isDown) vx += 1;
      if (this.cursors.up?.isDown || this.keyW?.isDown) vy -= 1;
      if (this.cursors.down?.isDown || this.keyS?.isDown) vy += 1;
    }

    if (this.virtualDir.x !== 0 || this.virtualDir.y !== 0) {
      vx = this.virtualDir.x;
      vy = this.virtualDir.y;
    }

    if (vx !== 0 && vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      vx /= len;
      vy /= len;
    }

    this.player.setVelocity(vx * speed, vy * speed);

    // Check bomb shortcut
    if (
      Phaser.Input.Keyboard.JustDown(this.keyK) ||
      Phaser.Input.Keyboard.JustDown(this.keyB)
    ) {
      this.triggerBomb();
    }
  }

  private handleFiring(time: number) {
    const isKeyDown =
      (this.cursors && this.cursors.space.isDown) ||
      (this.keySpace && this.keySpace.isDown) ||
      (this.keyJ && this.keyJ.isDown) ||
      this.virtualFiring;

    const fireRate = this.hasSpread ? 160 : 130;

    if (isKeyDown && time - this.lastFireTime > fireRate) {
      this.lastFireTime = time;
      this.firePlayerBullets();
    }
  }

  private firePlayerBullets() {
    this.callbacks.onPlaySfx?.('wind');
    const bx = this.player.x + 20;
    const by = this.player.y;

    if (this.hasSpread) {
      // 3-way spread
      this.spawnPlayerBullet(bx, by, 500, 0);
      this.spawnPlayerBullet(bx, by, 480, -90);
      this.spawnPlayerBullet(bx, by, 480, 90);
    } else {
      // Straight shot
      this.spawnPlayerBullet(bx, by, 550, 0);
    }
  }

  private spawnPlayerBullet(x: number, y: number, vx: number, vy: number) {
    const bullet = this.playerBullets.get(x, y) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setPosition(x, y);
      bullet.setVelocity(vx, vy);
      bullet.setDepth(14);
    }
  }

  // ==========================================
  // ENEMY SPAWNS & PATTERNS
  // ==========================================
  private updateEnemySpawns(time: number) {
    if (this.bossSpawned) return;

    // After 45 seconds or 25 enemies, spawn Boss!
    const elapsed = (Date.now() - this.gameStartTime) / 1000;
    if (elapsed > 40 || this.enemiesDefeated >= 25) {
      this.spawnBoss();
      return;
    }

    const interval = this.difficulty === 'master' ? 850 : this.difficulty === 'veteran' ? 1200 : 1600;
    if (time > this.nextSpawnTime) {
      this.nextSpawnTime = time + interval;
      this.spawnEnemyWave();
    }
  }

  private spawnEnemyWave() {
    const { width, height } = this.scale;
    const roll = Math.random();

    if (roll < 0.45) {
      // Sine wave Ink Blot
      const blot = this.enemies.create(
        width + 30,
        Phaser.Math.Between(50, height - 50),
        'impact-enemy-blot'
      ) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      blot.setVelocityX(-140);
      blot.setData('type', 'blot');
      blot.setData('hp', 2);
      blot.setData('baseY', blot.y);
      blot.setDepth(12);
    } else if (roll < 0.8) {
      // Fast diving Raven
      const raven = this.enemies.create(
        width + 30,
        Phaser.Math.Between(40, height * 0.4),
        'impact-enemy-raven'
      ) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      raven.setVelocityX(-220);
      raven.setVelocityY(40);
      raven.setData('type', 'raven');
      raven.setData('hp', 1);
      raven.setDepth(12);
    } else {
      // Shooting Squid
      const squid = this.enemies.create(
        width + 30,
        Phaser.Math.Between(60, height - 60),
        'impact-enemy-squid'
      ) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      squid.setVelocityX(-90);
      squid.setData('type', 'squid');
      squid.setData('hp', 3);
      squid.setData('lastShot', this.time.now);
      squid.setDepth(12);
    }
  }

  private updateEnemies(time: number) {
    this.enemies.getChildren().forEach((e) => {
      const enemy = e as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      if (!enemy.active) return;

      const type = enemy.getData('type') as string;
      if (type === 'blot') {
        const baseY = enemy.getData('baseY') as number;
        if (baseY !== undefined) {
          enemy.y = baseY + Math.sin(time * 0.005 + enemy.x * 0.02) * 35;
        }
      } else if (type === 'squid') {
        const lastShot = (enemy.getData('lastShot') as number) || 0;
        if (time - lastShot > 1800 && enemy.x > 60 && enemy.x < this.scale.width - 20) {
          enemy.setData('lastShot', time);
          this.callbacks.onPlaySfx?.('ink-splash');
          this.spawnEnemyBullet(enemy.x - 20, enemy.y, -210, 0);
        }
      }
    });
  }

  // ==========================================
  // BOSS ENCOUNTER
  // ==========================================
  private spawnBoss() {
    this.bossSpawned = true;
    const { width, height } = this.scale;

    this.callbacks.onPlaySfx?.('taiko-heavy');
    this.cameras.main.flash(500, 18, 18, 18);

    this.boss = this.physics.add.sprite(width + 80, height * 0.5, 'impact-boss');
    this.boss.setCollideWorldBounds(false);
    this.boss.setData('hp', this.bossHealth);
    this.boss.setDepth(16);

    // Slide in tween
    this.tweens.add({
      targets: this.boss,
      x: width * 0.78,
      duration: 2200,
      ease: 'Sine.easeOut',
      onComplete: () => {
        if (this.boss) {
          this.boss.setVelocityY(90);
        }
      },
    });

    this.drawBossHealth();
  }

  private updateBossBehavior(time: number) {
    if (!this.boss || !this.boss.active) return;

    const { height } = this.scale;
    // Bounce vertically
    if (this.boss.y > height - 80) {
      this.boss.setVelocityY(-90);
    } else if (this.boss.y < 80) {
      this.boss.setVelocityY(90);
    }

    // Boss attack bursts every 1.6s
    const lastAttack = (this.boss.getData('lastAttack') as number) || 0;
    if (time - lastAttack > 1600) {
      this.boss.setData('lastAttack', time);
      this.callbacks.onPlaySfx?.('ink-splash');

      // 3-way bullet fan
      const bx = this.boss.x - 40;
      const by = this.boss.y;
      this.spawnEnemyBullet(bx, by, -220, 0);
      this.spawnEnemyBullet(bx, by, -200, -80);
      this.spawnEnemyBullet(bx, by, -200, 80);
    }
  }

  private spawnEnemyBullet(x: number, y: number, vx: number, vy: number) {
    const b = this.enemyBullets.get(x, y) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    if (b) {
      b.setActive(true);
      b.setVisible(true);
      b.setPosition(x, y);
      b.setVelocity(vx, vy);
      b.setDepth(13);
    }
  }

  // ==========================================
  // COLLISION RESOLUTION
  // ==========================================
  private handleBulletHitEnemy(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const bullet = bulletObj as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    const enemy = enemyObj as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.destroy();

    // Check if it's the boss
    if (enemy === this.boss) {
      this.bossHealth -= 1;
      this.drawBossHealth();
      this.spawnInkSplat(bullet.x, bullet.y);
      this.callbacks.onPlaySfx?.('clash');
      if (this.bossHealth <= 0) {
        this.destroyBoss();
      }
      return;
    }

    let hp = (enemy.getData('hp') as number) || 1;
    hp -= 1;
    enemy.setData('hp', hp);

    this.spawnInkSplat(bullet.x, bullet.y);

    if (hp <= 0) {
      this.destroyEnemy(enemy, 100);
    }
  }

  private destroyEnemy(enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, points = 100) {
    this.score += points;
    this.enemiesDefeated += 1;
    this.callbacks.onScoreUpdate(this.score);
    this.callbacks.onPlaySfx?.('ink-splash');

    // Chance to drop powerup (15%)
    if (Math.random() < 0.18) {
      this.spawnPowerup(enemy.x, enemy.y);
    }

    this.spawnInkSplat(enemy.x, enemy.y);
    enemy.destroy();
    this.updateHUD();
  }

  private destroyBoss() {
    this.score += 2500;
    this.callbacks.onScoreUpdate(this.score);
    this.callbacks.onPlaySfx?.('taiko-heavy');
    this.callbacks.onPlaySfx?.('victory');
    this.cameras.main.flash(600, 244, 235, 208);
    this.cameras.main.shake(400, 0.03);

    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 120, () => {
        if (this.boss) {
          this.spawnInkSplat(
            this.boss.x + Phaser.Math.Between(-30, 30),
            this.boss.y + Phaser.Math.Between(-30, 30)
          );
        }
      });
    }

    this.time.delayedCall(900, () => {
      if (this.boss) this.boss.destroy();
      this.finishGame(true);
    });
  }

  private handlePlayerHitByBullet(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const bullet = bulletObj as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    bullet.destroy();
    this.damagePlayer();
  }

  private handlePlayerHitEnemy(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const enemy = enemyObj as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    if (enemy !== this.boss) {
      enemy.destroy();
    }
    this.damagePlayer();
  }

  private damagePlayer() {
    if (this.isInvulnerable || this.isGameOver) return;

    if (this.hasShield) {
      // Shield absorbs hit
      this.hasShield = false;
      this.callbacks.onPlaySfx?.('parry');
      this.cameras.main.flash(150, 72, 202, 228);
      this.makePlayerInvulnerable(800);
      this.updateHUD();
      return;
    }

    this.playerHealth -= 1;
    this.callbacks.onPlaySfx?.('heavy-strike');
    this.cameras.main.shake(200, 0.018);
    this.makePlayerInvulnerable(1400);
    this.updateHUD();

    if (this.playerHealth <= 0) {
      this.finishGame(false);
    }
  }

  private makePlayerInvulnerable(duration: number) {
    this.isInvulnerable = true;
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      yoyo: true,
      repeat: Math.floor(duration / 150),
      duration: 75,
      onComplete: () => {
        this.player.setAlpha(1);
        this.isInvulnerable = false;
      },
    });
  }

  private spawnPowerup(x: number, y: number) {
    const type = Math.random() < 0.5 ? 'power-spread' : 'power-shield';
    const p = this.powerups.create(x, y, type) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    p.setVelocityX(-80);
    p.setData('type', type);
    p.setDepth(13);
  }

  private handleCollectPowerup(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    powerupObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const p = powerupObj as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    const type = p.getData('type') as string;
    p.destroy();

    this.callbacks.onPlaySfx?.('seal-stamp');
    if (type === 'power-spread') {
      this.hasSpread = true;
    } else if (type === 'power-shield') {
      this.hasShield = true;
    }
    this.score += 200;
    this.callbacks.onScoreUpdate(this.score);
    this.updateHUD();
  }

  private finishGame(won: boolean) {
    this.isGameOver = true;
    this.player.setVelocity(0, 0);

    const duration = Math.round((Date.now() - this.gameStartTime) / 1000);
    this.time.delayedCall(1000, () => {
      this.callbacks.onGameOver({
        gameId: 'ink-impact',
        won,
        score: this.score,
        highScore: this.score,
        stats: {
          durationSeconds: duration,
          enemiesDefeated: this.enemiesDefeated,
        },
      });
    });
  }

  private spawnInkSplat(x: number, y: number) {
    const splat = this.add.image(x, y, 'impact-splat').setDepth(18);
    this.tweens.add({
      targets: splat,
      scale: 1.8,
      alpha: 0,
      duration: 350,
      onComplete: () => splat.destroy(),
    });
  }

  private cleanupOffscreenObjects() {
    this.playerBullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      if (bullet.x > this.scale.width + 40) bullet.destroy();
    });

    this.enemyBullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      if (bullet.x < -40) bullet.destroy();
    });

    this.enemies.getChildren().forEach((e) => {
      const enemy = e as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      if (enemy.x < -50) enemy.destroy();
    });

    this.powerups.getChildren().forEach((p) => {
      const power = p as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      if (power.x < -30) power.destroy();
    });
  }

  // ==========================================
  // BACKGROUND & SCROLLING CLOUDS
  // ==========================================
  private buildScrollingSky(width: number, height: number) {
    const bg = this.add.graphics();
    bg.fillStyle(0x181818, 1);
    bg.fillRect(0, 0, width, height);

    // Procedural ink clouds floating right to left
    for (let i = 0; i < 18; i++) {
      const cloud = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(10, height - 10),
        Phaser.Math.Between(20, 60),
        0x242424,
        0.35
      );
      cloud.setData('speed', Phaser.Math.FloatBetween(0.4, 1.2));
      cloud.setDepth(2);
      this.clouds.push(cloud);
    }
  }

  private updateBackgroundClouds() {
    for (const c of this.clouds) {
      c.x -= c.getData('speed') as number;
      if (c.x < -60) {
        c.x = this.scale.width + 60;
        c.y = Phaser.Math.Between(10, this.scale.height - 10);
      }
    }
  }

  // ==========================================
  // HUD
  // ==========================================
  private buildHUD(width: number, _height: number) {
    // Score
    this.scoreText = this.add
      .text(width * 0.05, 16, 'SCORE: 0', {
        fontFamily: "'Cinzel', monospace",
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#f4ebd0',
      })
      .setDepth(25);

    // Health Hearts
    for (let i = 0; i < 3; i++) {
      const h = this.add
        .text(width * 0.05 + i * 22, 38, '❤️', {
          fontSize: '14px',
        })
        .setDepth(25);
      this.hearts.push(h);
    }

    // Bombs
    for (let i = 0; i < 2; i++) {
      const b = this.add
        .text(width * 0.05 + i * 22, 60, '💣', {
          fontSize: '14px',
        })
        .setDepth(25);
      this.bombIcons.push(b);
    }

    // Boss Health Bar Graphic
    this.bossHealthBar = this.add.graphics().setDepth(25);
  }

  private updateHUD() {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.hearts.forEach((h, idx) => {
      h.setVisible(idx < this.playerHealth);
    });
    this.bombIcons.forEach((b, idx) => {
      b.setVisible(idx < this.bombsRemaining);
    });
  }

  private drawBossHealth() {
    this.bossHealthBar.clear();
    if (!this.bossSpawned || !this.boss || !this.boss.active) return;

    const { width } = this.scale;
    const barW = width * 0.4;
    const barH = 10;
    const x = width * 0.5 - barW / 2;
    const y = 20;

    // Background
    this.bossHealthBar.fillStyle(0x141414, 0.8);
    this.bossHealthBar.fillRect(x, y, barW, barH);
    this.bossHealthBar.lineStyle(1.5, 0x90e0ef, 0.9);
    this.bossHealthBar.strokeRect(x, y, barW, barH);

    // Fill
    const pct = Math.max(0, this.bossHealth / this.maxBossHealth);
    this.bossHealthBar.fillStyle(0xb3312c, 0.9);
    this.bossHealthBar.fillRect(x + 1, y + 1, (barW - 2) * pct, barH - 2);
  }
}
