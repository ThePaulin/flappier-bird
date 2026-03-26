"use strict";

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function distance(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

function distanceSquared(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function normalize(value, min, max) {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function sign(value) {
  if (value > 0) return 1;
  if (value < 0) return -1;
  return 0;
}

module.exports = {
  clamp,
  distance,
  distanceSquared,
  lerp,
  normalize,
  randomRange,
  randomInt,
  randomChoice,
  sign
};
