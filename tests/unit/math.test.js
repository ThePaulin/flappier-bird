"use strict";

const math = require("../../src/math");

describe("math", () => {
  describe("clamp", () => {
    test("returns value when within range", () => {
      expect(math.clamp(5, 0, 10)).toBe(5);
    });

    test("returns min when value below range", () => {
      expect(math.clamp(-5, 0, 10)).toBe(0);
    });

    test("returns max when value above range", () => {
      expect(math.clamp(15, 0, 10)).toBe(10);
    });

    test("handles edge cases", () => {
      expect(math.clamp(0, 0, 10)).toBe(0);
      expect(math.clamp(10, 0, 10)).toBe(10);
    });
  });

  describe("distance", () => {
    test("calculates correct distance between points", () => {
      expect(math.distance(0, 0, 3, 4)).toBe(5);
    });

    test("returns 0 for same point", () => {
      expect(math.distance(5, 5, 5, 5)).toBe(0);
    });

    test("handles negative coordinates", () => {
      expect(math.distance(-3, -3, 0, 0)).toBeCloseTo(4.24, 1);
    });
  });

  describe("distanceSquared", () => {
    test("calculates correct squared distance", () => {
      expect(math.distanceSquared(0, 0, 3, 4)).toBe(25);
    });

    test("is faster than distance (no sqrt)", () => {
      expect(math.distanceSquared(0, 0, 10, 10)).toBe(200);
    });
  });

  describe("lerp", () => {
    test("interpolates linearly", () => {
      expect(math.lerp(0, 10, 0.5)).toBe(5);
    });

    test("returns start at t=0", () => {
      expect(math.lerp(5, 10, 0)).toBe(5);
    });

    test("returns end at t=1", () => {
      expect(math.lerp(5, 10, 1)).toBe(10);
    });

    test("extrapolates beyond range", () => {
      expect(math.lerp(0, 10, 1.5)).toBe(15);
    });
  });

  describe("normalize", () => {
    test("normalizes value to 0-1 range", () => {
      expect(math.normalize(5, 0, 10)).toBe(0.5);
    });

    test("returns 0 when value equals min", () => {
      expect(math.normalize(0, 0, 10)).toBe(0);
    });

    test("returns 1 when value equals max", () => {
      expect(math.normalize(10, 0, 10)).toBe(1);
    });

    test("returns 0 when min equals max", () => {
      expect(math.normalize(5, 5, 5)).toBe(0);
    });
  });

  describe("randomRange", () => {
    test("returns value within range", () => {
      for (let i = 0; i < 100; i++) {
        const result = math.randomRange(5, 10);
        expect(result).toBeGreaterThanOrEqual(5);
        expect(result).toBeLessThan(10);
      }
    });
  });

  describe("randomInt", () => {
    test("returns integer within range", () => {
      for (let i = 0; i < 100; i++) {
        const result = math.randomInt(5, 10);
        expect(Number.isInteger(result)).toBe(true);
        expect(result).toBeGreaterThanOrEqual(5);
        expect(result).toBeLessThanOrEqual(10);
      }
    });
  });

  describe("randomChoice", () => {
    test("returns one of the array elements", () => {
      const arr = [1, 2, 3];
      const result = math.randomChoice(arr);
      expect(arr).toContain(result);
    });
  });

  describe("sign", () => {
    test("returns 1 for positive", () => {
      expect(math.sign(5)).toBe(1);
    });

    test("returns -1 for negative", () => {
      expect(math.sign(-5)).toBe(-1);
    });

    test("returns 0 for zero", () => {
      expect(math.sign(0)).toBe(0);
    });
  });
});
