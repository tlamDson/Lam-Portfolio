// Preloader dismissal regression check (B13). Runs the real assets/js/app.js
// against a stub DOM with no jQuery effects (like jQuery slim on research.html),
// fires window "load", and checks the loader is gone within 200 ms.
// Usage: node tests/check_preloader.js
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "app.js"), "utf8");

function el() {
  const node = {
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    checked: false,
    value: "",
    appendChild() {},
    addEventListener() {},
    setAttribute() {},
    getAttribute: () => null,
    querySelector: () => el(),
    querySelectorAll: () => [],
  };
  return node;
}

const loader = el();
const listeners = {};
let now = 0;
const timers = [];

// A jQuery stand-in with no effects: any $(...) call returns a chainable stub,
// $(fn) never runs fn (ready handlers are not under test).
const chain = new Proxy(function () {}, {
  get: (t, k) => (k === "length" ? 0 : () => chain),
  apply: () => chain,
});
const $ = new Proxy(function () {}, {
  apply: () => chain,
  get: () => () => chain,
});

const document = {
  body: el(),
  documentElement: el(),
  createElement: () => el(),
  getElementById: () => el(),
  getElementsByClassName: () => [],
  getElementsByTagName: () => [],
  querySelectorAll: () => [],
  querySelector: (sel) => (sel === ".loader-container" ? loader : el()),
  addEventListener() {},
};
const store = {};
const window = {
  addEventListener: (type, fn) => (listeners[type] = listeners[type] || []).push(fn),
  matchMedia: () => ({ matches: false, addListener() {}, addEventListener() {} }),
  scrollY: 0,
  innerWidth: 400,
  location: { href: "", pathname: "/research.html" },
};
const ctx = {
  window,
  document,
  $,
  jQuery: $,
  console,
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => (store[k] = String(v)),
  },
  setTimeout: (fn, ms) => timers.push({ fn, at: now + (ms || 0) }),
  setInterval: () => 0,
  clearTimeout() {},
  navigator: { userAgent: "node" },
};
window.document = document;
ctx.self = window;

try {
  vm.runInNewContext(src, ctx, { filename: "app.js" });
} catch (e) {
  // Code after the loader handler may need a fuller DOM; the handler is
  // registered only if app.js got that far, which is checked below.
  console.log("note: app.js stopped early in the stub DOM: " + e.message);
}

const fail = (msg) => {
  console.log("FAIL: " + msg);
  process.exit(1);
};

const onLoad = listeners.load || [];
if (!onLoad.length) fail("app.js registers no window load handler");
for (const fn of onLoad) {
  try {
    fn();
  } catch (e) {
    // Other load handlers may touch parts of the stub DOM; only the loader matters.
  }
}
if (loader.style.display === "none") {
  console.log("OK: preloader hidden immediately on load");
  process.exit(0);
}
// Run timers up to 200 ms after load.
timers.sort((a, b) => a.at - b.at);
for (const t of timers) {
  if (t.at > 200) break;
  now = t.at;
  t.fn();
}
if (loader.style.display !== "none") {
  fail("the preloader is still on screen 200 ms after window load");
}
console.log("OK: preloader hidden " + now + " ms after window load, without jQuery effects");
