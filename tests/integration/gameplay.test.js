"use strict";

const { GameState } = require("../../src/gameState");
const constants = require("../../src/constants");

describe("Game Integration", () => {
  let mockStorage;
  let gameState;

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

  describe("Full game loop scenarios", () => {
    test("complete gameplay flow from ready to game over", () => {
      expect(gameState.gameState).toBe(constants.STATE.READY);
      
      gameState.startGame(1000);
      expect(gameState.gameState).toBe(constants.STATE.PLAYING);
      
      gameState.die();
      expect(gameState.gameState).toBe(constants.STATE.GAME_OVER);
      
      gameState.reset();
      expect(gameState.gameState).toBe(constants.STATE.READY);
    });

    test("score increases and high score persists", () => {
      gameState.score = 10;
      gameState.highScore = 5;
      gameState.pipes.push({ x: 60, scored: false });
      gameState.bird.x = 100;
      
      gameState.updatePipes(1);
      
      expect(gameState.score).toBe(11);
      expect(gameState.highScore).toBe(11);
      expect(mockStorage._data["flappyHighScore"]).toBe(11);
    });

    test("player takes damage and dies", () => {
      gameState.playerHealth = 1;
      gameState.invincibilityTimer = 0;
      gameState.bird.x = 80;
      gameState.bird.y = 300;
      gameState.enemyBullets.push({ x: 80, y: 300, radius: 5 });
      
      const result = gameState.checkCombatCollisions();
      
      expect(result).toBe(true);
      expect(gameState.playerHealth).toBe(0);
    });

    test("multiple powerups stack correctly", () => {
      gameState.applyPowerup(constants.POWERUP_TYPES.INVINCIBILITY);
      gameState.applyPowerup(constants.POWERUP_TYPES.MULTISHOT);
      gameState.applyPowerup(constants.POWERUP_TYPES.SCORE_MULTIPLIER);
      
      expect(gameState.invincibilityTimer).toBeGreaterThan(0);
      expect(gameState.multishotTimer).toBeGreaterThan(0);
      expect(gameState.scoreMultiplier).toBe(2);
    });

    test("timer expiration resets powerups", () => {
      gameState.applyPowerup(constants.POWERUP_TYPES.SCORE_MULTIPLIER);
      gameState.multiplierTimer = 1;
      gameState.updateTimers(1);
      
      expect(gameState.scoreMultiplier).toBe(1);
    });

    test("enemy kills add bonus points", () => {
      gameState.score = 5;
      gameState.scoreMultiplier = 2;
      gameState.playerBullets.push({ x: 100, y: 100, radius: 5 });
      gameState.enemies.push({ x: 100, y: 100, radius: 12, health: 1 });
      
      gameState.checkCombatCollisions();
      
      expect(gameState.score).toBe(9);
    });
  });

  describe("Combat scenarios", () => {
    test("multishot fires 3 bullets in spread pattern", () => {
      gameState.multishotTimer = 1000;
      gameState.lastBulletFire = 0;
      gameState.bird.x = 80;
      gameState.bird.y = 300;
      
      gameState.fireBullet(500);
      
      expect(gameState.playerBullets.length).toBe(3);
      expect(gameState.playerBullets[0].vy).toBeLessThan(0);
      expect(gameState.playerBullets[1].vy).toBe(0);
      expect(gameState.playerBullets[2].vy).toBeGreaterThan(0);
    });

    test("invincibility prevents damage", () => {
      gameState.invincibilityTimer = 500;
      gameState.bird.x = 80;
      gameState.bird.y = 300;
      gameState.enemyBullets.push({ x: 80, y: 300, radius: 5 });
      const initialHealth = gameState.playerHealth;
      
      gameState.checkCombatCollisions();
      
      expect(gameState.playerHealth).toBe(initialHealth);
    });

    test("powerup spawns and collects correctly", () => {
      gameState.bird.x = 80;
      gameState.bird.y = 300;
      gameState.powerups.push({ x: 80, y: 300, radius: 10, type: 0 });
      
      gameState.checkCombatCollisions();
      
      expect(gameState.powerups.length).toBe(0);
      expect(gameState.invincibilityTimer).toBe(constants.INVINCIBILITY_DURATION);
    });
  });

  describe("Edge cases", () => {
    test("handles multiple enemies and bullets", () => {
      for (let i = 0; i < 5; i++) {
        gameState.enemies.push({ x: 100 + i * 20, y: 100 + i * 20, radius: 12, health: 1 });
      }
      for (let i = 0; i < 3; i++) {
        gameState.playerBullets.push({ x: 50 + i * 30, y: 100, radius: 5 });
      }
      
      gameState.checkCombatCollisions();
      
      expect(gameState.enemies.length).toBeLessThan(5);
    });

    test("ground collision at exact boundary", () => {
      gameState.bird.y = constants.GROUND_Y - constants.BIRD_RADIUS - 0.01;
      expect(gameState.checkCollision()).toBe(false);
      
      gameState.bird.y = constants.GROUND_Y - constants.BIRD_RADIUS + 0.1;
      expect(gameState.checkCollision()).toBe(true);
    });
  });
});
