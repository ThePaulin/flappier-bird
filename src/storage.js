"use strict";

const HIGH_SCORE_KEY = "flappyHighScore";

function loadHighScore(storage = global.localStorage) {
  try {
    if (!storage) return 0;
    return parseInt(storage.getItem(HIGH_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(val, storage = global.localStorage) {
  try {
    if (!storage) return;
    storage.setItem(HIGH_SCORE_KEY, val);
  } catch {
    // ignore
  }
}

function clearHighScore(storage = global.localStorage) {
  try {
    if (!storage) return;
    storage.removeItem(HIGH_SCORE_KEY);
  } catch {
    // ignore
  }
}

module.exports = {
  loadHighScore,
  saveHighScore,
  clearHighScore,
  HIGH_SCORE_KEY
};
