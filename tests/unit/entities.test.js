"use strict";

const entities = require("../../src/entities");
const constants = require("../../src/constants");

describe("entities", () => {
  describe("createBird", () => {
    test("creates bird with correct initial properties", () => {
      const bird = entities.createBird();
      
      expect(bird.x).toBe(constants.BIRD_X);
      expect(bird.y).toBe(constants.GAME_HEIGHT / 2 - 30);
      expect(bird.vy).toBe(0);
      expect(bird.rotation).toBe(0);
      expect(bird.flapFrame).toBe(0);
    });
  });

  describe("createPipe", () => {
    test("creates pipe with correct structure", () => {
      const pipe = entities.createPipe(150);
      
      expect(pipe.x).toBe(constants.GAME_WIDTH + constants.PIPE_WIDTH);
      expect(pipe.topHeight).toBeDefined();
      expect(pipe.bottomY).toBeDefined();
      expect(pipe.scored).toBe(false);
    });

    test("respects gap override", () => {
      const pipe = entities.createPipe(120);
      
      expect(pipe.bottomY).toBe(pipe.topHeight + 120);
    });
  });

  describe("createPlayerBullet", () => {
    test("creates bullet with correct velocity", () => {
      const bullet = entities.createPlayerBullet(100, 200, 0);
      
      expect(bullet.x).toBe(100);
      expect(bullet.y).toBe(200);
      expect(bullet.vx).toBe(constants.BULLET_SPEED);
      expect(bullet.radius).toBe(constants.BULLET_RADIUS);
    });

    test("applies spread correctly", () => {
      const bullet = entities.createPlayerBullet(100, 200, 0.5);
      
      expect(bullet.vy).toBe(0.5 * constants.BULLET_SPEED * 0.3);
    });
  });

  describe("createEnemyBullet", () => {
    test("creates bullet aiming at target", () => {
      const bullet = entities.createEnemyBullet(100, 200, 200, 200);
      
      expect(bullet.x).toBe(100);
      expect(bullet.y).toBe(200);
      expect(bullet.vx).toBeGreaterThan(0);
      expect(bullet.vy).toBeCloseTo(0);
    });

    test("has correct radius", () => {
      const bullet = entities.createEnemyBullet(0, 0, 10, 10);
      
      expect(bullet.radius).toBe(constants.BULLET_RADIUS);
    });
  });

  describe("createEnemy", () => {
    test("creates enemy with correct properties", () => {
      const enemy = entities.createEnemy();
      
      expect(enemy.x).toBe(constants.GAME_WIDTH + constants.ENEMY_RADIUS);
      expect(enemy.y).toBeGreaterThanOrEqual(60);
      expect(enemy.y).toBeLessThanOrEqual(constants.GROUND_Y - 60);
      expect(enemy.radius).toBe(constants.ENEMY_RADIUS);
      expect(enemy.health).toBe(1);
      expect(enemy.lastFire).toBe(0);
      expect(enemy.fireDelay).toBeDefined();
    });
  });

  describe("createPowerup", () => {
    test("creates powerup with random type", () => {
      const powerup = entities.createPowerup();
      
      expect(powerup.x).toBe(constants.GAME_WIDTH + constants.POWERUP_RADIUS);
      expect(powerup.y).toBeGreaterThanOrEqual(60);
      expect(powerup.y).toBeLessThanOrEqual(constants.GROUND_Y - 60);
      expect(powerup.radius).toBe(constants.POWERUP_RADIUS);
      expect(powerup.type).toBeGreaterThanOrEqual(0);
      expect(powerup.type).toBeLessThan(3);
      expect(powerup.pulseTimer).toBe(0);
    });
  });

  describe("createGameState", () => {
    test("creates complete game state", () => {
      const state = entities.createGameState();
      
      expect(state.bird).toBeDefined();
      expect(state.pipes).toEqual([]);
      expect(state.playerBullets).toEqual([]);
      expect(state.enemies).toEqual([]);
      expect(state.enemyBullets).toEqual([]);
      expect(state.powerups).toEqual([]);
      expect(state.score).toBe(0);
      expect(state.playerHealth).toBe(constants.PLAYER_MAX_HEALTH);
      expect(state.gameState).toBe(constants.STATE.READY);
    });
  });

  describe("currentGap", () => {
    test("returns base gap", () => {
      expect(entities.currentGap()).toBe(constants.GAP_SIZE_BASE);
    });
  });

  describe("currentEnemySpeed", () => {
    test("returns base enemy speed", () => {
      expect(entities.currentEnemySpeed()).toBe(constants.ENEMY_SPEED_BASE);
    });
  });
});
