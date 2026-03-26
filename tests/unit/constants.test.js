"use strict";

const constants = require("../../src/constants");

describe("constants", () => {
  test("exports game dimensions", () => {
    expect(constants.GAME_WIDTH).toBe(400);
    expect(constants.GAME_HEIGHT).toBe(600);
  });

  test("exports bird properties", () => {
    expect(constants.BIRD_X).toBe(80);
    expect(constants.BIRD_RADIUS).toBe(15);
    expect(constants.GRAVITY).toBe(0.45);
    expect(constants.FLAP_STRENGTH).toBe(-7.5);
  });

  test("exports pipe properties", () => {
    expect(constants.PIPE_WIDTH).toBe(55);
    expect(constants.PIPE_SPAWN_INTERVAL).toBe(1600);
    expect(constants.PIPE_SPEED_BASE).toBe(2.5);
    expect(constants.GAP_SIZE_BASE).toBe(150);
    expect(constants.GAP_SIZE_MIN).toBe(100);
  });

  test("exports ground properties", () => {
    expect(constants.GROUND_HEIGHT).toBe(60);
    expect(constants.GROUND_Y).toBe(540);
  });

  test("exports combat constants", () => {
    expect(constants.PLAYER_MAX_HEALTH).toBe(3);
    expect(constants.BULLET_SPEED).toBe(12);
    expect(constants.BULLET_RADIUS).toBe(5);
    expect(constants.BULLET_COOLDOWN).toBe(200);
  });

  test("exports enemy constants", () => {
    expect(constants.ENEMY_SPAWN_INTERVAL).toBe(3000);
    expect(constants.ENEMY_SPEED_BASE).toBe(1.5);
    expect(constants.ENEMY_BULLET_SPEED).toBe(4);
    expect(constants.ENEMY_FIRE_INTERVAL).toBe(1500);
    expect(constants.ENEMY_RADIUS).toBe(12);
  });

  test("exports powerup constants", () => {
    expect(constants.POWERUP_SPAWN_INTERVAL).toBe(8000);
    expect(constants.POWERUP_RADIUS).toBe(10);
    expect(constants.INVINCIBILITY_DURATION).toBe(3000);
    expect(constants.MULTISHOT_DURATION).toBe(5000);
    expect(constants.SCORE_MULTIPLIER_DURATION).toBe(10000);
  });

  test("exports powerup types", () => {
    expect(constants.POWERUP_TYPES.INVINCIBILITY).toBe(0);
    expect(constants.POWERUP_TYPES.MULTISHOT).toBe(1);
    expect(constants.POWERUP_TYPES.SCORE_MULTIPLIER).toBe(2);
  });

  test("exports game states", () => {
    expect(constants.STATE.READY).toBe(0);
    expect(constants.STATE.PLAYING).toBe(1);
    expect(constants.STATE.GAME_OVER).toBe(2);
  });

  test("exports all colors", () => {
    expect(constants.COLOR_SKY_TOP).toBe("#4ec0ca");
    expect(constants.COLOR_GROUND).toBe("#ded895");
    expect(constants.COLOR_PIPE).toBe("#73bf2e");
    expect(constants.COLOR_BIRD_BODY).toBe("#f5c842");
    expect(constants.COLOR_PLAYER_BULLET).toBe("#ffff00");
    expect(constants.COLOR_ENEMY).toBe("#e74c3c");
  });
});
