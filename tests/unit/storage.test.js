"use strict";

const storage = require("../../src/storage");

describe("storage", () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = {
      _data: {},
      getItem: function(key) {
        return this._data[key] !== undefined ? this._data[key] : null;
      },
      setItem: function(key, value) {
        this._data[key] = value;
      },
      removeItem: function(key) {
        delete this._data[key];
      }
    };
  });

  describe("loadHighScore", () => {
    test("loads high score from storage", () => {
      mockStorage._data[storage.HIGH_SCORE_KEY] = "100";
      expect(storage.loadHighScore(mockStorage)).toBe(100);
    });

    test("returns 0 when no high score", () => {
      expect(storage.loadHighScore(mockStorage)).toBe(0);
    });

    test("returns 0 for invalid data", () => {
      mockStorage._data[storage.HIGH_SCORE_KEY] = "abc";
      expect(storage.loadHighScore(mockStorage)).toBe(0);
    });

    test("returns 0 when storage is null", () => {
      expect(storage.loadHighScore(null)).toBe(0);
    });

    test("returns 0 when storage throws", () => {
      const throwingStorage = {
        getItem: () => { throw new Error("Storage disabled"); }
      };
      expect(storage.loadHighScore(throwingStorage)).toBe(0);
    });
  });

  describe("saveHighScore", () => {
    test("saves high score to storage", () => {
      storage.saveHighScore(150, mockStorage);
      expect(mockStorage._data[storage.HIGH_SCORE_KEY]).toBe(150);
    });

    test("does nothing when storage is null", () => {
      expect(() => storage.saveHighScore(150, null)).not.toThrow();
    });

    test("does nothing when storage throws", () => {
      const throwingStorage = {
        setItem: () => { throw new Error("Storage disabled"); }
      };
      expect(() => storage.saveHighScore(150, throwingStorage)).not.toThrow();
    });
  });

  describe("clearHighScore", () => {
    test("removes high score from storage", () => {
      mockStorage._data[storage.HIGH_SCORE_KEY] = "100";
      storage.clearHighScore(mockStorage);
      expect(mockStorage._data[storage.HIGH_SCORE_KEY]).toBeUndefined();
    });
  });

  describe("HIGH_SCORE_KEY", () => {
    test("exports correct key", () => {
      expect(storage.HIGH_SCORE_KEY).toBe("flappyHighScore");
    });
  });
});
