"use strict";

const { GameState } = require("../../src/gameState");
const constants = require("../../src/constants");

describe("Performance Tests", () => {
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
  });

  test("handles many pipes (50+) without performance degradation", () => {
    gameState = new GameState({ storage: mockStorage });
    
    for (let i = 0; i < 50; i++) {
      gameState.pipes.push({
        x: 400 + i * 60,
        topHeight: 150 + Math.random() * 100,
        bottomY: 300 + Math.random() * 100,
        scored: false
      });
    }
    
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      gameState.updatePipes(1);
    }
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100);
  });

  test("handles many bullets (100+) efficiently", () => {
    gameState = new GameState({ storage: mockStorage });
    
    for (let i = 0; i < 100; i++) {
      gameState.playerBullets.push({
        x: Math.random() * 400,
        y: Math.random() * 600,
        vx: 12,
        vy: 0,
        radius: 5
      });
    }
    
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      gameState.updatePlayerBullets(1);
    }
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100);
  });

  test("handles many enemies (50+) without lag", () => {
    gameState = new GameState({ storage: mockStorage });
    
    for (let i = 0; i < 50; i++) {
      gameState.enemies.push({
        x: 400 + i * 30,
        y: 100 + Math.random() * 400,
        radius: 12,
        health: 1,
        lastFire: 0,
        fireDelay: 2000
      });
    }
    
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      gameState.updateEnemies(1, i * 100);
    }
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(200);
  });

  test("collision detection scales linearly", () => {
    gameState = new GameState({ storage: mockStorage });
    
    for (let i = 0; i < 20; i++) {
      gameState.pipes.push({
        x: 100 + i * 60,
        topHeight: 150,
        bottomY: 300,
        scored: false
      });
    }
    gameState.bird.x = 200;
    gameState.bird.y = 200;
    
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      gameState.checkCollision();
    }
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(500);
  });

  test("memory usage stays stable with continuous spawning", () => {
    gameState = new GameState({ storage: mockStorage });
    
    let initialLength = 0;
    for (let i = 0; i < 1000; i++) {
      gameState.spawnPipe(i * 1600);
      gameState.spawnEnemy(i * 3000);
      gameState.spawnPowerup(i * 8000);
      
      gameState.updatePipes(1);
      gameState.updateEnemies(1, i);
      gameState.updatePowerups(1);
      
      if (i === 0) initialLength = gameState.pipes.length + gameState.enemies.length + gameState.powerups.length;
    }
    
    const totalEntities = gameState.pipes.length + gameState.enemies.length + gameState.powerups.length;
    expect(totalEntities).toBeLessThan(100);
  });

  test("timer updates are efficient", () => {
    gameState = new GameState({ storage: mockStorage });
    gameState.invincibilityTimer = 1000;
    gameState.multishotTimer = 1000;
    gameState.multiplierTimer = 1000;
    
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      gameState.updateTimers(1);
    }
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100);
  });

  test("bulk bullet-enemy collision check remains fast", () => {
    gameState = new GameState({ storage: mockStorage });
    
    for (let i = 0; i < 30; i++) {
      gameState.playerBullets.push({
        x: 50 + i * 10,
        y: 100 + i * 5,
        radius: 5
      });
    }
    for (let i = 0; i < 30; i++) {
      gameState.enemies.push({
        x: 100 + i * 10,
        y: 100 + i * 5,
        radius: 12,
        health: 1
      });
    }
    
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      gameState.checkCombatCollisions();
    }
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(200);
  });
});
