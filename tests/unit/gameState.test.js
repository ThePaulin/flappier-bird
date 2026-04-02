"use strict";

const { GameState } = require("../../src/gameState");
const constants = require("../../src/constants");

describe("GameState", () => {
  let gameState;
  let mockStorage;

  beforeEach(() => {
    mockStorage = {
      _data: {},
      getItem: function(key) {
        return this._data[key] !== undefined ? this._data[key] : null;
      },
      setItem: function(key, value) {
        this._data[key] = value;
      }
    };

    gameState = new GameState({ storage: mockStorage });
  });

  describe("constructor", () => {
    test("initializes with default options", () => {
      expect(gameState.bird).toBeDefined();
      expect(gameState.gameState).toBe(constants.STATE.READY);
    });

    test("uses provided storage", () => {
      expect(gameState._storage).toBe(mockStorage);
    });
  });

  describe("reset", () => {
    test("resets all state to initial values", () => {
      gameState.score = 100;
      gameState.playerHealth = 1;
      gameState.gameState = constants.STATE.PLAYING;
      
      gameState.reset();
      
      expect(gameState.score).toBe(0);
      expect(gameState.playerHealth).toBe(constants.PLAYER_MAX_HEALTH);
      expect(gameState.gameState).toBe(constants.STATE.READY);
    });

    test("clears all entities", () => {
      gameState.pipes.push({});
      gameState.enemies.push({});
      gameState.playerBullets.push({});
      
      gameState.reset();
      
      expect(gameState.pipes).toEqual([]);
      expect(gameState.enemies).toEqual([]);
      expect(gameState.playerBullets).toEqual([]);
    });
  });

  describe("flapBird", () => {
    test("applies flap strength to bird velocity", () => {
      gameState.flapBird();
      expect(gameState.bird.vy).toBe(constants.FLAP_STRENGTH);
    });

    test("sets flap frame for animation", () => {
      gameState.flapBird();
      expect(gameState.bird.flapFrame).toBe(8);
    });
  });

  describe("fireBullet", () => {
    test("creates bullet when cooldown passed", () => {
      gameState.lastBulletFire = 0;
      gameState.fireBullet(500);
      
      expect(gameState.playerBullets.length).toBe(1);
    });

    test("does not fire when on cooldown", () => {
      gameState.lastBulletFire = 100;
      gameState.fireBullet(150);
      
      expect(gameState.playerBullets.length).toBe(0);
    });

    test("fires multiple bullets when multishot active", () => {
      gameState.multishotTimer = 1000;
      gameState.lastBulletFire = 0;
      gameState.fireBullet(500);
      
      expect(gameState.playerBullets.length).toBe(3);
    });
  });

  describe("updateBird", () => {
    test("applies gravity", () => {
      gameState.bird.vy = 0;
      gameState.updateBird(1);
      
      expect(gameState.bird.vy).toBe(constants.GRAVITY);
    });

    test("clamps bird at ceiling", () => {
      gameState.bird.y = 10;
      gameState.bird.vy = -10;
      gameState.updateBird(1);
      
      expect(gameState.bird.y).toBe(constants.BIRD_RADIUS);
      expect(gameState.bird.vy).toBe(0);
    });
  });

  describe("updatePipes", () => {
    test("moves pipes left", () => {
      gameState.pipes.push({ x: 400, scored: false });
      gameState.updatePipes(1);
      
      expect(gameState.pipes[0].x).toBeLessThan(400);
    });

    test("increments score when bird passes pipe", () => {
      gameState.bird.x = 100;
      gameState.pipes.push({ x: 60, scored: false });
      gameState.score = 0;
      gameState.updatePipes(1);
      
      expect(gameState.score).toBe(1);
    });

    test("removes offscreen pipes", () => {
      gameState.pipes.push({ x: -100, scored: true });
      gameState.updatePipes(1);
      
      expect(gameState.pipes.length).toBe(0);
    });
  });

  describe("updatePlayerBullets", () => {
    test("moves bullets right", () => {
      gameState.playerBullets.push({ x: 50, y: 100, vx: 12, vy: 0 });
      gameState.updatePlayerBullets(1);
      
      expect(gameState.playerBullets[0].x).toBeGreaterThan(50);
    });

    test("removes offscreen bullets", () => {
      gameState.playerBullets.push({ x: 500, y: 100, vx: 12, vy: 0 });
      gameState.updatePlayerBullets(1);
      
      expect(gameState.playerBullets.length).toBe(0);
    });
  });

  describe("updateEnemies", () => {
    test("moves enemies left", () => {
      gameState.enemies.push({ x: 100, y: 100, radius: 12, health: 1, lastFire: 0, fireDelay: 2000 });
      gameState.updateEnemies(1, 1000);
      
      expect(gameState.enemies[0].x).toBeLessThan(100);
    });

    test("removes offscreen enemies", () => {
      gameState.enemies.push({ x: -25, y: 100, radius: 12, health: 1, lastFire: 0, fireDelay: 2000 });
      gameState.updateEnemies(1, 1000);
      
      expect(gameState.enemies.length).toBe(0);
    });
  });

  describe("checkCollision", () => {
    test("detects ground collision", () => {
      gameState.bird.y = 530;
      
      expect(gameState.checkCollision()).toBe(true);
    });

    test("detects pipe collision", () => {
      gameState.bird.x = 80;
      gameState.bird.y = 100;
      gameState.pipes.push({
        x: 70,
        topHeight: 150,
        bottomY: 250
      });
      
      expect(gameState.checkCollision()).toBe(true);
    });

    test("returns false when no collision", () => {
      gameState.bird.x = 80;
      gameState.bird.y = 200;
      gameState.pipes.push({
        x: 300,
        topHeight: 150,
        bottomY: 250
      });
      
      expect(gameState.checkCollision()).toBe(false);
    });
  });

  describe("checkCombatCollisions", () => {
    test("detects bullet-enemy collision", () => {
      gameState.playerBullets.push({ x: 100, y: 100, radius: 5 });
      gameState.enemies.push({ x: 100, y: 100, radius: 12, health: 1 });

      expect(gameState.checkCombatCollisions()).toBe(false);
      expect(gameState.enemies.length).toBe(0);
    });

    test("notifies with total score when enemy defeated", () => {
      const onScoreChange = jest.fn();
      gameState = new GameState({ storage: mockStorage, onScoreChange });
      gameState.playerBullets.push({ x: 120, y: 120, radius: 5 });
      gameState.enemies.push({ x: 120, y: 120, radius: 12, health: 1 });

      gameState.checkCombatCollisions();

      expect(onScoreChange).toHaveBeenCalledWith(2);
      expect(mockStorage._data.flappyHighScore).toBe(2);
    });

    test("damages player on enemy bullet collision", () => {
      gameState.bird.x = 80;
      gameState.bird.y = 300;
      gameState.enemyBullets.push({ x: 80, y: 300, radius: 5 });
      const initialHealth = gameState.playerHealth;
      
      gameState.checkCombatCollisions();
      
      expect(gameState.playerHealth).toBeLessThan(initialHealth);
    });

    test("skips damage when invincible", () => {
      gameState.invincibilityTimer = 1000;
      gameState.enemyBullets.push({ x: 80, y: 300, radius: 5 });
      const initialHealth = gameState.playerHealth;
      
      gameState.checkCombatCollisions();
      
      expect(gameState.playerHealth).toBe(initialHealth);
    });

    test("collects powerups", () => {
      gameState.bird.x = 80;
      gameState.bird.y = 300;
      gameState.powerups.push({ x: 80, y: 300, radius: 10, type: 0, pulseTimer: 0 });
      
      gameState.checkCombatCollisions();
      
      expect(gameState.powerups.length).toBe(0);
      expect(gameState.invincibilityTimer).toBeGreaterThan(0);
    });
  });

  describe("applyPowerup", () => {
    test("applies invincibility", () => {
      gameState.applyPowerup(constants.POWERUP_TYPES.INVINCIBILITY);
      
      expect(gameState.invincibilityTimer).toBe(constants.INVINCIBILITY_DURATION);
    });

    test("applies multishot", () => {
      gameState.applyPowerup(constants.POWERUP_TYPES.MULTISHOT);
      
      expect(gameState.multishotTimer).toBe(constants.MULTISHOT_DURATION);
    });

    test("applies score multiplier", () => {
      gameState.applyPowerup(constants.POWERUP_TYPES.SCORE_MULTIPLIER);
      
      expect(gameState.scoreMultiplier).toBe(2);
      expect(gameState.multiplierTimer).toBe(constants.SCORE_MULTIPLIER_DURATION);
    });
  });

  describe("spawn methods", () => {
    test("spawnPipe creates pipe on interval", () => {
      gameState.lastPipeSpawn = 0;
      gameState.spawnPipe(2000);
      
      expect(gameState.pipes.length).toBe(1);
    });

    test("spawnEnemy creates enemy on interval", () => {
      gameState.lastEnemySpawn = 0;
      gameState.spawnEnemy(4000);
      
      expect(gameState.enemies.length).toBe(1);
    });

    test("spawnPowerup creates powerup on interval", () => {
      gameState.lastPowerupSpawn = 0;
      gameState.spawnPowerup(9000);
      
      expect(gameState.powerups.length).toBe(1);
    });
  });

  describe("game state transitions", () => {
    test("startGame transitions to PLAYING", () => {
      gameState.startGame(1000);
      
      expect(gameState.gameState).toBe(constants.STATE.PLAYING);
    });

    test("endGame transitions to GAME_OVER", () => {
      gameState.endGame();
      
      expect(gameState.gameState).toBe(constants.STATE.GAME_OVER);
      expect(gameState.flashTimer).toBe(6);
    });

    test("die triggers endGame and callback", () => {
      const deathCallback = jest.fn();
      gameState = new GameState({ storage: mockStorage, onDeath: deathCallback });
      
      gameState.die();
      
      expect(gameState.gameState).toBe(constants.STATE.GAME_OVER);
      expect(deathCallback).toHaveBeenCalled();
    });
  });

  describe("computed properties", () => {
    test("isInvincible returns true when timer > 0", () => {
      gameState.invincibilityTimer = 1000;
      expect(gameState.isInvincible).toBe(true);
    });

    test("isInvincible returns false when timer = 0", () => {
      gameState.invincibilityTimer = 0;
      expect(gameState.isInvincible).toBe(false);
    });

    test("shouldFlash alternates based on timer", () => {
      gameState.invincibilityTimer = 1000;
      gameState.invincibilityFlashTimer = 0;
      expect(gameState.shouldFlash).toBe(true);
      
      gameState.invincibilityFlashTimer = 150;
      expect(gameState.shouldFlash).toBe(false);
    });
  });
});
