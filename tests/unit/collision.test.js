"use strict";

const collision = require("../../src/collision");

describe("collision", () => {
  describe("circleRectCollision", () => {
    test("detects collision when circle inside rect", () => {
      expect(collision.circleRectCollision(50, 50, 10, 0, 0, 100, 100)).toBe(true);
    });

    test("detects collision when circle touches rect edge", () => {
      expect(collision.circleRectCollision(10, 50, 10, 0, 0, 20, 100)).toBe(true);
    });

    test("returns false when circle outside rect", () => {
      expect(collision.circleRectCollision(50, 50, 5, 0, 0, 10, 10)).toBe(false);
    });

    test("detects collision at rect corner", () => {
      expect(collision.circleRectCollision(10, 10, 10, 0, 0, 20, 20)).toBe(true);
    });

    test("handles negative coordinates", () => {
      expect(collision.circleRectCollision(-5, -5, 10, -20, -20, 30, 30)).toBe(true);
    });
  });

  describe("circleCircleCollision", () => {
    test("detects collision when circles overlap", () => {
      expect(collision.circleCircleCollision(0, 0, 10, 15, 0, 10)).toBe(true);
    });

    test("detects collision when circles just touch", () => {
      expect(collision.circleCircleCollision(0, 0, 10, 19, 0, 10)).toBe(true);
    });

    test("returns false when circles don't touch", () => {
      expect(collision.circleCircleCollision(0, 0, 10, 30, 0, 10)).toBe(false);
    });

    test("detects collision with same center", () => {
      expect(collision.circleCircleCollision(50, 50, 10, 50, 50, 10)).toBe(true);
    });
  });

  describe("rectRectCollision", () => {
    test("detects collision when rects overlap", () => {
      expect(collision.rectRectCollision(0, 0, 10, 10, 5, 5, 10, 10)).toBe(true);
    });

    test("returns false when rects don't overlap", () => {
      expect(collision.rectRectCollision(0, 0, 10, 10, 20, 20, 10, 10)).toBe(false);
    });

    test("detects collision when rects share edge", () => {
      expect(collision.rectRectCollision(0, 0, 10, 10, 9, 0, 10, 10)).toBe(true);
    });

    test("handles negative coordinates", () => {
      expect(collision.rectRectCollision(-10, -10, 10, 10, -5, -5, 10, 10)).toBe(true);
    });
  });

  describe("pointInRect", () => {
    test("returns true when point inside rect", () => {
      expect(collision.pointInRect(50, 50, 0, 0, 100, 100)).toBe(true);
    });

    test("returns false when point outside rect", () => {
      expect(collision.pointInRect(150, 50, 0, 0, 100, 100)).toBe(false);
    });

    test("returns true when point on rect edge", () => {
      expect(collision.pointInRect(0, 50, 0, 0, 100, 100)).toBe(true);
    });
  });

  describe("pointInCircle", () => {
    test("returns true when point inside circle", () => {
      expect(collision.pointInCircle(50, 50, 50, 50, 10)).toBe(true);
    });

    test("returns false when point outside circle", () => {
      expect(collision.pointInCircle(100, 50, 50, 50, 10)).toBe(false);
    });

    test("returns true when point on circle edge", () => {
      expect(collision.pointInCircle(59, 50, 50, 50, 10)).toBe(true);
    });
  });
});
