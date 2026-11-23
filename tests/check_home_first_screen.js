// T-0001: the home page's first screen must look like the template the site was
// built from (XevenTech/animated-portfolio-website): a centred "Hi, I'm <name>"
// greeting, the round avatar centred below it, the typed "I am into ..." line,
// then the round social icons, over the particles, with no scrolling.
//
// Runs real headless Chrome (CDP) at 1600x835, the size of Lam's screenshot, in
// two cases:
//   current  - the page with the assets the server sends now;
//   cached   - the same page, but assets/css/home.css is the file from before the
//              hero redesign (git show c45672f^:assets/css/home.css). Vercel sends
//              /assets/* as "immutable" for a year, so a browser that visited
//              before #7 keeps that file.
// Usage: node tests/check_home_first_screen.js [base-url]   (default http://127.0.0.1:8000/)
// Set SHOT_DIR=<dir> to also save current.png and cached.png there.
"use strict";
const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const BASE = process.argv[2] || "http://127.0.0.1:8000/";
const ROOT = path.join(__dirname, "..");
const WIDTH = 1600;
const HEIGHT = 835;
const OLD_HOME_CSS = execFileSync("git", ["show", "c45672f^:assets/css/home.css"], { cwd: ROOT });

function chromePath() {
  const candidates = [
    process.env.CHROME,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  const found = candidates.find((p) => p && fs.existsSync(p));
  if (!found) throw new Error("Chrome not found; set CHROME=<path>");
  return found;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "home-first-screen-"));
  const proc = spawn(chromePath(), [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    "about:blank",
  ], { stdio: "ignore" });
  const portFile = path.join(profile, "DevToolsActivePort");
  let port = "";
  for (let i = 0; i < 150 && !port; i++) {
    await sleep(100);
    try { port = fs.readFileSync(portFile, "utf8").split("\n")[0].trim(); } catch (_) {} // not written yet
  }
  if (!port) { proc.kill(); throw new Error("Chrome did not open a DevTools port"); }
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  const handlers = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
    } else if (msg.method) {
      handlers.forEach((h) => h(msg));
    }
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const n = ++id;
      pending.set(n, { res, rej });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const close = async () => {
    ws.close();
    proc.kill();
    await sleep(500);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {}
  };
  return { send, on: (h) => handlers.push(h), close };
}

// Runs in the page. Returns the boxes of the hero parts, or what is missing.
const MEASURE = `(() => {
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { top: r.top, bottom: r.bottom, cx: r.left + r.width / 2, w: r.width, h: r.height,
             radius: cs.borderTopLeftRadius, visible: cs.visibility !== "hidden" && cs.display !== "none" };
  };
  const norm = (s) => s.replace(/\\s+/g, " ").replace(/\\s+,/g, ",").trim();
  const h1 = document.querySelector("h1");
  const greeting = h1 && h1.parentElement;
  const into = document.evaluate("//*[starts-with(normalize-space(text()), 'I am into')]",
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  const canvas = document.querySelector("#particles-js canvas");
  return {
    vw: document.documentElement.clientWidth, vh: innerHeight, scrollY,
    h1Text: h1 ? norm(h1.textContent) : null,
    greetingText: greeting ? norm(greeting.textContent).slice(0, 40) : null,
    name: box(h1),
    avatar: box(document.querySelector("img[src*='avatar']")),
    into: box(into),
    linkedin: box(document.querySelector("a[href*='linkedin.com/in/lam-pham']")),
    github: box(document.querySelector("a[href='https://github.com/tlamDson']")),
    particles: box(canvas),
  };
})()`;

function verdict(m) {
  const errs = [];
  const onScreen = (k) => {
    const b = m[k];
    if (!b) return errs.push(`${k}: missing`), false;
    if (!b.visible || b.h === 0) return errs.push(`${k}: not visible`), false;
    if (b.top < 0 || b.bottom > m.vh) {
      errs.push(`${k}: top ${Math.round(b.top)} bottom ${Math.round(b.bottom)} is outside the first screen (0..${m.vh})`);
      return false;
    }
    return true;
  };
  const centred = (k) => {
    const off = Math.abs(m[k].cx - m.vw / 2);
    if (off > 30) errs.push(`${k}: centre is ${Math.round(off)}px from the middle of the screen`);
  };
  if (!/^Hi\b.*I'm Liam Pham/.test(m.greetingText || ""))
    errs.push(`greeting: must read "Hi ..., I'm Liam Pham", got ${JSON.stringify(m.greetingText)}`);
  if (m.h1Text !== "Liam Pham") errs.push(`name: h1 must be "Liam Pham", got ${JSON.stringify(m.h1Text)}`);
  const ok = {};
  for (const k of ["name", "avatar", "into", "linkedin", "github"]) ok[k] = onScreen(k);
  for (const k of ["avatar", "into"]) if (ok[k]) centred(k);
  if (ok.linkedin && ok.github) {
    const mid = (m.linkedin.cx + m.github.cx) / 2;
    if (Math.abs(mid - m.vw / 2) > 30) errs.push(`icons: row centre is ${Math.round(Math.abs(mid - m.vw / 2))}px off the middle`);
  }
  if (ok.avatar && m.avatar.radius !== "50%") errs.push(`avatar: must be round, border-radius ${m.avatar.radius}`);
  for (const k of ["linkedin", "github"]) if (ok[k] && m[k].radius !== "50%") errs.push(`${k}: icon must be round, border-radius ${m[k].radius}`);
  const order = ["name", "avatar", "into", "linkedin"];
  for (let i = 1; i < order.length; i++) {
    const a = m[order[i - 1]], b = m[order[i]];
    if (ok[order[i - 1]] && ok[order[i]] && b.top < a.bottom - 2)
      errs.push(`order: ${order[i]} (top ${Math.round(b.top)}) must be below ${order[i - 1]} (bottom ${Math.round(a.bottom)})`);
  }
  if (!m.particles || m.particles.top > 0 || m.particles.bottom < m.vh)
    errs.push("particles: the canvas must fill the first screen");
  return errs;
}

async function run(name, staleCss) {
  const b = await launch();
  try {
    await b.send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
    if (staleCss) {
      await b.send("Fetch.enable", { patterns: [{ urlPattern: "*/assets/css/home.css*" }] });
      b.on((msg) => {
        if (msg.method !== "Fetch.requestPaused") return;
        b.send("Fetch.fulfillRequest", {
          requestId: msg.params.requestId,
          responseCode: 200,
          responseHeaders: [{ name: "Content-Type", value: "text/css" }],
          body: OLD_HOME_CSS.toString("base64"),
        });
      });
    }
    await b.send("Page.enable");
    const loaded = new Promise((res) => b.on((msg) => msg.method === "Page.loadEventFired" && res()));
    await b.send("Page.navigate", { url: BASE });
    await Promise.race([loaded, sleep(15000)]);
    await sleep(2500); // preloader fade and the first typed word
    const { result } = await b.send("Runtime.evaluate", { expression: MEASURE, returnByValue: true });
    const m = result.value;
    if (process.env.SHOT_DIR) {
      const shot = await b.send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.join(process.env.SHOT_DIR, `${staleCss ? "cached" : "current"}.png`), Buffer.from(shot.data, "base64"));
    }
    const errs = verdict(m);
    const pos = (k) => (m[k] ? Math.round(m[k].top) : "-");
    console.log(`${name}: ${WIDTH}x${m.vh} scrollY=${m.scrollY} name=${pos("name")} avatar=${pos("avatar")} into=${pos("into")} icons=${pos("linkedin")}`);
    errs.forEach((e) => console.log(`  FAIL ${e}`));
    return errs.length === 0;
  } finally {
    await b.close();
  }
}

(async () => {
  const results = [await run("current", false), await run("cached pre-#7 home.css", true)];
  if (results.every(Boolean)) {
    console.log("home first screen: ok");
  } else {
    process.exit(1);
  }
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
