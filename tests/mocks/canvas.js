"use strict";

class MockCanvas2D {
  constructor(width = 400, height = 600) {
    this.width = width;
    this.height = height;
    this._calls = [];
    this._style = {};
    this._context = null;
  }

  getContext(type) {
    if (type === "2d") {
      this._context = new MockContext2D(this);
      return this._context;
    }
    return null;
  }

  getBoundingClientRect() {
    return {
      left: 0,
      top: 0,
      width: this.width,
      height: this.height
    };
  }

  addEventListener(event, handler) {
    this._eventHandlers = this._eventHandlers || {};
    this._eventHandlers[event] = handler;
  }

  dispatchEvent(event) {
    if (this._eventHandlers && this._eventHandlers[event.type]) {
      this._eventHandlers[event.type](event);
    }
  }

  get calls() {
    return this._calls;
  }

  clearCalls() {
    this._calls = [];
  }
}

class MockContext2D {
  constructor(canvas) {
    this.canvas = canvas;
    this._stack = [];
    this._state = this._createState();
    this._font = "10px sans-serif";
    this._textAlign = "left";
    this._textBaseline = "alphabetic";
    this._lineWidth = 1;
    this._fillStyle = "#000000";
    this._strokeStyle = "#000000";
  }

  _createState() {
    return {
      font: this._font,
      textAlign: this._textAlign,
      textBaseline: this._textBaseline,
      lineWidth: this._lineWidth,
      fillStyle: this._fillStyle,
      strokeStyle: this._strokeStyle,
      transform: [1, 0, 0, 1, 0, 0],
      translate: [0, 0],
      scale: [1, 1]
    };
  }

  save() {
    this._stack.push({ ...this._state });
  }

  restore() {
    if (this._stack.length > 0) {
      this._state = this._stack.pop();
    }
  }

  translate(x, y) {
    this._state.translate = [x, y];
  }

  scale(x, y) {
    this._state.scale = [x, y];
  }

  rotate(angle) {
    // Simplified - just store the angle
  }

  get font() {
    return this._font;
  }

  set font(value) {
    this._font = value;
    this._state.font = value;
  }

  get textAlign() {
    return this._textAlign;
  }

  set textAlign(value) {
    this._textAlign = value;
    this._state.textAlign = value;
  }

  get textBaseline() {
    return this._textBaseline;
  }

  set textBaseline(value) {
    this._textBaseline = value;
    this._state.textBaseline = value;
  }

  get lineWidth() {
    return this._lineWidth;
  }

  set lineWidth(value) {
    this._lineWidth = value;
    this._state.lineWidth = value;
  }

  get fillStyle() {
    return this._fillStyle;
  }

  set fillStyle(value) {
    this._fillStyle = value;
    this._state.fillStyle = value;
  }

  get strokeStyle() {
    return this._strokeStyle;
  }

  set strokeStyle(value) {
    this._strokeStyle = value;
    this._state.strokeStyle = value;
  }

  createLinearGradient(x0, y0, x1, y1) {
    return {
      addColorStop: jest.fn()
    };
  }

  beginPath() {
    this.canvas._calls.push({ method: "beginPath" });
  }

  moveTo(x, y) {
    this.canvas._calls.push({ method: "moveTo", x, y });
  }

  lineTo(x, y) {
    this.canvas._calls.push({ method: "lineTo", x, y });
  }

  quadraticCurveTo(cpx, cpy, x, y) {
    this.canvas._calls.push({ method: "quadraticCurveTo", cpx, cpy, x, y });
  }

  bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
    this.canvas._calls.push({ method: "bezierCurveTo", cp1x, cp1y, cp2x, cp2y, x, y });
  }

  arc(x, y, radius, startAngle, endAngle, anticlockwise) {
    this.canvas._calls.push({ method: "arc", x, y, radius, startAngle, endAngle, anticlockwise });
  }

  ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
    this.canvas._calls.push({ method: "ellipse", x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise });
  }

  fill() {
    this.canvas._calls.push({ method: "fill", fillStyle: this._fillStyle });
  }

  stroke() {
    this.canvas._calls.push({ method: "stroke", strokeStyle: this._strokeStyle, lineWidth: this._lineWidth });
  }

  fillRect(x, y, width, height) {
    this.canvas._calls.push({ method: "fillRect", x, y, width, height, fillStyle: this._fillStyle });
  }

  strokeRect(x, y, width, height) {
    this.canvas._calls.push({ method: "strokeRect", x, y, width, height, strokeStyle: this._strokeStyle, lineWidth: this._lineWidth });
  }

  fillText(text, x, y) {
    this.canvas._calls.push({ method: "fillText", text, x, y, font: this._font, textAlign: this._textAlign });
  }

  strokeText(text, x, y) {
    this.canvas._calls.push({ method: "strokeText", text, x, y, font: this._font, textAlign: this._textAlign });
  }

  measureText(text) {
    return { width: text.length * 8 };
  }

  clearRect(x, y, width, height) {
    this.canvas._calls.push({ method: "clearRect", x, y, width, height });
  }

  closePath() {
    this.canvas._calls.push({ method: "closePath" });
  }
}

function createMockDocument() {
  const elements = {};

  return {
    getElementById: (id) => {
      if (!elements[id]) {
        elements[id] = new MockCanvas2D();
      }
      return elements[id];
    },
    _elements: elements
  };
}

function createMockLocalStorage(initialData = {}) {
  let data = { ...initialData };
  
  return {
    getItem: (key) => {
      return data[key] !== undefined ? data[key] : null;
    },
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
    clear: () => {
      data = {};
    },
    _getData: () => data,
    _setData: (newData) => { data = { ...newData }; }
  };
}

module.exports = { MockCanvas2D, MockContext2D, createMockDocument, createMockLocalStorage };
