import Phaser from 'phaser';
import { generateRogueOutlawTextures } from './outlawTextures';
import { ActionGameSceneCallbacks, ActionDifficulty } from '../actionGameTypes';

export interface RogueOutlawInitData {
  callbacks: ActionGameSceneCallbacks;
  difficulty?: ActionDifficulty;
}

export class RogueOutlawScene extends Phaser.Scene {
  private callbacks: ActionGameSceneCallbacks;
  private difficulty: ActionDifficulty;

  // Player
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private playerHealth = 4;
  private isRolling = false;
  private isInvulnerable = false;
  private rollCooldown = 0;
  private lastFireTime = 0;

  // Groups
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private rocks!: Phaser.Physics.Arcade.StaticGroup;
  private tumbleweeds: Phaser.GameObjects.Sprite[] = [];

  // Wave Manager
  private currentWave = 1;
  private enemiesRemainingToSpawn = 0;
  private lastSpawnTime = 0;
  private bossSpawned = false;
  private boss: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
  private bossHealth = 25;
  private maxBossHealth = 25;

  // Stats
  private score = 0;
  private banditsKilled = 0;
  private gameStartTime = 0;
  private isGameOver = false;

  // Controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;

  // Virtual inputs for touch
  private virtualMoveVector: { x: number; y: number } = { x: 0, y: 0 };

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private hearts: Phaser.GameObjects.Text[] = [];
  private bossBar!: Phaser.GameObjects.Graphics;

  constructor(data?: RogueOutlawInitData) {
    super({ key: 'RogueOutlawScene' });
    this.callbacks = data?.callbacks || { onGameOver: () => {}, onScoreUpdate: () => {} };
    this.difficulty = data?.difficulty || 'veteran';
  }

  init(data: RogueOutlawInitData) {
    if (data.callbacks) this.callbacks = data.callbacks;
    if (data.difficulty) this.difficulty = data.difficulty;
  }

  preload() {
    generateRogueOutlawTextures(this);
  }

  create() {
    const { width, height } = this.scale;
    this.gameStartTime = Date.now();
    this.score = 0;
    this.banditsKilled = 0;
    this.playerHealth = 4;
    this.currentWave = 1;
    this.isGameOver = false;
    this.bossSpawned = false;
    this.isRolling = false;

    // 1. Arena Floor & Obstacles
    this.buildArena(width, height);

    // 2. Physics Groups
    this.playerBullets = this.physics.add.group({
      defaultKey: 'outlaw-bullet-player',
      maxSize: 35,
    });
    this.enemyBullets = this.physics.add.group({
      defaultKey: 'outlaw-bullet-enemy',
      maxSize: 40,
    });
    this.enemies = this.physics.add.group();

    // 3. Create Player in Center
    this.player = this.physics.add.sprite(width * 0.5, height * 0.5, 'outlaw-player');
    this.player.setCollideWorldBounds(true);
    this.player.setSize(24, 24);
    this.player.setDepth(15);

    // 4. Setup Colliders
    this.physics.add.collider(this.player, this.rocks);
    this.physics.add.collider(this.enemies, this.rocks);

    this.physics.add.overlap(
      this.playerBullets,
      this.enemies,
      this.handleBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.playerBullets,
      this.rocks,
      this.handleBulletHitRock as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.enemyBullets,
      this.rocks,
      this.handleBulletHitRock as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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
      this.handlePlayerHitByEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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
      this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    }

    // Pointer fire
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.fireTowards(pointer.x, pointer.y);
      }
    });

    // 6. HUD
    this.buildHUD(width, height);

    // Start wave 1
    this.startWave(1);
  }

  update(time: number, delta: number) {
    if (this.isGameOver) return;

    this.handlePlayerMovement(time, delta);
    this.handleMouseAim();
    this.updateWaveSpawns(time);
    this.updateEnemyAI(time);
    this.updateTumbleweeds();
    this.cleanupOffscreenBullets();
  }

  // ==========================================
  // PUBLIC ACTIONS (Touch input)
  // ==========================================
  public setVirtualMove(vec: { x: number; y: number }) {
    this.virtualMoveVector = vec;
  }

  public setVirtualAim(vec: { x: number; y: number }) {
    if (Math.hypot(vec.x, vec.y) > 0.4) {
      this.player.setRotation(Math.atan2(vec.y, vec.x));
      this.fireTowards(this.player.x + vec.x * 200, this.player.y + vec.y * 200);
    }
  }

  public triggerRoll() {
    if (this.isRolling || this.rollCooldown > 0 || this.isGameOver) return;
    this.executeCombatRoll();
  }

  // ==========================================
  // MOVEMENT & COMBAT ROLL
  // ==========================================
  private handlePlayerMovement(_time: number, delta: number) {
    if (this.rollCooldown > 0) {
      this.rollCooldown -= delta;
    }

    if (this.isRolling) return;

    const speed = 190;
    let vx = 0;
    let vy = 0;

    if (this.cursors) {
      if (this.cursors.left.isDown || this.keyA.isDown) vx -= 1;
      if (this.cursors.right.isDown || this.keyD.isDown) vx += 1;
      if (this.cursors.up.isDown || this.keyW.isDown) vy -= 1;
      if (this.cursors.down.isDown || this.keyS.isDown) vy += 1;
    }

    if (this.virtualMoveVector.x !== 0 || this.virtualMoveVector.y !== 0) {
      vx = this.virtualMoveVector.x;
      vy = this.virtualMoveVector.y;
    }

    if (vx !== 0 && vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      vx /= len;
      vy /= len;
    }

    this.player.setVelocity(vx * speed, vy * speed);

    // Roll trigger
    if (
      (Phaser.Input.Keyboard.JustDown(this.keySpace) ||
        Phaser.Input.Keyboard.JustDown(this.keyShift)) &&
      this.rollCooldown <= 0
    ) {
      this.executeCombatRoll();
    }
  }

  private executeCombatRoll() {
    this.isRolling = true;
    this.isInvulnerable = true;
    this.rollCooldown = 750;
    this.callbacks.onPlaySfx?.('wind');

    this.player.setTexture('outlaw-player-roll');

    const angle = this.player.rotation;
    const rollSpeed = 360;
    this.player.setVelocity(Math.cos(angle) * rollSpeed, Math.sin(angle) * rollSpeed);

    this.time.delayedCall(360, () => {
      this.isRolling = false;
      this.isInvulnerable = false;
      this.player.setTexture('outlaw-player');
      this.player.setVelocity(0, 0);
    });
  }

  private handleMouseAim() {
    if (this.isRolling) return;
    const pointer = this.input.activePointer;
    if (pointer && pointer.isDown) {
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
      this.player.setRotation(angle);
      this.fireTowards(pointer.x, pointer.y);
    }
  }

  private fireTowards(targetX: number, targetY: number) {
    if (this.isRolling || this.isGameOver) return;
    const now = this.time.now;
    if (now - this.lastFireTime < 240) return;
    this.lastFireTime = now;

    this.callbacks.onPlaySfx?.('clash');
    this.cameras.main.shake(60, 0.005);

    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    this.player.setRotation(angle);

    const spawnDist = 18;
    const sx = this.player.x + Math.cos(angle) * spawnDist;
    const sy = this.player.y + Math.sin(angle) * spawnDist;

    const bullet = this.playerBullets.get(sx, sy) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setPosition(sx, sy);
      bullet.setRotation(angle);
      bullet.setVelocity(Math.cos(angle) * 520, Math.sin(angle) * 520);
      bullet.setDepth(14);
    }
  }

  // ==========================================
  // WAVES & ENEMY SPAWNS
  // ==========================================
  private startWave(waveNum: number) {
    this.currentWave = waveNum;
    this.waveText.setText(`WAVE ${this.currentWave}`);
    this.callbacks.onPlaySfx?.('taiko');

    const diffBonus = this.difficulty === 'master' ? 3 : this.difficulty === 'veteran' ? 0 : -2;
    if (waveNum === 1) {
      this.enemiesRemainingToSpawn = Math.max(5, 7 + diffBonus);
    } else if (waveNum === 2) {
      this.enemiesRemainingToSpawn = Math.max(8, 12 + diffBonus);
    } else if (waveNum === 3) {
      this.enemiesRemainingToSpawn = Math.max(5, 8 + diffBonus);
      this.spawnBoss();
    }
  }

  private updateWaveSpawns(time: number) {
    if (this.enemiesRemainingToSpawn > 0 && time - this.lastSpawnTime > 1400) {
      this.lastSpawnTime = time;
      this.enemiesRemainingToSpawn -= 1;
      this.spawnBandit();
    }

    // Check if wave is cleared
    if (
      this.enemiesRemainingToSpawn <= 0 &&
      this.enemies.countActive(true) === 0 &&
      (!this.boss || !this.boss.active)
    ) {
      if (this.currentWave < 3) {
        this.startWave(this.currentWave + 1);
      } else {
        // Victory!
        this.finishGame(true);
      }
    }
  }

  private spawnBandit() {
    const { width, height } = this.scale;
    // Spawn around edges
    const side = Phaser.Math.Between(0, 3);
    let x = 0;
    let y = 0;
    if (side === 0) {
      x = Phaser.Math.Between(0, width);
      y = 10;
    } else if (side === 1) {
      x = width - 10;
      y = Phaser.Math.Between(0, height);
    } else if (side === 2) {
      x = Phaser.Math.Between(0, width);
      y = height - 10;
    } else {
      x = 10;
      y = Phaser.Math.Between(0, height);
    }

    const isMarksman = this.currentWave >= 2 && Math.random() < 0.4;
    const type = isMarksman ? 'outlaw-enemy-marksman' : 'outlaw-enemy-rusher';

    const enemy = this.enemies.create(x, y, type) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    enemy.setData('type', isMarksman ? 'marksman' : 'rusher');
    enemy.setData('hp', isMarksman ? 2 : 1);
    enemy.setData('lastShot', this.time.now);
    enemy.setDepth(12);
  }

  private spawnBoss() {
    this.bossSpawned = true;
    const { width, height } = this.scale;

    this.callbacks.onPlaySfx?.('taiko-heavy');
    this.cameras.main.flash(400, 179, 49, 44);

    this.boss = this.physics.add.sprite(width * 0.85, height * 0.25, 'outlaw-boss-viper');
    this.boss.setData('hp', this.bossHealth);
    this.boss.setData('lastShot', this.time.now);
    this.boss.setDepth(16);

    this.drawBossHealth();
  }

  // ==========================================
  // ENEMY AI BEHAVIOR
  // ==========================================
  private updateEnemyAI(time: number) {
    this.enemies.getChildren().forEach((e) => {
      const enemy = e as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      if (!enemy.active) return;

      const type = enemy.getData('type') as string;
      const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      enemy.setRotation(angleToPlayer);

      if (type === 'rusher') {
        const speed = 120;
        enemy.setVelocity(Math.cos(angleToPlayer) * speed, Math.sin(angleToPlayer) * speed);
      } else if (type === 'marksman') {
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        if (dist < 180) {
          // Back away from player
          enemy.setVelocity(-Math.cos(angleToPlayer) * 80, -Math.sin(angleToPlayer) * 80);
        } else if (dist > 280) {
          // Advance
          enemy.setVelocity(Math.cos(angleToPlayer) * 70, Math.sin(angleToPlayer) * 70);
        } else {
          enemy.setVelocity(0, 0);
        }

        // Marksman shooting
        const lastShot = (enemy.getData('lastShot') as number) || 0;
        if (time - lastShot > 2100) {
          enemy.setData('lastShot', time);
          this.spawnEnemyBullet(enemy.x, enemy.y, angleToPlayer);
        }
      }
    });

    // Boss Viper AI
    if (this.boss && this.boss.active) {
      const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
      this.boss.setRotation(angle);

      // Circle around player
      const dist = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
      const strafeAngle = angle + Math.PI / 2;
      const strafeSpeed = 90;
      let vx = Math.cos(strafeAngle) * strafeSpeed;
      let vy = Math.sin(strafeAngle) * strafeSpeed;

      if (dist < 160) {
        vx -= Math.cos(angle) * 70;
        vy -= Math.sin(angle) * 70;
      } else if (dist > 260) {
        vx += Math.cos(angle) * 70;
        vy += Math.sin(angle) * 70;
      }
      this.boss.setVelocity(vx, vy);

      // Dual pistol firing bursts
      const lastShot = (this.boss.getData('lastShot') as number) || 0;
      if (time - lastShot > 1300) {
        this.boss.setData('lastShot', time);
        this.callbacks.onPlaySfx?.('heavy-strike');
        this.spawnEnemyBullet(this.boss.x, this.boss.y, angle - 0.15);
        this.spawnEnemyBullet(this.boss.x, this.boss.y, angle + 0.15);
      }
    }
  }

  private spawnEnemyBullet(x: number, y: number, angle: number) {
    const bullet = this.enemyBullets.get(x, y) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setPosition(x, y);
      bullet.setRotation(angle);
      const speed = 250;
      bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      bullet.setDepth(13);
    }
  }

  // ==========================================
  // COLLISIONS & DAMAGE
  // ==========================================
  private handleBulletHitEnemy(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    const bullet = bulletObj as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    const enemy = enemyObj as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

    bullet.destroy();

    if (enemy === this.boss) {
      this.bossHealth -= 1;
      this.drawBossHealth();
      this.callbacks.onPlaySfx?.('clash');
      if (this.bossHealth <= 0) {
        this.destroyBoss();
      }
      return;
    }

    let hp = (enemy.getData('hp') as number) || 1;
    hp -= 1;
    enemy.setData('hp', hp);

    if (hp <= 0) {
      this.score += 150;
      this.banditsKilled += 1;
      this.callbacks.onScoreUpdate(this.score);
      this.callbacks.onPlaySfx?.('ink-splash');
      enemy.destroy();
      this.updateHUD();
    }
  }

  private handleBulletHitRock(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _rockObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    bulletObj.destroy();
    this.callbacks.onPlaySfx?.('clash');
  }

  private handlePlayerHitByBullet(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    bulletObj.destroy();
    this.damagePlayer();
  }

  private handlePlayerHitByEnemy(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    this.damagePlayer();
  }

  private damagePlayer() {
    if (this.isInvulnerable || this.isGameOver) return;

    this.playerHealth -= 1;
    this.callbacks.onPlaySfx?.('heavy-strike');
    this.cameras.main.shake(200, 0.02);
    this.updateHUD();

    if (this.playerHealth <= 0) {
      this.finishGame(false);
      return;
    }

    // Brief hit invulnerability
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

  private destroyBoss() {
    this.score += 3000;
    this.callbacks.onScoreUpdate(this.score);
    this.callbacks.onPlaySfx?.('taiko-heavy');
    this.callbacks.onPlaySfx?.('victory');
    this.cameras.main.flash(500, 244, 235, 208);

    if (this.boss) {
      this.boss.destroy();
      this.boss = null;
    }

    this.time.delayedCall(1000, () => {
      this.finishGame(true);
    });
  }

  private finishGame(won: boolean) {
    this.isGameOver = true;
    this.player.setVelocity(0, 0);

    const duration = Math.round((Date.now() - this.gameStartTime) / 1000);
    this.time.delayedCall(1000, () => {
      this.callbacks.onGameOver({
        gameId: 'rogue-outlaw',
        won,
        score: this.score,
        highScore: this.score,
        stats: {
          durationSeconds: duration,
          enemiesDefeated: this.banditsKilled,
        },
      });
    });
  }

  private cleanupOffscreenBullets() {
    const { width, height } = this.scale;
    this.playerBullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      if (bullet.x < -20 || bullet.x > width + 20 || bullet.y < -20 || bullet.y > height + 20) {
        bullet.destroy();
      }
    });

    this.enemyBullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      if (bullet.x < -20 || bullet.x > width + 20 || bullet.y < -20 || bullet.y > height + 20) {
        bullet.destroy();
      }
    });
  }

  // ==========================================
  // ARENA & TUMBLEWEEDS
  // ==========================================
  private buildArena(width: number, height: number) {
    const arena = this.add.graphics();
    // Scorched Red Desert Sand
    arena.fillStyle(0x1a1414, 1);
    arena.fillRect(0, 0, width, height);

    // Sandstone dust patches
    arena.fillStyle(0x2d1f1f, 0.4);
    arena.fillCircle(width * 0.3, height * 0.4, 140);
    arena.fillCircle(width * 0.7, height * 0.6, 160);

    // Canyon borders
    arena.lineStyle(4, 0xb3312c, 0.7);
    arena.strokeRect(10, 10, width - 20, height - 20);

    // Rock Covers
    this.rocks = this.physics.add.staticGroup();
    const rockCoords = [
      { x: width * 0.25, y: height * 0.3 },
      { x: width * 0.75, y: height * 0.3 },
      { x: width * 0.25, y: height * 0.7 },
      { x: width * 0.75, y: height * 0.7 },
      { x: width * 0.5, y: height * 0.2 },
      { x: width * 0.5, y: height * 0.8 },
    ];

    rockCoords.forEach((c) => {
      const rock = this.rocks.create(c.x, c.y, 'outlaw-rock') as Phaser.Physics.Arcade.Image;
      rock.setSize(40, 30);
      (rock.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    });

    // Drifting tumbleweeds
    for (let i = 0; i < 3; i++) {
      const tw = this.add.sprite(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        'outlaw-tumbleweed'
      );
      tw.setData('vx', Phaser.Math.FloatBetween(0.6, 1.4));
      tw.setData('vy', Phaser.Math.FloatBetween(0.3, 0.8));
      tw.setDepth(5);
      this.tumbleweeds.push(tw);
    }
  }

  private updateTumbleweeds() {
    const { width, height } = this.scale;
    this.tumbleweeds.forEach((tw) => {
      tw.x += tw.getData('vx') as number;
      tw.y += tw.getData('vy') as number;
      tw.rotation += 0.04;
      if (tw.x > width + 30) tw.x = -30;
      if (tw.y > height + 30) tw.y = -30;
    });
  }

  // ==========================================
  // HUD
  // ==========================================
  private buildHUD(width: number, _height: number) {
    this.scoreText = this.add
      .text(width * 0.05, 14, 'SCORE: 0', {
        fontFamily: "'Cinzel', monospace",
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#f4ebd0',
      })
      .setDepth(25);

    this.waveText = this.add
      .text(width * 0.5, 14, 'WAVE 1', {
        fontFamily: "'Cinzel', serif",
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#b3312c',
      })
      .setOrigin(0.5, 0)
      .setDepth(25);

    // Hearts
    for (let i = 0; i < 4; i++) {
      const h = this.add
        .text(width * 0.05 + i * 22, 36, '❤️', {
          fontSize: '14px',
        })
        .setDepth(25);
      this.hearts.push(h);
    }

    this.bossBar = this.add.graphics().setDepth(25);
  }

  private updateHUD() {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.hearts.forEach((h, idx) => {
      h.setVisible(idx < this.playerHealth);
    });
  }

  private drawBossHealth() {
    this.bossBar.clear();
    if (!this.bossSpawned || !this.boss || !this.boss.active) return;

    const { width } = this.scale;
    const barW = width * 0.45;
    const barH = 10;
    const x = width * 0.5 - barW / 2;
    const y = 38;

    this.bossBar.fillStyle(0x141414, 0.8);
    this.bossBar.fillRect(x, y, barW, barH);
    this.bossBar.lineStyle(1.5, 0xb3312c, 0.9);
    this.bossBar.strokeRect(x, y, barW, barH);

    const pct = Math.max(0, this.bossHealth / this.maxBossHealth);
    this.bossBar.fillStyle(0xb3312c, 0.95);
    this.bossBar.fillRect(x + 1, y + 1, (barW - 2) * pct, barH - 2);
  }
}
