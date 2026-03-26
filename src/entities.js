"use strict";

const constants = require("./constants");
const { randomRange } = require("./math");

function createBird() {
  return {
    x: constants.BIRD_X,
    y: constants.GAME_HEIGHT / 2 - 30,
    vy: 0,
    rotation: 0,
    flapFrame: 0
  };
}

function createPipe(gapOverride) {
  const gap = gapOverride !== undefined ? gapOverride : currentGap();
  const minTop = 60;
  const maxTop = constants.GROUND_Y - gap - 60;
  const topHeight = randomRange(minTop, maxTop);

  return {
    x: constants.GAME_WIDTH + constants.PIPE_WIDTH,
    topHeight: topHeight,
    bottomY: topHeight + gap,
    scored: false
  };
}

function currentGap() {
  return constants.GAP_SIZE_BASE;
}

function currentEnemySpeed() {
  return constants.ENEMY_SPEED_BASE;
}

function createPlayerBullet(x, y, spread = 0) {
  return {
    x: x,
    y: y,
    vx: constants.BULLET_SPEED,
    vy: spread * constants.BULLET_SPEED * 0.3,
    radius: constants.BULLET_RADIUS
  };
}

function createEnemyBullet(x, y, targetX, targetY) {
  const dx = targetX - x;
  const dy = targetY - y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const speed = constants.ENEMY_BULLET_SPEED;

  return {
    x: x,
    y: y,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    radius: constants.BULLET_RADIUS
  };
}

function createEnemy() {
  const minY = 60;
  const maxY = constants.GROUND_Y - 60;
  const y = randomRange(minY, maxY);

  return {
    x: constants.GAME_WIDTH + constants.ENEMY_RADIUS,
    y: y,
    radius: constants.ENEMY_RADIUS,
    health: 1,
    lastFire: 0,
    fireDelay: constants.ENEMY_FIRE_INTERVAL + Math.random() * 1000
  };
}

function createPowerup() {
  const minY = 60;
  const maxY = constants.GROUND_Y - 60;
  const y = randomRange(minY, maxY);
  const type = Math.floor(Math.random() * 3);

  return {
    x: constants.GAME_WIDTH + constants.POWERUP_RADIUS,
    y: y,
    radius: constants.POWERUP_RADIUS,
    type: type,
    pulseTimer: 0
  };
}

function createGameState() {
  return {
    bird: createBird(),
    pipes: [],
    playerBullets: [],
    enemies: [],
    enemyBullets: [],
    powerups: [],
    score: 0,
    highScore: 0,
    playerHealth: constants.PLAYER_MAX_HEALTH,
    scoreMultiplier: 1,
    lastPipeSpawn: 0,
    lastBulletFire: 0,
    lastEnemySpawn: 0,
    lastPowerupSpawn: 0,
    groundOffset: 0,
    flashTimer: 0,
    isFiring: false,
    invincibilityTimer: 0,
    multishotTimer: 0,
    multiplierTimer: 0,
    invincibilityFlashTimer: 0,
    gameState: constants.STATE.READY
  };
}

module.exports = {
  createBird,
  createPipe,
  createPlayerBullet,
  createEnemyBullet,
  createEnemy,
  createPowerup,
  createGameState,
  currentGap,
  currentEnemySpeed
};
