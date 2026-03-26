"use strict";

const { clamp } = require("./math");

function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < cr * cr;
}

function circleCircleCollision(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const dist = dx * dx + dy * dy;
  const radii = r1 + r2;
  return dist < radii * radii;
}

function rectRectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

function pointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function pointInCircle(px, py, cx, cy, cr) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy < cr * cr;
}

module.exports = {
  circleRectCollision,
  circleCircleCollision,
  rectRectCollision,
  pointInRect,
  pointInCircle
};
