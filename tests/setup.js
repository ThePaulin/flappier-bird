"use strict";

global.performance = global.performance || {
  now: () => Date.now()
};

global.requestAnimationFrame = global.requestAnimationFrame || (cb => setTimeout(cb, 16));
global.cancelAnimationFrame = global.cancelAnimationFrame || (id => clearTimeout(id));

beforeAll(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});
