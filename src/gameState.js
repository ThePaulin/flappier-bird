"use strict";

const constants = require("./constants");
const { createBird, createPipe, createPlayerBullet, createEnemyBullet, createEnemy, createPowerup } = require("./entities");
const { circleRectCollision, circleCircleCollision } = require("./collision");
const { loadHighScore, saveHighScore } = require("./storage");

class GameState {
  constructor(options = {}) {
    this._storage = options.storage || global.localStorage;
    this._performance = options.performance || global.performance;
    this._onScoreChange = options.onScoreChange || (() => {});
    this._onGameOver = options.onGameOver || (() => {});
    this._onDeath = options.onDeath || (() => {});
    
    this.reset();
  }

  reset() {
    this.bird = createBird();
    this.pipes = [];
    this.playerBullets = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.powerups = [];
    this.score = 0;
    this.highScore = loadHighScore(this._storage);
    this.playerHealth = constants.PLAYER_MAX_HEALTH;
    this.scoreMultiplier = 1;
    this.lastPipeSpawn = 0;
    this.lastBulletFire = 0;
    this.lastEnemySpawn = 0;
    this.lastPowerupSpawn = 0;
    this.groundOffset = 0;
    this.flashTimer = 0;
    this.isFiring = false;
    this.invincibilityTimer = 0;
    this.multishotTimer = 0;
    this.multiplierTimer = 0;
    this.invincibilityFlashTimer = 0;
    this.gameState = constants.STATE.READY;
  }

  currentGap() {
    const shrink = Math.floor(this.score / 5) * 4;
    return Math.max(constants.GAP_SIZE_MIN, constants.GAP_SIZE_BASE - shrink);
  }

  currentSpeed() {
    return constants.PIPE_SPEED_BASE + Math.floor(this.score / 5) * constants.PIPE_SPEED_INCREMENT;
  }

  currentEnemySpeed() {
    return constants.ENEMY_SPEED_BASE + Math.floor(this.score / 10) * 0.3;
  }

  flapBird() {
    this.bird.vy = constants.FLAP_STRENGTH;
    this.bird.flapFrame = 8;
  }

  fireBullet(timestamp) {
    if (timestamp - this.lastBulletFire < constants.BULLET_COOLDOWN) return;
    
    this.lastBulletFire = timestamp;
    const bulletX = this.bird.x + constants.BIRD_RADIUS;
    const bulletY = this.bird.y;
    
    if (this.multishotTimer > 0) {
      this.playerBullets.push(createPlayerBullet(bulletX, bulletY, -0.5));
      this.playerBullets.push(createPlayerBullet(bulletX, bulletY, 0));
      this.playerBullets.push(createPlayerBullet(bulletX, bulletY, 0.5));
    } else {
      this.playerBullets.push(createPlayerBullet(bulletX, bulletY, 0));
    }
  }

  updateBird(dt) {
    this.bird.vy += constants.GRAVITY * dt;
    this.bird.y += this.bird.vy * dt;
    this.bird.flapFrame = Math.max(0, this.bird.flapFrame - 1);

    const targetRot = Math.max(-30, Math.min(90, this.bird.vy * 3));
    this.bird.rotation += (targetRot - this.bird.rotation) * 0.15 * dt;

    if (this.bird.y - constants.BIRD_RADIUS < 0) {
      this.bird.y = constants.BIRD_RADIUS;
      this.bird.vy = 0;
    }
  }

  updatePipes(dt) {
    const speed = this.currentSpeed();
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.x -= speed * dt;

      if (!pipe.scored && pipe.x + constants.PIPE_WIDTH / 2 < this.bird.x) {
        pipe.scored = true;
        this.score += this.scoreMultiplier;
        this._onScoreChange(this.score);
        if (this.score > this.highScore) {
          this.highScore = this.score;
          saveHighScore(this.highScore, this._storage);
        }
      }

      if (pipe.x + constants.PIPE_WIDTH < -10) {
        this.pipes.splice(i, 1);
      }
    }
  }

  updatePlayerBullets(dt) {
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;

      if (bullet.x > constants.GAME_WIDTH + 50 || bullet.y < -50 || bullet.y > constants.GAME_HEIGHT + 50) {
        this.playerBullets.splice(i, 1);
      }
    }
  }

  updateEnemyBullets(dt) {
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;

      if (bullet.x < -50 || bullet.x > constants.GAME_WIDTH + 50 || bullet.y < -50 || bullet.y > constants.GAME_HEIGHT + 50) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  updateEnemies(dt, timestamp) {
    const speed = this.currentEnemySpeed();
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.x -= speed * dt;

      if (timestamp - enemy.lastFire > enemy.fireDelay) {
        enemy.lastFire = timestamp;
        this.enemyBullets.push(createEnemyBullet(enemy.x, enemy.y, this.bird.x, this.bird.y));
      }

      if (enemy.x + enemy.radius < -10) {
        this.enemies.splice(i, 1);
      }
    }
  }

  updatePowerups(dt) {
    const speed = this.currentSpeed();
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      powerup.x -= speed * dt;
      powerup.pulseTimer += dt;

      if (powerup.x + powerup.radius < -10) {
        this.powerups.splice(i, 1);
      }
    }
  }

  updateTimers(dt) {
    const dtMs = dt * 16.667;
    
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= dtMs;
      this.invincibilityFlashTimer += dtMs;
    }
    if (this.multishotTimer > 0) {
      this.multishotTimer -= dtMs;
    }
    if (this.multiplierTimer > 0) {
      this.multiplierTimer -= dtMs;
      if (this.multiplierTimer <= 0) {
        this.scoreMultiplier = 1;
      }
    }
  }

  checkCollision() {
    if (this.bird.y + constants.BIRD_RADIUS >= constants.GROUND_Y) {
      this.bird.y = constants.GROUND_Y - constants.BIRD_RADIUS;
      return true;
    }

    for (const pipe of this.pipes) {
      if (circleRectCollision(this.bird.x, this.bird.y, constants.BIRD_RADIUS - 2, pipe.x, 0, constants.PIPE_WIDTH, pipe.topHeight)) {
        return true;
      }
      if (circleRectCollision(this.bird.x, this.bird.y, constants.BIRD_RADIUS - 2, pipe.x, pipe.bottomY, constants.PIPE_WIDTH, constants.GROUND_Y - pipe.bottomY)) {
        return true;
      }
    }

    return false;
  }

  checkCombatCollisions() {
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (circleCircleCollision(bullet.x, bullet.y, bullet.radius, enemy.x, enemy.y, enemy.radius)) {
          this.playerBullets.splice(i, 1);
          enemy.health--;
          if (enemy.health <= 0) {
            this.enemies.splice(j, 1);
            this.score += 2 * this.scoreMultiplier;
            if (this.score > this.highScore) {
              this.highScore = this.score;
              saveHighScore(this.highScore, this._storage);
            }
          }
          break;
        }
      }
    }

    if (this.invincibilityTimer <= 0) {
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = this.enemyBullets[i];
        if (circleCircleCollision(bullet.x, bullet.y, bullet.radius, this.bird.x, this.bird.y, constants.BIRD_RADIUS - 2)) {
          this.enemyBullets.splice(i, 1);
          this.playerHealth--;
          this.invincibilityTimer = 1000;
          if (this.playerHealth <= 0) {
            return true;
          }
          break;
        }
      }
    }

    if (this.invincibilityTimer <= 0) {
      for (const enemy of this.enemies) {
        if (circleCircleCollision(this.bird.x, this.bird.y, constants.BIRD_RADIUS - 2, enemy.x, enemy.y, enemy.radius)) {
          this.playerHealth--;
          this.invincibilityTimer = 1000;
          if (this.playerHealth <= 0) {
            return true;
          }
          break;
        }
      }
    }

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      if (circleCircleCollision(this.bird.x, this.bird.y, constants.BIRD_RADIUS, powerup.x, powerup.y, powerup.radius)) {
        this.powerups.splice(i, 1);
        this.applyPowerup(powerup.type);
      }
    }

    return false;
  }

  applyPowerup(type) {
    switch (type) {
      case constants.POWERUP_TYPES.INVINCIBILITY:
        this.invincibilityTimer = constants.INVINCIBILITY_DURATION;
        break;
      case constants.POWERUP_TYPES.MULTISHOT:
        this.multishotTimer = constants.MULTISHOT_DURATION;
        break;
      case constants.POWERUP_TYPES.SCORE_MULTIPLIER:
        this.multiplierTimer = constants.SCORE_MULTIPLIER_DURATION;
        this.scoreMultiplier = 2;
        break;
    }
  }

  spawnPipe(timestamp) {
    if (timestamp - this.lastPipeSpawn > constants.PIPE_SPAWN_INTERVAL) {
      this.pipes.push(createPipe(this.currentGap()));
      this.lastPipeSpawn = timestamp;
    }
  }

  spawnEnemy(timestamp) {
    if (timestamp - this.lastEnemySpawn > constants.ENEMY_SPAWN_INTERVAL) {
      this.enemies.push(createEnemy());
      this.lastEnemySpawn = timestamp;
    }
  }

  spawnPowerup(timestamp) {
    if (timestamp - this.lastPowerupSpawn > constants.POWERUP_SPAWN_INTERVAL) {
      this.powerups.push(createPowerup());
      this.lastPowerupSpawn = timestamp;
    }
  }

  startGame(timestamp) {
    this.gameState = constants.STATE.PLAYING;
    this.bird.vy = 0;
    this.lastPipeSpawn = timestamp;
    this.lastEnemySpawn = timestamp;
    this.lastPowerupSpawn = timestamp;
    this.flapBird();
  }

  endGame() {
    this.gameState = constants.STATE.GAME_OVER;
    this.flashTimer = 6;
    this._onGameOver();
  }

  die() {
    this.endGame();
    this._onDeath();
  }

  get isInvincible() {
    return this.invincibilityTimer > 0;
  }

  get shouldFlash() {
    return this.invincibilityTimer > 0 && Math.floor(this.invincibilityFlashTimer / constants.INVINCIBILITY_FLASH_INTERVAL) % 2 === 0;
  }
}

module.exports = { GameState };
